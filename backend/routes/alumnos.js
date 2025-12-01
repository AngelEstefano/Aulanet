import express from "express";
import pool from "../database/db.js";
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateAlumno, handleValidationErrors } from '../middleware/validaciones.js';

const router = express.Router();

// POST /api/alumnos - Agregar alumno a clase
router.post('/', authenticateToken, requireRole(['profesor', 'admin']), validateAlumno, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { codigo_estudiante, nombre, email, telefono, clase_id } = req.body;

    // Validaciones básicas
    if (!codigo_estudiante || !nombre || !clase_id) {
      return res.status(400).json({
        success: false,
        error: 'Código, nombre y clase_id son requeridos'
      });
    }

    // 1. Crear el alumno
    const estudianteResult = await client.query(
      `INSERT INTO escuela.estudiantes 
      (codigo_estudiante, nombre, email, telefono) 
      VALUES ($1, $2, $3, $4) 
      RETURNING estudiante_id`,
      [codigo_estudiante, nombre, email, telefono]
    );

    // 2. Inscribir al alumno en la clase
    await client.query(
      'INSERT INTO escuela.inscripciones (estudiante_id, clase_id) VALUES ($1, $2)',
      [estudianteResult.rows[0].estudiante_id, clase_id]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      estudiante_id: estudianteResult.rows[0].estudiante_id,
      message: 'Estudiante agregado exitosamente' 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error agregando alumno:', error);
    
    if (error.code === '23505') { // Violación de unique constraint
      return res.status(400).json({ 
        success: false,
        error: 'El código de estudiante ya existe' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  } finally {
    client.release();
  }
});

// DELETE /api/alumnos/:id - Eliminar alumno (CORREGIDO)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const estudianteId = req.params.id;

    await pool.query('DELETE FROM escuela.estudiantes WHERE estudiante_id = $1', [estudianteId]);

    res.json({ 
      success: true, 
      message: 'Alumno eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando alumno:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

export default router;