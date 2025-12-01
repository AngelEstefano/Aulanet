import React, { useState, useEffect } from 'react';
import { useApp } from '../contextos/AppContext';
import Calendario from '../componentes/Calendario';
import Reportes from '../componentes/Reportes';
import DetalleGrupo from './DetalleGrupo';
import { servicioclases } from '../servicios/serviciosGrupos';
import { servicioEventos } from '../servicios/serviciosEventos';
import '../estilos/Dashboard.css';
import '../estilos/Calendario.css';
import '../estilos/Reportes.css';

const Dashboard = ({ user, onLogout }) => {
  const { state, dispatch } = useApp();
  const [seccionActiva, setSeccionActiva] = useState('inicio');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);

  // Efecto para alertas temporales
  useEffect(() => {
    if (alerta) {
      const timer = setTimeout(() => {
        setAlerta(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alerta]);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      const data = await servicioclases.obtenerTodos();
      // Filtrar grupos por profesor si es necesario
      const gruposProfesor = data.filter(grupo => 
        grupo.profesor_id === user.usuario_id
      );
      setGrupos(gruposProfesor);
      dispatch({ type: 'SET_GRUPOS', payload: gruposProfesor });
    } catch (error) {
      console.error('Error cargando grupos:', error);
      setAlerta({ tipo: 'error', mensaje: 'Error al cargar grupos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.usuario_id) {
      cargarGrupos();
    }
  }, [user]);

  if (seccionActiva === 'detalle-grupo' && grupoSeleccionado) {
    return (
      <DetalleGrupo 
        grupo={grupoSeleccionado} 
        onVolver={() => setSeccionActiva('inicio')}
        user={user}
      />
    );
  }

  return (
    <div className="contenedor-dashboard">
      {/* Alertas */}
      {alerta && (
        <div className={`alerta-moderna ${alerta.tipo}`}>
          <span>{alerta.mensaje}</span>
        </div>
      )}

      <div className="barra-lateral">
        <div className="encabezado-barra-lateral">
          <img 
            src="https://i.postimg.cc/B6XgCnRm/Logo.png" 
            alt="AULANET Logo"
            className="logo-barra-lateral"
          />
          <span className="titulo-barra-lateral">AULANET</span>
        </div>

        <nav className="navegacion-barra-lateral">
          <button 
            className={`item-navegacion ${seccionActiva === 'inicio' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('inicio')}
          >
            <img 
              src="https://i.postimg.cc/C56f7xhK/casa.png" 
              alt="Inicio" 
              className="icono-navegacion"
            />
            <span className="texto-navegacion">Inicio</span>
          </button>

          <button 
            className={`item-navegacion ${seccionActiva === 'calendario' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('calendario')}
          >
            <img 
              src="https://i.postimg.cc/T3bCKZ04/calendario-blanco.png" 
              alt="Calendario" 
              className="icono-navegacion"
            />
            <span className="texto-navegacion">Calendario</span>
          </button>

          <button 
            className={`item-navegacion ${seccionActiva === 'reportes' ? 'activo' : ''}`}
            onClick={() => setSeccionActiva('reportes')}
          >
            <img 
              src="https://i.postimg.cc/tJYqRR76/informe-seo.png" 
              alt="Reportes" 
              className="icono-navegacion"
            />
            <span className="texto-navegacion">Reportes</span>
          </button>
        </nav>

        <div className="pie-barra-lateral">
          <button 
            className="boton-cerrar-sesion" 
            onClick={onLogout}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="contenido-principal">
        <header className="encabezado-principal">
          <div className="contenido-encabezado">
            <h1>¡Hola, {user?.nombre || 'Profesor'}!</h1>
            {loading ? (
              <p>Cargando...</p>
            ) : (
              <p>
                {grupos.reduce((total, grupo) => {
                  return total + (grupo.total_estudiantes || 0);
                }, 0)} Estudiantes te esperan
              </p>
            )}
          </div>
        </header>

        <div className="contenido-dashboard">
          {seccionActiva === 'inicio' && (
            <SeccionInicio 
              grupos={grupos}
              onSeleccionarGrupo={(grupo) => {
                setGrupoSeleccionado(grupo);
                setSeccionActiva('detalle-grupo');
              }}
              onCargarGrupos={cargarGrupos}
              onVerCalendario={() => setSeccionActiva('calendario')}
              onMostrarAlerta={setAlerta}
              user={user}
            />
          )}

          {seccionActiva === 'calendario' && (
            <Calendario grupos={grupos} user={user} />
          )}

          {seccionActiva === 'reportes' && (
            <Reportes grupos={grupos} user={user} />
          )}
        </div>
      </div>
    </div>
  );
};

const SeccionInicio = ({ grupos, onSeleccionarGrupo, onCargarGrupos, onVerCalendario, onMostrarAlerta, user }) => {
  const [mostrarModalGrupo, setMostrarModalGrupo] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [grupoAEliminar, setGrupoAEliminar] = useState(null);
  const [editandoGrupo, setEditandoGrupo] = useState(null);
  const [formularioGrupo, setFormularioGrupo] = useState({ 
    nombre: '', 
    materia_nombre: '',
    grado: '',
    grupo: '',
    fecha_inicio: '', 
    fecha_fin: '', 
    dias_clase: [] 
  });
  const [proximosEventos, setProximosEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  // Calcular progreso del grupo basado en fechas
  const calcularProgreso = (grupo) => {
    const fechaInicio = new Date(grupo.fecha_inicio);
    const fechaFin = new Date(grupo.fecha_fin);
    const hoy = new Date();
    
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return 0;
    }
    
    if (hoy < fechaInicio) {
      return 0;
    }
    
    if (hoy > fechaFin) {
      return 100;
    }
    
    const tiempoTotal = fechaFin.getTime() - fechaInicio.getTime();
    const tiempoTranscurrido = hoy.getTime() - fechaInicio.getTime();
    
    const progreso = Math.min(100, Math.max(0, (tiempoTranscurrido / tiempoTotal) * 100));
    return Math.round(progreso);
  };

  // Obtener próximos eventos
  useEffect(() => {
    const obtenerEventos = async () => {
      try {
        setLoadingEventos(true);
        const hoy = new Date();
        const eventosTodos = [];
        
        // Obtener eventos de cada grupo
        for (const grupo of grupos) {
          try {
            const eventos = await servicioEventos.obtenerPorClase(grupo.clase_id);
            eventosTodos.push(...eventos.filter(evento => 
              new Date(evento.fecha_inicio) >= hoy
            ));
          } catch (error) {
            console.error(`Error cargando eventos para grupo ${grupo.clase_id}:`, error);
          }
        }
        
        // Ordenar por fecha
        setProximosEventos(
          eventosTodos.sort((a, b) => 
            new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
          ).slice(0, 5) // Mostrar solo 5 próximos
        );
      } catch (error) {
        console.error('Error cargando eventos:', error);
      } finally {
        setLoadingEventos(false);
      }
    };

    if (grupos.length > 0) {
      obtenerEventos();
    }
  }, [grupos]);

  const manejarEditarGrupo = (grupo) => {
    setEditandoGrupo(grupo);
    setFormularioGrupo({
      nombre: grupo.nombre || '',
      materia_nombre: grupo.materia_nombre || '',
      grado: grupo.grado || '',
      grupo: grupo.grupo || '',
      fecha_inicio: grupo.fecha_inicio || '',
      fecha_fin: grupo.fecha_fin || '',
      dias_clase: grupo.dias_clase || []
    });
    setMostrarModalGrupo(true);
  };

  const manejarEliminarClick = (grupo) => {
    setGrupoAEliminar(grupo);
    setMostrarModalEliminar(true);
  };

  const confirmarEliminarGrupo = async () => {
    if (grupoAEliminar) {
      try {
        await servicioclases.eliminar(grupoAEliminar.clase_id);
        onCargarGrupos();
        onMostrarAlerta({ tipo: 'exito', mensaje: 'Grupo eliminado exitosamente' });
      } catch (error) {
        console.error('Error:', error);
        onMostrarAlerta({ tipo: 'error', mensaje: 'Error al eliminar el grupo' });
      }
    }
    setMostrarModalEliminar(false);
    setGrupoAEliminar(null);
  };

  const cancelarEliminarGrupo = () => {
    setMostrarModalEliminar(false);
    setGrupoAEliminar(null);
  };

  const manejarGuardarGrupo = async () => {
    // Validaciones básicas
    if (!formularioGrupo.materia_nombre.trim()) {
      onMostrarAlerta({ tipo: 'error', mensaje: 'El nombre de la materia es requerido' });
      return;
    }
    if (!formularioGrupo.nombre.trim()) {
      onMostrarAlerta({ tipo: 'error', mensaje: 'El nombre del grupo es requerido' });
      return;
    }
    if (!formularioGrupo.fecha_inicio) {
      onMostrarAlerta({ tipo: 'error', mensaje: 'La fecha de inicio es requerida' });
      return;
    }
    if (!formularioGrupo.fecha_fin) {
      onMostrarAlerta({ tipo: 'error', mensaje: 'La fecha de fin es requerida' });
      return;
    }

    try {
      const datosGrupo = {
        profesor_id: user.usuario_id,
        nombre: formularioGrupo.nombre,
        materia_nombre: formularioGrupo.materia_nombre,
        grado: formularioGrupo.grado,
        grupo: formularioGrupo.grupo,
        fecha_inicio: formularioGrupo.fecha_inicio,
        fecha_fin: formularioGrupo.fecha_fin,
        dias_clase: formularioGrupo.dias_clase,
        ciclo_id: 1 // Deberías obtener el ciclo activo de la BD
      };

      if (editandoGrupo) {
        await servicioclases.actualizar(editandoGrupo.clase_id, datosGrupo);
        onMostrarAlerta({ tipo: 'exito', mensaje: 'Grupo actualizado exitosamente' });
      } else {
        await servicioclases.crear(datosGrupo);
        onMostrarAlerta({ tipo: 'exito', mensaje: 'Grupo creado exitosamente' });
      }
      
      onCargarGrupos();
      
      setFormularioGrupo({ 
        nombre: '', 
        materia_nombre: '',
        grado: '',
        grupo: '',
        fecha_inicio: '', 
        fecha_fin: '', 
        dias_clase: [] 
      });
      setEditandoGrupo(null);
      setMostrarModalGrupo(false);
      
    } catch (error) {
      console.error('Error:', error);
      onMostrarAlerta({ tipo: 'error', mensaje: 'Error al guardar el grupo: ' + error.message });
    }
  };

  return (
    <div className="seccion-inicio">
      <div className="tarjeta-bienvenida-moderna">
        <div className="contenido-bienvenida">
          <h2>Panel de Inicio</h2>
          <p>Gestiona tus grupos y actividades académicas</p>
        </div>
        <div className="icono-bienvenida">
        </div>
      </div>

      <div className="contenedor-tarjetas-moderno">
        <div className="tarjeta-moderna tarjeta-grupos-moderna">
          <div className="encabezado-tarjeta-moderna">
            <div className="titulo-encabezado-moderno">
              <h3>Grupos Asignados</h3>
              <span className="contador-grupos">{grupos.length} grupos</span>
            </div>
            <button 
              className="boton-agregar-moderno"
              onClick={() => {
                setEditandoGrupo(null);
                setFormularioGrupo({ 
                  nombre: '', 
                  materia_nombre: '',
                  grado: '',
                  grupo: '',
                  fecha_inicio: '', 
                  fecha_fin: '', 
                  dias_clase: [] 
                });
                setMostrarModalGrupo(true);
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span>+ Agregar Grupo</span>
            </button>
          </div>
          
          {grupos.length === 0 ? (
            <div className="sin-datos-moderno">
              <div className="icono-sin-datos">
                <img src="https://i.postimg.cc/X7gNbJZq/ojo-abierto.png" alt="Sin datos" />
              </div>
              <p>No hay grupos asignados</p>
              <small>¡Agrega tu primer grupo para comenzar!</small>
            </div>
          ) : (
            <div className="contenedor-tabla-moderno">
              <table className="tabla-moderna">
                <thead>
                  <tr>
                    <th>Sección</th>
                    <th>Materia</th>
                    <th>Progreso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(grupo => (
                    <tr key={grupo.clase_id} className="fila-tabla-moderna">
                      <td className="celda-seccion-moderna">
                        <div className="badge-seccion">{grupo.grupo || grupo.nombre}</div>
                      </td>
                      <td className="celda-materia-moderna">
                        <strong>{grupo.materia_nombre}</strong>
                        <div className="info-adicional">
                          {grupo.dias_clase?.join(', ').substring(0, 20)}...
                        </div>
                      </td>
                      <td className="celda-progreso-moderna">
                        <div className="contenedor-progreso">
                          <div className="barra-progreso">
                            <div 
                              className="progreso-fill"
                              style={{ width: `${calcularProgreso(grupo)}%` }}
                            ></div>
                          </div>
                          <span className="porcentaje-progreso">
                            {calcularProgreso(grupo)}%
                          </span>
                        </div>
                      </td>
                      <td className="celda-acciones-moderna">
                        <div className="contenedor-acciones">
                          <button 
                            className="boton-accion-moderno ver"
                            onClick={() => onSeleccionarGrupo(grupo)}
                            title="Ver grupo"
                          >
                            <img src="https://i.postimg.cc/X7gNbJZq/ojo-abierto.png" alt="Ver" />
                          </button>
                          <button 
                            className="boton-accion-moderno editar"
                            onClick={() => manejarEditarGrupo(grupo)}
                            title="Editar grupo"
                          >
                            <img src="https://i.postimg.cc/gJvFHS8D/editar.png" alt="Editar" />
                          </button>
                          <button 
                            className="boton-accion-moderno eliminar"
                            onClick={() => manejarEliminarClick(grupo)}
                            title="Eliminar grupo"
                          >
                            <img src="https://i.postimg.cc/ryQY22Vy/eliminar.png" alt="Eliminar" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="tarjeta-moderna tarjeta-eventos-moderna">
          <div className="encabezado-tarjeta-moderna">
            <div className="titulo-encabezado-moderno">
              <h3>Próximos Eventos</h3>
              <span className="contador-eventos">{proximosEventos.length} eventos</span>
            </div>
          </div>
          
          <div className="lista-eventos-moderna">
            {loadingEventos ? (
              <div className="sin-eventos-moderno">
                <p>Cargando eventos...</p>
              </div>
            ) : proximosEventos.length === 0 ? (
              <div className="sin-eventos-moderno">
                <div className="icono-sin-eventos">
                  <img src="https://i.postimg.cc/T3bCKZ04/calendario-blanco.png" alt="Sin eventos" />
                </div>
                <p>No hay eventos próximos</p>
                <small>Los eventos aparecerán aquí cuando los agregues</small>
              </div>
            ) : (
              proximosEventos.map((evento, indice) => (
                <div key={indice} className="item-evento-moderno">
                  <div className="indicador-fecha">
                    <div className="dia">{new Date(evento.fecha_inicio).getDate()}</div>
                    <div className="mes">{new Date(evento.fecha_inicio).toLocaleDateString('es-ES', { month: 'short' })}</div>
                  </div>
                  <div className="contenido-evento">
                    <div className="titulo-evento-moderno">{evento.titulo}</div>
                    <div className="grupo-evento-moderno">
                      {grupos.find(g => g.clase_id === evento.clase_id)?.nombre || 'General'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="pie-tarjeta-moderno">
            <button 
              className="boton-calendario-moderno"
              onClick={onVerCalendario}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              VER CALENDARIO COMPLETO
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar grupo */}
      {mostrarModalGrupo && (
        <ModalGrupo 
          formularioGrupo={formularioGrupo}
          setFormularioGrupo={setFormularioGrupo}
          editandoGrupo={editandoGrupo}
          onGuardar={manejarGuardarGrupo}
          onCerrar={() => {
            setMostrarModalGrupo(false);
            setEditandoGrupo(null);
            setFormularioGrupo({ 
              nombre: '', 
              materia_nombre: '',
              grado: '',
              grupo: '',
              fecha_inicio: '', 
              fecha_fin: '', 
              dias_clase: [] 
            });
          }}
        />
      )}

      {/* Modal de confirmación para eliminar grupo */}
      {mostrarModalEliminar && grupoAEliminar && (
        <ModalConfirmacionEliminar
          grupo={grupoAEliminar}
          onConfirmar={confirmarEliminarGrupo}
          onCancelar={cancelarEliminarGrupo}
        />
      )}
    </div>
  );
};

const ModalGrupo = ({ formularioGrupo, setFormularioGrupo, editandoGrupo, onGuardar, onCerrar }) => {
  const manejarToggleDia = (dia) => {
    const diasActualizados = formularioGrupo.diasClase.includes(dia)
      ? formularioGrupo.diasClase.filter(d => d !== dia)
      : [...formularioGrupo.diasClase, dia];
    
    setFormularioGrupo({ ...formularioGrupo, diasClase: diasActualizados });
  };

  return (
    <div className="superposicion-modal">
      <div className="modal modal-moderno">
        <div className="encabezado-modal-moderno">
          <h3>{editandoGrupo ? 'Editar Grupo' : 'Agregar Nuevo Grupo'}</h3>
          <button className="cerrar-modal" onClick={onCerrar}>×</button>
        </div>
        
        <div className="cuerpo-modal">
          <div className="grupo-formulario-moderno">
            <label>Nombre de la Materia:</label>
            <input
              type="text"
              value={formularioGrupo.materia_nombre}
              onChange={(e) => setFormularioGrupo({...formularioGrupo, materia_nombre: e.target.value})}
              placeholder="Ej: Matemáticas"
              className="entrada-moderna"
            />
          </div>
          
          <div className="grupo-formulario-moderno">
            <label>Nombre del Grupo:</label>
            <input
              type="text"
              value={formularioGrupo.nombre}
              onChange={(e) => setFormularioGrupo({...formularioGrupo, nombre: e.target.value})}
              placeholder="Ej: Matemáticas 3A"
              className="entrada-moderna"
            />
          </div>
          
          <div className="fila-formulario-moderna">
            <div className="grupo-formulario-moderno">
              <label>Grado:</label>
              <input
                type="text"
                value={formularioGrupo.grado}
                onChange={(e) => setFormularioGrupo({...formularioGrupo, grado: e.target.value})}
                placeholder="Ej: 3"
                className="entrada-moderna"
              />
            </div>
            
            <div className="grupo-formulario-moderno">
              <label>Sección:</label>
              <input
                type="text"
                value={formularioGrupo.grupo}
                onChange={(e) => setFormularioGrupo({...formularioGrupo, grupo: e.target.value})}
                placeholder="Ej: A"
                className="entrada-moderna"
              />
            </div>
          </div>
          
          <div className="fila-formulario-moderna">
            <div className="grupo-formulario-moderno">
              <label>Fecha de Inicio:</label>
              <input
                type="date"
                value={formularioGrupo.fecha_inicio}
                onChange={(e) => setFormularioGrupo({...formularioGrupo, fecha_inicio: e.target.value})}
                className="entrada-moderna"
              />
            </div>
            
            <div className="grupo-formulario-moderno">
              <label>Fecha de Fin:</label>
              <input
                type="date"
                value={formularioGrupo.fecha_fin}
                onChange={(e) => setFormularioGrupo({...formularioGrupo, fecha_fin: e.target.value})}
                className="entrada-moderna"
              />
            </div>
          </div>
          
          <div className="grupo-formulario-moderno">
            <label>Días de Clase:</label>
            <div className="selector-dias-moderno">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(dia => (
                <button
                  key={dia}
                  type="button"
                  className={`boton-dia-moderno ${formularioGrupo.diasClase.includes(dia) ? 'seleccionado' : ''}`}
                  onClick={() => manejarToggleDia(dia)}
                >
                  {dia.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pie-modal-moderno">
          <button onClick={onCerrar} className="boton-secundario">Cancelar</button>
          <button onClick={onGuardar} className="boton-primario">
            {editandoGrupo ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalConfirmacionEliminar = ({ grupo, onConfirmar, onCancelar }) => {
  return (
    <div className="superposicion-modal">
      <div className="modal modal-eliminar">
        <div className="encabezado-modal-eliminar">
          <div className="icono-advertencia">
            <img src="https://i.postimg.cc/ryQY22Vy/eliminar.png" alt="Advertencia" />
          </div>
          <h3>¿Eliminar Grupo?</h3>
        </div>
        
        <div className="cuerpo-modal-eliminar">
          <p>Estás a punto de eliminar el grupo:</p>
          <div className="info-grupo-eliminar">
            <strong>{grupo.materia_nombre}</strong>
            <span>Sección: {grupo.grupo || grupo.nombre}</span>
          </div>
          <p className="advertencia-texto">
            Esta acción eliminará todos los datos asociados al grupo, incluyendo estudiantes, 
            asistencias, tareas y exámenes. <strong>Esta acción no se puede deshacer.</strong>
          </p>
        </div>
        
        <div className="pie-modal-eliminar">
          <button onClick={onCancelar} className="boton-cancelar-eliminar">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="boton-confirmar-eliminar">
            Sí, Eliminar Grupo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;