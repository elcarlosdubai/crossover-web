"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== 1. TRIAGE DE AUSENCIAS ====================
export async function getAusenciasTriage(fecha?: string) {
  try {
    const targetDate = fecha || new Date().toISOString().split('T')[0];

    const { data: ausencias, error } = await supabase
      .from('asistencias')
      .select(`
        *,
        estudiante:estudiantes(id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono),
        curso:cursos(id, nombre, tipo, hora_inicio, hora_fin)
      `)
      .eq('fecha', targetDate)
      .eq('estado', 'AUSENTE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ausencias || [];
  } catch (err: any) {
    console.error("Error obteniendo ausencias triage:", err);
    return [];
  }
}

export async function actualizarEstadoAusencia(asistenciaId: string, nuevoEstado: 'PENDIENTE' | 'JUSTIFICADA' | 'WHATSAPP_ENVIADO' | 'LLAMADO_REALIZADO', observacion?: string) {
  try {
    const updateData: any = { atencion_recepcion: nuevoEstado };
    if (observacion !== undefined) {
      updateData.observacion = observacion;
    }

    const { error } = await supabase
      .from('asistencias')
      .update(updateData)
      .eq('id', asistenciaId);

    if (error) throw error;
    revalidatePath('/admin/dashboard/ausencias');
    revalidatePath('/admin/dashboard/asistencia');
    return { success: true };
  } catch (err: any) {
    console.error("Error actualizando ausencia:", err);
    return { success: false, error: err.message };
  }
}

// ==================== 2. GESTIÓN DE RECIBOS Y CAJA ====================
export async function getRecibos() {
  try {
    const { data, error } = await supabase
      .from('recibos')
      .select(`
        *,
        estudiante:estudiantes(id, matricula, nombres, apellidos)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error("Error obteniendo recibos:", err);
    return [];
  }
}

export async function emitirRecibo(data: {
  estudiante_id?: string | null;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_email?: string;
  concepto: string;
  monto: number;
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
  notas?: string;
}) {
  try {
    // Generar número de recibo secuencial único: REC-2026-XXXX
    const year = new Date().getFullYear();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const numeroRecibo = `REC-${year}-${randNum}`;

    // Token único para compartir el enlace al recibo público
    const token = `rcb_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;

    const { data: nuevo, error } = await supabase
      .from('recibos')
      .insert({
        numero_recibo: numeroRecibo,
        token,
        estudiante_id: data.estudiante_id || null,
        cliente_nombre: data.cliente_nombre,
        cliente_telefono: data.cliente_telefono || '',
        cliente_email: data.cliente_email || '',
        concepto: data.concepto,
        monto: Number(data.monto) || 0,
        metodo_pago: data.metodo_pago,
        notas: data.notas || '',
        estado: 'PAGADO'
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/dashboard/recibos');
    return { success: true, recibo: nuevo };
  } catch (err: any) {
    console.error("Error emitiendo recibo:", err);
    return { success: false, error: err.message };
  }
}

export async function getReciboPorToken(token: string) {
  try {
    const { data, error } = await supabase
      .from('recibos')
      .select(`
        *,
        estudiante:estudiantes(id, matricula, nombres, apellidos, curso:cursos(nombre))
      `)
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error("Error buscando recibo por token:", err);
    return null;
  }
}

// ==================== 3. CONSULTA PÚBLICA DEL ESTUDIANTE ====================
export async function getExpedienteEstudiantePorToken(token: string) {
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
      .eq('token_consulta', token)
      .maybeSingle();

    if (eErr || !estudiante) return null;

    // Asistencias del estudiante
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('*')
      .eq('estudiante_id', estudiante.id)
      .order('fecha', { ascending: false });

    // Calificaciones
    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('estudiante_id', estudiante.id);

    // Recibos emitidos a este alumno
    const { data: recibos } = await supabase
      .from('recibos')
      .select('*')
      .eq('estudiante_id', estudiante.id)
      .order('created_at', { ascending: false });

    // Calcular estadísticas de asistencia
    const totalRegistros = (asistencias || []).length;
    const presentes = (asistencias || []).filter(a => a.estado === 'PRESENTE').length;
    const ausencias = (asistencias || []).filter(a => a.estado === 'AUSENTE').length;
    const pctAsistencia = totalRegistros > 0 ? Math.round((presentes / totalRegistros) * 100) : 100;

    // Calcular nota final ponderada (suma directa de puntos ganados)
    let notaFinalPonderada = 0;
    const criteriosConNota = (estudiante.curso?.criterios || []).map((crit: any) => {
      const match = (calificaciones || []).find(c => c.criterio_id === crit.id);
      let val = match ? Number(match.nota !== undefined && match.nota !== null ? match.nota : match.calificacion) : null;
      const maxPts = Number(crit.porcentaje) || 20;

      // Salvaguarda si la nota en BD está en base 100
      if (val !== null && val > maxPts) {
        val = Math.round(((val * maxPts) / 100) * 10) / 10;
      }

      if (val !== null) {
        notaFinalPonderada += val;
      }
      return {
        ...crit,
        calificacion: val
      };
    });

    return {
      estudiante,
      resumen: {
        totalClases: totalRegistros,
        presentes,
        ausencias,
        pctAsistencia,
        notaFinalPonderada: Math.round(notaFinalPonderada * 10) / 10
      },
      criteriosEvaluacion: criteriosConNota,
      historialAsistencia: asistencias || [],
      historialPagos: recibos || []
    };
  } catch (err: any) {
    console.error("Error cargando expediente por token:", err);
    return null;
  }
}
