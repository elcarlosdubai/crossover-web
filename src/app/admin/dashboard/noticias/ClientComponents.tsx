"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { deleteNoticia } from "@/app/actions/blog";
import Link from "next/link";

export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    // Live Search with Debounce (avoids collapsing DB)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      if (val.trim()) {
        router.push(`/admin/dashboard/noticias?query=${encodeURIComponent(val)}`);
      } else {
        router.push(`/admin/dashboard/noticias`);
      }
    }, 300); // 300ms wait
  };

  return (
    <div className="flex-1 relative">
      <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-400">search</span>
      <input 
        type="text" 
        value={query}
        onChange={handleChange}
        placeholder="Buscar noticia dinámicamente..." 
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 font-medium focus:outline-none focus:border-blue-500 transition-all"
      />
    </div>
  );
}

export function ActionButtons({ id, title }: { id: number, title: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente: "${title}"?`);
    if (!confirm) return;
    setIsDeleting(true);
    const res = await deleteNoticia(id);
    setIsDeleting(false);
    if (res.success) {
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
      <Link href={`/admin/dashboard/noticias/${id}`} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors" title="Editar">
        <span className="material-symbols-outlined text-[18px]">edit</span>
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center transition-colors ${isDeleting ? 'text-gray-400' : 'text-gray-600 hover:bg-red-100 hover:text-red-600'}`} 
        title="Eliminar"
      >
        <span className="material-symbols-outlined text-[18px]">{isDeleting ? 'sync' : 'delete'}</span>
      </button>
    </div>
  );
}
