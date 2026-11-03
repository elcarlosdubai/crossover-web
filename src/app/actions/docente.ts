"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

// Obtener los cursos asignados al docente o todos si es Admin/Director
export async function getCursosDocente(profesorEmail?: string, userRol?: string) {
  try {
    let query = supabase
      .from('cursos')
      .select(`
        *,
        profesor:perfiles_usuarios(id, nombre, email),
        criterios:criterios_evaluacion(*)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (userRol === 'profesor' && profesorEmail) {
      const { data: profProfile } = await supabase
        .from('perfiles_usuarios')
        .select('id')
        .eq('email', profesorEmail)
        .maybeSingle();

      if (profProfile) {
        query = query.eq('profesor_id', profProfile.id);
      }
    }

    const { data: cursos, error } = await query;
    if (error) throw error;
    return cursos || [];
  } catch (err: any) {
    console.error("Error en getCursosDocente:", err);
    return [];
  }
}

// Obtener datos completos de la clase seleccionada (estudiantes, criterios, asistencia de hoy, notas registradas)
export async function getDetalleCursoDocente(cursoId: string, fecha?: string) {
  try {
    const targetDate = fecha || new Date().toISOString().split('T')[0];

    // 1. Curso con sus criterios configurados por el Director
    const { data: curso, error: cErr } = await supabase
      .from('cursos')
      .select(`
        *,
        profesor:perfiles_usuarios(id, nombre, email),
        criterios:criterios_evaluacion(*)
      `)
      .eq('id', cursoId)
      .single();

    if (cErr) throw cErr;

    // 2. Estudiantes del curso
    const { data: estudiantes, error: eErr } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('curso_id', cursoId)
      .eq('estado', 'ACTIVO')
      .order('nombres', { ascending: true });

    if (eErr) throw eErr;

    // 3. Asistencias de hoy para este curso
    const { data: asistenciasHoy, error: aErr } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', cursoId)
      .eq('fecha', targetDate);

    if (aErr) throw aErr;

    // 4. Calificaciones registradas para los estudiantes de este curso
    const studentIds = (estudiantes || []).map(e => e.id);
    let calificaciones: any[] = [];
    if (studentIds.length > 0) {
      const { data: califs, error: calErr } = await supabase
        .from('calificaciones')
        .select('*')
        .in('estudiante_id', studentIds);
      if (calErr) throw calErr;
      calificaciones = califs || [];
    }

    return {
      curso,
      fecha: targetDate,
      estudiantes: estudiantes || [],
      asistenciasHoy: asistenciasHoy || [],
      calificaciones
    };
  } catch (err: any) {
    console.error("Error en getDetalleCursoDocente:", err);
    return null;
  }
}

// Guardar pase de lista diario
export async function guardarAsistenciaDocente(cursoId: string, fecha: string, registros: { estudiante_id: string; estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' }[]) {
  try {
    for (const r of registros) {
      const { data: existing } = await supabase
        .from('asistencias')
        .select('id')
        .eq('estudiante_id', r.estudiante_id)
        .eq('fecha', fecha)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('asistencias')
          .update({
            estado: r.estado,
            atencion_recepcion: r.estado === 'AUSENTE' ? 'PENDIENTE' : 'NINGUNA'
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('asistencias')
          .insert({
            curso_id: cursoId,
            estudiante_id: r.estudiante_id,
            fecha,
            estado: r.estado,
            atencion_recepcion: r.estado === 'AUSENTE' ? 'PENDIENTE' : 'NINGUNA'
          });
      }
    }

    revalidatePath('/admin/dashboard/calificaciones');
    revalidatePath('/admin/dashboard/asistencia');
    return { success: true };
  } catch (err: any) {
    console.error("Error guardando asistencias:", err);
    return { success: false, error: err.message };
  }
}

// Guardar calificaciones por criterio y periodo (Mes 1, 2, 3 o Módulo 1, 2, 3)
export async function guardarCalificacionesDocente(
  calificaciones: { estudiante_id: string; criterio_id: string; calificacion: number; periodo?: number }[]
) {
  try {
    for (const item of calificaciones) {
      const periodoVal = item.periodo && item.periodo >= 1 ? item.periodo : 1;
      
      const { data: existing } = await supabase
        .from('calificaciones')
        .select('id')
        .eq('estudiante_id', item.estudiante_id)
        .eq('criterio_id', item.criterio_id)
        .eq('periodo', periodoVal)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('calificaciones')
          .update({ 
            nota: item.calificacion,
            periodo: periodoVal,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('calificaciones')
          .insert({
            estudiante_id: item.estudiante_id,
            criterio_id: item.criterio_id,
            periodo: periodoVal,
            nota: item.calificacion
          });
      }
    }

    revalidatePath('/admin/dashboard/calificaciones');
    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/cursos');
    return { success: true };
  } catch (err: any) {
    console.error("Error guardando calificaciones:", err);
    return { success: false, error: err.message };
  }
}
