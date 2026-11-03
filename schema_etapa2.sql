-- ==============================================================================
-- SISTEMA ESCOLAR Y ADMINISTRATIVO CROSSOVER - ETAPA 2
-- Esquema de Tablas Maestras para Supabase (PostgreSQL)
-- ==============================================================================

-- 1. TABLA: perfiles_usuarios (Roles del sistema enlazados con auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles_usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  rol VARCHAR(30) NOT NULL CHECK (rol IN ('admin', 'director', 'recepcion', 'profesor', 'editor')),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: cursos (Configurador dinámico de cursos, horarios y asistencia)
CREATE TABLE IF NOT EXISTS public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'REGULAR', -- 'REGULAR', 'TECNICO', 'TALLER'
  profesor_id UUID REFERENCES public.perfiles_usuarios(id) ON DELETE SET NULL,
  dias_semana INT[] NOT NULL,         -- [2, 4] = Martes y Jueves | [6] = Sábados | [1,2,3,4,5] = L-V
  hora_inicio TIME,
  hora_fin TIME,
  minimo_asistencia_pct INT DEFAULT 80,
  modalidad_evaluacion VARCHAR(30) DEFAULT 'MESES', -- 'MESES' | 'MODULOS' | 'UNICO'
  total_periodos INT DEFAULT 3,
  nombres_periodos JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: criterios_evaluacion (Renglones de evaluación y ponderación por curso)
CREATE TABLE IF NOT EXISTS public.criterios_evaluacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,       -- Ej: 'Oral Test', 'Writing', 'Examen Final', 'Proyecto'
  porcentaje NUMERIC(5,2) NOT NULL,   -- Ej: 25.00, 30.00, 100.00 (debe sumar 100)
  periodo VARCHAR(50) DEFAULT 'GENERAL',
  es_asistencia_automatica BOOLEAN DEFAULT false,
  orden INT DEFAULT 1
);

-- 4. TABLA: estudiantes (Registro oficial de alumnos con token privado para el tutor)
CREATE TABLE IF NOT EXISTS public.estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula VARCHAR(50) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  tutor_nombre VARCHAR(150) NOT NULL,
  tutor_telefono VARCHAR(25) NOT NULL,
  tutor_email VARCHAR(150),
  token_consulta VARCHAR(64) UNIQUE NOT NULL,
  estado VARCHAR(30) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'RETIRADO', 'EGRESADO')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: asistencias (Pase de lista del maestro + filtro de gestión en recepción)
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  profesor_id UUID REFERENCES public.perfiles_usuarios(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('PRESENTE', 'AUSENTE', 'TARDANZA')),
  gestion_recepcion VARCHAR(30) DEFAULT 'PENDIENTE' 
    CHECK (gestion_recepcion IN ('PENDIENTE', 'JUSTIFICADA', 'WHATSAPP_ENVIADO', 'LLAMADO_REALIZADO', 'IGNORADA')),
  nota_recepcion TEXT,
  fecha_gestion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: calificaciones (Notas reales por estudiante, criterio y periodo/mes/módulo)
CREATE TABLE IF NOT EXISTS public.calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  criterio_id UUID NOT NULL REFERENCES public.criterios_evaluacion(id) ON DELETE CASCADE,
  periodo INT DEFAULT 1 CHECK (periodo >= 1 AND periodo <= 12),
  nota NUMERIC(5,2) NOT NULL,
  profesor_id UUID REFERENCES public.perfiles_usuarios(id) ON DELETE SET NULL,
  observacion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_estudiante_criterio_periodo UNIQUE (estudiante_id, criterio_id, periodo)
);

-- 6.1 TABLA: estudiantes_historial_academico (Instantáneas inmutables de promociones y cierres)
CREATE TABLE IF NOT EXISTS public.estudiantes_historial_academico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  curso_nombre VARCHAR(150) NOT NULL,
  periodo_academico VARCHAR(50),
  promedio_final NUMERIC(5,2) NOT NULL,
  porcentaje_asistencia INT DEFAULT 100,
  estado_cierre VARCHAR(30) DEFAULT 'APROBADO',
  fecha_promocion TIMESTAMPTZ DEFAULT NOW(),
  calificaciones_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  observaciones TEXT
);

-- 7. TABLA: recibos (Caja digital: Estudiantes oficiales y clientes externos)
CREATE TABLE IF NOT EXISTS public.recibos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_recibo VARCHAR(50) UNIQUE NOT NULL,
  estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE SET NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(25) NOT NULL,
  cliente_email VARCHAR(150),
  concepto VARCHAR(255) NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA')),
  referencia_bancaria VARCHAR(100),
  token_recibo VARCHAR(64) UNIQUE NOT NULL,
  emitido_por UUID REFERENCES public.perfiles_usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: preinscripciones (Formularios web de aspirantes para recepción)
CREATE TABLE IF NOT EXISTS public.preinscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres_aspirante VARCHAR(100) NOT NULL,
  apellidos_aspirante VARCHAR(100) NOT NULL,
  curso_solicitado VARCHAR(150) NOT NULL,
  nombre_tutor VARCHAR(150) NOT NULL,
  telefono_tutor VARCHAR(25) NOT NULL,
  email_tutor VARCHAR(150),
  estado VARCHAR(30) DEFAULT 'NUEVA' CHECK (estado IN ('NUEVA', 'CONTACTADO', 'APROBADO', 'RECHAZADO')),
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE RENDIMIENTO (Búsquedas rápidas sin saturar base de datos)
CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON public.estudiantes(curso_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_token ON public.estudiantes(token_consulta);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_curso ON public.asistencias(fecha, curso_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_gestion ON public.asistencias(gestion_recepcion);
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON public.calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_recibos_token ON public.recibos(token_recibo);
CREATE INDEX IF NOT EXISTS idx_recibos_estudiante ON public.recibos(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_preinscripciones_estado ON public.preinscripciones(estado);
