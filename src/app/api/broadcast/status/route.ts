import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, authErrorResponse } from "@/utils/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["admin", "director", "recepcion"]);
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

    // La cola la procesa exclusivamente crossover-whatsapp-service 24/7
    return NextResponse.json({
      isRunning: (pendientes || 0) > 0 || (enProceso || 0) > 0,
      pendientes: pendientes || 0,
      enProceso: enProceso || 0,
      enviados: enviados || 0,
      fallidos: fallidos || 0,
    });
  } catch (err: any) {
    const authRes = authErrorResponse(err);
    if (authRes) return authRes;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
