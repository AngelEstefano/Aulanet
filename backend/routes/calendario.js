import express from 'express';
import pool from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateEvento } from '../middleware/validaciones.js';
const router = express.Router();

// GET /api/calendario/eventos - Obtener eventos del calendario
router.get('/eventos', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await pool.query(`
      SELECT 
        evento_id,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        tipo_evento,
        color,
        clase_id
      FROM escuela.eventos_calendario
      WHERE (fecha_inicio BETWEEN $1 AND $2) 
         OR (fecha_fin BETWEEN $1 AND $2)
         OR (fecha_inicio <= $1 AND fecha_fin >= $2)
      ORDER BY fecha_inicio
    `, [startDate, endDate]);

    res.json({
      success: true,
      eventos: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/calendario/eventos - Crear nuevo evento
router.post('/eventos', authenticateToken, requireRole(['profesor', 'admin']), validateEvento, async (req, res) => {
  try {
    const { titulo, descripcion, fecha_inicio, fecha_fin, tipo_evento, color, clase_id } = req.body;
    
    const result = await pool.query(`
      INSERT INTO escuela.eventos_calendario 
        (titulo, descripcion, fecha_inicio, fecha_fin, tipo_evento, color, clase_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [titulo, descripcion, fecha_inicio, fecha_fin, tipo_evento, color, clase_id]);

    res.json({ 
      success: true, 
      evento: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;