import React, { useState, useEffect } from 'react';
import GestionAsistencia from './GestionAsistencia';
import GestionTareas from './GestionTareas';
import GestionExamenes from './GestionExamenes';
import '../estilos/GestionGrupo.css';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

const GestionGrupo = ({ grupo, onVolver }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [diasClase, setDiasClase] = useState([]);
  const [mostrarModalEstudiante, setMostrarModalEstudiante] = useState(false);
  const [editandoEstudiante, setEditandoEstudiante] = useState(null);
  const [formularioEstudiante, setFormularioEstudiante] = useState({ 
    nombre: '', 
    apellido: '', 
    codigo_estudiante: '' 
  });
  const [pestañaActiva, setPestañaActiva] = useState('asistencia');
  const [datosAsistencia, setDatosAsistencia] = useState({});
  const [datosTareas, setDatosTareas] = useState({});
  const [datosExamenes, setDatosExamenes] = useState({});
  const [mostrarModalTarea, setMostrarModalTarea] = useState(false);
  const [mostrarModalExamen, setMostrarModalExamen] = useState(false);
  const [formularioTarea, setFormularioTarea] = useState({ titulo: '', descripcion: '' });
  const [formularioExamen, setFormularioExamen] = useState({ titulo: '', descripcion: '' });

  // Obtener token de autenticación
  const obtenerToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Generar días de clase basados en las fechas y días configurados
  const generarDiasClase = () => {
    if (!grupo.fecha_inicio || !grupo.fecha_fin || !grupo.dias_clase) return [];
    
    const dias = [];
    const fechaInicio = new Date(grupo.fecha_inicio);
    const fechaFin = new Date(grupo.fecha_fin);
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha.setDate(fecha.getDate() + 1)) {
      const nombreDia = nombresDias[fecha.getDay()];
      if (grupo.dias_clase.includes(nombreDia)) {
        dias.push(new Date(fecha));
      }
    }
    
    return dias;
  };

  // Cargar datos del grupo desde la base de datos
  const cargarDatosGrupo = async () => {
    try {
      const token = obtenerToken();
      
      // 1. Cargar estudiantes desde la base de datos
      const estudiantesResponse = await fetch(`${API_BASE_URL}/inscripciones/clase/${grupo.clase_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (estudiantesResponse.ok) {
        const estudiantesData = await estudiantesResponse.json();
        setEstudiantes(estudiantesData.estudiantes || []);
      }

      // 2. Cargar asistencias para todos los días
      const dias = generarDiasClase();
      setDiasClase(dias);
      
      // Crear objeto vacío para asistencias
      const asistenciaInicial = {};
      setDatosAsistencia(asistenciaInicial);

      // 3. Cargar tareas desde la base de datos
      const tareasResponse = await fetch(`${API_BASE_URL}/tareas/clase/${grupo.clase_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (tareasResponse.ok) {
        const tareasData = await tareasResponse.json();
        const tareasFormateadas = {};
        tareasData.tareas?.forEach(tarea => {
          tareasFormateadas[tarea.tarea_id] = {
            id: tarea.tarea_id,
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            tipo: tarea.tipo,
            fecha_entrega: tarea.fecha_entrega,
            puntaje_maximo: tarea.puntaje_maximo,
            calificaciones: {}
          };
        });
        setDatosTareas(tareasFormateadas);
      }

      // 4. Cargar calificaciones para tareas y exámenes
      await cargarCalificaciones(grupo.clase_id, token);
      
    } catch (error) {
      console.error('Error cargando datos del grupo:', error);
    }
  };

  // Cargar calificaciones desde la base de datos
  const cargarCalificaciones = async (claseId, token) => {
    try {
      // Cargar calificaciones de tareas
      const calificacionesResponse = await fetch(`${API_BASE_URL}/calificaciones/clase/${claseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (calificacionesResponse.ok) {
        const calificacionesData = await calificacionesResponse.json();
        
        // Procesar calificaciones de tareas
        const nuevasTareas = { ...datosTareas };
        calificacionesData.calificaciones?.forEach(cal => {
          if (nuevasTareas[cal.tarea_id]) {
            nuevasTareas[cal.tarea_id].calificaciones[cal.estudiante_id] = cal.puntaje || '';
          }
        });
        setDatosTareas(nuevasTareas);
      }
      
    } catch (error) {
      console.error('Error cargando calificaciones:', error);
    }
  };

  useEffect(() => {
    cargarDatosGrupo();
  }, [grupo]);

  // Guardar estudiante en la base de datos
  const manejarGuardarEstudiante = async () => {
    if (!formularioEstudiante.nombre || !formularioEstudiante.codigo_estudiante) {
      alert('Nombre y código de estudiante son requeridos');
      return;
    }

    try {
      const token = obtenerToken();
      
      if (editandoEstudiante) {
        // Actualizar estudiante existente
        const response = await fetch(`${API_BASE_URL}/estudiantes/${editandoEstudiante.estudiante_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: formularioEstudiante.nombre,
            apellido: formularioEstudiante.apellido,
            codigo_estudiante: formularioEstudiante.codigo_estudiante
          })
        });

        if (response.ok) {
          // Recargar estudiantes
          await cargarDatosGrupo();
        }
      } else {
        // Crear nuevo estudiante y matricularlo
        const response = await fetch(`${API_BASE_URL}/alumnos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: formularioEstudiante.nombre,
            apellido: formularioEstudiante.apellido,
            codigo_estudiante: formularioEstudiante.codigo_estudiante,
            clase_id: grupo.clase_id
          })
        });

        if (response.ok) {
          // Recargar estudiantes
          await cargarDatosGrupo();
        }
      }
      
      setFormularioEstudiante({ nombre: '', apellido: '', codigo_estudiante: '' });
      setEditandoEstudiante(null);
      setMostrarModalEstudiante(false);
      
    } catch (error) {
      console.error('Error guardando estudiante:', error);
      alert('Error al guardar estudiante');
    }
  };

  // Eliminar estudiante de la base de datos
  const manejarEliminarEstudiante = async (estudianteId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
      try {
        const token = obtenerToken();
        
        const response = await fetch(`${API_BASE_URL}/estudiantes/${estudianteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Recargar estudiantes
          await cargarDatosGrupo();
        } else {
          alert('Error al eliminar estudiante');
        }
        
      } catch (error) {
        console.error('Error eliminando estudiante:', error);
        alert('Error al eliminar estudiante');
      }
    }
  };

  // Guardar asistencia en la base de datos
  const manejarCambioAsistencia = async (inscripcionId, fecha, estado) => {
    try {
      const token = obtenerToken();
      const estudiante = estudiantes.find(est => est.inscripcion_id === inscripcionId);
      
      if (!estudiante) return;

      const asistenciaData = {
        inscripcion_id: inscripcionId,
        fecha: fecha,
        estado_asistencia: estado.startsWith('comentario:') ? estado.split(':')[1] : estado,
        comentarios: estado.startsWith('comentario:') ? estado.split(':').slice(3).join(':') : null
      };

      const response = await fetch(`${API_BASE_URL}/asistencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify([asistenciaData])
      });

      if (response.ok) {
        // Actualizar estado local
        const asistenciaActualizada = {
          ...datosAsistencia,
          [`${inscripcionId}_${fecha}`]: estado
        };
        setDatosAsistencia(asistenciaActualizada);
      }
      
    } catch (error) {
      console.error('Error guardando asistencia:', error);
    }
  };

  // Agregar tarea en la base de datos
  const manejarAgregarTarea = async () => {
    if (!formularioTarea.titulo) {
      alert('Por favor ingresa el título de la tarea');
      return;
    }

    try {
      const token = obtenerToken();
      
      const response = await fetch(`${API_BASE_URL}/tareas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clase_id: grupo.clase_id,
          titulo: formularioTarea.titulo,
          descripcion: formularioTarea.descripcion || '',
          tipo: 'tarea',
          fecha_entrega: new Date().toISOString().split('T')[0],
          puntaje_maximo: 100
        })
      });

      if (response.ok) {
        const nuevaTarea = await response.json();
        
        // Actualizar estado local
        const tareasActualizadas = {
          ...datosTareas,
          [nuevaTarea.tarea.tarea_id]: {
            id: nuevaTarea.tarea.tarea_id,
            titulo: nuevaTarea.tarea.titulo,
            descripcion: nuevaTarea.tarea.descripcion,
            tipo: nuevaTarea.tarea.tipo,
            fecha_entrega: nuevaTarea.tarea.fecha_entrega,
            puntaje_maximo: nuevaTarea.tarea.puntaje_maximo,
            calificaciones: {}
          }
        };
        
        setDatosTareas(tareasActualizadas);
        setMostrarModalTarea(false);
        setFormularioTarea({ titulo: '', descripcion: '' });
      }
      
    } catch (error) {
      console.error('Error agregando tarea:', error);
      alert('Error al agregar tarea');
    }
  };

  // Guardar calificación de tarea en la base de datos
  const manejarCalificacionTarea = async (idTarea, idEstudiante, calificacion) => {
    try {
      const token = obtenerToken();
      const estudiante = estudiantes.find(est => est.alumno_id === idEstudiante);
      
      if (!estudiante) return;

      // Buscar la inscripción del estudiante
      const response = await fetch(`${API_BASE_URL}/calificaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inscripcion_id: estudiante.inscripcion_id,
          tarea_id: idTarea,
          puntaje: calificacion ? parseFloat(calificacion) : null,
          observaciones: ''
        })
      });

      if (response.ok) {
        // Actualizar estado local
        const tarea = datosTareas[idTarea];
        if (tarea) {
          const tareasActualizadas = {
            ...datosTareas,
            [idTarea]: {
              ...tarea,
              calificaciones: {
                ...tarea.calificaciones,
                [idEstudiante]: calificacion
              }
            }
          };
          setDatosTareas(tareasActualizadas);
        }
      }
      
    } catch (error) {
      console.error('Error guardando calificación:', error);
    }
  };

  // Eliminar tarea de la base de datos
  const manejarEliminarTarea = async (tareaId) => {
    try {
      const token = obtenerToken();
      
      const response = await fetch(`${API_BASE_URL}/tareas/${tareaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const tareasActualizadas = { ...datosTareas };
        delete tareasActualizadas[tareaId];
        setDatosTareas(tareasActualizadas);
      }
      
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  // Agregar examen en la base de datos
  const manejarAgregarExamen = async () => {
    if (!formularioExamen.titulo) {
      alert('Por favor ingresa el título del examen');
      return;
    }

    try {
      const token = obtenerToken();
      
      const response = await fetch(`${API_BASE_URL}/tareas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clase_id: grupo.clase_id,
          titulo: formularioExamen.titulo,
          descripcion: formularioExamen.descripcion || '',
          tipo: 'examen',
          fecha_entrega: new Date().toISOString().split('T')[0],
          puntaje_maximo: 100
        })
      });

      if (response.ok) {
        const nuevoExamen = await response.json();
        
        // Actualizar estado local
        const examenesActualizados = {
          ...datosExamenes,
          [nuevoExamen.tarea.tarea_id]: {
            id: nuevoExamen.tarea.tarea_id,
            titulo: nuevoExamen.tarea.titulo,
            descripcion: nuevoExamen.tarea.descripcion,
            tipo: nuevoExamen.tarea.tipo,
            fecha_entrega: nuevoExamen.tarea.fecha_entrega,
            puntaje_maximo: nuevoExamen.tarea.puntaje_maximo,
            calificaciones: {}
          }
        };
        
        setDatosExamenes(examenesActualizados);
        setMostrarModalExamen(false);
        setFormularioExamen({ titulo: '', descripcion: '' });
      }
      
    } catch (error) {
      console.error('Error agregando examen:', error);
      alert('Error al agregar examen');
    }
  };

  // Guardar calificación de examen en la base de datos
  const manejarCalificacionExamen = async (idExamen, idEstudiante, calificacion) => {
    try {
      const token = obtenerToken();
      const estudiante = estudiantes.find(est => est.alumno_id === idEstudiante);
      
      if (!estudiante) return;

      // Para exámenes, usamos la tabla de calificaciones_examenes
      const response = await fetch(`${API_BASE_URL}/calificaciones-examenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inscripcion_id: estudiante.inscripcion_id,
          examen_id: idExamen,
          titulo_examen: datosExamenes[idExamen]?.titulo || 'Examen',
          puntaje: calificacion ? parseFloat(calificacion) : null,
          fecha_examen: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        // Actualizar estado local
        const examen = datosExamenes[idExamen];
        if (examen) {
          const examenesActualizados = {
            ...datosExamenes,
            [idExamen]: {
              ...examen,
              calificaciones: {
                ...examen.calificaciones,
                [idEstudiante]: calificacion
              }
            }
          };
          setDatosExamenes(examenesActualizados);
        }
      }
      
    } catch (error) {
      console.error('Error guardando calificación de examen:', error);
    }
  };

  // Eliminar examen de la base de datos
  const manejarEliminarExamen = async (examenId) => {
    try {
      const token = obtenerToken();
      
      const response = await fetch(`${API_BASE_URL}/tareas/${examenId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const examenesActualizados = { ...datosExamenes };
        delete examenesActualizados[examenId];
        setDatosExamenes(examenesActualizados);
      }
      
    } catch (error) {
      console.error('Error eliminando examen:', error);
    }
  };

  return (
    <div className="gestion-grupo">
      <div className="encabezado-gestion">
        <button className="boton-volver" onClick={onVolver}>← Volver al Inicio</button>
        <h2>Grupo {grupo.materia_seccion || grupo.grupo_nombre} - {grupo.materia_nombre}</h2>
        <button 
          className="boton-agregar-estudiante"
          onClick={() => {
            setEditandoEstudiante(null);
            setFormularioEstudiante({ nombre: '', apellido: '', codigo_estudiante: '' });
            setMostrarModalEstudiante(true);
          }}
        >
          + Agregar Estudiante
        </button>
      </div>

      <div className="contenedor-gestor">
        <div className="encabezado-contenedor">
          <div className="info-grupo">
            <h2>Gestión del Grupo</h2>
            <span className="contador-estudiantes">{estudiantes.length} estudiantes</span>
          </div>
        </div>

        <div className="navegacion-pestañas">
          <button 
            className={`boton-pestaña ${pestañaActiva === 'asistencia' ? 'activa' : ''}`}
            onClick={() => setPestañaActiva('asistencia')}
          >
            📅 Asistencia
          </button>
          <button 
            className={`boton-pestaña ${pestañaActiva === 'tareas' ? 'activa' : ''}`}
            onClick={() => setPestañaActiva('tareas')}
          >
            📝 Tareas
          </button>
          <button 
            className={`boton-pestaña ${pestañaActiva === 'examenes' ? 'activa' : ''}`}
            onClick={() => setPestañaActiva('examenes')}
          >
            🎓 Exámenes
          </button>
        </div>

        <div className="contenido-pestañas">
          {pestañaActiva === 'asistencia' && (
            <GestionAsistencia 
              estudiantes={estudiantes}
              diasClase={diasClase}
              datosAsistencia={datosAsistencia}
              onCambioAsistencia={manejarCambioAsistencia}
              onEditarEstudiante={(estudiante) => {
                setEditandoEstudiante(estudiante);
                setFormularioEstudiante({
                  nombre: estudiante.nombre || '',
                  apellido: estudiante.apellido || '',
                  codigo_estudiante: estudiante.codigo_estudiante || ''
                });
                setMostrarModalEstudiante(true);
              }}
              onEliminarEstudiante={manejarEliminarEstudiante}
              grupoPrincipal={grupo}
            />
          )}
          
          {pestañaActiva === 'tareas' && (
            <GestionTareas 
              estudiantes={estudiantes}
              datosTareas={datosTareas}
              onAgregarTarea={() => setMostrarModalTarea(true)}
              onCalificacionTarea={manejarCalificacionTarea}
              onEliminarTarea={manejarEliminarTarea}
            />
          )}
          
          {pestañaActiva === 'examenes' && (
            <GestionExamenes 
              estudiantes={estudiantes}
              datosExamenes={datosExamenes}
              onAgregarExamen={() => setMostrarModalExamen(true)}
              onCalificacionExamen={manejarCalificacionExamen}
              onEliminarExamen={manejarEliminarExamen}
            />
          )}
        </div>
      </div>

      {/* Modal Estudiante */}
      {mostrarModalEstudiante && (
        <div className="superposicion-modal">
          <div className="modal">
            <h3>{editandoEstudiante ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}</h3>
            <div className="grupo-formulario">
              <label>Código de Estudiante:</label>
              <input
                type="text"
                value={formularioEstudiante.codigo_estudiante}
                onChange={(e) => setFormularioEstudiante({...formularioEstudiante, codigo_estudiante: e.target.value})}
                placeholder="Ej: E001"
              />
            </div>
            <div className="grupo-formulario">
              <label>Nombre:</label>
              <input
                type="text"
                value={formularioEstudiante.nombre}
                onChange={(e) => setFormularioEstudiante({...formularioEstudiante, nombre: e.target.value})}
                placeholder="Ej: Juan"
              />
            </div>
            <div className="grupo-formulario">
              <label>Apellido:</label>
              <input
                type="text"
                value={formularioEstudiante.apellido}
                onChange={(e) => setFormularioEstudiante({...formularioEstudiante, apellido: e.target.value})}
                placeholder="Ej: Pérez"
              />
            </div>
            <div className="acciones-modal">
              <button onClick={() => {
                setMostrarModalEstudiante(false);
                setEditandoEstudiante(null);
                setFormularioEstudiante({ nombre: '', apellido: '', codigo_estudiante: '' });
              }}>Cancelar</button>
              <button onClick={manejarGuardarEstudiante} className="primario">
                {editandoEstudiante ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarea */}
      {mostrarModalTarea && (
        <div className="superposicion-modal">
          <div className="modal">
            <h3>Agregar Nueva Tarea</h3>
            <div className="grupo-formulario">
              <label>Título de la Tarea:</label>
              <input
                type="text"
                value={formularioTarea.titulo}
                onChange={(e) => setFormularioTarea({...formularioTarea, titulo: e.target.value})}
                placeholder="Ej: Tarea 1 - Álgebra"
              />
            </div>
            <div className="grupo-formulario">
              <label>Descripción:</label>
              <textarea
                value={formularioTarea.descripcion}
                onChange={(e) => setFormularioTarea({...formularioTarea, descripcion: e.target.value})}
                placeholder="Descripción de la tarea..."
                rows="3"
              />
            </div>
            <div className="acciones-modal">
              <button onClick={() => setMostrarModalTarea(false)}>Cancelar</button>
              <button onClick={manejarAgregarTarea} className="primario">Agregar Tarea</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Examen */}
      {mostrarModalExamen && (
        <div className="superposicion-modal">
          <div className="modal">
            <h3>Agregar Nuevo Examen</h3>
            <div className="grupo-formulario">
              <label>Título del Examen:</label>
              <input
                type="text"
                value={formularioExamen.titulo}
                onChange={(e) => setFormularioExamen({...formularioExamen, titulo: e.target.value})}
                placeholder="Ej: Examen Parcial 1"
              />
            </div>
            <div className="grupo-formulario">
              <label>Descripción:</label>
              <textarea
                value={formularioExamen.descripcion}
                onChange={(e) => setFormularioExamen({...formularioExamen, descripcion: e.target.value})}
                placeholder="Descripción del examen..."
                rows="3"
              />
            </div>
            <div className="acciones-modal">
              <button onClick={() => setMostrarModalExamen(false)}>Cancelar</button>
              <button onClick={manejarAgregarExamen} className="primario">Agregar Examen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionGrupo;