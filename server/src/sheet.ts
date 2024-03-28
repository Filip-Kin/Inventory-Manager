import { GoogleSpreadsheet, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import 'dotenv/config';

// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
const serviceAccountAuth = new JWT({
    // env var values here are copied from service account credentials generated by google
    // see "Authentication" section in docs for more info
    email: process.env.CLIENT_EMAIL,
    key: (process.env.API_KEY || "").replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet('1H1HFvtmn3etpeCkYZzNwoXOtvV06kXePIpEpo9WwqHc', serviceAccountAuth);

let invSheet: GoogleSpreadsheetWorksheet | undefined;
let connectPromise: Promise<boolean> | undefined;

type InventoryRowData = {
    tag: string;
    make: string;
    model: string;
    description: string;
    value: number;
    serial: string;
    container: string;
    checkedOut: boolean;
    isContainer: boolean;
}

export async function connect() {
    connectPromise = new Promise(async (resolve, reject) => {
        await doc.loadInfo(); // loads document properties and worksheets

        invSheet = doc.sheetsByIndex[0];
        invSheet.setHeaderRow(['tag', 'make', 'model', 'description', 'value', 'serial', 'container', 'checkedOut', 'isContainer']);
        resolve(true);
    });
}

export async function getInventory() {
    await connectPromise;
    if (invSheet) {
        const rows = await invSheet.getRows<InventoryRowData>();
        return rows.map(row => ({
            tag: row.get('tag'),
            make: row.get('make'),
            model: row.get('model'),
            description: row.get('description'),
            value: row.get('value'),
            serial: row.get('serial'),
            container: row.get('container'),
            checkedOut: row.get('checkedOut') == true,
            isContainer: row.get('isContainer') == true
        }));
    }
}

let currentlyUpdateing = false

export async function updateInventory(inventory: InventoryRowData[]) {
    if (currentlyUpdateing) return;
    currentlyUpdateing = true
    await connectPromise;
    if (!invSheet) throw new Error('Failed to connect to inventory sheet');
    const existingRows = await invSheet.getRows<InventoryRowData>();
    const existingRowsMap = new Map<string, GoogleSpreadsheetRow<InventoryRowData>>();

    existingRows.forEach(row => existingRowsMap.set(row.get('tag'), row));

    const updates: Promise<any>[] = [];

    inventory.forEach(item => {
        const existingRow = existingRowsMap.get(item.tag);

        if (existingRow) {
            if (existingRow?.get('make') !== item.make ||
                existingRow?.get('model') !== item.model ||
                existingRow?.get('description') !== item.description ||
                existingRow?.get('value') !== item.value ||
                existingRow?.get('serial') !== item.serial ||
                existingRow?.get('container') !== item.container ||
                (existingRow?.get('checkedOut') == true) !== item.checkedOut ||
                (existingRow?.get('isContainer') == true) !== item.isContainer) {
                console.log('Updating', item.tag);
                // Update existing row
                existingRow.set('make', item.make);
                existingRow.set('model', item.model);
                existingRow.set('description', item.description);
                existingRow.set('value', item.value);
                existingRow.set('serial', item.serial);
                existingRow.set('container', item.container);
                existingRow.set('checkedOut', item.checkedOut);
                existingRow.set('isContainer', item.isContainer);
                updates.push(existingRow.save());
            }
        } else {
            // Create new row
            let promise = invSheet?.addRow(item);
            if (promise) updates.push(promise);
        }
    });

    await Promise.all(updates);
    currentlyUpdateing = false;
}
