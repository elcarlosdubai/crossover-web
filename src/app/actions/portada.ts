"use server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function createSlide(data: any) {
  const { error } = await supabase.from('noticias').insert([{
    titulo: data.title,
    slug: data.subtitle,
    foto_portada: data.bg,
    contenido_html: data.description,
    galeria_urls: [data.tag, data.btnText, data.btnLink, data.btn2Text, data.btn2Link],
    etiquetas: ['SYSTEM_SLIDE']
  }]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateSlide(id: number, data: any) {
  const { error } = await supabase.from('noticias').update({
    titulo: data.title,
    slug: data.subtitle,
    foto_portada: data.bg,
    contenido_html: data.description,
    galeria_urls: [data.tag, data.btnText, data.btnLink, data.btn2Text, data.btn2Link]
  }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSlide(id: number) {
  const { error } = await supabase.from('noticias').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getPublicSlides() {
  const { data: allData } = await supabase.from('noticias').select('*').order('created_at', { ascending: false });
  if (allData && allData.length > 0) {
    const data = allData.filter((n: any) => n.etiquetas && n.etiquetas.includes('SYSTEM_SLIDE'));
    if (data && data.length > 0) {
      return data.map((row: any) => ({
        tag: row.galeria_urls?.[0] || "",
        title: row.titulo || "",
        subtitle: row.slug || "",
        description: row.contenido_html || "",
        bg: row.foto_portada || "",
        btnText: row.galeria_urls?.[1] || "",
        btnLink: row.galeria_urls?.[2] || "",
        btn2Text: row.galeria_urls?.[3] || "",
        btn2Link: row.galeria_urls?.[4] || ""
      }));
    }
  }
  return [];
}
