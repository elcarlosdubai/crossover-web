import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export default async function NoticiasPublicas({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = parseInt(searchParams.page || '1');
  const itemsPerPage = 5;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  const { data: noticias, count, error } = await supabase
    .from('noticias')
    .select('*', { count: 'exact' })
    .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}')
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error cargando noticias:", error);
  }

  const hasNoticias = noticias && noticias.length > 0;
  const totalPages = count ? Math.ceil(count / itemsPerPage) : 1;

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
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
          <div className="flex flex-col gap-10">
            {noticias.map((noticia) => (
              <Link href={`/noticias/${noticia.slug}`} key={noticia.id} className="w-full relative group rounded-[2rem] overflow-hidden shadow-xl h-[300px] md:h-[400px] block transition-transform duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gray-100">
                  {noticia.foto_portada ? (
                    <img 
                      src={noticia.foto_portada} 
                      alt={noticia.titulo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-110 contrast-110 saturate-[1.15]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                      <span className="material-symbols-outlined text-6xl opacity-30">image</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
                </div>

                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex flex-col justify-end h-full">
                  <div>
                    {noticia.etiquetas && noticia.etiquetas.length > 0 && (
                      <span className="inline-block bg-black/30 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.15em] mb-4 shadow-sm">
                        {noticia.etiquetas[0]}
                      </span>
                    )}
                    <h2 className="text-xl md:text-3xl font-display font-bold text-white leading-tight mb-3 group-hover:text-gray-200 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-4xl">
                      {noticia.titulo}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      <span className="material-symbols-outlined text-[16px] md:text-[18px]">calendar_today</span>
                      {new Date(noticia.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <span className="text-gray-500 font-bold text-sm">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <Link 
                  href={currentPage <= 1 ? '#' : `/noticias?page=${currentPage - 1}`} 
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${currentPage <= 1 ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-primary hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Anterior
                </Link>
                <Link 
                  href={currentPage >= totalPages ? '#' : `/noticias?page=${currentPage + 1}`} 
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-primary text-white hover:bg-[#cc0000]'}`}
                >
                  Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
