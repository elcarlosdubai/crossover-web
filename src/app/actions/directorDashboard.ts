"use server";

import { createClient } from '@supabase/supabase-js';
import { getTodayRD, getDayRangeUTCRangeForRD } from '@/lib/dateRD';
import { requireRole } from '@/utils/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getDirectorDashboardMetrics() {
  try {
    await requireRole(['admin', 'director']);
    const today = getTodayRD();

    // Obtener día de la semana actual (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    const dayOfWeek = new Date().getDay();

    // 1. Matrícula Estudiantil Activa
    const { data: estudiantes, error: eErr } = await supabase
      .from('estudiantes')
      .select('id, nombres, apellidos, estado, curso_id, created_at');

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

    // Aulas que ya pasaron lista (solo contando las que tocan hoy)
    const aulasDeHoy = cumplimientoAulas.filter(a => a.tieneClaseHoy);
    const aulasConListaTomada = aulasDeHoy.filter(a => a.listaTomada).length;
    const aulasPendientes = aulasDeHoy.length - aulasConListaTomada;

    // Ordenar: primero las de hoy pendientes, luego las de hoy pasadas, luego otros días
    cumplimientoAulas.sort((a, b) => {
      if (a.tieneClaseHoy !== b.tieneClaseHoy) return a.tieneClaseHoy ? -1 : 1;
      if (a.listaTomada !== b.listaTomada) return a.listaTomada ? 1 : -1;
      return a.nombre.localeCompare(b.nombre);
    });

    // Pulso de Recepción hoy
    const ausenciasListHoy = (asistenciasHoy || []).filter(a => a.estado === 'AUSENTE');
    const ausenciasPendientesRecepcion = ausenciasListHoy.filter(
      a => !a.atencion_recepcion || a.atencion_recepcion === 'PENDIENTE'
    ).length;
    const ausenciasAtendidasRecepcion = ausenciasListHoy.length - ausenciasPendientesRecepcion;

    const { startISO: inicioHoy, endISO: finHoy } = getDayRangeUTCRangeForRD(today);
    const hace30Dias = getTodayRD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const [{ count: accionesAuditoriaHoy }, { count: solicitudesDocentesPendientes }, { data: ausenciasRecientes30 }] = await Promise.all([
      supabase
        .from('registro_comunicaciones')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_evento', 'auditoria_recepcion')
        .gte('created_at', inicioHoy)
        .lte('created_at', finHoy),
      supabase
        .from('registro_comunicaciones')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_evento', 'seguimiento_docente')
        .eq('estado', 'pendiente'),
      supabase
        .from('asistencias')
        .select('estudiante_id, curso_id, fecha, atencion_recepcion')
        .eq('estado', 'AUSENTE')
        .gte('fecha', hace30Dias)
    ]);

    // Detectar alumnos activos con 2+ ausencias no justificadas en los últimos 30 días
    const faltasPorAlumno: Record<string, number> = {};
    for (const row of ausenciasRecientes30 || []) {
      if (row.estudiante_id && row.atencion_recepcion !== 'JUSTIFICADA') {
        faltasPorAlumno[row.estudiante_id] = (faltasPorAlumno[row.estudiante_id] || 0) + 1;
      }
    }
    const cursosMap = new Map((cursos || []).map((c: any) => [c.id, c.nombre]));
    const estudiantesRiesgo = (estudiantes || [])
      .filter((e: any) => e.estado === 'ACTIVO' && (faltasPorAlumno[e.id] || 0) >= 2)
      .map((e: any) => ({
        id: e.id,
        nombre: `${e.nombres || ''} ${e.apellidos || ''}`.trim() || 'Estudiante',
        curso: cursosMap.get(e.curso_id) || 'Curso',
        faltas: faltasPorAlumno[e.id] || 0
      }))
      .sort((a, b) => b.faltas - a.faltas)
      .slice(0, 12);

    return {
      kpis: {
        totalEstudiantesActivos,
        totalDocentes,
        totalCursos,
        totalAulasHoy: aulasDeHoy.length > 0 ? aulasDeHoy.length : totalAulasHoy,
        pctAsistenciaHoy,
        presentesHoy,
        ausenciasHoy,
        tardanzasHoy,
        aulasConListaTomada,
        aulasPendientes: Math.max(0, aulasPendientes),
        ausenciasPendientesRecepcion,
        ausenciasAtendidasRecepcion,
        accionesAuditoriaHoy: accionesAuditoriaHoy || 0,
        solicitudesDocentesPendientes: solicitudesDocentesPendientes || 0
      },
      cumplimientoAulas,
      estudiantesRiesgo,
      fechaHoy: today
    };
  } catch (err: any) {
    console.error("Error en getDirectorDashboardMetrics:", err);
    return null;
  }
}
