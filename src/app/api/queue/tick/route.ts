import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmailConfirmacion } from "@/lib/email";
import { enviarMensajeWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function isSafeBusinessHourRD(): boolean {
  try {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santo_Domingo",
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    const hour = Number(hourStr);
    return hour >= 8 && hour < 21;
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  try {
    const apiSecret = process.env.WHATSAPP_API_SECRET || "";
    const provided = req.headers.get("x-api-secret") || "";

    if (!apiSecret || provided !== apiSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar hasta 10 pendientes (WhatsApp o Email) para respetar horario seguro RD en broadcasts
    const { data: pendientes, error } = await supabase
      .from("registro_comunicaciones")
      .select("*")
      .in("canal", ["whatsapp", "email"])
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pendientes || pendientes.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    const safeHour = isSafeBusinessHourRD();
    const item = pendientes.find((p: any) => {
      if (p.canal === "whatsapp" && p.tipo_evento === "broadcast" && !safeHour) {
        return false;
      }
      return true;
    });

    if (!item) {
      return NextResponse.json({ ok: true, processed: 0, reason: "outside_broadcast_hours" });
    }

    // Lock atómico compatible con registro_comunicaciones_estado_check (solo permite pendiente/enviado/fallido/completado)
    const { data: claimed, error: claimErr } = await supabase
      .from("registro_comunicaciones")
      .update({ estado: "fallido", motivo_error: "Procesando envío..." })
      .eq("id", item.id)
      .eq("estado", "pendiente")
      .select("id");

    if (claimErr) {
      return NextResponse.json({ ok: false, error: claimErr.message }, { status: 500 });
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, reason: "already_claimed" });
    }

    let resultado: { success: boolean; error?: string } = {
      success: false,
      error: "Canal no soportado",
    };

    if (item.canal === "whatsapp") {
      resultado = await enviarMensajeWhatsApp(
        item.destinatario_contacto,
        item.contenido_preview || ""
      );
    } else if (item.canal === "email") {
      resultado = await enviarEmailConfirmacion({
        to: item.destinatario_contacto,
        subject: item.asunto_o_titulo || "Comunicado Oficial — Centro Educativo Crossover",
        nombre: item.destinatario_nombre || "Estudiante",
        curso: "Programa Académico",
        horario: "Horario Regular",
        customHtml: item.contenido_preview || undefined,
      });
    }

    await supabase
      .from("registro_comunicaciones")
      .update({
        estado: resultado.success ? "enviado" : "fallido",
        motivo_error: resultado.error || null,
      })
      .eq("id", item.id);

    return NextResponse.json({
      ok: true,
      processed: 1,
      id: item.id,
      canal: item.canal,
      tipo_evento: item.tipo_evento,
      success: resultado.success,
      error: resultado.error || null,
    });
  } catch (err: any) {
    console.error("Error en /api/queue/tick:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
