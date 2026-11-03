"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateEstudiante, deleteEstudiante } from "@/app/actions/estudiantes";
import { justificarInasistenciaEstudiante } from "@/app/actions/asistencia";

export default function EstudianteDetalleClient({
  expediente: initialExpediente,
  cursos = []
}: {
  expediente: any;
  cursos: any[];
}) {
  const router = useRouter();
  const [expediente, setExpediente] = useState(initialExpediente);
  const [activeTab, setActiveTab] = useState<"resumen" | "calificaciones" | "asistencia" | "editar">("resumen");
  const [copiedToken, setCopiedToken] = useState(false);
  const [showBoletinModal, setShowBoletinModal] = useState(false);
  const [showBitacoraPadresModal, setShowBitacoraPadresModal] = useState(false);
  const [justificandoId, setJustificandoId] = useState<string | null>(null);
  const [motivoJustificacion, setMotivoJustificacion] = useState("");

  // Filtros inteligentes para la bitácora de asistencias
  const [filtroEstadoAsist, setFiltroEstadoAsist] = useState<"TODOS" | "SOLO_FALTAS" | "TARDANZAS">("TODOS");
  const [filtroPeriodoAsist, setFiltroPeriodoAsist] = useState<number | "TODOS">("TODOS");
  const [paginaAsist, setPaginaAsist] = useState<number>(1);
  const itemsPorPaginaAsist = 8;

  // Estados para controlar los acordeones desplegables del récord académico
  const [nivelDesplegado, setNivelDesplegado] = useState<boolean>(true);
  const [mesesAbiertos, setMesesAbiertos] = useState<Record<number, boolean>>({
    1: true,
    2: true,  // Mes 2 abierto por defecto para ver notas
    3: true
  });

  const toggleMes = (num: number) => {
    setMesesAbiertos(prev => ({ ...prev, [num]: !prev[num] }));
  };

  // Formulario de edición
  const [editData, setEditData] = useState({
    nombres: expediente.estudiante?.nombres || "",
    apellidos: expediente.estudiante?.apellidos || "",
    curso_id: expediente.estudiante?.curso_id || "",
    tutor_nombre: expediente.estudiante?.tutor_nombre || "",
    tutor_telefono: expediente.estudiante?.tutor_telefono || "",
    email: expediente.estudiante?.email || "",
    estado: expediente.estudiante?.estado || "ACTIVO"
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { estudiante, metricas, criteriosConNotas = [], historialAsistencias = [], calificacionesRaw = [] } = expediente;

  // Organizar notas de la BD por periodo
  const notasPorPeriodo = (periodoNum: number) => {
    return (estudiante.curso?.criterios || []).map((crit: any) => {
      const match = calificacionesRaw.find((c: any) => c.criterio_id === crit.id && (c.periodo || 1) === periodoNum);
      let val = match ? Number(match.nota !== undefined && match.nota !== null ? match.nota : match.calificacion) : null;
      const maxPts = Number(crit.porcentaje) || 20;
      if (val !== null && val > maxPts) {
        val = Math.round(((val * maxPts) / 100) * 10) / 10;
      }
      return {
        ...crit,
        calificacion: val
      };
    });
  };

  const calcularTotalPeriodo = (periodoNum: number) => {
    const list = notasPorPeriodo(periodoNum);
    const hasAny = list.some((c: any) => c.calificacion !== null);
    if (!hasAny) return null;
    const sum = list.reduce((acc: number, curr: any) => acc + (curr.calificacion || 0), 0);
    return Math.round(sum * 10) / 10;
  };

  const handleCopiarEnlace = () => {
    if (!estudiante?.token_consulta) return;
    const url = window.location.origin + "/consulta/" + estudiante.token_consulta;
    navigator.clipboard.writeText(url);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.nombres.trim() || !editData.apellidos.trim()) {
      alert("Nombres y apellidos son requeridos.");
      return;
    }
    setSavingEdit(true);
    const res = await updateEstudiante(estudiante.id, editData);
    if (res.success) {
      alert("✅ Datos del estudiante actualizados correctamente.");
      setExpediente((prev: any) => ({
        ...prev,
        estudiante: {
          ...prev.estudiante,
          ...res.estudiante,
          curso: cursos.find(c => c.id === editData.curso_id) || prev.estudiante.curso
        }
      }));
      setActiveTab("resumen");
      router.refresh();
    } else {
      alert("Error actualizando: " + res.error);
    }
    setSavingEdit(false);
  };

  const handleEliminarEstudiante = async () => {
    const confirm = window.confirm("¿Estás seguro de que deseas eliminar permanentemente al estudiante " + estudiante.nombres + " " + estudiante.apellidos + "?");
    if (!confirm) return;

    setDeleting(true);
    const res = await deleteEstudiante(estudiante.id);
    if (res.success) {
      alert("Estudiante eliminado correctamente.");
      router.push("/admin/dashboard/estudiantes");
    } else {
      alert("Error eliminando estudiante: " + res.error);
    }
    setDeleting(false);
  };

  const cleanPhone = (estudiante.tutor_telefono || "").replace(/\D/g, "");
  const aprobado = metricas.notaPonderada >= 70;
  const asistenciaOk = metricas.pctAsistencia >= 80;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Botón Volver y Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/dashboard/estudiantes"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-2xs transition-all hover:bg-gray-50"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver al Gestor de Estudiantes
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBoletinModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200/80 px-3.5 py-2 rounded-xl shadow-2xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-purple-700">description</span>
            Boletín Oficial (PDF)
          </button>

          <button
            type="button"
            onClick={handleCopiarEnlace}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 bg-white border border-gray-200/80 px-3.5 py-2 rounded-xl shadow-2xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            {copiedToken ? "¡Enlace Copiado!" : "Copiar Link del Padre"}
          </button>

          {estudiante.curso?.id && (
            <Link
              href={"/admin/dashboard/cursos/" + estudiante.curso.id}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-xl shadow-2xs transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">meeting_room</span>
              Ir al Aula de Clases
            </Link>
          )}
        </div>
      </div>

      {/* Header Ficha 360 Completa */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/20 shrink-0">
              {estudiante.nombres?.charAt(0)}{estudiante.apellidos?.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="bg-white/10 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg backdrop-blur">
                  Expediente Académico 360
                </span>
                <span className="font-mono text-xs text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-md font-bold">
                  {estudiante.matricula}
                </span>
                <span className={"text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md " + (estudiante.estado === 'INACTIVO' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30')}>
                  {estudiante.estado || 'ACTIVO'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {estudiante.nombres} {estudiante.apellidos}
              </h1>
              <p className="text-xs text-purple-200/80 font-medium mt-1 flex items-center gap-2">
                <span>{estudiante.curso?.nombre || 'Sin curso asignado'}</span>
                <span>•</span>
                <span>{estudiante.curso?.tipo || 'General'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-3.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="text-center px-3 border-r border-white/15">
              <span className="text-[10px] font-black uppercase text-purple-200 block">Condición</span>
              <span className={"text-sm font-black " + (aprobado ? 'text-emerald-300' : 'text-red-300')}>
                {aprobado ? 'Aprobado' : 'Reprobado'}
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-black uppercase text-purple-200 block">Promedio</span>
              <span className="text-xl font-black text-amber-300">{metricas.notaPonderada}</span>
            </div>
          </div>
        </div>

        {/* Barra de Pestañas de Navegación de la Ficha */}
        <div className="bg-gray-50/80 border-b border-gray-200 px-6 sm:px-8 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("resumen")}
            className={"py-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap " + (activeTab === "resumen" ? "border-purple-600 text-purple-900 bg-white" : "border-transparent text-gray-500 hover:text-gray-900")}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            Ficha y Resumen General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calificaciones")}
            className={"py-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap " + (activeTab === "calificaciones" ? "border-purple-600 text-purple-900 bg-white" : "border-transparent text-gray-500 hover:text-gray-900")}
          >
            <span className="material-symbols-outlined text-[16px]">grade</span>
            Récord de Calificaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("asistencia")}
            className={"py-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap " + (activeTab === "asistencia" ? "border-purple-600 text-purple-900 bg-white" : "border-transparent text-gray-500 hover:text-gray-900")}
          >
            <span className="material-symbols-outlined text-[16px]">event_available</span>
            Historial de Asistencia ({historialAsistencias.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("editar")}
            className={"py-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap " + (activeTab === "editar" ? "border-purple-600 text-purple-900 bg-white" : "border-transparent text-gray-500 hover:text-gray-900")}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Editar Datos del Alumno
          </button>
        </div>
      </div>

      {/* CONTENIDO DE LA PESTAÑA ACTIVA */}

      {/* 1. RESUMEN GENERAL */}
      {activeTab === "resumen" && (
        <div className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs text-center">
              <span className="text-[10px] font-black uppercase text-purple-700 block mb-1">Nota Acumulada</span>
              <span className={"text-3xl sm:text-4xl font-black " + (aprobado ? 'text-purple-900' : 'text-red-600')}>
                {metricas.notaPonderada}
              </span>
              <span className="block text-[10px] text-gray-400 font-bold mt-1">sobre 100 puntos</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs text-center">
              <span className="text-[10px] font-black uppercase text-emerald-700 block mb-1">Asistencia</span>
              <span className={"text-3xl sm:text-4xl font-black " + (asistenciaOk ? 'text-emerald-700' : 'text-red-600')}>
                {metricas.pctAsistencia}%
              </span>
              <span className="block text-[10px] text-gray-400 font-bold mt-1">
                {asistenciaOk ? 'Cumple el mínimo (80%)' : 'Riesgo por ausencias'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs text-center">
              <span className="text-[10px] font-black uppercase text-blue-700 block mb-1">Clases Presentes</span>
              <span className="text-3xl sm:text-4xl font-black text-blue-900">
                {metricas.presentes}
              </span>
              <span className="block text-[10px] text-gray-400 font-bold mt-1">
                de {metricas.totalClases} impartidas
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs text-center">
              <span className="text-[10px] font-black uppercase text-amber-700 block mb-1">Ausencias</span>
              <span className="text-3xl sm:text-4xl font-black text-amber-900">
                {metricas.ausencias}
              </span>
              <span className="block text-[10px] text-gray-400 font-bold mt-1">
                {metricas.tardanzas} tardanzas
              </span>
            </div>
          </div>

          {/* Bloques de Información en 2 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Aula & Docente */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Aula & Asignación Académica</h3>
                  <p className="text-xs text-gray-500">Detalles de inscripción del estudiante</p>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">Curso Actual:</span>
                  <strong className="text-gray-900 font-bold">{estudiante.curso?.nombre || 'No asignado'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">Categoría / Programa:</span>
                  <strong className="text-purple-700 font-bold">{estudiante.curso?.tipo || 'General'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">Profesor Responsable:</span>
                  <strong className="text-gray-900 font-bold">{estudiante.curso?.profesor?.nombre || 'Por asignar'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">Horario Semanal:</span>
                  <strong className="text-gray-800 font-bold">
                    {estudiante.curso?.hora_inicio || '09:00'} a {estudiante.curso?.hora_fin || '12:00'}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400 font-medium">Requisito de Asistencia:</span>
                  <strong className="text-gray-800 font-bold">Mínimo 80%</strong>
                </div>
              </div>
            </div>

            {/* Tutor & Contacto */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">contact_phone</span>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">Contacto del Tutor / Padre</h3>
                    <p className="text-xs text-gray-500">Comunicación institucional</p>
                  </div>
                </div>

                {cleanPhone && (
                  <a
                    href={"https://wa.me/1" + cleanPhone}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs inline-flex items-center gap-1.5 transition-all border border-emerald-200"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    WhatsApp Directo
                  </a>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">Nombre del Tutor:</span>
                  <strong className="text-gray-900 font-bold">{estudiante.tutor_nombre || 'No registrado'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">WhatsApp / Móvil:</span>
                  <strong className="text-emerald-700 font-bold font-mono">{estudiante.tutor_telefono || 'No registrado'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400 font-medium">Correo Electrónico:</span>
                  <strong className="text-gray-800 font-bold">{estudiante.email || 'No registrado'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400 font-medium">Portal de Consulta:</span>
                  <button
                    type="button"
                    onClick={handleCopiarEnlace}
                    className="text-purple-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    {copiedToken ? "¡Copiado!" : "Copiar Enlace de Consulta"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Calificaciones */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">grade</span>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Récord Rápido de Calificaciones</h3>
                  <p className="text-xs text-gray-500">Criterios institucionales</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("calificaciones")}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                Ver detalle por criterios &rarr;
              </button>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Criterio Institucional</th>
                    <th className="py-3 px-4 text-center">Valor Máx.</th>
                    <th className="py-3 px-4 text-center">Puntos Obtenidos</th>
                    <th className="py-3 px-4 text-right">Rendimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {criteriosConNotas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 font-bold">
                        Este curso aún no tiene criterios de evaluación configurados.
                      </td>
                    </tr>
                  ) : (
                    criteriosConNotas.map((c: any) => {
                      const maxPts = Number(c.porcentaje);
                      const obtenido = c.calificacion !== null ? Number(c.calificacion) : null;
                      const pctRendimiento = obtenido !== null && maxPts > 0 ? (obtenido / maxPts) * 100 : 0;
                      const pasa = pctRendimiento >= 70;

                      return (
                        <tr key={c.id} className="hover:bg-gray-50/60">
                          <td className="py-3 px-4 font-bold text-gray-900">{c.nombre}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-500">{maxPts} pts</td>
                          <td className="py-3 px-4 text-center font-black">
                            {obtenido !== null ? (
                              <span className={"inline-block px-2.5 py-0.5 rounded-lg text-xs font-black " + (pasa ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200')}>
                                {obtenido} / {maxPts} pts
                              </span>
                            ) : (
                              <span className="text-gray-300">Pendiente</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {obtenido !== null ? (
                              <span className={"text-[10px] font-black uppercase px-2 py-0.5 rounded-md " + (pasa ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                                {Math.round(pctRendimiento)}% ({pasa ? 'Excelente/Bien' : 'A reforzar'})
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold">Sin calificar</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RÉCORD DE CALIFICACIONES COMPLETO POR NIVEL / TRIMESTRE / MÓDULOS */}
      {activeTab === "calificaciones" && (
        <div className="space-y-6">

          {/* HISTORIAL DE NIVELES PREVIOS PROMOVIDOS (Fotografías Inmutables) */}
          {(expediente.historialAcademico || []).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-purple-700 text-[20px]">history_edu</span>
                <h4 className="font-black text-gray-900 text-sm tracking-tight">
                  Niveles Aprobados y Concluidos ({expediente.historialAcademico.length})
                </h4>
              </div>

              {expediente.historialAcademico.map((hist: any, hIdx: number) => {
                const snapshot = Array.isArray(hist.calificaciones_snapshot) ? hist.calificaciones_snapshot : [];
                return (
                  <div key={hist.id || hIdx} className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-[20px]">verified</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-black text-gray-900">
                              {hist.curso_nombre}
                            </h3>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {hist.estado_cierre || "APROBADO"}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500">
                              Promovido el {new Date(hist.fecha_promocion).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">
                            Historial institucional congelado • Asistencia: {hist.porcentaje_asistencia || 100}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="px-3.5 py-1.5 bg-white border border-emerald-200 rounded-xl text-center shadow-2xs">
                          <span className="text-[9px] uppercase font-black text-emerald-800 block">Promedio Final</span>
                          <span className="text-sm font-black text-emerald-900">{hist.promedio_final} / 100 pts</span>
                        </div>
                      </div>
                    </div>

                    {snapshot.length > 0 && (
                      <div className="p-4 bg-gray-50/50">
                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-100 text-[10px] font-black text-gray-500 uppercase">
                              <tr>
                                <th className="py-2.5 px-4">Periodo / Bloque</th>
                                <th className="py-2.5 px-4 text-center">Nota Asentada</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {snapshot.map((s: any, sIdx: number) => (
                                <tr key={sIdx}>
                                  <td className="py-2 px-4 font-bold text-gray-800">
                                    Periodo {s.periodo || 1}
                                  </td>
                                  <td className="py-2 px-4 text-center font-black text-gray-900">
                                    {s.nota !== undefined ? s.nota : s.calificacion} pts
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tarjeta Acordeón Principal del Nivel / Módulo Actual */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all">
            {/* Barra Compacta del Nivel (Elegante, delgada y limpia) */}
            <div 
              onClick={() => setNivelDesplegado(!nivelDesplegado)}
              className="px-5 py-3.5 bg-gray-50/90 hover:bg-gray-100/80 border-b border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-sm shrink-0 border border-purple-200/60 shadow-2xs">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                      {estudiante.curso?.nombre || "Nivel Académico Actual"}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-800 border border-purple-200">
                      {estudiante.curso?.tipo === "Idiomas" ? "Trimestre 1" : "Módulo 1"}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                      ⏳ En Curso
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {estudiante.curso?.tipo === "Idiomas" ? "Evaluación continua de 3 meses para promoción" : "Evaluación por módulos técnicos"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-center shadow-2xs">
                    <span className="text-[9px] uppercase font-black text-gray-400 block">Mes 1</span>
                    <span className="text-xs font-black text-gray-900">
                      {calcularTotalPeriodo(1) !== null ? `${calcularTotalPeriodo(1)} pts` : (metricas.notaPonderada ? `${metricas.notaPonderada} pts` : '--')}
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-center shadow-2xs">
                    <span className="text-[9px] uppercase font-black text-gray-400 block">Mes 2</span>
                    <span className="text-xs font-black text-purple-700">
                      {calcularTotalPeriodo(2) !== null ? `${calcularTotalPeriodo(2)} pts` : '--'}
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-black text-gray-400 block">Mes 3</span>
                    <span className="text-xs font-black text-gray-400">
                      {calcularTotalPeriodo(3) !== null ? `${calcularTotalPeriodo(3)} pts` : '--'}
                    </span>
                  </div>
                </div>

                {/* Botón de despliegue suave */}
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-transform shrink-0 shadow-2xs">
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${nivelDesplegado ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido desplegable del Nivel: Los 3 Meses */}
            {nivelDesplegado && (
              <div className="p-6 sm:p-8 space-y-4 bg-gray-50/40 border-t border-purple-100/60 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                  <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-700 text-[18px]">calendar_month</span>
                    Meses y Evaluaciones del Nivel (Haz clic para ver o colapsar criterios)
                  </h4>
                  <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                    Ciclo de 3 meses para promoción
                  </span>
                </div>

                {/* ======================================================== */}
                {/* ACORDEÓN MES 1 */}
                {/* ======================================================== */}
                <div className="border border-purple-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all">
                  <div 
                    onClick={() => toggleMes(1)}
                    className="bg-purple-50/80 hover:bg-purple-100/70 px-5 py-4 border-b border-purple-100 flex items-center justify-between cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        1
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-sm">Mes 1 - Primer Bloque Evaluativo</span>
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {calcularTotalPeriodo(1) !== null ? 'Concluido' : 'En Curso'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">Evaluación continua ({criteriosConNotas.length} criterios)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-purple-950 bg-white border border-purple-200 px-3 py-1 rounded-xl shadow-2xs">
                        Total: {calcularTotalPeriodo(1) !== null ? calcularTotalPeriodo(1) : (metricas.notaPonderada || 0)} / 100 pts
                      </span>
                      <span className={`material-symbols-outlined text-purple-700 text-[20px] transition-transform duration-200 ${mesesAbiertos[1] ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {mesesAbiertos[1] && (
                    <div className="overflow-x-auto animate-in fade-in duration-150">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="py-3 px-4">Criterio Institucional</th>
                            <th className="py-3 px-4 text-center">Valor Máx.</th>
                            <th className="py-3 px-4 text-center">Puntos Obtenidos</th>
                            <th className="py-3 px-4 text-right">Rendimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {notasPorPeriodo(1).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-400 font-bold">
                                No hay criterios registrados.
                              </td>
                            </tr>
                          ) : (
                            notasPorPeriodo(1).map((c: any) => {
                              const maxPts = Number(c.porcentaje);
                              const obtenido = c.calificacion !== null ? Number(c.calificacion) : null;
                              const pct = obtenido !== null && maxPts > 0 ? (obtenido / maxPts) * 100 : 0;
                              const pasa = pct >= 70;

                              return (
                                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="py-3 px-4 font-bold text-gray-900">
                                    {c.nombre}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-gray-500 font-mono">
                                    {maxPts} pts
                                  </td>
                                  <td className="py-3 px-4 text-center font-black">
                                    {obtenido !== null ? (
                                      <span className={"inline-block px-3 py-1 rounded-xl text-xs font-black " + (pasa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200')}>
                                        {obtenido} / {maxPts} pts
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">--</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {obtenido !== null ? (
                                      <span className={"text-[10px] font-black uppercase px-2 py-0.5 rounded-md " + (pasa ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                                        {Math.round(pct)}% {pasa ? 'Satisfactorio' : 'Por mejorar'}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 font-bold">Sin asentar</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* ACORDEÓN MES 2 */}
                {/* ======================================================== */}
                <div className="border border-indigo-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all">
                  <div 
                    onClick={() => toggleMes(2)}
                    className="bg-indigo-50/80 hover:bg-indigo-100/70 px-5 py-4 border-b border-indigo-100 flex items-center justify-between cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        2
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-sm">Mes 2 - Segundo Bloque Evaluativo</span>
                          <span className={"text-[10px] font-black uppercase px-2 py-0.5 rounded-md " + (calcularTotalPeriodo(2) !== null ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100')}>
                            {calcularTotalPeriodo(2) !== null ? 'Concluido' : 'En Curso'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">Evaluación de mitad de ciclo ({criteriosConNotas.length} criterios)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-950 bg-white border border-indigo-200 px-3 py-1 rounded-xl shadow-2xs">
                        Total: {calcularTotalPeriodo(2) !== null ? `${calcularTotalPeriodo(2)} / 100 pts` : '-- / 100 pts'}
                      </span>
                      <span className={`material-symbols-outlined text-indigo-700 text-[20px] transition-transform duration-200 ${mesesAbiertos[2] ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {mesesAbiertos[2] && (
                    <div className="overflow-x-auto animate-in fade-in duration-150">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="py-3 px-4">Criterio Institucional</th>
                            <th className="py-3 px-4 text-center">Valor Máx.</th>
                            <th className="py-3 px-4 text-center">Puntos Obtenidos</th>
                            <th className="py-3 px-4 text-right">Rendimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {notasPorPeriodo(2).map((c: any) => {
                            const maxPts = Number(c.porcentaje);
                            const obtenido = c.calificacion !== null ? Number(c.calificacion) : null;
                            const pct = obtenido !== null && maxPts > 0 ? (obtenido / maxPts) * 100 : 0;
                            const pasa = pct >= 70;

                            return (
                              <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="py-3 px-4 font-bold text-gray-900">
                                  {c.nombre}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-gray-500 font-mono">
                                  {maxPts} pts
                                </td>
                                <td className="py-3 px-4 text-center font-black">
                                  {obtenido !== null ? (
                                    <span className={"inline-block px-3 py-1 rounded-xl text-xs font-black " + (pasa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200')}>
                                      {obtenido} / {maxPts} pts
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">--</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {obtenido !== null ? (
                                    <span className={"text-[10px] font-black uppercase px-2 py-0.5 rounded-md " + (pasa ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                                      {Math.round(pct)}% {pasa ? 'Satisfactorio' : 'Por mejorar'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 font-bold">Sin asentar</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* ACORDEÓN MES 3 (PENDIENTE DE CIERRE) */}
                {/* ======================================================== */}
                <div className="border border-dashed border-gray-300 rounded-2xl p-5 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gray-200 text-gray-500 font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-gray-800 text-xs block">Mes 3 - Evaluación Final y Cierre de Nivel</span>
                      <p className="text-[11px] text-gray-500 font-medium">Bloque pendiente según el cronograma lectivo del trimestre.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gray-200/80 text-gray-600 border border-gray-300 font-mono font-bold">
                      🔒 En Espera
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-400">
                      -- / 100 pts
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. HISTORIAL Y BITÁCORA INTELIGENTE DE ASISTENCIA */}
      {activeTab === "asistencia" && (() => {
        // Filtrar asistencias dinámicamente según período y estado seleccionado
        let filtradas = [...historialAsistencias];

        if (filtroPeriodoAsist !== "TODOS") {
          filtradas = filtradas.filter((a: any) => (a.periodo || 1) === filtroPeriodoAsist);
        }

        if (filtroEstadoAsist === "SOLO_FALTAS") {
          filtradas = filtradas.filter((a: any) => a.estado === "AUSENTE" || a.estado === "EXCUSADO");
        } else if (filtroEstadoAsist === "TARDANZAS") {
          filtradas = filtradas.filter((a: any) => a.estado === "TARDANZA");
        }

        // Paginación de 8 en 8 para no alargar la página
        const totalPaginas = Math.ceil(filtradas.length / itemsPorPaginaAsist) || 1;
        const indexInicio = (paginaAsist - 1) * itemsPorPaginaAsist;
        const asistenciasPaginadas = filtradas.slice(indexInicio, indexInicio + itemsPorPaginaAsist);

        const totalClasesCurso = historialAsistencias.length;
        const totalAusencias = historialAsistencias.filter((a: any) => a.estado === "AUSENTE").length;
        const totalTardanzas = historialAsistencias.filter((a: any) => a.estado === "TARDANZA").length;
        const totalExcusados = historialAsistencias.filter((a: any) => a.estado === "EXCUSADO").length;
        const totalPresentes = historialAsistencias.filter((a: any) => a.estado === "PRESENTE").length;

        return (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-5">
            {/* Cabecera Ejecutiva */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 text-xl">fact_check</span>
                  <h3 className="font-black text-gray-900 text-base">Panel de Asistencia y Disciplina</h3>
                  <span className="bg-purple-100 text-purple-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {totalClasesCurso} Clases Auditadas
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Control por sesiones sin listas infinitas. Filtra rápidamente inasistencias para atención a tutores.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={"px-3.5 py-1.5 rounded-xl text-xs font-black self-start sm:self-auto " + (asistenciaOk ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                  {metricas.pctAsistencia}% Asistencia Acumulada
                </span>
                <button
                  type="button"
                  onClick={() => setShowBitacoraPadresModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Imprimir para Padres
                </button>
              </div>
            </div>

            {/* Tarjetas Resumen de Balance */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200/60 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">Clases Asistidas</span>
                <span className="text-xl font-black text-emerald-950">{totalPresentes}</span>
              </div>
              <div className="bg-rose-50/70 border border-rose-200/60 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-800 block uppercase">Ausencias</span>
                <span className="text-xl font-black text-rose-950">{totalAusencias}</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-800 block uppercase">Tardanzas</span>
                <span className="text-xl font-black text-amber-950">{totalTardanzas}</span>
              </div>
              <div className="bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-blue-800 block uppercase">Excusas Médicas</span>
                <span className="text-xl font-black text-blue-950">{totalExcusados}</span>
              </div>
            </div>

            {/* Barra de Filtros Inteligentes (Para nunca tener listas kilométricas) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/90 p-3 rounded-2xl border border-gray-200/80">
              {/* Filtro por Estado */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => { setFiltroEstadoAsist("TODOS"); setPaginaAsist(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filtroEstadoAsist === "TODOS" ? "bg-purple-900 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Todas ({historialAsistencias.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setFiltroEstadoAsist("SOLO_FALTAS"); setPaginaAsist(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filtroEstadoAsist === "SOLO_FALTAS" ? "bg-rose-600 text-white shadow-xs" : "text-rose-700 hover:bg-rose-50"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Solo Inasistencias ({totalAusencias + totalExcusados})
                </button>
                <button
                  type="button"
                  onClick={() => { setFiltroEstadoAsist("TARDANZAS"); setPaginaAsist(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filtroEstadoAsist === "TARDANZAS" ? "bg-amber-600 text-white shadow-xs" : "text-amber-800 hover:bg-amber-50"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Tardanzas ({totalTardanzas})
                </button>
              </div>

              {/* Filtro por Mes / Período */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Período:</span>
                <select
                  value={filtroPeriodoAsist}
                  onChange={e => {
                    const v = e.target.value;
                    setFiltroPeriodoAsist(v === "TODOS" ? "TODOS" : Number(v));
                    setPaginaAsist(1);
                  }}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="TODOS">Todos los Meses</option>
                  <option value={1}>Mes 1 (Octubre)</option>
                  <option value={2}>Mes 2 (Noviembre)</option>
                  <option value={3}>Mes 3 (Diciembre)</option>
                </select>
              </div>
            </div>

            {/* Tabla Compacta con Altura Controlada */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Fecha de Clase</th>
                    <th className="py-3 px-4 text-center">Mes / Bloque</th>
                    <th className="py-3 px-4 text-center">Estado Oficial</th>
                    <th className="py-3 px-4">Observaciones / Justificación Médica</th>
                    <th className="py-3 px-4 text-right">Acción Dirección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {asistenciasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400 font-bold">
                        {filtroEstadoAsist === "SOLO_FALTAS"
                          ? "✔ Excelente: El estudiante no tiene inasistencias en este filtro."
                          : "No se encontraron registros de asistencia bajo este filtro."}
                      </td>
                    </tr>
                  ) : (
                    asistenciasPaginadas.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-gray-900 font-mono">
                          {a.fecha}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Mes {a.periodo || 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={"inline-block px-3 py-0.5 rounded-xl text-xs font-black uppercase " + (
                            a.estado === "PRESENTE" ? "bg-emerald-100 text-emerald-800" :
                            a.estado === "AUSENTE" ? "bg-rose-100 text-rose-800" :
                            a.estado === "TARDANZA" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          )}>
                            {a.estado}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-600 font-medium">
                          {a.observaciones || a.atencion_recepcion || "--"}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {a.estado === "AUSENTE" && (
                            <button
                              type="button"
                              onClick={async () => {
                                const motivo = prompt("Ingrese el motivo o certificado médico de la justificación:", "Certificado Médico Presentado");
                                if (motivo) {
                                  await justificarInasistenciaEstudiante(a.id, "EXCUSADO", motivo);
                                  router.refresh();
                                }
                              }}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Excusar Falta
                            </button>
                          )}
                          {a.estado === "EXCUSADO" && (
                            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                              Justificada ✔
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginador Compacto (8 por página) */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-gray-500 font-medium">
                  Mostrando página <strong>{paginaAsist}</strong> de <strong>{totalPaginas}</strong> ({filtradas.length} registros en total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={paginaAsist === 1}
                    onClick={() => setPaginaAsist(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaAsist === totalPaginas}
                    onClick={() => setPaginaAsist(p => Math.min(totalPaginas, p + 1))}
                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      {/* 4. EDITAR DATOS DEL ALUMNO */}
      {activeTab === "editar" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-6">
          <div>
            <h3 className="font-black text-gray-900 text-base">Modificar Expediente del Alumno</h3>
            <p className="text-xs text-gray-500">
              Actualiza los datos personales, contacto del tutor o transfiere de curso al estudiante.
            </p>
          </div>

          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={editData.nombres}
                  onChange={e => setEditData({ ...editData, nombres: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={editData.apellidos}
                  onChange={e => setEditData({ ...editData, apellidos: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Curso / Aula Asignada *</label>
                <select
                  required
                  value={editData.curso_id}
                  onChange={e => setEditData({ ...editData, curso_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                >
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estado Académico</label>
                <select
                  value={editData.estado}
                  onChange={e => setEditData({ ...editData, estado: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                >
                  <option value="ACTIVO">ACTIVO (En clases)</option>
                  <option value="EGRESADO">EGRESADO (Graduado)</option>
                  <option value="INACTIVO">INACTIVO (Retirado / Pausado)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Tutor</label>
                <input
                  type="text"
                  value={editData.tutor_nombre}
                  onChange={e => setEditData({ ...editData, tutor_nombre: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Teléfono</label>
                <input
                  type="text"
                  value={editData.tutor_telefono}
                  onChange={e => setEditData({ ...editData, tutor_telefono: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico (Opcional)</label>
              <input
                type="email"
                value={editData.email}
                onChange={e => setEditData({ ...editData, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleEliminarEstudiante}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {deleting ? "Eliminando..." : "Eliminar Alumno"}
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {savingEdit ? "Guardando Cambios..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL OFICIAL: BOLETÍN ESCOLAR INSTITUCIONAL LISTO PARA IMPRIMIR O PDF */}
      {/* ========================================================================= */}
      {showBoletinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
            
            {/* Barra de Controles del Modal (Oculta al imprimir) */}
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">description</span>
                <span className="text-xs font-black uppercase tracking-wider">
                  Vista Previa del Boletín Oficial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Imprimir / Guardar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowBoletinModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* HOJA OFICIAL MEMBRETADA (Formato Report Card Escolar) */}
            <div className="p-8 sm:p-10 space-y-6 bg-white text-gray-900 font-sans print:p-6 print:m-0">
              
              {/* Encabezado Institucional */}
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                    Instituto Crossover
                  </h2>
                  <p className="text-xs font-bold text-gray-600">
                    Centro Comunitario & Academia de Idiomas y Tecnología
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    RNC: 4-30-00000-0 • Tel: (809) 592-0000 • info@crossover.edu.do
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-purple-900 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider mb-1">
                    Reporte Académico Oficial
                  </span>
                  <div className="font-mono text-xs font-bold text-gray-500">
                    Folio: {estudiante.matricula}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Fecha: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Ficha Formal del Alumno y Curso */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-400">Estudiante</span>
                  <strong className="text-gray-900 font-bold block">{estudiante.apellidos}, {estudiante.nombres}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-400">Matrícula</span>
                  <strong className="text-purple-900 font-bold font-mono">{estudiante.matricula}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-400">Curso / Programa</span>
                  <strong className="text-gray-900 font-bold">{estudiante.curso?.nombre || 'General'}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-400">Docente Titular</span>
                  <strong className="text-gray-900 font-bold">{estudiante.curso?.profesor?.nombre || 'Por Asignar'}</strong>
                </div>
              </div>

              {/* Matriz Académica Dinámica: Criterios por Periodo (1..N meses o módulos) */}
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-gray-200 pb-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">
                    Desglose de Calificaciones por Criterios Institucionales
                  </h4>
                  <span className="text-[10px] font-bold text-gray-500">
                    {estudiante.curso?.modalidad_evaluacion === 'MODULOS' ? 'Estructura Modular' : 'Evaluación Trimestral'} ({estudiante.curso?.total_periodos || 3} periodos)
                  </span>
                </div>

                {(() => {
                  const numPeriodos = estudiante.curso?.total_periodos && estudiante.curso.total_periodos > 0 ? estudiante.curso.total_periodos : 3;
                  const esMod = estudiante.curso?.modalidad_evaluacion === 'MODULOS';
                  const nombresCols = Array.isArray(estudiante.curso?.nombres_periodos) && estudiante.curso.nombres_periodos.length > 0
                    ? estudiante.curso.nombres_periodos
                    : Array.from({ length: numPeriodos }, (_, i) => esMod ? `Módulo ${i + 1}` : `Mes ${i + 1}`);

                  return (
                    <div className="border border-gray-300 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600 border-b border-gray-300">
                            <th className="py-2.5 px-3">Criterio de Evaluación</th>
                            <th className="py-2.5 px-2 text-center">Valor Máx.</th>
                            {Array.from({ length: numPeriodos }, (_, i) => i + 1).map(pNum => (
                              <th key={pNum} className="py-2.5 px-3 text-center whitespace-nowrap">
                                {nombresCols[pNum - 1] || (esMod ? `Módulo ${pNum}` : `Mes ${pNum}`)}
                              </th>
                            ))}
                            <th className="py-2.5 px-3 text-right">Promedio Criterio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-800">
                          {(estudiante.curso?.criterios || []).length === 0 ? (
                            <tr>
                              <td colSpan={numPeriodos + 3} className="py-6 text-center text-gray-400 font-bold">
                                No hay criterios configurados para este curso.
                              </td>
                            </tr>
                          ) : (
                            (estudiante.curso?.criterios || []).map((crit: any) => {
                              const maxPts = Number(crit.porcentaje) || 20;

                              const notasPeriodos = Array.from({ length: numPeriodos }, (_, i) => {
                                const pNum = i + 1;
                                const match = calificacionesRaw.find((c: any) => c.criterio_id === crit.id && (c.periodo || 1) === pNum);
                                let val = match ? Number(match.nota !== undefined && match.nota !== null ? match.nota : match.calificacion) : null;
                                if (val !== null && val > maxPts) {
                                  val = Math.round(((val * maxPts) / 100) * 10) / 10;
                                }
                                return val;
                              });

                              const notasValidas = notasPeriodos.filter(v => v !== null) as number[];
                              const promCrit = notasValidas.length > 0 
                                ? Math.round((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length) * 10) / 10 
                                : null;

                              return (
                                <tr key={crit.id} className="hover:bg-gray-50/50">
                                  <td className="py-2.5 px-3 font-bold text-gray-900">{crit.nombre}</td>
                                  <td className="py-2.5 px-2 text-center font-bold text-gray-500">{maxPts} pts</td>
                                  {notasPeriodos.map((val, pIdx) => (
                                    <td key={pIdx} className="py-2.5 px-3 text-center font-mono font-bold">
                                      {val !== null ? `${val} pts` : '--'}
                                    </td>
                                  ))}
                                  <td className="py-2.5 px-3 text-right font-black text-gray-900">
                                    {promCrit !== null ? `${promCrit} / ${maxPts}` : '--'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-black border-t-2 border-gray-300 text-xs">
                            <td className="py-2.5 px-3 uppercase text-gray-900">Total Acumulado del Periodo</td>
                            <td className="py-2.5 px-2 text-center text-gray-600">100 pts</td>
                            {Array.from({ length: numPeriodos }, (_, i) => i + 1).map(pNum => {
                              const totP = calcularTotalPeriodo(pNum);
                              return (
                                <td key={pNum} className="py-2.5 px-3 text-center font-mono text-purple-900">
                                  {totP !== null ? `${totP} pts` : '--'}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 text-right text-purple-950 font-black text-sm">
                              {metricas.notaPonderada} / 100
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Cuadro de Resumen Académico y Condición Final */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-gray-300 bg-gray-50">
                <div className="text-center sm:text-left">
                  <span className="block text-[10px] font-black uppercase text-gray-400">Promedio General</span>
                  <strong className="text-2xl font-black text-purple-950 font-mono">
                    {metricas.notaPonderada}
                    <span className="text-xs text-gray-500 font-normal"> / 100 pts</span>
                  </strong>
                </div>

                <div className="text-center sm:text-left">
                  <span className="block text-[10px] font-black uppercase text-gray-400">Asistencia Global</span>
                  <strong className="text-2xl font-black text-emerald-800 font-mono">
                    {metricas.pctAsistencia}%
                  </strong>
                  <span className="block text-[10px] text-gray-500">
                    ({metricas.presentes} de {metricas.totalClases} clases)
                  </span>
                </div>

                <div className="text-center sm:text-right">
                  <span className="block text-[10px] font-black uppercase text-gray-400">Condición Académica</span>
                  <span className={"inline-block text-xs font-black uppercase px-3 py-1 rounded-md mt-1 border " + (aprobado ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300')}>
                    {aprobado ? '✅ Acreditado / Promovido' : '⏳ Cursando Nivel'}
                  </span>
                </div>
              </div>

              {/* Escala Institucional y Observaciones */}
              <div className="text-[10px] text-gray-500 space-y-1 border-t border-gray-200 pt-3">
                <p>
                  <strong>Escala de Calificación Oficial:</strong> 90 - 100 (Excelente) • 80 - 89 (Muy Bueno) • 70 - 79 (Aprobatorio) • Menor a 70 (Reprobado / Refuerzo).
                </p>
                <p>
                  * Requisito de Acreditación Institucional: Promedio mínimo de 70 puntos y 80% de asistencia obligatoria.
                </p>
              </div>

              {/* Firmas y Sellos Institucionales */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                <div>
                  <div className="border-b border-gray-900 mx-4 mb-2"></div>
                  <strong className="block text-gray-900 font-bold">Profesor(a) Titular</strong>
                  <span className="text-[10px] text-gray-500">{estudiante.curso?.profesor?.nombre || 'Docente Responsable'}</span>
                </div>
                <div>
                  <div className="border-b border-gray-900 mx-4 mb-2"></div>
                  <strong className="block text-gray-900 font-bold">Dirección Académica</strong>
                  <span className="text-[10px] text-gray-500">Sello y Firma Oficial</span>
                </div>
                <div>
                  <div className="border-b border-gray-900 mx-4 mb-2"></div>
                  <strong className="block text-gray-900 font-bold">Padre / Tutor</strong>
                  <span className="text-[10px] text-gray-500">Firma de Recibido</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

          {/* ========================================================================= */}
      {/* MODAL IMPRIMIBLE: BITÁCORA OFICIAL DE ASISTENCIA PARA PADRES / TUTORES */}
      {/* ========================================================================= */}
      {showBitacoraPadresModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
            {/* Header del Modal - Solo visible en pantalla */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-purple-400">print</span>
                <div>
                  <h3 className="font-bold text-sm">Vista Previa: Bitácora de Asistencias para Tutor</h3>
                  <p className="text-[11px] text-purple-200">Documento oficial membretado con fechas de inasistencias</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white text-purple-950 hover:bg-purple-50 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Imprimir / Guardar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowBitacoraPadresModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Hoja Membretada Oficial Imprimible */}
            <div className="p-8 sm:p-12 text-gray-900 space-y-6 text-xs bg-white print:p-8">
              {/* Encabezado */}
              <div className="flex items-center justify-between border-b-2 border-purple-950 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950 flex items-center justify-center text-white font-black text-xl tracking-tighter">
                    C
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Instituto Crossover</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Dirección Académica • Registro Oficial de Control Escolar
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-purple-100 text-purple-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Bitácora de Asistencias
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Emitido: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Ficha del Alumno y Tutor */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <div>
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Estudiante</span>
                  <strong className="text-sm text-gray-900 block">{estudiante.apellidos}, {estudiante.nombres}</strong>
                  <span className="text-[10px] font-mono text-gray-500">Matrícula: {estudiante.matricula}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Padre / Tutor Responsable</span>
                  <strong className="text-xs text-gray-900 block">{estudiante.tutor_nombre || "No especificado"}</strong>
                  <span className="text-[10px] text-gray-500">Teléfono: {estudiante.tutor_telefono || "No registrado"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Curso / Programa</span>
                  <strong className="text-xs text-purple-950 block">{estudiante.curso?.nombre || "Curso General"}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Horario de Clases</span>
                  <span className="text-xs text-gray-700 font-medium">
                    {estudiante.curso?.hora_inicio || "09:00"} - {estudiante.curso?.hora_fin || "12:00"}
                  </span>
                </div>
              </div>

              {/* Balance General de Asistencia */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="border border-gray-200 p-3 rounded-xl bg-white">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Clases</span>
                  <span className="text-base font-black text-gray-800">{historialAsistencias.length}</span>
                </div>
                <div className="border border-emerald-200 p-3 rounded-xl bg-emerald-50/50">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block">Presentes</span>
                  <span className="text-base font-black text-emerald-800">
                    {historialAsistencias.filter((a: any) => a.estado === "PRESENTE").length}
                  </span>
                </div>
                <div className="border border-rose-200 p-3 rounded-xl bg-rose-50/50">
                  <span className="text-[9px] font-bold text-rose-700 uppercase block">Ausencias</span>
                  <span className="text-base font-black text-rose-800">
                    {historialAsistencias.filter((a: any) => a.estado === "AUSENTE").length}
                  </span>
                </div>
                <div className="border border-purple-200 p-3 rounded-xl bg-purple-50/50">
                  <span className="text-[9px] font-bold text-purple-700 uppercase block">% Acumulado</span>
                  <span className="text-base font-black text-purple-900">{metricas.pctAsistencia}%</span>
                </div>
              </div>

              {/* Desglose Detallado de Sesiones con Inasistencia o Tardanza */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                  Detalle Cronológico de Inasistencias y Observaciones
                </h4>
                {historialAsistencias.filter((a: any) => a.estado !== "PRESENTE").length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-emerald-900 font-bold text-xs">
                    ✔ El estudiante cuenta con asistencia perfecta (100% de asistencia a clases).
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-gray-100 text-gray-600 font-black text-[10px] uppercase border-b border-gray-300">
                        <tr>
                          <th className="py-2.5 px-3">Fecha de Falta / Tardanza</th>
                          <th className="py-2.5 px-3 text-center">Estado Oficial</th>
                          <th className="py-2.5 px-3">Observación Registrada / Soporte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {historialAsistencias
                          .filter((a: any) => a.estado !== "PRESENTE")
                          .map((a: any) => (
                            <tr key={a.id}>
                              <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">
                                {a.fecha}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={"inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase " + (
                                  a.estado === "AUSENTE" ? "bg-rose-100 text-rose-900" :
                                  a.estado === "TARDANZA" ? "bg-amber-100 text-amber-900" :
                                  "bg-blue-100 text-blue-900"
                                )}>
                                  {a.estado}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-700">
                                {a.observaciones || a.atencion_recepcion || "Inasistencia sin justificación médica presentada"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Nota Legal y Firmas */}
              <div className="pt-8 space-y-8">
                <p className="text-[10px] text-gray-500 text-justify leading-relaxed border-t border-gray-200 pt-3">
                  * Este documento es un extracto oficial del Sistema Escolar Automatizado del Instituto Crossover. El alumno debe mantener un mínimo de 80% de asistencia para tener derecho a evaluación final y certificación académica.
                </p>

                <div className="grid grid-cols-2 gap-12 pt-6">
                  <div className="text-center border-t border-gray-400 pt-2">
                    <strong className="block text-xs text-gray-900 uppercase">Dirección Académica</strong>
                    <span className="text-[10px] text-gray-400">Firma y Sello Oficial</span>
                  </div>
                  <div className="text-center border-t border-gray-400 pt-2">
                    <strong className="block text-xs text-gray-900 uppercase">Tutor / Representante</strong>
                    <span className="text-[10px] text-gray-400">Firma de Notificación Recibida</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
