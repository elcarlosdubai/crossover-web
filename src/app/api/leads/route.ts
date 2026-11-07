import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmailConfirmacion } from "@/lib/email";
import { enviarMensajeWhatsApp, getWhatsAppStatus } from "@/lib/whatsapp";

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

    // DISPARADORES AUTOMÁTICOS EN EL CENTRO DE MANDO Y ALARMAS
    const studentName = `${lead.nombres_aspirante} ${lead.apellidos_aspirante || ""}`.trim();
    const courseName = lead.curso_solicitado || "Curso Técnico";
    const scheduleName = lead.horario || "Por coordinar";
    const now = new Date();

    // 1. WhatsApp de bienvenida
    const waText = `¡Hola ${studentName}! 🎓 Bienvenido a Centro Educativo Crossover.\n\nHemos registrado tu pre-inscripción para *${courseName}* en horario *${scheduleName}*.\n\n📍 Sede: Av. Las Palmas #58, Herrera.\n\nTu plaza está apartada provisionalmente. Respóndenos para coordinar los detalles.`;
    
    // Intentar envío automático directo si Baileys está conectado
    let waEstado = "pendiente";
    let waError: string | null = null;
    let waResponsable = "Bot / Baileys";

    try {
      const waStatus = getWhatsAppStatus();
      if (waStatus.status === "connected") {
        const resWa = await enviarMensajeWhatsApp(lead.telefono_tutor, waText);
        if (resWa.success) {
          waEstado = "enviado";
        } else {
          waError = resWa.error || null;
        }
      }
    } catch (e: any) {
      console.error("Error intentando envío Baileys:", e);
    }

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
        estado: waEstado,
        motivo_error: waError,
        responsable: waResponsable,
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

    // 3. ENVÍO REAL Y REGISTRO DE CORREO SMTP
    if (lead.email_tutor) {
      const emailSubject = `¡Pre-Inscripción Recibida! — ${courseName} (Crossover)`;
      
      const resEmail = await enviarEmailConfirmacion({
        to: lead.email_tutor,
        subject: emailSubject,
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
        contenido_preview: `Comprobante oficial enviado exitosamente a ${lead.email_tutor}`,
        estado: resEmail.success ? "enviado" : "fallido",
        motivo_error: resEmail.success ? null : resEmail.error,
        responsable: "SMTP info@crossoverrd.com",
        created_at: now.toISOString(),
      });
    }

    // Insertar las alarmas silenciosamente
    try {
      await supabase.from("registro_comunicaciones").insert(registrosDisparadores);
    } catch (alarmErr) {
      console.error("Error al registrar alarmas automáticas:", alarmErr);
    }

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
