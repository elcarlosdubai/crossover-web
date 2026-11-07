import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const { data, error } = await supabase
      .from("preinscripciones")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error al insertar en Supabase (preinscripciones):", error);
      return NextResponse.json(
        { error: "No se pudo guardar la pre-inscripción en la base de datos." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, lead: data },
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
