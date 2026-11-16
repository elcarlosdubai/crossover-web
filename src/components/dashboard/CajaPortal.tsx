"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCajaDashboardData,
  buscarCuentaCaja,
  crearTrimestreYGenerarCuotas,
  aplicarRecargoCargo,
  agregarCargoManual,
  procesarCobroCaja,
  enviarAvisoDeudorWhatsApp,
  getEstadoCajaTurno,
  registrarEgresoCaja,
  guardarCierreCaja,
  getProductosYVentasPOS,
  crearProductoPOS,
  procesarVentaPOS,
  anularReciboCaja,
} from "@/app/actions/caja";

interface CajaPortalProps {
  cajeroNombre?: string;
}

type CajaTab = "cobrar" | "deudores" | "trimestres" | "pos" | "cierre" | "recibos";
type PayMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CHEQUE";
const CASH_DENOMS = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];

export default function CajaPortal({ cajeroNombre = "Caja" }: CajaPortalProps) {
  const [tab, setTab] = useState<CajaTab>("cobrar");
  const [loading, setLoading] = useState(true);
  const [schemaListo, setSchemaListo] = useState(true);
  const [dash, setDash] = useState<any>({
    trimestres: [],
    deudores: [],
    recibos: [],
    cobradoHoy: 0,
    hoyRD: "",
  });

  // Búsqueda y estudiante activo en Caja
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEst, setSelectedEst] = useState<any | null>(null);

  // Selección de cargos y abonos
  const [selectedCargos, setSelectedCargos] = useState<Record<string, number>>({});
  const [manualConcepto, setManualConcepto] = useState("");
  const [manualMonto, setManualMonto] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [notas, setNotas] = useState("");
  const [metodos, setMetodos] = useState<{ metodo: PayMethod; monto: number }[]>([
    { metodo: "EFECTIVO", monto: 0 },
  ]);
  const [processingPay, setProcessingPay] = useState(false);
  const [ultimoRecibo, setUltimoRecibo] = useState<any | null>(null);
  const [efectivoRecibido, setEfectivoRecibido] = useState<string>("");
  const [postCobroModal, setPostCobroModal] = useState<{
    recibo: any;
    devuelta: number;
    telefono?: string;
  } | null>(null);
  const [anularModal, setAnularModal] = useState<{
    id: string;
    numero_recibo: string;
    cliente_nombre: string;
    monto: number;
    motivo: string;
  } | null>(null);
  const [anulando, setAnulando] = useState(false);

  const totalEfectivoCobrar = useMemo(
    () => metodos.filter((m) => m.metodo === "EFECTIVO").reduce((acc, m) => acc + (Number(m.monto) || 0), 0),
    [metodos]
  );
  const devueltaCalculada = useMemo(() => {
    const rec = Number(efectivoRecibido);
    if (!efectivoRecibido || Number.isNaN(rec) || totalEfectivoCobrar <= 0) return 0;
    return rec - totalEfectivoCobrar;
  }, [efectivoRecibido, totalEfectivoCobrar]);

  // Filtro deudores y recibos
  const [deudorSearch, setDeudorSearch] = useState("");
  const [reciboSearch, setReciboSearch] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Modales inline (cero popups nativos)
  const [recargoModal, setRecargoModal] = useState<{ cargoId: string; concepto: string; monto: number } | null>(null);
  const [cargoExtraModal, setCargoExtraModal] = useState(false);
  const [cargoExtraForm, setCargoExtraForm] = useState({
    tipo: "DEUDA_ANTERIOR" as "INSCRIPCION" | "MENSUALIDAD" | "DEUDA_ANTERIOR" | "OTRO",
    concepto: "",
    monto_total: 2500,
  });

  const [termModalOpen, setTermModalOpen] = useState(false);
  const [termForm, setTermForm] = useState({
    codigo: "2026-T4",
    nombre: "Octubre - Diciembre 2026",
    mesesTexto: "Octubre, Noviembre, Diciembre",
    generarCuotasActivos: true,
    tarifaFallback: 2500,
  });
  const [savingTerm, setSavingTerm] = useState(false);

  // Estados POS Libros & Productos
  const [posData, setPosData] = useState<{ productos: any[]; ventas: any[] }>({ productos: [], ventas: [] });
  const [posCart, setPosCart] = useState<{ producto_id: string; nombre: string; cantidad: number; precio_unitario: number }[]>([]);
  const [posCliente, setPosCliente] = useState("Cliente Mostrador");
  const [posMetodo, setPosMetodo] = useState<PayMethod>("EFECTIVO");
  const [posProcessing, setPosProcessing] = useState(false);
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodForm, setProdForm] = useState({
    nombre: "",
    categoria: "LIBRO" as "LIBRO" | "UNIFORME" | "MATERIAL" | "OTRO",
    precio: 650,
    stock: 20,
  });

  // Estados Pre-Cuadre, Egresos y Cierre
  const [turnoData, setTurnoData] = useState<any>({
    resumen: {
      cantidadRecibos: 0,
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      cheque: 0,
      totalGeneral: 0,
      totalMensualidades: 0,
      totalPOS: 0,
      totalEgresos: 0,
      efectivoEsperado: 0,
    },
    egresos: [],
    cierres: [],
  });
  const [billetes, setBilletes] = useState<Record<string, number>>({});
  const [cierreNotas, setCierreNotas] = useState("");
  const [closingShift, setClosingShift] = useState(false);
  const [egresoForm, setEgresoForm] = useState({ concepto: "", monto: 0 });
  const [savingEgreso, setSavingEgreso] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" | "info"; waUrl?: string }[]>([]);
  const showToast = (msg: string, type: "success" | "error" | "info" = "success", waUrl?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type, waUrl }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const loadDashboard = async () => {
    setLoading(true);
    const [data, posRes, turnoRes] = await Promise.all([
      getCajaDashboardData(),
      getProductosYVentasPOS(),
      getEstadoCajaTurno(),
    ]);
    setSchemaListo(data.schemaListo);
    setDash(data);
    setPosData({ productos: posRes.productos || [], ventas: posRes.ventas || [] });
    setTurnoData(turnoRes);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Búsqueda reactiva de estudiante / familia
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await buscarCuentaCaja(q);
      setSearchResults(res);
      setSearching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectStudentForCash = (est: any) => {
    setSelectedEst(est);
    setSearchResults([]);
    setUltimoRecibo(null);
    const pendientes = (est.cargos || []).filter((c: any) => c.estado !== "PAGADO" && c.saldo > 0);
    const initMap: Record<string, number> = {};
    if (pendientes.length > 0) {
      initMap[pendientes[0].id] = pendientes[0].saldo;
    }
    setSelectedCargos(initMap);
    const totalInit = Object.values(initMap).reduce((a, b) => a + b, 0);
    setMetodos([{ metodo: "EFECTIVO", monto: totalInit }]);
    setDescuento(0);
    setManualConcepto("");
    setManualMonto(0);
    setNotas("");
  };

  const refreshSelectedStudent = async (estId: string, queryHint: string) => {
    const res = await buscarCuentaCaja(queryHint);
    const found = res.find((x: any) => x.id === estId);
    if (found) {
      selectStudentForCash(found);
    }
  };

  const totalCargosSeleccionados = useMemo(() => {
    return Object.values(selectedCargos).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [selectedCargos]);

  const totalNetoAPagar = useMemo(() => {
    const base = totalCargosSeleccionados > 0 ? totalCargosSeleccionados : Number(manualMonto) || 0;
    return Math.max(0, base - (Number(descuento) || 0));
  }, [totalCargosSeleccionados, manualMonto, descuento]);

  const totalMetodosIngresado = useMemo(() => {
    return metodos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  }, [metodos]);

  // Sincronizar primer método automáticamente cuando solo hay 1 método activo
  useEffect(() => {
    if (metodos.length === 1) {
      setMetodos([{ ...metodos[0], monto: totalNetoAPagar }]);
    }
  }, [totalNetoAPagar]);

  const toggleCargo = (cargo: any) => {
    setSelectedCargos((prev) => {
      const next = { ...prev };
      if (next[cargo.id] !== undefined) {
        delete next[cargo.id];
      } else {
        next[cargo.id] = cargo.saldo;
      }
      return next;
    });
  };

  const handleCobrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEst && !manualConcepto.trim()) {
      showToast("Busca un estudiante o escribe un concepto manual.", "error");
      return;
    }
    if (totalMetodosIngresado <= 0) {
      showToast("El monto a cobrar debe ser mayor a RD$ 0.", "error");
      return;
    }

    const cargosAplicar = Object.entries(selectedCargos)
      .filter(([, m]) => Number(m) > 0)
      .map(([cargo_id, monto_aplicar]) => ({ cargo_id, monto_aplicar: Number(monto_aplicar) }));

    setProcessingPay(true);
    const res = await procesarCobroCaja({
      estudiante_id: selectedEst?.id || null,
      cliente_nombre: selectedEst
        ? `${selectedEst.nombres} ${selectedEst.apellidos}`.trim()
        : manualConcepto.trim(),
      cliente_telefono: selectedEst?.tutor_telefono || "",
      concepto_manual: manualConcepto,
      cargos_aplicar: cargosAplicar,
      descuento,
      metodos,
      cajero_nombre: cajeroNombre,
      notas,
    });
    setProcessingPay(false);

    if (res.success && res.recibo) {
      const devueltaFinal = totalEfectivoCobrar > 0 && Number(efectivoRecibido) > totalEfectivoCobrar
        ? Number(efectivoRecibido) - totalEfectivoCobrar
        : 0;
      setUltimoRecibo(res.recibo);
      setPostCobroModal({
        recibo: res.recibo,
        devuelta: devueltaFinal,
        telefono: selectedEst?.tutor_telefono || "",
      });
      setEfectivoRecibido("");
      showToast(`Cobro registrado: ${res.recibo.numero_recibo}`, "success");
      await loadDashboard();
      if (selectedEst) {
        await refreshSelectedStudent(selectedEst.id, selectedEst.matricula || selectedEst.nombres);
      }
    } else {
      showToast(res.error || "Error procesando cobro", "error");
    }
  };

  const handleAplicarRecargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recargoModal || recargoModal.monto <= 0) return;
    const res = await aplicarRecargoCargo(recargoModal.cargoId, recargoModal.monto);
    if (res.success) {
      showToast("Recargo aplicado a la cuota.", "success");
      const estId = selectedEst?.id;
      const hint = selectedEst?.matricula || selectedEst?.nombres || "";
      setRecargoModal(null);
      await loadDashboard();
      if (estId) await refreshSelectedStudent(estId, hint);
    } else {
      showToast(res.error || "Error aplicando recargo", "error");
    }
  };

  const handleAgregarCargoExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEst || !cargoExtraForm.concepto.trim() || cargoExtraForm.monto_total <= 0) {
      showToast("Completa concepto y monto.", "error");
      return;
    }
    const res = await agregarCargoManual({
      estudiante_id: selectedEst.id,
      curso_id: selectedEst.curso?.id || null,
      ...cargoExtraForm,
    });
    if (res.success) {
      showToast("Cargo agregado a la cuenta.", "success");
      setCargoExtraModal(false);
      setCargoExtraForm({ tipo: "DEUDA_ANTERIOR", concepto: "", monto_total: 2500 });
      await loadDashboard();
      await refreshSelectedStudent(selectedEst.id, selectedEst.matricula || selectedEst.nombres);
    } else {
      showToast(res.error || "No se pudo agregar el cargo", "error");
    }
  };

  const handleCrearTrimestre = async (e: React.FormEvent) => {
    e.preventDefault();
    const meses = termForm.mesesTexto
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!termForm.codigo.trim() || !termForm.nombre.trim() || meses.length === 0) {
      showToast("Completa código, nombre y al menos un mes.", "error");
      return;
    }
    setSavingTerm(true);
    const res: any = await crearTrimestreYGenerarCuotas({
      codigo: termForm.codigo,
      nombre: termForm.nombre,
      meses,
      generarCuotasActivos: termForm.generarCuotasActivos,
      tarifaFallback: termForm.tarifaFallback,
    });
    setSavingTerm(false);

    if (res.success) {
      showToast(
        `Trimestre creado${res.cargosCreados ? ` (${res.cargosCreados} cuotas generadas)` : ""}.`,
        "success"
      );
      setTermModalOpen(false);
      await loadDashboard();
    } else {
      showToast(res.error || "Error creando trimestre", "error");
    }
  };

  const handleEnviarWhatsAppDeudor = async (d: any) => {
    const res: any = await enviarAvisoDeudorWhatsApp({
      estudiante_nombre: d.nombre,
      tutor_nombre: d.tutor_nombre,
      telefono: d.tutor_telefono,
      total_adeudado: d.total_adeudado,
      cajero_nombre: cajeroNombre,
    });

    if (res.success) {
      showToast(
        res.encoladoBot
          ? `Aviso encolado en Bot 24/7 para ${d.nombre}.`
          : `Aviso listo para enviar manualmente por WhatsApp Web.`,
        "success",
        res.waUrl
      );
    } else {
      showToast(res.error || "Error preparando aviso WhatsApp", "error");
    }
  };

  const handleCobrarDeudorDirecto = async (d: any) => {
    setTab("cobrar");
    setSearchQuery(d.matricula || d.nombre);
    await refreshSelectedStudent(d.estudiante_id, d.matricula || d.nombre);
  };

  const copyReceiptLink = (token: string) => {
    const url = `${window.location.origin}/recibo/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2200);
  };

  const deudoresFiltrados = useMemo(() => {
    const q = deudorSearch.toLowerCase().trim();
    if (!q) return dash.deudores || [];
    return (dash.deudores || []).filter((d: any) =>
      `${d.nombre} ${d.matricula} ${d.curso} ${d.tutor_nombre} ${d.tutor_telefono}`.toLowerCase().includes(q)
    );
  }, [dash.deudores, deudorSearch]);

  const recibosFiltrados = useMemo(() => {
    const q = reciboSearch.toLowerCase().trim();
    if (!q) return dash.recibos || [];
    return (dash.recibos || []).filter((r: any) =>
      `${r.numero_recibo} ${r.cliente_nombre} ${r.concepto}`.toLowerCase().includes(q)
    );
  }, [dash.recibos, reciboSearch]);

  const totalCarteraMora = useMemo(() => {
    return (dash.deudores || []).reduce((acc: number, d: any) => acc + (Number(d.total_adeudado) || 0), 0);
  }, [dash.deudores]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* TOASTS */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl shadow-xl text-xs font-bold border space-y-1.5 ${
                t.type === "error"
                  ? "bg-rose-600 text-white border-rose-700"
                  : "bg-slate-900 text-white border-slate-800"
              }`}
            >
              <p>{t.msg}</p>
              {t.waUrl && (
                <a
                  href={t.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px]"
                >
                  Abrir WhatsApp Web →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HEADER + KPIS */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
            Caja Operativa RD · {dash.hoyRD || "Hoy"}
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Caja, Cuotas & Morosidad</h1>
          <p className="text-xs text-gray-500">Cajero activo: <strong className="text-gray-800">{cajeroNombre}</strong></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <p className="text-[10px] font-bold uppercase text-emerald-700">Cobrado Hoy</p>
            <p className="text-lg font-black text-emerald-900">RD$ {Number(dash.cobradoHoy || 0).toLocaleString("es-DO")}</p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <p className="text-[10px] font-bold uppercase text-rose-700">Por Cobrar</p>
            <p className="text-lg font-black text-rose-900">RD$ {totalCarteraMora.toLocaleString("es-DO")}</p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-[10px] font-bold uppercase text-gray-500">Deudores</p>
            <p className="text-lg font-black text-gray-900">{(dash.deudores || []).length}</p>
          </div>
        </div>
      </div>

      {!schemaListo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
          <strong>Aviso:</strong> Ejecuta <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">migration_caja_administracion.sql</code> en el SQL Editor de Supabase para habilitar cuotas por trimestre, recargos y deudores.
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: "cobrar", label: "Cobrar en Caja" },
                { id: "deudores", label: `Deudores (${(dash.deudores || []).length})` },
                { id: "trimestres", label: `Trimestres / Módulos (${(dash.trimestres || []).length})` },
                { id: "pos", label: "POS Libros" },
                { id: "cierre", label: "Pre-Cuadre & Cierre" },
                { id: "recibos", label: `Recibos (${(dash.recibos || []).length})` },
              ] as { id: CajaTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  tab === t.id ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            Actualizar
          </button>
        </div>

        {/* TAB 1: COBRAR */}
        {tab === "cobrar" && (
          <div className="p-4 sm:p-5 space-y-5">
            {/* Buscador rápido */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar estudiante por nombre, matrícula o teléfono del tutor..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#990000]"
              />
              {searching && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                  Buscando...
                </span>
              )}

              {searchResults.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {searchResults.map((est) => {
                    const deuda = (est.cargos || []).reduce((acc: number, c: any) => acc + (c.saldo || 0), 0);
                    return (
                      <button
                        key={est.id}
                        type="button"
                        onClick={() => selectStudentForCash(est)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900">
                            {est.nombres} {est.apellidos}{" "}
                            <span className="font-mono text-[11px] text-gray-400">({est.matricula})</span>
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {est.curso?.nombre || "Sin curso"} · Tutor: {est.tutor_nombre || "N/D"} ({est.tutor_telefono || "N/D"})
                          </p>
                        </div>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          deuda > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {deuda > 0 ? `Debe RD$ ${deuda.toLocaleString("es-DO")}` : "Al día"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {ultimoRecibo && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-emerald-900">
                    Recibo emitido: {ultimoRecibo.numero_recibo} · RD$ {Number(ultimoRecibo.monto).toLocaleString("es-DO")}
                  </p>
                  <p className="text-[11px] text-emerald-800">{ultimoRecibo.concepto}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyReceiptLink(ultimoRecibo.token)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold cursor-pointer"
                  >
                    {copiedToken === ultimoRecibo.token ? "Enlace copiado" : "Copiar enlace"}
                  </button>
                  <Link
                    href={`/recibo/${ultimoRecibo.token}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold"
                  >
                    Ver / Imprimir Recibo
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleCobrar} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Columna Izquierda: Cuotas del estudiante */}
              <div className="lg:col-span-7 space-y-4">
                {selectedEst ? (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-gray-900">
                          {selectedEst.nombres} {selectedEst.apellidos}
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          {selectedEst.matricula} · {selectedEst.curso?.nombre || "Curso"} · Tel: {selectedEst.tutor_telefono || "N/D"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCargoExtraModal(true)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-xs font-bold text-gray-800 cursor-pointer"
                      >
                        + Agregar Cargo / Deuda
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {(selectedEst.cargos || []).filter((c: any) => c.estado !== "PAGADO" && c.saldo > 0).length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-500">
                          Este estudiante no tiene cuotas pendientes registradas. Puedes hacer un cobro manual a la derecha o agregar un cargo.
                        </div>
                      ) : (
                        (selectedEst.cargos || [])
                          .filter((c: any) => c.estado !== "PAGADO" && c.saldo > 0)
                          .map((c: any) => {
                            const checked = selectedCargos[c.id] !== undefined;
                            return (
                              <div key={c.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <label className="flex items-start gap-3 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={checked}
                                    onChange={() => toggleCargo(c)}
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-gray-900">{c.concepto}</p>
                                    <p className="text-[11px] text-gray-500">
                                      Base: RD$ {Number(c.monto_total).toLocaleString("es-DO")}
                                      {Number(c.recargo) > 0 && (
                                        <span className="text-rose-600 font-bold"> + Recargo RD$ {Number(c.recargo).toLocaleString("es-DO")}</span>
                                      )}
                                      {Number(c.monto_pagado) > 0 && (
                                        <span className="text-emerald-700"> · Abonado: RD$ {Number(c.monto_pagado).toLocaleString("es-DO")}</span>
                                      )}
                                    </p>
                                  </div>
                                </label>

                                <div className="flex items-center gap-2 shrink-0">
                                  {checked && (
                                    <input
                                      type="number"
                                      min={1}
                                      max={c.saldo}
                                      value={selectedCargos[c.id]}
                                      onChange={(e) =>
                                        setSelectedCargos((prev) => ({
                                          ...prev,
                                          [c.id]: Math.min(c.saldo, Math.max(0, Number(e.target.value))),
                                        }))
                                      }
                                      className="w-24 px-2.5 py-1.5 text-xs font-bold border border-gray-300 rounded-lg text-right"
                                      title="Monto o abono a aplicar"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setRecargoModal({ cargoId: c.id, concepto: c.concepto, monto: 200 })}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold cursor-pointer"
                                  >
                                    + Recargo
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
                    Busca y selecciona un estudiante arriba para ver sus cuotas, recargos y abonos, o ingresa un cobro directo a la derecha.
                  </div>
                )}
              </div>

              {/* Columna Derecha: Resumen y Métodos combinados */}
              <div className="lg:col-span-5 bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3.5 h-fit">
                <h4 className="text-sm font-black text-gray-900">Resumen de Cobro</h4>

                {totalCargosSeleccionados === 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Concepto / Cliente</label>
                      <input
                        type="text"
                        value={manualConcepto}
                        onChange={(e) => setManualConcepto(e.target.value)}
                        placeholder="Ej: Mensualidad / Examen"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Monto (RD$)</label>
                      <input
                        type="number"
                        min={0}
                        value={manualMonto}
                        onChange={(e) => setManualMonto(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Descuento (RD$)</label>
                    <input
                      type="number"
                      min={0}
                      value={descuento}
                      onChange={(e) => setDescuento(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Neto a Pagar</span>
                    <span className="text-base font-black text-gray-900">
                      RD$ {totalNetoAPagar.toLocaleString("es-DO")}
                    </span>
                  </div>
                </div>

                {/* Métodos de pago combinados */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600">Métodos de Pago</label>
                    <button
                      type="button"
                      onClick={() => setMetodos((prev) => [...prev, { metodo: "TRANSFERENCIA", monto: 0 }])}
                      className="text-[11px] font-bold text-[#990000] hover:underline cursor-pointer"
                    >
                      + Combinar método
                    </button>
                  </div>
                  {metodos.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={m.metodo}
                        onChange={(e) =>
                          setMetodos((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, metodo: e.target.value as PayMethod } : x))
                          )
                        }
                        className="flex-1 px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white font-semibold"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="TARJETA">Tarjeta</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={m.monto}
                        onChange={(e) =>
                          setMetodos((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, monto: Number(e.target.value) } : x))
                          )
                        }
                        className="w-28 px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold text-right"
                      />
                      {metodos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMetodos((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 text-xs font-bold px-1.5"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {totalEfectivoCobrar > 0 && (
                  <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-gray-700">Efectivo recibido (Devuelta)</label>
                      <div className="flex items-center gap-1">
                        {[totalEfectivoCobrar, 500, 1000, 2000].map((val, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEfectivoRecibido(String(val))}
                            className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-700 cursor-pointer"
                          >
                            {i === 0 ? "Exacto" : val.toLocaleString("es-DO")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="number"
                        min={0}
                        placeholder="Paga con RD$"
                        value={efectivoRecibido}
                        onChange={(e) => setEfectivoRecibido(e.target.value)}
                        className="w-36 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg font-bold"
                      />
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Devuelta</span>
                        <span
                          className={`text-sm font-black ${
                            !efectivoRecibido
                              ? "text-gray-400"
                              : devueltaCalculada >= 0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {!efectivoRecibido
                            ? "RD$ 0"
                            : devueltaCalculada >= 0
                            ? `RD$ ${devueltaCalculada.toLocaleString("es-DO")}`
                            : `Faltan RD$ ${Math.abs(devueltaCalculada).toLocaleString("es-DO")}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Notas (opcional)</label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ref. transferencia / observación"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processingPay}
                  className="w-full py-3 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {processingPay
                    ? "Emitiendo recibo..."
                    : `Confirmar Cobro (RD$ ${totalMetodosIngresado.toLocaleString("es-DO")})`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: DEUDORES */}
        {tab === "deudores" && (
          <div className="p-4 sm:p-5 space-y-4">
            <input
              type="text"
              value={deudorSearch}
              onChange={(e) => setDeudorSearch(e.target.value)}
              placeholder="Filtrar deudor por nombre, matrícula, curso o teléfono..."
              className="w-full sm:w-96 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3.5 text-xs"
            />

            {deudoresFiltrados.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-500">
                No hay estudiantes con cuotas vencidas o pendientes.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                {deudoresFiltrados.map((d: any) => (
                  <div key={d.estudiante_id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">
                        {d.nombre} <span className="font-mono text-[11px] text-gray-400">({d.matricula})</span>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {d.curso} · {d.cuotas_pendientes} cuota(s) pendiente(s) · Tel: {d.tutor_telefono || "N/D"}
                        {d.total_recargos > 0 && (
                          <span className="text-rose-600 font-bold"> · Incluye RD$ {d.total_recargos.toLocaleString("es-DO")} de recargo</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-rose-700 mr-2">
                        RD$ {Number(d.total_adeudado).toLocaleString("es-DO")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEnviarWhatsAppDeudor(d)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCobrarDeudorDirecto(d)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold cursor-pointer"
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRIMESTRES / MÓDULOS */}
        {tab === "trimestres" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-600">
                Genera las cuotas mensuales/modulares para todos los estudiantes activos de un ciclo.
              </p>
              <button
                type="button"
                onClick={() => setTermModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-bold cursor-pointer"
              >
                + Nuevo Trimestre / Generar Cuotas
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(dash.trimestres || []).length === 0 ? (
                <div className="col-span-full py-10 text-center text-xs text-gray-500">
                  Aún no hay trimestres registrados.
                </div>
              ) : (
                (dash.trimestres || []).map((t: any) => (
                  <div key={t.id} className="border border-gray-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-[#990000]">{t.codigo}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        t.activo ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {t.activo ? "Activo" : "Cerrado"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{t.nombre}</h4>
                    <p className="text-[11px] text-gray-500">
                      Meses: {Array.isArray(t.meses) ? t.meses.join(", ") : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RECIBOS */}
        {tab === "recibos" && (
          <div className="p-4 sm:p-5 space-y-4">
            <input
              type="text"
              value={reciboSearch}
              onChange={(e) => setReciboSearch(e.target.value)}
              placeholder="Buscar recibo por número, estudiante o concepto..."
              className="w-full sm:w-96 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3.5 text-xs"
            />

            {loading ? (
              <div className="py-10 text-center text-xs text-gray-500">Cargando recibos...</div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-black uppercase text-gray-500">
                      <th className="py-3 px-4">Recibo</th>
                      <th className="py-3 px-4">Cliente / Estudiante</th>
                      <th className="py-3 px-4">Concepto</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4 text-right">Monto</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recibosFiltrados.map((r: any) => (
                      <tr key={r.id} className={`hover:bg-gray-50/70 ${String(r.notas || "").includes("[ANULADO") ? "opacity-60 bg-rose-50/30" : ""}`}>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          {r.numero_recibo}
                          {String(r.notas || "").includes("[ANULADO") && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-black uppercase">
                              Anulado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{r.cliente_nombre}</td>
                        <td className="py-3 px-4 text-gray-600">{r.concepto}</td>
                        <td className="py-3 px-4 text-gray-600">{r.metodo_pago}</td>
                        <td className="py-3 px-4 text-right font-black text-gray-900">
                          RD$ {Number(r.monto).toLocaleString("es-DO")}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => copyReceiptLink(r.token)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] cursor-pointer"
                          >
                            {copiedToken === r.token ? "Copiado" : "Link"}
                          </button>
                          <Link
                            href={`/recibo/${r.token}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded-lg bg-gray-900 text-white font-bold text-[11px]"
                          >
                            Ver
                          </Link>
                          {!String(r.notas || "").includes("[ANULADO") && (
                            <button
                              type="button"
                              onClick={() =>
                                setAnularModal({
                                  id: r.id,
                                  numero_recibo: r.numero_recibo,
                                  cliente_nombre: r.cliente_nombre,
                                  monto: Number(r.monto || 0),
                                  motivo: "",
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] cursor-pointer"
                            >
                              Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: POS LIBROS & PRODUCTOS (SEPARADO DE MENSUALIDADES) */}
        {tab === "pos" && (
          <div className="p-4 sm:p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-600">
                Venta de libros, uniformes y materiales (reporte separado de las mensualidades académicas).
              </p>
              <button
                type="button"
                onClick={() => setProdModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold cursor-pointer"
              >
                + Nuevo Producto / Libro
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
                {(posData.productos || []).length === 0 ? (
                  <div className="col-span-full border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
                    No hay productos en el catálogo POS. Agrega libros o uniformes arriba.
                  </div>
                ) : (
                  (posData.productos || []).map((p: any) => (
                    <div key={p.id} className="border border-gray-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400">{p.categoria}</span>
                        <p className="text-xs font-bold text-gray-900">{p.nombre}</p>
                        <p className="text-xs font-black text-[#990000] mt-0.5">
                          RD$ {Number(p.precio).toLocaleString("es-DO")} ·{" "}
                          <span className="text-gray-500 font-normal">Stock: {p.stock}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={p.stock <= 0}
                        onClick={() =>
                          setPosCart((prev) => {
                            const ex = prev.find((i) => i.producto_id === p.id);
                            if (ex) {
                              return prev.map((i) =>
                                i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
                              );
                            }
                            return [...prev, { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: Number(p.precio) }];
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        + Agregar
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="lg:col-span-5 bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 h-fit">
                <h4 className="text-sm font-black text-gray-900">Carrito Mostrador POS</h4>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={posCliente}
                    onChange={(e) => setPosCliente(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>
                <div className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-xl">
                  {posCart.length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-400">Carrito vacío</p>
                  ) : (
                    posCart.map((it) => (
                      <div key={it.producto_id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{it.cantidad}x {it.nombre}</p>
                          <p className="text-[11px] text-gray-500">RD$ {(it.cantidad * it.precio_unitario).toLocaleString("es-DO")}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPosCart((prev) => prev.filter((x) => x.producto_id !== it.producto_id))}
                          className="text-rose-600 font-bold px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Método de Pago</label>
                  <select
                    value={posMetodo}
                    onChange={(e) => setPosMetodo(e.target.value as PayMethod)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={posProcessing || posCart.length === 0}
                  onClick={async () => {
                    setPosProcessing(true);
                    const res: any = await procesarVentaPOS({
                      cliente_nombre: posCliente,
                      metodo_pago: posMetodo,
                      cajero_nombre: cajeroNombre,
                      items: posCart,
                    });
                    setPosProcessing(false);
                    if (res.success) {
                      setUltimoRecibo(res.recibo);
                      setPostCobroModal({ recibo: res.recibo, devuelta: 0, telefono: "" });
                      setPosCart([]);
                      showToast(`Venta POS emitida: ${res.recibo.numero_recibo}`, "success");
                      await loadDashboard();
                    } else {
                      showToast(res.error || "Error en venta POS", "error");
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-black disabled:opacity-50 cursor-pointer"
                >
                  {posProcessing
                    ? "Procesando..."
                    : `Cobrar POS (RD$ ${posCart.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0).toLocaleString("es-DO")})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PRE-CUADRE, EGRESOS Y CIERRE DE CAJA */}
        {tab === "cierre" && (
          <div className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] font-bold uppercase text-gray-500">Efectivo Sistema</p>
                <p className="text-base font-black text-gray-900">RD$ {Number(turnoData.resumen?.efectivo || 0).toLocaleString("es-DO")}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] font-bold uppercase text-gray-500">Transf. / Tarjeta / Cheque</p>
                <p className="text-base font-black text-gray-900">
                  RD$ {Number((turnoData.resumen?.transferencia || 0) + (turnoData.resumen?.tarjeta || 0) + (turnoData.resumen?.cheque || 0)).toLocaleString("es-DO")}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <p className="text-[10px] font-bold uppercase text-blue-700">Mensualidades vs POS</p>
                <p className="text-xs font-black text-blue-900 mt-0.5">
                  Cuotas: RD$ {Number(turnoData.resumen?.totalMensualidades || 0).toLocaleString("es-DO")}
                  <br />
                  POS: RD$ {Number(turnoData.resumen?.totalPOS || 0).toLocaleString("es-DO")}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] font-bold uppercase text-emerald-700">Esperado en Gaveta</p>
                <p className="text-base font-black text-emerald-900">RD$ {Number(turnoData.resumen?.efectivoEsperado || 0).toLocaleString("es-DO")}</p>
                <p className="text-[10px] text-rose-600 font-semibold">Egresos: -RD$ {Number(turnoData.resumen?.totalEgresos || 0).toLocaleString("es-DO")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Conteo físico de billetes */}
              <div className="lg:col-span-7 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-900">Conteo Físico de Billetes y Monedas</h4>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Imprimir Pre-Cuadre
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CASH_DENOMS.map((den) => (
                    <div key={den} className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                      <label className="block text-[10px] font-black text-gray-500">RD$ {den}</label>
                      <input
                        type="number"
                        min={0}
                        value={billetes[String(den)] || 0}
                        onChange={(e) =>
                          setBilletes((prev) => ({ ...prev, [String(den)]: Math.max(0, Number(e.target.value)) }))
                        }
                        className="w-full mt-1 px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg bg-white text-right"
                      />
                    </div>
                  ))}
                </div>

                {(() => {
                  const contado = CASH_DENOMS.reduce((acc, d) => acc + d * (Number(billetes[String(d)]) || 0), 0);
                  const diff = contado - Number(turnoData.resumen?.efectivoEsperado || 0);
                  return (
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs">
                        <span className="font-bold text-gray-600">Contado: </span>
                        <span className="font-black text-gray-900">RD$ {contado.toLocaleString("es-DO")}</span>
                        <span className={`ml-3 font-black ${diff === 0 ? "text-emerald-700" : diff > 0 ? "text-blue-700" : "text-rose-700"}`}>
                          Diferencia: {diff >= 0 ? "+" : ""}RD$ {diff.toLocaleString("es-DO")}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={closingShift}
                        onClick={async () => {
                          setClosingShift(true);
                          const res = await guardarCierreCaja({
                            cajero_nombre: cajeroNombre,
                            efectivo_contado: contado,
                            conteo_billetes: billetes,
                            notas: cierreNotas,
                          });
                          setClosingShift(false);
                          if (res.success) {
                            setBilletes({});
                            setCierreNotas("");
                            showToast("Cierre de caja guardado. Nuevo turno inicia en RD$ 0.", "success");
                            await loadDashboard();
                          } else {
                            showToast(res.error || "Error al cerrar caja", "error");
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-black cursor-pointer disabled:opacity-50"
                      >
                        {closingShift ? "Cerrando..." : "Cerrar Turno de Caja"}
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Registrar Egreso + Últimos cierres */}
              <div className="lg:col-span-5 space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!egresoForm.concepto.trim() || egresoForm.monto <= 0) return;
                    setSavingEgreso(true);
                    const res = await registrarEgresoCaja({ ...egresoForm, cajero_nombre: cajeroNombre });
                    setSavingEgreso(false);
                    if (res.success) {
                      setEgresoForm({ concepto: "", monto: 0 });
                      showToast("Salida de caja registrada.", "success");
                      await loadDashboard();
                    } else {
                      showToast(res.error || "Error registrando egreso", "error");
                    }
                  }}
                  className="border border-gray-200 rounded-2xl p-4 space-y-2.5 bg-gray-50"
                >
                  <h4 className="text-xs font-black uppercase text-gray-700">Registrar Salida / Egreso</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Concepto (ej: Compra agua)"
                      value={egresoForm.concepto}
                      onChange={(e) => setEgresoForm({ ...egresoForm, concepto: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="RD$"
                      value={egresoForm.monto || ""}
                      onChange={(e) => setEgresoForm({ ...egresoForm, monto: Number(e.target.value) })}
                      className="w-24 px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingEgreso}
                    className="w-full py-2 rounded-xl bg-gray-900 text-white text-xs font-bold cursor-pointer"
                  >
                    {savingEgreso ? "Guardando..." : "Registrar Egreso"}
                  </button>
                </form>

                <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-500">Historial de Cierres</h4>
                  {(turnoData.cierres || []).length === 0 ? (
                    <p className="text-xs text-gray-400">Sin cierres registrados aún.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto text-xs">
                      {(turnoData.cierres || []).map((c: any) => (
                        <div key={c.id} className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{c.fecha_operativa} · {c.cajero_nombre}</p>
                            <p className="text-[11px] text-gray-500">
                              Contado: RD$ {Number(c.efectivo_contado).toLocaleString("es-DO")}
                            </p>
                          </div>
                          <span className={`font-black ${Number(c.diferencia) === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                            Dif: RD$ {Number(c.diferencia).toLocaleString("es-DO")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL NUEVO PRODUCTO POS */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await crearProductoPOS(prodForm);
              if (res.success) {
                setProdModalOpen(false);
                setProdForm({ nombre: "", categoria: "LIBRO", precio: 650, stock: 20 });
                showToast("Producto agregado al catálogo POS.", "success");
                await loadDashboard();
              } else {
                showToast(res.error || "Error guardando producto", "error");
              }
            }}
            className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-2xl"
          >
            <h3 className="text-sm font-black text-gray-900">Nuevo Producto / Libro POS</h3>
            <input
              type="text"
              required
              placeholder="Nombre (ej: Libro Ingles Nivel 1)"
              value={prodForm.nombre}
              onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={prodForm.categoria}
                onChange={(e) => setProdForm({ ...prodForm, categoria: e.target.value as any })}
                className="px-2 py-2 text-xs border border-gray-200 rounded-xl bg-white"
              >
                <option value="LIBRO">Libro</option>
                <option value="UNIFORME">Uniforme</option>
                <option value="MATERIAL">Material</option>
                <option value="OTRO">Otro</option>
              </select>
              <input
                type="number"
                min={1}
                required
                placeholder="Precio"
                value={prodForm.precio}
                onChange={(e) => setProdForm({ ...prodForm, precio: Number(e.target.value) })}
                className="px-2.5 py-2 text-xs border border-gray-200 rounded-xl font-bold"
              />
              <input
                type="number"
                min={0}
                required
                placeholder="Stock"
                value={prodForm.stock}
                onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                className="px-2.5 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setProdModalOpen(false)} className="px-3.5 py-2 text-xs font-bold text-gray-600">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold">
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL APLICAR RECARGO */}
      {recargoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAplicarRecargo} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-2xl">
            <h3 className="text-sm font-black text-gray-900">Aplicar Recargo por Mora</h3>
            <p className="text-xs text-gray-500">{recargoModal.concepto}</p>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Monto de Recargo (RD$)</label>
              <input
                type="number"
                min={1}
                required
                value={recargoModal.monto}
                onChange={(e) => setRecargoModal({ ...recargoModal, monto: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setRecargoModal(null)} className="px-3.5 py-2 text-xs font-bold text-gray-600">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">
                Aplicar Recargo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CARGO EXTRA */}
      {cargoExtraModal && selectedEst && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAgregarCargoExtra} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-2xl">
            <h3 className="text-sm font-black text-gray-900">Agregar Cargo a {selectedEst.nombres}</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Tipo</label>
              <select
                value={cargoExtraForm.tipo}
                onChange={(e) => setCargoExtraForm({ ...cargoExtraForm, tipo: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
              >
                <option value="DEUDA_ANTERIOR">Deuda Anterior</option>
                <option value="MENSUALIDAD">Mensualidad / Módulo</option>
                <option value="INSCRIPCION">Inscripción</option>
                <option value="OTRO">Otro Cargo</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Concepto *</label>
              <input
                type="text"
                required
                placeholder="Ej: Saldo pendiente Septiembre"
                value={cargoExtraForm.concepto}
                onChange={(e) => setCargoExtraForm({ ...cargoExtraForm, concepto: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Monto (RD$) *</label>
              <input
                type="number"
                min={1}
                required
                value={cargoExtraForm.monto_total}
                onChange={(e) => setCargoExtraForm({ ...cargoExtraForm, monto_total: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setCargoExtraModal(false)} className="px-3.5 py-2 text-xs font-bold text-gray-600">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#990000] text-white text-xs font-bold">
                Guardar Cargo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NUEVO TRIMESTRE */}
      {termModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCrearTrimestre} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">Nuevo Trimestre / Ciclo</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Código *</label>
                <input
                  type="text"
                  required
                  value={termForm.codigo}
                  onChange={(e) => setTermForm({ ...termForm, codigo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Tarifa base (RD$)</label>
                <input
                  type="number"
                  min={0}
                  value={termForm.tarifaFallback}
                  onChange={(e) => setTermForm({ ...termForm, tarifaFallback: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={termForm.nombre}
                onChange={(e) => setTermForm({ ...termForm, nombre: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Meses / Módulos (separados por coma) *</label>
              <input
                type="text"
                required
                value={termForm.mesesTexto}
                onChange={(e) => setTermForm({ ...termForm, mesesTexto: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={termForm.generarCuotasActivos}
                onChange={(e) => setTermForm({ ...termForm, generarCuotasActivos: e.target.checked })}
              />
              Generar cuotas automáticamente para todos los estudiantes activos
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTermModalOpen(false)} className="px-3.5 py-2 text-xs font-bold text-gray-600">
                Cancelar
              </button>
              <button type="submit" disabled={savingTerm} className="px-4 py-2 rounded-xl bg-[#990000] text-white text-xs font-bold">
                {savingTerm ? "Generando..." : "Crear Trimestre"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BARRA FIJA INFERIOR EN MÓVIL PARA COBRO RÁPIDO */}
      {tab === "cobrar" && totalMetodosIngresado > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Total a Cobrar</span>
            <span className="text-base font-black text-gray-900">
              RD$ {totalMetodosIngresado.toLocaleString("es-DO")}
            </span>
          </div>
          <button
            type="button"
            disabled={processingPay}
            onClick={(e) => handleCobrar(e as unknown as React.FormEvent)}
            className="px-5 py-2.5 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-black shadow-sm disabled:opacity-50"
          >
            {processingPay ? "Emitiendo..." : "Confirmar Cobro"}
          </button>
        </div>
      )}

      {/* MODAL POST-COBRO (TICKET + WHATSAPP + DEVUELTA) */}
      {postCobroModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase">
                Pago Confirmado
              </span>
              <h3 className="text-xl font-black text-gray-900 font-mono">
                {postCobroModal.recibo.numero_recibo}
              </h3>
              <p className="text-xs text-gray-600">{postCobroModal.recibo.cliente_nombre}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Concepto:</span>
                <span className="font-bold text-gray-900 text-right max-w-[65%] truncate">
                  {postCobroModal.recibo.concepto}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto Cobrado:</span>
                <span className="font-black text-gray-900">
                  RD$ {Number(postCobroModal.recibo.monto || 0).toLocaleString("es-DO")}
                </span>
              </div>
              {postCobroModal.devuelta > 0 && (
                <div className="flex justify-between pt-1.5 border-t border-gray-200 text-emerald-700">
                  <span className="font-bold">Devuelta a entregar:</span>
                  <span className="text-base font-black">
                    RD$ {postCobroModal.devuelta.toLocaleString("es-DO")}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => window.open(`/recibo/${postCobroModal.recibo.token}`, "_blank", "noopener,noreferrer")}
                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black cursor-pointer"
              >
                Imprimir Ticket 80mm
              </button>
              <button
                type="button"
                onClick={() => {
                  const rawTel = String(postCobroModal.telefono || "").replace(/\D/g, "");
                  const urlRecibo = `${window.location.origin}/recibo/${postCobroModal.recibo.token}`;
                  const msg = `Hola, gracias por su pago en Centro Educativo Crossover. Recibo ${postCobroModal.recibo.numero_recibo} por RD$ ${Number(postCobroModal.recibo.monto || 0).toLocaleString("es-DO")}. Puede ver su comprobante aquí: ${urlRecibo}`;
                  if (rawTel.length >= 10) {
                    const telIntl = rawTel.length === 10 ? `1${rawTel}` : rawTel;
                    window.open(`https://wa.me/${telIntl}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
                  } else {
                    copyReceiptLink(postCobroModal.recibo.token);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
              >
                {postCobroModal.telefono ? "Enviar por WhatsApp" : "Copiar Enlace"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPostCobroModal(null);
                setSelectedEst(null);
                setSelectedCargos({});
                setManualConcepto("");
                setManualMonto(0);
                setDescuento(0);
                setNotas("");
              }}
              className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold cursor-pointer"
            >
              Listo / Siguiente Cliente
            </button>
          </div>
        </div>
      )}

      {/* MODAL ANULAR RECIBO */}
      {anularModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAnulando(true);
              const res = await anularReciboCaja({
                reciboId: anularModal.id,
                motivo: anularModal.motivo,
              });
              setAnulando(false);
              if (res.success) {
                showToast(`Recibo ${anularModal.numero_recibo} anulado y cargos revertidos.`, "success");
                setAnularModal(null);
                await loadDashboard();
              } else {
                showToast(res.error || "No se pudo anular el recibo", "error");
              }
            }}
            className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-2xl"
          >
            <h3 className="text-sm font-black text-rose-700">Anular Recibo {anularModal.numero_recibo}</h3>
            <p className="text-xs text-gray-600">
              Cliente: <strong>{anularModal.cliente_nombre}</strong> · RD$ {anularModal.monto.toLocaleString("es-DO")}.
              Esta acción deja el recibo en RD$ 0, revierte las cuotas pagadas y registra auditoría.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Motivo obligatorio *</label>
              <input
                type="text"
                required
                minLength={4}
                placeholder="Ej: Error en monto / método de pago"
                value={anularModal.motivo}
                onChange={(e) => setAnularModal({ ...anularModal, motivo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAnularModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={anulando}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {anulando ? "Anulando..." : "Confirmar Anulación"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
