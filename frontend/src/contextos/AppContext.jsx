// src/contextos/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../servicios/api';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    grupos: [],
    loading: false
  });

  // Sincronizar con el auth manager de la API
  useEffect(() => {
    const handleAuthChange = (token, user) => {
      setState(prev => ({
        ...prev,
        user: user
      }));
    };

    // Agregar listener para cambios de autenticación
    api.addAuthListener(handleAuthChange);

    // Establecer usuario inicial si existe
    const currentUser = api.getUser();
    if (currentUser) {
      setState(prev => ({
        ...prev,
        user: currentUser
      }));
    }

    return () => {
      api.removeAuthListener(handleAuthChange);
    };
  }, []);

  const dispatch = (action) => {
    switch (action.type) {
      case 'SET_USER':
        setState(prev => ({ ...prev, user: action.payload }));
        api.setAuthData(api.getToken(), action.payload);
        break;
      case 'SET_GRUPOS':
        setState(prev => ({ ...prev, grupos: action.payload }));
        break;
      case 'SET_LOADING':
        setState(prev => ({ ...prev, loading: action.payload }));
        break;
      case 'LOGOUT':
        setState({ user: null, grupos: [], loading: false });
        api.clearAuthData();
        break;
      default:
        console.warn(`Acción desconocida: ${action.type}`);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};