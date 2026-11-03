"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  getEstudiantesDirector, 
  createEstudiante, 
  updateEstudiante,
  deleteEstudiante,
  seedEstudiantesDemoSiVacio,
  getExpedienteCompletoEstudiante 
} from "@/app/actions/estudiantes";
import { getCursos } from "@/app/actions/cursos";

export default function GestorEstudiantesPage() {
  const router = useRouter();
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Estado para la Ficha / Plantilla Individual del Estudiante (Modal Tablet)
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string | null>(null);
  const [expediente, setExpediente] = useState<any>(null);
  const [loadingExpediente, setLoadingExpediente] = useState(false);
  const [activeFichaTab, setActiveFichaTab] = useState<"resumen" | "calificaciones" | "asistencia" | "editar">("resumen");

  // Formulario de edición rápida dentro de la ficha
  const [editData, setEditData] = useState({
    nombres: "",
    apellidos: "",
    curso_id: "",
    tutor_nombre: "",
    tutor_telefono: "",
    email: "",
    estado: "ACTIVO"
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Formulario nuevo estudiante
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    curso_id: "",
    tutor_nombre: "",
    tutor_telefono: "",
    email: ""
  });

  useEffect(() => {
    loadData();
  }, [filtroCurso]);

  async function loadData() {
    setLoading(true);
    const [estData, curData] = await Promise.all([
      getEstudiantesDirector(filtroCurso),
      getCursos()
    ]);
    setEstudiantes(estData);
    setCursos(curData);
    if (curData.length > 0 && !formData.curso_id) {
      setFormData(prev => ({ ...prev, curso_id: curData[0].id }));
    }
    setLoading(false);
  }

  const handleAbrirFicha = async (id: string) => {
    setSelectedEstudianteId(id);
    setActiveFichaTab("resumen");
    setLoadingExpediente(true);
    const res = await getExpedienteCompletoEstudiante(id);
    setExpediente(res);
    if (res?.estudiante) {
      setEditData({
        nombres: res.estudiante.nombres || "",
        apellidos: res.estudiante.apellidos || "",
        curso_id: res.estudiante.curso_id || "",
        tutor_nombre: res.estudiante.tutor_nombre || "",
        tutor_telefono: res.estudiante.tutor_telefono || "",
        email: res.estudiante.email || "",
        estado: res.estudiante.estado || "ACTIVO"
      });
    }
    setLoadingExpediente(false);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstudianteId) return;
    if (!editData.nombres.trim() || !editData.apellidos.trim()) {
      alert("Nombres y apellidos son requeridos.");
      return;
    }
    setSavingEdit(true);
    const res = await updateEstudiante(selectedEstudianteId, editData);
    if (res.success) {
      alert("✅ Datos del estudiante actualizados correctamente.");
      await loadData();
      const updatedExp = await getExpedienteCompletoEstudiante(selectedEstudianteId);
      setExpediente(updatedExp);
      setActiveFichaTab("resumen");
    } else {
      alert("Error actualizando: " + res.error);
    }
    setSavingEdit(false);
  };

  const handleEliminarEstudiante = async () => {
    if (!selectedEstudianteId || !expediente?.estudiante) return;
    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${expediente.estudiante.nombres} ${expediente.estudiante.apellidos}"?`);
    if (!confirm) return;

    setDeleting(true);
    const res = await deleteEstudiante(selectedEstudianteId);
    if (res.success) {
      alert("Estudiante eliminado correctamente.");
      setSelectedEstudianteId(null);
      setExpediente(null);
      await loadData();
    } else {
      alert("Error eliminando estudiante: " + res.error);
    }
    setDeleting(false);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos || !formData.curso_id) {
      alert("Por favor complete los campos requeridos.");
      return;
    }
    setSaving(true);
    const res = await createEstudiante(formData);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({
        nombres: "",
        apellidos: "",
        curso_id: cursos[0]?.id || "",
        tutor_nombre: "",
        tutor_telefono: "",
        email: ""
      });
      await loadData();
    } else {
      alert("Error creando estudiante: " + res.error);
    }
    setSaving(false);
  };

  const handleCopiarEnlace = (token: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/consulta/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filtrados = estudiantes.filter(e => {
    const query = busqueda.toLowerCase();
    const nombreCompleto = `${e.nombres} ${e.apellidos}`.toLowerCase();
    const matricula = (e.matricula || "").toLowerCase();
    const tutor = (e.tutor_nombre || "").toLowerCase();
    return nombreCompleto.includes(query) || matricula.includes(query) || tutor.includes(query);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header Compacto para Tablet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            Alumnado & Matrícula
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 tracking-tight mt-1">
            Gestor de Estudiantes
          </h1>
          <p className="text-xs text-gray-500 font-medium">Toca cualquier alumno para abrir su expediente personal y notas.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Matricular Alumno
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, matrícula o tutor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Curso:</span>
          <select
            value={filtroCurso}
            onChange={e => setFiltroCurso(e.target.value)}
            className="w-full md:w-auto bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
          >
            <option value="todos">Todos los Cursos</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Alumnos Táctil (Optimizado Tablet) */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin mb-2">progress_activity</span>
          <p className="text-gray-500 font-medium text-xs">Cargando lista de estudiantes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">school</span>
          <h3 className="font-bold text-gray-800 text-sm">No se encontraron estudiantes</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtrados.map(est => {
              const pct = est.metricas?.pctAsistencia ?? 100;
              const pctColor = pct >= 80 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50";

              return (
                <div
                  key={est.id}
                  onClick={() => router.push(`/admin/dashboard/estudiantes/${est.id}`)}
                  className="p-4 sm:p-5 hover:bg-gray-50/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-purple-200 transition-colors">
                      {est.nombres.charAt(0)}{est.apellidos.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/dashboard/estudiantes/${est.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-gray-900 text-sm hover:text-primary transition-colors hover:underline"
                        >
                          {est.nombres} {est.apellidos}
                        </Link>
                        <span className="font-mono text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {est.matricula}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {est.curso?.nombre || 'Sin curso'} · Tutor: <strong className="text-gray-700">{est.tutor_nombre || 'N/D'}</strong> ({est.tutor_telefono || ''})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${pctColor}`}>
                        {pct}% Asistencia
                      </span>
                      <span className="block text-[11px] text-gray-400 font-bold mt-0.5">
                        {est.metricas?.promedioNotas !== null ? `Nota: ${est.metricas?.promedioNotas} / 100` : 'Sin evaluar'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleCopiarEnlace(est.token_consulta, e)}
                        className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Copiar link para el padre"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedToken === est.token_consulta ? 'check' : 'share'}
                        </span>
                      </button>
                      <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FICHA / PLANTILLA INDIVIDUAL DEL ESTUDIANTE (EXPEDIENTE 360 COMPLETO) */}
      {/* ========================================================================= */}
      {selectedEstudianteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            
            {/* Cabecera Ficha 360 Premium */}
            <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-800/40">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/20 shrink-0">
                  {expediente?.estudiante?.nombres?.charAt(0)}{expediente?.estudiante?.apellidos?.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-white/10 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg backdrop-blur">
                      Expediente Académico 360
                    </span>
                    <span className="font-mono text-xs text-purple-200 bg-white/10 px-2 py-0.5 rounded-md font-bold">
                      {expediente?.estudiante?.matricula}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      expediente?.estudiante?.estado === 'INACTIVO' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    }`}>
                      {expediente?.estudiante?.estado || 'ACTIVO'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {expediente?.estudiante?.nombres} {expediente?.estudiante?.apellidos}
                  </h3>
                  <p className="text-xs text-purple-200/80 font-medium">
                    {expediente?.estudiante?.curso?.nombre || 'Sin curso asignado'} • {expediente?.estudiante?.curso?.tipo || 'General'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCopiarEnlace(expediente?.estudiante?.token_consulta)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10"
                  title="Enlace para que el tutor consulte en vivo"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  {copiedToken === expediente?.estudiante?.token_consulta ? '¡Copiado!' : 'Link Padre'}
                </button>
                <button 
                  onClick={() => { setSelectedEstudianteId(null); setExpediente(null); }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Pestañas de Navegación de la Ficha */}
            <div className="bg-gray-50 border-b border-gray-200/80 px-6 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFichaTab("resumen")}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeFichaTab === "resumen" 
                    ? "border-purple-600 text-purple-900 bg-white" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Resumen General
              </button>
              <button
                type="button"
                onClick={() => setActiveFichaTab("calificaciones")}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeFichaTab === "calificaciones" 
                    ? "border-purple-600 text-purple-900 bg-white" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grade</span>
                Récord de Calificaciones
              </button>
              <button
                type="button"
                onClick={() => setActiveFichaTab("asistencia")}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeFichaTab === "asistencia" 
                    ? "border-purple-600 text-purple-900 bg-white" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">event_available</span>
                Historial de Asistencia ({expediente?.historialAsistencias?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveFichaTab("editar")}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeFichaTab === "editar" 
                    ? "border-purple-600 text-purple-900 bg-white" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Editar Datos del Alumno
              </button>
            </div>

            {/* Contenido Dinámico de la Ficha */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingExpediente || !expediente ? (
                <div className="py-20 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl animate-spin mb-2 text-purple-600">progress_activity</span>
                  <p className="text-xs font-bold text-gray-600">Cargando expediente 360 del estudiante...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: RESUMEN GENERAL */}
                  {activeFichaTab === "resumen" && (
                    <div className="space-y-6">
                      {/* Métricas Principales */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 text-center">
                          <span className="text-[10px] font-black uppercase text-purple-700 block mb-1">Nota Final</span>
                          <span className={`text-3xl font-black ${
                            expediente.metricas.notaPonderada >= 70 ? 'text-purple-900' : 'text-red-600'
                          }`}>
                            {expediente.metricas.notaPonderada}
                          </span>
                          <span className="block text-[10px] text-purple-600 font-bold mt-0.5">
                            {expediente.metricas.notaPonderada >= 70 ? '✅ Aprobado' : '❌ Reprobado'}
                          </span>
                        </div>

                        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-[10px] font-black uppercase text-emerald-700 block mb-1">Asistencia</span>
                          <span className={`text-3xl font-black ${
                            expediente.metricas.pctAsistencia >= 80 ? 'text-emerald-700' : 'text-red-600'
                          }`}>
                            {expediente.metricas.pctAsistencia}%
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            {expediente.metricas.pctAsistencia >= 80 ? 'Cumple Mínimo (80%)' : 'Bajo Mínimo'}
                          </span>
                        </div>

                        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-center">
                          <span className="text-[10px] font-black uppercase text-blue-700 block mb-1">Clases Presente</span>
                          <span className="text-3xl font-black text-blue-900">
                            {expediente.metricas.presentes}
                          </span>
                          <span className="block text-[10px] text-blue-600 font-bold mt-0.5">
                            de {expediente.metricas.totalClases} impartidas
                          </span>
                        </div>

                        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 text-center">
                          <span className="text-[10px] font-black uppercase text-amber-700 block mb-1">Ausencias</span>
                          <span className="text-3xl font-black text-amber-900">
                            {expediente.metricas.ausencias}
                          </span>
                          <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                            {expediente.metricas.tardanzas} tardanzas
                          </span>
                        </div>
                      </div>

                      {/* Tarjetas de Información en 2 Columnas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Datos del Curso Actual */}
                        <div className="p-4 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="material-symbols-outlined text-purple-700 text-[18px]">school</span>
                            <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                              Aula y Docente Asignado
                            </h4>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Curso:</span>
                              <strong className="text-gray-900">{expediente.estudiante.curso?.nombre || 'N/D'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Programa:</span>
                              <strong className="text-purple-700">{expediente.estudiante.curso?.tipo || 'General'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Docente a cargo:</span>
                              <strong className="text-gray-900">{expediente.estudiante.curso?.profesor?.nombre || 'Docente asignado'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Horario:</span>
                              <strong className="text-gray-800">
                                {expediente.estudiante.curso?.hora_inicio || '09:00'} - {expediente.estudiante.curso?.hora_fin || '12:00'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Datos del Tutor y Contacto Directo */}
                        <div className="p-4 rounded-2xl border border-gray-200/80 bg-white space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-emerald-700 text-[18px]">contact_phone</span>
                              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                                Contacto de Tutor / Padre
                              </h4>
                            </div>
                            {expediente.estudiante.tutor_telefono && (
                              <a
                                href={`https://wa.me/1${expediente.estudiante.tutor_telefono.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                              >
                                <span className="material-symbols-outlined text-[13px]">chat</span>
                                WhatsApp Directo
                              </a>
                            )}
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Tutor Responsable:</span>
                              <strong className="text-gray-900">{expediente.estudiante.tutor_nombre || 'No registrado'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Teléfono:</span>
                              <strong className="text-emerald-700 font-mono">{expediente.estudiante.tutor_telefono || 'No registrado'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Correo Tutor:</span>
                              <strong className="text-gray-800">{expediente.estudiante.email || 'Sin correo'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Portal del Padre:</span>
                              <button
                                type="button"
                                onClick={() => handleCopiarEnlace(expediente.estudiante.token_consulta)}
                                className="text-purple-700 font-bold hover:underline"
                              >
                                Copiar Enlace Directo
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mini tabla de notas resumidas */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                            Récord Resumido por Criterios
                          </h4>
                          <button
                            type="button"
                            onClick={() => setActiveFichaTab("calificaciones")}
                            className="text-xs font-bold text-purple-700 hover:underline"
                          >
                            Ver desglose completo &rarr;
                          </button>
                        </div>
                        <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                              <tr>
                                <th className="py-2.5 px-4">Criterio Oficial</th>
                                <th className="py-2.5 px-4 text-center">Peso Ponderado</th>
                                <th className="py-2.5 px-4 text-right">Nota Asentada</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {expediente.criteriosConNotas?.map((c: any) => (
                                <tr key={c.id}>
                                  <td className="py-2.5 px-4 font-bold text-gray-800">{c.nombre}</td>
                                  <td className="py-2.5 px-4 text-center text-gray-500 font-bold">{c.porcentaje}%</td>
                                  <td className="py-2.5 px-4 text-right font-black">
                                    {c.calificacion !== null ? (
                                      <span className={c.calificacion >= 70 ? 'text-emerald-700' : 'text-red-600'}>
                                        {c.calificacion} / 100
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">--</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: RÉCORD DE CALIFICACIONES COMPLETO */}
                  {activeFichaTab === "calificaciones" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/70 flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-purple-950 text-sm">
                            Evaluación por Criterios Institucionales
                          </h4>
                          <p className="text-xs text-purple-800 font-medium mt-0.5">
                            Criterios aprobados por la Dirección Académica para {expediente.estudiante.curso?.nombre}.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-purple-700 block">Promedio Ponderado</span>
                          <span className="text-2xl font-black text-purple-950">{expediente.metricas.notaPonderada} / 100</span>
                        </div>
                      </div>

                      <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="py-3 px-4">Criterio de Evaluación</th>
                              <th className="py-3 px-4 text-center">Porcentaje (%)</th>
                              <th className="py-3 px-4 text-center">Nota Obtenida</th>
                              <th className="py-3 px-4 text-center">Puntos Ponderados</th>
                              <th className="py-3 px-4 text-right">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expediente.criteriosConNotas?.map((c: any) => {
                              const puntosAportados = c.calificacion !== null 
                                ? Math.round((Number(c.calificacion) * Number(c.porcentaje)) / 100 * 10) / 10 
                                : null;
                              const pasa = c.calificacion !== null && c.calificacion >= 70;

                              return (
                                <tr key={c.id} className="hover:bg-gray-50/60">
                                  <td className="py-3 px-4 font-bold text-gray-900">
                                    {c.nombre}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-gray-500">
                                    {c.porcentaje}%
                                  </td>
                                  <td className="py-3 px-4 text-center font-black">
                                    {c.calificacion !== null ? (
                                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                        pasa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}>
                                        {c.calificacion} / 100
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">Pendiente</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-purple-900">
                                    {puntosAportados !== null ? `${puntosAportados} pts` : '--'}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {c.calificacion !== null ? (
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                        pasa ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {pasa ? 'Aprobado' : 'Reprobado'}
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
                    </div>
                  )}

                  {/* TAB 3: HISTORIAL DE ASISTENCIA */}
                  {activeFichaTab === "asistencia" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-gray-900 text-sm">Registro Diario de Asistencias</h4>
                          <p className="text-xs text-gray-500 font-medium">
                            Historial completo de clases y pase de lista registrado por el profesor.
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                          expediente.metricas.pctAsistencia >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {expediente.metricas.pctAsistencia}% Asistencia Acumulada
                        </span>
                      </div>

                      <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="py-3 px-4">Fecha de Clase</th>
                              <th className="py-3 px-4 text-center">Condición de Asistencia</th>
                              <th className="py-3 px-4 text-center">Atención Recepción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expediente.historialAsistencias?.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="py-12 text-center text-gray-400 font-bold">
                                  No hay registros de asistencia asentados todavía para este estudiante.
                                </td>
                              </tr>
                            ) : (
                              expediente.historialAsistencias?.map((a: any) => (
                                <tr key={a.id} className="hover:bg-gray-50/60">
                                  <td className="py-3 px-4 font-bold text-gray-800 font-mono">
                                    {a.fecha}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                                      a.estado === 'PRESENTE' ? 'bg-emerald-100 text-emerald-800' :
                                      a.estado === 'AUSENTE' ? 'bg-red-100 text-red-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {a.estado}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center text-gray-500 font-medium">
                                    {a.atencion_recepcion && a.atencion_recepcion !== 'NINGUNA' ? (
                                      <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        {a.atencion_recepcion}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">--</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: EDITAR DATOS DEL ALUMNO */}
                  {activeFichaTab === "editar" && (
                    <form onSubmit={handleGuardarEdicion} className="space-y-4">
                      <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/70 text-xs text-purple-900 font-medium">
                        Actualiza la información personal, datos del tutor o transfiere de curso a este estudiante.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Nombres *</label>
                          <input
                            type="text"
                            required
                            value={editData.nombres}
                            onChange={e => setEditData({ ...editData, nombres: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos *</label>
                          <input
                            type="text"
                            required
                            value={editData.apellidos}
                            onChange={e => setEditData({ ...editData, apellidos: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
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
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
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
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
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
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Teléfono</label>
                          <input
                            type="text"
                            value={editData.tutor_telefono}
                            onChange={e => setEditData({ ...editData, tutor_telefono: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          value={editData.email}
                          onChange={e => setEditData({ ...editData, email: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleEliminarEstudiante}
                          disabled={deleting}
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-all flex items-center gap-1.5"
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
                  )}
                </>
              )}
            </div>

            {/* Footer Ficha */}
            <div className="p-4 bg-gray-50 border-t border-gray-200/80 flex items-center justify-between">
              <div className="text-[11px] text-gray-400 font-medium">
                Matrícula: <span className="font-mono font-bold text-gray-700">{expediente?.estudiante?.matricula}</span>
              </div>

              <button
                type="button"
                onClick={() => { setSelectedEstudianteId(null); setExpediente(null); }}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-all"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Matricular Estudiante */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Matricular Estudiante</h3>
                <p className="text-xs text-gray-500 font-medium">Asigna curso y datos de tutor.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Curso Asignado *</label>
                <select
                  required
                  value={formData.curso_id}
                  onChange={e => setFormData({ ...formData, curso_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                >
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tutor / Padre</label>
                  <input
                    type="text"
                    value={formData.tutor_nombre}
                    onChange={e => setFormData({ ...formData, tutor_nombre: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.tutor_telefono}
                    onChange={e => setFormData({ ...formData, tutor_telefono: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  {saving ? "Guardando..." : "Guardar Matrícula"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
