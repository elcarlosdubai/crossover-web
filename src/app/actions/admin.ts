"use server";
import { createClient } from '@supabase/supabase-js';
import { checkAuth } from '@/utils/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function createNews(data: any) {
  try {
    await checkAuth(); // Proteger la ruta
    const { error } = await supabase.from('noticias').insert([data]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateNews(id: number, data: any) {
  try {
    await checkAuth(); // Proteger la ruta
    const { error } = await supabase.from('noticias').update(data).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteNews(id: number) {
  try {
    await checkAuth(); // Proteger la ruta
    const { error } = await supabase.from('noticias').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
