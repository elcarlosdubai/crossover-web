"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ComunicacionRecord {
  id: string;
  created_at: string;
  canal: "whatsapp" | "email" | "llamada";
  tipo_evento: "inscripcion" | "seguimiento" | "pago" | "recordatorio" | "broadcast";
  destinatario_nombre: string;
  destinatario_contacto: string;
  asunto_o_titulo: string | null;
  contenido_preview: string | null;
  estado: "pendiente" | "fallido" | "enviado" | "contesto" | "no_contesto" | "ocupado";
  motivo_error: string | null;
  responsable: string | null;
}

export interface PlantillaConfig {
  id: string;
  canal: "whatsapp" | "email";
  nombre: string;
  categoria: string;
  asunto?: string;
  cuerpo: string;
  boton_cta?: string;
  url_cta?: string;
}

const DEFAULT_TEMPLATES: PlantillaConfig[] = [
  {
    id: "wa-inscripcion",
    canal: "whatsapp",
    nombre: "Pre-Inscripción Cursos Técnicos",
    categoria: "Admisiones",
    cuerpo: `¡Hola {{nombre}}! 🎓 Bienvenido a Centro Educativo Crossover.\n\nHemos registrado exitosamente tu pre-inscripción para *{{curso}}* en horario *{{horario}}*.\n\n📍 *Sede Principal:* Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD.\n\nPara garantizar tu plaza y asignarte fecha de inicio, por favor respóndenos confirmando tu disponibilidad. ¡Estamos para servirte!`
  },
  {
    id: "wa-colegio",
    canal: "whatsapp",
    nombre: "Admisiones & Visita Guiada Colegio",
    categoria: "Colegio",
    cuerpo: `Estimada familia de {{nombre}} 🏫, un cordial saludo de Centro Educativo Crossover.\n\nHemos recibido con agrado su solicitud de admisión para *{{curso}}*.\n\nSerá un placer recibirles en nuestras instalaciones para mostrarles el campus, presentarles al cuerpo docente y detallarles el plan de estudios. ¿Qué día les resultaría más conveniente para coordinar su visita guiada?`
  },
  {
    id: "email-confirmacion",
    canal: "email",
    nombre: "Comprobante de Registro & Ficha Oficial",
    categoria: "Confirmaciones",
    asunto: "Confirmación de Solicitud de Ingreso — Centro Educativo Crossover",
    cuerpo: `Estimado(a) {{nombre}},\n\nHemos registrado formalmente tu solicitud de admisión para el programa {{curso}} en el horario {{horario}}.\n\nTu expediente provisional ha sido generado con éxito. Nuestro equipo de coordinación académica revisará tu documentación y se pondrá en contacto para formalizar tu proceso y entrega de credenciales estudiantiles.\n\nSi deseas acelerar tu registro, puedes responder directamente a este correo o coordinar vía WhatsApp oficial.`,
    boton_cta: "Confirmar Cupo vía WhatsApp",
    url_cta: "https://wa.me/18099220880"
  },
  {
    id: "wa-seguimiento",
    canal: "whatsapp",
    nombre: "Seguimiento 24h & Cierre de Cupo",
    categoria: "Seguimiento",
    cuerpo: `Hola {{nombre}}, un saludo del equipo de Admisiones Crossover 🌟.\n\nNotamos que tienes un cupo apartado en *{{curso}}*. Queremos recordarte que nuestros grupos tienen cupos limitados por aula técnica para garantizar la atención personalizada. ¿Tienes alguna pregunta sobre los requisitos o facilidades de pago?`
  },
  {
    id: "email-recordatorio",
    canal: "email",
    nombre: "Recordatorio de Pago & Inicio de Clases",
    categoria: "Académico",
    asunto: "Aviso Importante: Próximo Inicio de Docencia — Crossover",
    cuerpo: `Estimado(a) {{nombre}},\n\nTe informamos que las clases de {{curso}} iniciarán formalmente en el horario acordado ({{horario}}).\n\nPor favor asegúrate de tener completado tu registro administrativo en caja o vía transferencia antes del inicio para habilitar tu acceso al aula y material didáctico.`,
    boton_cta: "Contactar a Caja / Soporte",
    url_cta: "https://wa.me/18099220880"
  }
];

