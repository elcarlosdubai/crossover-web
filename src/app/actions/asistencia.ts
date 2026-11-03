"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAuditoriaAsistenciasDirector(fecha?: string) {
  try {
    const targetDate = fecha || new Date().toISOString().split('T')[0];

    // 1. Fetch all active courses
    const { data: cursos, error: cErr } = await supabase
      .from('cursos')
      .select(`
        id,
        nombre,
        tipo,
        dias_semana,
        hora_inicio,
        hora_fin,
        minimo_asistencia_pct,
        profesor:perfiles_usuarios(id, nombre)
      `)
      .eq('activo', true);

    if (cErr) throw cErr;

    // 2. Fetch all attendance records for target date
    const { data: asistencias, error: aErr } = await supabase
      .from('asistencias')
      .select(`
        *,
        estudiante:estudiantes(id, matricula, nombres, apellidos, tutor_telefono)
      `)
      .eq('fecha', targetDate);

    if (aErr) throw aErr;

    // 3. Fetch all active students
    const { data: estudiantes, error: eErr } = await supabase
      .from('estudiantes')
      .select('id, matricula, nombres, apellidos, curso_id')
      .eq('estado', 'ACTIVO');

    if (eErr) throw eErr;

    // Build consolidated summary by course
    const resumenCursos = (cursos || []).map(curso => {
      const estudiantesCurso = (estudiantes || []).filter(e => e.curso_id === curso.id);
      const asistenciasCurso = (asistencias || []).filter(a => a.curso_id === curso.id);

      const presentes = asistenciasCurso.filter(a => a.estado === 'PRESENTE').length;
      const ausentes = asistenciasCurso.filter(a => a.estado === 'AUSENTE').length;
      const tardanzas = asistenciasCurso.filter(a => a.estado === 'TARDANZA').length;
      const totalTomados = asistenciasCurso.length;

      // Check if attendance was taken today
      const listaTomada = totalTomados > 0;
      const porcentaje = totalTomados > 0 ? Math.round((presentes / totalTomados) * 100) : 0;

      return {
        ...curso,
        totalEstudiantes: estudiantesCurso.length,
        listaTomada,
        presentes,
        ausentes,
        tardanzas,
        porcentajeAsistencia: porcentaje,
        detalleEstudiantes: asistenciasCurso
      };
    });

    // Global Stats
    const totalAusenciasHoy = (asistencias || []).filter(a => a.estado === 'AUSENTE').length;
    const totalPresentesHoy = (asistencias || []).filter(a => a.estado === 'PRESENTE').length;
    const totalRegistrosHoy = (asistencias || []).length;
    const promedioGeneral = totalRegistrosHoy > 0 ? Math.round((totalPresentesHoy / totalRegistrosHoy) * 100) : 100;

    return {
      fecha: targetDate,
      resumenCursos,
      kpis: {
        totalAusenciasHoy,
        totalPresentesHoy,
        promedioGeneral,
        totalCursos: cursos?.length || 0
      }
    };
  } catch (err: any) {
    console.error("Error en getAuditoriaAsistenciasDirector:", err);
    return null;
  }
}

/**
 * Calcula las fechas de clase de un mes basándose en los días de la semana configurados en el curso.
 * diasSemana: [0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb]
 */
export async function calcularFechasClaseMes(diasSemana: number[], anio: number, mes: number): Promise<string[]> {
  const fechas: string[] = [];
  const diasEnMes = new Date(anio, mes, 0).getDate(); // mes 1-indexed

  for (let d = 1; d <= diasEnMes; d++) {
    const dateObj = new Date(anio, mes - 1, d);
    if (diasSemana.includes(dateObj.getDay())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      fechas.push(`${yyyy}-${mm}-${dd}`);
    }
  }
  return fechas;
}

/**
 * Obtiene la estructura completa tipo "Sábana" de asistencia mensual para un curso.
 */
