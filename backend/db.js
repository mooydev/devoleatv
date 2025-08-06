import pkg from 'pg';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from './config.js';
const { Pool } = pkg;

const pool = new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
});

export async function obtenerPartidosDeHoy() {
  const { rows } = await pool.query('SELECT * FROM partidos');
  return rows;
}
