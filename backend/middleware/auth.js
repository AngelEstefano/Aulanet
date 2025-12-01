// middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Software_AULA';

// Middleware para autenticar el token JWT
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // NORMALIZACIÓN CRÍTICA: Asegurar que todos los nombres de propiedades sean consistentes
    req.user = {
      id: decoded.userId || decoded.id || decoded.usuario_id,
      userId: decoded.userId || decoded.id || decoded.usuario_id,
      usuario_id: decoded.userId || decoded.id || decoded.usuario_id,
      email: decoded.email,
      role: decoded.role || decoded.rol
    };
    
    next();
    
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
};

// Middleware para requerir roles específicos
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción'
        });
      }

      next();
    } catch (error) {
      console.error('Error en requireRole:', error);
      return res.status(500).json({
        success: false,
        error: 'Error en verificación de roles'
      });
    }
  };
};