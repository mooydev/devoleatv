import express from 'express';
import cors from 'cors';
import {obtenerPartidosDeHoy } from './db.js';
import { PORT, URL_FRONT } from './config.js';

const app = express();

app.use(cors({
    origin: URL_FRONT
}));

// Ruta para obtener los partidos del día en formato JSON
app.get('/api/partidos', async (req, res) => {
  try {
    const partidos = await obtenerPartidosDeHoy();
    res.json(partidos);
  } catch (err) {
    console.error('Error al obtener partidos:', err.message);
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
});

app.listen(PORT, ()=> {
  console.log(`API corriendo en puerto: ${PORT}`);
});