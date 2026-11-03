"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getEstudiantesDirector(cursoId?: string) {
  try {
    let query = supabase
      .from('estudiantes')
      .select(`
        *,
        curso:cursos(id, nombre, tipo, hora_inicio, hora_fin, profesor:perfiles_usuarios(nombre))
      `)
      .order('nombres', { ascending: true });

    if (cursoId && cursoId !== 'todos') {
      query = query.eq('curso_id', cursoId);
    }

    const { data: estudiantes, error } = await query;
    if (error) throw error;

    // Obtener asistencias y calificaciones para calcular métricas por estudiante
    const { data: asistencias } = await supabase.from('asistencias').select('estudiante_id, estado');
    const { data: calificaciones } = await supabase.from('calificaciones').select('estudiante_id, calificacion, nota, periodo');

    const listaConMetricas = (estudiantes || []).map(est => {
      const asistenciasEst = (asistencias || []).filter(a => a.estudiante_id === est.id);
      const totalAsist = asistenciasEst.length;
      const presentes = asistenciasEst.filter(a => a.estado === 'PRESENTE').length;
      const ausencias = asistenciasEst.filter(a => a.estado === 'AUSENTE').length;
      const pctAsistencia = totalAsist > 0 ? Math.round((presentes / totalAsist) * 100) : 100;

      // Filtrar notas del periodo 1 o más reciente para no inflar la métrica general
      const todasNotasEst = (calificaciones || []).filter(c => c.estudiante_id === est.id);
      const notasEst = todasNotasEst.filter(c => (c.periodo || 1) === 1);
      const sumaNotas = (notasEst.length > 0 ? notasEst : todasNotasEst).reduce((acc, curr) => {
        const val = Number(curr.nota !== undefined && curr.nota !== null ? curr.nota : curr.calificacion) || 0;
        return acc + val;
      }, 0);
      const promedioNotas = (notasEst.length > 0 ? notasEst : todasNotasEst).length > 0 
        ? Math.round(sumaNotas) 
        : null;

      return {
        ...est,
        metricas: {
          totalAsistencias: totalAsist,
          presentes,
          ausencias,
          pctAsistencia,
          promedioNotas
        }
      };
    });

    return listaConMetricas;
  } catch (err: any) {
    console.error("Error en getEstudiantesDirector:", err);
    return [];
  }
}

