// routes/auth.js
import express from 'express';
import pool from '../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateLogin, validateRegister } from '../middleware/validaciones.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'Software_AULA';

// POST /api/auth/login - Login de usuarios
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const result = await pool.query(
      `SELECT usuario_id, nombre, email, password_hash, rol, activo, intentos_login 
       FROM escuela.usuarios 
       WHERE email = $1 AND rol IN ('profesor', 'admin')`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];
    const MAX_ATTEMPTS = 5;

    // Verificar si el usuario está bloqueado por intentos
    if (user.intentos_login >= MAX_ATTEMPTS) {
      return res.status(403).json({
        success: false,
        error: 'Cuenta temporalmente bloqueada debido a múltiples intentos fallidos.'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      // Contraseña incorrecta: Incrementar intentos_login
      const newAttempts = user.intentos_login + 1;
      await pool.query(
        `UPDATE escuela.usuarios SET intentos_login = $1, fecha_actualizacion = NOW() WHERE usuario_id = $2`,
        [newAttempts, user.usuario_id]
      );
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
    
    // Credenciales correctas: Resetear intentos_login y actualizar último login
    if (user.intentos_login > 0) {
        await pool.query(
            `UPDATE escuela.usuarios SET intentos_login = 0, fecha_ultimo_login = NOW() WHERE usuario_id = $1`,
            [user.usuario_id]
        );
    } else {
         await pool.query(
            `UPDATE escuela.usuarios SET fecha_ultimo_login = NOW() WHERE usuario_id = $1`,
            [user.usuario_id]
        );
    }

    // GENERAR TOKEN CON ESTRUCTURA CONSISTENTE
    const token = jwt.sign(
      {
        id: user.usuario_id,           // Propiedad principal 'id'
        userId: user.usuario_id,       // Compatibilidad con 'userId'
        usuario_id: user.usuario_id,   // Compatibilidad con 'usuario_id'
        email: user.email,
        role: user.rol
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.usuario_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/register - Registro de profesores
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO escuela.usuarios 
       (nombre, apellido, email, password_hash, rol, activo) 
       VALUES ($1, $2, $3, $4, 'profesor', true) 
       RETURNING usuario_id, nombre, email, rol`,
      [nombre, apellido, email, passwordHash]
    );

    const nuevoUsuario = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: nuevoUsuario.usuario_id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    console.error('Error completo en registro:', error);
    
    if (error.code === '23505') { // Violación de unique constraint
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al registrar usuario'
    });
  }
});

export default router;