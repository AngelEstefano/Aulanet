import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contextos/AppContext';
import { api } from './servicios/api'; // Importar la API
import Login from './paginas/Login';
import Dashboard from './paginas/Dashboard';
import './estilos/globales.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token válido al cargar la aplicación
    const verificarAutenticacion = async () => {
      try {
        const token = api.getToken();
        
        if (token) {
          // Verificar token con el servidor
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token inválido, limpiar
            api.clearToken();
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        api.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    verificarAutenticacion();
  }, []);

  const handleLogin = async (loginData) => {
    try {
      console.log('Datos de login recibidos:', loginData);
      
      if (loginData.success && loginData.user && loginData.token) {
        // Establecer el token en la API
        api.setToken(loginData.token);
        
        // Guardar usuario en estado
        setUser(loginData.user);
        
        console.log('Login exitoso, usuario establecido:', loginData.user);
        return true;
      }
      console.log('Datos de login incompletos:', loginData);
      return false;
    } catch (error) {
      console.error('Error en handleLogin:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // Si tienes un endpoint de logout en el backend
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        }
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local
      api.clearToken();
      setUser(null);
    }
  };

  // Componente protegido
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Componente de carga
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #C0A062',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <Navigate to={user ? "/dashboard" : "/login"} replace />
              } 
            />
            <Route 
              path="*" 
              element={
                <Navigate to={user ? "/dashboard" : "/login"} replace />
              } 
            />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;