// src/servicios/serviciosEventos.js
import { api } from './api';

export const servicioEventos = {
  obtenerPorClase: (idClase) => 
    api.solicitar(`/eventos-calendario/clase/${idClase}`),

  obtenerTodos: () => 
    api.solicitar('/eventos-calendario'),

  crear: (datosEvento) => 
    api.solicitar('/eventos-calendario', {
      method: 'POST',
      body: datosEvento
    }),

  actualizar: (id, datosEvento) => 
    api.solicitar(`/eventos-calendario/${id}`, {
      method: 'PUT',
      body: datosEvento
    }),

  eliminar: (id) => 
    api.solicitar(`/eventos-calendario/${id}`, {
      method: 'DELETE'
    })
};

export default servicioEventos;