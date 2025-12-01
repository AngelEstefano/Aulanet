import { api } from './api';

export const servicioTareas = {
  obtenerPorClase: (idClase) => 
    api.solicitar(`/tareas/clase/${idClase}`),

  crear: (datosTarea) => 
    api.solicitar('/tareas', {
      method: 'POST',
      body: datosTarea
    }),

  actualizar: (id, datosTarea) => 
    api.solicitar(`/tareas/${id}`, {
      method: 'PUT',
      body: datosTarea
    }),

  eliminar: (id) => 
    api.solicitar(`/tareas/${id}`, {
      method: 'DELETE'
    }),

  calificar: (datosCalificacion) => 
    api.solicitar('/calificaciones', {
      method: 'POST',
      body: datosCalificacion
    })
};

export default servicioTareas;