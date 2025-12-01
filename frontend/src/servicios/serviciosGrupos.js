import { api } from './api';

export const servicioclases = {
  obtenerTodos: () => 
    api.solicitar('/clases'),

  obtenerPorId: (id) => 
    api.solicitar(`/clases/${id}`),

  crear: (datosGrupo) => 
    api.solicitar('/clases', {
      method: 'POST',
      body: datosGrupo
    }),

  actualizar: (id, datosGrupo) => 
    api.solicitar(`/clases/${id}`, {
      method: 'PUT',
      body: datosGrupo
    }),

  eliminar: (id) => 
    api.solicitar(`/clases/${id}`, {
      method: 'DELETE'
    }),

  obtenerEstudiantes: (idGrupo) => 
    api.solicitar(`/clases/${idGrupo}/estudiantes`),

  obtenerAsistencia: (idGrupo) => 
    api.solicitar(`/clases/${idGrupo}/asistencia`)
};

export default servicioclases;