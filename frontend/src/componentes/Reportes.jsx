import React, { useState } from 'react';
import '../estilos/Reportes.css';
import '../estilos/Globales.css';

const Reportes = ({ grupos }) => {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [tipoReporte, setTipoReporte] = useState('asistencia');
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 5000);
  };

  // Función para obtener el token de autenticación
  const obtenerToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const generarReportePDF = async () => {
    if (!grupoSeleccionado) {
      mostrarAlerta('error', 'Por favor selecciona un grupo antes de generar el reporte');
      return;
    }

    setCargando(true);
    
    try {
      const token = obtenerToken();
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const response = await fetch(`/api/reportes/export/${tipoReporte}/${grupoSeleccionado.clase_id}?formato=pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Estado de respuesta:', response.status);

      if (response.status === 401) {
        throw new Error('No autorizado. Tu sesión puede haber expirado. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const nuevaVentana = window.open('', '_blank');
        if (nuevaVentana) {
          generarVistaPDF(nuevaVentana, data.reporte, tipoReporte);
          mostrarAlerta('exito', `Reporte de ${tipoReporte} generado exitosamente`);
        } else {
          throw new Error('No se pudo abrir la ventana para el reporte. Verifica los bloqueadores de ventanas emergentes.');
        }
      } else {
        throw new Error(data.error || 'Error desconocido al generar el reporte');
      }

    } catch (error) {
      console.error('Error detallado:', error);
      
      let mensajeError = error.message;
      
      if (error.message.includes('Failed to fetch')) {
        mensajeError = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      }
      
      mostrarAlerta('error', `Error al generar el reporte: ${mensajeError}`);
    } finally {
      setCargando(false);
    }
  };

  const generarVistaPDF = (ventana, datosReporte, tipo) => {
    const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const tituloReporte = {
      asistencia: 'ASISTENCIA',
      tareas: 'CALIFICACIONES DE TAREAS', 
      examenes: 'CALIFICACIONES DE EXÁMENES'
    }[tipo];

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Académico - ${grupoSeleccionado.grupo_nombre}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 30px; 
            color: #1C1F33;
            background: white;
            line-height: 1.6;
          }
          .header { 
            border-bottom: 3px solid #C0A062; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .institucion { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1C1F33;
            margin-bottom: 5px;
          }
          .subtitulo {
            font-size: 14px;
            color: #666;
          }
          .titulo-reporte { 
            font-size: 20px; 
            color: #1C1F33; 
            margin: 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .datos-grupo { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #C0A062;
            font-size: 14px;
          }
          .estadisticas-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin: 30px 0;
          }
          .tarjeta-estadistica { 
            padding: 25px; 
            border-radius: 10px; 
            text-align: center; 
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .minimo { background: linear-gradient(135deg, #1C1F33 0%, #2D3748 100%); }
          .medio { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
          .maximo { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
          .tabla-datos { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0;
            font-size: 12px;
          }
          .tabla-datos th, .tabla-datos td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
          }
          .tabla-datos th { 
            background: #1C1F33; 
            color: white;
            font-weight: bold;
          }
          .tabla-datos tr:nth-child(even) {
            background: #f8f9fa;
          }
          .observaciones { 
            background: #fff3cd; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #ffc107;
            margin: 25px 0;
            font-size: 14px;
          }
          .resumen { 
            background: #e7f3ff; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #007bff;
            margin: 20px 0;
          }
          .botones-accion { 
            margin-top: 30px; 
            text-align: center;
            padding-top: 20px;
            border-top: 2px solid #eee;
          }
          .boton-accion { 
            padding: 12px 25px; 
            margin: 0 10px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.3s ease;
          }
          .imprimir { background: #1C1F33; color: white; }
          .descargar { background: #C0A062; color: white; }
          .boton-accion:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          @media print {
            .botones-accion { display: none; }
            body { padding: 15px; }
          }
          .valor-estadistica {
            font-size: 32px;
            margin: 10px 0;
          }
          .etiqueta-estadistica {
            font-size: 14px;
            opacity: 0.9;
          }
          .alumno-destacado {
            font-size: 12px;
            margin-top: 5px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="institucion">UNIVERSIDAD ACADÉMICA</div>
            <div class="subtitulo">Sistema de Gestión Académica</div>
            <div class="titulo-reporte">Reporte de ${tituloReporte}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Fecha:</strong> ${fecha}</div>
            <div><strong>Grupo:</strong> ${grupoSeleccionado.grupo_nombre}</div>
            <div><strong>Materia:</strong> ${grupoSeleccionado.materia_nombre}</div>
          </div>
        </div>

        <div class="datos-grupo">
          <strong>Información del Grupo:</strong><br>
          Materia: ${datosReporte.informacion_general?.materia || grupoSeleccionado.materia_nombre} | 
          Grupo: ${datosReporte.informacion_general?.grupo || grupoSeleccionado.grupo_nombre} | 
          Periodo: ${datosReporte.informacion_general?.periodo || new Date().getFullYear()} |
          Total de Alumnos: ${datosReporte.informacion_general?.total_alumnos || 'N/A'}
          ${datosReporte.informacion_general?.profesor ? `| Profesor: ${datosReporte.informacion_general.profesor}` : ''}
          ${datosReporte.informacion_general?.total_sesiones ? `| Sesiones: ${datosReporte.informacion_general.total_sesiones}` : ''}
        </div>

        <div class="estadisticas-grid">
          <div class="tarjeta-estadistica minimo">
            <div class="etiqueta-estadistica">PORCENTAJE MÍNIMO</div>
            <div class="valor-estadistica">${datosReporte.estadisticas?.porcentaje_minimo || datosReporte.estadisticas?.calificacion_minima || '0'}%</div>
            <div class="alumno-destacado">${datosReporte.estadisticas?.alumno_minimo || 'N/A'}</div>
          </div>
          <div class="tarjeta-estadistica medio">
            <div class="etiqueta-estadistica">PORCENTAJE MEDIO</div>
            <div class="valor-estadistica">${datosReporte.estadisticas?.porcentaje_medio || datosReporte.estadisticas?.calificacion_media || '0'}%</div>
            <div class="alumno-destacado">Promedio del grupo</div>
          </div>
          <div class="tarjeta-estadistica maximo">
            <div class="etiqueta-estadistica">PORCENTAJE MÁXIMO</div>
            <div class="valor-estadistica">${datosReporte.estadisticas?.porcentaje_maximo || datosReporte.estadisticas?.calificacion_maxima || '0'}%</div>
            <div class="alumno-destacado">${datosReporte.estadisticas?.alumno_maximo || 'N/A'}</div>
          </div>
        </div>

        ${generarContenidoEspecifico(datosReporte, tipo)}

        <div class="resumen">
          <strong>Resumen Ejecutivo:</strong><br>
          ${generarResumenEjecutivo(datosReporte, tipo)}
        </div>

        <div class="observaciones">
          <strong>Observaciones y Recomendaciones:</strong><br>
          ${generarObservaciones(datosReporte, tipo)}
        </div>

        <div class="botones-accion">
          <button class="boton-accion imprimir" onclick="window.print()">Imprimir Reporte</button>
          <button class="boton-accion descargar" onclick="window.print()">Descargar PDF</button>
        </div>

        <script>
          function descargarPDF() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    ventana.document.close();
  };

  const generarContenidoEspecifico = (datos, tipo) => {
    const distribucion = datos.distribucion || {};
    
    switch(tipo) {
      case 'asistencia':
        return `
          <h3>Distribución de Asistencias</h3>
          <table class="tabla-datos">
            <tr><th>Rango de Asistencia</th><th>Cantidad de Alumnos</th><th>Porcentaje</th></tr>
            <tr><td>90% - 100%</td><td>${distribucion['90-100'] || 0}</td><td>${Math.round(((distribucion['90-100'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>80% - 89%</td><td>${distribucion['80-89'] || 0}</td><td>${Math.round(((distribucion['80-89'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>70% - 79%</td><td>${distribucion['70-79'] || 0}</td><td>${Math.round(((distribucion['70-79'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>60% - 69%</td><td>${distribucion['60-69'] || 0}</td><td>${Math.round(((distribucion['60-69'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>0% - 59%</td><td>${distribucion['0-59'] || 0}</td><td>${Math.round(((distribucion['0-59'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
          </table>
        `;
      case 'tareas':
        return `
          <h3>Distribución de Calificaciones de Tareas</h3>
          <table class="tabla-datos">
            <tr><th>Rango de Calificación</th><th>Cantidad de Alumnos</th><th>Porcentaje</th></tr>
            <tr><td>90% - 100%</td><td>${distribucion['90-100'] || 0}</td><td>${Math.round(((distribucion['90-100'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>80% - 89%</td><td>${distribucion['80-89'] || 0}</td><td>${Math.round(((distribucion['80-89'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>70% - 79%</td><td>${distribucion['70-79'] || 0}</td><td>${Math.round(((distribucion['70-79'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>60% - 69%</td><td>${distribucion['60-69'] || 0}</td><td>${Math.round(((distribucion['60-69'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>0% - 59%</td><td>${distribucion['0-59'] || 0}</td><td>${Math.round(((distribucion['0-59'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
          </table>
          ${datos.resumen ? `<p><strong>Total de tareas evaluadas:</strong> ${datos.resumen.total_tareas_evaluadas || 0}</p>` : ''}
        `;
      case 'examenes':
        return `
          <h3>Distribución de Calificaciones de Exámenes</h3>
          <table class="tabla-datos">
            <tr><th>Rango de Calificación</th><th>Cantidad de Alumnos</th><th>Porcentaje</th></tr>
            <tr><td>90% - 100%</td><td>${distribucion['90-100'] || 0}</td><td>${Math.round(((distribucion['90-100'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>80% - 89%</td><td>${distribucion['80-89'] || 0}</td><td>${Math.round(((distribucion['80-89'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>70% - 79%</td><td>${distribucion['70-79'] || 0}</td><td>${Math.round(((distribucion['70-79'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>60% - 69%</td><td>${distribucion['60-69'] || 0}</td><td>${Math.round(((distribucion['60-69'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
            <tr><td>0% - 59%</td><td>${distribucion['0-59'] || 0}</td><td>${Math.round(((distribucion['0-59'] || 0) / (datos.informacion_general?.total_alumnos || 1)) * 100)}%</td></tr>
          </table>
          ${datos.resumen ? `<p><strong>Nivel de dificultad:</strong> ${datos.resumen.nivel_dificultad || 'N/A'}</p>` : ''}
        `;
      default:
        return '';
    }
  };

  const generarResumenEjecutivo = (datos, tipo) => {
    switch(tipo) {
      case 'asistencia':
        const resumenAsistencia = datos.resumen || {};
        return `El grupo cuenta con ${resumenAsistencia.total_alumnos || 0} alumnos. 
                ${resumenAsistencia.alumnos_satisfactorios || 0} alumnos mantienen asistencia satisfactoria (≥80%), 
                ${resumenAsistencia.alumnos_regulares || 0} presentan asistencia regular (60-79%), 
                y ${resumenAsistencia.alumnos_criticos || 0} alumnos requieren atención inmediata (<60%).`;
      case 'tareas':
        const tasaTareas = datos.resumen?.tasa_aprobacion_general || 0;
        return `Tasa de aprobación general en tareas: ${tasaTareas}%. 
                ${tasaTareas >= 80 ? 'El desempeño en tareas es satisfactorio.' : 
                 tasaTareas >= 60 ? 'El desempeño en tareas es regular, se sugiere reforzamiento.' : 
                 'El desempeño en tareas requiere atención inmediata.'}`;
      case 'examenes':
        const tasaExamenes = datos.resumen?.tasa_aprobacion_general || 0;
        const nivelDificultad = datos.resumen?.nivel_dificultad || 'N/A';
        return `Tasa de aprobación en exámenes: ${tasaExamenes}%. 
                Nivel de dificultad: ${nivelDificultad}. 
                ${tasaExamenes >= 70 ? 'Los resultados reflejan un buen entendimiento de los temas evaluados.' : 
                 'Se recomienda revisar la metodología de enseñanza y evaluación.'}`;
      default:
        return 'Resumen del reporte académico.';
    }
  };

  const generarObservaciones = (datos, tipo) => {
    switch(tipo) {
      case 'asistencia':
        const criticos = datos.resumen?.alumnos_criticos || 0;
        return `${criticos > 0 ? 
          `Se recomienda contactar a los ${criticos} alumnos con asistencia crítica para evaluar su situación. ` : 
          'La asistencia general del grupo es satisfactoria. '}
          Mantener seguimiento continuo de la asistencia. 
          Reportar casos persistentes de inasistencia al departamento correspondiente.`;
      case 'tareas':
        return `Revisar y proporcionar retroalimentación individualizada en tareas con bajas calificaciones. 
                Considerar actividades de reforzamiento para temas con menor desempeño. 
                Fomentar la entrega oportuna de tareas y proyectos.`;
      case 'examenes':
        return `Analizar los temas con menor calificación promedio para planificar sesiones de repaso. 
                Considerar diferentes estilos de aprendizaje en la preparación de exámenes. 
                Programar asesorías personalizadas para alumnos con dificultades.`;
      default:
        return 'Observaciones generales del reporte.';
    }
  };

  return (
    <div className="seccion-reportes">
      <div className="encabezado-seccion">
        <h2>Generar Reportes Académicos</h2>
      </div>

      {alerta && (
        <div className={`alerta ${alerta.tipo}`}>
          <div className="contenido-alerta">
            <span className="icono-alerta">
              {alerta.tipo === 'exito' ? '✓' : '⚠'}
            </span>
            <span className="mensaje-alerta">{alerta.mensaje}</span>
            <button 
              className="cerrar-alerta" 
              onClick={() => setAlerta(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="cuadricula-controles-reportes">
        <div className="tarjeta-control grupo-seleccion">
          <label className="etiqueta-control">Seleccionar Grupo:</label>
          <select 
            value={grupoSeleccionado?.clase_id || ''} 
            onChange={(e) => {
              const seleccion = grupos.find(g => g.clase_id === parseInt(e.target.value));
              setGrupoSeleccionado(seleccion);
            }}
            className="selector-control selector-grupo"
          >
            <option value="">Selecciona un grupo</option>
            {grupos.map(grupo => (
              <option key={grupo.clase_id} value={grupo.clase_id}>
                {grupo.grupo_nombre} - {grupo.materia_nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="tarjeta-control tipo-reporte">
          <label className="etiqueta-control">Tipo de Reporte:</label>
          <select 
            value={tipoReporte} 
            onChange={(e) => setTipoReporte(e.target.value)}
            className="selector-control selector-tipo"
          >
            <option value="asistencia">Asistencia</option>
            <option value="tareas">Calificaciones de Tareas</option>
            <option value="examenes">Calificaciones de Exámenes</option>
          </select>
        </div>
      </div>

      <div className="seccion-generar">
        <button 
          className={`boton-generar ${cargando ? 'boton-cargando' : ''}`} 
          onClick={generarReportePDF}
          disabled={cargando || !grupoSeleccionado}
        >
          {cargando ? (
            <>
              <span className="spinner"></span>
              Generando Reporte...
            </>
          ) : (
            'Generar Reporte PDF'
          )}
        </button>
        
        {grupoSeleccionado && (
          <div className="info-seleccion">
            <p><strong>Grupo seleccionado:</strong> {grupoSeleccionado.grupo_nombre}</p>
            <p><strong>Materia:</strong> {grupoSeleccionado.materia_nombre}</p>
            <p><strong>Tipo de reporte:</strong> 
              {tipoReporte === 'asistencia' && ' Asistencia'}
              {tipoReporte === 'tareas' && ' Calificaciones de Tareas'}
              {tipoReporte === 'examenes' && ' Calificaciones de Exámenes'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;