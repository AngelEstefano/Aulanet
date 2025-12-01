import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../estilos/GestionTareas.css';  
import '../estilos/Globales.css';

const GestionTareas = ({ estudiantes, datosTareas, onAgregarTarea, onCalificacionTarea, onEliminarTarea }) => {
  const [alerta, setAlerta] = useState(null);
  const listaTareas = Object.values(datosTareas);
  const tablaRef = useRef(null);
  
  // Ordenar estudiantes alfabéticamente
  const estudiantesOrdenados = [...estudiantes].sort((a, b) => 
    a.nombre.localeCompare(b.nombre)
  );

  // Alertas temporales
  useEffect(() => {
    if (alerta) {
      const timer = setTimeout(() => {
        setAlerta(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alerta]);

  // Función mejorada para el scroll horizontal - IDÉNTICA A GESTIONASISTENCIA
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
      const scrollSpeed = .5;
      tablaRef.current.scrollLeft += e.deltaY * scrollSpeed;
      
      return false;
    }
  }, []);

  // Effect para el event listener del scroll - IDÉNTICO A GESTIONASISTENCIA
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
  }, [manejarScrollRueda]);

  const manejarEliminarTarea = (tareaId, tituloTarea) => {
    onEliminarTarea(tareaId);
    setAlerta({ tipo: 'exito', mensaje: `Tarea "${tituloTarea}" eliminada exitosamente` });
  };

  // Función para determinar el color de fondo según la calificación
  const obtenerColorCalificacion = (calificacion) => {
    if (!calificacion || calificacion === '') return 'transparent';
    
    const califNumero = parseFloat(calificacion);
    if (isNaN(califNumero)) return 'transparent';
    
    if (califNumero < 60) {
      return 'rgba(239, 68, 68, 0.15)'; // Rojo para menos de 60
    }
    
    return 'transparent';
  };

  return (
    <div className="pestaña-tareas">
      {/* Alertas */}
      {alerta && (
        <div className={`alerta-moderna ${alerta.tipo}`}>
          <span>{alerta.mensaje}</span>
        </div>
      )}

      <div className="encabezado-unificado">
        <div className="titulo-encabezado">
          <h3>Tareas</h3>
          <span className="contador-item">{listaTareas.length} tareas</span>
        </div>
        <button className="boton-agregar boton-dinamico" onClick={onAgregarTarea}>
          + Agregar Tarea
        </button>
      </div>
      
      {listaTareas.length === 0 ? (
        <div className="sin-datos">
          <p>No hay tareas asignadas</p>
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="sin-datos">
          <p>No hay estudiantes en este grupo</p>
        </div>
      ) : (
        <div className="contenedor-tabla-scroll scroll-silencioso"  ref={tablaRef}>
          <div className="tabla-tareas-unificada">
            {/* Encabezado de la tabla */}
            <div className="encabezado-tabla-unificada">
              {/* Columna combinada de Estudiante */}
              <div className="columna-estudiante-tareas">
                <div className="subcolumna-estudiante">
                  <h4>Estudiantes</h4>
                </div>
              </div>
              
              {/* Columnas de tareas */}
              <div className="tareas-header">
                {listaTareas.map(tarea => (
                  <div key={tarea.id} className="encabezado-tarea-unificada">
                    <div className="titulo-tarea-encabezado">
                      {tarea.titulo}
                    </div>
                    <button 
                      className="boton-eliminar-tarea"
                      onClick={() => manejarEliminarTarea(tarea.id, tarea.titulo)}
                      title="Eliminar tarea"
                    >
                      <img src="https://i.postimg.cc/ryQY22Vy/eliminar.png" alt="Eliminar tarea" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Cuerpo de la tabla */}
            <div className="cuerpo-tabla-unificada">
              {estudiantesOrdenados.map((estudiante, indiceFila) => (
                <div 
                  key={estudiante.alumno_id} 
                  className={`fila-estudiante-unificada ${indiceFila % 2 === 0 ? 'par' : 'impar'}`}
                >
                  {/* Celda del estudiante */}
                  <div className="celda-estudiante-tareas">
                    <div className="celda-info-estudiante">
                      <div className="nombre-estudiante">
                        {estudiante.nombre}
                      </div>
                    </div>
                  </div>
                  
                  {/* Celdas de calificaciones por tarea */}
                  <div className="celdas-calificaciones">
                    {listaTareas.map(tarea => {
                      const calificacion = tarea.calificaciones?.[estudiante.alumno_id] || '';
                      const colorFondo = obtenerColorCalificacion(calificacion);
                      
                      return (
                        <div key={tarea.id} className="celda-calificacion-unificada">
                          <div className="contenedor-calificacion">
                            <input
                              type="text"
                              placeholder="Calif."
                              value={calificacion}
                              onChange={(e) => onCalificacionTarea(tarea.id, estudiante.alumno_id, e.target.value)}
                              className="entrada-calificacion-tabla"
                              style={{ backgroundColor: colorFondo }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTareas;