"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDirectorDashboardMetrics } from "@/app/actions/directorDashboard";
import { getDetalleCursoDocente } from "@/app/actions/docente";
import { getRecepcionDashboardMetrics } from "@/app/actions/recepcion";

import { createClient } from "@/utils/supabase/client";
import { getCursosDocente } from "@/app/actions/docente";
import ProfesorPortal from "@/components/dashboard/ProfesorPortal";
import RecepcionPortal from "@/components/dashboard/RecepcionPortal";
import CajaPortal from "@/components/dashboard/CajaPortal";

export default function DashboardHome() {
  const [userRole, setUserRole] = useState<string>("admin");
  const [userNombre, setUserNombre] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [teacherCursos, setTeacherCursos] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal táctil para inspección inmediata de un aula
  const [selectedCursoModal, setSelectedCursoModal] = useState<any>(null);
  const [loadingAulaModal, setLoadingAulaModal] = useState(false);
  const [detalleAula, setDetalleAula] = useState<any>(null);

  // Estados específicos para Dashboard de Recepción
  const [recepcionData, setRecepcionData] = useState<any>(null);
  const [waStatus, setWaStatus] = useState<{
    status: "disconnected" | "connecting" | "qr_ready" | "connected";
    qrCodeDataUrl: string | null;
    phoneNumber: string | null;
    lastConnected: string | null;
  }>({
    status: "disconnected",
    qrCodeDataUrl: null,
    phoneNumber: null,
    lastConnected: null,
  });
  const [cargandoWa, setCargandoWa] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);

  // Filtros táctiles del Director en iPad
  const [dirTab, setDirTab] = useState<"aulas" | "alertas" | "recepcion">("aulas");
  const [dirSoloHoy, setDirSoloHoy] = useState(true);
  const [dirEstadoFilter, setDirEstadoFilter] = useState<"TODAS" | "PENDIENTES" | "PASADAS">("TODAS");
  const [dirTipoFilter, setDirTipoFilter] = useState("TODOS");
  const [dirSearch, setDirSearch] = useState("");
  const [refreshingDir, setRefreshingDir] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let currentRole = "admin";

      if (user) {
        const { data: prof } = await supabase
          .from('perfiles_usuarios')
          .select('nombre, rol')
          .eq('id', user.id)
          .maybeSingle();

        const role = prof?.rol || (user.email?.includes('profesor') ? 'profesor' : user.email?.includes('director') ? 'director' : user.email?.includes('recepcion') ? 'recepcion' : 'admin');
        currentRole = role;
        setUserRole(role);
        setUserNombre(prof?.nombre || user.email?.split('@')[0] || "Usuario");
        setUserEmail(user.email || "");

        if (role === 'profesor') {
          const list = await getCursosDocente(user.email || "", role);
          setTeacherCursos(list);
          setLoading(false);
          return;
        }

        if (role === 'recepcion') {
          const rData = await getRecepcionDashboardMetrics();
          setRecepcionData(rData);
          consultarEstadoWhatsApp();
          setLoading(false);
          return;
        }

        if (role === 'caja') {
          setLoading(false);
          return;
        }
      }

      const metrics = await getDirectorDashboardMetrics();
      setData(metrics);
      setLastUpdated(new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }));
      consultarEstadoWhatsApp();
      setLoading(false);
    }
    load();
  }, []);

  const refreshDirectorData = async () => {
    setRefreshingDir(true);
    const [metrics] = await Promise.all([
      getDirectorDashboardMetrics(),
      consultarEstadoWhatsApp(),
    ]);
    setData(metrics);
    setLastUpdated(new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }));
    setRefreshingDir(false);
  };

  // Auto-refresco silencioso cada 45s para el Director / Admin en iPad
  useEffect(() => {
    if (userRole !== "director" && userRole !== "admin") return;
    const timer = setInterval(() => {
      refreshDirectorData();
    }, 45000);
    return () => clearInterval(timer);
  }, [userRole]);

  const consultarEstadoWhatsApp = async () => {
    try {
      const res = await fetch("/api/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch (err) {
      console.error("Error consultando estado WhatsApp:", err);
    }
  };

  const handleConectarWhatsApp = async () => {
    setCargandoWa(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch (err) {
      console.error("Error conectando WhatsApp:", err);
    } finally {
      setCargandoWa(false);
    }
  };

  const handleDesconectarWhatsApp = async () => {
    if (!confirm("¿Deseas desconectar la sesión de WhatsApp del centro?")) return;
    setCargandoWa(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch (err) {
      console.error("Error desconectando WhatsApp:", err);
    } finally {
      setCargandoWa(false);
    }
  };

  const abrirInspeccionAula = async (curso: any) => {
    setSelectedCursoModal(curso);
    setLoadingAulaModal(true);
    const res = await getDetalleCursoDocente(curso.id, data?.fechaHoy);
    setDetalleAula(res);
    setLoadingAulaModal(false);
  };

  const kpis = data?.kpis || {
    totalEstudiantesActivos: 0,
    totalDocentes: 0,
    totalCursos: 0,
    totalAulasHoy: 0,
    pctAsistenciaHoy: 100,
    presentesHoy: 0,
    ausenciasHoy: 0,
    tardanzasHoy: 0,
    aulasConListaTomada: 0,
    aulasPendientes: 0
  };

  const pctAsist = kpis.pctAsistenciaHoy;
  const pctColor = pctAsist >= 85 ? "text-emerald-600" : pctAsist >= 75 ? "text-amber-600" : "text-red-600";

  // VISTA ESPECIALIZADA PARA RECEPCIÓN & CAJA
  if (userRole === "recepcion") {
    return (
      <>
        <RecepcionPortal
          userName={userNombre}
          waStatus={waStatus}
          onOpenWaModal={() => {
            setWaModalOpen(true);
            consultarEstadoWhatsApp();
          }}
        />
        {/* MODAL PARA VINCULAR QR DE WHATSAPP (RESPONSABILIDAD DE RECEPCIÓN) */}
        {waModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Línea Oficial WhatsApp</h3>
                    <p className="text-[10px] text-gray-400">Vincular cuenta del centro para envíos automáticos</p>
                  </div>
                </div>
                <button
                  onClick={() => setWaModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="text-center py-4 space-y-3">
                {waStatus.status === "connected" ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
                    </div>
                    <h4 className="text-base font-black text-gray-900">¡WhatsApp Vinculado con Éxito!</h4>
                    <p className="text-xs text-gray-500">
                      Línea activa: <strong className="font-mono text-gray-800">+{waStatus.phoneNumber}</strong>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Los mensajes de preinscripción y ausencias se enviarán directamente desde este número.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleDesconectarWhatsApp}
                        disabled={cargandoWa}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {cargandoWa ? "Desconectando..." : "Desvincular este dispositivo"}
                      </button>
                    </div>
                  </div>
                ) : waStatus.qrCodeDataUrl ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-600 font-medium">
                      Abre WhatsApp en el celular institucional, ve a <strong>Dispositivos vinculados</strong> y escanea este código:
                    </p>
                    <div className="p-3 bg-white border-2 border-dashed border-emerald-300 rounded-2xl inline-block shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={waStatus.qrCodeDataUrl} alt="QR Code WhatsApp" className="w-48 h-48 mx-auto" />
                    </div>
                    <button
                      onClick={consultarEstadoWhatsApp}
                      className="text-xs font-bold text-emerald-700 hover:underline block mx-auto cursor-pointer"
                    >
                      🔄 Ya lo escaneé (Actualizar estado)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">phone_iphone</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      La sesión de WhatsApp no está iniciada en este momento.
                    </p>
                    <button
                      onClick={handleConectarWhatsApp}
                      disabled={cargandoWa}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {cargandoWa ? "Generando QR..." : "Generar Código QR de Conexión"}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setWaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // VISTA ESPECIALIZADA PARA CAJA
  if (userRole === "caja") {
    return <CajaPortal cajeroNombre={userNombre || "Caja"} />;
  }

  // VISTA ESPECIALIZADA PARA EL PROFESOR (Panel Docente)
  if (userRole === "profesor") {
    return (
      <ProfesorPortal
        userEmail={userEmail}
        userName={userNombre}
        userRole={userRole}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-12 px-1 sm:px-2">
      
      {/* 1. Header Responsive (Móvil y Tablet) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              Supervisión en Pasillo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-gray-900 tracking-tight mt-0.5">
            Estado de Aulas en Vivo
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700">
            <span className={`w-2 h-2 rounded-full ${waStatus.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
            <span>{waStatus.status === "connected" ? "WhatsApp OK" : "WA Offline"}</span>
          </div>
          <button
            type="button"
            onClick={refreshDirectorData}
            disabled={refreshingDir}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshingDir ? "animate-spin" : ""}`}>refresh</span>
            <span>{refreshingDir ? "Actualizando..." : lastUpdated ? `En vivo · ${lastUpdated}` : "Actualizar"}</span>
          </button>
          <Link
            href="/admin/dashboard/asistencia"
            className="flex-1 sm:flex-initial text-center bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            Auditar Asistencias
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin mb-2">progress_activity</span>
          <p className="text-gray-500 font-medium text-xs">Cargando estado del instituto...</p>
        </div>
      ) : (
        <>
          {/* 2. Cuadrícula de 4 Tarjetas Operativas (Adaptada a Celular 2 cols / Tablet 4 cols) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* TARJETA 1: AULAS ACTIVAS HOY */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                Aulas Activas Hoy
              </span>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-4xl font-black text-gray-900">
                  {kpis.totalAulasHoy}
                </span>
                <span className="text-xs font-bold text-gray-400 ml-1.5">clases</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                {kpis.totalDocentes} docentes en servicio
              </p>
            </div>

            {/* TARJETA 2: LISTAS PASADAS / CUMPLIMIENTO */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                Listas Pasadas
              </span>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-4xl font-black text-gray-900">
                  {kpis.aulasConListaTomada}/{kpis.totalAulasHoy}
                </span>
              </div>
              <div>
                <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  kpis.aulasPendientes === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {kpis.aulasPendientes === 0 ? "100% Pasadas" : `${kpis.aulasPendientes} Pendientes`}
                </span>
              </div>
            </div>

            {/* TARJETA 3: ALUMNOS PRESENTES */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                Alumnos en Aula
              </span>
              <div className="my-1 sm:my-2">
                <span className={`text-2xl sm:text-4xl font-black ${pctColor}`}>
                  {kpis.presentesHoy}
                </span>
                <span className="text-xs font-bold text-gray-400 ml-1.5">({pctAsist}%)</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
                De {kpis.totalEstudiantesActivos} matriculados
              </p>
            </div>

            {/* TARJETA 4: AUSENCIAS HOY */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                Ausencias Hoy
              </span>
              <div className="my-1 sm:my-2">
                <span className="text-2xl sm:text-4xl font-black text-red-600">
                  {kpis.ausenciasHoy}
                </span>
                <span className="text-xs font-bold text-gray-400 ml-1.5">faltas</span>
              </div>
              <Link 
                href="/admin/dashboard/ausencias" 
                className="text-[10px] sm:text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5"
              >
                Triage / WhatsApp →
              </Link>
            </div>

          </div>

          {/* 3. PANEL PRINCIPAL CON PESTAÑAS (Aulas / Alertas / Pulso Recepción) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDirTab("aulas")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    dirTab === "aulas" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200/60"
                  }`}
                >
                  Aulas en Curso ({(data?.cumplimientoAulas || []).filter((a: any) => !dirSoloHoy || a.tieneClaseHoy).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirTab("alertas")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    dirTab === "alertas" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200/60"
                  }`}
                >
                  {((kpis.solicitudesDocentesPendientes || 0) + (data?.estudiantesRiesgo?.length || 0)) > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                  Alertas ({(kpis.solicitudesDocentesPendientes || 0) + (data?.estudiantesRiesgo?.length || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setDirTab("recepcion")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    dirTab === "recepcion" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200/60"
                  }`}
                >
                  Pulso Recepción
                </button>
              </div>

              {dirTab === "aulas" && (
                <div className="inline-flex bg-gray-200/70 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setDirSoloHoy(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${dirSoloHoy ? "bg-white text-gray-900 shadow-xs" : "text-gray-600"}`}
                  >
                    Solo Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirSoloHoy(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${!dirSoloHoy ? "bg-white text-gray-900 shadow-xs" : "text-gray-600"}`}
                  >
                    Todas
                  </button>
                </div>
              )}
            </div>

            {dirTab === "aulas" && (
              <>
                <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "TODAS", label: "Todas" },
                        { id: "PENDIENTES", label: "Lista Pendiente" },
                        { id: "PASADAS", label: "Listas Pasadas" },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setDirEstadoFilter(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          dirEstadoFilter === st.id
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                    <select
                      value={dirTipoFilter}
                      onChange={(e) => setDirTipoFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700"
                    >
                      <option value="TODOS">Todas las áreas</option>
                      <option value="COLEGIO">Colegio</option>
                      <option value="INSTITUTO">Instituto</option>
                      <option value="DEPORTES">Deportes</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={dirSearch}
                    onChange={(e) => setDirSearch(e.target.value)}
                    placeholder="Buscar profesor o curso..."
                    className="w-full sm:w-56 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:border-gray-400"
                  />
                </div>

                <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 bg-gray-50/40">
                  {(data?.cumplimientoAulas || [])
                    .filter((aula: any) => {
                      if (dirSoloHoy && !aula.tieneClaseHoy) return false;
                      if (dirEstadoFilter === "PENDIENTES" && aula.listaTomada) return false;
                      if (dirEstadoFilter === "PASADAS" && !aula.listaTomada) return false;
                      if (dirTipoFilter !== "TODOS" && aula.tipo !== dirTipoFilter) return false;
                      const q = dirSearch.toLowerCase().trim();
                      if (q && !`${aula.nombre} ${aula.profesor}`.toLowerCase().includes(q)) return false;
                      return true;
                    })
                    .map((aula: any) => (
                    <div
                      key={aula.id}
                      onClick={() => abrirInspeccionAula(aula)}
                      className={`p-3.5 rounded-xl border bg-white hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        aula.listaTomada ? "border-gray-200/80" : "border-amber-200 bg-amber-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              aula.listaTomada ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                            }`} />
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">{aula.nombre}</h4>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-1 truncate">
                            Prof: <strong className="text-gray-800">{aula.profesor}</strong>
                          </p>
                          {aula.hora_inicio && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {aula.hora_inicio.slice(0, 5)}{aula.hora_fin ? ` - ${aula.hora_fin.slice(0, 5)}` : ""} · {aula.tipo}
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          aula.listaTomada ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {aula.listaTomada ? `${aula.porcentaje}%` : "Pendiente"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-500 font-semibold">
                          {aula.presentes} pres · {aula.ausencias} aus
                        </span>
                        <span className="text-primary font-bold flex items-center gap-0.5">
                          Ver lista
                          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {dirTab === "alertas" && (
              <div className="p-4 sm:p-5 space-y-4">
                {(kpis.solicitudesDocentesPendientes || 0) === 0 && (data?.estudiantesRiesgo?.length || 0) === 0 ? (
                  <div className="py-10 text-center text-xs text-gray-500">
                    Todo en orden: no hay solicitudes pendientes ni alumnos con faltas repetidas.
                  </div>
                ) : (
                  <>
                    {(kpis.solicitudesDocentesPendientes || 0) > 0 && (
                      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900">
                          {kpis.solicitudesDocentesPendientes} solicitud(es) de seguimiento enviadas por profesores pendientes en Recepción.
                        </span>
                        {userRole === "admin" && (
                          <Link
                            href="/admin/dashboard/comunicaciones"
                            className="px-3 py-1.5 rounded-lg bg-white text-amber-900 font-bold border border-amber-200 hover:bg-amber-100/60 shrink-0"
                          >
                            Ver detalle
                          </Link>
                        )}
                      </div>
                    )}

                    {(data?.estudiantesRiesgo?.length || 0) > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-700">
                          Alumnos activos con 2 o más faltas sin justificar (últimos 30 días):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {data.estudiantesRiesgo.map((est: any) => (
                            <div
                              key={est.id}
                              className="bg-gray-50 border border-gray-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{est.nombre}</p>
                                <p className="text-[11px] text-gray-500 truncate">{est.curso}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-black text-[11px] shrink-0 border border-rose-200">
                                {est.faltas} faltas
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {dirTab === "recepcion" && (
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                  <p className="text-[11px] font-bold uppercase text-emerald-700">Ausencias Atendidas</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{kpis.ausenciasAtendidasRecepcion || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/70">
                  <p className="text-[11px] font-bold uppercase text-rose-700">Sin Contactar Hoy</p>
                  <p className="text-2xl font-black text-rose-900 mt-1">{kpis.ausenciasPendientesRecepcion || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                  <p className="text-[11px] font-bold uppercase text-gray-500">Gestiones en Bitácora</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{kpis.accionesAuditoriaHoy || 0}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL TÁCTIL: INSPECCIÓN DE ALUMNOS EN EL AULA */}
      {selectedCursoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                  Inspección de Aula
                </span>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1 truncate">
                  {selectedCursoModal.nombre}
                </h3>
                <p className="text-xs text-gray-500 font-medium">Profesor: {selectedCursoModal.profesor}</p>
              </div>
              <button 
                onClick={() => setSelectedCursoModal(null)} 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Lista Alumnos Modal */}
            <div className="flex-1 overflow-y-auto py-3">
              {loadingAulaModal ? (
                <div className="py-10 text-center text-gray-400">
                  <span className="material-symbols-outlined text-3xl animate-spin mb-1">progress_activity</span>
                  <p className="text-xs">Cargando...</p>
                </div>
              ) : !detalleAula ? (
                <div className="py-6 text-center text-red-500 text-xs">Error cargando detalles.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl text-xs font-bold text-gray-700">
                    <span>{detalleAula.estudiantes.length} inscritos</span>
                    <span className="text-emerald-600">
                      {detalleAula.asistenciasHoy.filter((a: any) => a.estado === 'PRESENTE').length} presentes
                    </span>
                    <span className="text-red-600">
                      {detalleAula.asistenciasHoy.filter((a: any) => a.estado === 'AUSENTE').length} faltas
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {detalleAula.estudiantes.map((est: any) => {
                      const asis = detalleAula.asistenciasHoy.find((a: any) => a.estudiante_id === est.id);
                      const estado = asis?.estado || 'PENDIENTE';

                      return (
                        <div key={est.id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-gray-50">
                          <div>
                            <span className="font-bold text-gray-900 block">{est.nombres} {est.apellidos}</span>
                            <span className="font-mono text-[10px] text-gray-400">{est.matricula}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            estado === 'PRESENTE' ? 'bg-emerald-100 text-emerald-700' :
                            estado === 'AUSENTE' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {estado}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedCursoModal(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
