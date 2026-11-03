"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  getCursosDocente, 
  getDetalleCursoDocente, 
  guardarAsistenciaDocente, 
  guardarCalificacionesDocente 
} from "@/app/actions/docente";

import { useSearchParams } from "next/navigation";

export default function CalificacionesDocentePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "calificaciones" ? "calificaciones" : "asistencia";

  const [userRole, setUserRole] = useState<string>("profesor");
  const [userEmail, setUserEmail] = useState<string>("");
  const [cursos, setCursos] = useState<any[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>("");
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [detalle, setDetalle] = useState<any>(null);
  const [tab, setTab] = useState<"asistencia" | "calificaciones">(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "calificaciones" || t === "asistencia") {
      setTab(t);
    }
  }, [searchParams]);

  // Pestaña de Evaluación Mensual (Mes 1, Mes 2, Mes 3 o Resumen Final)
  const [mesActivo, setMesActivo] = useState<number | "resumen">(1);

  const [busquedaAlumnos, setBusquedaAlumnos] = useState<string>("");

  // Estados locales editables
  // Asistencia: { [estudianteId]: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' }
  const [asistenciaMap, setAsistenciaMap] = useState<Record<string, 'PRESENTE' | 'AUSENTE' | 'TARDANZA'>>({});
  // Calificaciones por Mes: { [`${estudianteId}_${criterioId}_mes${mesNum}`]: number }
  const [notasMap, setNotasMap] = useState<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data: prof } = await supabase
          .from('perfiles_usuarios')
          .select('rol')
          .eq('id', user.id)
          .maybeSingle();
        const role = prof?.rol || (user.email?.includes('director') ? 'director' : user.email?.includes('admin') ? 'admin' : 'profesor');
        setUserRole(role);

        const list = await getCursosDocente(user.email || "", role);
        setCursos(list);
        if (list.length > 0) {
          setSelectedCursoId(list[0].id);
        } else {
          setLoading(false);
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedCursoId) {
      loadCursoDetalle(selectedCursoId, fecha);
    }
  }, [selectedCursoId, fecha]);

  async function loadCursoDetalle(cursoId: string, f: string) {
    setLoading(true);
    const res = await getDetalleCursoDocente(cursoId, f);
    if (res) {
      setDetalle(res);

      // Pre-poblar mapa de asistencias
      const aMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'TARDANZA'> = {};
      res.estudiantes.forEach((est: any) => {
        const found = res.asistenciasHoy.find((a: any) => a.estudiante_id === est.id);
        aMap[est.id] = found ? found.estado : 'PRESENTE'; // Default PRESENTE para rapidez en 1 tap
      });
      setAsistenciaMap(aMap);

      // Pre-poblar mapa de calificaciones directamente de la base de datos con soporte de periodos
      const nMap: Record<string, number> = {};
      res.calificaciones.forEach((c: any) => {
        const n = Number(c.nota !== undefined && c.nota !== null ? c.nota : c.calificacion) || 0;
        const p = c.periodo || 1;
        nMap[`${c.estudiante_id}_${c.criterio_id}_mes${p}`] = n;
        if (p === 1) {
          nMap[`${c.estudiante_id}_${c.criterio_id}`] = n;
        }
      });

      setNotasMap(nMap);
    }
    setLoading(false);
  }

  // Marcar a todos presente con 1 tap
  const marcarTodosPresentes = () => {
    if (!detalle) return;
    const aMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'TARDANZA'> = {};
    detalle.estudiantes.forEach((est: any) => {
      aMap[est.id] = 'PRESENTE';
    });
    setAsistenciaMap(aMap);
  };

  const handleGuardarAsistencia = async () => {
    if (!detalle) return;
    setSaving(true);
    const registros = detalle.estudiantes.map((est: any) => ({
      estudiante_id: est.id,
      estado: asistenciaMap[est.id] || 'PRESENTE'
    }));

    const res = await guardarAsistenciaDocente(selectedCursoId, fecha, registros);
    if (res.success) {
      alert("✅ Pase de lista guardado con éxito. Recepción y Dirección pueden auditarlo en vivo.");
      await loadCursoDetalle(selectedCursoId, fecha);
    } else {
      alert("Error guardando lista: " + res.error);
    }
    setSaving(false);
  };

  const handleGuardarCalificaciones = async () => {
    if (!detalle) return;
    setSaving(true);

    // Guardar notas oficiales en la base de datos Supabase vinculadas al periodo/mes
    const mesNum = typeof mesActivo === "number" ? mesActivo : 1;
    const items: { estudiante_id: string; criterio_id: string; calificacion: number; periodo: number }[] = [];

    detalle.estudiantes.forEach((est: any) => {
      detalle.curso.criterios.forEach((crit: any) => {
        const keyMes = `${est.id}_${crit.id}_mes${mesNum}`;
        const keyGen = `${est.id}_${crit.id}`;
        const val = notasMap[keyMes] !== undefined ? notasMap[keyMes] : (mesNum === 1 ? notasMap[keyGen] : undefined);

        if (val !== undefined && val !== null && !isNaN(Number(val))) {
          items.push({
            estudiante_id: est.id,
            criterio_id: crit.id,
            calificacion: Number(val) || 0,
            periodo: mesNum
          });
        }
      });
    });

    const res = await guardarCalificacionesDocente(items);
    if (res.success) {
      alert(`✅ Calificaciones de Mes ${mesNum} guardadas correctamente en la nube.`);
      await loadCursoDetalle(selectedCursoId, fecha);
    } else {
      alert("Error guardando calificaciones: " + res.error);
    }
    setSaving(false);
  };

  // Calcular la nota ponderada de un estudiante en un mes específico (sobre 100, suma directa de criterios)
  const calcularNotaMes = (estudianteId: string, mesNum: number) => {
    if (!detalle?.curso?.criterios || detalle.curso.criterios.length === 0) return 0;
    let suma = 0;
    let hayNota = false;

    detalle.curso.criterios.forEach((crit: any) => {
      const key = `${estudianteId}_${crit.id}_mes${mesNum}`;
      const val = notasMap[key] !== undefined ? notasMap[key] : (mesNum === 1 ? notasMap[`${estudianteId}_${crit.id}`] : undefined);
      if (val !== undefined && val !== null && !isNaN(Number(val))) {
        hayNota = true;
        suma += Number(val);
      }
    });

    if (!hayNota) return null;
    return Math.round(suma * 10) / 10;
  };

  // Calcular el promedio general de todos los meses para la nota final
  // SOLO se aprueba si todos los meses del nivel han sido completados
  const calcularPromedioTotal = (estudianteId: string, totalMeses: number = 3) => {
    let sumaMeses = 0;
    let mesesConNota = 0;

    for (let m = 1; m <= totalMeses; m++) {
      const notaM = calcularNotaMes(estudianteId, m);
      if (notaM !== null) {
        sumaMeses += notaM;
        mesesConNota++;
      }
    }

    if (mesesConNota < totalMeses) return null;
    return Math.round((sumaMeses / totalMeses) * 10) / 10;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Limpio y Minimalista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 tracking-tight">
            {tab === "asistencia" ? "Pase de Lista Diario" : "Registro de Calificaciones"}
          </h1>
        </div>

        {/* Selector de Curso */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">Clase:</label>
          <select
            value={selectedCursoId}
            onChange={e => setSelectedCursoId(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:border-primary"
          >
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo}) {c.profesor ? `- Prof: ${c.profesor.nombre}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cursos.length === 0 && !loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">school</span>
          <h3 className="text-lg font-bold text-gray-800">No hay cursos asignados</h3>
          <p className="text-gray-500 text-sm mt-1">El Director debe crear cursos y asignarlos a este profesor.</p>
        </div>
      ) : loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin mb-2">progress_activity</span>
          <p className="text-gray-500 font-medium">Cargando lista de estudiantes del aula...</p>
        </div>
      ) : !detalle ? (
        <div className="text-red-500 font-bold p-8 bg-white rounded-2xl">Error cargando detalles del curso.</div>
      ) : (
        <>
          {/* Selector de Pestaña: Asistencia vs Calificaciones */}
          <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setTab("asistencia")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all shrink-0 ${
                tab === "asistencia"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">fact_check</span>
              Pase de Lista
              <span className="bg-primary/10 text-primary text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black">
                {detalle.estudiantes.length}
              </span>
            </button>

            <button
              onClick={() => setTab("calificaciones")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all shrink-0 ${
                tab === "calificaciones"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">assignment</span>
              Calificaciones
              <span className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black">
                {detalle.curso.criterios?.length || 0}
              </span>
            </button>
          </div>

          {/* TAB 1: PASE DE LISTA */}
          {tab === "asistencia" && (() => {
            const listaYaGuardada = detalle.asistenciasHoy && detalle.asistenciasHoy.length > 0;
            const estudiantesFiltrados = detalle.estudiantes.filter((e: any) => {
              if (!busquedaAlumnos.trim()) return true;
              const q = busquedaAlumnos.toLowerCase();
              return `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) || (e.matricula && e.matricula.toLowerCase().includes(q));
            });

            return (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden animate-fade-in-up">
                {/* Cabecera de Asistencia con Estado de Confirmación */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha:</span>
                      <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-800 focus:outline-none"
                      />
                      <button
                        onClick={marcarTodosPresentes}
                        className="text-xs font-bold text-primary hover:text-primary-hover bg-primary/10 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">done_all</span>
                        Todos Presentes (1 Tap)
                      </button>
                    </div>

                    {/* Sello de Auditoría: ¿Ya se guardó la lista hoy? */}
                    <div className="flex items-center gap-2">
                      {listaYaGuardada ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          ✅ Lista Guardada en Dirección
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          ⚠️ Pendiente de Confirmar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buscador Rápido de Alumno + Métricas de Presentes/Ausentes */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/50">
                    <div className="relative w-full sm:w-72">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                      <input
                        type="text"
                        value={busquedaAlumnos}
                        onChange={e => setBusquedaAlumnos(e.target.value)}
                        placeholder="Buscar alumno por nombre o matrícula..."
                        className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
                      />
                      {busquedaAlumnos && (
                        <button onClick={() => setBusquedaAlumnos("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        {Object.values(asistenciaMap).filter(v => v === 'PRESENTE').length} Presentes
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        {Object.values(asistenciaMap).filter(v => v === 'TARDANZA').length} Tardes
                      </span>
                      <span className="flex items-center gap-1.5 text-red-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        {Object.values(asistenciaMap).filter(v => v === 'AUSENTE').length} Ausentes
                      </span>
                    </div>
                  </div>
                </div>

                {estudiantesFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm">
                    {detalle.estudiantes.length === 0 ? "No hay estudiantes inscritos en esta aula." : "No se encontró ningún estudiante con ese nombre."}
                  </div>
                ) : (
                  <>
                    {/* VISTA MÓVIL (TARJETAS GRANDES TÁCTILES - PANTALLAS PEQUEÑAS) */}
                    <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
                      {estudiantesFiltrados.map((est: any) => {
                        const estadoActual = asistenciaMap[est.id] || 'PRESENTE';
                      return (
                        <div key={est.id} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-gray-900 text-base block leading-tight">{est.nombres} {est.apellidos}</span>
                              <span className="text-xs font-mono text-gray-400 font-bold">{est.matricula}</span>
                            </div>
                            {est.tutor_telefono && (
                              <a href={`tel:${est.tutor_telefono}`} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">call</span>
                                {est.tutor_telefono}
                              </a>
                            )}
                          </div>

                          {/* Botones de Estado Ergonómicos para Pulgar */}
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setAsistenciaMap({ ...asistenciaMap, [est.id]: 'PRESENTE' })}
                              className={`py-3 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                estadoActual === 'PRESENTE'
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsistenciaMap({ ...asistenciaMap, [est.id]: 'TARDANZA' })}
                              className={`py-3 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                estadoActual === 'TARDANZA'
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-amber-50'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                              Tarde
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsistenciaMap({ ...asistenciaMap, [est.id]: 'AUSENTE' })}
                              className={`py-3 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 active:scale-95 ${
                                estadoActual === 'AUSENTE'
                                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-500'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-50'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-red-400"></span>
                              Ausente
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* VISTA ESCRITORIO (TABLA TRADICIONAL) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Estudiante</th>
                          <th className="py-3.5 px-6">Tutor / Teléfono</th>
                          <th className="py-3.5 px-6 text-center">Estado de Asistencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {estudiantesFiltrados.map((est: any) => {
                          const estadoActual = asistenciaMap[est.id] || 'PRESENTE';
                          return (
                            <tr key={est.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-6">
                                <span className="font-bold text-gray-900 block">{est.nombres} {est.apellidos}</span>
                                <span className="text-xs font-mono text-gray-400 font-bold">{est.matricula}</span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="text-xs font-medium text-gray-700 block">{est.tutor_nombre || 'N/D'}</span>
                                <span className="text-xs text-gray-400">{est.tutor_telefono || ''}</span>
                              </td>
                              <td className="py-3.5 px-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAsistenciaMap({ ...asistenciaMap, [est.id]: 'PRESENTE' })}
                                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                      estadoActual === 'PRESENTE'
                                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-600/20'
                                        : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                  >
                                    Presente
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAsistenciaMap({ ...asistenciaMap, [est.id]: 'TARDANZA' })}
                                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                      estadoActual === 'TARDANZA'
                                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 ring-2 ring-amber-500/20'
                                        : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                                  >
                                    Tarde
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAsistenciaMap({ ...asistenciaMap, [est.id]: 'AUSENTE' })}
                                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                      estadoActual === 'AUSENTE'
                                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 ring-2 ring-red-600/20'
                                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                                    }`}
                                  >
                                    Ausente
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center sticky bottom-0 z-20 backdrop-blur-md bg-white/95 shadow-lg sm:shadow-none">
                <span className="text-xs text-gray-500 font-medium hidden sm:block">
                  Las ausencias son notificadas de inmediato al módulo de Recepción para contacto a tutores.
                </span>
                <button
                  type="button"
                  disabled={saving || detalle.estudiantes.length === 0}
                  onClick={handleGuardarAsistencia}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Confirmar Lista de Asistencia
                    </>
                  )}
                </button>
              </div>
            </div>
            );
          })()}

          {/* TAB 2: CALIFICACIONES MENSUALES Y PROMEDIO FINAL */}
          {tab === "calificaciones" && (() => {
            const estudiantesFiltradosCal = detalle.estudiantes.filter((e: any) => {
              if (!busquedaAlumnos.trim()) return true;
              const q = busquedaAlumnos.toLowerCase();
              return `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) || (e.matricula && e.matricula.toLowerCase().includes(q));
            });

            return (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden animate-fade-in-up">
              
              {/* Selector de Meses y Promedio Final */}
              <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/70 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-base">
                      {mesActivo === "resumen" 
                        ? "🏆 Sábana General y Promedio de Aprobación" 
                        : `Calificaciones Oficiales: Mes ${mesActivo}`}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {mesActivo === "resumen"
                        ? "Muestra las notas de los 3 meses y el promedio general definitivo."
                        : `Criterios: ${detalle.curso.criterios?.map((c: any) => `${c.nombre} (${c.porcentaje}%)`).join(", ") || "Sin criterios"}`}
                    </p>
                  </div>

                  {/* Botones de Meses */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm self-start md:self-auto overflow-x-auto max-w-full">
                    {[1, 2, 3].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMesActivo(m)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                          mesActivo === m 
                            ? "bg-gray-900 text-white shadow-sm" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        Mes {m}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setMesActivo("resumen")}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                        mesActivo === "resumen"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-amber-800 hover:bg-amber-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">grade</span>
                      Promedio Final
                    </button>
                  </div>
                </div>

                {/* Barra de Búsqueda Rápida para Calificaciones */}
                <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                    <input
                      type="text"
                      value={busquedaAlumnos}
                      onChange={e => setBusquedaAlumnos(e.target.value)}
                      placeholder="Buscar alumno para calificar..."
                      className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
                    />
                    {busquedaAlumnos && (
                      <button onClick={() => setBusquedaAlumnos("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-bold hidden sm:inline-block">
                    {detalle.estudiantes.length} alumnos en total
                  </span>
                </div>
              </div>

              {detalle.estudiantes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No hay estudiantes en el grupo.</div>
              ) : mesActivo === "resumen" ? (
                /* VISTA RESUMEN FINAL DE LOS 3 MESES */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Estudiante</th>
                        <th className="py-3.5 px-4 text-center">Mes 1 (100 pts)</th>
                        <th className="py-3.5 px-4 text-center">Mes 2 (100 pts)</th>
                        <th className="py-3.5 px-4 text-center">Mes 3 (100 pts)</th>
                        <th className="py-3.5 px-6 text-center font-black text-primary">Promedio General</th>
                        <th className="py-3.5 px-4 text-center font-black">Estado Oficial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {estudiantesFiltradosCal.map((est: any) => {
                        const m1 = calcularNotaMes(est.id, 1);
                        const m2 = calcularNotaMes(est.id, 2);
                        const m3 = calcularNotaMes(est.id, 3);
                        const promTotal = calcularPromedioTotal(est.id, 3);
                        const aprobado = promTotal !== null && promTotal >= 70;

                        return (
                          <tr key={est.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 px-6">
                              <span className="font-bold text-gray-900 block">{est.nombres} {est.apellidos}</span>
                              <span className="text-xs font-mono text-gray-400 font-bold">{est.matricula}</span>
                            </td>

                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              {m1 !== null ? (
                                <span className={m1 >= 70 ? "text-emerald-700" : "text-red-600"}>{m1}</span>
                              ) : (
                                <span className="text-gray-300">--</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              {m2 !== null ? (
                                <span className={m2 >= 70 ? "text-emerald-700" : "text-red-600"}>{m2}</span>
                              ) : (
                                <span className="text-gray-300">--</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              {m3 !== null ? (
                                <span className={m3 >= 70 ? "text-emerald-700" : "text-red-600"}>{m3}</span>
                              ) : (
                                <span className="text-gray-300">--</span>
                              )}
                            </td>

                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${
                                promTotal !== null 
                                  ? aprobado ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-700 bg-red-50 border border-red-200"
                                  : "text-gray-400 bg-gray-50"
                              }`}>
                                {promTotal !== null ? `${promTotal} / 100` : "Pendiente"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {promTotal !== null ? (
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                                  aprobado ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {aprobado ? "✅ Aprobado" : "❌ Reprobado"}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-bold">En curso</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* VISTA DE CAPTURA DEL MES SELECCIONADO (Mes 1, Mes 2, Mes 3) */
                <>
                  {/* VISTA MÓVIL: Tarjetas de Calificación por Alumno */}
                  <div className="block md:hidden p-3 space-y-4">
                    {estudiantesFiltradosCal.map((est: any) => {
                      const mesNum = typeof mesActivo === "number" ? mesActivo : 1;
                      const notaMes = calcularNotaMes(est.id, mesNum);
                      const finalColor = notaMes !== null && notaMes >= 70 
                        ? "text-emerald-700 bg-emerald-100/80 border-emerald-300" 
                        : notaMes !== null 
                        ? "text-red-700 bg-red-100/80 border-red-300" 
                        : "text-gray-400 bg-gray-100 border-gray-200";

                      return (
                        <div key={est.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <div>
                              <span className="font-bold text-gray-900 text-sm block leading-tight">{est.nombres} {est.apellidos}</span>
                              <span className="text-[11px] font-mono text-gray-400 font-bold">{est.matricula}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-black text-gray-400 block">Total Mes</span>
                              <span className={`inline-block px-2.5 py-0.5 rounded-lg font-black text-xs border ${finalColor}`}>
                                {notaMes !== null ? `${notaMes} / 100` : "--"}
                              </span>
                            </div>
                          </div>

                          {/* Rejilla de Criterios (Teclado numérico directo) */}
                          <div className="grid grid-cols-2 gap-2">
                            {detalle.curso.criterios?.map((crit: any) => {
                              const key = `${est.id}_${crit.id}_mes${mesNum}`;
                              const keyFallback = `${est.id}_${crit.id}`;
                              const val = notasMap[key] !== undefined 
                                ? notasMap[key] 
                                : (mesNum === 1 && notasMap[keyFallback] !== undefined ? notasMap[keyFallback] : "");

                              return (
                                <div key={crit.id} className="bg-gray-50 p-2 rounded-xl border border-gray-200/80 flex items-center justify-between">
                                  <div className="leading-tight">
                                    <span className="font-bold text-gray-800 text-xs block">{crit.nombre}</span>
                                    <span className="text-[10px] text-gray-400 font-bold">{crit.porcentaje} pts máx</span>
                                  </div>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    max={crit.porcentaje}
                                    value={val}
                                    onChange={e => {
                                      const num = Math.min(Number(crit.porcentaje), Math.max(0, Number(e.target.value)));
                                      setNotasMap({ ...notasMap, [key]: num });
                                    }}
                                    className="w-14 text-center bg-white border border-gray-300 rounded-lg py-1.5 focus:border-primary focus:outline-none font-black text-gray-900 text-sm shadow-xs"
                                    placeholder="0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* VISTA ESCRITORIO (TABLA) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Estudiante</th>
                          {detalle.curso.criterios?.map((c: any) => (
                            <th key={c.id} className="py-3.5 px-4 text-center">
                              <span className="block text-gray-800 font-bold">{c.nombre}</span>
                              <span className="text-[10px] text-gray-400 font-black">({c.porcentaje}%)</span>
                            </th>
                          ))}
                          <th className="py-3.5 px-6 text-center font-black text-primary">Nota Mes {mesActivo}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {estudiantesFiltradosCal.map((est: any) => {
                          const mesNum = typeof mesActivo === "number" ? mesActivo : 1;
                          const notaMes = calcularNotaMes(est.id, mesNum);
                          const finalColor = notaMes !== null && notaMes >= 70 
                            ? "text-emerald-600 bg-emerald-50" 
                            : notaMes !== null 
                            ? "text-red-600 bg-red-50" 
                            : "text-gray-400 bg-gray-50";

                          return (
                            <tr key={est.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-6">
                                <span className="font-bold text-gray-900 block">{est.nombres} {est.apellidos}</span>
                                <span className="text-xs font-mono text-gray-400 font-bold">{est.matricula}</span>
                              </td>

                              {detalle.curso.criterios?.map((crit: any) => {
                                const key = `${est.id}_${crit.id}_mes${mesNum}`;
                                const keyFallback = `${est.id}_${crit.id}`;
                                const val = notasMap[key] !== undefined 
                                  ? notasMap[key] 
                                  : (mesNum === 1 && notasMap[keyFallback] !== undefined ? notasMap[keyFallback] : "");

                                return (
                                  <td key={crit.id} className="py-3.5 px-4 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        max={crit.porcentaje}
                                        value={val}
                                        onChange={e => {
                                          const num = Math.min(Number(crit.porcentaje), Math.max(0, Number(e.target.value)));
                                          setNotasMap({ ...notasMap, [key]: num });
                                        }}
                                        className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-bold text-gray-800 text-sm"
                                        placeholder="0"
                                      />
                                      <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                        /{crit.porcentaje} pts
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}

                              <td className="py-3.5 px-6 text-center">
                                <span className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${finalColor}`}>
                                  {notaMes !== null ? `${notaMes} / 100` : "--"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {mesActivo !== "resumen" && (
                <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center sticky bottom-0 z-20 backdrop-blur-md bg-white/95 shadow-lg sm:shadow-none">
                  <span className="text-xs text-gray-500 font-medium hidden sm:block">
                    Asienta las notas de los criterios de este mes. El sistema calculará el promedio ponderado.
                  </span>
                  <button
                    type="button"
                    disabled={saving || detalle.estudiantes.length === 0}
                    onClick={handleGuardarCalificaciones}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        Guardando Mes {mesActivo}...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Guardar Calificaciones Mes {mesActivo}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
