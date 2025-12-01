import { body, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y contraseña son requeridos'
    });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email inválido'
    });
  }

  next();
};

export const validateRegister = (req, res, next) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Nombre, email y contraseña son requeridos'
    });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email inválido'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres'
    });
  }

  next();
};

export const validateClase = [
  // Campos obligatorios
  body('materia_nombre')
    .notEmpty().withMessage('El nombre de la materia es requerido')
    .isLength({ max: 200 }).withMessage('El nombre de la materia no puede exceder 200 caracteres'),
  
  body('materia_seccion')
    .notEmpty().withMessage('La sección de la materia es requerida')
    .isLength({ max: 200 }).withMessage('La sección no puede exceder 200 caracteres'),
  
  // Campos de fecha (obligatorios)
  body('fecha_inicio')
    .isDate().withMessage('La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)'),
  
  body('fecha_fin')
    .isDate().withMessage('La fecha de fin debe ser una fecha válida (YYYY-MM-DD)'),
  
  // Días de clase (obligatorio)
  body('dias_de_clase')
    .notEmpty().withMessage('Los días de clase son requeridos')
    .isLength({ max: 50 }).withMessage('Los días de clase no pueden exceder 50 caracteres'),
  
  // Campos opcionales
  body('capacidad')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('La capacidad debe ser un número entre 1 y 100'),
  
  body('color_hex')
    .optional()
    .isHexColor().withMessage('El color debe ser un código hexadecimal válido (ej: #3498db)'),
  
  handleValidationErrors
];

export const validateAlumno = [
  body('codigo_estudiante').notEmpty().isLength({ min: 3, max: 50 }),
  body('nombre').notEmpty().isLength({ min: 2, max: 150 }),
  body('email').optional().isEmail(),
  body('clase_id').isInt({ min: 1 }),
  handleValidationErrors
];

export const validateAsistencia = [
  body('*.inscripcion_id').isInt({ min: 1 }),
  body('*.fecha').isDate(),
  body('*.estado_asistencia').isIn(['asistencia_completa', 'falta_completa', 'falta_1hora', 'justificado', 'retardo']),
  body('*.participacion').optional().isIn(['trabajo', 'no_trabajo', 'parcial']),
  handleValidationErrors
];

export const validateCalificacion = [
  body('inscripcion_id').isInt({ min: 1 }),
  body('tarea_id').isInt({ min: 1 }),
  body('puntaje').isFloat({ min: 0 }),
  body('observaciones').optional().isLength({ max: 500 }),
  handleValidationErrors
];

export const validateTarea = [
  body('clase_id').isInt({ min: 1 }),
  body('titulo').notEmpty().isLength({ max: 200 }),
  body('tipo').isIn(['tarea', 'examen', 'proyecto', 'participacion', 'investigacion']),
  body('fecha_entrega').isDate(),
  body('puntaje_maximo').isFloat({ min: 1 }),
  handleValidationErrors
];

export const validateEvento = [
  body('titulo').notEmpty().isLength({ max: 200 }),
  body('fecha_inicio').isDate(),
  body('fecha_fin').isDate(),
  body('tipo_evento').isIn(['general', 'clase', 'examen', 'tarea', 'festivo', 'suspension', 'reunion', 'vacaciones']),
  handleValidationErrors
];

export const validateReporte = [
  query('formato').optional().isIn(['json', 'csv', 'pdf']),
  query('periodo').optional().isLength({ max: 50 }),
  query('fecha_inicio').optional().isDate(),
  query('fecha_fin').optional().isDate(),
  handleValidationErrors
];

// Exportar como objeto nombrado para importaciones más limpias
export const validaciones = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateClase,
  validateAlumno,
  validateAsistencia,
  validateCalificacion,
  validateTarea,
  validateEvento,
  validateReporte
};