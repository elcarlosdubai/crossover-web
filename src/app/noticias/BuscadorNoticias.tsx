"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BuscadorNoticias({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isTyping, setIsTyping] = useState(false);

  // Debounced live search: filters automatically after 300ms of inactivity
  useEffect(() => {
    // Avoid re-running on initial mount if same as param
    const currentParam = searchParams.get("q") || "";
    if (query === currentParam) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`/noticias?${params.toString()}`, { scroll: false });
      setIsTyping(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
      params.set("page", "1");
    } else {
      params.delete("q");
    }
    router.push(`/noticias?${params.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`/noticias?${params.toString()}`, { scroll: false });
  };

  const handlePillClick = (term: string) => {
    setQuery(term);
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/noticias?${params.toString()}`, { scroll: false });
  };

  const currentQ = searchParams.get("q") || "";

  return (
    <div className="w-full mb-10 space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative w-full">
        <div className="relative flex items-center">
          <span className={`material-symbols-outlined absolute left-5 text-gray-400 text-2xl pointer-events-none transition-transform ${isTyping ? 'animate-spin text-primary' : ''}`}>
            {isTyping ? 'progress_activity' : 'search'}
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por evento, promoción, deporte o actividad (ej. PROM, Graduación, Ballet)..."
            className="w-full pl-14 pr-14 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 font-medium text-sm md:text-base shadow-sm focus:border-primary focus:outline-none transition-all placeholder:text-gray-400"
          />
          <div className="absolute right-4 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        <span className="text-gray-400 uppercase tracking-wider text-[11px] shrink-0 mr-1">
          Filtros rápidos:
        </span>

        <button
          onClick={() => handlePillClick("")}
          className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
            !currentQ
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => handlePillClick("PROM")}
          className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 ${
            currentQ.toLowerCase() === "prom"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
          }`}
        >
          <span>🎓</span> Graduaciones (PROM)
        </button>

        <button
          onClick={() => handlePillClick("Graduacion")}
          className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 ${
            currentQ.toLowerCase() === "graduacion"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
          }`}
        >
          <span>👶</span> Infantil
        </button>

        <button
          onClick={() => handlePillClick("Day")}
          className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 ${
            currentQ.toLowerCase() === "day"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
          }`}
        >
          <span>🎉</span> Días Especiales
        </button>

        <button
          onClick={() => handlePillClick("Dance")}
          className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1 ${
            currentQ.toLowerCase() === "dance"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
          }`}
        >
          <span>💃</span> Danza & Arte
        </button>
      </div>
    </div>
  );
}
