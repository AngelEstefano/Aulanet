import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../estilos/GestionExamenes.css';
import '../estilos/Globales.css';

const GestionExamenes = ({ estudiantes, datosExamenes, onAgregarExamen, onCalificacionExamen, onEliminarExamen }) => {
  const [alerta, setAlerta] = useState(null);
  const listaExamenes = Object.values(datosExamenes);
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

  // Función para el scroll horizontal - IDÉNTICA A GESTIONTAREAS
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

  // Effect para el event listener del scroll - IDÉNTICO A GESTIONTAREAS
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

  const manejarEliminarExamen = (examenId, tituloExamen) => {
    onEliminarExamen(examenId);
    setAlerta({ tipo: 'exito', mensaje: `Examen "${tituloExamen}" eliminado exitosamente` });
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
    <div className="pestaña-examenes">
      {/* Alertas */}
      {alerta && (
        <div className={`alerta-moderna ${alerta.tipo}`}>
          <span>{alerta.mensaje}</span>
        </div>
      )}

      <div className="encabezado-unificado">
        <div className="titulo-encabezado">
          <h3>Exámenes</h3>
          <span className="contador-item">{listaExamenes.length} exámenes</span>
        </div>
        <button className="boton-agregar boton-dinamico" onClick={onAgregarExamen}>
          + Agregar Examen
        </button>
      </div>
      
      {listaExamenes.length === 0 ? (
        <div className="sin-datos">
          <p>No hay exámenes asignados</p>
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="sin-datos">
          <p>No hay estudiantes en este grupo</p>
        </div>
      ) : (
        <div className="contenedor-tabla-scroll scroll-silencioso" ref={tablaRef}>
          <div className="tabla-examenes-unificada">
            {/* Encabezado de la tabla */}
            <div className="encabezado-tabla-unificada">
              {/* Columna combinada de Estudiante */}
              <div className="columna-estudiante-examenes">
                <div className="subcolumna-estudiante">
                  <h4>Estudiantes</h4>
                </div>
              </div>
              
              {/* Columnas de exámenes */}
              <div className="examenes-header">
                {listaExamenes.map(examen => (
                  <div key={examen.id} className="encabezado-examen-unificada">
                    <div className="titulo-examen-encabezado">
                      {examen.titulo}
                    </div>
                    <button 
                      className="boton-eliminar-examen"
                      onClick={() => manejarEliminarExamen(examen.id, examen.titulo)}
                      title="Eliminar examen"
                    >
                      <img src="https://i.postimg.cc/ryQY22Vy/eliminar.png" alt="Eliminar examen" />
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
                  <div className="celda-estudiante-examenes">
                    <div className="celda-info-estudiante">
                      <div className="nombre-estudiante">
                        {estudiante.nombre}
                      </div>
                    </div>
                  </div>
                  
                  {/* Celdas de calificaciones por examen */}
                  <div className="celdas-calificaciones">
                    {listaExamenes.map(examen => {
                      const calificacion = examen.calificaciones?.[estudiante.alumno_id] || '';
                      const colorFondo = obtenerColorCalificacion(calificacion);
                      
                      return (
                        <div key={examen.id} className="celda-calificacion-unificada">
                          <div className="contenedor-calificacion">
                            <input
                              type="text"
                              placeholder="Puntos"
                              value={calificacion}
                              onChange={(e) => onCalificacionExamen(examen.id, estudiante.alumno_id, e.target.value)}
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

export default GestionExamenes;