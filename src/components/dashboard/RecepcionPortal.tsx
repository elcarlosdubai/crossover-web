"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getRecepcionDashboardMetrics,
  actualizarEstadoAusencia,
  actualizarAusenciaMasiva,
  buscarEstudiantesRecepcion,
  crearLeadRapidoRecepcion,
  actualizarEstadoLeadRecepcion,
  registrarAuditoriaRecepcion,
  atenderSolicitudDocenteRecepcion,
} from "@/app/actions/recepcion";

interface RecepcionPortalProps {
  userName: string;
  waStatus: { status: string; phoneNumber?: string | null };
  onOpenWaModal: () => void;
}

type MainTab = "ausencias" | "solicitudes" | "leads" | "auditoria";
type AusenciaSubTab = "PENDIENTE" | "WHATSAPP_ENVIADO" | "LLAMADO_REALIZADO" | "JUSTIFICADA";

const PAGE_SIZE = 20;

export default function RecepcionPortal({ userName, waStatus, onOpenWaModal }: RecepcionPortalProps) {
  const cleanNombre = userName.split("(")[0].trim() || "Recepción";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    kpis: { totalAusencias: 0, ausenciasPendientes: 0, totalLeadsPendientes: 0, totalCobradoHoy: 0, cantidadRecibosHoy: 0, solicitudesPendientes: 0 },
    ausenciasHoy: [],
    leadsRecientes: [],
    cursosCatalogo: [],
    auditoriaHoy: [],
    solicitudesDocentes: [],
  });

  const [mainTab, setMainTab] = useState<MainTab>("ausencias");
  const [ausTab, setAusTab] = useState<AusenciaSubTab>("PENDIENTE");
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [filterCursoId, setFilterCursoId] = useState("TODOS");
  const [ausSearch, setAusSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Consulta rápida
  const [quickQuery, setQuickQuery] = useState("");
  const [quickResults, setQuickResults] = useState<any[]>([]);
  const [searchingQuick, setSearchingQuick] = useState(false);

  // Modal Nuevo Interesado
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    nombres_aspirante: "",
    apellidos_aspirante: "",
    telefono_tutor: "",
    curso_solicitado: "",
  });
  const [savingLead, setSavingLead] = useState(false);

  // Modal Justificar / Nota Ausencia
  const [justificarCtx, setJustificarCtx] = useState<{ id: string; nombre: string; nota: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" | "info" }[]>([]);
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const loadMetrics = async () => {
    setLoading(true);
    const res = await getRecepcionDashboardMetrics();
    setData(res);
    if (!leadForm.curso_solicitado && res.cursosCatalogo?.length > 0) {
      setLeadForm((f) => ({ ...f, curso_solicitado: res.cursosCatalogo[0].nombre }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Consulta rápida con debounce
  useEffect(() => {
    const q = quickQuery.trim();
    if (q.length < 2) {
      setQuickResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingQuick(true);
      const res = await buscarEstudiantesRecepcion(q);
      setQuickResults(res);
      setSearchingQuick(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [quickQuery]);

  // Filtrado de ausencias
  const filteredAusencias = useMemo(() => {
    const q = ausSearch.toLowerCase().trim();
    return (data.ausenciasHoy || []).filter((a: any) => {
      const estadoAt = a.atencion_recepcion || "PENDIENTE";
      if (estadoAt !== ausTab) return false;
      if (filterTipo !== "TODOS" && a.curso?.tipo !== filterTipo) return false;
      if (filterCursoId !== "TODOS" && a.curso?.id !== filterCursoId) return false;
      if (q) {
        const full = `${a.estudiante?.nombres || ""} ${a.estudiante?.apellidos || ""} ${a.estudiante?.matricula || ""} ${a.estudiante?.tutor_telefono || ""}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [data.ausenciasHoy, ausTab, filterTipo, filterCursoId, ausSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredAusencias.length / PAGE_SIZE));
  const paginatedAusencias = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAusencias.slice(start, start + PAGE_SIZE);
  }, [filteredAusencias, page]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [ausTab, filterTipo, filterCursoId, ausSearch]);

  const ausCounts = useMemo(() => {
    const list = data.ausenciasHoy || [];
    return {
      PENDIENTE: list.filter((a: any) => !a.atencion_recepcion || a.atencion_recepcion === "PENDIENTE").length,
      WHATSAPP_ENVIADO: list.filter((a: any) => a.atencion_recepcion === "WHATSAPP_ENVIADO").length,
      LLAMADO_REALIZADO: list.filter((a: any) => a.atencion_recepcion === "LLAMADO_REALIZADO").length,
      JUSTIFICADA: list.filter((a: any) => a.atencion_recepcion === "JUSTIFICADA").length,
    };
  }, [data.ausenciasHoy]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedAusencias.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedAusencias.map((a: any) => a.id));
    }
  };

  const handleBulkAction = async (nuevoEstado: AusenciaSubTab) => {
    if (selectedIds.length === 0) return;
    const res = await actualizarAusenciaMasiva(selectedIds, nuevoEstado, cleanNombre);
    if (res.success) {
      showToast(`${selectedIds.length} ausencia(s) actualizadas.`, "success");
      setSelectedIds([]);
      await loadMetrics();
    } else {
      showToast(res.error || "Error al actualizar", "error");
    }
  };

  const abrirWhatsAppAusencia = (a: any, nombreEst: string) => {
    const rawTel = String(a?.estudiante?.tutor_telefono || "").replace(/\D/g, "");
    if (rawTel.length >= 10) {
      const telIntl = rawTel.length === 10 ? `1${rawTel}` : rawTel;
      const tutor = a?.estudiante?.tutor_nombre || "Tutor";
      const curso = a?.curso?.nombre || "su clase";
      const texto = `Hola ${tutor}, le saludamos de Centro Educativo Crossover. Notamos la ausencia de ${nombreEst} hoy en ${curso} y queremos confirmar que todo esté bien.`;
      window.open(`https://wa.me/${telIntl}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    }
    handleSingleAusencia(a.id, nombreEst, "WHATSAPP_ENVIADO");
  };

  const handleSingleAusencia = async (id: string, nombre: string, nuevoEstado: AusenciaSubTab, obs?: string) => {
    const res = await actualizarEstadoAusencia(id, nuevoEstado, obs);
    if (res.success) {
      await registrarAuditoriaRecepcion(
        cleanNombre,
        `Ausencia (${nuevoEstado})`,
        `${nombre}${obs ? ` · ${obs}` : ""}`
      );
      showToast(`${nombre} marcado como ${nuevoEstado.replace("_", " ")}.`, "success");
      await loadMetrics();
    } else {
      showToast(res.error || "Error al actualizar", "error");
    }
  };

  const handleAtenderSolicitud = async (s: any) => {
    const res = await atenderSolicitudDocenteRecepcion(
      s.id,
      cleanNombre,
      `${s.destinatario_nombre} · ${s.asunto_o_titulo}`
    );
    if (res.success) {
      showToast(`Solicitud de seguimiento para ${s.destinatario_nombre} marcada como atendida.`, "success");
      await loadMetrics();
    } else {
      showToast(res.error || "Error al atender solicitud", "error");
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nombres_aspirante.trim() || !leadForm.telefono_tutor.trim()) {
      showToast("Nombre y teléfono del interesado son obligatorios.", "error");
      return;
    }
    setSavingLead(true);
    const res = await crearLeadRapidoRecepcion({
      ...leadForm,
      recepcionista: cleanNombre,
    });
    setSavingLead(false);
    if (res.success) {
      showToast("Interesado registrado y auditado.", "success");
      setLeadModalOpen(false);
      setLeadForm((f) => ({ ...f, nombres_aspirante: "", apellidos_aspirante: "", telefono_tutor: "" }));
      await loadMetrics();
    } else {
      showToast(res.error || "Error creando lead", "error");
    }
  };

  const handleLeadAction = async (lead: any, nuevoEstado: string) => {
    const res = await actualizarEstadoLeadRecepcion(
      lead.id,
      nuevoEstado,
      cleanNombre,
      `${lead.nombres_aspirante} ${lead.apellidos_aspirante} (${lead.telefono_tutor}) -> ${nuevoEstado}`
    );
    if (res.success) {
      showToast(`Lead actualizado a ${nuevoEstado}.`, "success");
      await loadMetrics();
    } else {
      showToast(res.error || "Error actualizando lead", "error");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* TOASTS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg ${
              t.type === "error"
                ? "bg-rose-600 text-white border-rose-700"
                : t.type === "info"
                ? "bg-white text-slate-800 border-slate-200"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      {/* HEADER + CONSULTA RÁPIDA + WHATSAPP */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Recepción
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight mt-0.5">
              Mesa de Trabajo: {cleanNombre}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  waStatus.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-900 leading-none">
                  {waStatus.status === "connected" ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {waStatus.phoneNumber ? `+${waStatus.phoneNumber}` : "Línea del centro"}
                </p>
              </div>
              <button
                onClick={onOpenWaModal}
                className="ml-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-800"
              >
                {waStatus.status === "connected" ? "Gestionar" : "Vincular QR"}
              </button>
            </div>

            <button
              onClick={() => setLeadModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              + Nuevo Interesado
            </button>
            <Link
              href="/admin/dashboard/recibos"
              className="px-3.5 py-2.5 rounded-xl bg-[#990000] hover:bg-red-800 text-white text-xs font-bold transition shadow-xs"
            >
              Caja / Recibo
            </Link>
          </div>
        </div>

        {/* Barra de Consulta Rápida */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Consulta rápida: busca estudiante por nombre, matrícula, tutor o teléfono..."
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
            {searchingQuick && <span className="text-[11px] text-slate-400">Buscando...</span>}
          </div>

          {quickResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-30 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {quickResults.map((est) => (
                <div key={est.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {est.nombres} {est.apellidos}{" "}
                      <span className="text-slate-400 font-normal">({est.matricula})</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {est.curso?.nombre || "Sin curso"} · Tutor: {est.tutor_nombre || "N/A"} ({est.tutor_telefono || "N/A"})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuickQuery("");
                      setQuickResults([]);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900"
                  >
                    Cerrar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setMainTab("ausencias")}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ausencias de Hoy</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {data.kpis?.totalAusencias || 0}{" "}
            <span className="text-xs font-bold text-rose-600">({data.kpis?.ausenciasPendientes || 0} pend.)</span>
          </p>
        </div>

        <div
          onClick={() => setMainTab("leads")}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Leads Pendientes</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {data.kpis?.totalLeadsPendientes || 0}
          </p>
        </div>

        <Link
          href="/admin/dashboard/recibos"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Caja Cobrada Hoy</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            RD$ {(data.kpis?.totalCobradoHoy || 0).toLocaleString("es-DO")}
          </p>
        </Link>

        <div
          onClick={() => setMainTab("auditoria")}
          className="cursor-pointer bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-400 transition"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auditoría del Día</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {(data.auditoriaHoy || []).length} <span className="text-xs font-semibold text-slate-400">acciones</span>
          </p>
        </div>
      </div>

      {/* ALERTA DE SOLICITUDES DE PROFESORES */}
      {(data.kpis?.solicitudesPendientes || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-900">
            <span className="material-symbols-outlined text-[20px] text-amber-600">notification_important</span>
            <p className="text-xs sm:text-sm font-semibold">
              Tienes <span className="font-black">{data.kpis.solicitudesPendientes}</span> solicitud(es) de seguimiento enviadas por profesores pendientes de atención.
            </p>
          </div>
          <button
            onClick={() => setMainTab("solicitudes")}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition"
          >
            Ver Solicitudes
          </button>
        </div>
      )}

      {/* TABS PRINCIPALES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: "ausencias", label: `Ausencias (${data.kpis?.totalAusencias || 0})` },
                {
                  id: "solicitudes",
                  label: `Solicitudes Profesores (${data.kpis?.solicitudesPendientes || 0})`,
                  alert: (data.kpis?.solicitudesPendientes || 0) > 0,
                },
                { id: "leads", label: `Interesados / Leads (${(data.leadsRecientes || []).length})` },
                { id: "auditoria", label: `Historial del Día (${(data.auditoriaHoy || []).length})` },
              ] as { id: MainTab; label: string; alert?: boolean }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  mainTab === t.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                {t.alert && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadMetrics}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Cargando mesa de trabajo...</div>
        ) : (
          <>
            {/* TAB 1: AUSENCIAS INBOX ZERO */}
            {mainTab === "ausencias" && (
              <div className="p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "PENDIENTE", label: `Pendientes (${ausCounts.PENDIENTE})` },
                        { id: "WHATSAPP_ENVIADO", label: `WhatsApp (${ausCounts.WHATSAPP_ENVIADO})` },
                        { id: "LLAMADO_REALIZADO", label: `Llamados (${ausCounts.LLAMADO_REALIZADO})` },
                        { id: "JUSTIFICADA", label: `Justificadas (${ausCounts.JUSTIFICADA})` },
                      ] as { id: AusenciaSubTab; label: string }[]
                    ).map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setAusTab(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          ausTab === st.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                    >
                      <option value="TODOS">Todas las áreas</option>
                      <option value="COLEGIO">Colegio</option>
                      <option value="INSTITUTO">Instituto</option>
                      <option value="DEPORTES">Deportes</option>
                    </select>
                    <select
                      value={filterCursoId}
                      onChange={(e) => setFilterCursoId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold max-w-[180px]"
                    >
                      <option value="TODOS">Todos los cursos</option>
                      {(data.cursosCatalogo || []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={ausSearch}
                      onChange={(e) => setAusSearch(e.target.value)}
                      placeholder="Filtrar alumno..."
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>
                </div>

                {/* Barra de acciones masivas */}
                {selectedIds.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold">{selectedIds.length} seleccionado(s)</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleBulkAction("WHATSAPP_ENVIADO")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold"
                      >
                        Marcar WhatsApp
                      </button>
                      <button
                        onClick={() => handleBulkAction("LLAMADO_REALIZADO")}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold"
                      >
                        Marcar Llamado
                      </button>
                      <button
                        onClick={() => handleBulkAction("JUSTIFICADA")}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold"
                      >
                        Justificar
                      </button>
                    </div>
                  </div>
                )}

                {paginatedAusencias.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    No hay ausencias en esta bandeja.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                    <div className="px-4 py-2 bg-slate-50 flex items-center gap-3 text-[11px] font-bold text-slate-500">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedAusencias.length && paginatedAusencias.length > 0}
                        onChange={handleToggleSelectAll}
                      />
                      <span>Seleccionar página ({paginatedAusencias.length})</span>
                    </div>
                    {paginatedAusencias.map((a: any) => {
                      const nombre = `${a.estudiante?.nombres || ""} ${a.estudiante?.apellidos || ""}`.trim();
                      return (
                        <div key={a.id} className="p-3.5 hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedIds.includes(a.id)}
                              onChange={() =>
                                setSelectedIds((prev) =>
                                  prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                                )
                              }
                            />
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-slate-900">{nombre}</p>
                              <p className="text-[11px] text-slate-500">
                                {a.curso?.nombre || "Curso"} · Tutor: {a.estudiante?.tutor_nombre || "N/A"} ({a.estudiante?.tutor_telefono || "N/A"})
                              </p>
                              {(a.observacion || a.observaciones) && (
                                <p className="text-[11px] text-sky-700 mt-0.5">
                                  Nota: {a.observacion || a.observaciones}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => abrirWhatsAppAusencia(a, nombre)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            >
                              WhatsApp
                            </button>
                            <button
                              onClick={() => handleSingleAusencia(a.id, nombre, "LLAMADO_REALIZADO")}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Llamado
                            </button>
                            <button
                              onClick={() => setJustificarCtx({ id: a.id, nombre, nota: "" })}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              Justificar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Página {page} de {totalPages}</span>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LEADS */}
            {mainTab === "leads" && (
              <div className="divide-y divide-slate-100">
                {(data.leadsRecientes || []).length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">No hay interesados registrados.</div>
                ) : (
                  (data.leadsRecientes || []).map((l: any) => (
                    <div key={l.id} className="p-4 hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-900">
                            {l.nombres_aspirante} {l.apellidos_aspirante}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {l.estado || "PENDIENTE"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tel: {l.telefono_tutor} · Interés: {l.curso_solicitado || "General"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleLeadAction(l, "CONTACTADO")}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                        >
                          Contactado
                        </button>
                        <button
                          onClick={() => handleLeadAction(l, "INSCRITO")}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        >
                          Inscrito
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: SOLICITUDES DE PROFESORES */}
            {mainTab === "solicitudes" && (
              <div className="divide-y divide-slate-100">
                {(data.solicitudesDocentes || []).length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    No hay solicitudes de seguimiento enviadas por profesores.
                  </div>
                ) : (
                  (data.solicitudesDocentes || []).map((s: any) => {
                    const pendiente = s.estado === "pendiente";
                    return (
                      <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {s.destinatario_nombre}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                pendiente
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {pendiente ? "Pendiente" : "Atendida"}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {new Date(s.created_at).toLocaleString("es-DO", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600">
                            {s.asunto_o_titulo} · Tel: {s.destinatario_contacto || "Sin teléfono"}
                          </p>
                          <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
                            {s.contenido_preview}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {pendiente ? (
                            <button
                              onClick={() => handleAtenderSolicitud(s)}
                              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                            >
                              Marcar atendida
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              Por {s.responsable || "Recepción"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: AUDITORÍA DEL DÍA */}
            {mainTab === "auditoria" && (
              <div className="divide-y divide-slate-100">
                {(data.auditoriaHoy || []).length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    Aún no hay movimientos registrados hoy.
                  </div>
                ) : (
                  (data.auditoriaHoy || []).map((log: any) => (
                    <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">
                          {log.asunto_o_titulo}{" "}
                          <span className="text-slate-400 font-normal">por {log.responsable}</span>
                        </p>
                        <p className="text-slate-600 mt-0.5">{log.contenido_preview}</p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {new Date(log.created_at).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL NUEVO INTERESADO */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLead}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Nuevo Interesado</h3>
              <button type="button" onClick={() => setLeadModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={leadForm.nombres_aspirante}
                  onChange={(e) => setLeadForm({ ...leadForm, nombres_aspirante: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Apellidos</label>
                <input
                  type="text"
                  value={leadForm.apellidos_aspirante}
                  onChange={(e) => setLeadForm({ ...leadForm, apellidos_aspirante: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono / WhatsApp *</label>
              <input
                type="text"
                required
                value={leadForm.telefono_tutor}
                onChange={(e) => setLeadForm({ ...leadForm, telefono_tutor: e.target.value })}
                placeholder="809-000-0000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Curso de interés</label>
              <select
                value={leadForm.curso_solicitado}
                onChange={(e) => setLeadForm({ ...leadForm, curso_solicitado: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {(data.cursosCatalogo || []).map((c: any) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLeadModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingLead}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-60"
              >
                {savingLead ? "Guardando..." : "Guardar Interesado"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL JUSTIFICAR AUSENCIA */}
      {justificarCtx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Justificar: {justificarCtx.nombre}</h3>
            <input
              type="text"
              value={justificarCtx.nota}
              onChange={(e) => setJustificarCtx({ ...justificarCtx, nota: e.target.value })}
              placeholder="Ej. Padre avisó cita médica..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setJustificarCtx(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const ctx = justificarCtx;
                  setJustificarCtx(null);
                  await handleSingleAusencia(ctx.id, ctx.nombre, "JUSTIFICADA", ctx.nota || "Justificada en recepción");
                }}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
