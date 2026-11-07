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
        const { data: profile } = await supabase
          .from("perfiles_usuarios")
          .select("nombre, rol")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setUserRole(profile.rol || "admin");
          setUserName(profile.nombre || user.email?.split("@")[0] || "Usuario");
        } else {
          if (user.email?.includes("director")) setUserRole("director");
          else if (user.email?.includes("recepcion")) setUserRole("recepcion");
          else if (user.email?.includes("profesor")) setUserRole("profesor");
          else if (user.email?.includes("editor")) setUserRole("editor");
          else setUserRole("admin");
          setUserName(user.email?.split("@")[0] || "Administrador");
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

  const roleBadges: Record<string, { label: string; bg: string }> = {
    admin: { label: "Super Admin", bg: "bg-red-50 text-[#990000] border-red-200/60" },
    director: { label: "Director Académico", bg: "bg-blue-50 text-blue-700 border-blue-200/60" },
    recepcion: { label: "Recepción & Caja", bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
    profesor: { label: "Cuerpo Docente", bg: "bg-purple-50 text-purple-700 border-purple-200/60" },
    editor: { label: "Editor de Noticias", bg: "bg-amber-50 text-amber-700 border-amber-200/60" }
  };

  // Helper para items de navegación con estilo SaaS moderno (sutil, limpio, con microinteracciones)
  const renderNavItem = (href: string, label: string, icon: string, isExact = false, pill?: string) => {
    const active = isExact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        onClick={closeMenu}
        href={href}
        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 ${
          active
            ? "bg-red-50 text-[#990000] font-bold shadow-2xs"
            : "text-gray-600 hover:text-gray-950 hover:bg-gray-100/70"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`material-symbols-outlined text-[19px] shrink-0 transition-colors ${
              active ? "text-[#990000]" : "text-gray-400 group-hover:text-gray-700"
            }`}
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        {pill && (
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 border ${
              active
                ? "bg-[#990000] text-white border-transparent"
                : "bg-red-50 text-[#990000] border-red-200/60"
            }`}
          >
            {pill}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex relative selection:bg-[#990000] selection:text-white font-sans antialiased">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={closeMenu}
        ></div>
      )}

      {/* SIDEBAR TIPO SAAS PREMIUM */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200/80 flex flex-col z-50 transform transition-transform duration-200 ease-out ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* HEADER LOGO */}
        <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 transition-transform active:scale-95">
            <Image
              src="/rojo.png"
              alt="Crossover"
              width={115}
              height={38}
              className="object-contain drop-shadow-2xs"
              priority
            />
          </Link>
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-[9px] font-black tracking-widest text-gray-500 uppercase border border-gray-200/60">
            PRO
          </span>
          <button onClick={closeMenu} className="md:hidden text-gray-400 hover:text-gray-900 p-1">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* NAVEGACIÓN EN SECCIONES MINIMALISTAS */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {!userRole && (
            <div className="space-y-2 p-2 animate-pulse">
              <div className="h-7 bg-gray-100 rounded-lg"></div>
              <div className="h-7 bg-gray-100 rounded-lg"></div>
              <div className="h-7 bg-gray-100 rounded-lg"></div>
            </div>
          )}

          {/* SECCIÓN 1: GENERAL */}
          {(userRole === "admin" || userRole === "director" || userRole === "profesor") && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                General
              </p>
              {renderNavItem("/admin/dashboard", "Dashboard", "grid_view", true)}
            </div>
          )}

          {/* SECCIÓN 2: CENTRO DE MANDO & ADMISIONES */}
          {(userRole === "admin" || userRole === "director" || userRole === "recepcion") && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Comunicaciones & Caja
              </p>
              {renderNavItem("/admin/dashboard/comunicaciones", "Centro de Mando", "hub")}
              {renderNavItem("/admin/dashboard/inscripciones", "Pre-Inscripciones", "how_to_reg")}
              {(userRole === "admin" || userRole === "recepcion") &&
                renderNavItem("/admin/dashboard/recibos", "Recibos & Caja", "receipt_long")}
            </div>
          )}

          {/* SECCIÓN 3: GESTIÓN ACADÉMICA */}
          {(userRole === "admin" || userRole === "director") && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Academia
              </p>
              {renderNavItem("/admin/dashboard/cursos", "Cursos & Horarios", "auto_stories")}
              {renderNavItem("/admin/dashboard/estudiantes", "Estudiantes", "school")}
              {renderNavItem("/admin/dashboard/maestros", "Cuerpo Docente", "badge")}
              {renderNavItem("/admin/dashboard/asistencia", "Auditoría Asistencias", "fact_check")}
            </div>
          )}

          {/* PROFESOR */}
          {userRole === "profesor" && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Gestión del Aula
              </p>
              <Link
                onClick={closeMenu}
                href="/admin/dashboard/calificaciones?tab=asistencia"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  pathname.startsWith("/admin/dashboard/calificaciones") && currentTab === "asistencia"
                    ? "bg-red-50 text-[#990000] font-bold"
                    : "text-gray-600 hover:bg-gray-100/70"
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">fact_check</span>
                <span>Pase de Lista</span>
              </Link>
              <Link
                onClick={closeMenu}
                href="/admin/dashboard/calificaciones?tab=calificaciones"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  pathname.startsWith("/admin/dashboard/calificaciones") && currentTab === "calificaciones"
                    ? "bg-red-50 text-[#990000] font-bold"
                    : "text-gray-600 hover:bg-gray-100/70"
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">assignment</span>
                <span>Calificaciones</span>
              </Link>
            </div>
          )}

          {/* SECCIÓN 4: CONTENIDO & WEB */}
          {(userRole === "admin" || userRole === "editor") && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Sitio Web
              </p>
              {renderNavItem("/admin/dashboard/noticias", "Noticias & Blog", "newspaper")}
              {renderNavItem("/admin/dashboard/portada", "Diseño de Portada", "web")}
            </div>
          )}

          {/* SECCIÓN 5: SISTEMA */}
          {userRole === "admin" && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Sistema
              </p>
              {renderNavItem("/admin/dashboard/usuarios", "Usuarios & Roles", "manage_accounts")}
              {renderNavItem("/admin/dashboard/configuracion", "Ajustes del Sistema", "settings")}
            </div>
          )}
        </nav>

        {/* PIE DEL SIDEBAR: USUARIO CON AVATAR TIPO SAAS ELEGANTE */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#990000] to-red-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                {(userName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                  {userName ? userName.split("(")[0].trim() : "Usuario"}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {userEmail || "admin@crossover.edu.do"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
        {/* Header Móvil */}
        <header className="h-14 bg-white border-b border-gray-200/80 px-4 flex justify-between items-center md:hidden shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-700 hover:text-gray-950 p-1 focus:outline-none"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <Image src="/rojo.png" alt="Crossover" width={95} height={32} className="object-contain" />
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 p-1">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </header>

        {/* Lienzo interior con padding balanceado */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-gray-400 text-xs font-bold">
          Cargando panel...
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