export async function getComunicaciones(): Promise<ComunicacionRecord[]> {
  try {
    const { data, error } = await supabase
      .from("registro_comunicaciones")
      .select("*")
      .neq("canal", "sistema")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener comunicaciones:", error);
      return [];
    }

    return (data as ComunicacionRecord[]) || [];
  } catch (err) {
    console.error("Error inesperado en getComunicaciones:", err);
    return [];
  }
}

// Actualizar cualquier campo: fecha (reagendar), estado, notas, etc.
export async function actualizarAlarmaCompleta(
  id: string,
  payload: {
    created_at?: string;
    estado?: string;
    contenido_preview?: string;
    motivo_error?: string | null;
    responsable?: string;
  }
) {
  try {
    const { error } = await supabase
      .from("registro_comunicaciones")
      .update(payload)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/dashboard/comunicaciones");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function registrarComunicacion(record: Omit<ComunicacionRecord, "id">) {
  try {
    const { data, error } = await supabase
      .from("registro_comunicaciones")
      .insert([record])
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/dashboard/comunicaciones");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteComunicacion(id: string) {
  try {
    const { error } = await supabase
      .from("registro_comunicaciones")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/dashboard/comunicaciones");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ================= GESTIÓN PERSISTENTE DE PLANTILLAS =================

export async function getPlantillasConfig(): Promise<PlantillaConfig[]> {
  try {
    const { data, error } = await supabase
      .from("registro_comunicaciones")
      .select("*")
      .eq("canal", "sistema")
      .eq("tipo_evento", "broadcast")
      .eq("destinatario_nombre", "TEMPLATE_CONFIG");

    if (error || !data || data.length === 0) {
      return DEFAULT_TEMPLATES;
    }

    const savedTemplates: PlantillaConfig[] = [];
    for (const row of data) {
      try {
        const parsed = JSON.parse(row.contenido_preview || "{}");
        if (parsed && parsed.id) {
          savedTemplates.push(parsed);
        }
      } catch {
        // Ignorar filas inválidas
      }
    }

    if (savedTemplates.length === 0) {
      return DEFAULT_TEMPLATES;
    }

    const merged = [...savedTemplates];
    for (const def of DEFAULT_TEMPLATES) {
      if (!merged.some((m) => m.id === def.id)) {
        merged.push(def);
      }
    }

    return merged;
  } catch (err) {
    console.error("Error al cargar plantillas:", err);
    return DEFAULT_TEMPLATES;
  }
}

export async function guardarPlantillaConfig(plantilla: PlantillaConfig) {
  try {
    const { data: existing } = await supabase
      .from("registro_comunicaciones")
      .select("id")
      .eq("canal", "sistema")
      .eq("tipo_evento", "broadcast")
      .eq("destinatario_nombre", "TEMPLATE_CONFIG")
      .eq("asunto_o_titulo", plantilla.id)
      .limit(1);

    const payload = {
      canal: "sistema",
      tipo_evento: "broadcast",
      destinatario_nombre: "TEMPLATE_CONFIG",
      destinatario_contacto: plantilla.canal,
      asunto_o_titulo: plantilla.id,
      contenido_preview: JSON.stringify(plantilla),
      estado: "enviado",
      responsable: "Administrador",
    };

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from("registro_comunicaciones")
        .update(payload)
        .eq("id", existing[0].id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("registro_comunicaciones")
        .insert([payload]);

      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin/dashboard/comunicaciones");
    return { success: true };
  } catch (err: any) {
    console.error("Error al guardar plantilla:", err);
    return { success: false, error: err.message };
  }
}
