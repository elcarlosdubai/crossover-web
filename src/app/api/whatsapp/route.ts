import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BOT_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "https://sys.crossoverrd.com";
const BOT_API_SECRET = process.env.WHATSAPP_API_SECRET || "Crossover*2026#SecureWaBot";

export async function GET() {
  try {
    const res = await fetch(`${BOT_SERVICE_URL}/status`, {
      headers: {
        "x-api-secret": BOT_API_SECRET,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Servicio WhatsApp: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "connect") {
      const res = await fetch(`${BOT_SERVICE_URL}/connect`, {
        method: "POST",
        headers: { "x-api-secret": BOT_API_SECRET },
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "disconnect") {
      const res = await fetch(`${BOT_SERVICE_URL}/disconnect`, {
        method: "POST",
        headers: { "x-api-secret": BOT_API_SECRET },
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "test_message") {
      const { telefono, mensaje } = body;
      const res = await fetch(`${BOT_SERVICE_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": BOT_API_SECRET,
        },
        body: JSON.stringify({
          telefono,
          mensaje: mensaje || "🚀 ¡Mensaje de prueba oficial desde el Centro de Mando Crossover!",
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
