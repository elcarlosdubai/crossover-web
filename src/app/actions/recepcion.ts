"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getTodayRD, getRDYear, getDayRangeUTCRangeForRD } from '@/lib/dateRD';
import { requireRole } from '@/utils/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

const ROLES_RECEPCION_Y_CAJA = ['admin', 'director', 'recepcion', 'caja'];

// ==================== 1. TRIAGE DE AUSENCIAS ====================
export async function getAusenciasTriage(fecha?: string) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const targetDate = fecha || getTodayRD();

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
    await requireRole(ROLES_RECEPCION_Y_CAJA);
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

// ==================== 3. MÉTRICAS PARA DASHBOARD DE RECEPCIÓN ====================
export async function getRecepcionDashboardMetrics() {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const { fechaRD: hoy, startISO: inicioHoy, endISO: finHoy } = getDayRangeUTCRangeForRD();

    // 1. Ausencias de Hoy (hasta 1500 para sábados masivos)
    const { data: ausenciasHoy } = await supabase
      .from('asistencias')
      .select(`
        id, estado, atencion_recepcion, observacion, observaciones, fecha, created_at,
        estudiante:estudiantes(id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono),
        curso:cursos(id, nombre, tipo, hora_inicio, hora_fin)
      `)
      .eq('fecha', hoy)
      .eq('estado', 'AUSENTE')
      .order('created_at', { ascending: false })
      .limit(1500);

    const totalAusencias = (ausenciasHoy || []).length;
    const ausenciasPendientes = (ausenciasHoy || []).filter(
      (a) => !a.atencion_recepcion || a.atencion_recepcion === 'PENDIENTE'
    ).length;

    // 2. Preinscripciones (Leads)
    const { data: leads } = await supabase
      .from('preinscripciones')
      .select('id, nombres_aspirante, apellidos_aspirante, telefono_tutor, curso_solicitado, estado, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const { count: totalLeadsPendientes } = await supabase
      .from('preinscripciones')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['PENDIENTE', 'NUEVA']);

    // 3. Recibos cobrados hoy
    const { data: recibosHoy } = await supabase
      .from('recibos')
      .select('monto, metodo_pago, created_at')
      .gte('created_at', inicioHoy)
      .lte('created_at', finHoy);

    const totalCobradoHoy = (recibosHoy || []).reduce((acc, r) => acc + (Number(r.monto) || 0), 0);
    const cantidadRecibosHoy = (recibosHoy || []).length;

    // 4. Catálogo de cursos activos (para nuevo interesado)
    const { data: cursosCatalogo } = await supabase
      .from('cursos')
      .select('id, nombre, tipo, dias_semana, hora_inicio, hora_fin')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    // 5. Auditoría del día (qué recepcionista hizo qué hoy)
    const { data: auditoriaHoy } = await supabase
      .from('registro_comunicaciones')
      .select('id, asunto_o_titulo, contenido_preview, responsable, created_at')
      .eq('tipo_evento', 'auditoria_recepcion')
      .gte('created_at', inicioHoy)
      .lte('created_at', finHoy)
      .order('created_at', { ascending: false })
      .limit(100);

    // 6. Solicitudes de seguimiento enviadas por profesores
    const { data: solicitudesDocentes } = await supabase
      .from('registro_comunicaciones')
      .select('id, destinatario_nombre, destinatario_contacto, asunto_o_titulo, contenido_preview, estado, responsable, created_at')
      .eq('tipo_evento', 'seguimiento_docente')
      .order('created_at', { ascending: false })
      .limit(50);

    const solicitudesPendientes = (solicitudesDocentes || []).filter((s: any) => s.estado === 'pendiente').length;

    return {
      fechaHoy: hoy,
      kpis: {
        totalAusencias,
        ausenciasPendientes,
        totalLeadsPendientes: totalLeadsPendientes || 0,
        totalCobradoHoy,
        cantidadRecibosHoy,
        solicitudesPendientes,
      },
      ausenciasRecientes: (ausenciasHoy || []).slice(0, 5),
      ausenciasHoy: ausenciasHoy || [],
      leadsRecientes: leads || [],
      cursosCatalogo: cursosCatalogo || [],
      auditoriaHoy: auditoriaHoy || [],
      solicitudesDocentes: solicitudesDocentes || [],
    };
  } catch (err: any) {
    console.error("Error obteniendo métricas de recepción:", err);
    return {
      fechaHoy: getTodayRD(),
      kpis: {
        totalAusencias: 0,
        ausenciasPendientes: 0,
        totalLeadsPendientes: 0,
        totalCobradoHoy: 0,
        cantidadRecibosHoy: 0,
        solicitudesPendientes: 0,
      },
      ausenciasRecientes: [],
      ausenciasHoy: [],
      leadsRecientes: [],
      cursosCatalogo: [],
      auditoriaHoy: [],
      solicitudesDocentes: [],
    };
  }
}

