CREATE SCHEMA IF NOT EXISTS escuela; -- Usamos 'escuela' para ser consistentes con el código JS

-- 1. Tabla de usuarios (profesores/administradores)
CREATE TABLE IF NOT EXISTS escuela.usuarios (
    usuario_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'profesor' CHECK (rol IN ('admin', 'profesor')),
    activo BOOLEAN DEFAULT true,
    fecha_ultimo_login TIMESTAMP WITH TIME ZONE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_usuarios_email ON escuela.usuarios(email);
CREATE INDEX IF NOT EXISTS ix_usuarios_rol ON escuela.usuarios(rol);
CREATE INDEX IF NOT EXISTS ix_usuarios_activo ON escuela.usuarios(activo);

-- 2. Tabla de CLASES (CORREGIDO DE 'grupos' a 'clases')
CREATE TABLE IF NOT EXISTS escuela.clases (
    clase_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    materia_nombre VARCHAR(200) NOT NULL,   -- **COLUMNA REQUERIDA EN reportes.js**
    capacidad INT DEFAULT 30,
    color_hex VARCHAR(7) DEFAULT '#3498db',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_clases_profesor ON escuela.clases(profesor_id);
CREATE INDEX IF NOT EXISTS ix_clases_ciclo ON escuela.clases(ciclo_id);
CREATE UNIQUE INDEX IF NOT EXISTS uix_clases_identificador ON escuela.clases(grado, grupo, ciclo_id);

-- 3. Ciclos escolares
CREATE TABLE IF NOT EXISTS escuela.ciclos_escolares (
    ciclo_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabla de estudiantes
CREATE TABLE IF NOT EXISTS escuela.estudiantes (
    estudiante_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_estudiante VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_estudiantes_codigo ON escuela.estudiantes(codigo_estudiante);

-- 5. Tabla de inscripciones (relaciona estudiantes y clases)
CREATE TABLE IF NOT EXISTS escuela.inscripciones (
    inscripcion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES escuela.estudiantes(estudiante_id) ON DELETE CASCADE,
    clase_id BIGINT NOT NULL REFERENCES escuela.clases(clase_id) ON DELETE CASCADE, -- CORREGIDO de grupo_id
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(estudiante_id, clase_id) -- Un estudiante solo puede estar una vez en una clase
);

CREATE INDEX IF NOT EXISTS ix_inscripciones_estudiante ON escuela.inscripciones(estudiante_id);
CREATE INDEX IF NOT EXISTS ix_inscripciones_clase ON escuela.inscripciones(clase_id); -- CORREGIDO de grupo_id

-- 6. Tareas
CREATE TABLE IF NOT EXISTS escuela.tareas (
    tarea_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clase_id BIGINT NOT NULL REFERENCES escuela.clases(clase_id) ON DELETE CASCADE, -- CORREGIDO de grupo_id
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('tarea', 'examen', 'proyecto', 'participacion', 'investigacion')),
    fecha_entrega DATE NOT NULL,
    puntaje_maximo NUMERIC(5, 2) NOT NULL,
    creado_por BIGINT REFERENCES escuela.usuarios(usuario_id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_tareas_clase ON escuela.tareas(clase_id); -- CORREGIDO de grupo_id

-- 7. Calificaciones
CREATE TABLE IF NOT EXISTS escuela.calificaciones (
    calificacion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inscripcion_id BIGINT NOT NULL REFERENCES escuela.inscripciones(inscripcion_id) ON DELETE CASCADE,
    tarea_id BIGINT NOT NULL REFERENCES escuela.tareas(tarea_id) ON DELETE CASCADE,
    puntaje NUMERIC(5, 2) NOT NULL,
    observaciones TEXT,
    fecha_calificacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    retroalimentacion TEXT,
    entregado BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(inscripcion_id, tarea_id)
);

CREATE INDEX IF NOT EXISTS ix_calificaciones_inscripcion ON escuela.calificaciones(inscripcion_id);

-- 8. Asistencias
CREATE TABLE IF NOT EXISTS escuela.asistencias (
    asistencia_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inscripcion_id BIGINT NOT NULL REFERENCES escuela.inscripciones(inscripcion_id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado_asistencia VARCHAR(20) NOT NULL CHECK (estado_asistencia IN ('presente', 'ausente', 'tarde', 'justificado')),
    participacion NUMERIC(3, 2) DEFAULT 0, -- Puntuación de 0 a 10
    comentarios TEXT,
    registrado_por BIGINT REFERENCES escuela.usuarios(usuario_id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(inscripcion_id, fecha)
);

CREATE INDEX IF NOT EXISTS ix_asistencias_fecha ON escuela.asistencias(fecha);

-- 9. Eventos de calendario
CREATE TABLE IF NOT EXISTS escuela.eventos_calendario (
    evento_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('general', 'clase', 'examen', 'tarea', 'festivo', 'suspension', 'reunion', 'vacaciones')),
    color VARCHAR(7),
    clase_id BIGINT REFERENCES escuela.clases(clase_id) ON DELETE SET NULL, -- CORREGIDO de grupo_id
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_eventos_fecha ON escuela.eventos_calendario(fecha_inicio);

-- 10. Horarios de clases
CREATE TABLE IF NOT EXISTS escuela.horarios (
    horario_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clase_id BIGINT NOT NULL REFERENCES escuela.clases(clase_id) ON DELETE CASCADE, -- CORREGIDO de grupo_id
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    salon VARCHAR(50),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uix_horarios_clase_dia ON escuela.horarios(clase_id, dia_semana, hora_inicio); -- CORREGIDO de grupo_id

-- Función y Triggers para fecha_actualizacion (Ajustados al nuevo esquema 'escuela')

-- Crear función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION escuela.actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (Se cambian los nombres de esquema y tabla)
CREATE TRIGGER trg_actualizar_usuarios
BEFORE UPDATE ON escuela.usuarios
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_clases
BEFORE UPDATE ON escuela.clases
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_estudiantes
BEFORE UPDATE ON escuela.estudiantes
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_inscripciones
BEFORE UPDATE ON escuela.inscripciones
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_tareas
BEFORE UPDATE ON escuela.tareas
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_calificaciones
BEFORE UPDATE ON escuela.calificaciones
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_asistencias
BEFORE UPDATE ON escuela.asistencias
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_horarios
BEFORE UPDATE ON escuela.horarios
FOR EACH ROW EXECUTE FUNCTION escuela.actualizar_fecha_actualizacion();


-- INSERCIÓN DE DATOS INICIALES (Ajustados al nuevo esquema 'escuela')

-- Insertar ciclo escolar
INSERT INTO escuela.ciclos_escolares (nombre, fecha_inicio, fecha_fin) 
VALUES ('Ciclo 2024-2025', '2024-08-15', '2025-07-15')
ON CONFLICT DO NOTHING;

-- Insertar un administrador
INSERT INTO escuela.usuarios (nombre, apellido, email, password_hash, rol) 
VALUES ('Admin', 'Aulanet', 'admin@escuela.edu', '$2a$12$R.SjL0/y29yXbY/fF5d4u./N4cQ4Qk0gVnN6z0Mv0Qk0gVnN6z0Mv', 'admin') -- La contraseña debe ser un hash de bcrypt real
ON CONFLICT (email) DO NOTHING;

-- Insertar un profesor
INSERT INTO escuela.usuarios (nombre, apellido, email, password_hash, rol) 
VALUES ('Profesor', 'Garcia', 'profesor@escuela.edu', '$2a$12$R.SjL0/y29yXbY/fF5d4u./N4cQ4Qk0gVnN6z0Mv0Qk0gVnN6z0Mv', 'profesor') -- La contraseña debe ser un hash de bcrypt real
ON CONFLICT (email) DO NOTHING;

-- Insertar estudiantes
INSERT INTO escuela.estudiantes (codigo_estudiante, nombre, apellido, email, telefono) VALUES
('E001', 'Juan', 'Perez', 'juan.perez@alumnos.edu', '5512345678'),
('E002', 'Maria', 'Gomez', 'maria.gomez@alumnos.edu', '5587654321')
ON CONFLICT (codigo_estudiante) DO NOTHING;

-- Insertar clases (CORREGIDO de grupos)
INSERT INTO escuela.clases (profesor_id, nombre, materia_nombre, fecha_inicio, fecha_fin, grado, grupo, ciclo_id)
SELECT u.usuario_id, 'Matemáticas 3A', 'Cálculo Diferencial', '2024-08-15', '2025-07-15', '3', 'A', c.ciclo_id
FROM escuela.usuarios u, escuela.ciclos_escolares c
WHERE u.email = 'profesor@escuela.edu' AND c.nombre = 'Ciclo 2024-2025'
ON CONFLICT DO NOTHING;

INSERT INTO escuela.clases (profesor_id, nombre, materia_nombre, fecha_inicio, fecha_fin, grado, grupo, ciclo_id)
SELECT u.usuario_id, 'Historia 1B', 'Historia Universal', '2024-08-15', '2025-07-15', '1', 'B', c.ciclo_id
FROM escuela.usuarios u, escuela.ciclos_escolares c
WHERE u.email = 'profesor@escuela.edu' AND c.nombre = 'Ciclo 2024-2025'
ON CONFLICT DO NOTHING;

-- Inscripciones (Ajustados los IDs a los valores insertados, y el nombre de la tabla)
INSERT INTO escuela.inscripciones (estudiante_id, clase_id)
SELECT e.estudiante_id, c.clase_id
FROM escuela.estudiantes e, escuela.clases c
WHERE e.codigo_estudiante = 'E001' AND c.nombre = 'Matemáticas 3A'
ON CONFLICT DO NOTHING;

INSERT INTO escuela.inscripciones (estudiante_id, clase_id)
SELECT e.estudiante_id, c.clase_id
FROM escuela.estudiantes e, escuela.clases c
WHERE e.codigo_estudiante = 'E002' AND c.nombre = 'Matemáticas 3A'
ON CONFLICT DO NOTHING;

-- Eventos de calendario (Ajustados los IDs)
INSERT INTO escuela.eventos_calendario (clase_id, titulo, fecha_inicio, tipo_evento, color)
SELECT c.clase_id, 'Examen Parcial 1', '2024-09-15', 'examen', '#FF6B6B'
FROM escuela.clases c WHERE c.nombre = 'Matemáticas 3A'
ON CONFLICT DO NOTHING;