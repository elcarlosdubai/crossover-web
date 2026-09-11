"use server";

import { createClient } from '@supabase/supabase-js';
import { checkAuth } from '@/utils/supabase/server';

// We use the service_role key to bypass RLS for admin tasks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getConfiguracion() {
  const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).single();
  if (error) {
    console.error("Error fetching config:", error);
    return null;
  }
  return data;
}

export async function updateConfiguracion(formData: any) {
  try {
    await checkAuth(); // Proteger la ruta de actualizacion
    const { error } = await supabase
      .from('configuracion')
      .update({
        whatsapp: formData.whatsapp,
        email_soporte: formData.email_soporte,
        ciclo_actual: formData.ciclo_actual
      })
      .eq('id', 1);
      
    if (error) {
      console.error("Error updating config:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
