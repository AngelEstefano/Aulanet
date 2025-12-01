// src/servicios/serviciosAuth.js
import { api } from './api';

export const servicioAuth = {
  login: async (credenciales) => {
    try {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credenciales)
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json().catch(() => ({ 
          message: 'Error en la autenticación' 
        }));
        throw new Error(error.message);
      }
      
      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.solicitar('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  },

  verificarToken: async () => {
    try {
      const respuesta = await api.solicitar('/auth/verify');
      return respuesta;
    } catch (error) {
      console.error('Error verificando token:', error);
      throw error;
    }
  }
};

export default servicioAuth;