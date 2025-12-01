import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.js';
import clasesRoutes from './routes/clases.js';
import alumnosRoutes from './routes/alumnos.js';
import asistenciasRoutes from './routes/asistencias.js';
import calificacionesRoutes from './routes/calificaciones.js';
import tareasRoutes from './routes/tareas.js';
import reportesRoutes from './routes/reportes.js';
import calendarioRoutes from './routes/calendario.js';

import { testConnection } from './database/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting optimizado para muchos usuarios
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 requests por ventana
  message: {
    success: false,
    error: 'Demasiadas solicitudes, intenta más tarde'
  },
  skip: (req) => req.path === '/health' // No limitar health checks
});

// Middleware de seguridad y performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Para reportes PDF
}));
app.use(compression());
app.use(limiter);
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check mejorado
app.get('/health', async (req, res) => {
  const dbHealthy = await testConnection();
  
  res.status(dbHealthy ? 200 : 500).json({
    success: dbHealthy,
    message: dbHealthy ? 'Sistema funcionando correctamente' : 'Error en base de datos',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/calendario', calendarioRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  
  // Log detallado en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack trace:', error.stack);
  }
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  const dbHealthy = await testConnection();
  if (dbHealthy) {
    console.log('Base de datos conectada correctamente');
  } else {
    console.log('Error conectando a la base de datos');
  }
});

export default app;