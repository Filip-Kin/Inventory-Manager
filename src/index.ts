import express, { type Express, type Request, type Response } from "express";
import { json } from "body-parser";
import { connect, getInventory, updateInventory } from "./sheet.js";
import cors from 'cors';
import 'dotenv/config';

const app: Express = express();
const port = process.env.PORT || 3000;

connect();

app.use(cors())
app.use(json());

app.get('/inventory', async (req: Request, res: Response) => {
    console.log('get inventory');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(await getInventory());
});

app.post('/inventory', async (req: Request, res: Response) => {
    console.log('post inventory');
    updateInventory(req.body);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send('ok');
});

app.use('/', express.static('app/dist'));
app.use('/*', express.static('app/dist/index.html'));

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
