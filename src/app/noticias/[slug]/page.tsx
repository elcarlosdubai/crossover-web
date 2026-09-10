import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import Navbar from "@/components/Navbar";
import PhotoGallery from "./PhotoGallery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60; // Regenerate this page every 60 seconds (ISR)

export default async function NoticiaLectura({ params }: { params: { slug: string } }) {
  const { data: noticia, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !noticia) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Noticia no encontrada</h1>
        <Link href="/noticias" className="bg-primary text-white font-bold py-3 px-8 rounded-xl">Volver al Blog</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <article className="max-w-3xl mx-auto px-4">
          
          {/* Header del Artículo */}
          <div className="mb-10 text-center">
            {noticia.etiquetas && noticia.etiquetas.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {noticia.etiquetas.map((tag: string) => (
                  <span key={tag} className="bg-blue-50 text-blue-600 border border-blue-100 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-display font-black text-gray-900 leading-tight mb-6 tracking-tight">
              {noticia.titulo}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                {new Date(noticia.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                Crossover
              </div>
            </div>
          </div>

          {/* Portada */}
          {noticia.foto_portada && (
            <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-gray-100 rounded-[2rem] overflow-hidden shadow-lg mb-12">
              <img 
                src={noticia.foto_portada} 
                alt={noticia.titulo} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Contenido (Rich Text) */}
          <div 
            className="prose prose-lg md:prose-xl prose-blue max-w-none prose-headings:font-display prose-headings:font-black text-gray-700"
            dangerouslySetInnerHTML={{ __html: noticia.contenido_html }}
          />

          {/* Galería (Si hay) */}
          {noticia.galeria_urls && noticia.galeria_urls.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 mb-8">Galería de Fotos</h3>
              <PhotoGallery images={noticia.galeria_urls} />
            </div>
          )}

          {/* Botón Volver */}
          <div className="mt-16 text-center">
            <Link href="/noticias" className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span> Volver a todas las noticias
            </Link>
          </div>

        </article>
      </main>

    </div>
  );
}
