"use server";

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { checkAuth } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

cloudinary.config({
  cloud_name: 'fjpovhwl',
  api_key: '869213681911433',
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0] || '' 
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(base64Image: string) {
  try {
    await checkAuth(); // Proteger la ruta
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'crossover_blog'
    });
    return { success: true, url: result.secure_url };
  } catch (error: any) {
    console.error("Cloudinary error:", error);
    return { success: false, error: error.message };
  }
}

export async function createNoticia(data: {
  titulo: string;
  slug: string;
  foto_portada: string;
  galeria_urls: string[];
  etiquetas: string[];
  contenido_html: string;
}) {
  try {
    await checkAuth(); // Proteger la ruta
    
    // CANDADO ANTI-CHOQUES: Verificar si el slug ya existe
    const { data: existing } = await supabase.from('noticias').select('id').eq('slug', data.slug).maybeSingle();
    if (existing) {
      // Si existe, le agregamos un número aleatorio de 4 dígitos al final
      data.slug = `${data.slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { error } = await supabase.from('noticias').insert([data]);
    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }
    revalidatePath('/admin/dashboard/noticias');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteNoticia(id: number) {
  try {
    await checkAuth(); // Proteger la ruta
    const { error } = await supabase.from('noticias').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath('/admin/dashboard/noticias');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateNoticia(id: number, data: {
  titulo: string;
  slug: string;
  foto_portada: string;
  galeria_urls: string[];
  etiquetas: string[];
  contenido_html: string;
}) {
  try {
    await checkAuth(); // Proteger la ruta
    const { error } = await supabase.from('noticias').update(data).eq('id', id);
    if (error) {
      console.error("Supabase update error:", error);
      return { success: false, error: error.message };
    }
    revalidatePath('/admin/dashboard/noticias');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
