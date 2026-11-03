import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import BuscadorNoticias from "./BuscadorNoticias";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export default async function NoticiasPublicas({ 
  searchParams 
}: { 
  searchParams: { page?: string; q?: string } 
}) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const searchQuery = (searchParams.q || '').trim();
  const itemsPerPage = 6;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  // Build query
  let query = supabase
    .from('noticias')
    .select('*', { count: 'exact' })
    .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}');

  if (searchQuery) {
    // Search in titulo or slug or etiquetas
    query = query.or(`titulo.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
  }

  const { data: noticias, count, error } = await query
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error cargando noticias:", error);
  }

  const hasNoticias = noticias && noticias.length > 0;
  const totalItems = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <main className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-primary mb-1 block">
              Comunidad Crossover
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">
              Noticias & <span className="text-primary">Actividades</span>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 font-medium">
            {totalItems} {totalItems === 1 ? 'actividad registrada' : 'actividades registradas'}
          </p>
        </div>

        {/* Buscador Interactivo */}
        <BuscadorNoticias initialQuery={searchQuery} />

        {/* Search feedback indicator */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between bg-blue-50/70 border border-blue-100 px-4 py-3 rounded-2xl">
            <p className="text-xs md:text-sm font-semibold text-blue-900">
              Mostrando resultados para: <span className="font-bold">"{searchQuery}"</span> ({totalItems} encontrados)
            </p>
            <Link 
              href="/noticias" 
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
            >
              Ver todas
            </Link>
          </div>
        )}

        {/* Noticias Grid */}
        {!hasNoticias ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">search_off</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No se encontraron resultados</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              {searchQuery 
                ? `No encontramos actividades que coincidan con "${searchQuery}". Intenta con otra palabra como "PROM", "Graduación" o "Día".`
                : "Pronto publicaremos nuestros próximos eventos."}
            </p>
            {searchQuery && (
              <Link 
                href="/noticias" 
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                Restablecer Búsqueda
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {noticias.map((noticia) => (
              <Link 
                href={`/noticias/${noticia.slug}`} 
                key={noticia.id} 
                className="w-full relative group rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl h-[300px] md:h-[380px] block transition-all duration-500 hover:-translate-y-1.5"
              >
                <div className="absolute inset-0 bg-gray-100">
                  {noticia.foto_portada ? (
                    <img 
                      src={noticia.foto_portada} 
                      alt={noticia.titulo} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-110 contrast-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                      <span className="material-symbols-outlined text-6xl opacity-30">image</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-[65%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
                </div>

                <div className="absolute top-4 right-4 z-10">
                  {noticia.galeria_urls && noticia.galeria_urls.length > 0 && (
                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">photo_library</span>
                      {noticia.galeria_urls.length} fotos
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full flex flex-col justify-end h-full">
                  <div>
                    {noticia.etiquetas && noticia.etiquetas.length > 0 && (
                      <span className="inline-block bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm">
                        {noticia.etiquetas[0]}
                      </span>
                    )}
                    <h2 className="text-xl md:text-3xl font-display font-bold text-white leading-tight mb-2 group-hover:text-gray-100 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-4xl line-clamp-2">
                      {noticia.titulo}
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-gray-300 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      <span className="material-symbols-outlined text-[15px] md:text-[17px]">calendar_today</span>
                      {new Date(noticia.created_at).toLocaleDateString('es-DO', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <span className="text-gray-500 font-bold text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Link 
                    href={currentPage <= 1 ? '#' : `/noticias?${new URLSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), page: String(currentPage - 1) }).toString()}`} 
                    className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
                      currentPage <= 1 ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-primary hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Anterior
                  </Link>
                  <Link 
                    href={currentPage >= totalPages ? '#' : `/noticias?${new URLSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), page: String(currentPage + 1) }).toString()}`} 
                    className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
                      currentPage >= totalPages ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-primary text-white hover:bg-[#cc0000]'
                    }`}
                  >
                    Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
