"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  getComunicaciones,
  actualizarAlarmaCompleta,
  registrarComunicacion,
  deleteComunicacion,
  getPlantillasConfig,
  guardarPlantillaConfig,
  ComunicacionRecord,
  PlantillaConfig,
} from "@/app/actions/comunicaciones";
import BroadcastDripAdmin from "@/app/admin/dashboard/broadcast/page";

const PLANTILLAS_INICIALES: PlantillaConfig[] = [
  {
    id: "wa-inscripcion",
    canal: "whatsapp",
    nombre: "Pre-Inscripción Cursos Técnicos",
    categoria: "Admisiones",
    cuerpo: `¡Hola {{nombre}}! 🎓 Bienvenido a Centro Educativo Crossover.\n\nHemos registrado exitosamente tu pre-inscripción para *{{curso}}* en horario *{{horario}}*.\n\n📍 *Sede Principal:* Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD.\n\nPara garantizar tu plaza y asignarte fecha de inicio, por favor respóndenos confirmando tu disponibilidad. ¡Estamos para servirte!`
  },
  {
    id: "wa-colegio",
    canal: "whatsapp",
    nombre: "Admisiones & Visita Guiada Colegio",
    categoria: "Colegio",
    cuerpo: `Estimada familia de {{nombre}} 🏫, un cordial saludo de Centro Educativo Crossover.\n\nHemos recibido con agrado su solicitud de admisión para *{{curso}}*.\n\nSerá un placer recibirles en nuestras instalaciones para mostrarles el campus, presentarles al cuerpo docente y detallarles el plan de estudios. ¿Qué día les resultaría más conveniente para coordinar su visita guiada?`
  },
  {
    id: "email-confirmacion",
    canal: "email",
    nombre: "Comprobante de Registro & Ficha Oficial",
    categoria: "Confirmaciones",
    asunto: "Confirmación de Solicitud de Ingreso — Centro Educativo Crossover",
    cuerpo: `Estimado(a) {{nombre}},\n\nHemos registrado formalmente tu solicitud de admisión para el programa {{curso}} en el horario {{horario}}.\n\nTu expediente provisional ha sido generado con éxito. Nuestro equipo de coordinación académica revisará tu documentación y se pondrá en contacto para formalizar tu proceso y entrega de credenciales estudiantiles.\n\nSi deseas acelerar tu registro, puedes responder directamente a este correo o coordinar vía WhatsApp oficial.`,
    boton_cta: "Confirmar Cupo vía WhatsApp",
    url_cta: "https://wa.me/18099220880"
  },
  {
    id: "wa-seguimiento",
    canal: "whatsapp",
    nombre: "Seguimiento 24h & Cierre de Cupo",
    categoria: "Seguimiento",
    cuerpo: `Hola {{nombre}}, un saludo del equipo de Admisiones Crossover 🌟.\n\nNotamos que tienes un cupo apartado en *{{curso}}*. Queremos recordarte que nuestros grupos tienen cupos limitados por aula técnica para garantizar la atención personalizada. ¿Tienes alguna pregunta sobre los requisitos o facilidades de pago?`
  },
  {
    id: "email-recordatorio",
    canal: "email",
    nombre: "Recordatorio de Pago & Inicio de Clases",
    categoria: "Académico",
    asunto: "Aviso Importante: Próximo Inicio de Docencia — Crossover",
    cuerpo: `Estimado(a) {{nombre}},\n\nTe informamos que las clases de {{curso}} iniciarán formalmente en el horario acordado ({{horario}}).\n\nPor favor asegúrate de tener completado tu registro administrativo en caja o vía transferencia antes del inicio para habilitar tu acceso al aula y material didáctico.`,
    boton_cta: "Contactar a Caja / Soporte",
    url_cta: "https://wa.me/18099220880"
  }
];

