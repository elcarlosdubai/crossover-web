"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDirectorDashboardMetrics } from "@/app/actions/directorDashboard";
import { getDetalleCursoDocente } from "@/app/actions/docente";

import { createClient } from "@/utils/supabase/client";
import { getCursosDocente } from "@/app/actions/docente";

export default function DashboardHome() {
  const [userRole, setUserRole] = useState<string>("admin");
  const [userNombre, setUserNombre] = useState<string>("");
  const [teacherCursos, setTeacherCursos] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal táctil para inspección inmediata de un aula
  const [selectedCursoModal, setSelectedCursoModal] = useState<any>(null);
  const [loadingAulaModal, setLoadingAulaModal] = useState(false);
  const [detalleAula, setDetalleAula] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase
          .from('perfiles_usuarios')
          .select('nombre, rol')
          .eq('id', user.id)
          .maybeSingle();

        const role = prof?.rol || (user.email?.includes('profesor') ? 'profesor' : user.email?.includes('director') ? 'director' : 'admin');
        setUserRole(role);
        setUserNombre(prof?.nombre || user.email?.split('@')[0] || "Profesor");

        if (role === 'profesor') {
          const list = await getCursosDocente(user.email || "", role);
          setTeacherCursos(list);
          setLoading(false);
          return;
        }
      }

      const metrics = await getDirectorDashboardMetrics();
      setData(metrics);
      setLoading(false);
    }
    load();
  }, []);

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

  // VISTA ESPECIALIZADA PARA EL PROFESOR (Panel Docente)
  if (userRole === "profesor") {
    const cleanNombre = userNombre.split('(')[0].trim();
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-12 px-1 sm:px-2">
        {/* Cabecera Docente */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 inline-block mb-1">
              Docente
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 tracking-tight">
              Bienvenido, {cleanNombre}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard/calificaciones?tab=asistencia"
              className="flex-1 sm:flex-initial text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
              Pasar Lista
            </Link>
            <Link
              href="/admin/dashboard/calificaciones?tab=calificaciones"
              className="flex-1 sm:flex-initial text-center bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Calificaciones
            </Link>
          </div>
        </div>

        {/* Tarjetas de Acceso Rápido del Profesor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Mis Cursos Asignados</span>
              <span className="text-2xl font-black text-gray-900">{teacherCursos.length}</span>
              <span className="text-xs text-gray-500 ml-1 font-bold">grupos</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Pase de Lista Hoy</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                Habilitado en 1 Tap
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-2xl">assignment</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Evaluación Trimestral</span>
              <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                3 Períodos Oficiales
              </span>
            </div>
          </div>
        </div>

        {/* Listado de Clases del Docente */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-black text-gray-900 text-sm sm:text-base">Mis Aulas y Grupos de Clases</h2>
            <span className="text-xs text-gray-500 font-bold">{teacherCursos.length} cursos activos</span>
          </div>

          {teacherCursos.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">school</span>
              <p className="font-bold">No tienes cursos asignados actualmente.</p>
              <p className="text-xs text-gray-400 mt-1">Dirección Académica te asignará grupos próximamente.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {teacherCursos.map(c => (
                <div key={c.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {c.tipo}
                      </span>
                      <span className="text-xs text-gray-400 font-bold">
                        {c.hora_inicio ? `${c.hora_inicio.slice(0, 5)} - ${c.hora_fin.slice(0, 5)}` : "Horario regular"}
                      </span>
                    </div>
                    <h3 className="font-black text-gray-900 text-base sm:text-lg">{c.nombre}</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Criterios configurados por Dirección: {c.criterios?.length || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/dashboard/calificaciones?tab=asistencia`}
                      className="flex-1 sm:flex-initial text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black py-2.5 px-4 rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">fact_check</span>
                      Pasar Lista
                    </Link>
                    <Link
                      href={`/admin/dashboard/calificaciones?tab=calificaciones`}
                      className="flex-1 sm:flex-initial text-center bg-gray-900 hover:bg-black text-white text-xs font-black py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      Poner Notas
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/admin/dashboard/asistencia"
            className="flex-1 sm:flex-initial text-center bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            Auditar Asistencias
          </Link>
          <Link
            href="/admin/dashboard/estudiantes"
            className="flex-1 sm:flex-initial text-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Alumnos
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

          {/* 3. Supervisión por Aula (Tarjeta táctil por curso para celular y tablet) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 text-sm sm:text-base">Aulas y Clases en Curso</h3>
                <p className="text-xs text-gray-500 font-medium">Toca cualquier aula para ver su lista en vivo.</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                En vivo
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {data?.cumplimientoAulas?.map((aula: any) => (
                <div
                  key={aula.id}
                  onClick={() => abrirInspeccionAula(aula)}
                  className="p-4 sm:p-5 hover:bg-gray-50/80 active:bg-gray-100 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Info Aula y Profesor */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      aula.listaTomada ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
                        {aula.listaTomada ? 'check_circle' : 'pending'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{aula.nombre}</h4>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                          {aula.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-gray-400">person</span>
                        Prof: <strong className="text-gray-800">{aula.profesor}</strong>
                        {aula.hora_inicio && (
                          <span className="text-gray-400 ml-1">({aula.hora_inicio} - {aula.hora_fin})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Estado y Acción */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        aula.listaTomada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {aula.listaTomada ? `${aula.porcentaje}% Presentes` : 'Lista Pendiente'}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-bold mt-0.5">
                        {aula.presentes} presentes · {aula.ausencias} ausentes
                      </span>
                    </div>

                    <button 
                      type="button"
                      className="bg-primary/10 text-primary hover:bg-primary/20 p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0"
                    >
                      <span className="hidden sm:inline">Inspeccionar</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
