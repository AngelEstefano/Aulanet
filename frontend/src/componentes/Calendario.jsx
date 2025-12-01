import React, { useState, useEffect } from 'react';
import { servicioEventos } from '../servicios/serviciosEventos'; // Importar servicio
import '../estilos/Calendario.css';

const Calendario = ({ grupos, user }) => {
  const [eventos, setEventos] = useState([]);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para modal de agregar evento
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    tipo_evento: 'general',
    clase_id: ''
  });

  // Cargar eventos
  const cargarEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio de eventos en lugar de fetch directo
      const eventosData = await servicioEventos.obtenerTodos();
      setEventos(eventosData);
      
      // Filtrar eventos para el mes actual por defecto
      const eventosMesActual = eventosData.filter(evento => {
        const fechaEvento = new Date(evento.fecha_inicio);
        return fechaEvento.getMonth() === mesActual && 
               fechaEvento.getFullYear() === anioActual;
      });
      setEventosFiltrados(eventosMesActual);
      
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setError('No se pudieron cargar los eventos');
      setEventos([]);
      setEventosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos al montar el componente
  useEffect(() => {
    cargarEventos();
  }, []);

  // Filtrar eventos cuando cambia el mes/año
  useEffect(() => {
    const eventosMesActual = eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha_inicio);
      return fechaEvento.getMonth() === mesActual && 
             fechaEvento.getFullYear() === anioActual;
    });
    setEventosFiltrados(eventosMesActual);
  }, [mesActual, anioActual, eventos]);

  // Navegación de meses
  const mesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(anioActual - 1);
    } else {
      setMesActual(mesActual - 1);
    }
  };

  const mesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(anioActual + 1);
    } else {
      setMesActual(mesActual + 1);
    }
  };

  // Función para agregar evento
  const agregarEvento = async () => {
    try {
      if (!nuevoEvento.titulo || !nuevoEvento.fecha_inicio || !nuevoEvento.clase_id) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      setLoading(true);
      
      // Formatear la fecha para incluir hora actual si no tiene
      let fechaFormateada = nuevoEvento.fecha_inicio;
      if (!fechaFormateada.includes('T')) {
        fechaFormateada += 'T12:00:00'; // Hora por defecto
      }

      const eventoData = {
        ...nuevoEvento,
        fecha_inicio: fechaFormateada,
        usuario_id: user.id || 1 // Ajustar según tu estructura de usuario
      };

      // Usar servicio para crear evento
      await servicioEventos.crear(eventoData);
      
      // Recargar eventos
      await cargarEventos();
      
      // Cerrar modal y resetear formulario
      setMostrarModal(false);
      setNuevoEvento({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        tipo_evento: 'general',
        clase_id: ''
      });
      
    } catch (error) {
      console.error('Error agregando evento:', error);
      alert('Error al agregar el evento');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target;
    setNuevoEvento(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Nombres de meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Tipos de eventos con colores
  const coloresEventos = {
    general: '#3498db',
    clase: '#2ecc71',
    examen: '#e74c3c',
    tarea: '#f39c12',
    festivo: '#9b59b6',
    suspension: '#95a5a6',
    reunion: '#1abc9c',
    vacaciones: '#e67e22'
  };

  return (
    <div className="contenedor-calendario">
      <div className="encabezado-calendario">
        <h2>Calendario Académico</h2>
        <p>Gestiona y visualiza todos los eventos programados</p>
        <button 
          onClick={() => setMostrarModal(true)} 
          className="boton-agregar-evento"
        >
          + Agregar Evento
        </button>
      </div>

      {/* Controles del calendario - solo navegación de meses */}
      <div className="controles-calendario">
        <div className="navegacion-meses">
          <button onClick={mesAnterior} className="boton-navegacion">
            ← Mes anterior
          </button>
          <h3>{nombresMeses[mesActual]} {anioActual}</h3>
          <button onClick={mesSiguiente} className="boton-navegacion">
            Mes siguiente →
          </button>
        </div>

        <button onClick={cargarEventos} className="boton-refrescar">
          ↻ Actualizar
        </button>
      </div>

      {/* Estado de carga/error */}
      {loading && (
        <div className="estado-carga">
          <div className="spinner"></div>
          <p>Cargando eventos...</p>
        </div>
      )}

      {error && (
        <div className="error-calendario">
          <p>{error}</p>
          <button onClick={cargarEventos}>Reintentar</button>
        </div>
      )}

      {/* Lista de eventos */}
      <div className="lista-eventos-calendario">
        {eventosFiltrados.length === 0 && !loading ? (
          <div className="sin-eventos">
            <p>No hay eventos programados para {nombresMeses[mesActual]} {anioActual}</p>
          </div>
        ) : (
          eventosFiltrados.map((evento, index) => {
            const fechaEvento = new Date(evento.fecha_inicio);
            const grupo = grupos.find(g => g.clase_id === evento.clase_id);
            
            return (
              <div 
                key={index} 
                className="evento-calendario"
                style={{
                  borderLeftColor: coloresEventos[evento.tipo_evento] || '#3498db'
                }}
              >
                <div className="fecha-evento">
                  <div className="dia-evento">{fechaEvento.getDate()}</div>
                  <div className="mes-evento">
                    {fechaEvento.toLocaleDateString('es-ES', { month: 'short' })}
                  </div>
                </div>
                
                <div className="detalles-evento">
                  <h4>{evento.titulo}</h4>
                  <p>{evento.descripcion}</p>
                  <div className="meta-evento">
                    <span className="tipo-evento" style={{
                      backgroundColor: coloresEventos[evento.tipo_evento] || '#3498db'
                    }}>
                      {evento.tipo_evento}
                    </span>
                    <span className="grupo-evento">
                      {grupo ? `${grupo.grupo || grupo.nombre} - ${grupo.materia_nombre}` : 'General'}
                    </span>
                    <span className="hora-evento">
                      {fechaEvento.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resumen */}
      <div className="resumen-calendario">
        <h4>Resumen del Mes</h4>
        <div className="estadisticas">
          <div className="estadistica">
            <span className="numero">{eventosFiltrados.length}</span>
            <span className="label">Eventos totales</span>
          </div>
          <div className="estadistica">
            <span className="numero">
              {eventosFiltrados.filter(e => e.tipo_evento === 'examen').length}
            </span>
            <span className="label">Exámenes</span>
          </div>
          <div className="estadistica">
            <span className="numero">
              {eventosFiltrados.filter(e => e.tipo_evento === 'tarea').length}
            </span>
            <span className="label">Tareas</span>
          </div>
        </div>
      </div>

      {/* Modal para agregar evento */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <div className="modal-encabezado">
              <h3>Agregar Nuevo Evento</h3>
              <button 
                onClick={() => setMostrarModal(false)} 
                className="cerrar-modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-cuerpo">
              <div className="formulario-grupo">
                <label>Título *</label>
                <input
                  type="text"
                  name="titulo"
                  value={nuevoEvento.titulo}
                  onChange={manejarCambioFormulario}
                  placeholder="Título del evento"
                  required
                />
              </div>

              <div className="formulario-grupo">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={nuevoEvento.descripcion}
                  onChange={manejarCambioFormulario}
                  placeholder="Descripción del evento"
                  rows="3"
                />
              </div>

              <div className="formulario-columnas">
                <div className="formulario-grupo">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={nuevoEvento.fecha_inicio}
                    onChange={manejarCambioFormulario}
                    required
                  />
                </div>

                <div className="formulario-grupo">
                  <label>Tipo de Evento *</label>
                  <select
                    name="tipo_evento"
                    value={nuevoEvento.tipo_evento}
                    onChange={manejarCambioFormulario}
                    required
                  >
                    <option value="general">General</option>
                    <option value="clase">Clase</option>
                    <option value="examen">Examen</option>
                    <option value="tarea">Tarea</option>
                    <option value="reunion">Reunión</option>
                    <option value="festivo">Festivo</option>
                    <option value="suspension">Suspensión</option>
                    <option value="vacaciones">Vacaciones</option>
                  </select>
                </div>
              </div>

              <div className="formulario-grupo">
                <label>Grupo *</label>
                <select
                  name="clase_id"
                  value={nuevoEvento.clase_id}
                  onChange={manejarCambioFormulario}
                  required
                >
                  <option value="">Seleccione un grupo</option>
                  {grupos.map(grupo => (
                    <option key={grupo.clase_id} value={grupo.clase_id}>
                      {grupo.grupo || grupo.nombre} - {grupo.materia_nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-pie">
              <button 
                onClick={() => setMostrarModal(false)} 
                className="boton-secundario"
              >
                Cancelar
              </button>
              <button 
                onClick={agregarEvento} 
                className="boton-primario"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;