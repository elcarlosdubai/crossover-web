"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { getEstudiantesDirector } from "@/app/actions/estudiantes";
import { getPreinscripciones } from "@/app/actions/inscripciones";
import { ContactoBroadcast } from "@/app/api/broadcast/drip-batch/route";

export default function BroadcastDripAdmin() {
  const [canal, setCanal] = useState<"whatsapp" | "email">("whatsapp");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Mensajes
  const [mensajeTexto, setMensajeTexto] = useState(
    "{¡Hola|Saludos|Estimado(a)} {{nombre}}, te escribimos de *Centro Educativo Crossover* 🎓.\n\nQueremos recordarte que las plazas para {{curso}} están activas. ¿Tienes alguna pregunta para formalizar tu matrícula?"
  );

  const [codigoHtml, setCodigoHtml] = useState(
`<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
  <div style="background: #990000; padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 900;">Centro Educativo Crossover</h1>
    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Comunicado Oficial</p>
  </div>
  <div style="padding: 28px 24px; color: #374151; font-size: 14px; line-height: 1.6;">
    <p style="margin: 0 0 16px; font-weight: bold; color: #111827;">Estimado(a) {{nombre}},</p>
    <p style="margin: 0 0 16px;">Te informamos sobre las novedades académicas para el programa <strong>{{curso}}</strong>.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px;"><strong>Horario asignado:</strong> {{horario}}</p>
      <p style="margin: 6px 0 0; font-size: 13px;"><strong>Sede:</strong> Av. Las Palmas #58, Herrera</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://wa.me/18099220880" style="display: inline-block; background: #990000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">Contactar a Coordinación</a>
    </div>
  </div>
  <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb;">
    Centro Educativo Crossover • Tel: (809) 922-0880 • info@crossoverrd.com
  </div>
</div>`
  );

  const [emailSubject, setEmailSubject] = useState("Aviso Oficial — Centro Educativo Crossover");

  // Audiencia
  const [audienciaTipo, setAudienciaTipo] = useState<"prospectos" | "todos_estudiantes">("prospectos");
  const [contactosCargados, setContactosCargados] = useState<ContactoBroadcast[]>([]);
  const [cargandoContactos, setCargandoContactos] = useState(false);

  // Parámetros de Cadencia (Ocultos en Settings ⚙️)
  const [modoVelocidad, setModoVelocidad] = useState<"sigiloso" | "moderado" | "rapido">("sigiloso");
  const [tamanoLote, setTamanoLote] = useState(15);
  const [pausaEntreLotesSegundos, setPausaEntreLotesSegundos] = useState(45);

  // Estados del Motor
  const [campanaEnProgreso, setCampanaEnProgreso] = useState(false);
  const [campanaPausada, setCampanaPausada] = useState(false);
  const [indiceActual, setIndiceActual] = useState(0);
  const [totalContactos, setTotalContactos] = useState(0);
  const [conteoExitosos, setConteoExitosos] = useState(0);
  const [conteoFallidos, setConteoFallidos] = useState(0);
  const [logEnvios, setLogEnvios] = useState<Array<{
    contacto: string;
    nombre: string;
    success: boolean;
    error?: string;
    hora: string;
  }>>([]);
  const [estadoDripTexto, setEstadoDripTexto] = useState("Listo");

  const pausarRef = useRef(false);
  const abortarRef = useRef(false);

  // Cargar contactos
  const cargarAudiencia = async () => {
    setCargandoContactos(true);
    try {
      if (audienciaTipo === "todos_estudiantes") {
        const ests = await getEstudiantesDirector();
        const parseados: ContactoBroadcast[] = ests
          .map((e: any) => ({
            id: e.id,
            nombre: `${e.nombres} ${e.apellidos || ""}`.trim(),
            contacto: canal === "whatsapp" ? (e.tutor_telefono || "") : (e.email || ""),
            curso: e.curso?.nombre || "Curso Regular",
            tanda: e.curso?.tipo || "Presencial",
          }))
          .filter((c: ContactoBroadcast) => c.contacto && c.contacto.length > 5);

        setContactosCargados(parseados);
        setTotalContactos(parseados.length);
      } else {
        const leads = await getPreinscripciones();
        const parseados: ContactoBroadcast[] = leads
          .map((l: any) => ({
            id: l.id,
            nombre: `${l.nombres_aspirante} ${l.apellidos_aspirante || ""}`.trim(),
            contacto: canal === "whatsapp" ? (l.telefono_tutor || "") : (l.email_tutor || ""),
            curso: l.curso_solicitado || "Curso Técnico",
            tanda: l.horario || "Por coordinar",
          }))
          .filter((c: ContactoBroadcast) => c.contacto && c.contacto.length > 5);

        setContactosCargados(parseados);
        setTotalContactos(parseados.length);
      }
    } catch (err) {
      console.error("Error al cargar audiencia:", err);
    } finally {
      setCargandoContactos(false);
    }
  };

  useEffect(() => {
    cargarAudiencia();
  }, [audienciaTipo, canal]);

  const insertarTag = (tag: string) => {
    if (canal === "email" && isHtmlMode) {
      setCodigoHtml((prev) => prev + ` ${tag} `);
    } else {
      setMensajeTexto((prev) => prev + ` ${tag} `);
    }
  };

  const previewRender = useMemo(() => {
    const raw = canal === "email" && isHtmlMode ? codigoHtml : mensajeTexto;
    return raw
      .replace(/\{\{nombre\}\}/gi, "Armando González")
      .replace(/\{\{curso\}\}/gi, "Inglés Adultos")
      .replace(/\{\{horario\}\}/gi, "Sábados 1:00 PM - 4:00 PM");
  }, [canal, isHtmlMode, mensajeTexto, codigoHtml]);

  // Consultar estado persistente del worker en el servidor
  const consultarEstadoServidor = async () => {
    try {
      const res = await fetch("/api/broadcast/status");
      if (res.ok) {
        const data = await res.json();
        if (data.pendientes > 0 || data.enProceso > 0) {
          setCampanaEnProgreso(true);
          const total = data.pendientes + data.enProceso + data.enviados + data.fallidos;
          setTotalContactos(total);
          setIndiceActual(data.enviados + data.fallidos);
          setConteoExitosos(data.enviados);
          setConteoFallidos(data.fallidos);
          setEstadoDripTexto(`Enviando en segundo plano (${data.enviados}/${total})...`);
        } else if (campanaEnProgreso) {
          setCampanaEnProgreso(false);
          setEstadoDripTexto("Completado");
        }
      }
    } catch (e) {
      console.error("Error consultando status del worker:", e);
    }
  };

  useEffect(() => {
    consultarEstadoServidor();
    const interval = setInterval(consultarEstadoServidor, 4000);
    return () => clearInterval(interval);
  }, []);

  // Encolar masivo en Supabase (tarda 1 segundo y el servidor se encarga)
  const iniciarCampana = async () => {
    if (contactosCargados.length === 0) {
      alert("No hay contactos válidos seleccionados.");
      return;
    }

    if (!confirm(`¿Iniciar difusión a ${contactosCargados.length} destinatarios vía ${canal.toUpperCase()}? Se ejecutará en segundo plano aunque cierres sesión.`)) {
      return;
    }

    setCampanaEnProgreso(true);
    setEstadoDripTexto("Encolando en la nube...");

    const mensajeAEnviar = canal === "email" && isHtmlMode ? codigoHtml : mensajeTexto;

    try {
      const res = await fetch("/api/broadcast/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          asunto: emailSubject,
          plantillaMensaje: mensajeAEnviar,
          isHtml: canal === "email" && isHtmlMode,
          contactos: contactosCargados,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setEstadoDripTexto("✓ Campaña activa en segundo plano. Puedes cerrar sesión.");
        consultarEstadoServidor();
      } else {
        alert("Error al encolar: " + data.error);
        setCampanaEnProgreso(false);
      }
    } catch (err: any) {
      alert("Error de red: " + err.message);
      setCampanaEnProgreso(false);
    }
  };

  const togglePausar = () => {
    pausarRef.current = !pausarRef.current;
    setCampanaPausada(pausarRef.current);
  };

  const cancelarCampana = () => {
    if (confirm("¿Detener campaña?")) {
      abortarRef.current = true;
      pausarRef.current = false;
      setCampanaEnProgreso(false);
      setEstadoDripTexto("Detenido");
    }
  };

  const pct = totalContactos > 0 ? Math.round((indiceActual / totalContactos) * 100) : 0;

  return (
    <div className="space-y-4 pb-12 font-sans max-w-7xl mx-auto">
      {/* ================= TOOLBAR SUPERIOR COMPACTA DE UNA SOLA LÍNEA (SaaS High-End) ================= */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* GRUPO IZQUIERDO: CANAL + AUDIENCIA + FORMATO */}
        <div className="flex items-center gap-2">
          {/* CANAL */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => !campanaEnProgreso && setCanal("whatsapp")}
              disabled={campanaEnProgreso}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                canal === "whatsapp" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600">chat</span>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => !campanaEnProgreso && setCanal("email")}
              disabled={campanaEnProgreso}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                canal === "email" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-blue-600">mail</span>
              <span>Email</span>
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 mx-0.5"></div>

          {/* AUDIENCIA SELECTOR COMPACTO */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-gray-400 font-medium">Para:</span>
            <select
              value={audienciaTipo}
              disabled={campanaEnProgreso}
              onChange={(e) => setAudienciaTipo(e.target.value as any)}
              className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="prospectos">Pre-Inscripciones ({cargandoContactos ? "..." : contactosCargados.length})</option>
              <option value="todos_estudiantes">Estudiantes Activos</option>
            </select>
          </div>

          {/* MODO HTML (SOLO EMAIL) */}
          {canal === "email" && (
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setIsHtmlMode(false)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  !isHtmlMode ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                }`}
              >
                Texto
              </button>
              <button
                onClick={() => setIsHtmlMode(true)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  isHtmlMode ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                }`}
              >
                HTML
              </button>
            </div>
          )}
        </div>

        {/* GRUPO DERECHO: ENGRANAJE CONFIG + BOTÓN DE DISPARO */}
        <div className="flex items-center gap-2">
          {/* BOTÓN ENGRANAJE DE PREFERENCIAS (NO OCUPA PANTALLA) */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Configurar cadencia y lotes"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span className="hidden sm:inline">Ajustes</span>
          </button>

          {/* BOTÓN ENVIAR */}
          <button
            type="button"
            disabled={campanaEnProgreso || contactosCargados.length === 0}
            onClick={iniciarCampana}
            className="bg-gray-900 hover:bg-black disabled:opacity-40 text-white py-2 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            <span>
              {campanaEnProgreso ? "Enviando..." : `Enviar a ${contactosCargados.length}`}
            </span>
          </button>
        </div>
      </div>

      {/* ================= BARRA DE PROGRESO DISCRETA CUANDO ESTÁ EN MARCHA ================= */}
      {campanaEnProgreso && (
        <div className="bg-gray-950 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-mono text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {estadoDripTexto}
              </span>
              <span>{indiceActual} / {totalContactos} ({pct}%)</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={togglePausar}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold"
            >
              {campanaPausada ? "Reanudar" : "Pausar"}
            </button>
            <button
              onClick={cancelarCampana}
              className="px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded-lg text-xs font-bold"
            >
              Detener
            </button>
          </div>
        </div>
      )}

      {/* ================= ÁREA DE TRABAJO: 2 COLUMNAS PURAS (EDITOR IZQ / PREVIEW DER) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA: EDITOR COMPLETO (7 COLUMNAS) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            {canal === "email" && (
              <div>
                <input
                  type="text"
                  placeholder="Asunto del correo electrónico..."
                  value={emailSubject}
                  disabled={campanaEnProgreso}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>
            )}

            {/* BARRA DE VARIABLES RÁPIDAS */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 font-mono">Insertar:</span>
                {[
                  { tag: "{{nombre}}", label: "Nombre" },
                  { tag: "{{curso}}", label: "Curso" },
                  { tag: "{{horario}}", label: "Horario" },
                ].map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    disabled={campanaEnProgreso}
                    onClick={() => insertarTag(t.tag)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-md text-[10px] font-mono font-bold text-gray-700 cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] text-gray-400 font-mono">
                {canal === "email" && isHtmlMode ? `${codigoHtml.length} caracteres` : `${mensajeTexto.length} caracteres`}
              </span>
            </div>

            {/* EDITOR */}
            <div>
              {canal === "email" && isHtmlMode ? (
                <textarea
                  rows={16}
                  value={codigoHtml}
                  disabled={campanaEnProgreso}
                  onChange={(e) => setCodigoHtml(e.target.value)}
                  placeholder="Escribe o pega aquí tu código HTML..."
                  className="w-full bg-gray-950 text-emerald-400 border border-gray-800 rounded-xl p-3.5 text-[11px] font-mono leading-relaxed focus:outline-none focus:border-emerald-500 resize-none selection:bg-emerald-900"
                ></textarea>
              ) : (
                <textarea
                  rows={14}
                  value={mensajeTexto}
                  disabled={campanaEnProgreso}
                  onChange={(e) => setMensajeTexto(e.target.value)}
                  placeholder="Escribe el mensaje aquí..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 font-mono leading-relaxed resize-none"
                ></textarea>
              )}
            </div>
          </div>

          {/* LOGS COMPACTOS EN TIEMPO REAL */}
          {logEnvios.length > 0 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-2">
                Log de Envíos (Registrados en Centro de Mando)
              </span>
              <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 text-[11px] font-mono">
                {logEnvios.map((log, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between gap-2">
                    <span className={log.success ? "text-emerald-700 font-semibold" : "text-red-600"}>
                      {log.success ? "✓" : "✕"} {log.nombre} ({log.contacto})
                    </span>
                    <span className="text-gray-400 text-[10px]">{log.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: PREVISUALIZADOR LIMPIO (5 COLUMNAS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs sticky top-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700">Previsualización en Vivo</span>

              {canal === "email" && (
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                      previewDevice === "desktop" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                      previewDevice === "mobile" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                    }`}
                  >
                    Móvil
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW WHATSAPP MOCKUP */}
            {canal === "whatsapp" && (
              <div className="max-w-xs mx-auto bg-[#efeae2] border border-gray-300 rounded-3xl p-3.5 shadow-inner space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-300/60">
                  <div className="w-8 h-8 rounded-full bg-[#990000] text-white flex items-center justify-center font-black text-xs">
                    C
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">Crossover Oficial</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">En línea</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs space-y-1.5 border border-gray-200/60">
                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {previewRender}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                    <span>14:32</span>
                    <span className="material-symbols-outlined text-xs text-blue-500">done_all</span>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW EMAIL RENDER */}
            {canal === "email" && (
              <div
                className={`mx-auto border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-[#f4f5f7] transition-all ${
                  previewDevice === "mobile" ? "max-w-xs" : "w-full"
                }`}
              >
                <div className="bg-white p-2.5 border-b border-gray-200 text-xs">
                  <p className="text-gray-400 text-[10px]">De: <strong>Centro Educativo Crossover</strong></p>
                  <p className="font-bold text-gray-900 truncate">Asunto: {emailSubject}</p>
                </div>

                <div className="p-3 bg-gray-100 max-h-[460px] overflow-y-auto">
                  {isHtmlMode ? (
                    <div
                      className="bg-white rounded-xl shadow-xs overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: previewRender }}
                    />
                  ) : (
                    <div className="bg-white rounded-xl p-4 shadow-xs text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                      <div className="pb-2 mb-2 border-b border-gray-100 font-bold text-[#990000]">
                        Centro Educativo Crossover
                      </div>
                      {previewRender}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= MODAL AJUSTES ⚙️ (LIMPIO Y FUERA DEL CAMINO) ================= */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900">Ajustes de Cadencia & Lotes</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Velocidad
                </label>
                <select
                  value={modoVelocidad}
                  onChange={(e) => setModoVelocidad(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                >
                  <option value="sigiloso">Standard (6-12s / mensaje)</option>
                  <option value="moderado">Balanced (4-7s / mensaje)</option>
                  <option value="rapido">Fast (2-4s / mensaje)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tamaño de Bloque
                </label>
                <select
                  value={tamanoLote}
                  onChange={(e) => setTamanoLote(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                >
                  <option value={10}>10 items</option>
                  <option value={15}>15 items</option>
                  <option value={25}>25 items</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Pausa entre Bloques
                </label>
                <select
                  value={pausaEntreLotesSegundos}
                  onChange={(e) => setPausaEntreLotesSegundos(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                >
                  <option value={30}>30 segundos</option>
                  <option value={45}>45 segundos</option>
                  <option value={60}>60 segundos</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
