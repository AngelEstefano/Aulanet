import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { servicioAuth } from '../servicios/serviciosAuth';

// Constantes para mejorar mantenibilidad
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  PATTERN: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
};

const INITIAL_REGISTER_DATA = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  confirmarPassword: ""
};

// Componente InputPassword movido fuera del componente Login para evitar recreación
const InputPassword = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  showPassword, 
  onToggleShowPassword,
  required = true 
}) => {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          border: '1px solid #D1D5DB',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          outline: 'none',
          backgroundColor: disabled ? '#f9f9f9' : 'white',
          paddingRight: '2.5rem',
        }}
        required={required}
      />
      <button
        type="button"
        onClick={onToggleShowPassword}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: '#6B7280',
          fontSize: '0.875rem',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  );
};

const Login = ({ onLogin }) => {
  // Estados para LOGIN
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPasswordLogin, setMostrarPasswordLogin] = useState(false);
  
  // Estados para REGISTRO
  const [datosRegistro, setDatosRegistro] = useState(INITIAL_REGISTER_DATA);
  const [mostrarPasswordRegistro, setMostrarPasswordRegistro] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  
  // Estados comunes
  const [isLoading, setIsLoading] = useState(false);
  const [modo, setModo] = useState("login");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailRecuperacion, setEmailRecuperacion] = useState("");
  const navigate = useNavigate();

  // Estados para efectos hover en enlaces
  const [hoverRegistrate, setHoverRegistrate] = useState(false);
  const [hoverOlvidaste, setHoverOlvidaste] = useState(false);
  const [hoverIniciaSesion, setHoverIniciaSesion] = useState(false);
  const [hoverVolver, setHoverVolver] = useState(false);

  // Limpiar errores cuando cambia el modo
  const cambiarModo = useCallback((nuevoModo) => {
    setModo(nuevoModo);
    setError("");
    setSuccessMessage("");
    
    // Limpiar estados específicos al cambiar modo
    if (nuevoModo === "login") {
      setEmail("");
      setPassword("");
      setMostrarPasswordLogin(false);
    } else if (nuevoModo === "registro") {
      setDatosRegistro(INITIAL_REGISTER_DATA);
      setMostrarPasswordRegistro(false);
      setMostrarConfirmarPassword(false);
    } else if (nuevoModo === "recuperar") {
      setEmailRecuperacion("");
    }
  }, []);

  // Manejo específico para password de LOGIN
  const handlePasswordLoginChange = (e) => {
    setPassword(e.target.value);
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const datos = await servicioAuth.login({ email, password });

      if (datos.success) {
        // Llamar al callback onLogin con todos los datos
        if (onLogin) {
          const success = await onLogin(datos);
          if (success) {
            // Si el onLogin fue exitoso, el App.jsx manejará la redirección
            return;
          } else {
            setError('Error al procesar el inicio de sesión');
          }
        }
      } else {
        setError(datos.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
      console.error('Error en login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // Validaciones
      if (datosRegistro.password !== datosRegistro.confirmarPassword) {
        setError("Las contraseñas no coinciden");
        setIsLoading(false);
        return;
      }

      if (!PASSWORD_REQUIREMENTS.PATTERN.test(datosRegistro.password)) {
        setError("La contraseña debe tener al menos 8 caracteres, incluir al menos una letra y un número. Solo se permiten letras y números.");
        setIsLoading(false);
        return;
      }

      // Crear servicio de registro
      const respuesta = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: datosRegistro.nombre.trim(),
          apellido: datosRegistro.apellido.trim(),
          email: datosRegistro.email.toLowerCase().trim(),
          password: datosRegistro.password,
          rol: 'profesor'
        })
      });

      const datos = await respuesta.json();

      if (respuesta.ok && datos.success) {
        setError("");
        setSuccessMessage('Cuenta creada exitosamente. Redirigiendo al inicio de sesión...');
        
        // Limpiar formulario
        setDatosRegistro(INITIAL_REGISTER_DATA);
        
        // Redirigir a login después de 2 segundos
        setTimeout(() => {
          setModo("login");
          setSuccessMessage("");
        }, 2000);
        
      } else {
        setError(datos.error || datos.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta. Verifica la conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const manejarRecuperacion = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const respuesta = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailRecuperacion.toLowerCase().trim() })
      });

      const datos = await respuesta.json();

      if (respuesta.ok && datos.success) {
        setError("");
        setSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
        setEmailRecuperacion("");
        
        setTimeout(() => {
          setModo("login");
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(datos.error || 'Error al enviar el enlace de recuperación');
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
      console.error('Error en recuperación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const actualizarCampoRegistro = useCallback((campo, valor) => {
    setDatosRegistro(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // Componente de botón reutilizable SIN HOVER
  const BotonSubmit = ({ loading, texto, loadingTexto }) => (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        backgroundColor: loading ? '#6B7280' : '#1C1F33',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontWeight: '600',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        marginTop: '0.5rem',
      }}
    >
      {loading ? loadingTexto : texto}
    </button>
  );

  // Componente de enlace entre modos CON hover
  const EnlaceModo = ({ texto, onClick, disabled, tipo }) => {
    const getHoverState = () => {
      switch (tipo) {
        case 'registrate': return hoverRegistrate;
        case 'olvidaste': return hoverOlvidaste;
        case 'iniciaSesion': return hoverIniciaSesion;
        case 'volver': return hoverVolver;
        default: return false;
      }
    };

    const setHoverState = (value) => {
      switch (tipo) {
        case 'registrate': setHoverRegistrate(value); break;
        case 'olvidaste': setHoverOlvidaste(value); break;
        case 'iniciaSesion': setHoverIniciaSesion(value); break;
        case 'volver': setHoverVolver(value); break;
        default: break;
      }
    };

    const isHovered = getHoverState();

    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          color: isHovered ? '#2D3748' : '#1C1F33',
          fontWeight: '600',
          textDecoration: isHovered ? 'underline' : 'none',
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease-in-out',
        }}
        disabled={disabled}
        onMouseEnter={() => setHoverState(true)}
        onMouseLeave={() => setHoverState(false)}
      >
        {texto}
      </button>
    );
  };

  const renderLogin = () => (
    <form onSubmit={manejarLogin} style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div>
        <label style={{
          display: 'block',
          fontFamily: "'montserrat', sans-serif",
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1C1F33',
          marginBottom: '0.5rem'
        }}>
          E-mail
        </label>
        <input
          type="email"
          placeholder="Ingresa tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          style={{
            width: '100%',
            border: '1px solid #D1D5DB',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            outline: 'none',
            backgroundColor: isLoading ? '#f9f9f9' : 'white'
          }}
          required
        />
      </div>

      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#1C1F33'
          }}>
            Contraseña
          </label>
          <EnlaceModo 
            texto="¿Olvidaste tu contraseña?"
            onClick={() => cambiarModo("recuperar")}
            disabled={isLoading}
            tipo="olvidaste"
          />
        </div>
        
        <InputPassword
          value={password}
          onChange={handlePasswordLoginChange}
          placeholder="Ingresa tu contraseña"
          disabled={isLoading}
          showPassword={mostrarPasswordLogin}
          onToggleShowPassword={() => setMostrarPasswordLogin(!mostrarPasswordLogin)}
        />
      </div>

      {error && (
        <div style={{
          color: '#DC2626',
          fontSize: '0.875rem',
          padding: '0.75rem',
          backgroundColor: '#FEF2F2',
          borderRadius: '0.5rem',
          border: '1px solid #FECACA',
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          color: '#059669',
          fontSize: '0.875rem',
          padding: '0.75rem',
          backgroundColor: '#F0FDF4',
          borderRadius: '0.5rem',
          border: '1px solid #BBF7D0',
        }}>
          {successMessage}
        </div>
      )}

      <BotonSubmit
        loading={isLoading}
        texto="Iniciar Sesión"
        loadingTexto="Iniciando sesión..."
      />

      <div style={{
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6B7280',
        marginTop: '1.5rem'
      }}>
        ¿No tienes una cuenta?{" "}
        <EnlaceModo 
          texto="Regístrate aquí"
          onClick={() => cambiarModo("registro")}
          disabled={isLoading}
          tipo="registrate"
        />
      </div>
    </form>
  );

  const renderRegistro = () => (
    <form onSubmit={manejarRegistro} style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#1C1F33',
            marginBottom: '0.5rem'
          }}>
            Nombre
          </label>
          <input
            type="text"
            placeholder="Tu nombre"
            value={datosRegistro.nombre}
            onChange={(e) => actualizarCampoRegistro('nombre', e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              border: '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            required
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#1C1F33',
            marginBottom: '0.5rem'
          }}>
            Apellido
          </label>
          <input
            type="text"
            placeholder="Tu apellido"
            value={datosRegistro.apellido}
            onChange={(e) => actualizarCampoRegistro('apellido', e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              border: '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1C1F33',
          marginBottom: '0.5rem'
        }}>
          E-mail
        </label>
        <input
          type="email"
          placeholder="Ingresa tu correo electrónico"
          value={datosRegistro.email}
          onChange={(e) => actualizarCampoRegistro('email', e.target.value)}
          disabled={isLoading}
          style={{
            width: '100%',
            border: '1px solid #D1D5DB',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            outline: 'none',
          }}
          required
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1C1F33',
          marginBottom: '0.5rem'
        }}>
          Contraseña
        </label>
        <InputPassword
          value={datosRegistro.password}
          onChange={(e) => actualizarCampoRegistro('password', e.target.value)}
          placeholder="Mínimo 8 caracteres (solo letras y números)"
          disabled={isLoading}
          showPassword={mostrarPasswordRegistro}
          onToggleShowPassword={() => setMostrarPasswordRegistro(!mostrarPasswordRegistro)}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1C1F33',
          marginBottom: '0.5rem'
        }}>
          Confirmar Contraseña
        </label>
        <InputPassword
          value={datosRegistro.confirmarPassword}
          onChange={(e) => actualizarCampoRegistro('confirmarPassword', e.target.value)}
          placeholder="Repite tu contraseña"
          disabled={isLoading}
          showPassword={mostrarConfirmarPassword}
          onToggleShowPassword={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
        />
      </div>

      {error && (
        <div style={{
          color: '#DC2626',
          fontSize: '0.875rem',
          padding: '0.75rem',
          backgroundColor: '#FEF2F2',
          borderRadius: '0.5rem',
          border: '1px solid #FECACA',
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          color: '#059669',
          fontSize: '0.875rem',
          padding: '0.75rem',
          backgroundColor: '#F0FDF4',
          borderRadius: '0.5rem',
          border: '1px solid #BBF7D0',
        }}>
          {successMessage}
        </div>
      )}

      <BotonSubmit
        loading={isLoading}
        texto="Crear Cuenta"
        loadingTexto="Creando cuenta..."
      />

      <div style={{
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6B7280',
        marginTop: '1rem'
      }}>
        ¿Ya tienes una cuenta?{" "}
        <EnlaceModo 
          texto="Inicia sesión aquí"
          onClick={() => cambiarModo("login")}
          disabled={isLoading}
          tipo="iniciaSesion"
        />
      </div>
    </form>
  );

  const renderRecuperacion = () => (
    <form onSubmit={manejarRecuperacion} style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1C1F33',
          marginBottom: '0.5rem'
        }}>
          E-mail
        </label>
        <input
          type="email"
          placeholder="Ingresa tu correo electrónico"
          value={emailRecuperacion}
          onChange={(e) => setEmailRecuperacion(e.target.value)}
          disabled={isLoading}
          style={{
            width: '100%',
            border: '1px solid #D1D5DB',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            outline: 'none',
          }}
          required
        />
      </div>

      {error && (
        <div style={{
          color: '#DC2626',
          fontSize: '0.875rem',
          padding: '0.75rem',
          backgroundColor: '#FEF2F2',
          borderRadius: '0.5rem',
          border: '1px solid #FECACA',
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          color: '#059669',
          fontSize: '0.875rem',
          padding: '0.75rem',
          backgroundColor: '#F0FDF4',
          borderRadius: '0.5rem',
          border: '1px solid #BBF7D0',
        }}>
          {successMessage}
        </div>
      )}

      <BotonSubmit
        loading={isLoading}
        texto="Enviar Enlace de Recuperación"
        loadingTexto="Enviando..."
      />

      <div style={{
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6B7280',
        marginTop: '1rem'
      }}>
        <EnlaceModo 
          texto="← Volver al inicio de sesión"
          onClick={() => cambiarModo("login")}
          disabled={isLoading}
          tipo="volver"
        />
      </div>
    </form>
  );

  // Estilos 
  const estilosContenedor = {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    backgroundColor: 'white',
    fontFamily: 'Montserrat, sans-serif'
  };

  const estilosFormulario = {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative'
  };

  const estilosImagen = {
    width: '50%',
    backgroundImage: "url('https://img.freepik.com/vector-gratis/diseno-patrones-fisuras-papeleria-escolar-doodle_107791-9605.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative'
  };

  const estilosLogo = {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const estilosContenidoFormulario = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px'
  };

  const obtenerTitulo = () => {
    switch (modo) {
      case "registro":
        return "Crear Cuenta";
      case "recuperar":
        return "Recuperar Contraseña";
      default:
        return "Iniciar Sesión";
    }
  };

  return (
    <div style={estilosContenedor}>
      {/* Columna del formulario */}
      <div style={estilosFormulario}>
        <div style={estilosLogo}>
          <img 
            src="https://i.postimg.cc/B6XgCnRm/Logo.png" 
            alt="AULANET Logo"
            style={{
              width: '45px',
              height: '45px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span style={{
            fontFamily: 'aboreto',
            fontSize: '1.25rem',
            fontWeight: '20',
            letterSpacing: '0.025em',
            color: '#1C1F33'
          }}>
            AULANET
          </span>
        </div>

        <div style={estilosContenidoFormulario}>
          <div style={{
            width: '80px',
            height: '80px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="https://i.postimg.cc/TY7nt6Jb/avatar.png" 
              alt="User Icon"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIxVjE5QzIwIDE2Ljc5MDkgMTguMjA5MSAxNSAxNiAxNUg4QzUuNzkwODYgMTUgNCAxNi43OTA5IDQgMTlWMjEiIHN0cm9rZT0iMkMzQjVFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIHN0cm9rZT0iMkMzQjVFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FpPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
              }}
            />
          </div>

          <h2 style={{
            color: '#1C1F33',
            marginBottom: '2rem',
            fontSize: '1.5rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {obtenerTitulo()}
          </h2>

          {modo === "login" && renderLogin()}
          {modo === "registro" && renderRegistro()}
          {modo === "recuperar" && renderRecuperacion()}
        </div>
      </div>

      {/* Columna de la imagen */}
      <div style={estilosImagen}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(28, 31, 51, 0.1)'
        }}></div>
      </div>
    </div>
  );
};

export default Login;