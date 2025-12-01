import { useState, useEffect } from 'react';

export const useAlmacenamiento = (clave, valorInicial) => {
  const [valorAlmacenado, setValorAlmacenado] = useState(() => {
    try {
      const item = window.localStorage.getItem(clave);
      return item ? JSON.parse(item) : valorInicial;
    } catch (error) {
      console.error(`Error leyendo clave "${clave}" del almacenamiento:`, error);
      return valorInicial;
    }
  });

  const establecerValor = (valor) => {
    try {
      setValorAlmacenado(valor);
      window.localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
      console.error(`Error guardando clave "${clave}" en almacenamiento:`, error);
    }
  };

  return [valorAlmacenado, establecerValor];
};