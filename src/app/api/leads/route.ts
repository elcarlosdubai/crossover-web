import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarHtmlInscripcion } from "@/lib/email";
import { startBackgroundBroadcastWorker } from "@/lib/broadcast-worker";

// Usamos las credenciales de entorno para instanciar el cliente con permisos de servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, apellidos, telefono, email, area, curso, horario, tipo } = body;

    // Validación básica de campos requeridos
    if (!nombre || !telefono || !curso) {
      return NextResponse.json(
        { error: "Nombre, teléfono y curso son requeridos." },
        { status: 400 }
      );
    }

    const payload = {
      nombres_aspirante: nombre.trim(),
      apellidos_aspirante: (apellidos || "").trim(),
      nombre_tutor: `${nombre.trim()} ${(apellidos || "").trim()}`.trim(),
      telefono_tutor: telefono.trim(),
      email_tutor: email ? email.trim() : null,
      area: area || null,
      curso_solicitado: curso.trim(),
      horario: horario ? horario.trim() : null,
      estado: "NUEVA",
      origen: "instagram_bio",
      notas_internas: tipo === "pedir_info" ? "Solicitó información previa" : "Pre-inscripción directa",
    };

    const { data: lead, error: errLead } = await supabase
      .from("preinscripciones")
      .insert([payload])
      .select()
      .single();

    if (errLead) {
      console.error("Error al insertar en Supabase (preinscripciones):", errLead);
      return NextResponse.json(
        { error: "No se pudo guardar la pre-inscripción en la base de datos." },
        { status: 500 }
      );
    }

    // ==============================================================
    // ENCOLADO ASÍNCRONO EN CENTRO DE MANDO (0.2s RESPUESTA INMEDIATA)
    // ==============================================================
    const studentName = `${lead.nombres_aspirante} ${lead.apellidos_aspirante || ""}`.trim();
    const courseName = lead.curso_solicitado || "Curso Técnico";
    const scheduleName = lead.horario || "Por coordinar";
    const now = new Date();

    // 1. Mensaje oficial de WhatsApp
    const waText = `¡Hola ${studentName}! 🎓 Bienvenido a Centro Educativo Crossover.\n\nHemos registrado tu pre-inscripción para *${courseName}* en horario *${scheduleName}*.\n\n📍 Sede: Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD.\n\nTu plaza está apartada provisionalmente. Respóndenos para coordinar los detalles.`;

    // 2. Tarea de llamada telefónica asignada a recepción para 24 horas después
    const callDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const registrosDisparadores: any[] = [
      {
        canal: "whatsapp",
        tipo_evento: "inscripcion",
        destinatario_nombre: studentName,
        destinatario_contacto: lead.telefono_tutor,
        asunto_o_titulo: `Bienvenida Pre-Inscripción: ${courseName}`,
        contenido_preview: waText,
        estado: "pendiente",
        motivo_error: null,
        responsable: "Bot Oficial WhatsApp",
        created_at: now.toISOString(),
      },
      {
        canal: "llamada",
        tipo_evento: "seguimiento",
        destinatario_nombre: studentName,
        destinatario_contacto: lead.telefono_tutor,
        asunto_o_titulo: `Llamada de Bienvenida y Cierre - ${courseName}`,
        contenido_preview: "Confirmar interés, resolver dudas de pago y formalizar inscripción presencial.",
        estado: "pendiente",
        responsable: "Recepción",
        created_at: callDate,
      }
    ];

    // 3. Email oficial con HTML pregenerado
    if (lead.email_tutor) {
      const emailSubject = `¡Pre-Inscripción Recibida! — ${courseName} (Crossover)`;
      const emailHtml = generarHtmlInscripcion({
        nombre: studentName,
        curso: courseName,
        horario: scheduleName,
      });

      registrosDisparadores.push({
        canal: "email",
        tipo_evento: "inscripcion",
        destinatario_nombre: studentName,
        destinatario_contacto: lead.email_tutor,
        asunto_o_titulo: emailSubject,
        contenido_preview: emailHtml, // HTML oficial ya empaquetado
        estado: "pendiente",
        motivo_error: null,
        responsable: "SMTP info@crossoverrd.com",
        created_at: now.toISOString(),
      });
    }

    // Insertar en la cola de Centro de Mando
    await supabase.from("registro_comunicaciones").insert(registrosDisparadores);

    // Disparar worker en segundo plano ("fire-and-forget", no bloquea al usuario)
    startBackgroundBroadcastWorker().catch((err) =>
      console.error("[Queue Worker Trigger Error]:", err)
    );

    // Responder de inmediato al alumno (200ms)
    return NextResponse.json(
      { success: true, lead },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error inesperado en /api/leads:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
