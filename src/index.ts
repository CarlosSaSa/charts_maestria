import express, { type Request, type Response } from "express";
import cors from "cors";
import path from 'path';
import { readFile } from "fs/promises"

// Crear instancia de express
const app = express();
const PORT = process.env.PORT ?? 3500;

// CORS
app.use( cors() );
app.use('/static', express.static( path.join( import.meta.dirname, 'public' ) ));

// Endpoints
app.get('/', (req: Request, res: Response) => {
    return res.json({ message: "Hello world" }).status(200);
});

// Fetch data from json, simulate a db
app.get('/data', async (req: Request, res: Response) => {

    // Build full path where are data
    const PATH_FILE = path.join( import.meta.dirname, 'data', 'demo.json' );
    const dataJson = await readFile( PATH_FILE, 'utf-8' ); // Read the file as JSO
    const dataMapped = JSON.parse( dataJson ); // Parse the string as javascript object
    return res.json( { "message": "Datos obtenidos correctamente", data: dataMapped } ).status(200);

});

// Iniciar servidor
app.listen( PORT,  () => {
    console.log(`Servidor en el puerto de: ${PORT} `);
})



