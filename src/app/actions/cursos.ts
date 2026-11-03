"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCursos() {
  try {
    const { data: cursos, error } = await supabase
      .from('cursos')
      .select(`
        *,
        profesor:perfiles_usuarios(id, nombre, email),
        criterios:criterios_evaluacion(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error obteniendo cursos:", error);
      return [];
    }
    return cursos || [];
  } catch (err: any) {
    console.error("Error en getCursos:", err.message);
    return [];
  }
}

export async function getProfesores() {
  try {
    const { data, error } = await supabase
      .from('perfiles_usuarios')
      .select('id, nombre, email')
      .eq('rol', 'profesor')
      .eq('activo', true);

    if (error) {
      console.error("Error obteniendo profesores:", error);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.error("Error en getProfesores:", err.message);
    return [];
  }
}

export async function createCurso(data: {
  nombre: string;
  tipo: string;
  profesor_id: string;
  dias_semana: number[];
  hora_inicio?: string;
  hora_fin?: string;
  modalidad_evaluacion?: string;
  total_periodos?: number;
  nombres_periodos?: string[];
  criterios: { nombre: string; porcentaje: number; es_asistencia_automatica?: boolean }[];
}) {
  try {
    // 1. Insert course
    const { data: curso, error: cursoErr } = await supabase
      .from('cursos')
      .insert([{
        nombre: data.nombre,
        tipo: data.tipo,
        profesor_id: data.profesor_id || null,
        dias_semana: data.dias_semana,
        hora_inicio: data.hora_inicio || null,
        hora_fin: data.hora_fin || null,
        modalidad_evaluacion: data.modalidad_evaluacion || 'MESES',
        total_periodos: data.total_periodos || 3,
        nombres_periodos: data.nombres_periodos || [],
        activo: true
      }])
      .select()
      .single();

    if (cursoErr) {
      console.error("Error creando curso:", cursoErr);
      return { success: false, error: cursoErr.message };
    }

    // 2. Insert evaluation criteria
    if (data.criterios && data.criterios.length > 0) {
      const criteriaRows = data.criterios.map((c, idx) => ({
        curso_id: curso.id,
        nombre: c.nombre,
        porcentaje: c.porcentaje,
        es_asistencia_automatica: c.es_asistencia_automatica || false,
        orden: idx + 1
      }));

      const { error: critErr } = await supabase
        .from('criterios_evaluacion')
        .insert(criteriaRows);

      if (critErr) {
        console.error("Error insertando criterios:", critErr);
      }
    }

    revalidatePath('/admin/dashboard/cursos');
    return { success: true, cursoId: curso.id };
  } catch (err: any) {
    console.error("Error en createCurso:", err);
    return { success: false, error: err.message };
  }
}

export async function updateCurso(data: {
  id: string;
  nombre: string;
  tipo: string;
  profesor_id: string;
  dias_semana: number[];
  hora_inicio?: string;
  hora_fin?: string;
  modalidad_evaluacion?: string;
  total_periodos?: number;
  nombres_periodos?: string[];
  criterios: { nombre: string; porcentaje: number; es_asistencia_automatica?: boolean }[];
}) {
  try {
    // 1. Actualizar datos base del curso
    const updatePayload: any = {
      nombre: data.nombre,
      tipo: data.tipo,
      profesor_id: data.profesor_id || null,
      dias_semana: data.dias_semana,
      hora_inicio: data.hora_inicio || null,
      hora_fin: data.hora_fin || null,
    };

    if (data.modalidad_evaluacion !== undefined) updatePayload.modalidad_evaluacion = data.modalidad_evaluacion;
    if (data.total_periodos !== undefined) updatePayload.total_periodos = data.total_periodos;
    if (data.nombres_periodos !== undefined) updatePayload.nombres_periodos = data.nombres_periodos;

    const { error: cursoErr } = await supabase
      .from('cursos')
      .update(updatePayload)
      .eq('id', data.id);

    if (cursoErr) {
      console.error("Error actualizando curso:", cursoErr);
      return { success: false, error: cursoErr.message };
    }

    // 2. Reemplazar o actualizar criterios de evaluación
    if (data.criterios && data.criterios.length > 0) {
      // Eliminar criterios antiguos del curso
      await supabase
        .from('criterios_evaluacion')
        .delete()
        .eq('curso_id', data.id);

      // Insertar nuevos criterios actualizados
      const criteriaRows = data.criterios.map((c, idx) => ({
        curso_id: data.id,
        nombre: c.nombre,
        porcentaje: c.porcentaje,
        es_asistencia_automatica: c.es_asistencia_automatica || false,
        orden: idx + 1
      }));

      const { error: critErr } = await supabase
        .from('criterios_evaluacion')
        .insert(criteriaRows);

      if (critErr) {
        console.error("Error reinsertando criterios:", critErr);
      }
    }

    revalidatePath('/admin/dashboard/cursos');
    revalidatePath(`/admin/dashboard/cursos/${data.id}`);
    revalidatePath('/admin/dashboard/calificaciones');
    return { success: true };
  } catch (err: any) {
    console.error("Error en updateCurso:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteCurso(cursoId: string) {
  try {
    const { error } = await supabase
      .from('cursos')
      .delete()
      .eq('id', cursoId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/dashboard/cursos');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleEstadoCurso(cursoId: string, activo: boolean) {
  try {
    const { error } = await supabase
      .from('cursos')
      .update({ activo })
      .eq('id', cursoId);

    if (error) throw error;
    revalidatePath('/admin/dashboard/cursos');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/asistencia');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Obtener expediente 360 de un curso: Alumnos matriculados, asistencias históricas y calificaciones
export async function getDetalleCursoCompleto(cursoId: string) {
  try {
    // 1. Curso con profesor y criterios
    const { data: curso, error: cErr } = await supabase
      .from('cursos')
      .select(`
        *,
        profesor:perfiles_usuarios(id, nombre, email, telefono),
        criterios:criterios_evaluacion(*)
      `)
      .eq('id', cursoId)
      .single();

    if (cErr) throw cErr;

    // 2. Estudiantes inscritos en este curso
    const { data: estudiantes, error: eErr } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('curso_id', cursoId)
      .order('apellidos', { ascending: true });

    if (eErr) throw eErr;

    // 3. Todas las asistencias registradas para este curso
    const { data: asistencias, error: aErr } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', cursoId)
      .order('fecha', { ascending: false });

    if (aErr) throw aErr;

    // 4. Calificaciones de los estudiantes del curso
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

    // Calcular métricas de cada estudiante (asistencia y notas ponderadas)
    const estudiantesConMetricas = (estudiantes || []).map(est => {
      const estAsist = (asistencias || []).filter(a => a.estudiante_id === est.id);
      const totalAsist = estAsist.length;
      const presentes = estAsist.filter(a => a.estado === 'PRESENTE').length;
      const ausencias = estAsist.filter(a => a.estado === 'AUSENTE').length;
      const tardanzas = estAsist.filter(a => a.estado === 'TARDANZA').length;
      const pct = totalAsist > 0 ? Math.round((presentes / totalAsist) * 100) : 100;

      // Calcular nota final ponderada según los criterios del curso (suma directa de puntos)
      let notaPonderada = 0;
      let tieneNotas = false;
      if (curso.criterios && curso.criterios.length > 0) {
        curso.criterios.forEach((crit: any) => {
          const cRecord = calificaciones.find(c => c.estudiante_id === est.id && c.criterio_id === crit.id);
          if (cRecord && cRecord.calificacion !== undefined && cRecord.calificacion !== null) {
            tieneNotas = true;
            let val = Number(cRecord.nota !== undefined && cRecord.nota !== null ? cRecord.nota : cRecord.calificacion);
            const maxPts = Number(crit.porcentaje) || 20;
            if (val > maxPts) {
              val = Math.round(((val * maxPts) / 100) * 10) / 10;
            }
            notaPonderada += val;
          }
        });
      }

      return {
        ...est,
        metricas: {
          totalAsist,
          presentes,
          ausencias,
          tardanzas,
          pctAsistencia: pct,
          notaFinal: tieneNotas ? Math.round(notaPonderada * 10) / 10 : null,
          aprobado: tieneNotas ? (notaPonderada >= 70 && pct >= 80) : null
        }
      };
    });

    // Fechas únicas de asistencias tomadas
    const fechasTomadas = Array.from(new Set((asistencias || []).map(a => a.fecha))).sort().reverse();

    return {
      success: true,
      curso,
      estudiantes: estudiantesConMetricas,
      asistencias: asistencias || [],
      fechasTomadas,
      calificaciones
    };
  } catch (err: any) {
    console.error("Error en getDetalleCursoCompleto:", err);
    return { success: false, error: err.message };
  }
}


