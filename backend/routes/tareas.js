import express from "express";
import pool from "../database/db.js";
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateTarea, handleValidationErrors } from '../middleware/validaciones.js';

const router = express.Router();

// GET /api/tareas
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.*,
                c.materia_nombre,  
                c.materia_seccion 
                -- Se eliminan: c.nombre as clase_nombre, c.grado, c.grupo, u.nombre as profesor_nombre
            FROM escuela.tareas t
            JOIN escuela.clases c ON t.clase_id = c.clase_id
            -- Se elimina: JOIN escuela.usuarios u ON c.profesor_id = u.usuario_id
            `);
    } catch (error) {
        console.error('Error en GET /tareas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las tareas'
        });
    }
});

// POST /api/tareas
router.post('/', authenticateToken, requireRole(['profesor', 'admin']), validateTarea, async (req, res) => {
    try {
        const { clase_id, titulo, descripcion, tipo, fecha_entrega, puntaje_maximo } = req.body;
        
        const result = await pool.query(`
            INSERT INTO escuela.tareas (clase_id, titulo, descripcion, tipo, fecha_entrega, puntaje_maximo)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *
        `, [clase_id, titulo, descripcion, tipo, fecha_entrega, puntaje_maximo]);
        
        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            tarea: result.rows[0]
        });
    } catch (error) {
        console.error('Error en POST /tareas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear tarea'
        });
    }
});

export default router;