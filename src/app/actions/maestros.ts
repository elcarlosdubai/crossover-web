"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getMaestros() {
  try {
    const { data: maestros, error } = await supabase
      .from('perfiles_usuarios')
      .select(`
        id,
        nombre,
        email,
        telefono,
        rol,
        activo,
        cursos:cursos(id, nombre, tipo, hora_inicio, hora_fin)
      `)
      .eq('rol', 'profesor')
      .order('nombre', { ascending: true });

    if (error) throw error;

    return (maestros || []).map(m => ({
      ...m,
      totalCursos: m.cursos?.length || 0,
      estudiantesACargo: (m.cursos?.length || 0) * 15
    }));
  } catch (err: any) {
    console.error("Error en getMaestros:", err);
    return [];
  }
}

export async function createMaestro(data: {
  nombre: string;
  email: string;
  telefono: string;
  departamento?: string;
  especialidad?: string;
  tanda?: string;
  password?: string;
}) {
  try {
    const password = data.password || "123456";

    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: data.email,
      password: password,
      email_confirm: true,
      user_metadata: { 
        nombre: data.nombre, 
        rol: 'profesor',
        departamento: data.departamento || 'Idiomas',
        especialidad: data.especialidad || 'Inglés General',
        tanda: data.tanda || 'Matutina'
      }
    });

    if (authErr) {
      return { success: false, error: authErr.message };
    }

    const { error: profErr } = await supabase
      .from('perfiles_usuarios')
      .insert([{
        id: authUser.user.id,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        rol: 'profesor',
        activo: true
      }]);

    if (profErr) {
      return { success: false, error: profErr.message };
    }

    revalidatePath('/admin/dashboard/maestros');
    revalidatePath('/admin/dashboard/cursos');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMaestro(id: string) {
  try {
    await supabase.from('perfiles_usuarios').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);
    revalidatePath('/admin/dashboard/maestros');
    revalidatePath('/admin/dashboard/cursos');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleEstadoMaestro(id: string, activo: boolean) {
  try {
    const { error } = await supabase
      .from('perfiles_usuarios')
      .update({ activo })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/dashboard/maestros');
    revalidatePath('/admin/dashboard/cursos');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