export async function atenderSolicitudDocenteRecepcion(id: string, recepcionista: string, detalle?: string) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const cleanResp = recepcionista || 'Recepción';
    const { error } = await supabase
      .from('registro_comunicaciones')
      .update({
        estado: 'completado',
        responsable: cleanResp,
      })
      .eq('id', id);

    if (error) throw error;
    await registrarAuditoriaRecepcion(cleanResp, 'Solicitud Docente Atendida', detalle || id);
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/comunicaciones');
    return { success: true };
  } catch (err: any) {
    console.error("Error atendiendo solicitud docente:", err);
    return { success: false, error: err.message };
  }
}

export async function registrarAuditoriaRecepcion(recepcionista: string, accion: string, detalle: string) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    await supabase.from('registro_comunicaciones').insert({
      canal: 'sistema',
      tipo_evento: 'auditoria_recepcion',
      destinatario_nombre: accion,
      destinatario_contacto: 'recepcion',
      asunto_o_titulo: accion,
      contenido_preview: detalle,
      estado: 'completado',
      responsable: recepcionista || 'Recepción'
    });
    return { success: true };
  } catch (err: any) {
    console.error("Error registrando auditoría recepción:", err);
    return { success: false, error: err.message };
  }
}

export async function actualizarAusenciaMasiva(
  ids: string[],
  nuevoEstado: 'PENDIENTE' | 'JUSTIFICADA' | 'WHATSAPP_ENVIADO' | 'LLAMADO_REALIZADO',
  recepcionista: string,
  observacion?: string
) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    if (!ids || ids.length === 0) return { success: false, error: 'Sin registros seleccionados' };
    const updateData: any = { atencion_recepcion: nuevoEstado };
    if (observacion !== undefined) updateData.observacion = observacion;

    const { error } = await supabase
      .from('asistencias')
      .update(updateData)
      .in('id', ids);

    if (error) throw error;

    await registrarAuditoriaRecepcion(
      recepcionista,
      `Ausencias (${nuevoEstado})`,
      `${ids.length} ausencia(s) marcadas como ${nuevoEstado}${observacion ? ` · ${observacion}` : ''}`
    );

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/ausencias');
    return { success: true };
  } catch (err: any) {
    console.error("Error en actualizarAusenciaMasiva:", err);
    return { success: false, error: err.message };
  }
}

