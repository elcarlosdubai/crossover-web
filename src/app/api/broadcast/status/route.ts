import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { startBackgroundBroadcastWorker } from "@/lib/broadcast-worker";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Si hay pendientes y el worker está dormido, despertarlo
    const { count: pendientes } = await supabase
      .from("registro_comunicaciones")
      .select("*", { count: "exact", head: true })
      .eq("tipo_evento", "broadcast")
      .eq("estado", "pendiente");

    const { count: enProceso } = await supabase
      .from("registro_comunicaciones")
      .select("*", { count: "exact", head: true })
      .eq("tipo_evento", "broadcast")
      .eq("estado", "en_proceso");

    const { count: enviados } = await supabase
      .from("registro_comunicaciones")
      .select("*", { count: "exact", head: true })
      .eq("tipo_evento", "broadcast")
      .eq("estado", "enviado");

    const { count: fallidos } = await supabase
      .from("registro_comunicaciones")
      .select("*", { count: "exact", head: true })
      .eq("tipo_evento", "broadcast")
      .eq("estado", "fallido");

    if ((pendientes || 0) > 0 && !global.__crossover_broadcast_worker_running) {
      startBackgroundBroadcastWorker();
    }

    return NextResponse.json({
      isRunning: !!global.__crossover_broadcast_worker_running,
      pendientes: pendientes || 0,
      enProceso: enProceso || 0,
      enviados: enviados || 0,
      fallidos: fallidos || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
