import { createClient } from "@supabase/supabase-js";
import { enviarMensajeWhatsApp } from "@/lib/whatsapp";
import { enviarEmailConfirmacion } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Estado global en memoria para el worker
declare global {
  var __crossover_broadcast_worker_running: boolean | undefined;
}

/**
 * Worker de segundo plano:
 * Procesa en cola persistente desde Supabase (registro_comunicaciones)
 * de forma 100% independiente del navegador del usuario.
 */
export async function startBackgroundBroadcastWorker() {
  if (global.__crossover_broadcast_worker_running) {
    return; // Ya hay un worker activo procesando la cola
  }

  global.__crossover_broadcast_worker_running = true;

  // Ejecución en segundo plano no bloqueante
  (async () => {
    try {
      while (true) {
        // 1. Buscar los próximos 10 mensajes pendientes (tanto leads web como broadcasts)
        const { data: pendientes, error } = await supabase
          .from("registro_comunicaciones")
          .select("*")
          .in("canal", ["whatsapp", "email"])
          .eq("estado", "pendiente")
          .order("created_at", { ascending: true })
          .limit(10);

        if (error || !pendientes || pendientes.length === 0) {
          // No hay nada pendiente en cola, apagar worker
          break;
        }

        for (const item of pendientes) {
          // Marcar como 'en_proceso' para no duplicar si hay varios procesos
          await supabase
            .from("registro_comunicaciones")
            .update({ estado: "en_proceso" })
            .eq("id", item.id);

          let exito = false;
          let motivoError: string | null = null;

          try {
            if (item.canal === "whatsapp") {
              const res = await enviarMensajeWhatsApp(
                item.destinatario_contacto,
                item.contenido_preview || ""
              );
              exito = res.success;
              motivoError = res.error || null;
            } else if (item.canal === "email") {
              // Verificar si es HTML
              const isHtml = (item.contenido_preview || "").trim().startsWith("<");
              const res = await enviarEmailConfirmacion({
                to: item.destinatario_contacto,
                subject: item.asunto_o_titulo || "Comunicado Oficial — Crossover",
                nombre: item.destinatario_nombre,
                curso: "Programa Académico",
                horario: "Horario Regular",
                customHtml: isHtml ? item.contenido_preview || undefined : undefined,
              });
              exito = res.success;
              motivoError = res.error || null;
            }
          } catch (e: any) {
            exito = false;
            motivoError = e.message || "Error al enviar mensaje";
          }

          // Actualizar estado final en Supabase
          await supabase
            .from("registro_comunicaciones")
            .update({
              estado: exito ? "enviado" : "fallido",
              motivo_error: motivoError,
            })
            .eq("id", item.id);

          // Pausa humana de goteo entre mensajes individuales (3 a 6 segundos)
          const jitter = Math.floor(3500 + Math.random() * 3000);
          await delay(jitter);
        }

        // Pausa entre lotes (15 a 30 segundos) para no saturar Namecheap / Meta
        await delay(15000);
      }
    } catch (workerErr) {
      console.error("Error en Broadcast Worker:", workerErr);
    } finally {
      global.__crossover_broadcast_worker_running = false;
    }
  })();
}