export async function createEstudiante(data: {
  nombres: string;
  apellidos: string;
  curso_id: string;
  tutor_nombre?: string;
  tutor_telefono?: string;
  email?: string;
}) {
  try {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const matricula = `CR-${year}-${randomSeq}`;
    const tokenConsulta = `tkn_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;

    const { data: nuevo, error } = await supabase
      .from('estudiantes')
      .insert({
        matricula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        curso_id: data.curso_id,
        tutor_nombre: data.tutor_nombre || '',
        tutor_telefono: data.tutor_telefono || '',
        email: data.email || null,
        token_consulta: tokenConsulta,
        estado: 'ACTIVO'
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/asistencia');
    revalidatePath('/admin/dashboard/cursos');
    if (data.curso_id) {
      revalidatePath(`/admin/dashboard/cursos/${data.curso_id}`);
    }
    return { success: true, estudiante: nuevo };
  } catch (err: any) {
    console.error("Error al crear estudiante:", err);
    return { success: false, error: err.message };
  }
}

export async function seedEstudiantesDemoSiVacio() {
  try {
    const { data: existing } = await supabase.from('estudiantes').select('id').limit(1);
    if (existing && existing.length > 0) return { success: true, message: "Ya existen estudiantes" };

    const { data: cursos } = await supabase.from('cursos').select('id').limit(1);
    if (!cursos || cursos.length === 0) return { success: false, message: "No hay cursos disponibles" };

    const cursoId = cursos[0].id;
    const year = new Date().getFullYear();

    const demos = [
      { nombres: "Alejandro", apellidos: "Pérez Gómez", tutor: "Carmen Gómez", tel: "809-555-0101" },
      { nombres: "Laura Sofía", apellidos: "Martínez Díaz", tutor: "Roberto Martínez", tel: "809-555-0102" },
      { nombres: "Carlos Manuel", apellidos: "Rodríguez Peña", tutor: "Yomaira Peña", tel: "809-555-0103" },
      { nombres: "Valentina", apellidos: "Santana Cruz", tutor: "Marcos Santana", tel: "809-555-0104" },
      { nombres: "Diego Andrés", apellidos: "Castillo Reyes", tutor: "Patricia Reyes", tel: "809-555-0105" }
    ];

    for (let i = 0; i < demos.length; i++) {
      const d = demos[i];
      const matricula = `CR-${year}-00${i + 1}`;
      const token = `tkn_demo_${i + 1}_${Math.random().toString(36).substring(2, 8)}`;
      await supabase.from('estudiantes').insert({
        matricula,
        nombres: d.nombres,
        apellidos: d.apellidos,
        curso_id: cursoId,
        tutor_nombre: d.tutor,
        tutor_telefono: d.tel,
        token_consulta: token,
        estado: 'ACTIVO'
      });
    }

    // Insertar registros de asistencia inicial para el demo
    const today = new Date().toISOString().split('T')[0];
    const { data: todosEstudiantes } = await supabase.from('estudiantes').select('id');
    if (todosEstudiantes && todosEstudiantes.length > 0) {
      const asistenciasDemo = todosEstudiantes.map((e, idx) => ({
        estudiante_id: e.id,
        curso_id: cursoId,
        fecha: today,
        estado: idx === 1 ? 'AUSENTE' : idx === 3 ? 'TARDANZA' : 'PRESENTE',
        atencion_recepcion: idx === 1 ? 'PENDIENTE' : 'NINGUNA'
      }));
      await supabase.from('asistencias').insert(asistenciasDemo);
    }

    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/asistencia');
    return { success: true, seeded: demos.length };
  } catch (err: any) {
    console.error("Error sembrando estudiantes demo:", err);
    return { success: false, error: err.message };
  }
}

export async function matricularEstudiantesDemoEnCurso(cursoId: string) {
  try {
    const year = new Date().getFullYear();
    const nombresAlumnos = [
      { nombres: "Mateo", apellidos: "Almonte Gómez", tutor: "Rosaura Gómez", tel: "809-555-1001" },
      { nombres: "Sofía", apellidos: "Castillo Peña", tutor: "Manuel Castillo", tel: "809-555-1002" },
      { nombres: "Sebastián", apellidos: "Díaz Rosario", tutor: "Patricia Rosario", tel: "809-555-1003" },
      { nombres: "Camila", apellidos: "Fernández Paulino", tutor: "José Fernández", tel: "809-555-1004" },
      { nombres: "Lucas", apellidos: "García Morales", tutor: "Ana Morales", tel: "809-555-1005" },
      { nombres: "Valentina", apellidos: "Hernández De la Cruz", tutor: "Carlos Hernández", tel: "809-555-1006" },
      { nombres: "Santiago", apellidos: "López Santana", tutor: "Yomaira Santana", tel: "809-555-1007" },
      { nombres: "Isabella", apellidos: "Martínez Vargas", tutor: "Rafael Martínez", tel: "809-555-1008" },
      { nombres: "Emiliano", apellidos: "Núñez Reyes", tutor: "Carmen Reyes", tel: "809-555-1009" },
      { nombres: "Victoria", apellidos: "Pérez Batista", tutor: "Marcos Pérez", tel: "809-555-1010" }
    ];

    const rows = nombresAlumnos.map((a, idx) => {
      const randSeq = Math.floor(1000 + Math.random() * 9000);
      return {
        matricula: `CR-${year}-${randSeq}-${idx + 1}`,
        nombres: a.nombres,
        apellidos: a.apellidos,
        curso_id: cursoId,
        tutor_nombre: a.tutor,
        tutor_telefono: a.tel,
        token_consulta: `tkn_kid_${idx + 1}_${Math.random().toString(36).substring(2, 7)}`,
        estado: 'ACTIVO'
      };
    });

    const { data, error } = await supabase.from('estudiantes').insert(rows).select();
    if (error) throw error;

    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath(`/admin/dashboard/cursos/${cursoId}`);
    revalidatePath('/admin/dashboard/cursos');
    revalidatePath('/admin/dashboard/calificaciones');
    return { success: true, count: data?.length || 10 };
  } catch (err: any) {
    console.error("Error matriculando 10 estudiantes:", err);
    return { success: false, error: err.message };
  }
}

export async function updateEstudiante(id: string, data: {
  nombres: string;
  apellidos: string;
  curso_id: string;
  tutor_nombre?: string;
  tutor_telefono?: string;
  email?: string;
  estado?: string;
}) {
  try {
    const { data: updated, error } = await supabase
      .from('estudiantes')
      .update({
        nombres: data.nombres,
        apellidos: data.apellidos,
        curso_id: data.curso_id,
        tutor_nombre: data.tutor_nombre || '',
        tutor_telefono: data.tutor_telefono || '',
        email: data.email || null,
        estado: data.estado || 'ACTIVO'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/asistencia');
    revalidatePath('/admin/dashboard/cursos');
    if (data.curso_id) {
      revalidatePath(`/admin/dashboard/cursos/${data.curso_id}`);
    }
    return { success: true, estudiante: updated };
  } catch (err: any) {
    console.error("Error actualizando estudiante:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteEstudiante(id: string) {
  try {
    const { error } = await supabase
      .from('estudiantes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/asistencia');
    revalidatePath('/admin/dashboard/cursos');
    return { success: true };
  } catch (err: any) {
    console.error("Error eliminando estudiante:", err);
    return { success: false, error: err.message };
  }
}

export async function getExpedienteCompletoEstudiante(estudianteId: string) {
  try {
    const { data: estudiante, error: eErr } = await supabase
      .from('estudiantes')
      .select(`
        *,
        curso:cursos(
          id, 
          nombre, 
          tipo, 
          hora_inicio, 
          hora_fin,
          minimo_asistencia_pct,
          profesor:perfiles_usuarios(nombre, email),
          criterios:criterios_evaluacion(*)
        )
      `)
      .eq('id', estudianteId)
      .single();

    if (eErr || !estudiante) return null;

    // Asistencias históricas del estudiante
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .order('fecha', { ascending: false });

    // Calificaciones por criterio
    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('estudiante_id', estudianteId);

    // Calcular estadísticas blindadas (Excusados no restan puntos)
    const presentes = (asistencias || []).filter(a => a.estado === 'PRESENTE').length;
    const ausencias = (asistencias || []).filter(a => a.estado === 'AUSENTE').length;
    const tardanzas = (asistencias || []).filter(a => a.estado === 'TARDANZA').length;
    const excusados = (asistencias || []).filter(a => a.estado === 'EXCUSADO').length;
    const totalClases = presentes + ausencias + tardanzas + excusados;
    // La asistencia justa considera presentes y excusados médicos
    const pctAsistencia = totalClases > 0 ? Math.round(((presentes + excusados) / totalClases) * 100) : 100;

    // Calcular notas según criterios del Director: suma directa de puntos obtenidos (0 .. maxPts)
    let notaPonderada = 0;
    const criteriosConNotas = (estudiante.curso?.criterios || []).map((crit: any) => {
      const match = (calificaciones || []).find(c => c.criterio_id === crit.id);
      let val = match ? Number(match.nota !== undefined && match.nota !== null ? match.nota : match.calificacion) : null;
      const maxPts = Number(crit.porcentaje) || 20;

      // Salvaguarda: si en la base de datos la nota está en escala antigua de 100 (ej: 85 en criterio de 40), normalizarla a puntos reales
      if (val !== null && val > maxPts) {
        val = Math.round(((val * maxPts) / 100) * 10) / 10;
      }

      if (val !== null) {
        notaPonderada += val;
      }
      return {
        ...crit,
        calificacion: val
      };
    });

    // 5. Histórico académico de cursos anteriores (instantáneas de promociones)
    let historialAcademico: any[] = [];
    try {
      const { data: hist } = await supabase
        .from('estudiantes_historial_academico')
        .select('*')
        .eq('estudiante_id', estudianteId)
        .order('fecha_promocion', { ascending: false });
      historialAcademico = hist || [];
    } catch (_) {}

    return {
      estudiante,
      calificacionesRaw: calificaciones || [],
      metricas: {
        totalClases,
        presentes,
        ausencias,
        tardanzas,
        pctAsistencia,
        notaPonderada: Math.round(notaPonderada * 10) / 10
      },
      criteriosConNotas,
      historialAsistencias: asistencias || [],
      historialAcademico
    };
  } catch (err: any) {
    console.error("Error obteniendo expediente completo:", err);
    return null;
  }
}

// Promover un grupo de estudiantes a otro curso/nivel guardando instantánea en el historial académico
export async function promoverEstudiantes(
  estudianteIds: string[],
  cursoOrigenId: string,
  cursoDestinoId: string,
  concluirCursoOrigen: boolean = false
) {
  try {
    if (!estudianteIds || estudianteIds.length === 0) {
      return { success: false, error: "No se seleccionaron estudiantes para promover." };
    }

    // 1. Obtener datos del curso origen y sus criterios para congelar el récord
    const { data: cursoOrigen } = await supabase
      .from('cursos')
      .select('id, nombre, tipo, criterios:criterios_evaluacion(*)')
      .eq('id', cursoOrigenId)
      .single();

    // 2. Obtener asistencias y calificaciones de los estudiantes a promover
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', cursoOrigenId)
      .in('estudiante_id', estudianteIds);

    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('*')
      .in('estudiante_id', estudianteIds);

    // 3. Crear registros de historial académico para cada estudiante
    const historialRows = estudianteIds.map(estId => {
      const califsEst = (calificaciones || []).filter(c => c.estudiante_id === estId);
      const asistsEst = (asistencias || []).filter(a => a.estudiante_id === estId);
      
      const totalAsist = asistsEst.length;
      const presentes = asistsEst.filter(a => a.estado === 'PRESENTE').length;
      const pctAsist = totalAsist > 0 ? Math.round((presentes / totalAsist) * 100) : 100;

      // Calcular promedio con criterios de este curso
      let sumaNotas = 0;
      (cursoOrigen?.criterios || []).forEach((crit: any) => {
        const match = califsEst.find(c => c.criterio_id === crit.id);
        if (match) {
          let val = Number(match.nota !== undefined && match.nota !== null ? match.nota : match.calificacion) || 0;
          const maxPts = Number(crit.porcentaje) || 20;
          if (val > maxPts) {
            val = Math.round(((val * maxPts) / 100) * 10) / 10;
          }
          sumaNotas += val;
        }
      });

      const promedio = Math.round(sumaNotas * 10) / 10;
      const estadoCierre = promedio >= 70 ? 'APROBADO' : 'PROMOVIDO_CONDICIONAL';

      return {
        estudiante_id: estId,
        curso_id: cursoOrigenId,
        curso_nombre: cursoOrigen?.nombre || 'Curso Previo',
        periodo_academico: cursoOrigen?.tipo || 'General',
        promedio_final: promedio,
        porcentaje_asistencia: pctAsist,
        estado_cierre: estadoCierre,
        calificaciones_snapshot: califsEst,
        fecha_promocion: new Date().toISOString()
      };
    });

    // Guardar en la tabla estudiantes_historial_academico
    if (historialRows.length > 0) {
      const { error: histErr } = await supabase
        .from('estudiantes_historial_academico')
        .insert(historialRows);
      
      if (histErr) {
        console.warn("Aviso insertando en estudiantes_historial_academico:", histErr.message);
      }
    }

    // 4. Actualizar curso_id de los estudiantes al curso destino
    const { error: updateErr } = await supabase
      .from('estudiantes')
      .update({ curso_id: cursoDestinoId })
      .in('id', estudianteIds);

    if (updateErr) throw updateErr;

    // 5. Si se indicó marcar el curso origen como concluido
    if (concluirCursoOrigen) {
      await supabase
        .from('cursos')
        .update({ activo: false })
        .eq('id', cursoOrigenId);
    }

    revalidatePath('/admin/dashboard/cursos');
    revalidatePath(`/admin/dashboard/cursos/${cursoOrigenId}`);
    revalidatePath(`/admin/dashboard/cursos/${cursoDestinoId}`);
    revalidatePath('/admin/dashboard/estudiantes');
    revalidatePath('/admin/dashboard/asistencia');
    revalidatePath('/admin/dashboard/calificaciones');

    return { success: true, count: estudianteIds.length };
  } catch (err: any) {
    console.error("Error promoviendo estudiantes:", err);
    return { success: false, error: err.message };
  }
}
