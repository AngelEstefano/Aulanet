import { api } from './api';

export const servicioAsistencias = {
  obtenerPorClase: (idClase) => 
    api.solicitar(`/asistencias/clase/${idClase}`),

  registrar: (datosAsistencia) => 
    api.solicitar('/asistencias', {
      method: 'POST',
      body: datosAsistencia
    }),

  actualizar: (id, datosAsistencia) => 
    api.solicitar(`/asistencias/${id}`, {
      method: 'PUT',
      body: datosAsistencia
    }),

  obtenerPorEstudiante: (idEstudiante, idClase) => 
    api.solicitar(`/asistencias/estudiante/${idEstudiante}?clase_id=${idClase}`)
};

// También exporta por defecto por si acaso
export default servicioAsistencias;