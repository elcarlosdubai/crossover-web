"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getDirectorDashboardMetrics() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Obtener día de la semana actual (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    const dayOfWeek = new Date().getDay();

    // 1. Matrícula Estudiantil Activa
    const { data: estudiantes, error: eErr } = await supabase
      .from('estudiantes')
      .select('id, estado, curso_id, created_at');

    const totalEstudiantesActivos = (estudiantes || []).filter(e => e.estado === 'ACTIVO').length;

    // 2. Cuerpo Docente Activo
    const { data: docentes, error: dErr } = await supabase
      .from('perfiles_usuarios')
      .select('id, nombre, email, activo')
      .eq('rol', 'profesor')
      .eq('activo', true);

    const totalDocentes = (docentes || []).length;

    // 3. Cursos / Aulas con horario, días de impartición y profesor
    const { data: cursos, error: cErr } = await supabase
      .from('cursos')
      .select(`
        id,
        nombre,
        tipo,
        dias_semana,
        hora_inicio,
        hora_fin,
        profesor_id,
        profesor:perfiles_usuarios(id, nombre)
      `)
      .eq('activo', true);

    const totalCursos = (cursos || []).length;

    // Detectar aulas programadas para impartir clase hoy
    const aulasHoy = (cursos || []).filter(c => {
      if (!c.dias_semana || !Array.isArray(c.dias_semana) || c.dias_semana.length === 0) return true;
      return c.dias_semana.includes(dayOfWeek);
    });

    const totalAulasHoy = aulasHoy.length > 0 ? aulasHoy.length : totalCursos;

    // 4. Auditoría de Asistencia de Hoy (Pase de Lista)
    const { data: asistenciasHoy, error: aErr } = await supabase
      .from('asistencias')
      .select('id, curso_id, estudiante_id, estado, atencion_recepcion')
      .eq('fecha', today);

    const totalTomadosHoy = (asistenciasHoy || []).length;
    const presentesHoy = (asistenciasHoy || []).filter(a => a.estado === 'PRESENTE').length;
    const ausenciasHoy = (asistenciasHoy || []).filter(a => a.estado === 'AUSENTE').length;
    const tardanzasHoy = (asistenciasHoy || []).filter(a => a.estado === 'TARDANZA').length;
    const pctAsistenciaHoy = totalTomadosHoy > 0 ? Math.round((presentesHoy / totalTomadosHoy) * 100) : 100;

    // Cumplimiento por cada aula
    const cumplimientoAulas = (cursos || []).map(c => {
      const registrosCurso = (asistenciasHoy || []).filter(a => a.curso_id === c.id);
      const tomada = registrosCurso.length > 0;
      const alumnosPresentes = registrosCurso.filter(a => a.estado === 'PRESENTE').length;
      const alumnosAusentes = registrosCurso.filter(a => a.estado === 'AUSENTE').length;
      const pct = tomada ? Math.round((alumnosPresentes / registrosCurso.length) * 100) : 0;

      // Saber si este curso le correspondía dar clase hoy
      const tieneClaseHoy = !c.dias_semana || c.dias_semana.length === 0 || c.dias_semana.includes(dayOfWeek);

      const profNombre = Array.isArray(c.profesor) 
        ? (c.profesor[0]?.nombre || 'Sin asignar') 
        : ((c.profesor as any)?.nombre || 'Sin asignar');

      return {
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        hora_inicio: c.hora_inicio || 'Horario Flexible',
        hora_fin: c.hora_fin || '',
        tieneClaseHoy,
        profesor: profNombre,
        listaTomada: tomada,
        totalAlumnos: (estudiantes || []).filter(e => e.curso_id === c.id).length,
        presentes: alumnosPresentes,
        ausencias: alumnosAusentes,
        porcentaje: pct
      };
    });

    // Aulas que ya pasaron lista
    const aulasConListaTomada = cumplimientoAulas.filter(a => a.listaTomada).length;
    const aulasPendientes = totalAulasHoy - aulasConListaTomada;

    return {
      kpis: {
        totalEstudiantesActivos,
        totalDocentes,
        totalCursos,
        totalAulasHoy,
        pctAsistenciaHoy,
        presentesHoy,
        ausenciasHoy,
        tardanzasHoy,
        aulasConListaTomada,
        aulasPendientes: Math.max(0, aulasPendientes)
      },
      cumplimientoAulas,
      fechaHoy: today
    };
  } catch (err: any) {
    console.error("Error en getDirectorDashboardMetrics:", err);
    return null;
  }
}
