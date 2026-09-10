"use server";

import { createClient } from '@supabase/supabase-js';

// We use the service_role key to bypass RLS for admin tasks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
}
