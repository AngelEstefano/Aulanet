import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

// Configuración profesional para producción
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aulanet',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // Configuraciones para producción
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000, // cierra clientes después de 30s de inactividad
  connectionTimeoutMillis: 2000, // tiempo máximo para conectar
  maxUses: 7500, // cierra conexión después de 7500 consultas (previte memory leaks)
});

// Manejo de eventos del pool
pool.on('connect', () => {
  console.log('Conexión a PostgreSQL establecida');
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Función para verificar la conexión a la BD
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión a PostgreSQL verificada correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error.message);
    return false;
  }
};

// Función profesional para ejecutar queries con manejo de errores
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Query ejecutada en ${duration}ms:`, { 
      query: text.split(' ')[0], // Solo muestra el tipo (SELECT, INSERT, etc)
      rows: result.rowCount 
    });
    return result;
  } catch (error) {
    console.error('Error en query:', {
      query: text,
      params: params,
      error: error.message
    });
    throw error;
  }
};

// Exportar el pool para transacciones
export { pool };

export default {
  query,
  pool,
  testConnection
};