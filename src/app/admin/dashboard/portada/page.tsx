import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import { SearchBar, ActionButtons } from "./ClientComponents";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function ListadoPortada({ 
  searchParams 
}: { 
  searchParams: { query?: string; page?: string } 
}) {
  const query = searchParams.query || "";
  const currentPage = Number(searchParams.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Use filter with cs (contains) to fetch SYSTEM_SLIDE reliably
  let supabaseQuery = supabase
    .from('noticias')
    .select('*', { count: 'exact' })
    .filter('etiquetas', 'cs', '{"SYSTEM_SLIDE"}')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (query) {
    supabaseQuery = supabaseQuery.ilike('titulo', `%${query}%`);
  }

  const { data: slides, count, error } = await supabaseQuery;
  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary mb-1 block">
            Página Principal (Home)
          </span>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Gestor del Carrusel de Portada
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Configura los 4 slides oficiales, sus fotos en Cloudinary, títulos y botones de acción.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span> Ver en el Home
          </Link>
          <Link 
            href="/admin/dashboard/portada/crear" 
            className="bg-primary text-white py-3 px-5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#cc0000] transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Añadir Slide
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <SearchBar initialQuery={query} />
      </div>

      {/* Grid of Visual Slide Cards */}
      {(!slides || slides.length === 0) ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">view_carousel</span>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No hay slides encontrados</h2>
          <p className="text-gray-500 text-sm">Crea uno nuevo usando el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slides.map((slide, idx) => {
            const tag = slide.galeria_urls?.[0] || 'Slide';
            const btn1Text = slide.galeria_urls?.[1] || '';
            const btn1Link = slide.galeria_urls?.[2] || '';
            const btn2Text = slide.galeria_urls?.[3] || '';
            const btn2Link = slide.galeria_urls?.[4] || '';

            return (
              <div 
                key={slide.id}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Visual Preview */}
                  <div className="relative h-48 bg-gray-900 overflow-hidden group">
                    {slide.foto_portada ? (
                      <img 
                        src={slide.foto_portada} 
                        alt={slide.titulo} 
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="material-symbols-outlined text-4xl">image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                    
                    {/* Badge Slide Number & Tag */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-widest">
                        Slide #{idx + 1}
                      </span>
                      <span className="bg-primary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {tag}
                      </span>
                    </div>

                    {/* Headline in preview */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black text-white leading-tight">
                        {slide.titulo} <span className="text-primary">{slide.slug}</span>
                      </h3>
                    </div>
                  </div>

                  {/* Details & Button Links */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {slide.contenido_html || 'Sin descripción asignada.'}
                    </p>

                    {/* Active Button Links */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-xs">
                      {btn1Text && (
                        <div className="bg-red-50 text-red-700 border border-red-200/60 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          <span>Botón 1: <strong>{btn1Text}</strong> ➔ {btn1Link}</span>
                        </div>
                      )}
                      {btn2Text && (
                        <div className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          <span>Botón 2: <strong>{btn2Text}</strong> ➔ {btn2Link}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
                  <span className="text-[11px] font-semibold text-gray-400">
                    Alojada en Cloudinary WebP
                  </span>
                  <ActionButtons id={slide.id} title={slide.titulo} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
