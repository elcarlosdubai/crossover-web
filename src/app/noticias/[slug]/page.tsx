import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhotoGallery from "./PhotoGallery";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function NoticiaLectura({ params }: { params: { slug: string } }) {
  const { data: noticia, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('slug', params.slug)
    .single();

  const { data: destacadas } = await supabase
    .from('noticias')
    .select('*')
    .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}')
    .order('created_at', { ascending: false })
    .limit(5);

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
      
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          <article className="lg:w-2/3 flex flex-col">
            
            <div className="mb-10 text-left">
              <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 leading-tight tracking-tight mb-6">
                {noticia.titulo}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Crossover
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  {new Date(noticia.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {noticia.foto_portada && (
              <div className="w-full aspect-[16/9] bg-gray-100 rounded-[2rem] overflow-hidden shadow-lg mb-12 relative group">
                <img 
                  src={noticia.foto_portada} 
                  alt={noticia.titulo} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}

            <div 
              className="prose prose-lg prose-blue max-w-none prose-headings:font-display prose-headings:font-black text-gray-700"
              dangerouslySetInnerHTML={{ __html: noticia.contenido_html }}
            />

            

            {noticia.galeria_urls && noticia.galeria_urls.length > 0 && (
              <div className="mt-12 pt-12 border-t border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">collections</span> Galería de Fotos
                </h3>
                <PhotoGallery images={noticia.galeria_urls} />
              </div>
            )}

            <div className="mt-16 pt-8 border-t border-gray-100 mb-8">
              <Link href="/noticias" className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors bg-gray-50 px-6 py-3 rounded-xl hover:bg-blue-50 w-fit">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span> Volver a todas las noticias
              </Link>
            </div>

          </article>

          <aside className="lg:w-1/3">
            <div className="sticky top-32 bg-gray-50 p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
                <span className="material-symbols-outlined text-primary">local_fire_department</span> Más Noticias
              </h3>
              
              <div className="flex flex-col gap-6 justify-start">
                {destacadas?.filter(n => n.id !== noticia.id).slice(0, 4).map((n) => (
                  <Link href={`/noticias/${n.slug}`} key={n.id} className="group flex gap-4 items-center bg-transparent hover:bg-white p-3 -mx-3 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-gray-200">
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-200 relative">
                      {n.foto_portada ? (
                        <img src={n.foto_portada} alt={n.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-gray-400">image</span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block">
                        {new Date(n.created_at).toLocaleDateString('es-ES')}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {n.titulo}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </main>
      <Footer />
    </div>
  );
}
