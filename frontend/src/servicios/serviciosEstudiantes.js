import { api } from './api';

export const servicioEstudiantes = {
  obtenerTodos: () => 
    api.solicitar('/estudiantes'),

  obtenerPorId: (id) => 
    api.solicitar(`/estudiantes/${id}`),

  crear: (datosEstudiante) => 
    api.solicitar('/estudiantes', {
      method: 'POST',
      body: datosEstudiante
    }),

  actualizar: (id, datosEstudiante) => 
    api.solicitar(`/estudiantes/${id}`, {
      method: 'PUT',
      body: datosEstudiante
    }),

  eliminar: (id) => 
    api.solicitar(`/estudiantes/${id}`, {
      method: 'DELETE'
    }),

  obtenerPorClase: (idClase) => 
    api.solicitar(`/estudiantes/clase/${idClase}`),

  inscribirEnClase: (idEstudiante, idClase) => 
    api.solicitar('/inscripciones', {
      method: 'POST',
      body: { estudiante_id: idEstudiante, clase_id: idClase }
    })
};

export default servicioEstudiantes;