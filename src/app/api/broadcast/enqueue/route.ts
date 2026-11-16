import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, authErrorResponse } from "@/utils/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ContactoEnqueue {
  nombre: string;
  contacto: string;
  curso?: string;
  tanda?: string;
}

export async function POST(req: Request) {
  try {
    await requireRole(["admin", "director", "recepcion"]);
    const body = await req.json();
    const { canal, asunto, plantillaMensaje, isHtml, contactos } = body;

    if (!contactos || contactos.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron contactos" }, { status: 400 });
    }

    if (!plantillaMensaje) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Preparar los registros para Supabase
    const registros = contactos.map((item: ContactoEnqueue) => {
      let mensajePersonalizado = plantillaMensaje
        .replace(/\{\{nombre\}\}/gi, item.nombre || "Estudiante")
        .replace(/\{\{curso\}\}/gi, item.curso || "Programa Académico")
        .replace(/\{\{horario\}\}/gi, item.tanda || "Horario Regular");

      return {
        canal,
        tipo_evento: "broadcast",
        destinatario_nombre: item.nombre,
        destinatario_contacto: item.contacto,
        asunto_o_titulo: asunto || `Difusión Masiva (${canal})`,
        contenido_preview: mensajePersonalizado,
        estado: "pendiente",
        responsable: `Broadcast ${canal === "whatsapp" ? "Baileys" : "SMTP"}`,
        created_at: now,
      };
    });

    // Inserción masiva inmediata en Supabase (tarda 1 segundo)
    const { error } = await supabase.from("registro_comunicaciones").insert(registros);

    if (error) {
      console.error("Error encolando broadcast:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // El worker 24/7 en crossover-whatsapp-service recoge la cola en <= 5s sin duplicados

    return NextResponse.json({
      success: true,
      encolados: registros.length,
      mensaje: "Campaña encolada con éxito en el servidor.",
    });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    console.error("Error en /api/broadcast/enqueue:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
