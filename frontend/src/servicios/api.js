// src/api.js
const URL_BASE_API = '/api';

// Singleton para manejar el estado de autenticación
class AuthManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.listeners = [];
  }

  setAuthData(token, user) {
    this.token = token;
    this.user = user;
    this.notifyListeners();
  }

  // Alias para setAuthData (para mantener compatibilidad)
  setToken(token, user) {
    this.setAuthData(token, user);
  }

  clearAuthData() {
    this.token = null;
    this.user = null;
    this.notifyListeners();
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.token, this.user));
  }
}

// Instancia global
const authManager = new AuthManager();

export const api = {
  // Métodos para manejar autenticación - mantén ambos nombres para compatibilidad
  setAuthData: (token, user) => authManager.setAuthData(token, user),
  setToken: (token, user) => authManager.setToken(token, user), // Agregar esta línea
  clearAuthData: () => authManager.clearAuthData(),
  getToken: () => authManager.getToken(),
  getUser: () => authManager.getUser(),
  addAuthListener: (listener) => authManager.addListener(listener),
  removeAuthListener: (listener) => authManager.removeListener(listener),

  // Método principal para hacer solicitudes
  async solicitar(endpoint, opciones = {}) {
    const token = authManager.getToken();
    
    const configuracion = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...opciones.headers,
      },
      ...opciones,
    };

    if (configuracion.body && typeof configuracion.body === 'object') {
      configuracion.body = JSON.stringify(configuracion.body);
    }

    try {
      const respuesta = await fetch(`${URL_BASE_API}${endpoint}`, configuracion);
      
      // Si la respuesta es 401 (No autorizado), limpiar autenticación
      if (respuesta.status === 401) {
        authManager.clearAuthData();
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (!respuesta.ok) {
        const error = await respuesta.json().catch(() => ({ 
          message: `Error ${respuesta.status}: ${respuesta.statusText}` 
        }));
        throw new Error(error.message || 'Error en la solicitud');
      }
      
      return await respuesta.json();
    } catch (error) {
      console.error('Error en solicitud API:', error);
      throw error;
    }
  }
};