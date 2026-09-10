import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60; 

export default async function NoticiasPublicas() {
  const { data: noticias, error } = await supabase
    .from('noticias')
    .select('*')
    .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}').order('created_at', { ascending: false });

  if (error) {
    console.error("Error cargando noticias:", error);
  }

  const hasNoticias = noticias && noticias.length > 0;
  const noticiaPrincipal = hasNoticias ? noticias[0] : null;
  const otrasNoticias = hasNoticias ? noticias.slice(1, 5) : []; // Próximas 4 noticias
  const restoNoticias = hasNoticias ? noticias.slice(5) : []; // El resto para el grid inferior

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Título de la Sección */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            Últimas <span className="text-primary">Noticias</span>
          </h1>
        </div>

        {!hasNoticias ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">newspaper</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aún no hay noticias</h2>
            <p className="text-gray-500">Pronto publicaremos nuestros próximos eventos.</p>
          </div>
        ) : (
          <>
            {/* Layout Estilo Revista (Revista Magazine) */}
            <div className="flex flex-col lg:flex-row gap-8 mb-16">
              
              {/* Noticia Principal (Gigante a la izquierda) */}
              <Link href={`/noticias/${noticiaPrincipal.slug}`} className={`${otrasNoticias.length > 0 ? "lg:w-2/3" : "w-full"} relative group rounded-[2rem] overflow-hidden shadow-lg h-[400px] lg:h-[600px] block`}>
                {/* Imagen de Fondo */}
                <div className="absolute inset-0 bg-gray-900">
                  {noticiaPrincipal.foto_portada && (
                    <img 
                      src={noticiaPrincipal.foto_portada} 
                      alt={noticiaPrincipal.titulo} 
                      className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  {/* Gradiente Oscuro para que el texto se lea */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                </div>

                {/* Contenido (Overlay) */}
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                  {noticiaPrincipal.etiquetas && noticiaPrincipal.etiquetas.length > 0 && (
                    <span className="inline-block bg-primary text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 shadow-md">
                      {noticiaPrincipal.etiquetas[0]}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-display font-black text-white leading-tight mb-4 group-hover:text-gray-200 transition-colors">
                    {noticiaPrincipal.titulo}
                  </h2>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {new Date(noticiaPrincipal.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </Link>

              {/* Columna Derecha (Otras Noticias) */}
              {otrasNoticias.length > 0 && (
                <div className="lg:w-1/3 flex flex-col gap-6">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider border-b-2 border-gray-200 pb-2">Destacados</h3>
                  
                  <div className="flex flex-col gap-6 h-full justify-between">
                    {otrasNoticias.map((noticia) => (
                      <Link href={`/noticias/${noticia.slug}`} key={noticia.id} className="group flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                        {/* Foto Miniatura */}
                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                          {noticia.foto_portada ? (
                            <img src={noticia.foto_portada} alt={noticia.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-gray-400">image</span>
                          )}
                        </div>
                        
                        {/* Texto Miniatura */}
                        <div className="flex flex-col flex-1">
                          {noticia.etiquetas && noticia.etiquetas.length > 0 && (
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 block">
                              {noticia.etiquetas[0]}
                            </span>
                          )}
                          <h4 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3">
                            {noticia.titulo}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resto de Noticias (Grid Inferior) */}
            {restoNoticias.length > 0 && (
              <div className="mt-20">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">article</span> Más Publicaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {restoNoticias.map((noticia) => (
                    <Link href={`/noticias/${noticia.slug}`} key={noticia.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                        {noticia.foto_portada ? (
                          <img src={noticia.foto_portada} alt={noticia.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined text-4xl">image</span>
                          </div>
                        )}
                        {noticia.etiquetas && noticia.etiquetas.length > 0 && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/95 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                              {noticia.etiquetas[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {new Date(noticia.created_at).toLocaleDateString('es-ES')}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
                          {noticia.titulo}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
