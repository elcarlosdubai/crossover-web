"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100 flex justify-center">
          <Image src="/rojo.png" alt="Crossover" width={140} height={50} className="object-contain" />
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/admin/dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            Inicio
          </Link>
          
          <div className="pt-2 pb-1">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Gestión Escolar</p>
          </div>
          <Link href="/admin/dashboard/inscripciones" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('inscripciones') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">group</span>
            Inscripciones
          </Link>
          <Link href="/admin/dashboard/calificaciones" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('calificaciones') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">school</span>
            Calificaciones
          </Link>

          <div className="pt-2 pb-1">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Marketing & Comms</p>
          </div>
          <Link href="/admin/dashboard/noticias" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('noticias') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">newspaper</span>
            Noticias
          </Link>
          <Link href="/admin/dashboard/broadcast" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('broadcast') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">campaign</span>
            Broadcast (Avisos)
          </Link>

          <div className="pt-2 pb-1">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Administración</p>
          </div>
          <Link href="/admin/dashboard/usuarios" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('usuarios') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">manage_accounts</span>
            Usuarios y Roles
          </Link>
          <Link href="/admin/dashboard/portada" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('portada') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">web</span>
            Diseño de Portada
          </Link>
          <Link href="/admin/dashboard/configuracion" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.includes('configuracion') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Conexión WhatsApp
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden">
          <Image src="/rojo.png" alt="Crossover" width={100} height={40} className="object-contain" />
          <button onClick={handleLogout} className="text-red-600">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
