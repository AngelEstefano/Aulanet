import express from "express";
import pool from "../database/db.js";
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateAsistencia, handleValidationErrors } from '../middleware/validaciones.js';

const router = express.Router();

// GET /api/asistencias/clase/:id - Obtener asistencias por clase y fecha (CORREGIDO)
router.post('/', authenticateToken, requireRole(['profesor', 'admin']), validateAsistencia, async (req, res) => {
  try {
    const { claseId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro fecha es requerido'
      });
    }

    const result = await pool.query(`
      SELECT
        a.asistencia_id, 
        a.inscripcion_id,
        a.estado_asistencia,
        a.participacion,
        a.comentarios,           
        e.nombre as estudiante_nombre,  
        e.codigo_estudiante
      FROM escuela.asistencias a
      JOIN escuela.inscripciones i ON a.inscripcion_id = i.inscripcion_id
      JOIN escuela.estudiantes e ON i.estudiante_id = e.estudiante_id
      WHERE i.clase_id = $1 AND a.fecha = $2
    `, [claseId, fecha]);

    res.json({
      success: true,
      asistencias: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// POST /api/asistencias - Guardar/actualizar asistencias (CORREGIDO)
router.post('/', authenticateToken, requireRole(['profesor', 'admin']), validateAsistencia, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const asistencias = req.body;

    for (const asistencia of asistencias) {
      // Verificar si ya existe una asistencia
      const existing = await client.query(
        'SELECT asistencia_id FROM escuela.asistencias WHERE inscripcion_id = $1 AND fecha = $2',
        [asistencia.inscripcion_id, asistencia.fecha]
      );

      if (existing.rows.length > 0) {
        // Actualizar existente
        await client.query(
          `UPDATE escuela.asistencias 
           SET estado_asistencia = $1, participacion = $2, comentarios = $3 
           WHERE inscripcion_id = $4 AND fecha = $5`,
          [asistencia.estado_asistencia, asistencia.participacion, asistencia.comentarios, 
           asistencia.inscripcion_id, asistencia.fecha]
        );
      } else {
        // Insertar nueva
        await client.query(
          `INSERT INTO escuela.asistencias 
          (inscripcion_id, fecha, estado_asistencia, participacion, comentarios, registrado_por) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [asistencia.inscripcion_id, asistencia.fecha, asistencia.estado_asistencia, 
           asistencia.participacion, asistencia.comentarios, asistencia.registrado_por || 1]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      message: 'Asistencias guardadas correctamente' 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error guardando asistencias:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  } finally {
    client.release();
  }
});

export default router;