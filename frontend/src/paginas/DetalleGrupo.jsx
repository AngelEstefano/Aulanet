import React, { useState, useEffect } from 'react';
import GestionAsistencia from '../componentes/GestionAsistencia';
import GestionTareas from '../componentes/GestionTareas';
import GestionExamenes from '../componentes/GestionExamenes';
import { servicioEstudiantes } from '../servicios/serviciosEstudiantes';
import { servicioAsistencias } from '../servicios/serviciosAsistencias';  
import { servicioTareas } from '../servicios/serviciosTareas';
import '../estilos/DetalleGrupo.css';
import '../estilos/GestionAsistencia.css';

const DetalleGrupo = ({ grupo, onVolver, user }) => {
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
  const [datosTareas, setDatosTareas] = useState([]);
  const [datosExamenes, setDatosExamenes] = useState([]);
  const [mostrarModalTarea, setMostrarModalTarea] = useState(false);
  const [mostrarModalExamen, setMostrarModalExamen] = useState(false);
  const [formularioTarea, setFormularioTarea] = useState({ 
    titulo: '', 
    descripcion: '',
    tipo: 'tarea',
    fecha_entrega: '',
    puntaje_maximo: 100
  });
  const [formularioExamen, setFormularioExamen] = useState({ 
    titulo: '', 
    descripcion: '',
    tipo: 'examen',
    fecha_entrega: '',
    puntaje_maximo: 100
  });
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);

  // Alertas temporales
  useEffect(() => {
    if (alerta) {
      const timer = setTimeout(() => {
        setAlerta(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alerta]);

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

  const cargarDatosGrupo = async () => {
    try {
      setLoading(true);
      
      // Cargar estudiantes
      const estudiantesData = await servicioEstudiantes.obtenerPorClase(grupo.clase_id);
      setEstudiantes(estudiantesData);
      
      // Cargar asistencias
      const asistenciasData = await servicioAsistencias.obtenerPorClase(grupo.clase_id);
      
      // Convertir array a objeto para compatibilidad
      const asistenciasObj = {};
      asistenciasData.forEach(asist => {
        const clave = `${asist.inscripcion_id}_${asist.fecha}`;
        asistenciasObj[clave] = asist.estado_asistencia;
      });
      setDatosAsistencia(asistenciasObj);
      
      // Cargar tareas
      const tareasData = await servicioTareas.obtenerPorClase(grupo.clase_id);
      setDatosTareas(tareasData);
      
      // Cargar exámenes (filtrar tareas con tipo 'examen')
      const examenesData = tareasData.filter(tarea => tarea.tipo === 'examen');
      setDatosExamenes(examenesData);
      
      // Generar días de clase
      setDiasClase(generarDiasClase());
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al cargar los datos del grupo' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosGrupo();
  }, [grupo]);

  const manejarGuardarEstudiante = async () => {
    if (!formularioEstudiante.nombre || !formularioEstudiante.codigo_estudiante) {
      setAlerta({ tipo: 'advertencia', mensaje: 'Por favor ingresa nombre y código del estudiante' });
      return;
    }

    try {
      let resultado;
      
      if (editandoEstudiante) {
        resultado = await servicioEstudiantes.actualizar(editandoEstudiante.estudiante_id, {
          nombre: formularioEstudiante.nombre,
          apellido: formularioEstudiante.apellido,
          codigo_estudiante: formularioEstudiante.codigo_estudiante
        });
        setAlerta({ tipo: 'exito', mensaje: 'Estudiante actualizado exitosamente' });
      } else {
        resultado = await servicioEstudiantes.crear({
          nombre: formularioEstudiante.nombre,
          apellido: formularioEstudiante.apellido,
          codigo_estudiante: formularioEstudiante.codigo_estudiante
        });
        
        // Inscribir estudiante en la clase
        await servicioEstudiantes.inscribirEnClase(resultado.estudiante_id, grupo.clase_id);
        
        setAlerta({ tipo: 'exito', mensaje: 'Estudiante agregado exitosamente' });
      }
      
      // Recargar datos
      cargarDatosGrupo();
      
      setFormularioEstudiante({ nombre: '', apellido: '', codigo_estudiante: '' });
      setEditandoEstudiante(null);
      setMostrarModalEstudiante(false);
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al guardar estudiante: ' + error.message });
    }
  };

  const manejarEliminarEstudiante = async (estudianteId) => {
    try {
      const estudianteEliminado = estudiantes.find(est => est.estudiante_id === estudianteId);
      
      await servicioEstudiantes.eliminar(estudianteId);
      
      setAlerta({ tipo: 'exito', mensaje: `Estudiante "${estudianteEliminado?.nombre}" eliminado exitosamente` });
      
      // Recargar datos
      cargarDatosGrupo();
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al eliminar estudiante' });
    }
  };

  const manejarCambioAsistencia = async (inscripcionId, fecha, estado) => {
    try {
      // Buscar si ya existe una asistencia para esta fecha
      const asistenciaExistente = Object.keys(datosAsistencia).find(key => 
        key.includes(`${inscripcionId}_${fecha}`)
      );

      const datosAsistenciaObj = {
        inscripcion_id: inscripcionId,
        fecha: fecha,
        estado_asistencia: estado,
        registrado_por: user.usuario_id
      };

      if (asistenciaExistente) {
        // Actualizar asistencia existente
        // Necesitarías el ID de la asistencia
        // await servicioAsistencias.actualizar(asistenciaId, datosAsistenciaObj);
      } else {
        // Crear nueva asistencia
        await servicioAsistencias.registrar(datosAsistenciaObj);
      }

      // Actualizar estado local
      const asistenciaActualizada = {
        ...datosAsistencia,
        [`${inscripcionId}_${fecha}`]: estado
      };
      
      setDatosAsistencia(asistenciaActualizada);
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al guardar asistencia' });
    }
  };

  const manejarAgregarTarea = async () => {
    if (!formularioTarea.titulo) {
      setAlerta({ tipo: 'advertencia', mensaje: 'Por favor ingresa el título de la tarea' });
      return;
    }

    try {
      await servicioTareas.crear({
        clase_id: grupo.clase_id,
        titulo: formularioTarea.titulo,
        descripcion: formularioTarea.descripcion,
        tipo: formularioTarea.tipo,
        fecha_entrega: formularioTarea.fecha_entrega,
        puntaje_maximo: formularioTarea.puntaje_maximo,
        creado_por: user.usuario_id
      });
      
      setMostrarModalTarea(false);
      setFormularioTarea({ 
        titulo: '', 
        descripcion: '',
        tipo: 'tarea',
        fecha_entrega: '',
        puntaje_maximo: 100
      });
      
      setAlerta({ tipo: 'exito', mensaje: 'Tarea agregada exitosamente' });
      
      // Recargar tareas
      const tareasData = await servicioTareas.obtenerPorClase(grupo.clase_id);
      setDatosTareas(tareasData);
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al agregar tarea' });
    }
  };

  const manejarCalificacionTarea = async (tareaId, estudianteId, calificacion) => {
    try {
      // Buscar inscripción del estudiante
      const estudiante = estudiantes.find(est => est.estudiante_id === estudianteId);
      
      if (estudiante && estudiante.inscripcion_id) {
        await servicioTareas.calificar({
          inscripcion_id: estudiante.inscripcion_id,
          tarea_id: tareaId,
          puntaje: calificacion
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al guardar calificación' });
    }
  };

  const manejarEliminarTarea = async (tareaId) => {
    try {
      await servicioTareas.eliminar(tareaId);
      
      setAlerta({ tipo: 'exito', mensaje: 'Tarea eliminada exitosamente' });
      
      // Recargar tareas
      const tareasData = await servicioTareas.obtenerPorClase(grupo.clase_id);
      setDatosTareas(tareasData);
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al eliminar tarea' });
    }
  };

  const manejarAgregarExamen = async () => {
    if (!formularioExamen.titulo) {
      setAlerta({ tipo: 'advertencia', mensaje: 'Por favor ingresa el título del examen' });
      return;
    }

    try {
      await servicioTareas.crear({
        clase_id: grupo.clase_id,
        titulo: formularioExamen.titulo,
        descripcion: formularioExamen.descripcion,
        tipo: 'examen',
        fecha_entrega: formularioExamen.fecha_entrega,
        puntaje_maximo: formularioExamen.puntaje_maximo,
        creado_por: user.usuario_id
      });
      
      setMostrarModalExamen(false);
      setFormularioExamen({ 
        titulo: '', 
        descripcion: '',
        tipo: 'examen',
        fecha_entrega: '',
        puntaje_maximo: 100
      });
      
      setAlerta({ tipo: 'exito', mensaje: 'Examen agregado exitosamente' });
      
      // Recargar exámenes
      const tareasData = await servicioTareas.obtenerPorClase(grupo.clase_id);
      const examenesData = tareasData.filter(tarea => tarea.tipo === 'examen');
      setDatosExamenes(examenesData);
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al agregar examen' });
    }
  };

  const manejarEliminarExamen = async (examenId) => {
    try {
      await servicioTareas.eliminar(examenId);
      
      setAlerta({ tipo: 'exito', mensaje: 'Examen eliminado exitosamente' });
      
      // Recargar exámenes
      const tareasData = await servicioTareas.obtenerPorClase(grupo.clase_id);
      const examenesData = tareasData.filter(tarea => tarea.tipo === 'examen');
      setDatosExamenes(examenesData);
      
    } catch (error) {
      console.error('Error:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al eliminar examen' });
    }
  };

  return (
    <div className="detalle-grupo">
      {/* Alertas */}
      {alerta && (
        <div className={`alerta-moderna ${alerta.tipo}`}>
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {loading && (
        <div className="cargando">
          <p>Cargando datos...</p>
        </div>
      )}

      <div className="encabezado-detalle">
        <button 
          className="boton-volver boton-dinamico"
          onClick={onVolver}
        >
          ← Volver al Inicio
        </button>
        <h2>Grupo {grupo.grupo || grupo.nombre} - {grupo.materia_nombre}</h2>
        <button 
          className="boton-agregar-estudiante boton-dinamico"
          onClick={() => {
            setEditandoEstudiante(null);
            setFormularioEstudiante({ nombre: '', apellido: '', codigo_estudiante: '' });
            setMostrarModalEstudiante(true);
          }}
        >
          + Agregar Estudiante
        </button>
      </div>

      <div className="gestor-grupo">
        <div className="encabezado-gestor">
          <div className="info-grupo">
            <h2>Gestión del Grupo</h2>
            <span className="contador-estudiantes">{estudiantes.length} estudiantes</span>
          </div>
        </div>

        <div className="navegacion-pestañas">
          <button 
            className={`boton-pestaña boton-dinamico ${pestañaActiva === 'asistencia' ? 'activa' : ''}`}
            onClick={() => setPestañaActiva('asistencia')}
          >
            Asistencia
          </button>
          <button 
            className={`boton-pestaña boton-dinamico ${pestañaActiva === 'tareas' ? 'activa' : ''}`}
            onClick={() => setPestañaActiva('tareas')}
          >
            Tareas
          </button>
          <button 
            className={`boton-pestaña boton-dinamico ${pestañaActiva === 'examenes' ? 'activa' : ''}`}
            onClick={() => setPestañaActiva('examenes')}
          >
            Exámenes
          </button>
        </div>

        <div className="contenedor-contenido-pestaña">
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
              grupoPrincipal={{ id: grupo.clase_id, nombre: `${grupo.grupo || grupo.nombre} - ${grupo.materia_nombre}` }}
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
              onCalificacionExamen={manejarCalificacionTarea} // Reutilizar función de tareas
              onEliminarExamen={manejarEliminarExamen}
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
            />
          )}
        </div>
      </div>

      {/* Modal estudiante */}
      {mostrarModalEstudiante && (
        <div className="superposicion-modal">
          <div className="modal">
            <h3>{editandoEstudiante ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}</h3>
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
            <div className="grupo-formulario">
              <label>Código de Estudiante:</label>
              <input
                type="text"
                value={formularioEstudiante.codigo_estudiante}
                onChange={(e) => setFormularioEstudiante({...formularioEstudiante, codigo_estudiante: e.target.value})}
                placeholder="Ej: E001"
              />
            </div>
            <div className="acciones-modal">
              <button 
                className="secundario boton-dinamico"
                onClick={() => {
                  setMostrarModalEstudiante(false);
                  setEditandoEstudiante(null);
                  setFormularioEstudiante({ nombre: '', apellido: '', codigo_estudiante: '' });
                }}
              >
                Cancelar
              </button>
              <button 
                className="primario boton-dinamico" 
                onClick={manejarGuardarEstudiante}
              >
                {editandoEstudiante ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tarea */}
      {mostrarModalTarea && (
        <div className="superposicion-modal">
          <div className="modal">
            <h3>Agregar Nueva Tarea</h3>
            <div className="grupo-formulario">
              <label>Título:</label>
              <input
                type="text"
                value={formularioTarea.titulo}
                onChange={(e) => setFormularioTarea({...formularioTarea, titulo: e.target.value})}
                placeholder="Ej: Tarea 1"
              />
            </div>
            <div className="grupo-formulario">
              <label>Descripción:</label>
              <textarea
                value={formularioTarea.descripcion}
                onChange={(e) => setFormularioTarea({...formularioTarea, descripcion: e.target.value})}
                placeholder="Descripción de la tarea"
              />
            </div>
            <div className="grupo-formulario">
              <label>Fecha de Entrega:</label>
              <input
                type="date"
                value={formularioTarea.fecha_entrega}
                onChange={(e) => setFormularioTarea({...formularioTarea, fecha_entrega: e.target.value})}
              />
            </div>
            <div className="grupo-formulario">
              <label>Puntaje Máximo:</label>
              <input
                type="number"
                value={formularioTarea.puntaje_maximo}
                onChange={(e) => setFormularioTarea({...formularioTarea, puntaje_maximo: e.target.value})}
                min="0"
                max="1000"
              />
            </div>
            <div className="acciones-modal">
              <button 
                className="secundario boton-dinamico"
                onClick={() => setMostrarModalTarea(false)}
              >
                Cancelar
              </button>
              <button 
                className="primario boton-dinamico" 
                onClick={manejarAgregarTarea}
              >
                Agregar Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal examen */}
      {mostrarModalExamen && (
        <div className="superposicion-modal">
          <div className="modal">
            <h3>Agregar Nuevo Examen</h3>
            <div className="grupo-formulario">
              <label>Título:</label>
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
                placeholder="Descripción del examen"
              />
            </div>
            <div className="grupo-formulario">
              <label>Fecha:</label>
              <input
                type="date"
                value={formularioExamen.fecha_entrega}
                onChange={(e) => setFormularioExamen({...formularioExamen, fecha_entrega: e.target.value})}
              />
            </div>
            <div className="grupo-formulario">
              <label>Puntaje Máximo:</label>
              <input
                type="number"
                value={formularioExamen.puntaje_maximo}
                onChange={(e) => setFormularioExamen({...formularioExamen, puntaje_maximo: e.target.value})}
                min="0"
                max="1000"
              />
            </div>
            <div className="acciones-modal">
              <button 
                className="secundario boton-dinamico"
                onClick={() => setMostrarModalExamen(false)}
              >
                Cancelar
              </button>
              <button 
                className="primario boton-dinamico" 
                onClick={manejarAgregarExamen}
              >
                Agregar Examen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleGrupo;