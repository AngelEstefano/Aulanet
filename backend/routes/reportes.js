// routes/reportes.js - Versión CORREGIDA

import express from 'express';
import pool from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// 1. Función para obtener información de la clase (CORREGIDA)
const obtenerInfoClase = async (claseId) => {
    try {
        const infoResult = await pool.query(`
            SELECT 
                c.clase_id,
                c.materia_nombre,
                c.materia_seccion,
                c.materia_seccion AS grupo_nombre,  -- Usamos materia_seccion como nombre del grupo
                u.nombre || ' ' || COALESCE(u.apellido, '') AS profesor_nombre
            FROM escuela.clases c
            JOIN escuela.usuarios u ON c.profesor_id = u.usuario_id
            WHERE c.clase_id = $1
        `, [claseId]);

        if (infoResult.rows.length === 0) {
            throw new Error(`Clase con ID ${claseId} no encontrada.`);
        }
        return infoResult.rows[0];
    } catch (error) {
        console.error('Error al obtener información de la clase:', error);
        throw error;
    }
};

// 2. Función para generar reporte de asistencia (COMPLETA Y CORREGIDA)
const generarReporteAsistencia = async (claseId) => {
    try { 
        // 1. Obtener información general de la clase
        const infoClase = await obtenerInfoClase(claseId);
        
        // 2. Obtener datos detallados de asistencia de los alumnos
        const alumnosResult = await pool.query(`
            SELECT
                e.estudiante_id,
                e.codigo_estudiante,
                e.nombre || ' ' || COALESCE(e.apellido, '') AS estudiante_nombre,
                COUNT(a.asistencia_id) AS total_clases_registradas,
                COUNT(CASE WHEN a.estado_asistencia = 'presente' THEN 1 END) AS total_presente,
                COUNT(CASE WHEN a.estado_asistencia = 'ausente' THEN 1 END) AS total_ausente,
                COUNT(CASE WHEN a.estado_asistencia = 'tarde' THEN 1 END) AS total_tarde,
                (CAST(COUNT(CASE WHEN a.estado_asistencia = 'presente' THEN 1 END) AS DECIMAL) / 
                 NULLIF(COUNT(a.asistencia_id), 0)) * 100 AS porcentaje_asistencia
            FROM escuela.inscripciones i
            JOIN escuela.estudiantes e ON i.estudiante_id = e.estudiante_id
            LEFT JOIN escuela.asistencias a ON i.inscripcion_id = a.inscripcion_id
            WHERE i.clase_id = $1
            GROUP BY e.estudiante_id, e.codigo_estudiante, e.nombre, e.apellido
            ORDER BY estudiante_nombre
        `, [claseId]);
        
        // 3. Manejar caso cuando no hay inscripciones
        if (alumnosResult.rows.length === 0) {
            return {
                tipo: 'asistencia',
                informacion_general: {
                    clase_id: infoClase.clase_id,
                    grupo: infoClase.grupo_nombre || infoClase.materia_seccion,
                    materia: infoClase.materia_nombre,
                    profesor: infoClase.profesor_nombre,
                    total_alumnos: 0,
                    periodo: `${new Date().getFullYear()}`,
                    mensaje: 'No hay estudiantes inscritos en esta clase'
                },
                estadisticas: {
                    promedio_asistencia_clase: '0.00',
                },
                alumnos: [],
            };
        }
        
        // 4. Procesar datos normales
        const alumnos = alumnosResult.rows.map(alumno => ({
            ...alumno,
            porcentaje_asistencia: parseFloat(alumno.porcentaje_asistencia || 0).toFixed(2),
        }));

        const totalAlumnos = alumnos.length;
        const promedioAsistencia = totalAlumnos > 0 ? 
            (alumnos.reduce((sum, a) => sum + parseFloat(a.porcentaje_asistencia), 0) / totalAlumnos).toFixed(2) : 
            '0.00';
        
        return {
            tipo: 'asistencia',
            informacion_general: {
                clase_id: infoClase.clase_id,
                grupo: infoClase.grupo_nombre || infoClase.materia_seccion,
                materia: infoClase.materia_nombre,
                profesor: infoClase.profesor_nombre,
                total_alumnos: totalAlumnos,
                periodo: `${new Date().getFullYear()}` 
            },
            estadisticas: {
                promedio_asistencia_clase: promedioAsistencia,
            },
            alumnos: alumnos,
        };

    } catch (error) {
        console.error('Error interno en generarReporteAsistencia:', error);
        throw error;
    }
};

// 3. Función para generar PDF (placeholder - mantén la que ya tienes)
const exportarPDF = (res, reporte) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${reporte.tipo}_${Date.now()}.pdf`);

    const doc = new PDFDocument({
        size: 'Letter',
        margin: 50
    });

    doc.pipe(res);
    
    // Contenido básico del PDF
    doc.fontSize(16).text(`Reporte de ${reporte.tipo.toUpperCase()}`, { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Grupo: ${reporte.informacion_general.grupo}`);
    doc.text(`Materia: ${reporte.informacion_general.materia}`);
    doc.text(`Profesor: ${reporte.informacion_general.profesor}`).moveDown();

    doc.fontSize(10).text('Alumnos:', { underline: true }).moveDown(0.5);
    
    if (reporte.alumnos && reporte.alumnos.length > 0) {
        reporte.alumnos.forEach((alumno, index) => {
            doc.text(`${index + 1}. ${alumno.estudiante_nombre} (${alumno.codigo_estudiante}): ${alumno.porcentaje_asistencia}%`);
        });
    } else {
        doc.text('No hay datos de alumnos en este reporte.');
    }
    
    doc.end();
};

// ============================================
// RUTAS
// ============================================

// GET /api/reportes/export/:tipo/:claseId - Exportar reporte
router.get('/export/:tipo/:claseId', authenticateToken, requireRole(['profesor', 'admin']), async (req, res) => {
  try {
    const { tipo, claseId } = req.params;
    const { formato = 'json' } = req.query;

    const tiposValidos = ['asistencia', 'tareas', 'examenes'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de reporte no válido. Usar: asistencia, tareas, examenes' 
      });
    }

    let reporte = {};

    switch (tipo) {
      case 'asistencia':
        reporte = await generarReporteAsistencia(claseId);
        break;
      case 'tareas':
        // TODO: Implementar cuando tengas la función
        reporte = { 
          tipo: 'tareas', 
          informacion_general: { grupo: 'N/A', materia: 'N/A', profesor: 'N/A' }, 
          alumnos: [] 
        };
        break;
      case 'examenes':
        // TODO: Implementar cuando tengas la función
        reporte = { 
          tipo: 'examenes', 
          informacion_general: { grupo: 'N/A', materia: 'N/A', profesor: 'N/A' }, 
          alumnos: [] 
        };
        break;
    }

    if (formato === 'json') {
      res.json({ success: true, reporte: reporte });
    } else if (formato === 'pdf') {
        exportarPDF(res, reporte); 
    } else {
        res.status(400).json({ 
          success: false, 
          error: 'Formato de exportación no válido. Usar: json, pdf' 
        });
    }

  } catch (error) {
    console.error(`Error generando reporte ${req.params.tipo} [${req.query.formato}]:`, error);
    
    if (!res.headersSent) { 
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al generar el reporte'
        });
    }
  }
});

export default router;