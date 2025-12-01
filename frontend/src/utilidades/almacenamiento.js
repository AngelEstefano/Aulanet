export const almacenamiento = {
  obtener: (clave, valorPorDefecto = null) => {
    try {
      const item = localStorage.getItem(clave);
      return item ? JSON.parse(item) : valorPorDefecto;
    } catch (error) {
      console.error(`Error leyendo ${clave} del almacenamiento:`, error);
      return valorPorDefecto;
    }
  },

  guardar: (clave, valor) => {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
      console.error(`Error guardando ${clave} en almacenamiento:`, error);
    }
  },

  eliminar: (clave) => {
    try {
      localStorage.removeItem(clave);
    } catch (error) {
      console.error(`Error eliminando ${clave} del almacenamiento:`, error);
    }
  },

  limpiarTodo: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error limpiando almacenamiento:', error);
    }
  }
};