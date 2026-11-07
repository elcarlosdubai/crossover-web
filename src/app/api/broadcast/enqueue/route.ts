import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { startBackgroundBroadcastWorker } from "@/lib/broadcast-worker";

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

    // Despertar el worker de fondo en el servidor para que empiece a gotear
    startBackgroundBroadcastWorker();

    return NextResponse.json({
      success: true,
      encolados: registros.length,
      mensaje: "Campaña encolada con éxito en el servidor.",
    });
  } catch (err: any) {
    console.error("Error en /api/broadcast/enqueue:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
