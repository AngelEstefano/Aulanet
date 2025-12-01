import express from 'express';
import pool from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateCalificacion } from '../middleware/validaciones.js';

const router = express.Router();

// CRM-54: GET /calificaciones/alumno/:id
router.get('/alumno/:estudiante_id', authenticateToken, async (req, res) => {
    try {
        const { estudiante_id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                // ... (resto de columnas)
                c.puntaje as calificacion,
                t.puntaje_maximo,          
                c.retroalimentacion,        
                c.entregado,
                cl.materia_nombre,           -- Nuevo campo
                cl.materia_seccion           -- Nuevo campo
                -- Se eliminan: cl.nombre as clase_nombre, cl.grado, cl.grupo
            FROM escuela.calificaciones c
            JOIN escuela.tareas t ON c.tarea_id = t.tarea_id
            JOIN escuela.inscripciones i ON c.inscripcion_id = i.inscripcion_id
            JOIN escuela.clases cl ON i.clase_id = cl.clase_id
            JOIN escuela.estudiantes e ON i.estudiante_id = e.estudiante_id
            WHERE e.estudiante_id = $1
        `, [estudiante_id]);

        res.json({
            success: true,
            calificaciones: result.rows,
            total: result.rowCount
        });
    } catch (error) {
        console.error('Error en GET /calificaciones/alumno:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener calificaciones del alumno' 
        });
    }
});

// CRM-56: POST /calificaciones - ACTUALIZADO
router.post('/', authenticateToken, requireRole(['profesor', 'admin']), validateCalificacion, async (req, res) => {
    try {
        const { inscripcion_id, tarea_id, puntaje, observaciones } = req.body;
        
        console.log('Creando calificación:', req.body);

        // Validar que la tarea existe
        const tareaCheck = await pool.query(
            'SELECT puntaje_maximo FROM escuela.tareas WHERE tarea_id = $1',
            [tarea_id]
        );
        
        if (tareaCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tarea no encontrada'
            });
        }
        
        const puntuacionMaxima = tareaCheck.rows[0].puntaje_maximo;
        
        // Validar que la calificación no exceda el máximo
        if (puntaje > puntuacionMaxima) {
            return res.status(400).json({
                success: false,
                error: `La calificación no puede exceder ${puntuacionMaxima} puntos`
            });
        }

        // Insertar la calificación
        const result = await pool.query(`
            INSERT INTO escuela.calificaciones (inscripcion_id, tarea_id, puntaje, observaciones)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [inscripcion_id, tarea_id, puntaje, observaciones]);

        res.status(201).json({
            success: true,
            message: 'Calificación creada exitosamente',
            calificacion: result.rows[0]
        });
    } catch (error) {
        console.error('Error en POST /calificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear la calificación'
        });
    }
});

export default router;