export default function CentroDeMandoComunicaciones() {
  const [alarmas, setAlarmas] = useState<ComunicacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Pestaña Maestra: 3 Estados de Flujo Operativo + Avisos Masivos + Centro de Plantillas
  const [estadoTab, setEstadoTab] = useState<"pendiente" | "fallido" | "completado" | "broadcast" | "templates">("pendiente");

  // Filtros Secundarios
  const [canalFiltro, setCanalFiltro] = useState<"todos" | "whatsapp" | "email" | "llamada">("todos");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "inscripcion" | "seguimiento" | "pago" | "recordatorio">("todos");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(15);

  // Gestión de Plantillas Persistentes
  const [templates, setTemplates] = useState<PlantillaConfig[]>(PLANTILLAS_INICIALES);
  const [editingTemplate, setEditingTemplate] = useState<PlantillaConfig>(PLANTILLAS_INICIALES[0]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [guardandoTemplate, setGuardandoTemplate] = useState(false);
  const [feedbackTemplate, setFeedbackTemplate] = useState<string | null>(null);

  // Estado del Bot de WhatsApp (Baileys)
  const [waModalOpen, setWaModalOpen] = useState(false);
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

  // Modal para Crear Nueva Alarma / Recordatorio
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoContacto, setNuevoContacto] = useState("");
  const [nuevoCanal, setNuevoCanal] = useState<"whatsapp" | "email" | "llamada">("whatsapp");
  const [nuevoTipo, setNuevoTipo] = useState<"inscripcion" | "seguimiento" | "pago" | "recordatorio">("seguimiento");
  const [nuevaFecha, setNuevaFecha] = useState(() => new Date().toISOString().slice(0, 16));
  const [nuevoDetalle, setNuevoDetalle] = useState("");
  const [creando, setCreando] = useState(false);

  // Modal para Gestionar / Resolver / Reagendar LLAMADA
  const [gestionarItem, setGestionarItem] = useState<ComunicacionRecord | null>(null);
  const [resultadoLlamada, setResultadoLlamada] = useState<"contesto" | "no_contesto" | "ocupado" | "reagendado">("contesto");
  const [notaGestion, setNotaGestion] = useState("");
  const [fechaReagendada, setFechaReagendada] = useState("");
  const [guardandoGestion, setGuardandoGestion] = useState(false);

  // Modal para Cambiar Fecha / Reagendar cualquier alarma
  const [reagendarItem, setReagendarItem] = useState<ComunicacionRecord | null>(null);
  const [fechaEdicion, setFechaEdicion] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);

  // Mensaje de prueba rápido para verificar conexión de WhatsApp
  const [telefonoTest, setTelefonoTest] = useState("");
  const [enviandoTest, setEnviandoTest] = useState(false);
  const [resultadoTest, setResultadoTest] = useState<{ ok: boolean; msg: string } | null>(null);

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
    if (!confirm("¿Deseas desconectar el bot de WhatsApp? Tendrás que escanear el QR nuevamente.")) return;
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

  const handleEnviarMensajePrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefonoTest.trim()) {
      alert("Por favor ingresa un número de teléfono.");
      return;
    }
    setEnviandoTest(true);
    setResultadoTest(null);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_message",
          telefono: telefonoTest.trim(),
          mensaje: "🚀 ¡Conexión exitosa! Este es un mensaje de prueba oficial desde el Centro de Mando Crossover.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultadoTest({ ok: true, msg: "¡Mensaje de prueba entregado con éxito!" });
      } else {
        setResultadoTest({ ok: false, msg: data.error || "No se pudo entregar el mensaje." });
      }
    } catch (err: any) {
      setResultadoTest({ ok: false, msg: err.message || "Error en la solicitud." });
    } finally {
      setEnviandoTest(false);
    }
  };

  // Carga inicial
  const cargarDatos = async () => {
    setLoading(true);
    const [dataAlarmas, dataTemplates] = await Promise.all([
      getComunicaciones(),
      getPlantillasConfig(),
    ]);
    setAlarmas(dataAlarmas);
    if (dataTemplates && dataTemplates.length > 0) {
      setTemplates(dataTemplates);
      setEditingTemplate(dataTemplates[0]);
    }
    consultarEstadoWhatsApp();
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Sondeo periódico cuando el modal de QR está abierto
  useEffect(() => {
    if (!waModalOpen) return;
    handleConectarWhatsApp();
    const interval = setInterval(consultarEstadoWhatsApp, 2500);
    return () => clearInterval(interval);
  }, [waModalOpen]);

  useEffect(() => {
    setPaginaActual(1);
  }, [search, canalFiltro, tipoFiltro, estadoTab, itemsPorPagina]);

  // Conteos ejecutivos para pastillas
  const conteos = useMemo(() => {
    const pendientes = alarmas.filter((a) => a.estado === "pendiente").length;
    const fallidos = alarmas.filter((a) => a.estado === "fallido").length;
    const completados = alarmas.filter((a) =>
      ["enviado", "contesto", "no_contesto", "ocupado"].includes(a.estado)
    ).length;
    return { pendientes, fallidos, completados };
  }, [alarmas]);

  // Filtrado de la tabla
  const alarmasFiltradas = useMemo(() => {
    return alarmas.filter((item) => {
      // Estado Maestro
      if (estadoTab === "pendiente" && item.estado !== "pendiente") return false;
      if (estadoTab === "fallido" && item.estado !== "fallido") return false;
      if (
        estadoTab === "completado" &&
        !["enviado", "contesto", "no_contesto", "ocupado"].includes(item.estado)
      )
        return false;

      // Canal
      if (canalFiltro !== "todos" && item.canal !== canalFiltro) return false;

      // Tipo de disparador
      if (tipoFiltro !== "todos" && item.tipo_evento !== tipoFiltro) return false;

      // Buscador
      if (search.trim()) {
        const query = search.toLowerCase();
        const nombre = (item.destinatario_nombre || "").toLowerCase();
        const contacto = (item.destinatario_contacto || "").toLowerCase();
        const asunto = (item.asunto_o_titulo || "").toLowerCase();
        const preview = (item.contenido_preview || "").toLowerCase();
        if (
          !nombre.includes(query) &&
          !contacto.includes(query) &&
          !asunto.includes(query) &&
          !preview.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [alarmas, estadoTab, canalFiltro, tipoFiltro, search]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(alarmasFiltradas.length / itemsPorPagina));
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const alarmasPaginadas = alarmasFiltradas.slice(indiceInicio, indiceFin);

  // Crear nueva alarma
  const handleCrearAlarma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoContacto.trim()) {
      alert("Por favor indica el nombre del cliente y su contacto.");
      return;
    }

    setCreando(true);
    const res = await registrarComunicacion({
      canal: nuevoCanal,
      tipo_evento: nuevoTipo,
      destinatario_nombre: nuevoNombre.trim(),
      destinatario_contacto: nuevoContacto.trim(),
      asunto_o_titulo:
        nuevoCanal === "email"
          ? `Notificación: ${nuevoTipo}`
          : `Alarma programada (${nuevoCanal})`,
      contenido_preview: nuevoDetalle.trim() || "Seguimiento agendado desde Centro de Mando",
      estado: "pendiente",
      motivo_error: null,
      responsable: "Administrador",
      created_at: new Date(nuevaFecha).toISOString(),
    });

    if (res.success && res.data) {
      setAlarmas((prev) => [res.data as ComunicacionRecord, ...prev]);
      setModalOpen(false);
      setNuevoNombre("");
      setNuevoContacto("");
      setNuevoDetalle("");
    } else {
      alert("Error al crear alarma: " + res.error);
    }
    setCreando(false);
  };

  // Guardar Gestión de LLAMADA
  const handleGuardarGestionLlamada = async () => {
    if (!gestionarItem) return;
    if (!notaGestion.trim()) {
      alert("Por favor escribe una nota sobre el resultado de la llamada.");
      return;
    }

    setGuardandoGestion(true);
    const nuevoEstado = resultadoLlamada === "reagendado" ? "pendiente" : resultadoLlamada;
    const nuevaFechaISO =
      resultadoLlamada === "reagendado" && fechaReagendada
        ? new Date(fechaReagendada).toISOString()
        : gestionarItem.created_at;

    const notaFinal = `[${resultadoLlamada.toUpperCase()}] ${notaGestion.trim()}`;

    const res = await actualizarAlarmaCompleta(gestionarItem.id, {
      estado: nuevoEstado,
      contenido_preview: notaFinal,
      created_at: nuevaFechaISO,
      responsable: "Administrador / Recepción",
    });

    if (res.success) {
      setAlarmas((prev) =>
        prev.map((a) =>
          a.id === gestionarItem.id
            ? {
                ...a,
                estado: nuevoEstado as any,
                contenido_preview: notaFinal,
                created_at: nuevaFechaISO,
              }
            : a
        )
      );
      setGestionarItem(null);
      setNotaGestion("");
    } else {
      alert("Error al actualizar llamada: " + res.error);
    }
    setGuardandoGestion(false);
  };

  // Guardar Cambio de Fecha Rápido
  const handleGuardarFecha = async () => {
    if (!reagendarItem || !fechaEdicion) return;
    setGuardandoFecha(true);
    const nuevaFechaISO = new Date(fechaEdicion).toISOString();

    const res = await actualizarAlarmaCompleta(reagendarItem.id, {
      created_at: nuevaFechaISO,
      estado: "pendiente",
    });

    if (res.success) {
      setAlarmas((prev) =>
        prev.map((a) =>
          a.id === reagendarItem.id
            ? { ...a, created_at: nuevaFechaISO, estado: "pendiente" }
            : a
        )
      );
      setReagendarItem(null);
    } else {
      alert("Error al reprogramar fecha: " + res.error);
    }
    setGuardandoFecha(false);
  };

  // Marcar como resuelto / completado
  const handleMarcarEnviado = async (item: ComunicacionRecord) => {
    const res = await actualizarAlarmaCompleta(item.id, {
      estado: "enviado",
      motivo_error: null,
    });
    if (res.success) {
      setAlarmas((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, estado: "enviado" } : a))
      );
    }
  };

  // Eliminar alarma
  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la alarma para "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await deleteComunicacion(id);
    if (res.success) {
      setAlarmas((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Error al eliminar: " + res.error);
    }
  };

  // Guardar plantilla activa persistente
  const handleGuardarTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoTemplate(true);
    setFeedbackTemplate(null);

    const res = await guardarPlantillaConfig(editingTemplate);
    if (res.success) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
      );
      setFeedbackTemplate("✓ Plantilla guardada exitosamente en la nube");
      setTimeout(() => setFeedbackTemplate(null), 3500);
    } else {
      alert("Error al guardar la plantilla: " + res.error);
    }
    setGuardandoTemplate(false);
  };

  // Insertar variable dinámica en cursor
  const insertarTag = (tag: string) => {
    setEditingTemplate((prev) => ({
      ...prev,
      cuerpo: prev.cuerpo + ` ${tag} `,
    }));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ================= HEADER PRINCIPAL 2026 SAAS FLOW ================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#111827] to-[#1a0507] border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Glow ambient background accents */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Centro de Mando
            </h1>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* BOTÓN CONEXIÓN WHATSAPP BAILEYS (Estilo 2026 con logo SVG oficial) */}
          <button
            onClick={() => setWaModalOpen(true)}
            className={`group px-3.5 py-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
              waStatus.status === "connected"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 shadow-emerald-950/40"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {/* SVG Oficial WhatsApp */}
            <svg
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                waStatus.status === "connected" ? "text-emerald-400 fill-current" : "text-slate-400 fill-current group-hover:text-emerald-400"
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span className="tracking-wide">
              {waStatus.status === "connected"
                ? `WhatsApp (+${waStatus.phoneNumber})`
                : "WhatsApp"}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                waStatus.status === "connected"
                  ? "bg-emerald-400 animate-pulse"
                  : waStatus.status === "connecting" || waStatus.status === "qr_ready"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-slate-500"
              }`}
            ></span>
          </button>

          {/* BOTÓN SYNC ESTILO SAAS */}
          <button
            onClick={cargarDatos}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
            title="Sincronizar datos"
          >
            <span className="material-symbols-outlined text-[18px] block">sync</span>
          </button>

          {/* BOTÓN NUEVA TAREA (Icono moderno add_task con gradiente y glow) */}
          <button
            onClick={() => setModalOpen(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-[#990000] to-[#b30000] hover:from-[#a60000] hover:to-[#c40000] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 hover:shadow-red-900/60 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px] transition-transform group-hover:rotate-90 duration-300">
              add_task
            </span>
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* ================= SELECTOR MAESTRO DE PESTAÑAS ================= */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setEstadoTab("pendiente")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            estadoTab === "pendiente"
              ? "bg-[#990000] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="material-symbols-outlined text-base">schedule</span>
          <span>Pendientes</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              estadoTab === "pendiente" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}
          >
            {conteos.pendientes}
          </span>
        </button>

        <button
          onClick={() => setEstadoTab("fallido")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            estadoTab === "fallido"
              ? "bg-red-600 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="material-symbols-outlined text-base">error</span>
          <span>Fallidos</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              estadoTab === "fallido" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
            }`}
          >
            {conteos.fallidos}
          </span>
        </button>

        <button
          onClick={() => setEstadoTab("completado")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            estadoTab === "completado"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Completados</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              estadoTab === "completado"
                ? "bg-white/20 text-white"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {conteos.completados}
          </span>
        </button>

        <button
          onClick={() => setEstadoTab("broadcast")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            estadoTab === "broadcast"
              ? "bg-[#990000] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="material-symbols-outlined text-base">campaign</span>
          <span>Avisos Masivos</span>
        </button>

        <div className="h-4 w-px bg-gray-200 mx-1"></div>

        <button
          onClick={() => setEstadoTab("templates")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            estadoTab === "templates"
              ? "bg-gray-900 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="material-symbols-outlined text-base">palette</span>
          <span>Plantillas</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">
            {templates.length}
          </span>
        </button>
      </div>

      {/* ================= VISTA 1, 2, 3: TABLA DE ALARMAS ================= */}
      {estadoTab !== "templates" && estadoTab !== "broadcast" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* BARRA DE FILTROS SECUNDARIOS */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* CANAL */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: "todos", label: "Todos Canales", icon: "all_inbox" },
                { id: "whatsapp", label: "WhatsApp", icon: "chat" },
                { id: "email", label: "Email", icon: "mail" },
                { id: "llamada", label: "Llamada", icon: "call" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCanalFiltro(c.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    canalFiltro === c.id
                      ? "bg-gray-900 text-white shadow-2xs"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* TIPO + BUSCADOR */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#990000] cursor-pointer"
              >
                <option value="todos">Todos los Disparadores</option>
                <option value="inscripcion">Pre-Inscripción</option>
                <option value="seguimiento">Follow-up / Seguimiento</option>
                <option value="pago">Aviso de Pago</option>
                <option value="recordatorio">Recordatorio Clases</option>
              </select>

              <div className="relative flex-1 md:w-56">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar estudiante..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none focus:border-[#990000]"
                />
              </div>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE ALARMAS */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200/70 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Estudiante / Prospecto</th>
                    <th className="py-3 px-4">Disparador / Tipo</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Fecha Programada</th>
                    <th className="py-3 px-4">Nota de Llamada</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        <span className="material-symbols-outlined text-3xl text-[#990000] animate-spin block mb-2">
                          progress_activity
                        </span>
                        Cargando alarmas del sistema...
                      </td>
                    </tr>
                  ) : alarmasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        <span className="material-symbols-outlined text-3xl mb-1 text-gray-300 block">
                          done_all
                        </span>
                        No hay alarmas en este estado con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    alarmasPaginadas.map((item) => {
                      const phoneDigits = item.destinatario_contacto.replace(/\D/g, "");
                      const whatsappUrl = `https://wa.me/1${phoneDigits}?text=${encodeURIComponent(
                        item.contenido_preview || ""
                      )}`;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* CLIENTE */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900 leading-tight">
                              {item.destinatario_nombre}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                              {item.destinatario_contacto}
                            </p>
                          </td>

                          {/* DISPARADOR */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-block bg-gray-100 text-gray-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                              {item.tipo_evento}
                            </span>
                          </td>

                          {/* CANAL */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.canal === "whatsapp" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-200/60">
                                <span className="material-symbols-outlined text-[13px]">chat</span> WhatsApp
                              </span>
                            ) : item.canal === "email" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-200/60">
                                <span className="material-symbols-outlined text-[13px]">mail</span> Email
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-black text-[10px] border border-amber-200/60">
                                <span className="material-symbols-outlined text-[13px]">call</span> Llamada
                              </span>
                            )}
                          </td>

                          {/* FECHA CON BOTÓN REAGENDAR */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-800 text-xs">
                                {new Date(item.created_at).toLocaleDateString("es-DO", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <button
                                onClick={() => {
                                  setReagendarItem(item);
                                  const localISO = new Date(
                                    new Date(item.created_at).getTime() -
                                      new Date().getTimezoneOffset() * 60000
                                  )
                                    .toISOString()
                                    .slice(0, 16);
                                  setFechaEdicion(localISO);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-[#990000] hover:bg-red-50 transition-colors cursor-pointer"
                                title="Cambiar fecha / Reagendar"
                              >
                                <span className="material-symbols-outlined text-sm">edit_calendar</span>
                              </button>
                            </div>
                          </td>

                          {/* NOTA EXCLUSIVA PARA LLAMADAS */}
                          <td className="py-3.5 px-4 max-w-xs">
                            {item.canal === "llamada" ? (
                              <div>
                                <p
                                  className="text-[11px] text-gray-900 font-semibold leading-snug line-clamp-2"
                                  title={item.contenido_preview || ""}
                                >
                                  {item.contenido_preview || "Sin nota de llamada"}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Por: {item.responsable || "Recepción"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-300 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* ESTADO */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.estado === "pendiente" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Pendiente
                              </span>
                            ) : item.estado === "fallido" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                                <span className="material-symbols-outlined text-[11px]">error</span>
                                Fallido
                              </span>
                            ) : item.estado === "contesto" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Contestó
                              </span>
                            ) : item.estado === "no_contesto" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md">
                                No contestó
                              </span>
                            ) : item.estado === "ocupado" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
                                Ocupado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Enviado / Listo
                              </span>
                            )}
                          </td>

                          {/* ACCIONES */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* LLAMADA */}
                              {item.canal === "llamada" && (
                                <button
                                  onClick={() => {
                                    setGestionarItem(item);
                                    setResultadoLlamada("contesto");
                                    setNotaGestion(item.contenido_preview || "");
                                    setFechaReagendada(new Date().toISOString().slice(0, 16));
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Gestionar llamada"
                                >
                                  <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                                  <span>Gestionar</span>
                                </button>
                              )}

                              {/* WHATSAPP */}
                              {item.canal === "whatsapp" && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleMarcarEnviado(item)}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Disparar por WhatsApp"
                                >
                                  <span className="material-symbols-outlined text-sm">send</span>
                                  <span>Enviar</span>
                                </a>
                              )}

                              {/* EMAIL */}
                              {item.canal === "email" && item.estado === "pendiente" && (
                                <button
                                  onClick={() => handleMarcarEnviado(item)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Marcar enviado"
                                >
                                  <span className="material-symbols-outlined text-sm">done</span>
                                  <span>Listo</span>
                                </button>
                              )}

                              {/* ELIMINAR */}
                              <button
                                onClick={() => handleEliminar(item.id, item.destinatario_nombre)}
                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar alarma"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div className="p-3.5 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-3">
                <p>
                  Mostrando{" "}
                  <strong>{alarmasFiltradas.length === 0 ? 0 : indiceInicio + 1}</strong> a{" "}
                  <strong>{Math.min(indiceFin, alarmasFiltradas.length)}</strong> de{" "}
                  <strong>{alarmasFiltradas.length}</strong> alarmas
                </p>

                <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
                  <span className="text-[11px] text-gray-400">Ver:</span>
                  <select
                    value={itemsPorPagina}
                    onChange={(e) => setItemsPorPagina(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded-md py-0.5 px-2 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          paginaActual === num
                            ? "bg-[#990000] text-white shadow-xs"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA 4: EDITOR DE PLANTILLAS DE ALTO NIVEL ================= */}
      {estadoTab === "templates" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUMNA IZQUIERDA: LISTADO DE PLANTILLAS Y METRICS */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Catálogo de Plantillas
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">
                    {templates.length} registradas
                  </span>
                </div>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const isSelected = editingTemplate.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => setEditingTemplate(tpl)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-50/80 border-red-200 shadow-2xs"
                            : "bg-gray-50/60 border-gray-200/70 hover:bg-gray-100/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            {tpl.categoria}
                          </span>
                          {tpl.canal === "whatsapp" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              <span className="material-symbols-outlined text-xs">chat</span> WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                              <span className="material-symbols-outlined text-xs">mail</span> Email
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isSelected ? "text-[#990000]" : "text-gray-900"
                          }`}
                        >
                          {tpl.nombre}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PALETA DE VARIABLES SMART INSERT */}
              <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/40 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold flex items-center gap-1 text-xs">
                    <span className="material-symbols-outlined text-sm text-amber-700">smart_toy</span>
                    Variables Dinámicas
                  </p>
                  <span className="text-[10px] text-amber-700 font-semibold">Clic para insertar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: "{{nombre}}", desc: "Nombre del alumno" },
                    { tag: "{{curso}}", desc: "Nombre del curso" },
                    { tag: "{{horario}}", desc: "Tanda seleccionada" },
                    { tag: "{{fecha}}", desc: "Fecha de inicio" },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertarTag(v.tag)}
                      className="px-2 py-1 bg-white hover:bg-amber-100/60 border border-amber-300/80 rounded-lg font-mono text-[11px] font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer"
                      title={v.desc}
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Las variables se sustituyen automáticamente antes del envío con los datos del aspirante.
                </p>
              </div>
            </div>

            {/* COLUMNA DERECHA: EDITOR Y SIMULADOR SAAS */}
            <div className="lg:col-span-8 space-y-4">
              {/* CAJA DE EDICIÓN */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Editando Plantilla
                    </span>
                    <h3 className="text-sm font-black text-gray-900">{editingTemplate.nombre}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {feedbackTemplate && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {feedbackTemplate}
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleGuardarTemplate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Nombre de la Plantilla
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.nombre}
                        onChange={(e) =>
                          setEditingTemplate({ ...editingTemplate, nombre: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Categoría
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.categoria}
                        onChange={(e) =>
                          setEditingTemplate({ ...editingTemplate, categoria: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                      />
                    </div>
                  </div>

                  {editingTemplate.canal === "email" && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Asunto del Correo Electrónico
                        </label>
                        <input
                          type="text"
                          value={editingTemplate.asunto || ""}
                          onChange={(e) =>
                            setEditingTemplate({ ...editingTemplate, asunto: e.target.value })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Texto del Botón CTA
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.boton_cta || ""}
                            onChange={(e) =>
                              setEditingTemplate({ ...editingTemplate, boton_cta: e.target.value })
                            }
                            placeholder="Ej: Confirmar Cupo vía WhatsApp"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Enlace / Destino del Botón
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.url_cta || ""}
                            onChange={(e) =>
                              setEditingTemplate({ ...editingTemplate, url_cta: e.target.value })
                            }
                            placeholder="https://wa.me/18099220880"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Cuerpo del Mensaje ({editingTemplate.canal.toUpperCase()})
                    </label>
                    <textarea
                      rows={6}
                      value={editingTemplate.cuerpo}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, cuerpo: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white font-mono leading-relaxed resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={guardandoTemplate}
                      className="bg-[#990000] hover:bg-[#800000] disabled:opacity-50 text-white py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">cloud_done</span>
                      <span>
                        {guardandoTemplate ? "Guardando en Base de Datos..." : "Guardar Cambios de Plantilla"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SIMULADOR EN VIVO HIGH-END */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-gray-500">devices</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      Vista Previa en Vivo ({editingTemplate.canal.toUpperCase()})
                    </span>
                  </div>

                  {editingTemplate.canal === "email" && (
                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setPreviewMode("desktop")}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                          previewMode === "desktop" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        onClick={() => setPreviewMode("mobile")}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                          previewMode === "mobile" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                        }`}
                      >
                        Móvil
                      </button>
                    </div>
                  )}
                </div>

                {/* SIMULADOR WHATSAPP */}
                {editingTemplate.canal === "whatsapp" && (
                  <div className="max-w-sm mx-auto bg-[#efeae2] border border-gray-300 rounded-3xl p-4 shadow-inner space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-300/60">
                      <div className="w-9 h-9 rounded-full bg-[#990000] text-white flex items-center justify-center font-black text-sm shadow-xs">
                        C
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-black text-gray-900 leading-tight">Crossover Oficial</p>
                          <span className="material-symbols-outlined text-xs text-blue-500 fill-1">
                            verified
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 font-semibold">Cuenta Comercial Verificada</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs space-y-2 border border-gray-200/50">
                      <p className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {editingTemplate.cuerpo
                          .replace("{{nombre}}", "Armando González")
                          .replace("{{curso}}", "Inglés Adultos")
                          .replace("{{horario}}", "Sábados 1:00 PM - 4:00 PM")
                          .replace("{{fecha}}", "15 de Noviembre")}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                        <span>14:30</span>
                        <span className="material-symbols-outlined text-xs text-blue-500">done_all</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULADOR EMAIL RESPONSIVO */}
                {editingTemplate.canal === "email" && (
                  <div
                    className={`mx-auto border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-[#f4f5f7] transition-all ${
                      previewMode === "mobile" ? "max-w-xs" : "max-w-xl"
                    }`}
                  >
                    {/* ENCABEZADO CLIENTE DE CORREO */}
                    <div className="bg-white p-3.5 border-b border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>
                          De: <strong className="text-gray-900">Centro Educativo Crossover</strong> &lt;admisiones@crossover.edu.do&gt;
                        </span>
                        <span className="text-[10px]">Hoy, 10:45 AM</span>
                      </div>
                      <p className="text-xs font-black text-gray-900 truncate">
                        Asunto: {editingTemplate.asunto || "Notificación Académica"}
                      </p>
                    </div>

                    {/* CUERPO HTML DEL EMAIL DE ALTO NIVEL */}
                    <div className="p-4 sm:p-6 bg-white m-3 sm:m-4 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
                      {/* BANNER INSTITUCIONAL */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#990000] text-white flex items-center justify-center font-black text-sm">
                            C
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-tight">
                              Centro Educativo Crossover
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              Formación Técnica & Admisiones
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#990000] bg-red-50 px-2 py-0.5 rounded-md">
                          Oficial
                        </span>
                      </div>

                      {/* TEXTO PRINCIPAL */}
                      <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed space-y-2">
                        {editingTemplate.cuerpo
                          .replace("{{nombre}}", "Armando González")
                          .replace("{{curso}}", "Inglés Adultos")
                          .replace("{{horario}}", "Sábados 1:00 PM - 4:00 PM")
                          .replace("{{fecha}}", "15 de Noviembre")}
                      </div>

                      {/* FICHA RESUMEN / KEY-VALUE CARD */}
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/70 space-y-1.5 text-xs">
                        <div className="flex justify-between py-0.5 border-b border-gray-200/50">
                          <span className="text-gray-500 font-medium text-[11px]">Programa:</span>
                          <strong className="text-gray-900 text-[11px]">Inglés Adultos</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-gray-200/50">
                          <span className="text-gray-500 font-medium text-[11px]">Tanda / Horario:</span>
                          <strong className="text-gray-900 text-[11px]">Sábados 1:00 PM - 4:00 PM</strong>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-500 font-medium text-[11px]">Sede:</span>
                          <strong className="text-gray-900 text-[11px]">Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD</strong>
                        </div>
                      </div>

                      {/* BOTÓN CTA */}
                      {editingTemplate.boton_cta && (
                        <div className="text-center pt-2">
                          <a
                            href={editingTemplate.url_cta || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-[#990000] hover:bg-[#800000] text-white font-black text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
                          >
                            {editingTemplate.boton_cta}
                          </a>
                        </div>
                      )}

                      {/* PIE INSTITUCIONAL / LEGAL / RNC */}
                      <div className="pt-4 border-t border-gray-100 text-center space-y-1 text-[10px] text-gray-400">
                        <p className="font-semibold text-gray-600">
                          Centro Educativo Crossover • RNC 131-XXXXX-X
                        </p>
                        <p>Av. Las Palmas #58, Herrera, Santo Domingo Oeste, RD</p>
                        <p>Tel: (809) 922-0880 • admisiones@crossover.edu.do</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA: AVISOS MASIVOS (BROADCAST INTEGRADO) ================= */}
      {estadoTab === "broadcast" && (
        <div className="animate-in fade-in duration-150">
          <BroadcastDripAdmin />
        </div>
      )}

      {/* ================= MODAL 1: GESTIONAR LLAMADA ================= */}
      {gestionarItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                  Gestión Telefónica
                </span>
                <h3 className="text-base font-black text-gray-900">
                  {gestionarItem.destinatario_nombre}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {gestionarItem.destinatario_contacto}
                </p>
              </div>
              <button
                onClick={() => setGestionarItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Resultado de la Llamada
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "contesto", label: "Contestó", icon: "call" },
                    { id: "no_contesto", label: "No Contestó", icon: "phone_missed" },
                    { id: "ocupado", label: "Ocupado / Buzón", icon: "phone_disabled" },
                    { id: "reagendado", label: "Reagendar", icon: "edit_calendar" },
                  ].map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setResultadoLlamada(res.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        resultadoLlamada === res.id
                          ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{res.icon}</span>
                      <span>{res.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {resultadoLlamada === "reagendado" && (
                <div className="animate-in fade-in">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nueva Fecha y Hora de Llamada
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaReagendada}
                    onChange={(e) => setFechaReagendada(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nota / Resumen de la Conversación
                </label>
                <textarea
                  rows={3}
                  value={notaGestion}
                  onChange={(e) => setNotaGestion(e.target.value)}
                  placeholder="Ej: Interesado en Inglés Sabatino, vendrá a pagar el viernes..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#990000]"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGestionarItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarGestionLlamada}
                  disabled={guardandoGestion}
                  className="flex-1 py-2.5 bg-[#990000] hover:bg-[#800000] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {guardandoGestion ? "Guardando..." : "Guardar Nota"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: REAGENDAR CUALQUIER ALARMA ================= */}
      {reagendarItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                  Reprogramar Alarma
                </span>
                <h3 className="text-sm font-black text-gray-900">
                  {reagendarItem.destinatario_nombre}
                </h3>
              </div>
              <button
                onClick={() => setReagendarItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nueva Fecha y Hora de Ejecución
                </label>
                <input
                  type="datetime-local"
                  value={fechaEdicion}
                  onChange={(e) => setFechaEdicion(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReagendarItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarFecha}
                  disabled={guardandoFecha}
                  className="flex-1 py-2.5 bg-[#990000] hover:bg-[#800000] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {guardandoFecha ? "Guardando..." : "Actualizar Fecha"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CREAR NUEVA ALARMA ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-black uppercase text-[#990000] tracking-wider block">
                  Nueva Tarea Operativa
                </span>
                <h3 className="text-base font-black text-gray-900">
                  Crear Alarma o Recordatorio Manual
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCrearAlarma} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre del Prospecto / Alumno *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Armando González"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Teléfono o Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoContacto}
                    onChange={(e) => setNuevoContacto(e.target.value)}
                    placeholder="809-xxx-xxxx o correo"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Canal de Contacto
                  </label>
                  <select
                    value={nuevoCanal}
                    onChange={(e) => setNuevoCanal(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000] cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="llamada">Llamada Telefónica</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tipo de Disparador
                  </label>
                  <select
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000] cursor-pointer"
                  >
                    <option value="seguimiento">Follow-up / Seguimiento</option>
                    <option value="inscripcion">Pre-Inscripción</option>
                    <option value="pago">Aviso de Pago</option>
                    <option value="recordatorio">Recordatorio de Inicio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Fecha y Hora de la Alarma
                </label>
                <input
                  type="datetime-local"
                  required
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#990000]"
                />
              </div>

              {nuevoCanal === "llamada" && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    Nota de Llamada
                  </label>
                  <textarea
                    rows={2}
                    value={nuevoDetalle}
                    onChange={(e) => setNuevoDetalle(e.target.value)}
                    placeholder="Instrucción o motivo de la llamada para recepción..."
                    className="w-full bg-amber-50/40 border border-amber-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                  ></textarea>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="flex-1 py-2.5 bg-[#990000] hover:bg-[#800000] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {creando ? "Creando..." : "Programar Alarma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: VINCULACIÓN WHATSAPP BOT (BAILEYS) ================= */}
      {waModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">chat</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 leading-tight">
                    Bot Oficial de WhatsApp
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Motor Baileys para envíos automáticos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* ESTADO CONECTADO */}
            {waStatus.status === "connected" ? (
              <div className="py-4 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">verified</span>
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      🟢 Teléfono Conectado
                    </span>
                    <p className="text-base font-black text-gray-900 mt-1">
                      +{waStatus.phoneNumber}
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-0.5">
                      Los mensajes automáticos y broadcasts saldrán desde esta línea.
                    </p>
                  </div>
                </div>

                {/* CAJA DE PRUEBA EN VIVO */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-slate-700">send_and_archive</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Probar Envío en Tiempo Real
                    </h4>
                  </div>
                  <form onSubmit={handleEnviarMensajePrueba} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={telefonoTest}
                        onChange={(e) => setTelefonoTest(e.target.value)}
                        placeholder="Ej: 8099220880 o 829..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={enviandoTest}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {enviandoTest ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">send</span>
                            <span>Probar</span>
                          </>
                        )}
                      </button>
                    </div>
                    {resultadoTest && (
                      <p
                        className={`text-[11px] font-bold p-2 rounded-lg ${
                          resultadoTest.ok
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {resultadoTest.msg}
                      </p>
                    )}
                  </form>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleDesconectarWhatsApp}
                    disabled={cargandoWa}
                    className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {cargandoWa ? "Desconectando..." : "Desconectar"}
                  </button>
                  <button
                    onClick={() => setWaModalOpen(false)}
                    className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* ESTADO DESCONECTADO O ESPERANDO QR */
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-700 font-medium leading-relaxed">
                    Abre WhatsApp en tu teléfono, ve a <strong>Dispositivos Vinculados</strong> y escanea el código a continuación:
                  </p>
                </div>

                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  {waStatus.qrCodeDataUrl ? (
                    <div className="space-y-2 text-center">
                      <img
                        src={waStatus.qrCodeDataUrl}
                        alt="Código QR WhatsApp"
                        className="w-56 h-56 mx-auto rounded-xl shadow-xs border border-gray-300"
                      />
                      <p className="text-[10px] text-gray-500 animate-pulse font-mono">
                        Esperando lectura del código...
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">
                        progress_activity
                      </span>
                      <p className="text-xs text-gray-500 font-medium">
                        {waStatus.status === "connecting"
                          ? "Generando código QR seguro..."
                          : "Iniciando servicio Baileys..."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={handleConectarWhatsApp}
                    disabled={cargandoWa}
                    className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Regenerar QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaModalOpen(false)}
                    className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
