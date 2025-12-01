import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../estilos/GestionAsistencia.css';
import '../estilos/Globales.css';
import '../estilos/DetalleGrupo.css';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

const GestionAsistencia = ({ estudiantes, diasClase, datosAsistencia, onCambioAsistencia, onEditarEstudiante, onEliminarEstudiante, grupoPrincipal }) => {
  const [comentarioActivo, setComentarioActivo] = useState(null);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [comentarioEditando, setComentarioEditando] = useState(null);
  const [modoEquipos, setModoEquipos] = useState(false);
  
  // Cargar equipos desde la base de datos
  const [equipos, setEquipos] = useState([]);
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', estudiantes: [], color: '' });
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [alerta, setAlerta] = useState(null);
  const tablaRef = useRef(null);

  // Obtener token de autenticación
  const obtenerToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Cargar equipos desde la base de datos
  const cargarEquipos = async () => {
    try {
      const token = obtenerToken();
      if (!grupoPrincipal?.clase_id) return;
      
      // Nota: Necesitarías crear un endpoint para equipos en el backend
      // Por ahora, mantendremos localStorage pero con estructura para migrar
      const equiposGuardados = localStorage.getItem('equiposAsistencia');
      if (equiposGuardados) {
        const todosLosEquipos = JSON.parse(equiposGuardados);
        // Filtrar equipos que pertenecen exclusivamente a este grupo principal
        const equiposFiltrados = todosLosEquipos.filter(equipo => equipo.grupoPrincipalId === grupoPrincipal?.clase_id) || [];
        setEquipos(equiposFiltrados);
      }
      
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  };

  // Calcular umbrales de faltas (20% y 21%)
  const umbralAmarillo = Math.ceil(diasClase.length * 0.20);
  const umbralRojo = umbralAmarillo + 1;

  // Alertas temporales
  useEffect(() => {
    if (alerta) {
      const timer = setTimeout(() => {
        setAlerta(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alerta]);

  // Cargar equipos al iniciar
  useEffect(() => {
    cargarEquipos();
  }, [grupoPrincipal]);

  // Función mejorada para el scroll horizontal
  const manejarScrollRueda = useCallback((e) => {
    if (!tablaRef.current) return;
    
    const rect = tablaRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const isMouseOverTable = (
      mouseX >= rect.left && 
      mouseX <= rect.right && 
      mouseY >= rect.top && 
      mouseY <= rect.bottom
    );
    
    if (isMouseOverTable) {
      e.preventDefault();
      e.stopPropagation();
      
      // Scroll horizontal MUY RÁPIDO
      const scrollSpeed = 1.5;
      tablaRef.current.scrollLeft += e.deltaY * scrollSpeed;
      
      return false;
    }
  }, []);

  // Effect para el event listener del scroll
  useEffect(() => {
    const tablaElement = tablaRef.current;
    if (!tablaElement) return;

    const manejarWheel = (e) => {
      manejarScrollRueda(e);
    };

    tablaElement.addEventListener('wheel', manejarWheel, { passive: false });
    
    return () => {
      tablaElement.removeEventListener('wheel', manejarWheel);
    };
  }, [manejarScrollRueda, tablaRef.current]);

  // Obtener estudiantes que no están en ningún equipo
  const estudiantesDisponibles = estudiantes.filter(estudiante => 
    !equipos.some(equipo => 
      equipo.estudiantes.some(est => est.estudiante_id === estudiante.estudiante_id)
    )
  );

  // Calcular faltas por estudiante desde datosAsistencia
  const calcularFaltas = (estudianteId) => {
    let faltas = 0;
    diasClase.forEach(fecha => {
      const fechaStr = fecha.toISOString().split('T')[0];
      const estudiante = estudiantes.find(e => e.estudiante_id === estudianteId);
      if (estudiante) {
        const claveAsistencia = `${estudiante.inscripcion_id}_${fechaStr}`;
        if (datosAsistencia[claveAsistencia] === 'falto' || datosAsistencia[claveAsistencia]?.includes('comentario:falto')) {
          faltas++;
        }
      }
    });
    return faltas;
  };

  // Obtener color de fondo según faltas
  const obtenerFondoFaltas = (faltas) => {
    if (faltas >= umbralRojo) return 'rgba(239, 68, 68, 0.15)';
    if (faltas >= umbralAmarillo) return 'rgba(245, 158, 11, 0.15)';
    return 'transparent';
  };

  // Función para crear equipo (mantenemos localStorage temporalmente)
  const crearEquipo = () => {
    if (!nuevoEquipo.nombre.trim()) {
      setAlerta({ tipo: 'error', mensaje: 'Ingrese el nombre del equipo' });
      return;
    }
    
    if (estudiantesSeleccionados.length === 0) {
      setAlerta({ tipo: 'error', mensaje: 'Seleccione al menos un estudiante' });
      return;
    }

    const color = `hsl(${Math.random() * 360}, 85%, 75%)`;
    
    // ORDENAR ESTUDIANTES ALFABÉTICAMENTE antes de guardar el equipo
    const estudiantesOrdenados = [...estudiantesSeleccionados].sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
    
    const equipo = {
      id: Date.now(),
      nombre: nuevoEquipo.nombre,
      estudiantes: estudiantesOrdenados,
      color: color,
      grupoPrincipalId: grupoPrincipal?.clase_id
    };
    
    // Guardar en localStorage temporalmente
    const equiposGuardados = localStorage.getItem('equiposAsistencia');
    let todosLosEquipos = [];
    
    if (equiposGuardados) {
      todosLosEquipos = JSON.parse(equiposGuardados);
      // Remover equipos antiguos de este grupo principal
      todosLosEquipos = todosLosEquipos.filter(equipo => equipo.grupoPrincipalId !== grupoPrincipal?.clase_id);
    }
    
    // Agregar equipos actuales de este grupo principal
    const equiposActualizados = [...todosLosEquipos, equipo];
    localStorage.setItem('equiposAsistencia', JSON.stringify(equiposActualizados));
    
    setEquipos([equipo]);
    setEstudiantesSeleccionados([]);
    setNuevoEquipo({ nombre: '', estudiantes: [], color: '' });
    setModoEquipos(false);
    setAlerta({ tipo: 'exito', mensaje: 'Equipo creado exitosamente' });
  };

  // Función para eliminar equipo
  const eliminarEquipo = (equipoId) => {
    const nuevosEquipos = equipos.filter(equipo => equipo.id !== equipoId);
    setEquipos(nuevosEquipos);
    
    // Actualizar localStorage
    const equiposGuardados = localStorage.getItem('equiposAsistencia');
    if (equiposGuardados) {
      const todosLosEquipos = JSON.parse(equiposGuardados);
      const equiposActualizados = todosLosEquipos.filter(equipo => equipo.id !== equipoId);
      localStorage.setItem('equiposAsistencia', JSON.stringify(equiposActualizados));
    }
    
    setAlerta({ tipo: 'exito', mensaje: 'Equipo eliminado exitosamente' });
  };

  // Ordenar equipos alfabéticamente
  const equiposOrdenados = [...equipos].sort((a, b) => 
    a.nombre.localeCompare(b.nombre)
  );

  // Ordenar estudiantes por equipos Y alfabéticamente
  const estudiantesOrdenados = [...estudiantes].sort((a, b) => {
    const equipoA = equipos.find(equipo => 
      equipo.estudiantes.some(est => est.estudiante_id === a.estudiante_id)
    );
    const equipoB = equipos.find(equipo => 
      equipo.estudiantes.some(est => est.estudiante_id === b.estudiante_id)
    );
    
    // Primero ordenar por equipo
    if (equipoA && !equipoB) return -1;
    if (!equipoA && equipoB) return 1;
    if (equipoA && equipoB) {
      if (equipoA.id !== equipoB.id) {
        return equipoA.nombre.localeCompare(equipoB.nombre);
      }
      // Mismo equipo - ordenar alfabéticamente
      return a.nombre.localeCompare(b.nombre);
    }
    
    // Sin equipo - ordenar alfabéticamente
    return a.nombre.localeCompare(b.nombre);
  });

  const obtenerColorAsistencia = (estado) => {
    if (estado && estado.startsWith('comentario:')) {
      const estadoReal = estado.split(':')[1];
      switch(estadoReal) {
        case 'presente': return '#10B981';
        case 'tarde': return '#F59E0B';
        case 'falto': return '#EF4444';
        default: return '#6B7280';
      }
    }
    
    switch(estado) {
      case 'presente': return '#10B981';
      case 'tarde': return '#F59E0B';
      case 'falto': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const manejarCambioAsistencia = (inscripcionId, fechaStr, valor) => {
    const estudiante = estudiantes.find(est => est.inscripcion_id === inscripcionId);
    if (estudiante) {
      const claveActual = `${inscripcionId}_${fechaStr}`;
      const estadoActual = datosAsistencia[claveActual];
      
      if (estadoActual && estadoActual.startsWith('comentario:')) {
        const partes = estadoActual.split(':');
        const comentario = partes.slice(3).join(':');
        onCambioAsistencia(inscripcionId, fechaStr, `comentario:${valor}:${fechaStr}:${comentario}`);
      } else {
        onCambioAsistencia(inscripcionId, fechaStr, valor);
      }
    }
  };

  // Abrir modal para agregar comentario
  const abrirModalAgregarComentario = (inscripcionId, fechaStr, estadoActual) => {
    setComentarioEditando({ inscripcionId, fechaStr });
    setComentarioTexto('');
  };

  // Abrir modal para ver comentario existente
  const abrirModalVerComentario = (inscripcionId, fechaStr, estadoActual) => {
    setComentarioActivo({ inscripcionId, fechaStr });
    
    if (estadoActual && estadoActual.startsWith('comentario:')) {
      const partes = estadoActual.split(':');
      const comentarioExistente = partes.slice(3).join(':');
      setComentarioTexto(comentarioExistente);
    } else {
      setComentarioTexto('');
    }
  };

  const guardarComentario = () => {
    if (comentarioEditando) {
      const fechaStr = comentarioEditando.fechaStr;
      const estudiante = estudiantes.find(est => 
        est.inscripcion_id === comentarioEditando.inscripcionId
      );
      
      if (estudiante) {
        const claveAsistencia = `${estudiante.inscripcion_id}_${fechaStr}`;
        const estadoActual = datosAsistencia[claveAsistencia];
        
        let estadoBase = '';
        if (estadoActual && estadoActual.startsWith('comentario:')) {
          estadoBase = estadoActual.split(':')[1];
        } else if (estadoActual && estadoActual !== 'comentario') {
          estadoBase = estadoActual;
        } else {
          estadoBase = 'presente'; // Estado por defecto si no hay nada
        }
        
        const nuevoEstado = comentarioTexto.trim() ? 
          `comentario:${estadoBase}:${fechaStr}:${comentarioTexto}` : 
          estadoBase;
          
        onCambioAsistencia(estudiante.inscripcion_id, fechaStr, nuevoEstado);
      }
      
      setComentarioEditando(null);
      setComentarioTexto('');
    }
  };

  const eliminarComentario = () => {
    if (comentarioActivo) {
      const fechaStr = comentarioActivo.fechaStr;
      const estudiante = estudiantes.find(est => 
        est.inscripcion_id === comentarioActivo.inscripcionId
      );
      
      if (estudiante) {
        const claveAsistencia = `${estudiante.inscripcion_id}_${fechaStr}`;
        const estadoActual = datosAsistencia[claveAsistencia];
        
        if (estadoActual && estadoActual.startsWith('comentario:')) {
          const estadoBase = estadoActual.split(':')[1];
          onCambioAsistencia(estudiante.inscripcion_id, fechaStr, estadoBase);
        }
      }
      
      setComentarioActivo(null);
      setComentarioTexto('');
    }
  };

  const cancelarComentario = () => {
    setComentarioActivo(null);
    setComentarioEditando(null);
    setComentarioTexto('');
  };

  const obtenerComentario = (estado) => {
    if (estado && estado.startsWith('comentario:')) {
      const partes = estado.split(':');
      if (partes.length >= 4) {
        return partes.slice(3).join(':');
      }
    }
    return null;
  };

  const obtenerEstadoBase = (estado) => {
    if (estado && estado.startsWith('comentario:')) {
      const partes = estado.split(':');
      return partes[1] || '';
    }
    return estado || '';
  };

  const toggleSeleccionEstudiante = (estudiante) => {
    if (estudiantesSeleccionados.some(est => est.estudiante_id === estudiante.estudiante_id)) {
      setEstudiantesSeleccionados(estudiantesSeleccionados.filter(est => est.estudiante_id !== estudiante.estudiante_id));
    } else {
      setEstudiantesSeleccionados([...estudiantesSeleccionados, estudiante]);
    }
  };

  const tieneComentario = (estado) => {
    return estado && estado.startsWith('comentario:') && estado.split(':').length >= 4;
  };

  // Obtener color de fondo - PRIORIDAD A FALTAS sobre equipos
  const obtenerFondoCombinado = (estudianteId, equipo) => {
    const faltas = calcularFaltas(estudianteId);
    const fondoFaltas = obtenerFondoFaltas(faltas);
    
    // Prioridad a faltas sobre equipos
    if (fondoFaltas !== 'transparent') {
      return fondoFaltas;
    } else if (equipo) {
      return `${equipo.color}15`; // Color de equipo muy atenuado
    }
    
    return 'transparent';
  };

  return (
    <div className="pestaña-asistencia">
      {/* Alertas */}
      {alerta && (
        <div className={`alerta-moderna ${alerta.tipo}`}>
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {/* Modal de Comentario - Lectura */}
      {comentarioActivo && (
        <div className="superposicion-modal">
          <div className="modal modal-comentario">
            <button 
              className="cerrar-modal-x"
              onClick={cancelarComentario}
              title="Cerrar"
            >
              ×
            </button>
            <h3>Comentario Guardado</h3>
            
            <div className="vista-comentario">
              <div className="comentario-guardado">
                <p>{comentarioTexto}</p>
              </div>
              <div className="acciones-modal">
                <button className="secundario" onClick={cancelarComentario}>
                  Cancelar
                </button>
                <button className="peligro" onClick={eliminarComentario}>
                  Eliminar Comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comentario - Edición */}
      {comentarioEditando && (
        <div className="superposicion-modal">
          <div className="modal modal-comentario">
            <h3>Agregar Comentario</h3>
            
            <div className="vista-edicion-comentario">
              <div className="grupo-formulario">
                <label>Comentario (máximo 100 caracteres)</label>
                <textarea
                  value={comentarioTexto}
                  onChange={(e) => setComentarioTexto(e.target.value.slice(0, 100))}
                  className="entrada-texto"
                  placeholder="Escribe tu comentario aquí..."
                  rows="3"
                  maxLength="100"
                  autoFocus
                />
                <div className="contador-caracteres">
                  {comentarioTexto.length}/100 caracteres
                </div>
              </div>
              <div className="acciones-modal">
                <button className="secundario" onClick={cancelarComentario}>Cancelar</button>
                <button className="primario" onClick={guardarComentario}>
                  Guardar Comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Equipo */}
      {modoEquipos && (
        <div className="superposicion-modal">
          <div className="modal modal-equipo">
            <h3>Crear Nuevo Equipo</h3>
            
            <div className="grupo-formulario">
              <label>Nombre del Equipo</label>
              <input
                type="text"
                value={nuevoEquipo.nombre}
                onChange={(e) => setNuevoEquipo({...nuevoEquipo, nombre: e.target.value})}
                className="entrada-texto"
                placeholder="Ej: Equipo de Ciencias"
              />
            </div>

            <div className="seleccion-estudiantes-contenedor">
              <div className="encabezado-seleccion">
                <h4>Seleccionar Estudiantes ({estudiantesSeleccionados.length} seleccionados)</h4>
              </div>
              <div className="lista-seleccion-estudiantes">
                {estudiantesDisponibles.map(estudiante => (
                  <div key={estudiante.estudiante_id} className="item-seleccion-estudiante">
                    <label>
                      <input
                        type="checkbox"
                        checked={estudiantesSeleccionados.some(est => est.estudiante_id === estudiante.estudiante_id)}
                        onChange={() => toggleSeleccionEstudiante(estudiante)}
                      />
                      <span>{estudiante.nombre} {estudiante.apellido}</span>
                    </label>
                  </div>
                ))}
              </div>
              
              {estudiantesDisponibles.length === 0 && (
                <div className="sin-estudiantes">
                  Todos los estudiantes ya están en equipos
                </div>
              )}
            </div>

            <div className="acciones-modal">
              <button 
                className="secundario"
                onClick={() => {
                  setModoEquipos(false);
                  setEstudiantesSeleccionados([]);
                  setNuevoEquipo({ nombre: '', estudiantes: [], color: '' });
                }}
              >
                Cancelar
              </button>
              <button 
                className="primario" 
                onClick={crearEquipo}
                disabled={estudiantesSeleccionados.length === 0}
              >
                Crear equipo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="encabezado-unificado">
        <div className="titulo-encabezado">
          <h3>Asistencia</h3>
          <span className="contador-dias-destacado">{diasClase.length} días</span>
        </div>
        
        <div className="estadisticas-asistencia">
          <div className="estadistica-item presente">
            <span className="estadistica-label">Presente</span>
          </div>
          <div className="estadistica-item tarde">
            <span className="estadistica-label">Tarde</span>
          </div>
          <div className="estadistica-item falta">
            <span className="estadistica-label">Falta</span>
          </div>
        </div>

        <div className="controles-equipos">
          <button 
            className="boton-equipos"
            onClick={() => setModoEquipos(true)}
            disabled={estudiantesDisponibles.length === 0}
          >
            Crear Equipo
          </button>
        </div>
      </div>

      {/* Lista de Equipos - ORDENADOS ALFABÉTICAMENTE */}
      {equiposOrdenados.length > 0 && (
        <div className="lista-equipos">
          <h4>Equipos Creados:</h4>
          <div className="contenedor-equipos">
            {equiposOrdenados.map(equipo => (
              <div 
                key={equipo.id} 
                className="tarjeta-equipo"
                style={{ borderLeftColor: equipo.color }}
              >
                <div className="encabezado-equipo">
                  <span className="nombre-equipo">{equipo.nombre}</span>
                  <button 
                    onClick={() => eliminarEquipo(equipo.id)}
                    className="boton-eliminar-equipo"
                    title="Eliminar equipo"
                  >
                    <img src="https://i.postimg.cc/ryQY22Vy/eliminar.png" alt="Eliminar equipo" />
                  </button>
                </div>
                <div className="lista-integrantes-equipo-vertical">
                  {equipo.estudiantes.map((est) => (
                    <div key={est.estudiante_id} className="integrante-equipo-vertical">
                      {est.nombre} {est.apellido}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {estudiantes.length === 0 ? (
        <div className="sin-datos">
          <p>No hay estudiantes en este grupo</p>
        </div>
      ) : diasClase.length === 0 ? (
        <div className="sin-datos">
          <p>No hay días de clase configurados para este grupo</p>
        </div>
      ) : (
        <div 
          className="contenedor-tabla-scroll scroll-silencioso"
          ref={tablaRef}
        >
          <div className="tabla-asistencia-unificada">
            <div className="encabezado-tabla-unificada">
              {/* Columna combinada de Estudiante y Acciones */}
              <div className="columna-estudiante-acciones">
                <div className="subcolumna-estudiante">
                  <h4>Estudiantes</h4>
                </div>
                <div className="subcolumna-acciones">
                  <h4>Acciones</h4>
                </div>
              </div>
              
              {/* Días de asistencia */}
              <div className="dias-asistencia">
                {diasClase.map((fecha, indice) => (
                  <div key={indice} className="encabezado-fecha-unificada">
                    <div className="dia-corto-fecha">
                      {fecha.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className="numero-fecha-negrita">
                      {fecha.getDate()}
                    </div>
                    <div className="mes-corto-fecha">
                      {fecha.toLocaleDateString('es-ES', { month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="cuerpo-tabla-unificada">
              {estudiantesOrdenados.map((estudiante, indiceFila) => {
                const faltas = calcularFaltas(estudiante.estudiante_id);
                const equipo = equipos.find(equipo => 
                  equipo.estudiantes.some(est => est.estudiante_id === estudiante.estudiante_id)
                );
                const fondoCombinado = obtenerFondoCombinado(estudiante.estudiante_id, equipo);
                
                return (
                  <div 
                    key={estudiante.estudiante_id} 
                    className={`fila-estudiante-unificada ${indiceFila % 2 === 0 ? 'par' : 'impar'}`}
                    style={{ background: fondoCombinado }}
                  >
                    {/* Celda combinada de Estudiante y Acciones */}
                    <div className="celda-estudiante-acciones">
                      <div className="celda-info-estudiante">
                        <div className="nombre-estudiante">
                          {estudiante.nombre} {estudiante.apellido}
                          {faltas >= umbralAmarillo && (
                            <span 
                              className="indicador-faltas"
                              style={{
                                color: faltas >= umbralRojo ? '#EF4444' : '#F59E0B',
                                fontWeight: 'bold'
                              }}
                            >
                              ({faltas} faltas)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="celda-acciones">
                        <button 
                          className="boton-accion editar"
                          onClick={() => onEditarEstudiante(estudiante)}
                          title="Editar estudiante"
                        >
                          <img src="https://i.postimg.cc/gJvFHS8D/editar.png" alt="Editar" />
                        </button>
                        <button 
                          className="boton-accion eliminar"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEliminarEstudiante(estudiante.estudiante_id);
                          }}
                          title="Eliminar estudiante"
                        >
                          <img src="https://i.postimg.cc/ryQY22Vy/eliminar.png" alt="Eliminar" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Celdas de asistencia */}
                    <div className="celdas-asistencia">
                      {diasClase.map((fecha, indiceColumna) => {
                        const fechaStr = fecha.toISOString().split('T')[0];
                        const claveAsistencia = `${estudiante.inscripcion_id}_${fechaStr}`;
                        const estadoActual = datosAsistencia[claveAsistencia];
                        const estadoBase = obtenerEstadoBase(estadoActual);
                        const comentario = obtenerComentario(estadoActual);
                        const tieneComent = tieneComentario(estadoActual);
                        
                        return (
                          <div key={indiceColumna} className="celda-asistencia-unificada">
                            <div className="contenedor-selector-asistencia">
                              <select 
                                value={estadoBase}
                                onChange={(e) => manejarCambioAsistencia(estudiante.inscripcion_id, fechaStr, e.target.value)}
                                className="selector-asistencia-unificado"
                                style={{ 
                                  backgroundColor: obtenerColorAsistencia(estadoActual),
                                  color: 'white'
                                }}
                              >
                                <option value="">-</option>
                                <option value="presente">P</option>
                                <option value="tarde">T</option>
                                <option value="falto">F</option>
                              </select>
                              
                              {/* Pestaña de comentarios */}
                              {estadoBase && (
                                <div className="contenedor-pestana-comentario">
                                  {!tieneComent ? (
                                    <div 
                                      className="pestana-comentario agregar"
                                      onClick={() => abrirModalAgregarComentario(estudiante.inscripcion_id, fechaStr, estadoActual)}
                                      title="Agregar comentario"
                                    >
                                      +
                                    </div>
                                  ) : (
                                    <div 
                                      className="pestana-comentario guardado"
                                      onClick={() => abrirModalVerComentario(estudiante.inscripcion_id, fechaStr, estadoActual)}
                                      title="Ver comentario"
                                    >
                                      1
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAsistencia;