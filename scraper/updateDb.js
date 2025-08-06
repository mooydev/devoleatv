import pkg from 'pg';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from './config.js';
import { scrapeRedCard } from './scraper.js';
const { Pool } = pkg;

const pool = new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
});

export async function guardarPartidos(eventos) {
  const client = await pool.connect();
  try {
    const fechaHoy = new Date().toISOString().split('T')[0];

    await client.query('BEGIN'); // Iniciar transacción

    // Limpia los partidos de hoy
    await client.query('DELETE FROM partidos');

    const insertQuery = `
      INSERT INTO partidos (fecha, torneo, hora, equipos, link)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const evento of eventos) {
      await client.query(insertQuery, [
        fechaHoy,
        evento.torneo,
        evento.hora,
        evento.equipos,
        evento.link
      ]);
    }

    await client.query('COMMIT');
    console.log(`Guardados ${eventos.length} partidos en la base de datos`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al guardar en la base de datos:', err.message);
  } finally {
    client.release();
  }
}

export async function updateDb() {
    try{
        const eventos = await scrapeRedCard()
        guardarPartidos(eventos)
    }catch(err){
        console.log("Error al actualizar la base de datos: " + err.message )
    }
}
