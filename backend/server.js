import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { obtenerPartidosDeHoy, verificarConexion, cerrarConexion } from './db.js';
import { PORT, URL_FRONT, NODE_ENV } from './config.js';

const app = express();

// Middleware de seguridad
app.use(helmet());

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos'
  }
});
app.use(limiter);

// CORS configurado
app.use(cors({
  origin: NODE_ENV === 'production' ? URL_FRONT : true,
  methods: ['GET'],
  credentials: false
}));

// Ruta para obtener los partidos del día en formato JSON
app.get('/api/partidos', async (req, res) => {
  try {
    const partidos = await obtenerPartidosDeHoy();
    res.json(partidos);
  } catch (err) {
    console.error('Error al obtener partidos:', err.message);
    res.status(500).json({ 
      error: NODE_ENV === 'production' ? 'Error interno del servidor' : err.message 
    });
  }
});

// Ruta de salud para verificar que la API funciona
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: NODE_ENV === 'production' ? 'Error interno del servidor' : err.message 
  });
});

// Verificar conexión a la base de datos al iniciar
verificarConexion();

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`API corriendo en puerto: ${PORT}`);
  console.log(`Entorno: ${NODE_ENV}`);
  console.log(`CORS habilitado para: ${URL_FRONT}`);
});

// Manejo de cierre graceful
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Señal ${signal} recibida. Cerrando servidor...`);
  
  server.close(async () => {
    console.log('Servidor HTTP cerrado');
    await cerrarConexion();
    console.log('Proceso terminado correctamente');
    process.exit(0);
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('Forzando cierre del proceso');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rechazada no manejada en:', promise, 'razón:', reason);
  process.exit(1);
});