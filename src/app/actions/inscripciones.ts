"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Preinscripcion {
  id: string;
  nombres_aspirante: string;
  apellidos_aspirante: string;
  nombre_tutor: string;
  telefono_tutor: string;
  email_tutor: string | null;
  area: string | null;
  curso_solicitado: string;
  horario: string | null;
  estado: "NUEVA" | "CONTACTADO" | "APROBADO" | "RECHAZADO";
  notas_internas: string | null;
  created_at: string;
  origen: string | null;
}

export async function getPreinscripciones(): Promise<Preinscripcion[]> {
  try {
    const { data, error } = await supabase
      .from("preinscripciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener preinscripciones:", error);
      return [];
    }

    return (data as Preinscripcion[]) || [];
  } catch (err) {
    console.error("Error inesperado en getPreinscripciones:", err);
    return [];
  }
}

export async function updateEstadoPreinscripcion(id: string, nuevoEstado: string) {
  try {
    const { error } = await supabase
      .from("preinscripciones")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar estado:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/dashboard/inscripciones");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePreinscripcion(id: string) {
  try {
    const { error } = await supabase
      .from("preinscripciones")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/dashboard/inscripciones");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
