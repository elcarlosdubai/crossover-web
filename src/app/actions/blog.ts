"use server";

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'fjpovhwl',
  api_key: '869213681911433',
  api_secret: process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0] || '' // Fallback if needed, but wait, the CLOUDINARY_URL is in env!
});

// If CLOUDINARY_URL is fully available, cloudinary SDK picks it up automatically.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(base64Image: string) {
  try {
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
  const { error } = await supabase.from('noticias').insert([data]);
  if (error) {
    console.error("Supabase insert error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deleteNoticia(id: number) {
  const { error } = await supabase.from('noticias').delete().eq('id', id);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateNoticia(id: number, data: {
  titulo: string;
  slug: string;
  foto_portada: string;
  galeria_urls: string[];
  etiquetas: string[];
  contenido_html: string;
}) {
  const { error } = await supabase.from('noticias').update(data).eq('id', id);
  if (error) {
    console.error("Supabase update error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
