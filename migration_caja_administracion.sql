-- ============================================================================
-- MIGRACIÓN CAJA, CUOTAS POR TRIMESTRE/MÓDULO, FAMILIAS, CIERRE Y POS
-- 100% idempotente y compatible con el esquema actual de Crossover Web
-- ============================================================================

-- 1. Familias / Pagadores (para agrupar hermanos opcionalmente)
CREATE TABLE IF NOT EXISTS familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_familia TEXT NOT NULL,
  responsable_principal TEXT NOT NULL,
  telefono TEXT NOT NULL,
  telefono_secundario TEXT DEFAULT '',
  email TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_familias_telefono ON familias (telefono);

-- 2. Columnas adicionales en estudiantes (opcionales, sin romper registros actuales)
ALTER TABLE estudiantes
  ADD COLUMN IF NOT EXISTS familia_id UUID REFERENCES familias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fecha_inscripcion_formal DATE,
  ADD COLUMN IF NOT EXISTS inscrito_por TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_estudiantes_familia ON estudiantes (familia_id);

-- 3. Tarifas base en cursos
ALTER TABLE cursos
  ADD COLUMN IF NOT EXISTS tarifa_mensual NUMERIC(12,2) DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS tarifa_inscripcion NUMERIC(12,2) DEFAULT 0;

-- 4. Trimestres / Ciclos académicos
CREATE TABLE IF NOT EXISTS trimestres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL, -- Ej: 2026-T4
  nombre TEXT NOT NULL,        -- Ej: Octubre - Diciembre 2026
  meses JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ej: ["Octubre","Noviembre","Diciembre"]
  activo BOOLEAN DEFAULT TRUE,
  cerrado BOOLEAN DEFAULT FALSE,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cargos / Cuotas por estudiante (inscripción, meses/módulos, deudas arrastradas)
CREATE TABLE IF NOT EXISTS cargos_estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  trimestre_id UUID REFERENCES trimestres(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'MENSUALIDAD', -- INSCRIPCION | MENSUALIDAD | DEUDA_ANTERIOR | OTRO
  concepto TEXT NOT NULL,                   -- Ej: "Noviembre (2026-T4)"
  orden_secuencial INTEGER NOT NULL DEFAULT 1,
  monto_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  recargo NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE | PARCIAL | PAGADO | ANULADO
  fecha_vencimiento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cargos_estudiante_estado ON cargos_estudiantes (estudiante_id, estado);

-- 6. Cierres de Caja (por turno y cajero)
CREATE TABLE IF NOT EXISTS cierres_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_operativa DATE NOT NULL,
  cajero_nombre TEXT NOT NULL,
  total_efectivo_sistema NUMERIC(12,2) DEFAULT 0,
  total_transferencia_sistema NUMERIC(12,2) DEFAULT 0,
  total_tarjeta_sistema NUMERIC(12,2) DEFAULT 0,
  total_cheque_sistema NUMERIC(12,2) DEFAULT 0,
  total_egresos NUMERIC(12,2) DEFAULT 0,
  efectivo_contado NUMERIC(12,2) DEFAULT 0,
  diferencia NUMERIC(12,2) DEFAULT 0,
  conteo_billetes JSONB DEFAULT '{}'::jsonb,
  notas TEXT DEFAULT '',
  cerrado_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Egresos / Salidas de Caja
CREATE TABLE IF NOT EXISTS egresos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_operativa DATE NOT NULL,
  cajero_nombre TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  cierre_id UUID REFERENCES cierres_caja(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ampliación de recibos (100% compatible con recibos existentes)
ALTER TABLE recibos
  ADD COLUMN IF NOT EXISTS cajero_nombre TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cierre_id UUID REFERENCES cierres_caja(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_ingreso TEXT DEFAULT 'MENSUALIDAD', -- INSCRIPCION | MENSUALIDAD | DEUDA | POS_LIBRO | OTRO
  ADD COLUMN IF NOT EXISTS metodos_detalle JSONB DEFAULT '[]'::jsonb, -- [{ metodo, monto }]
  ADD COLUMN IF NOT EXISTS descuento NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_operativa DATE;

CREATE INDEX IF NOT EXISTS idx_recibos_cierre ON recibos (cierre_id);
CREATE INDEX IF NOT EXISTS idx_recibos_fecha_op ON recibos (fecha_operativa);

-- 9. POS de Libros y Productos (separado de mensualidades)
CREATE TABLE IF NOT EXISTS productos_pos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'LIBRO', -- LIBRO | UNIFORME | MATERIAL | OTRO
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas_pos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recibo_id UUID REFERENCES recibos(id) ON DELETE SET NULL,
  fecha_operativa DATE NOT NULL,
  cajero_nombre TEXT NOT NULL,
  cliente_nombre TEXT DEFAULT 'Cliente Mostrador',
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ producto_id, nombre, cantidad, precio_unitario, subtotal }]
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  metodo_pago TEXT NOT NULL DEFAULT 'EFECTIVO',
  cierre_id UUID REFERENCES cierres_caja(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
