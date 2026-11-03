-- 1. Asegurar columna periodo en asistencias
ALTER TABLE public.asistencias 
ADD COLUMN IF NOT EXISTS periodo INT DEFAULT 1 CHECK (periodo >= 1 AND periodo <= 24);

-- 2. Asegurar restricción única por estudiante, curso y fecha
ALTER TABLE public.asistencias DROP CONSTRAINT IF EXISTS uq_asistencia_estudiante_curso_fecha;
ALTER TABLE public.asistencias 
ADD CONSTRAINT uq_asistencia_estudiante_curso_fecha UNIQUE (estudiante_id, curso_id, fecha);

-- 3. Tabla para suspensiones de clases / feriados
CREATE TABLE IF NOT EXISTS public.clases_suspendidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    motivo TEXT DEFAULT 'Feriado / Suspensión Oficial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_clase_suspendida UNIQUE (curso_id, fecha)
);

-- Habilitar RLS en clases_suspendidas
ALTER TABLE public.clases_suspendidas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a clases_suspendidas para autenticados" ON public.clases_suspendidas;
CREATE POLICY "Acceso total a clases_suspendidas para autenticados" ON public.clases_suspendidas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
