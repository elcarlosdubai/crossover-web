"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getTodayRD, getRDYear } from "@/lib/dateRD";
import { emitirRecibo } from "@/app/actions/recepcion";
import { requireRole } from "@/utils/supabase/server";

const ROLES_CAJA = ["admin", "caja", "recepcion", "director"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

function isMissingSchemaError(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  return (
    err?.code === "42P01" ||
    err?.code === "42703" ||
    err?.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

function normalizePhoneDigits(phone?: string): string {
  return String(phone || "").replace(/\D/g, "");
}

// ==================== PASO 2: CUADERNO DE INSCRIPCIONES & FAMILIAS ====================

export async function getCuadernoInscripciones() {
  try {
    await requireRole(ROLES_CAJA);
    // Intentar consulta completa con familia y tarifas
    const { data: estFull, error: errFull } = await supabase
      .from("estudiantes")
      .select(`
        id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono,
        estado, curso_id, familia_id, fecha_inscripcion_formal, inscrito_por, created_at,
        curso:cursos(id, nombre, tipo, hora_inicio, hora_fin, tarifa_mensual, tarifa_inscripcion),
        familia:familias(id, nombre_familia, responsable_principal, telefono)
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    let estudiantes = estFull;
    let schemaListo = true;

    if (errFull && isMissingSchemaError(errFull)) {
      schemaListo = false;
      const { data: estBase } = await supabase
        .from("estudiantes")
        .select(`
          id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono,
          estado, curso_id, created_at,
          curso:cursos(id, nombre, tipo, hora_inicio, hora_fin)
        `)
        .order("created_at", { ascending: false })
        .limit(300);
      estudiantes = (estBase || []).map((e: any) => ({
        ...e,
        familia_id: null,
        fecha_inscripcion_formal: null,
        inscrito_por: "",
        familia: null,
      }));
    } else if (errFull) {
      throw errFull;
    }

    const { data: cursos } = await supabase
      .from("cursos")
      .select("id, nombre, tipo, hora_inicio, hora_fin, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    return {
      schemaListo,
      estudiantes: estudiantes || [],
      cursos: cursos || [],
    };
  } catch (err: any) {
    console.error("Error en getCuadernoInscripciones:", err);
    return { schemaListo: false, estudiantes: [], cursos: [] };
  }
}

export async function getFamiliasConHijos() {
  try {
    await requireRole(ROLES_CAJA);
    const { data: familias, error } = await supabase
      .from("familias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingSchemaError(error)) return { schemaListo: false, familias: [] };
      throw error;
    }

    const { data: hijos } = await supabase
      .from("estudiantes")
      .select("id, matricula, nombres, apellidos, estado, familia_id, curso:cursos(nombre, tipo)")
      .not("familia_id", "is", null);

    const enriched = (familias || []).map((f: any) => ({
      ...f,
      hijos: (hijos || []).filter((h: any) => h.familia_id === f.id),
    }));

    return { schemaListo: true, familias: enriched };
  } catch (err: any) {
    console.error("Error en getFamiliasConHijos:", err);
    return { schemaListo: false, familias: [] };
  }
}

export async function buscarSugerenciaFamilia(telefono: string) {
  try {
    await requireRole(ROLES_CAJA);
    const digits = normalizePhoneDigits(telefono);
    if (digits.length < 7) return { familia: null, hermanos: [] };

    const tail = digits.slice(-7);

    const [{ data: fams, error: fErr }, { data: ests }] = await Promise.all([
      supabase.from("familias").select("*").ilike("telefono", `%${tail}%`).limit(3),
      supabase
        .from("estudiantes")
        .select("id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono, familia_id")
        .ilike("tutor_telefono", `%${tail}%`)
        .limit(5),
    ]);

    if (fErr && isMissingSchemaError(fErr)) {
      return { familia: null, hermanos: ests || [] };
    }

    return {
      familia: fams && fams.length > 0 ? fams[0] : null,
      hijosExistentes: ests || [],
    };
  } catch (err: any) {
    console.error("Error en buscarSugerenciaFamilia:", err);
    return { familia: null, hijosExistentes: [] };
  }
}

export async function crearFamilia(data: {
  nombre_familia: string;
  responsable_principal: string;
  telefono: string;
  telefono_secundario?: string;
  email?: string;
  direccion?: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const { data: created, error } = await supabase
      .from("familias")
      .insert({
        nombre_familia: data.nombre_familia.trim(),
        responsable_principal: data.responsable_principal.trim(),
        telefono: data.telefono.trim(),
        telefono_secundario: data.telefono_secundario?.trim() || "",
        email: data.email?.trim() || "",
        direccion: data.direccion?.trim() || "",
      })
      .select()
      .single();

    if (error) {
      if (isMissingSchemaError(error)) {
        return {
          success: false,
          error: "Falta ejecutar migration_caja_administracion.sql en el SQL Editor de Supabase.",
        };
      }
      throw error;
    }

    revalidatePath("/admin/dashboard/inscripciones");
    return { success: true, familia: created };
  } catch (err: any) {
    console.error("Error en crearFamilia:", err);
    return { success: false, error: err.message };
  }
}

export async function inscribirEstudianteFormal(data: {
  nombres: string;
  apellidos: string;
  curso_id: string;
  tutor_nombre: string;
  tutor_telefono: string;
  familia_id?: string | null;
  crear_familia_nueva?: boolean;
  nombre_familia?: string;
  inscrito_por?: string;
  generar_cargo_inicial?: boolean;
  monto_inscripcion?: number;
  monto_primera_cuota?: number;
  preinscripcion_id?: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const hoyRD = getTodayRD();
    const yearRD = getRDYear();
    let familiaIdFinal = data.familia_id || null;

    // 1. Crear familia si el usuario pidió agrupar nueva familia
    if (!familiaIdFinal && data.crear_familia_nueva && data.tutor_nombre.trim()) {
      const famRes = await crearFamilia({
        nombre_familia: data.nombre_familia?.trim() || `Familia ${data.apellidos.trim() || data.nombres.trim()}`,
        responsable_principal: data.tutor_nombre.trim(),
        telefono: data.tutor_telefono.trim(),
      });
      if (famRes.success && famRes.familia) {
        familiaIdFinal = famRes.familia.id;
      }
    }

    // 2. Generar matrícula única y token de consulta
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const matricula = `EST-${yearRD}-${randCode}`;
    const tokenConsulta = `est_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;

    const baseStudent: any = {
      matricula,
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      curso_id: data.curso_id,
      tutor_nombre: data.tutor_nombre.trim(),
      tutor_telefono: data.tutor_telefono.trim(),
      estado: "ACTIVO",
      token_consulta: tokenConsulta,
    };

    const extendedStudent: any = {
      ...baseStudent,
      familia_id: familiaIdFinal,
      fecha_inscripcion_formal: hoyRD,
      inscrito_por: data.inscrito_por || "Recepción",
    };

    let { data: est, error: estErr } = await supabase
      .from("estudiantes")
      .insert(extendedStudent)
      .select()
      .single();

    if (estErr && isMissingSchemaError(estErr)) {
      const retry = await supabase.from("estudiantes").insert(baseStudent).select().single();
      est = retry.data;
      estErr = retry.error;
    }

    if (estErr || !est) throw estErr || new Error("No se pudo registrar el estudiante");

    // 3. Crear cargos iniciales en Caja si aplica y si la tabla existe
    if (data.generar_cargo_inicial) {
      const cargos: any[] = [];
      const montoInsc = Number(data.monto_inscripcion) || 0;
      const montoCuota = Number(data.monto_primera_cuota) || 0;

      if (montoInsc > 0) {
        cargos.push({
          estudiante_id: est.id,
          curso_id: data.curso_id,
          tipo: "INSCRIPCION",
          concepto: `Inscripción (${hoyRD})`,
          orden_secuencial: 0,
          monto_total: montoInsc,
          recargo: 0,
          monto_pagado: 0,
          estado: "PENDIENTE",
          fecha_vencimiento: hoyRD,
        });
      }
      if (montoCuota > 0) {
        cargos.push({
          estudiante_id: est.id,
          curso_id: data.curso_id,
          tipo: "MENSUALIDAD",
          concepto: `Primera Cuota / Módulo (${hoyRD.slice(0, 7)})`,
          orden_secuencial: 1,
          monto_total: montoCuota,
          recargo: 0,
          monto_pagado: 0,
          estado: "PENDIENTE",
          fecha_vencimiento: hoyRD,
        });
      }

      if (cargos.length > 0) {
        const { error: cargoErr } = await supabase.from("cargos_estudiantes").insert(cargos);
        if (cargoErr && !isMissingSchemaError(cargoErr)) {
          console.error("Error creando cargos iniciales:", cargoErr);
        }
      }
    }

    // 4. Si viene desde una pre-inscripción, marcarla como INSCRITO
    if (data.preinscripcion_id) {
      await supabase
        .from("preinscripciones")
        .update({ estado: "INSCRITO" })
        .eq("id", data.preinscripcion_id);
    }

    revalidatePath("/admin/dashboard/inscripciones");
    revalidatePath("/admin/dashboard/estudiantes");
    revalidatePath("/admin/dashboard/recibos");
    revalidatePath("/admin/dashboard");

    return { success: true, estudiante: est };
  } catch (err: any) {
    console.error("Error en inscribirEstudianteFormal:", err);
    return { success: false, error: err.message };
  }
}

// ==================== PASO 3: CAJA, TRIMESTRES, RECARGOS Y DEUDORES ====================

export async function getCajaDashboardData() {
  try {
    await requireRole(ROLES_CAJA);
    const [{ data: trimestres, error: tErr }, { data: cargos, error: cErr }, { data: recibos }] =
      await Promise.all([
        supabase.from("trimestres").select("*").order("created_at", { ascending: false }),
        supabase
          .from("cargos_estudiantes")
          .select(`
            *,
            estudiante:estudiantes(id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono, familia_id, estado, curso:cursos(id, nombre, tipo))
          `)
          .in("estado", ["PENDIENTE", "PARCIAL"])
          .order("orden_secuencial", { ascending: true }),
        supabase
          .from("recibos")
          .select(`
            *,
            estudiante:estudiantes(id, matricula, nombres, apellidos)
          `)
          .order("created_at", { ascending: false })
          .limit(120),
      ]);

    const schemaListo = !(tErr && isMissingSchemaError(tErr)) && !(cErr && isMissingSchemaError(cErr));

    // Agrupar morosidad / saldos pendientes por estudiante
    const deudoresMap = new Map<string, any>();
    for (const cg of cargos || []) {
      const est = Array.isArray(cg.estudiante) ? cg.estudiante[0] : cg.estudiante;
      if (!est || est.estado !== "ACTIVO") continue;
      const saldo = Math.max(
        0,
        Number(cg.monto_total || 0) + Number(cg.recargo || 0) - Number(cg.monto_pagado || 0)
      );
      if (saldo <= 0) continue;

      if (!deudoresMap.has(est.id)) {
        deudoresMap.set(est.id, {
          estudiante_id: est.id,
          matricula: est.matricula,
          nombre: `${est.nombres || ""} ${est.apellidos || ""}`.trim(),
          curso: est.curso?.nombre || "Sin curso",
          tutor_nombre: est.tutor_nombre || "",
          tutor_telefono: est.tutor_telefono || "",
          familia_id: est.familia_id || null,
          total_adeudado: 0,
          total_recargos: 0,
          cuotas_pendientes: 0,
          cargos: [],
        });
      }

      const item = deudoresMap.get(est.id);
      item.total_adeudado += saldo;
      item.total_recargos += Number(cg.recargo || 0);
      item.cuotas_pendientes += 1;
      item.cargos.push({ ...cg, saldo });
    }

    const deudores = Array.from(deudoresMap.values()).sort(
      (a, b) => b.total_adeudado - a.total_adeudado
    );

    const hoyRD = getTodayRD();
    const cobradoHoy = (recibos || [])
      .filter((r: any) => {
        const f = r.fecha_operativa || getTodayRD(new Date(r.created_at));
        return f === hoyRD;
      })
      .reduce((acc: number, r: any) => acc + (Number(r.monto) || 0), 0);

    return {
      schemaListo,
      trimestres: tErr ? [] : trimestres || [],
      deudores,
      recibos: recibos || [],
      cobradoHoy,
      hoyRD,
    };
  } catch (err: any) {
    console.error("Error en getCajaDashboardData:", err);
    return {
      schemaListo: false,
      trimestres: [],
      deudores: [],
      recibos: [],
      cobradoHoy: 0,
      hoyRD: getTodayRD(),
    };
  }
}

export async function buscarCuentaCaja(query: string) {
  try {
    await requireRole(ROLES_CAJA);
    const q = query.trim();
    if (!q) return [];

    const { data: ests, error } = await supabase
      .from("estudiantes")
      .select(`
        id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono, familia_id, estado,
        curso:cursos(id, nombre, tipo, tarifa_mensual, tarifa_inscripcion)
      `)
      .or(
        `nombres.ilike.%${q}%,apellidos.ilike.%${q}%,matricula.ilike.%${q}%,tutor_nombre.ilike.%${q}%,tutor_telefono.ilike.%${q}%`
      )
      .limit(12);

    let students = ests || [];
    if (error && isMissingSchemaError(error)) {
      const retry = await supabase
        .from("estudiantes")
        .select(`
          id, matricula, nombres, apellidos, tutor_nombre, tutor_telefono, estado,
          curso:cursos(id, nombre, tipo)
        `)
        .or(
          `nombres.ilike.%${q}%,apellidos.ilike.%${q}%,matricula.ilike.%${q}%,tutor_nombre.ilike.%${q}%,tutor_telefono.ilike.%${q}%`
        )
        .limit(12);
      students = (retry.data || []).map((s: any) => ({ ...s, familia_id: null }));
    }

    if (students.length === 0) return [];

    const estIds = students.map((s: any) => s.id);
    const { data: cargos, error: cErr } = await supabase
      .from("cargos_estudiantes")
      .select("*")
      .in("estudiante_id", estIds)
      .in("estado", ["PENDIENTE", "PARCIAL", "PAGADO"])
      .order("orden_secuencial", { ascending: true })
      .order("created_at", { ascending: true });

    const cargosSafe = cErr && isMissingSchemaError(cErr) ? [] : cargos || [];

    return students.map((s: any) => ({
      ...s,
      cargos: cargosSafe
        .filter((c: any) => c.estudiante_id === s.id)
        .map((c: any) => ({
          ...c,
          saldo: Math.max(
            0,
            Number(c.monto_total || 0) + Number(c.recargo || 0) - Number(c.monto_pagado || 0)
          ),
        })),
    }));
  } catch (err: any) {
    console.error("Error en buscarCuentaCaja:", err);
    return [];
  }
}

export async function crearTrimestreYGenerarCuotas(data: {
  codigo: string;
  nombre: string;
  meses: string[];
  generarCuotasActivos: boolean;
  tarifaFallback?: number;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const hoyRD = getTodayRD();
    const { data: term, error } = await supabase
      .from("trimestres")
      .insert({
        codigo: data.codigo.trim(),
        nombre: data.nombre.trim(),
        meses: data.meses,
        activo: true,
        cerrado: false,
        fecha_inicio: hoyRD,
      })
      .select()
      .single();

    if (error) {
      if (isMissingSchemaError(error)) {
        return {
          success: false,
          error: "Falta ejecutar migration_caja_administracion.sql en Supabase.",
        };
      }
      throw error;
    }

    let cargosCreados = 0;
    if (data.generarCuotasActivos && data.meses.length > 0) {
      const { data: estudiantes } = await supabase
        .from("estudiantes")
        .select("id, curso_id, curso:cursos(tarifa_mensual)")
        .eq("estado", "ACTIVO");

      const rows: any[] = [];
      for (const est of estudiantes || []) {
        const cursoObj: any = Array.isArray(est.curso) ? est.curso[0] : est.curso;
        const tarifa = Number(cursoObj?.tarifa_mensual) || Number(data.tarifaFallback) || 2500;
        data.meses.forEach((mes, idx) => {
          rows.push({
            estudiante_id: est.id,
            curso_id: est.curso_id,
            trimestre_id: term.id,
            tipo: "MENSUALIDAD",
            concepto: `${mes} (${data.codigo.trim()})`,
            orden_secuencial: idx + 1,
            monto_total: tarifa,
            recargo: 0,
            monto_pagado: 0,
            estado: "PENDIENTE",
            fecha_vencimiento: hoyRD,
          });
        });
      }

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from("cargos_estudiantes").insert(rows);
        if (insErr) throw insErr;
        cargosCreados = rows.length;
      }
    }

    revalidatePath("/admin/dashboard/recibos");
    return { success: true, trimestre: term, cargosCreados };
  } catch (err: any) {
    console.error("Error en crearTrimestreYGenerarCuotas:", err);
    return { success: false, error: err.message };
  }
}

export async function aplicarRecargoCargo(cargoId: string, montoRecargo: number) {
  try {
    await requireRole(ROLES_CAJA);
    const { data: cargo, error: fErr } = await supabase
      .from("cargos_estudiantes")
      .select("id, recargo")
      .eq("id", cargoId)
      .single();

    if (fErr) throw fErr;
    const nuevoRecargo = Math.max(0, Number(cargo.recargo || 0) + Number(montoRecargo || 0));

    const { error } = await supabase
      .from("cargos_estudiantes")
      .update({ recargo: nuevoRecargo })
      .eq("id", cargoId);

    if (error) throw error;
    revalidatePath("/admin/dashboard/recibos");
    return { success: true };
  } catch (err: any) {
    console.error("Error en aplicarRecargoCargo:", err);
    return { success: false, error: err.message };
  }
}

export async function agregarCargoManual(data: {
  estudiante_id: string;
  curso_id?: string | null;
  tipo: "INSCRIPCION" | "MENSUALIDAD" | "DEUDA_ANTERIOR" | "OTRO";
  concepto: string;
  monto_total: number;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const { error } = await supabase.from("cargos_estudiantes").insert({
      estudiante_id: data.estudiante_id,
      curso_id: data.curso_id || null,
      tipo: data.tipo,
      concepto: data.concepto.trim(),
      orden_secuencial: data.tipo === "DEUDA_ANTERIOR" ? 0 : 99,
      monto_total: Math.max(0, Number(data.monto_total) || 0),
      recargo: 0,
      monto_pagado: 0,
      estado: "PENDIENTE",
      fecha_vencimiento: getTodayRD(),
    });

    if (error) throw error;
    revalidatePath("/admin/dashboard/recibos");
    return { success: true };
  } catch (err: any) {
    console.error("Error en agregarCargoManual:", err);
    return { success: false, error: err.message };
  }
}

export async function procesarCobroCaja(data: {
  estudiante_id?: string | null;
  cliente_nombre: string;
  cliente_telefono?: string;
  concepto_manual?: string;
  cargos_aplicar: { cargo_id: string; monto_aplicar: number }[];
  descuento: number;
  metodos: { metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CHEQUE"; monto: number }[];
  cajero_nombre: string;
  notas?: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const totalMetodos = data.metodos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    if (totalMetodos <= 0) {
      return { success: false, error: "El monto cobrado debe ser mayor a RD$ 0." };
    }

    const conceptos: string[] = [];
    let tipoIngreso: "INSCRIPCION" | "MENSUALIDAD" | "DEUDA" | "OTRO" = "MENSUALIDAD";

    if (data.cargos_aplicar.length > 0) {
      for (const item of data.cargos_aplicar) {
        if (item.monto_aplicar <= 0) continue;
        const { data: cargo, error: cErr } = await supabase
          .from("cargos_estudiantes")
          .select("*")
          .eq("id", item.cargo_id)
          .single();

        if (cErr || !cargo) continue;

        const totalExigible = Number(cargo.monto_total || 0) + Number(cargo.recargo || 0);
        const nuevoPagado = Math.min(totalExigible, Number(cargo.monto_pagado || 0) + item.monto_aplicar);
        const saldoRestante = Math.max(0, totalExigible - nuevoPagado);
        const nuevoEstado = saldoRestante <= 0 ? "PAGADO" : "PARCIAL";

        await supabase
          .from("cargos_estudiantes")
          .update({ monto_pagado: nuevoPagado, estado: nuevoEstado })
          .eq("id", cargo.id);

        conceptos.push(
          nuevoEstado === "PARCIAL"
            ? `Abono ${cargo.concepto}`
            : cargo.concepto
        );
        if (cargo.tipo === "INSCRIPCION") tipoIngreso = "INSCRIPCION";
        else if (cargo.tipo === "DEUDA_ANTERIOR") tipoIngreso = "DEUDA";
      }
    }

    const metodoPrincipal =
      data.metodos.slice().sort((a, b) => b.monto - a.monto)[0]?.metodo || "EFECTIVO";

    const conceptoFinal =
      conceptos.length > 0
        ? conceptos.join(" + ")
        : data.concepto_manual?.trim() || "Pago de Mensualidad";

    const resRecibo = await emitirRecibo({
      estudiante_id: data.estudiante_id || null,
      cliente_nombre: data.cliente_nombre,
      cliente_telefono: data.cliente_telefono || "",
      concepto: conceptoFinal,
      monto: totalMetodos,
      metodo_pago: metodoPrincipal,
      notas: data.notas || "",
      cajero_nombre: data.cajero_nombre,
      tipo_ingreso: tipoIngreso,
      metodos_detalle: data.metodos.filter((m) => Number(m.monto) > 0),
      descuento: Number(data.descuento) || 0,
    });

    if (!resRecibo.success) return resRecibo;

    revalidatePath("/admin/dashboard/recibos");
    revalidatePath("/admin/dashboard");
    return { success: true, recibo: resRecibo.recibo };
  } catch (err: any) {
    console.error("Error en procesarCobroCaja:", err);
    return { success: false, error: err.message };
  }
}

export async function enviarAvisoDeudorWhatsApp(data: {
  estudiante_nombre: string;
  tutor_nombre?: string;
  telefono: string;
  total_adeudado: number;
  cajero_nombre?: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const digits = normalizePhoneDigits(data.telefono);
    if (digits.length < 10) {
      return { success: false, error: "Teléfono inválido o incompleto para WhatsApp." };
    }
    const intlPhone = digits.length === 10 ? `1${digits}` : digits;
    const totalFmt = new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0,
    }).format(Number(data.total_adeudado) || 0);

    const destinatario = data.tutor_nombre?.trim() || data.estudiante_nombre;
    const mensaje = [
      "*INSTITUTO CROSSOVER*",
      "*Aviso de saldo pendiente*",
      "",
      `Estimado/a ${destinatario}:`,
      `Le recordamos amablemente que la cuenta de *${data.estudiante_nombre}* presenta cuotas vencidas.`,
      `*Total adeudado:* ${totalFmt}`,
      "",
      "Puede realizar su pago en Caja o comunicarse con Administración.",
      "Gracias por su atención.",
    ].join("\n");

    const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(mensaje)}`;

    // Intentar encolar en el Bot 24/7 si la tabla existe
    let encoladoBot = false;
    const { error: qErr } = await supabase.from("cola_mensajes_whatsapp").insert({
      telefono: intlPhone,
      mensaje,
      estado: "pendiente",
      tipo: "cobro_mora",
      destinatario_nombre: destinatario,
    });
    if (!qErr) encoladoBot = true;

    // Registrar en bitácora de comunicaciones
    await supabase.from("registro_comunicaciones").insert({
      canal: "whatsapp",
      tipo_evento: "cobro_mora",
      destinatario_nombre: destinatario,
      destinatario_contacto: intlPhone,
      asunto_o_titulo: `Aviso de mora (${totalFmt})`,
      contenido_preview: mensaje,
      estado: encoladoBot ? "pendiente" : "enviado_manual",
      responsable: data.cajero_nombre || "Caja",
    });

    revalidatePath("/admin/dashboard/comunicaciones");
    return { success: true, encoladoBot, waUrl, mensaje };
  } catch (err: any) {
    console.error("Error en enviarAvisoDeudorWhatsApp:", err);
    return { success: false, error: err.message };
  }
}

// ==================== PASO 4: PRE-CUADRE, CIERRE DE CAJA Y POS LIBROS ====================

export async function getEstadoCajaTurno() {
  try {
    await requireRole(ROLES_CAJA);
    const hoyRD = getTodayRD();
    const [{ data: recibosAbiertos, error: rErr }, { data: egresosAbiertos, error: eErr }, { data: cierres, error: cErr }] =
      await Promise.all([
        supabase.from("recibos").select("*").is("cierre_id", null).order("created_at", { ascending: false }),
        supabase.from("egresos_caja").select("*").is("cierre_id", null).order("created_at", { ascending: false }),
        supabase.from("cierres_caja").select("*").order("cerrado_at", { ascending: false }).limit(30),
      ]);

    const schemaListo = !(rErr && isMissingSchemaError(rErr)) && !(eErr && isMissingSchemaError(eErr)) && !(cErr && isMissingSchemaError(cErr));

    const recibos = rErr ? [] : recibosAbiertos || [];
    const egresos = eErr ? [] : egresosAbiertos || [];

    let efectivo = 0;
    let transferencia = 0;
    let tarjeta = 0;
    let cheque = 0;
    let totalMensualidades = 0;
    let totalPOS = 0;

    for (const r of recibos) {
      const m = Number(r.monto) || 0;
      if (r.tipo_ingreso === "POS_LIBRO") totalPOS += m;
      else totalMensualidades += m;

      if (Array.isArray(r.metodos_detalle) && r.metodos_detalle.length > 0) {
        for (const md of r.metodos_detalle) {
          const val = Number(md.monto) || 0;
          if (md.metodo === "EFECTIVO") efectivo += val;
          else if (md.metodo === "TRANSFERENCIA") transferencia += val;
          else if (md.metodo === "TARJETA") tarjeta += val;
          else if (md.metodo === "CHEQUE") cheque += val;
        }
      } else {
        if (r.metodo_pago === "EFECTIVO") efectivo += m;
        else if (r.metodo_pago === "TRANSFERENCIA") transferencia += m;
        else if (r.metodo_pago === "TARJETA") tarjeta += m;
        else if (r.metodo_pago === "CHEQUE") cheque += m;
      }
    }

    const totalEgresos = egresos.reduce((acc: number, e: any) => acc + (Number(e.monto) || 0), 0);
    const efectivoEsperado = Math.max(0, efectivo - totalEgresos);

    return {
      schemaListo,
      hoyRD,
      resumen: {
        cantidadRecibos: recibos.length,
        efectivo,
        transferencia,
        tarjeta,
        cheque,
        totalGeneral: efectivo + transferencia + tarjeta + cheque,
        totalMensualidades,
        totalPOS,
        totalEgresos,
        efectivoEsperado,
      },
      egresos,
      cierres: cErr ? [] : cierres || [],
    };
  } catch (err: any) {
    console.error("Error en getEstadoCajaTurno:", err);
    return {
      schemaListo: false,
      hoyRD: getTodayRD(),
      resumen: {
        cantidadRecibos: 0,
        efectivo: 0,
        transferencia: 0,
        tarjeta: 0,
        cheque: 0,
        totalGeneral: 0,
        totalMensualidades: 0,
        totalPOS: 0,
        totalEgresos: 0,
        efectivoEsperado: 0,
      },
      egresos: [],
      cierres: [],
    };
  }
}

export async function registrarEgresoCaja(data: {
  concepto: string;
  monto: number;
  cajero_nombre: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const { error } = await supabase.from("egresos_caja").insert({
      fecha_operativa: getTodayRD(),
      cajero_nombre: data.cajero_nombre || "Caja",
      concepto: data.concepto.trim(),
      monto: Math.max(0, Number(data.monto) || 0),
    });
    if (error) throw error;
    revalidatePath("/admin/dashboard/recibos");
    return { success: true };
  } catch (err: any) {
    console.error("Error en registrarEgresoCaja:", err);
    return { success: false, error: err.message };
  }
}

export async function guardarCierreCaja(data: {
  cajero_nombre: string;
  efectivo_contado: number;
  conteo_billetes: Record<string, number>;
  notas?: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const estado = await getEstadoCajaTurno();
    const res = estado.resumen;
    const diferencia = Number(data.efectivo_contado || 0) - Number(res.efectivoEsperado || 0);

    const { data: cierre, error } = await supabase
      .from("cierres_caja")
      .insert({
        fecha_operativa: getTodayRD(),
        cajero_nombre: data.cajero_nombre || "Caja",
        total_efectivo_sistema: res.efectivo,
        total_transferencia_sistema: res.transferencia,
        total_tarjeta_sistema: res.tarjeta,
        total_cheque_sistema: res.cheque,
        total_egresos: res.totalEgresos,
        efectivo_contado: Number(data.efectivo_contado) || 0,
        diferencia,
        conteo_billetes: data.conteo_billetes || {},
        notas: data.notas || "",
      })
      .select()
      .single();

    if (error || !cierre) throw error || new Error("No se pudo guardar el cierre");

    // Asociar recibos, egresos y ventas abiertas al cierre para que el próximo turno inicie en 0
    await Promise.all([
      supabase.from("recibos").update({ cierre_id: cierre.id }).is("cierre_id", null),
      supabase.from("egresos_caja").update({ cierre_id: cierre.id }).is("cierre_id", null),
      supabase.from("ventas_pos").update({ cierre_id: cierre.id }).is("cierre_id", null),
    ]);

    revalidatePath("/admin/dashboard/recibos");
    return { success: true, cierre };
  } catch (err: any) {
    console.error("Error en guardarCierreCaja:", err);
    return { success: false, error: err.message };
  }
}

export async function getProductosYVentasPOS() {
  try {
    await requireRole(ROLES_CAJA);
    const [{ data: productos, error: pErr }, { data: ventas, error: vErr }] = await Promise.all([
      supabase.from("productos_pos").select("*").eq("activo", true).order("nombre", { ascending: true }),
      supabase.from("ventas_pos").select("*").order("created_at", { ascending: false }).limit(60),
    ]);

    const schemaListo = !(pErr && isMissingSchemaError(pErr)) && !(vErr && isMissingSchemaError(vErr));
    return {
      schemaListo,
      productos: pErr ? [] : productos || [],
      ventas: vErr ? [] : ventas || [],
    };
  } catch (err: any) {
    console.error("Error en getProductosYVentasPOS:", err);
    return { schemaListo: false, productos: [], ventas: [] };
  }
}

export async function crearProductoPOS(data: {
  nombre: string;
  categoria: "LIBRO" | "UNIFORME" | "MATERIAL" | "OTRO";
  precio: number;
  stock: number;
  sku?: string;
}) {
  try {
    await requireRole(ROLES_CAJA);
    const { error } = await supabase.from("productos_pos").insert({
      nombre: data.nombre.trim(),
      categoria: data.categoria,
      precio: Math.max(0, Number(data.precio) || 0),
      stock: Math.max(0, Number(data.stock) || 0),
      sku: data.sku?.trim() || `PRD-${Date.now().toString(36).toUpperCase()}`,
      activo: true,
    });
    if (error) throw error;
    revalidatePath("/admin/dashboard/recibos");
    return { success: true };
  } catch (err: any) {
    console.error("Error en crearProductoPOS:", err);
    return { success: false, error: err.message };
  }
}

export async function procesarVentaPOS(data: {
  cliente_nombre: string;
  metodo_pago: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CHEQUE";
  cajero_nombre: string;
  items: { producto_id: string; nombre: string; cantidad: number; precio_unitario: number }[];
}) {
  try {
    await requireRole(ROLES_CAJA);
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Agrega al menos un producto al carrito." };
    }

    const total = data.items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0);
    const concepto = data.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(", ");

    // Descontar stock
    for (const it of data.items) {
      const { data: prod } = await supabase
        .from("productos_pos")
        .select("id, stock")
        .eq("id", it.producto_id)
        .maybeSingle();
      if (prod) {
        const nuevoStock = Math.max(0, Number(prod.stock || 0) - it.cantidad);
        await supabase.from("productos_pos").update({ stock: nuevoStock }).eq("id", prod.id);
      }
    }

    const recRes = await emitirRecibo({
      estudiante_id: null,
      cliente_nombre: data.cliente_nombre.trim() || "Cliente Mostrador",
      concepto: `POS: ${concepto}`,
      monto: total,
      metodo_pago: data.metodo_pago,
      cajero_nombre: data.cajero_nombre,
      tipo_ingreso: "POS_LIBRO",
    });

    if (!recRes.success) return recRes;

    await supabase.from("ventas_pos").insert({
      recibo_id: recRes.recibo.id,
      fecha_operativa: getTodayRD(),
      cajero_nombre: data.cajero_nombre || "Caja",
      cliente_nombre: data.cliente_nombre.trim() || "Cliente Mostrador",
      items: data.items.map((it) => ({ ...it, subtotal: it.cantidad * it.precio_unitario })),
      total,
      metodo_pago: data.metodo_pago,
    });

    revalidatePath("/admin/dashboard/recibos");
    return { success: true, recibo: recRes.recibo };
  } catch (err: any) {
    console.error("Error en procesarVentaPOS:", err);
    return { success: false, error: err.message };
  }
}

export async function anularReciboCaja(data: { reciboId: string; motivo: string }) {
  try {
    const { perfil } = await requireRole(ROLES_CAJA);
    const motivoLimpio = (data.motivo || "").trim();
    if (motivoLimpio.length < 4) {
      return { success: false, error: "Debes indicar un motivo de anulación (mínimo 4 caracteres)." };
    }

    const { data: recibo, error: rErr } = await supabase
      .from("recibos")
      .select("*")
      .eq("id", data.reciboId)
      .single();

    if (rErr || !recibo) {
      return { success: false, error: "Recibo no encontrado." };
    }
    if (String(recibo.notas || "").includes("[ANULADO")) {
      return { success: false, error: "Este recibo ya fue anulado anteriormente." };
    }

    const montoOriginal = Number(recibo.monto || 0);
    const notaAnulacion = `[ANULADO por ${perfil.nombre || "Caja"}: ${motivoLimpio}] (Monto orig: RD$ ${montoOriginal}) ${recibo.notas || ""}`.trim();

    const { error: uErr } = await supabase
      .from("recibos")
      .update({ monto: 0, notas: notaAnulacion })
      .eq("id", recibo.id);

    if (uErr) throw uErr;

    // Si estaba ligado a un estudiante, intentar revertir cargos pagados que coincidan con el concepto
    if (recibo.estudiante_id && montoOriginal > 0) {
      const { data: cargosEst } = await supabase
        .from("cargos_estudiantes")
        .select("*")
        .eq("estudiante_id", recibo.estudiante_id)
        .in("estado", ["PAGADO", "PARCIAL"])
        .order("updated_at", { ascending: false });

      let porRevertir = montoOriginal;
      const conceptoRecibo = String(recibo.concepto || "").toLowerCase();

      for (const c of cargosEst || []) {
        if (porRevertir <= 0) break;
        const cConcepto = String(c.concepto || "").toLowerCase();
        if (cConcepto && !conceptoRecibo.includes(cConcepto)) continue;

        const pagadoActual = Number(c.monto_pagado || 0);
        if (pagadoActual <= 0) continue;

        const revertido = Math.min(pagadoActual, porRevertir);
        const nuevoPagado = Math.max(0, pagadoActual - revertido);
        const nuevoEstado = nuevoPagado <= 0 ? "PENDIENTE" : "PARCIAL";

        await supabase
          .from("cargos_estudiantes")
          .update({ monto_pagado: nuevoPagado, estado: nuevoEstado })
          .eq("id", c.id);

        porRevertir -= revertido;
      }
    }

    await supabase.from("registro_comunicaciones").insert({
      canal: "sistema",
      tipo_evento: "auditoria_recepcion",
      destinatario_nombre: `Recibo Anulado (${recibo.numero_recibo})`,
      destinatario_contacto: "caja",
      asunto_o_titulo: `Recibo Anulado (${recibo.numero_recibo})`,
      contenido_preview: `Cliente: ${recibo.cliente_nombre} · RD$ ${montoOriginal.toLocaleString("es-DO")} · Motivo: ${motivoLimpio}`,
      estado: "completado",
      responsable: perfil.nombre || "Caja",
    });

    revalidatePath("/admin/dashboard/recibos");
    revalidatePath("/admin/dashboard/caja");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error en anularReciboCaja:", err);
    return { success: false, error: err.message };
  }
}