export async function getSabanaAsistenciaCurso(cursoId: string, anio: number, mes: number) {
  try {
    // 1. Obtener detalles del curso
    const { data: curso, error: cErr } = await supabase
      .from('cursos')
      .select('id, nombre, dias_semana, minimo_asistencia_pct')
      .eq('id', cursoId)
      .single();

    if (cErr || !curso) throw new Error("Curso no encontrado");

    const diasSemana = curso.dias_semana || [6];
    const fechasClase = await calcularFechasClaseMes(diasSemana, anio, mes);

    // 2. Obtener suspensiones de clase / feriados
    const { data: suspensiones } = await supabase
      .from('clases_suspendidas')
      .select('fecha, motivo')
      .eq('curso_id', cursoId)
      .gte('fecha', `${anio}-${String(mes).padStart(2, '0')}-01`)
      .lte('fecha', `${anio}-${String(mes).padStart(2, '0')}-31`);

    const mapaSuspensiones: Record<string, string> = {};
    (suspensiones || []).forEach(s => {
      mapaSuspensiones[s.fecha] = s.motivo || 'Feriado / Suspendida';
    });

    // 3. Obtener estudiantes del curso
    const { data: estudiantes, error: eErr } = await supabase
      .from('estudiantes')
      .select('id, matricula, nombres, apellidos, created_at, tutor_nombre, tutor_telefono')
      .eq('curso_id', cursoId)
      .order('apellidos', { ascending: true });

    if (eErr) throw eErr;

    // 4. Obtener asistencias del mes para este curso
    const { data: asistencias, error: aErr } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', cursoId)
      .gte('fecha', `${anio}-${String(mes).padStart(2, '0')}-01`)
      .lte('fecha', `${anio}-${String(mes).padStart(2, '0')}-31`);

    if (aErr) throw aErr;

    // 5. Cruzar matriz
    const matrizEstudiantes = (estudiantes || []).map(est => {
      const fechaIngresoStr = est.created_at ? est.created_at.split('T')[0] : '2000-01-01';
      const registrosPorFecha: Record<string, { estado: string; observaciones?: string }> = {};

      let presentes = 0;
      let ausentes = 0;
      let tardanzas = 0;
      let excusados = 0;
      let clasesValidasImpartidas = 0;

      fechasClase.forEach(f => {
        // Buscar primero si existe registro real de asistencia
        const match = (asistencias || []).find(a => a.estudiante_id === est.id && a.fecha === f);

        // Si no hay registro y la fecha es previa a su ingreso
        if (!match && f < fechaIngresoStr) {
          registrosPorFecha[f] = { estado: 'NO_MATRICULADO' };
          return;
        }

        // Si fue clase suspendida/feriado
        if (mapaSuspensiones[f]) {
          registrosPorFecha[f] = { estado: 'FERIADO', observaciones: mapaSuspensiones[f] };
          return;
        }

        // Buscar registro real
        if (match) {
          registrosPorFecha[f] = { estado: match.estado, observaciones: match.observaciones };
          clasesValidasImpartidas++;
          if (match.estado === 'PRESENTE') presentes++;
          else if (match.estado === 'AUSENTE') ausentes++;
          else if (match.estado === 'TARDANZA') tardanzas++;
          else if (match.estado === 'EXCUSADO') excusados++;
        } else {
          registrosPorFecha[f] = { estado: 'PENDIENTE' };
        }
      });

      // Cálculo de porcentaje: excusados no perjudican la nota
      const totalAsistenciasComputables = presentes + excusados;
      const pct = clasesValidasImpartidas > 0 
        ? Math.round((totalAsistenciasComputables / clasesValidasImpartidas) * 100) 
        : 100;

      return {
        ...est,
        registros: registrosPorFecha,
        resumen: {
          presentes,
          ausentes,
          tardanzas,
          excusados,
          clasesValidasImpartidas,
          porcentaje: pct
        }
      };
    });

    return {
      success: true,
      curso,
      fechasClase,
      mapaSuspensiones,
      estudiantes: matrizEstudiantes
    };
  } catch (error: any) {
    console.error("Error en getSabanaAsistenciaCurso:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Guarda en lote la asistencia de la sábana mensual mediante upsert seguro.
 */
export async function guardarSabanaAsistencia(
  cursoId: string, 
  registros: Array<{ estudiante_id: string; fecha: string; estado: string; periodo?: number; observaciones?: string }>
) {
  try {
    if (!registros || registros.length === 0) return { success: true };

    const payload = registros.map(r => ({
      curso_id: cursoId,
      estudiante_id: r.estudiante_id,
      fecha: r.fecha,
      estado: r.estado,
      periodo: r.periodo || 1,
      observaciones: r.observaciones || null
    }));

    const { error } = await supabase
      .from('asistencias')
      .upsert(payload, { onConflict: 'estudiante_id,curso_id,fecha' });

    if (error) throw error;

    revalidatePath(`/admin/dashboard/cursos/${cursoId}`);
    revalidatePath('/admin/dashboard/asistencia');
    revalidatePath('/admin/dashboard/estudiantes');

    return { success: true };
  } catch (error: any) {
    console.error("Error en guardarSabanaAsistencia:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Marca o desmarca un día completo como clase suspendida o feriado.
 */
export async function toggleSuspensionClase(cursoId: string, fecha: string, motivo?: string) {
  try {
    // Verificar si ya existe
    const { data: existente } = await supabase
      .from('clases_suspendidas')
      .select('id')
      .eq('curso_id', cursoId)
      .eq('fecha', fecha)
      .maybeSingle();

    if (existente) {
      await supabase.from('clases_suspendidas').delete().eq('id', existente.id);
    } else {
      await supabase.from('clases_suspendidas').insert({
        curso_id: cursoId,
        fecha,
        motivo: motivo || 'Feriado / Suspensión Oficial'
      });
    }

    revalidatePath(`/admin/dashboard/cursos/${cursoId}`);
    revalidatePath('/admin/dashboard/asistencia');
    return { success: true };
  } catch (error: any) {
    console.error("Error en toggleSuspensionClase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza la justificación u observación de una inasistencia específica (ej: Licencia Médica).
 */
export async function justificarInasistenciaEstudiante(
  asistenciaId: string,
  nuevoEstado: 'EXCUSADO' | 'AUSENTE' | 'PRESENTE' | 'TARDANZA',
  observaciones: string
) {
  try {
    const { error } = await supabase
      .from('asistencias')
      .update({
        estado: nuevoEstado,
        observaciones: observaciones
      })
      .eq('id', asistenciaId);

    if (error) throw error;

    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/asistencia');
    return { success: true };
  } catch (error: any) {
    console.error("Error en justificarInasistenciaEstudiante:", error);
    return { success: false, error: error.message };
  }
}
