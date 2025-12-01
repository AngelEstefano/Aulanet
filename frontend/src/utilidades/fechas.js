export const fechas = {
  formatearFecha: (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatearFechaCorta: (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  },

  esHoy: (fecha) => {
    const hoy = new Date();
    const fechaComparar = new Date(fecha);
    return hoy.toDateString() === fechaComparar.toDateString();
  },

  generarRangoFechas: (fechaInicio, fechaFin, diasSemana = []) => {
    const fechas = [];
    const fechaActual = new Date(fechaInicio);
    const fechaFinal = new Date(fechaFin);
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    while (fechaActual <= fechaFinal) {
      const nombreDia = nombresDias[fechaActual.getDay()];
      if (diasSemana.includes(nombreDia)) {
        fechas.push(new Date(fechaActual));
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return fechas;
  }
};