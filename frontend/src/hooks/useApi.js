import { useState, useEffect } from 'react';

export const useApi = (solicitudApi, dependencias = []) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    const ejecutarSolicitud = async () => {
      if (!solicitudApi) return;

      setCargando(true);
      setError(null);

      try {
        const resultado = await solicitudApi();
        if (!cancelado) {
          setDatos(resultado);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err.message);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    ejecutarSolicitud();

    return () => {
      cancelado = true;
    };
  }, dependencias);

  return { datos, cargando, error };
};