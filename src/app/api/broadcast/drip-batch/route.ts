import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarMensajeWhatsApp } from "@/lib/whatsapp";
import { enviarEmailConfirmacion } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ContactoBroadcast {
  id?: string;
  nombre: string;
  contacto: string;
  curso?: string;
  tanda?: string;
}

export interface BroadcastBatchPayload {
  canal: "whatsapp" | "email";
  asunto?: string;
  plantillaMensaje: string;
  isHtml?: boolean;
  contactos: ContactoBroadcast[];
  modoVelocidad?: "sigiloso" | "moderado" | "rapido";
}

export async function POST(req: Request) {
  try {
    const body: BroadcastBatchPayload = await req.json();
    const { canal, asunto, plantillaMensaje, isHtml, contactos, modoVelocidad = "sigiloso" } = body;

    if (!contactos || contactos.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron contactos" }, { status: 400 });
    }

    if (!plantillaMensaje) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    let delayMin = 3000;
    let delayMax = 6000;

    if (canal === "whatsapp") {
      if (modoVelocidad === "sigiloso") {
        delayMin = 6000;
        delayMax = 12000;
      } else if (modoVelocidad === "moderado") {
        delayMin = 4000;
        delayMax = 7000;
      } else {
        delayMin = 2500;
        delayMax = 4500;
      }
    } else {
      delayMin = 2000;
      delayMax = 4000;
    }

    const resultados: Array<{
      contacto: string;
      nombre: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }> = [];

    const registrosCentroMando: Array<any> = [];

    for (let i = 0; i < contactos.length; i++) {
      const item = contactos[i];

      let mensajePersonalizado = plantillaMensaje
        .replace(/\{\{nombre\}\}/gi, item.nombre || "Estudiante")
        .replace(/\{\{curso\}\}/gi, item.curso || "Programa Académico")
        .replace(/\{\{horario\}\}/gi, item.tanda || "Horario Regular");

      let envioExitoso = false;
      let errorDetalle: string | null = null;
      let msgId: string | undefined = undefined;

      try {
        if (canal === "whatsapp") {
          const res = await enviarMensajeWhatsApp(item.contacto, mensajePersonalizado);

          envioExitoso = res.success;
          errorDetalle = res.error || null;
          msgId = res.messageId;
        } else {
          const res = await enviarEmailConfirmacion({
            to: item.contacto,
            subject: asunto || "Comunicado Oficial — Centro Educativo Crossover",
            nombre: item.nombre,
            curso: item.curso || "Programa Académico",
            horario: item.tanda || "Horario Regular",
            customHtml: isHtml ? mensajePersonalizado : undefined,
          });

          envioExitoso = res.success;
          errorDetalle = res.error || null;
          msgId = res.messageId;
        }
      } catch (err: any) {
        envioExitoso = false;
        errorDetalle = err.message || "Error inesperado en envío";
      }

      resultados.push({
        contacto: item.contacto,
        nombre: item.nombre,
        success: envioExitoso,
        error: errorDetalle || undefined,
        messageId: msgId,
      });

      // REGISTRO EN EL CENTRO DE MANDO (AUDITORÍA TOTAL)
      registrosCentroMando.push({
        canal,
        tipo_evento: "broadcast",
        destinatario_nombre: item.nombre,
        destinatario_contacto: item.contacto,
        asunto_o_titulo: asunto || `Difusión Masiva (${canal})`,
        contenido_preview: isHtml ? "[Plantilla HTML enviada]" : mensajePersonalizado.slice(0, 300),
        estado: envioExitoso ? "enviado" : "fallido",
        motivo_error: errorDetalle,
        responsable: `Broadcast ${canal === "whatsapp" ? "Baileys" : "SMTP"}`,
        created_at: new Date().toISOString(),
      });

      if (i < contactos.length - 1) {
        const jitter = Math.floor(delayMin + Math.random() * (delayMax - delayMin));
        await delay(jitter);
      }
    }

    // Insertar el lote en el Centro de Mando
    try {
      if (registrosCentroMando.length > 0) {
        await supabase.from("registro_comunicaciones").insert(registrosCentroMando);
      }
    } catch (dbErr) {
      console.error("Error guardando en registro_comunicaciones:", dbErr);
    }

    const exitosos = resultados.filter((r) => r.success).length;
    const fallidos = resultados.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      totalProcesados: resultados.length,
      exitosos,
      fallidos,
      detalles: resultados,
    });
  } catch (err: any) {
    console.error("Error en /api/broadcast/drip-batch:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
