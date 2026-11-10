"use client";
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getMiPerfil, actualizarMiPerfil, cambiarPasswordUsuario } from "@/app/actions/usuarios";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "asistencia";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Cargando...");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  // Estados del Modal "Mi Perfil"
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [perfilTab, setPerfilTab] = useState<"datos" | "seguridad">("datos");
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilData, setPerfilData] = useState<{
    id: string;
    nombre: string;
    username: string;
    email: string;
    email_notificaciones: string;
    telefono: string;
    rol: string;
    created_at?: string;
  } | null>(null);

  // Form campos perfil
  const [inputNombre, setInputNombre] = useState("");
  const [inputTelefono, setInputTelefono] = useState("");
  const [inputEmailNotif, setInputEmailNotif] = useState("");

  // Form campos seguridad
  const [inputNuevaClave, setInputNuevaClave] = useState("");
  const [inputConfirmClave, setInputConfirmClave] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
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

  // Abrir Modal de Mi Perfil
  const abrirModalPerfil = async () => {
    if (!userId) return;
    setPerfilModalOpen(true);
    setPerfilTab("datos");
    setMensajePerfil(null);
    setCargandoPerfil(true);

    const res = await getMiPerfil(userId);
    if (res.success && res.perfil) {
      const p = res.perfil;
      setPerfilData({
        id: p.id,
        nombre: p.nombre || "",
        username: p.username || (p.email?.split("@")[0] || "usuario"),
        email: p.email || "",
        email_notificaciones: p.email_notificaciones || "",
        telefono: p.telefono || "",
        rol: p.rol || userRole || "usuario",
        created_at: p.created_at,
      });
      setInputNombre(p.nombre || "");
      setInputTelefono(p.telefono || "");
      setInputEmailNotif(p.email_notificaciones || "");
    }
    setCargandoPerfil(false);
  };

  // Formatear Teléfono xxx-xxx-xxxx
  const handlePhoneFormat = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setInputTelefono(formatted);
  };

  // Guardar datos personales
  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !inputNombre.trim()) return;

    setGuardandoPerfil(true);
    setMensajePerfil(null);

    const res = await actualizarMiPerfil(userId, {
      nombre: inputNombre,
      telefono: inputTelefono,
      emailNotificaciones: inputEmailNotif,
    });

    if (res.success) {
      setUserName(inputNombre);
      setMensajePerfil({ tipo: "exito", texto: "¡Tus datos han sido actualizados con éxito!" });
    } else {
      setMensajePerfil({ tipo: "error", texto: res.error || "Error al actualizar perfil." });
    }
    setGuardandoPerfil(false);
  };

  // Cambiar contraseña propia
  const handleGuardarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!inputNuevaClave || inputNuevaClave.length < 6) {
      setMensajePerfil({ tipo: "error", texto: "La nueva contraseña debe tener mínimo 6 caracteres." });
      return;
    }
    if (inputNuevaClave !== inputConfirmClave) {
      setMensajePerfil({ tipo: "error", texto: "Las contraseñas no coinciden. Verifícalas bien." });
      return;
    }

    setGuardandoPerfil(true);
    setMensajePerfil(null);

    const res = await cambiarPasswordUsuario(userId, inputNuevaClave);

    if (res.success) {
      setInputNuevaClave("");
      setInputConfirmClave("");
      setMensajePerfil({ tipo: "exito", texto: "¡Contraseña actualizada exitosamente! Úsala en tu próximo acceso." });
    } else {
      setMensajePerfil({ tipo: "error", texto: res.error || "No se pudo cambiar la contraseña." });
    }
    setGuardandoPerfil(false);
  };

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
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-gray-100/80 transition-colors">
            <button
              type="button"
              onClick={abrirModalPerfil}
              className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer group"
              title="Ver y Editar Mi Perfil"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#990000] to-red-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:ring-2 ring-[#990000]/30 transition-all">
                {(userName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#990000] truncate leading-tight transition-colors">
                    {userName ? userName.split("(")[0].trim() : "Usuario"}
                  </p>
                  <span className="material-symbols-outlined text-[14px] text-gray-400 group-hover:text-[#990000] transition-colors">
                    settings
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">
                  {userRole ? (roleBadges[userRole]?.label || userRole) : "Mi Perfil"}
                </p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
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
          <div className="flex items-center gap-2">
            <button
              onClick={abrirModalPerfil}
              className="w-8 h-8 rounded-full bg-[#990000] text-white font-black text-xs flex items-center justify-center cursor-pointer"
              title="Mi Perfil"
            >
              {(userName || "U").charAt(0).toUpperCase()}
            </button>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 p-1">
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </header>

        {/* Lienzo interior con padding balanceado */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* ================= MODAL ELEGANTE: MI PERFIL (TODOS LOS ROLES) ================= */}
      {perfilModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header del Perfil con Banner */}
            <div className="bg-linear-to-r from-gray-900 via-gray-950 to-black text-white p-6 relative">
              <button
                onClick={() => setPerfilModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-[#990000] to-red-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0 border-2 border-white/20">
                  {(userName || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black truncate">{userName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-red-200 bg-white/10 px-2 py-0.5 rounded-md">
                      @{perfilData?.username || "usuario"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      {userRole ? (roleBadges[userRole]?.label || userRole) : "Personal"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs: Mis Datos vs Seguridad */}
              <div className="flex items-center gap-2 mt-6 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setPerfilTab("datos"); setMensajePerfil(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    perfilTab === "datos"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  Mis Datos
                </button>
                <button
                  type="button"
                  onClick={() => { setPerfilTab("seguridad"); setMensajePerfil(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    perfilTab === "seguridad"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">lock_reset</span>
                  Seguridad & Clave
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6">
              {/* Notificación de Éxito o Error */}
              {mensajePerfil && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                    mensajePerfil.tipo === "exito"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-base shrink-0">
                    {mensajePerfil.tipo === "exito" ? "check_circle" : "error"}
                  </span>
                  <span>{mensajePerfil.texto}</span>
                </div>
              )}

              {cargandoPerfil ? (
                <div className="py-12 text-center text-xs text-gray-400 font-bold">
                  Cargando información del perfil...
                </div>
              ) : perfilTab === "datos" ? (
                /* TAB 1: MIS DATOS PERSONALES */
                <form onSubmit={handleGuardarDatos} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={inputNombre}
                      onChange={(e) => setInputNombre(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nombre de Usuario (Acceso)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`@${perfilData?.username || ""}`}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">El nombre de usuario institucional no puede modificarse.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Correo Electrónico (Notificaciones & Recuperación)
                    </label>
                    <input
                      type="email"
                      value={inputEmailNotif}
                      onChange={(e) => setInputEmailNotif(e.target.value)}
                      placeholder="tunombre@gmail.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Aquí te llegarán los avisos y enlaces si olvidas tu clave.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Teléfono Móvil (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={inputTelefono}
                      onChange={(e) => handlePhoneFormat(e.target.value)}
                      placeholder="809-555-0100"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPerfilModalOpen(false)}
                      className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs uppercase cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoPerfil}
                      className="w-1/2 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {guardandoPerfil ? "Guardando..." : "Guardar Datos"}
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: SEGURIDAD & CAMBIO DE CONTRASEÑA */
                <form onSubmit={handleGuardarClave} className="space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-base shrink-0">shield</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Elige una contraseña segura que recuerdes fácilmente. Mínimo 6 caracteres.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={inputNuevaClave}
                        onChange={(e) => setInputNuevaClave(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={inputConfirmClave}
                      onChange={(e) => setInputConfirmClave(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPerfilModalOpen(false)}
                      className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs uppercase cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoPerfil}
                      className="w-1/2 py-2.5 rounded-xl bg-[#990000] hover:bg-[#800000] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {guardandoPerfil ? "Actualizando..." : "Actualizar Clave"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
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
