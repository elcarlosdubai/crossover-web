import { NextResponse } from "next/server";
import {
  getWhatsAppStatus,
  initWhatsAppSocket,
  desconectarWhatsApp,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Si no está iniciado, disparar la inicialización
    const status = getWhatsAppStatus();
    if (status.status === "disconnected") {
      // Iniciar en segundo plano
      initWhatsAppSocket();
    }

    return NextResponse.json(getWhatsAppStatus());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "connect") {
      await initWhatsAppSocket();
      return NextResponse.json(getWhatsAppStatus());
    }

    if (action === "disconnect") {
      await desconectarWhatsApp();
      return NextResponse.json(getWhatsAppStatus());
    }

    if (action === "test_message") {
      const { telefono, mensaje } = body;
      const { enviarMensajeWhatsApp } = await import("@/lib/whatsapp");
      const res = await enviarMensajeWhatsApp(
        telefono,
        mensaje || "🚀 ¡Mensaje de prueba exitoso desde el Centro de Mando Crossover!"
      );
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
