// routes/clases.js
import express from 'express';
import pool from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateClase } from '../middleware/validaciones.js';

const router = express.Router();

// GET /api/clases - Obtener todas las clases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.clase_id,
        c.profesor_id,
        c.materia_nombre,                  
        c.materia_seccion, 
        c.fecha_inicio,
        c.fecha_fin,
        c.dias_de_clase,
        c.capacidad,
        c.color_hex,
        c.activo,
        COUNT(DISTINCT i.inscripcion_id) as total_estudiantes,
        u.nombre as profesor_nombre
      FROM escuela.clases c
      LEFT JOIN escuela.inscripciones i ON c.clase_id = i.clase_id
      LEFT JOIN escuela.usuarios u ON c.profesor_id = u.usuario_id
      GROUP BY c.clase_id, u.nombre
      ORDER BY c.materia_nombre, c.materia_seccion
    `);
    
    res.json({
      success: true,
      clases: result.rows
    });
    
  } catch (error) {
    console.error('Error obteniendo clases:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/clases - Crear nueva clase (CORREGIDO CON profesor_id)
router.post('/', authenticateToken, requireRole(['profesor', 'admin']), validateClase, async (req, res) => {
  try {
    // 1. OBTENER EL ID DEL PROFESOR DEL TOKEN (CRÍTICO)
    const profesor_id = req.user.id;
    
    if (!profesor_id) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo identificar al profesor'
      });
    }
    
    // 2. Extraer datos del formulario
    const { 
      materia_nombre, 
      materia_seccion, 
      fecha_inicio, 
      fecha_fin, 
      dias_de_clase, 
      capacidad, 
      color_hex 
    } = req.body;

    // 3. Insertar en la base de datos CON el profesor_id
    const result = await pool.query(`
      INSERT INTO escuela.clases 
      (profesor_id, materia_nombre, materia_seccion, fecha_inicio, fecha_fin, dias_de_clase, capacidad, color_hex)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING clase_id, materia_nombre, materia_seccion, fecha_inicio, fecha_fin, dias_de_clase, profesor_id
    `, [
      profesor_id,        // ¡ESTO ES LO QUE FALTABA!
      materia_nombre, 
      materia_seccion, 
      fecha_inicio, 
      fecha_fin, 
      dias_de_clase, 
      capacidad || 30, 
      color_hex || '#3498db'
    ]);

    res.status(201).json({
      success: true,
      message: 'Clase creada exitosamente',
      clase: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al crear clase:', error);
    
    // Manejar errores específicos de PostgreSQL
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({
        success: false,
        error: 'El profesor especificado no existe'
      });
    }
    
    if (error.code === '23502') { // NOT NULL violation
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear la clase'
    });
  }
});

// GET /api/clases/:id - Obtener clase por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.nombre as profesor_nombre,
        COUNT(DISTINCT i.inscripcion_id) as total_estudiantes
      FROM escuela.clases c
      LEFT JOIN escuela.usuarios u ON c.profesor_id = u.usuario_id
      LEFT JOIN escuela.inscripciones i ON c.clase_id = i.clase_id
      WHERE c.clase_id = $1
      GROUP BY c.clase_id, u.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clase no encontrada'
      });
    }
    
    res.json({
      success: true,
      clase: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error obteniendo clase:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/clases/:id - Actualizar clase
router.put('/:id', authenticateToken, requireRole(['profesor', 'admin']), validateClase, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      materia_nombre, 
      materia_seccion, 
      fecha_inicio, 
      fecha_fin, 
      dias_de_clase, 
      capacidad, 
      color_hex 
    } = req.body;

    // Verificar que la clase exista y pertenezca al profesor (o admin)
    const claseExistente = await pool.query(
      'SELECT profesor_id FROM escuela.clases WHERE clase_id = $1',
      [id]
    );
    
    if (claseExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clase no encontrada'
      });
    }
    
    // Verificar permisos: profesor solo puede editar sus propias clases
    if (req.user.role === 'profesor' && claseExistente.rows[0].profesor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar esta clase'
      });
    }
    
    const result = await pool.query(`
      UPDATE escuela.clases 
      SET materia_nombre = $1,
          materia_seccion = $2,
          fecha_inicio = $3,
          fecha_fin = $4,
          dias_de_clase = $5,
          capacidad = $6,
          color_hex = $7,
          fecha_actualizacion = NOW()
      WHERE clase_id = $8
      RETURNING *
    `, [materia_nombre, materia_seccion, fecha_inicio, fecha_fin, dias_de_clase, capacidad, color_hex, id]);
    
    res.json({
      success: true,
      message: 'Clase actualizada exitosamente',
      clase: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error actualizando clase:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/clases/:id - Eliminar clase
router.delete('/:id', authenticateToken, requireRole(['profesor', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la clase exista y pertenezca al profesor (o admin)
    const claseExistente = await pool.query(
      'SELECT profesor_id FROM escuela.clases WHERE clase_id = $1',
      [id]
    );
    
    if (claseExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clase no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role === 'profesor' && claseExistente.rows[0].profesor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar esta clase'
      });
    }
    
    await pool.query('DELETE FROM escuela.clases WHERE clase_id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Clase eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando clase:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;