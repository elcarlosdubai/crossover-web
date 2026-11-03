"use client";
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "asistencia";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Cargando...");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        // Fetch role from perfiles_usuarios
        const { data: profile } = await supabase
          .from('perfiles_usuarios')
          .select('nombre, rol')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserRole(profile.rol || 'admin');
          setUserName(profile.nombre || user.email?.split('@')[0] || 'Usuario');
        } else {
          // Fallback based on email if profile query lags
          if (user.email?.includes('director')) setUserRole('director');
          else if (user.email?.includes('recepcion')) setUserRole('recepcion');
          else if (user.email?.includes('profesor')) setUserRole('profesor');
          else if (user.email?.includes('editor')) setUserRole('editor');
          else setUserRole('admin');
          setUserName(user.email?.split('@')[0] || 'Administrador');
        }
      }
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Role badges for the UI
  const roleBadges: Record<string, { label: string; color: string }> = {
    admin: { label: "Super Admin", color: "bg-red-100 text-red-700" },
    director: { label: "Director Académico", color: "bg-blue-100 text-blue-700" },
    recepcion: { label: "Recepción & Caja", color: "bg-emerald-100 text-emerald-700" },
    profesor: { label: "Cuerpo Docente", color: "bg-purple-100 text-purple-700" },
    editor: { label: "Editor de Noticias", color: "bg-amber-100 text-amber-700" }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      
      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
        ></div>
      )}

      {/* Sidebar Responsive */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center md:justify-center">
          <Image src="/rojo.png" alt="Crossover" width={120} height={40} className="object-contain" />
          <button onClick={closeMenu} className="md:hidden text-gray-400 hover:text-gray-900">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* User Profile Mini Card */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-xs font-bold text-gray-900 truncate">{userName ? userName.split('(')[0].trim() : 'Usuario'}</p>
          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${(userRole && roleBadges[userRole]?.color) || 'bg-gray-100 text-gray-700'}`}>
            {(userRole && roleBadges[userRole]?.label) || userRole || 'Cargando...'}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto text-sm">
          {!userRole && (
            <div className="space-y-3 p-2 animate-pulse">
              <div className="h-8 bg-gray-100 rounded-xl"></div>
              <div className="h-8 bg-gray-100 rounded-xl"></div>
              <div className="h-8 bg-gray-100 rounded-xl"></div>
            </div>
          )}
          
          {/* GENERAL: Solo Admin y Director */}
          {/* INICIO (Admin, Director y Profesor) */}
          {(userRole === 'admin' || userRole === 'director' || userRole === 'profesor') && (
            <Link onClick={closeMenu} href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname === '/admin/dashboard' ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Inicio
            </Link>
          )}

          {/* GESTIÓN ACADÉMICA (Director y Admin) */}
          {(userRole === 'admin' || userRole === 'director') && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Gestión Académica</p>
              </div>
              <Link onClick={closeMenu} href="/admin/dashboard/maestros" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('maestros') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">badge</span>
                Cuerpo Docente
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/cursos" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('cursos') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                Gestor de Cursos
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/asistencia" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('asistencia') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                Auditoría Asistencia
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/estudiantes" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('estudiantes') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">group</span>
                Gestor de Estudiantes
              </Link>
            </>
          )}

          {/* CUERPO DOCENTE / PROFESOR (Exclusivo Profesor) */}
          {userRole === 'profesor' && (
            <>
              <div className="pt-2 pb-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Gestión del Aula</p>
              </div>
              <Link 
                onClick={closeMenu} 
                href="/admin/dashboard/calificaciones?tab=asistencia" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith('/admin/dashboard/calificaciones') && currentTab === 'asistencia'
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                Pase de Lista
              </Link>
              <Link 
                onClick={closeMenu} 
                href="/admin/dashboard/calificaciones?tab=calificaciones" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith('/admin/dashboard/calificaciones') && currentTab === 'calificaciones'
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">assignment</span>
                Mis Calificaciones
              </Link>
            </>
          )}

          {/* RECEPCIÓN Y ATENCIÓN (Admin, Director y Recepción para Inscripciones/Ausencias) */}
          {(userRole === 'admin' || userRole === 'director' || userRole === 'recepcion') && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Ventanilla & Seguimiento</p>
              </div>
              <Link onClick={closeMenu} href="/admin/dashboard/inscripciones" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('inscripciones') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">group</span>
                Inscripciones Web
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/ausencias" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('ausencias') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">notification_important</span>
                Triage de Ausencias
              </Link>
            </>
          )}

          {/* CAJA & COBROS (Exclusivo Super Admin y Recepción/Caja - NUNCA Director) */}
          {(userRole === 'admin' || userRole === 'recepcion') && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Caja & Cobros</p>
              </div>
              <Link onClick={closeMenu} href="/admin/dashboard/recibos" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('recibos') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                Recibos & Caja
              </Link>
            </>
          )}

          {/* MARKETING Y CONTENIDO (Solo Admin y Editor Jeremy) */}
          {(userRole === 'admin' || userRole === 'editor') && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Web & Publicaciones</p>
              </div>
              <Link onClick={closeMenu} href="/admin/dashboard/noticias" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('noticias') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">newspaper</span>
                Gestor de Noticias
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/portada" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('portada') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">web</span>
                Diseño de Portada
              </Link>
            </>
          )}

          {/* ADMINISTRACIÓN PURA (Exclusivo Super Admin) */}
          {userRole === 'admin' && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Control Maestro</p>
              </div>
              <Link onClick={closeMenu} href="/admin/dashboard/migracion" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('migracion') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                Migración WordPress
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/usuarios" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('usuarios') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                Usuarios y Roles
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/broadcast" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('broadcast') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">campaign</span>
                Broadcast (Avisos)
              </Link>
              <Link onClick={closeMenu} href="/admin/dashboard/configuracion" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${pathname.includes('configuracion') ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Configuración WhatsApp
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors text-sm">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden shrink-0 z-30 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-700 hover:text-primary focus:outline-none p-1">
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <Image src="/rojo.png" alt="Crossover" width={100} height={40} className="object-contain" />
          </div>
          <button onClick={handleLogout} className="text-red-600 p-1">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 font-bold">Cargando panel...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
