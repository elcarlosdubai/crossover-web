import React from "react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import { SearchBar, ActionButtons } from "./ClientComponents";
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function ListadoNoticiasAdmin({
  searchParams,
}: {
  searchParams: { query?: string; page?: string };
}) {
  
  const query = searchParams.query || "";
  const currentPage = Number(searchParams.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Construir la consulta a Supabase
  let supabaseQuery = supabase
    .from('noticias')
    .select('*', { count: 'exact' })
    .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}')
    .order('created_at', { ascending: false })
    .range(from, to);

  // Si hay búsqueda, filtrar por título
  if (query) {
    supabaseQuery = supabaseQuery.ilike('titulo', `%${query}%`);
  }

  const { data: noticias, count, error } = await supabaseQuery;
  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;

  if (error) {
    console.error("Error cargando noticias:", error);
  }

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header y Botón Crear */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Gestor de Noticias</h1>
          <p className="text-gray-500 font-medium">Administra todos los artículos y eventos publicados en el blog del colegio.</p>
        </div>
        <Link 
          href="/admin/dashboard/noticias/crear" 
          className="bg-blue-600 text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-[20px]">add</span> Crear Noticia
        </Link>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
        <SearchBar initialQuery={query} />
      </div>

      {/* Tabla Maestra */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-16">Foto</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Título de la Noticia</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {(!noticias || noticias.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
                    <p className="text-gray-500 font-medium">No se encontraron noticias con ese criterio.</p>
                  </td>
                </tr>
              ) : (
                noticias.map((noticia) => (
                  <tr key={noticia.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                        {noticia.foto_portada ? (
                          <img src={noticia.foto_portada} alt="Portada" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-gray-400">image</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 line-clamp-1">{noticia.titulo}</p>
                      <p className="text-xs text-gray-400 mt-1">/{noticia.slug}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-gray-600">
                        {new Date(noticia.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Publicado
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <ActionButtons id={noticia.id} title={noticia.titulo} />
                      </div>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {noticias && noticias.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Mostrando página {currentPage} de {totalPages} ({count} resultados totales)</span>
            <div className="flex gap-2">
              <Link 
                href={`?page=${currentPage - 1}${query ? `&query=${query}` : ''}`} 
                className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors ${currentPage <= 1 ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'}`}
              >
                Anterior
              </Link>
              <Link 
                href={`?page=${currentPage + 1}${query ? `&query=${query}` : ''}`} 
                className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'}`}
              >
                Siguiente
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
