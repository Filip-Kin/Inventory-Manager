import express, { type Express, type Request, type Response } from "express";
import { json } from "body-parser";
import { checkin, checkout, connect, create, getInventory, move } from "./sheet.js";
import cors from 'cors';
import 'dotenv/config';

const app: Express = express();
const port = process.env.PORT || 3000;

connect();

app.use(cors());
app.use(json());

app.get('/inventory', async (req: Request, res: Response) => {
    console.log('get inventory');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(await getInventory());
});

app.post('/checkin/:tag', async (req: Request, res: Response) => {
    console.log('checkin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    await checkin(req.params.tag);
    res.send();
});

app.post('/checkout/:tag', async (req: Request, res: Response) => {
    console.log('checkout');
    res.setHeader('Access-Control-Allow-Origin', '*');
    await checkout(req.params.tag);
    res.send();
});

app.post('/create/:tag', async (req: Request, res: Response) => {
    console.log('create');
    res.setHeader('Access-Control-Allow-Origin', '*');
    await create(req.params.tag, req.body.make, req.body.model, req.body.description, req.body.value, req.body.serial, req.body.container, req.body.checkedOut, req.body.isContainer);
    res.send();
});

app.post('/move/:tag', async (req: Request, res: Response) => {
    console.log('move');
    res.setHeader('Access-Control-Allow-Origin', '*');
    await move(req.params.tag, req.body.container);
    res.send();
});

app.use('/', express.static('app/dist'));
app.use('/*', express.static('app/dist/index.html'));

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
