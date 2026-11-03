"use client";
import React, { useState, useEffect } from "react";
import { getAuditoriaAsistenciasDirector } from "@/app/actions/asistencia";

export default function AsistenciaDirectorPage() {
  const [data, setData] = useState<any>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);

  useEffect(() => {
    loadAuditoria(fecha);
  }, [fecha]);

  async function loadAuditoria(f: string) {
    setLoading(true);
    const res = await getAuditoriaAsistenciasDirector(f);
    setData(res);
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Supervisión de Dirección
            </span>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Auditoría de Asistencias del Instituto
          </h1>
          <p className="text-gray-500 font-medium">
            Control en vivo: supervisa qué maestros pasaron lista hoy y el porcentaje de asistencia de cada aula.
          </p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 p-2 rounded-2xl shadow-sm">
          <span className="material-symbols-outlined text-gray-400 pl-2">calendar_month</span>
          <input 
            type="date" 
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="text-sm font-bold text-gray-800 bg-transparent focus:outline-none pr-3"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin mb-2">progress_activity</span>
          <p className="text-gray-500 font-medium">Calculando métricas de asistencia...</p>
        </div>
      ) : !data ? (
        <p className="text-red-500 font-bold">Error cargando auditoría de asistencias.</p>
      ) : (
        <>
          {/* Top KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Promedio Asistencia</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">{data.kpis.promedioGeneral}%</span>
                <span className="text-xs font-bold text-gray-400">Hoy</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Alumnos Presentes</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600">{data.kpis.totalPresentesHoy}</span>
                <span className="text-xs font-bold text-gray-400">estudiantes</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ausencias del Día</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-red-600">{data.kpis.totalAusenciasHoy}</span>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Por Filtrar</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Cursos Activos</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{data.kpis.totalCursos}</span>
                <span className="text-xs font-bold text-gray-400">aulas</span>
              </div>
            </div>
          </div>

          {/* Table of Courses Attendance Status */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-black text-gray-900">Estado de Pase de Lista por Clase</h3>
              <span className="text-xs text-gray-500 font-medium">Fecha evaluada: {fecha}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/30 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Curso / Materia</th>
                    <th className="py-4 px-6">Profesor Titular</th>
                    <th className="py-4 px-6 text-center">Estado de Lista</th>
                    <th className="py-4 px-6 text-center">Presentes</th>
                    <th className="py-4 px-6 text-center">Ausentes</th>
                    <th className="py-4 px-6 text-center">% Asistencia</th>
                    <th className="py-4 px-6 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.resumenCursos.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-900">{c.nombre}</p>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{c.tipo}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-700">
                        {c.profesor ? c.profesor.nombre : "Sin asignar"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {c.listaTomada ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lista Tomada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Pendiente por Maestro
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-emerald-600">
                        {c.presentes}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-red-600">
                        {c.ausentes}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-black text-gray-900">{c.porcentajeAsistencia}%</span>
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${c.porcentajeAsistencia >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${c.porcentajeAsistencia}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => setSelectedCurso(c)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-lg transition-all"
                        >
                          Ver Lista
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Detalle de Alumnos de ese curso */}
          {selectedCurso && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{selectedCurso.nombre}</h3>
                    <p className="text-xs text-gray-400">Pase de lista del {fecha}</p>
                  </div>
                  <button onClick={() => setSelectedCurso(null)} className="text-gray-400 hover:text-gray-700">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                  {(!selectedCurso.detalleEstudiantes || selectedCurso.detalleEstudiantes.length === 0) ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      El profesor no ha registrado asistencia en esta fecha.
                    </div>
                  ) : (
                    selectedCurso.detalleEstudiantes.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs font-bold">
                        <div>
                          <p className="text-gray-900">{a.estudiante?.nombres} {a.estudiante?.apellidos}</p>
                          <span className="text-[10px] text-gray-400 font-normal">Matrícula: {a.estudiante?.matricula}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-black ${
                          a.estado === 'PRESENTE' ? 'bg-emerald-100 text-emerald-700' :
                          a.estado === 'AUSENTE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {a.estado}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => setSelectedCurso(null)} 
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
