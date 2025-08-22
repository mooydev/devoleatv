import pkg from 'pg';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER, NODE_ENV } from './config.js';
const { Pool } = pkg;

const pool = new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
  // Configuraciones de seguridad y rendimiento
  max: 10, // máximo 10 conexiones simultáneas (suficiente para tu caso)
  idleTimeoutMillis: 30000, // cierra conexiones inactivas después de 30s
  connectionTimeoutMillis: 2000, // timeout de conexión 2s
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Manejo de eventos del pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err);
});

pool.on('connect', (client) => {
  if (NODE_ENV === 'development') {
    console.log('🔗 Nueva conexión establecida');
  }
});

export async function obtenerPartidosDeHoy() {
  const client = await pool.connect();
  try{
    const query = 'SELECT * FROM partidos';
    const { rows } = await client.query(query);

    return rows;
 } catch (error) {
    console.error('❌ Error al obtener partidos:', error);
    throw new Error('No se pudieron obtener los partidos');
  } finally {
    client.release(); // Importante: liberar la conexión
  }
}

// Función para verificar la conexión a la base de datos
export async function verificarConexion() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    console.error('   Verifica las variables de entorno de la BD');
    return false;
  }
}

// Función para cerrar el pool al terminar la aplicación
export async function cerrarConexion() {
  try {
    await pool.end();
    console.log('🔒 Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('❌ Error al cerrar el pool:', error);
  }
}

// Función adicional para obtener estadísticas del pool (opcional)
export function estadisticasPool() {
  return {
    totalConexiones: pool.totalCount,
    conexionesActivas: pool.totalCount - pool.idleCount,
    conexionesInactivas: pool.idleCount,
    conexionesEsperando: pool.waitingCount
  };
}