export async function buscarEstudiantesRecepcion(query: string) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const q = (query || '').trim();
    if (q.length < 2) return [];

    const { data, error } = await supabase
      .from('estudiantes')
      .select(`
        id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono, estado, token_consulta,
        curso:cursos(id, nombre, tipo, hora_inicio, hora_fin)
      `)
      .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,matricula.ilike.%${q}%,tutor_nombre.ilike.%${q}%,tutor_telefono.ilike.%${q}%`)
      .limit(12);

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error("Error en buscarEstudiantesRecepcion:", err);
    return [];
  }
}

export async function crearLeadRapidoRecepcion(data: {
  nombres_aspirante: string;
  apellidos_aspirante: string;
  telefono_tutor: string;
  curso_solicitado: string;
  recepcionista: string;
}) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const { data: lead, error } = await supabase
      .from('preinscripciones')
      .insert({
        nombres_aspirante: data.nombres_aspirante,
        apellidos_aspirante: data.apellidos_aspirante,
        telefono_tutor: data.telefono_tutor,
        curso_solicitado: data.curso_solicitado,
        estado: 'PENDIENTE'
      })
      .select()
      .single();

    if (error) throw error;

    await registrarAuditoriaRecepcion(
      data.recepcionista,
      'Nuevo Interesado (Catálogo)',
      `${data.nombres_aspirante} ${data.apellidos_aspirante} (${data.telefono_tutor}) · ${data.curso_solicitado}`
    );

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/inscripciones');
    return { success: true, lead };
  } catch (err: any) {
    console.error("Error en crearLeadRapidoRecepcion:", err);
    return { success: false, error: err.message };
  }
}

export async function actualizarEstadoLeadRecepcion(
  leadId: string,
  nuevoEstado: string,
  recepcionista: string,
  detalle?: string
) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const { error } = await supabase
      .from('preinscripciones')
      .update({ estado: nuevoEstado })
      .eq('id', leadId);

    if (error) throw error;

    await registrarAuditoriaRecepcion(
      recepcionista,
      `Lead -> ${nuevoEstado}`,
      detalle || `Seguimiento registrado para lead ${leadId}`
    );

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/inscripciones');
    return { success: true };
  } catch (err: any) {
    console.error("Error en actualizarEstadoLeadRecepcion:", err);
    return { success: false, error: err.message };
  }
}
export async function getRecibos() {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
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
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE';
  notas?: string;
  cajero_nombre?: string;
  tipo_ingreso?: 'INSCRIPCION' | 'MENSUALIDAD' | 'DEUDA' | 'POS_LIBRO' | 'OTRO';
  metodos_detalle?: { metodo: string; monto: number }[];
  descuento?: number;
}) {
  try {
    await requireRole(ROLES_RECEPCION_Y_CAJA);
    const year = getRDYear();
    const fechaOp = getTodayRD();
    const prefix = `REC-${year}-`;

    const { data: ultimos } = await supabase
      .from('recibos')
      .select('numero_recibo')
      .like('numero_recibo', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    let maxSeq = 0;
    for (const r of ultimos || []) {
      const tail = String(r.numero_recibo || '').replace(prefix, '');
      const num = parseInt(tail, 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }

    let nuevo: any = null;
    let lastErr: any = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      const nextNum = String(maxSeq + 1 + attempt).padStart(4, '0');
      const numeroRecibo = `${prefix}${nextNum}`;
      const token = `rcb_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;

      const basePayload: any = {
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
      };

      const extendedPayload: any = {
        ...basePayload,
        ...(data.cajero_nombre ? { cajero_nombre: data.cajero_nombre } : {}),
        ...(data.tipo_ingreso ? { tipo_ingreso: data.tipo_ingreso } : {}),
        ...(data.metodos_detalle ? { metodos_detalle: data.metodos_detalle } : {}),
        ...(data.descuento !== undefined ? { descuento: Number(data.descuento) || 0 } : {}),
        fecha_operativa: fechaOp,
      };

      let { data: inserted, error } = await supabase
        .from('recibos')
        .insert(extendedPayload)
        .select()
        .single();

      if (error && (error.message?.includes('column') || error.code === '42703')) {
        const retryBase = await supabase
          .from('recibos')
          .insert(basePayload)
          .select()
          .single();
        inserted = retryBase.data;
        error = retryBase.error;
      }

      if (!error && inserted) {
        nuevo = inserted;
        break;
      }
      lastErr = error;
    }

    if (!nuevo) throw lastErr || new Error('No se pudo emitir el recibo');
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

    // Calificaciones (ordenadas de la más reciente para aislar el último periodo evaluado)
    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('estudiante_id', estudiante.id)
      .order('created_at', { ascending: false });

    const periodoActivo = (calificaciones || []).find((c: any) => c.periodo)?.periodo || null;
    const calificacionesPeriodo = periodoActivo
      ? (calificaciones || []).filter((c: any) => c.periodo === periodoActivo)
      : (calificaciones || []);

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
      const match = calificacionesPeriodo.find(c => c.criterio_id === crit.id);
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
