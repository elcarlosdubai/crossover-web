"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getResumenCursosDocente,
  getDetalleCursoDocente,
  guardarAsistenciaDocente,
  guardarCalificacionesDocente,
  getObservacionesDocente,
  agregarObservacionDocente,
  solicitarSeguimientoRecepcion,
} from "@/app/actions/docente";
import {
  getSabanaAsistenciaCurso,
  guardarSabanaAsistencia,
} from "@/app/actions/asistencia";
import { getTodayRD } from "@/lib/dateRD";

interface ProfesorPortalProps {
  userEmail: string;
  userName: string;
  userRole: string;
}

type EstadoAsistencia = "PRESENTE" | "TARDANZA" | "AUSENTE" | "EXCUSADO";
type CourseTab = "lista" | "sabana" | "notas" | "estudiantes";
type SabanaFilter = "TODOS" | "FALTAS" | "RIESGO";

const DIAS_NOMBRE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getInitials(name: string) {
  const parts = (name || "").trim().split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "AL";
}

function formatDias(diasSemana?: number[]) {
  if (!Array.isArray(diasSemana) || diasSemana.length === 0) return "Horario regular";
  return diasSemana.map((d) => DIAS_NOMBRE[d]?.slice(0, 3) || "").filter(Boolean).join(", ");
}

export default function ProfesorPortal({ userEmail, userName, userRole }: ProfesorPortalProps) {
  const todayDayNum = new Date().getDay();
  const todayName = DIAS_NOMBRE[todayDayNum];
  const todayIso = getTodayRD();

  const [cursos, setCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [homeFilter, setHomeFilter] = useState<"HOY" | "TODOS">("HOY");
  const [homeSearch, setHomeSearch] = useState("");

  // Vista dentro del curso
  const [activeCursoId, setActiveCursoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CourseTab>("lista");
  const [courseSearch, setCourseSearch] = useState("");
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [cursoDetalle, setCursoDetalle] = useState<any>(null);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [listaFecha, setListaFecha] = useState(todayIso);
  const [asistenciaMap, setAsistenciaMap] = useState<Record<string, { estado: EstadoAsistencia; obs: string }>>({});
  const [savingLista, setSavingLista] = useState(false);

  // Sábana
  const nowDate = new Date();
  const [sabanaMes, setSabanaMes] = useState(nowDate.getMonth() + 1);
  const [sabanaAnio, setSabanaAnio] = useState(nowDate.getFullYear());
  const [sabanaData, setSabanaData] = useState<any>(null);
  const [loadingSabana, setLoadingSabana] = useState(false);
  const [sabanaFilter, setSabanaFilter] = useState<SabanaFilter>("TODOS");
  const [sabanaEdit, setSabanaEdit] = useState<{
    estudianteId: string;
    estudianteNombre: string;
    fecha: string;
    estado: EstadoAsistencia;
    obs: string;
  } | null>(null);

  // Calificaciones
  const [activePeriodo, setActivePeriodo] = useState(1);
  const [notasDraft, setNotasDraft] = useState<Record<string, Record<string, number>>>({});
  const [savingNotas, setSavingNotas] = useState(false);

  // Ficha Estudiante
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentObs, setStudentObs] = useState<any[]>([]);
  const [newObsText, setNewObsText] = useState("");
  const [savingObs, setSavingObs] = useState(false);

  // Toast
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" | "info" }[]>([]);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadCursos = async () => {
    setLoadingCursos(true);
    const data = await getResumenCursosDocente(userEmail, userRole);
    setCursos(data || []);
    setLoadingCursos(false);
  };

  useEffect(() => {
    loadCursos();
  }, [userEmail, userRole]);

  const courseTocaHoy = (c: any) => {
    if (!Array.isArray(c.dias_semana) || c.dias_semana.length === 0) return true;
    return c.dias_semana.includes(todayDayNum);
  };

  const cursosFiltrados = useMemo(() => {
    const q = homeSearch.toLowerCase().trim();
    return cursos.filter((c) => {
      const matchHoy = homeFilter === "TODOS" || courseTocaHoy(c);
      const matchQ =
        !q ||
        (c.nombre || "").toLowerCase().includes(q) ||
        formatDias(c.dias_semana).toLowerCase().includes(q);
      return matchHoy && matchQ;
    });
  }, [cursos, homeFilter, homeSearch]);

  const kpis = useMemo(() => {
    const hoyCursos = cursos.filter(courseTocaHoy);
    const pendientes = hoyCursos.filter((c) => !c.listaPasadaHoy).length;
    const ausenciasHoy = hoyCursos.reduce((acc, c) => acc + (c.ausenciasHoy || 0), 0);
    const totalEstudiantes = cursos.reduce((acc, c) => acc + (c.estudiantesCount || 0), 0);
    return {
      hoyCount: hoyCursos.length,
      totalCursos: cursos.length,
      pendientes,
      ausenciasHoy,
      totalEstudiantes,
    };
  }, [cursos]);

  // Cargar detalle de un curso
  const loadDetalleCurso = async (cursoId: string, fecha: string) => {
    setLoadingDetalle(true);
    const res = await getDetalleCursoDocente(cursoId, fecha);
    if (res) {
      setCursoDetalle(res.curso);
      setEstudiantes(res.estudiantes || []);

      const nextMap: Record<string, { estado: EstadoAsistencia; obs: string }> = {};
      (res.estudiantes || []).forEach((est: any) => {
        const match = (res.asistenciasHoy || []).find((a: any) => a.estudiante_id === est.id);
        nextMap[est.id] = {
          estado: (match?.estado as EstadoAsistencia) || "PRESENTE",
          obs: match?.observaciones || "",
        };
      });
      setAsistenciaMap(nextMap);

      // Mapear notas existentes por periodo
      const nDraft: Record<string, Record<string, number>> = {};
      (res.calificaciones || []).forEach((cal: any) => {
        const p = cal.periodo || 1;
        const key = `${cal.estudiante_id}::${p}`;
        if (!nDraft[key]) nDraft[key] = {};
        const val = cal.nota !== undefined && cal.nota !== null ? Number(cal.nota) : Number(cal.calificacion || 0);
        nDraft[key][cal.criterio_id] = val;
      });
      setNotasDraft(nDraft);
    }
    setLoadingDetalle(false);
  };

  const loadSabana = async (cursoId: string, anio: number, mes: number) => {
    setLoadingSabana(true);
    const res = await getSabanaAsistenciaCurso(cursoId, anio, mes);
    if (res?.success) {
      setSabanaData(res);
    } else {
      setSabanaData(null);
    }
    setLoadingSabana(false);
  };

  const enterCourse = async (cursoId: string, tab: CourseTab = "lista") => {
    setActiveCursoId(cursoId);
    setActiveTab(tab);
    setCourseSearch("");
    setActivePeriodo(1);
    setListaFecha(todayIso);
    await Promise.all([
      loadDetalleCurso(cursoId, todayIso),
      loadSabana(cursoId, sabanaAnio, sabanaMes),
    ]);
  };

  const goHome = () => {
    setActiveCursoId(null);
    setSelectedStudent(null);
    loadCursos();
  };

  const handleListaFechaChange = async (newDate: string) => {
    setListaFecha(newDate);
    if (activeCursoId) {
      await loadDetalleCurso(activeCursoId, newDate);
      showToast(`Lista cargada para ${newDate}`, "info");
    }
  };

  const handleMarkAllPresent = () => {
    setAsistenciaMap((prev) => {
      const next: Record<string, { estado: EstadoAsistencia; obs: string }> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { estado: "PRESENTE", obs: "" };
      });
      return next;
    });
    showToast("Todos marcados como Presente", "info");
  };

  const handleSaveAttendance = async () => {
    if (!activeCursoId) return;
    setSavingLista(true);
    const payload = estudiantes.map((est) => ({
      estudiante_id: est.id,
      estado: asistenciaMap[est.id]?.estado || "PRESENTE",
      observaciones: asistenciaMap[est.id]?.obs || undefined,
    }));

    const res = await guardarAsistenciaDocente(activeCursoId, listaFecha, payload);
    setSavingLista(false);
    if (res.success) {
      const aus = payload.filter((p) => p.estado === "AUSENTE").length;
      showToast(
        aus > 0
          ? `Lista guardada (${listaFecha}). ${aus} ausencia(s) enviadas a Recepción.`
          : `Lista de ${cursoDetalle?.nombre || "curso"} guardada.`,
        "success"
      );
      await loadSabana(activeCursoId, sabanaAnio, sabanaMes);
      await loadCursos();
    } else {
      showToast(res.error || "Error guardando asistencia", "error");
    }
  };

  const handleSaveSabanaCell = async () => {
    if (!sabanaEdit || !activeCursoId) return;
    const res = await guardarSabanaAsistencia(activeCursoId, [
      {
        estudiante_id: sabanaEdit.estudianteId,
        fecha: sabanaEdit.fecha,
        estado: sabanaEdit.estado,
        observaciones: sabanaEdit.obs || undefined,
      },
    ]);
    if (res.success) {
      showToast(`Asistencia de ${sabanaEdit.estudianteNombre} (${sabanaEdit.fecha}) actualizada.`, "success");
      setSabanaEdit(null);
      await loadSabana(activeCursoId, sabanaAnio, sabanaMes);
    } else {
      showToast(res.error || "No se pudo actualizar la celda", "error");
    }
  };

  const exportSabanaCSV = () => {
    if (!sabanaData) return;
    const headers = ["Matricula", "Estudiante", ...sabanaData.fechasClase, "Faltas", "% Asistencia"];
    const rows = (sabanaData.estudiantes || []).map((est: any) => {
      const cols = sabanaData.fechasClase.map((f: string) => est.registros[f]?.estado || "PENDIENTE");
      return [
        est.matricula,
        `"${est.nombres} ${est.apellidos}"`,
        ...cols,
        est.resumen?.ausentes || 0,
        `${est.resumen?.porcentaje ?? 100}%`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sabana-${cursoDetalle?.nombre || "curso"}.csv`;
    a.click();
    showToast("Sábana descargada en CSV.", "success");
  };

  // Cálculo de nota automática de asistencia y total
  const getStudentAsistenciaPct = (estId: string) => {
    const match = (sabanaData?.estudiantes || []).find((s: any) => s.id === estId);
    return match?.resumen?.porcentaje ?? 100;
  };

  const calcAutoAsistenciaPts = (estId: string, porcentaje: number) => {
    const pct = getStudentAsistenciaPct(estId);
    return Math.round((pct / 100) * porcentaje);
  };

  const calcStudentTotal = (estId: string, periodo: number) => {
    const criterios = cursoDetalle?.criterios || [];
    const draft = notasDraft[`${estId}::${periodo}`] || {};
    let total = 0;
    criterios.forEach((cr: any) => {
      if (cr.es_asistencia_automatica) {
        total += calcAutoAsistenciaPts(estId, Number(cr.porcentaje) || 0);
      } else {
        total += Number(draft[cr.id] || 0);
      }
    });
    return Math.round(total);
  };

  const handleGradeChange = (estId: string, criterioId: string, rawVal: string, maxPts: number) => {
    let val = parseFloat(rawVal);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > maxPts) val = maxPts;

    const key = `${estId}::${activePeriodo}`;
    setNotasDraft((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [criterioId]: val,
      },
    }));
  };

  const handleSaveGrades = async () => {
    if (!cursoDetalle) return;
    setSavingNotas(true);
    const criteriosManuales = (cursoDetalle.criterios || []).filter((c: any) => !c.es_asistencia_automatica);
    const payload: { estudiante_id: string; criterio_id: string; calificacion: number; periodo: number }[] = [];

    estudiantes.forEach((est) => {
      const draft = notasDraft[`${est.id}::${activePeriodo}`] || {};
      criteriosManuales.forEach((cr: any) => {
        if (draft[cr.id] !== undefined) {
          payload.push({
            estudiante_id: est.id,
            criterio_id: cr.id,
            calificacion: Number(draft[cr.id]),
            periodo: activePeriodo,
          });
        }
      });
    });

    if (payload.length === 0) {
      setSavingNotas(false);
      showToast("No hay notas modificadas para guardar.", "info");
      return;
    }

    const res = await guardarCalificacionesDocente(payload);
    setSavingNotas(false);
    if (res.success) {
      showToast(`Calificaciones del período ${activePeriodo} guardadas.`, "success");
    } else {
      showToast(res.error || "Error guardando calificaciones", "error");
    }
  };

  const openStudentDrawer = async (est: any) => {
    setSelectedStudent(est);
    setNewObsText("");
    const obs = await getObservacionesDocente(est.id);
    setStudentObs(obs || []);
  };

  const handleAddObs = async () => {
    if (!selectedStudent || !newObsText.trim()) return;
    setSavingObs(true);
    const nombreEst = `${selectedStudent.nombres} ${selectedStudent.apellidos}`.trim();
    const res = await agregarObservacionDocente(selectedStudent.id, nombreEst, userName, newObsText.trim());
    setSavingObs(false);
    if (res.success) {
      setNewObsText("");
      const obs = await getObservacionesDocente(selectedStudent.id);
      setStudentObs(obs || []);
      showToast("Observación guardada en ficha.", "success");
    } else {
      showToast(res.error || "No se pudo guardar la observación", "error");
    }
  };

  const handleSolicitarRecepcion = async () => {
    if (!selectedStudent || !cursoDetalle) return;
    const nombreEst = `${selectedStudent.nombres} ${selectedStudent.apellidos}`.trim();
    const res = await solicitarSeguimientoRecepcion(
      cursoDetalle.nombre,
      nombreEst,
      selectedStudent.tutor_telefono || "",
      userName,
      `Seguimiento solicitado por docente desde portal (${getStudentAsistenciaPct(selectedStudent.id)}% asistencia)`
    );
    if (res.success) {
      showToast(`Solicitud enviada a Recepción para ${nombreEst}.`, "success");
    } else {
      showToast(res.error || "Error al enviar solicitud", "error");
    }
  };

  const filteredEstudiantes = useMemo(() => {
    const q = courseSearch.toLowerCase().trim();
    if (!q) return estudiantes;
    return estudiantes.filter(
      (e) =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) ||
        (e.matricula || "").toLowerCase().includes(q) ||
        (e.tutor_nombre || "").toLowerCase().includes(q)
    );
  }, [estudiantes, courseSearch]);

  const periodosList = useMemo(() => {
    const total = Number(cursoDetalle?.total_periodos) || 3;
    const nombres = Array.isArray(cursoDetalle?.nombres_periodos) ? cursoDetalle.nombres_periodos : [];
    return Array.from({ length: total }, (_, idx) => ({
      num: idx + 1,
      label: nombres[idx] || `Período ${idx + 1}`,
    }));
  }, [cursoDetalle]);

  const gradesSummary = useMemo(() => {
    if (estudiantes.length === 0) return { avg: 0, aprobados: 0, riesgo: 0 };
    const totals = estudiantes.map((e) => calcStudentTotal(e.id, activePeriodo));
    const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
    const aprobados = totals.filter((t) => t >= 70).length;
    return { avg, aprobados, riesgo: totals.length - aprobados };
  }, [estudiantes, notasDraft, activePeriodo, sabanaData, cursoDetalle]);

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

      {!activeCursoId ? (
        /* ================= VISTA 1: MIS GRUPOS ================= */
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Clases de Hoy ({todayName})</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{kpis.hoyCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">De {kpis.totalCursos} grupos totales</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Listas Pendientes</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{kpis.pendientes}</p>
                <p className="text-[11px] text-slate-400 mt-1">Por pasar hoy</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Ausencias Hoy</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{kpis.ausenciasHoy}</p>
                <p className="text-[11px] text-slate-400 mt-1">Reportadas a Recepción</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Mis Estudiantes</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{kpis.totalEstudiantes}</p>
                <p className="text-[11px] text-slate-400 mt-1">Activos en aula</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {homeFilter === "HOY" ? `Mis Grupos de Hoy (${todayName})` : "Todos Mis Grupos"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {homeFilter === "HOY"
                    ? `Mostrando tus clases programadas para ${todayName.toLowerCase()}.`
                    : "Mostrando todos tus horarios asignados."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setHomeFilter("HOY")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      homeFilter === "HOY" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Hoy ({todayName})
                  </button>
                  <button
                    onClick={() => setHomeFilter("TODOS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      homeFilter === "TODOS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Todos mis grupos
                  </button>
                </div>

                <input
                  type="text"
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  placeholder="Buscar grupo o día..."
                  className="w-full sm:w-56 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {loadingCursos ? (
              <div className="p-10 text-center text-xs text-slate-500">Cargando tus grupos...</div>
            ) : cursosFiltrados.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  {homeFilter === "HOY"
                    ? `No tienes clases programadas para hoy (${todayName}).`
                    : "No se encontraron grupos."}
                </p>
                {homeFilter === "HOY" && cursos.length > 0 && (
                  <button
                    onClick={() => setHomeFilter("TODOS")}
                    className="text-xs font-bold text-slate-900 underline"
                  >
                    Ver todos mis grupos de la semana
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cursosFiltrados.map((c) => {
                  const tocaHoy = courseTocaHoy(c);
                  return (
                    <div
                      key={c.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div
                        className="space-y-2 min-w-0 cursor-pointer flex-1"
                        onClick={() => enterCourse(c.id, "lista")}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-rose-600 transition">
                            {c.nombre}
                          </h3>
                          {tocaHoy ? (
                            c.listaPasadaHoy ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                ✓ Lista pasada
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                Lista pendiente
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                              {formatDias(c.dias_semana)}
                            </span>
                          )}
                          {tocaHoy && c.ausenciasHoy > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                              {c.ausenciasHoy} ausencia(s)
                            </span>
                          )}
                          {tocaHoy && c.excusadosHoy > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
                              {c.excusadosHoy} excusado(s)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_month</span>
                            {formatDias(c.dias_semana)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                            {c.hora_inicio ? `${c.hora_inicio.slice(0, 5)} - ${c.hora_fin?.slice(0, 5) || ""}` : "Horario regular"}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                            {c.estudiantesCount || 0} estudiantes
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => enterCourse(c.id, "lista")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition"
                        >
                          Pasar Lista
                        </button>
                        <button
                          onClick={() => enterCourse(c.id, "sabana")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition"
                        >
                          Sábana
                        </button>
                        <button
                          onClick={() => enterCourse(c.id, "notas")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
                        >
                          Calificaciones
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        /* ================= VISTA 2: DENTRO DEL CURSO ================= */
        <>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={goHome}
                  className="mt-0.5 p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shrink-0"
                  title="Volver a Mis Grupos"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {cursoDetalle?.nombre || "Cargando..."}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>{formatDias(cursoDetalle?.dias_semana)}</span>
                    <span>
                      {cursoDetalle?.hora_inicio
                        ? `${cursoDetalle.hora_inicio.slice(0, 5)} - ${cursoDetalle.hora_fin?.slice(0, 5) || ""}`
                        : "Horario regular"}
                    </span>
                    <span className="font-semibold text-slate-700">{estudiantes.length} estudiantes</span>
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Buscar estudiante o matrícula..."
                className="w-full sm:w-64 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 overflow-x-auto">
              {(
                [
                  { id: "lista", label: "Pasar Lista", icon: "fact_check" },
                  { id: "sabana", label: "Sábana de Asistencia", icon: "table_chart" },
                  { id: "notas", label: "Calificaciones", icon: "edit_note" },
                  { id: "estudiantes", label: "Estudiantes", icon: "groups" },
                ] as { id: CourseTab; label: string; icon: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    activeTab === t.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loadingDetalle ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              Cargando estudiantes...
            </div>
          ) : (
            <>
              {/* TAB 1: PASAR LISTA */}
              {activeTab === "lista" && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <input
                        type="date"
                        value={listaFecha}
                        onChange={(e) => handleListaFechaChange(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs"
                      />
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                        P: {estudiantes.filter((e) => asistenciaMap[e.id]?.estado === "PRESENTE").length}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold">
                        T: {estudiantes.filter((e) => asistenciaMap[e.id]?.estado === "TARDANZA").length}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold">
                        A: {estudiantes.filter((e) => asistenciaMap[e.id]?.estado === "AUSENTE").length}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold">
                        E: {estudiantes.filter((e) => asistenciaMap[e.id]?.estado === "EXCUSADO").length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMarkAllPresent}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Todos Presente
                      </button>
                      <button
                        disabled={savingLista}
                        onClick={handleSaveAttendance}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs disabled:opacity-60"
                      >
                        {savingLista ? "Guardando..." : "Guardar Lista"}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[62vh] overflow-y-auto">
                    {filteredEstudiantes.map((est, idx) => {
                      const cur = asistenciaMap[est.id] || { estado: "PRESENTE" as EstadoAsistencia, obs: "" };
                      const pct = getStudentAsistenciaPct(est.id);
                      const minPct = Number(cursoDetalle?.minimo_asistencia_pct) || 75;
                      return (
                        <div key={est.id} className="px-4 py-2.5 hover:bg-slate-50/70 transition space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div
                              className="flex items-center gap-3 min-w-0 cursor-pointer"
                              onClick={() => openStudentDrawer(est)}
                            >
                              <span className="text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">
                                {idx + 1}
                              </span>
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                                {getInitials(`${est.nombres} ${est.apellidos}`)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:text-rose-600">
                                    {est.nombres} {est.apellidos}
                                  </p>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      pct < minPct ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">{est.matricula}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-1 shrink-0 pl-8 sm:pl-0">
                              {(
                                [
                                  { key: "PRESENTE", label: "Presente", short: "P", cls: "bg-emerald-600 text-white border-emerald-600" },
                                  { key: "TARDANZA", label: "Tardanza", short: "T", cls: "bg-amber-500 text-white border-amber-500" },
                                  { key: "AUSENTE", label: "Ausente", short: "A", cls: "bg-rose-600 text-white border-rose-600" },
                                  { key: "EXCUSADO", label: "Excusado", short: "E", cls: "bg-sky-600 text-white border-sky-600" },
                                ] as const
                              ).map((st) => (
                                <button
                                  key={st.key}
                                  onClick={() =>
                                    setAsistenciaMap((prev) => ({
                                      ...prev,
                                      [est.id]: {
                                        estado: st.key,
                                        obs: st.key === "EXCUSADO" ? prev[est.id]?.obs || "" : "",
                                      },
                                    }))
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                    cur.estado === st.key
                                      ? st.cls
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="hidden md:inline">{st.label}</span>
                                  <span className="md:hidden">{st.short}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {cur.estado === "EXCUSADO" && (
                            <div className="flex items-center gap-2 pl-8 sm:pl-11">
                              <span className="text-[11px] font-semibold text-sky-700 shrink-0">Motivo:</span>
                              <input
                                type="text"
                                value={cur.obs}
                                onChange={(e) =>
                                  setAsistenciaMap((prev) => ({
                                    ...prev,
                                    [est.id]: { ...prev[est.id], obs: e.target.value },
                                  }))
                                }
                                placeholder="Ej. Cita médica, permiso..."
                                className="flex-1 max-w-md px-2.5 py-1 text-xs border border-sky-200 bg-sky-50/50 rounded-lg focus:outline-none focus:border-sky-400"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: SÁBANA DE ASISTENCIA */}
              {activeTab === "sabana" && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={sabanaMes}
                        onChange={(e) => {
                          const m = Number(e.target.value);
                          setSabanaMes(m);
                          if (activeCursoId) loadSabana(activeCursoId, sabanaAnio, m);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                      >
                        {[
                          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
                        ].map((m, i) => (
                          <option key={m} value={i + 1}>{m} {sabanaAnio}</option>
                        ))}
                      </select>

                      <div className="inline-flex bg-slate-200/70 p-1 rounded-xl gap-1">
                        {(
                          [
                            { id: "TODOS", label: "Todos" },
                            { id: "FALTAS", label: "Con Ausencias" },
                            { id: "RIESGO", label: "En Riesgo" },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setSabanaFilter(f.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              sabanaFilter === f.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500">Clic en un cuadro para editar</span>
                      <button
                        onClick={exportSabanaCSV}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Descargar CSV
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Imprimir
                      </button>
                    </div>
                  </div>

                  {loadingSabana ? (
                    <div className="p-10 text-center text-xs text-slate-500">Cargando sábana...</div>
                  ) : !sabanaData || (sabanaData.fechasClase || []).length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-500">
                      No hay sesiones registradas para este mes.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[62vh]">
                      <table className="w-full text-left border-collapse min-w-[760px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3 sticky left-0 bg-slate-50 z-20"># · Estudiante</th>
                            {sabanaData.fechasClase.map((f: string) => (
                              <th key={f} className="px-2 py-3 text-center whitespace-nowrap">
                                {f.slice(5)}
                              </th>
                            ))}
                            <th className="px-3 py-3 text-center">Faltas</th>
                            <th className="px-4 py-3 text-right">% Asist.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {(sabanaData.estudiantes || [])
                            .filter((est: any) => {
                              const q = courseSearch.toLowerCase().trim();
                              const matchQ =
                                !q ||
                                `${est.nombres} ${est.apellidos}`.toLowerCase().includes(q) ||
                                (est.matricula || "").toLowerCase().includes(q);
                              if (!matchQ) return false;
                              if (sabanaFilter === "FALTAS") return (est.resumen?.ausentes || 0) > 0;
                              if (sabanaFilter === "RIESGO") {
                                return (est.resumen?.porcentaje ?? 100) < (Number(cursoDetalle?.minimo_asistencia_pct) || 75);
                              }
                              return true;
                            })
                            .map((est: any, idx: number) => {
                              const pct = est.resumen?.porcentaje ?? 100;
                              const minPct = Number(cursoDetalle?.minimo_asistencia_pct) || 75;
                              return (
                                <tr key={est.id} className="hover:bg-slate-50/80 transition">
                                  <td
                                    className="px-4 py-2.5 sticky left-0 bg-white cursor-pointer"
                                    onClick={() => openStudentDrawer(est)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-400 w-5">{idx + 1}</span>
                                      <div>
                                        <p className="font-bold text-slate-900 hover:text-rose-600">
                                          {est.nombres} {est.apellidos}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{est.matricula}</p>
                                      </div>
                                    </div>
                                  </td>
                                  {sabanaData.fechasClase.map((f: string) => {
                                    const reg = est.registros?.[f]?.estado || "PENDIENTE";
                                    const obs = est.registros?.[f]?.observaciones || "";
                                    if (reg === "FERIADO" || reg === "NO_MATRICULADO") {
                                      return (
                                        <td key={f} className="px-2 py-2.5 text-center text-[10px] text-slate-300">
                                          —
                                        </td>
                                      );
                                    }
                                    const badgeStyles: Record<string, string> = {
                                      PRESENTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                      TARDANZA: "bg-amber-50 text-amber-700 border-amber-200",
                                      AUSENTE: "bg-rose-50 text-rose-700 border-rose-200",
                                      EXCUSADO: "bg-sky-50 text-sky-700 border-sky-200",
                                      PENDIENTE: "bg-slate-50 text-slate-400 border-slate-200",
                                    };
                                    const shortMap: Record<string, string> = {
                                      PRESENTE: "P",
                                      TARDANZA: "T",
                                      AUSENTE: "A",
                                      EXCUSADO: "E",
                                      PENDIENTE: "·",
                                    };
                                    return (
                                      <td key={f} className="px-2 py-2.5 text-center">
                                        <button
                                          onClick={() =>
                                            setSabanaEdit({
                                              estudianteId: est.id,
                                              estudianteNombre: `${est.nombres} ${est.apellidos}`,
                                              fecha: f,
                                              estado: (reg === "PENDIENTE" ? "PRESENTE" : reg) as EstadoAsistencia,
                                              obs,
                                            })
                                          }
                                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-extrabold border hover:scale-110 transition ${
                                            badgeStyles[reg] || badgeStyles.PENDIENTE
                                          }`}
                                          title={obs || reg}
                                        >
                                          {shortMap[reg] || "·"}
                                        </button>
                                      </td>
                                    );
                                  })}
                                  <td
                                    className={`px-3 py-2.5 text-center font-bold ${
                                      (est.resumen?.ausentes || 0) > 0 ? "text-rose-600" : "text-slate-400"
                                    }`}
                                  >
                                    {est.resumen?.ausentes || 0}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                        pct < minPct
                                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                                          : "bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      {pct}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CALIFICACIONES */}
              {activeTab === "notas" && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {periodosList.map((p) => (
                        <button
                          key={p.num}
                          onClick={() => setActivePeriodo(p.num)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                            activePeriodo === p.num
                              ? "bg-slate-900 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs text-slate-600 font-medium">
                        Prom: <strong className="text-slate-900">{gradesSummary.avg}</strong> ·{" "}
                        <span className="text-emerald-700 font-bold">{gradesSummary.aprobados} aprob.</span> ·{" "}
                        <span className={gradesSummary.riesgo > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                          {gradesSummary.riesgo} riesgo
                        </span>
                      </span>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        Imprimir
                      </button>
                      <button
                        disabled={savingNotas}
                        onClick={handleSaveGrades}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs disabled:opacity-60"
                      >
                        {savingNotas ? "Guardando..." : "Guardar Notas"}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[62vh]">
                    <table className="w-full text-left border-collapse min-w-[680px]">
                      <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3"># · Estudiante</th>
                          {(cursoDetalle?.criterios || []).map((cr: any) => (
                            <th key={cr.id} className="px-3 py-3 text-center">
                              <div>{cr.nombre}</div>
                              <div
                                className={`text-[10px] font-medium ${
                                  cr.es_asistencia_automatica ? "text-sky-600" : "text-slate-400"
                                }`}
                              >
                                {cr.es_asistencia_automatica ? `Auto (${cr.porcentaje} pts)` : `Máx ${cr.porcentaje} pts`}
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredEstudiantes.map((est, idx) => {
                          const total = calcStudentTotal(est.id, activePeriodo);
                          const draft = notasDraft[`${est.id}::${activePeriodo}`] || {};
                          return (
                            <tr key={est.id} className="hover:bg-slate-50/70">
                              <td
                                className="px-4 py-2.5 cursor-pointer"
                                onClick={() => openStudentDrawer(est)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-400 w-5">{idx + 1}</span>
                                  <div>
                                    <p className="font-bold text-slate-900 hover:text-rose-600">
                                      {est.nombres} {est.apellidos}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{est.matricula}</p>
                                  </div>
                                </div>
                              </td>
                              {(cursoDetalle?.criterios || []).map((cr: any) => {
                                if (cr.es_asistencia_automatica) {
                                  const autoPts = calcAutoAsistenciaPts(est.id, Number(cr.porcentaje) || 0);
                                  return (
                                    <td key={cr.id} className="px-3 py-2.5 text-center">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-200/80">
                                        {autoPts} / {cr.porcentaje}
                                      </span>
                                    </td>
                                  );
                                }
                                const val = draft[cr.id] ?? "";
                                return (
                                  <td key={cr.id} className="px-3 py-2.5 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={cr.porcentaje}
                                      value={val}
                                      onChange={(e) =>
                                        handleGradeChange(est.id, cr.id, e.target.value, Number(cr.porcentaje) || 100)
                                      }
                                      className="w-16 text-center px-2 py-1.5 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                                    />
                                  </td>
                                );
                              })}
                              <td
                                className={`px-4 py-2.5 text-right font-extrabold ${
                                  total >= 70 ? "text-emerald-700" : "text-rose-600"
                                }`}
                              >
                                {total} pts
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: ESTUDIANTES */}
              {activeTab === "estudiantes" && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    Mostrando {filteredEstudiantes.length} de {estudiantes.length} estudiantes · Clic en cualquiera para ver su ficha
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 max-h-[62vh] overflow-y-auto">
                    {filteredEstudiantes.map((est, idx) => {
                      const pct = getStudentAsistenciaPct(est.id);
                      const total = calcStudentTotal(est.id, activePeriodo);
                      const minPct = Number(cursoDetalle?.minimo_asistencia_pct) || 75;
                      return (
                        <div
                          key={est.id}
                          onClick={() => openStudentDrawer(est)}
                          className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-400 hover:shadow-sm transition cursor-pointer bg-white flex items-start justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {getInitials(`${est.nombres} ${est.apellidos}`)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {idx + 1}. {est.nombres} {est.apellidos}
                              </p>
                              <p className="text-[11px] text-slate-500">{est.matricula}</p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                Tutor: {est.tutor_nombre || "No registrado"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <span
                              className={`block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pct < minPct ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {pct}% asist.
                            </span>
                            <span
                              className={`block text-[11px] font-extrabold ${
                                total >= 70 ? "text-slate-800" : "text-rose-600"
                              }`}
                            >
                              {total} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* MODAL EDITAR CELDA DE SÁBANA */}
      {sabanaEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Fecha: {sabanaEdit.fecha}
                </p>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{sabanaEdit.estudianteNombre}</h3>
              </div>
              <button onClick={() => setSabanaEdit(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "PRESENTE", label: "Presente (P)", cls: "bg-emerald-600 text-white border-emerald-600" },
                  { key: "TARDANZA", label: "Tardanza (T)", cls: "bg-amber-500 text-white border-amber-500" },
                  { key: "AUSENTE", label: "Ausente (A)", cls: "bg-rose-600 text-white border-rose-600" },
                  { key: "EXCUSADO", label: "Excusado (E)", cls: "bg-sky-600 text-white border-sky-600" },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSabanaEdit({ ...sabanaEdit, estado: o.key })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    sabanaEdit.estado === o.key
                      ? o.cls
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {sabanaEdit.estado === "EXCUSADO" && (
              <div>
                <label className="block text-[11px] font-semibold text-sky-700 mb-1">Motivo de excusa</label>
                <input
                  type="text"
                  value={sabanaEdit.obs}
                  onChange={(e) => setSabanaEdit({ ...sabanaEdit, obs: e.target.value })}
                  placeholder="Ej. Cita médica..."
                  className="w-full px-3 py-2 text-xs border border-sky-200 bg-sky-50/40 rounded-xl focus:outline-none"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setSabanaEdit(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSabanaCell}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                Aplicar cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER FICHA ESTUDIANTE */}
      {selectedStudent && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setSelectedStudent(null)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {getInitials(`${selectedStudent.nombres} ${selectedStudent.apellidos}`)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {selectedStudent.nombres} {selectedStudent.apellidos}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{selectedStudent.matricula}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-medium text-slate-500">Asistencia</p>
                  <p className="text-xl font-extrabold mt-0.5 text-slate-900">
                    {getStudentAsistenciaPct(selectedStudent.id)}%
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-medium text-slate-500">Nota Período {activePeriodo}</p>
                  <p className="text-xl font-extrabold mt-0.5 text-slate-900">
                    {calcStudentTotal(selectedStudent.id, activePeriodo)} pts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Datos de Contacto</h4>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  <div className="px-3.5 py-2.5 flex justify-between">
                    <span className="text-slate-500">Tutor / Responsable</span>
                    <span className="font-semibold text-slate-900">
                      {selectedStudent.tutor_nombre || "No registrado"}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 flex justify-between">
                    <span className="text-slate-500">Teléfono</span>
                    <span className="font-semibold text-slate-900">
                      {selectedStudent.tutor_telefono || "No registrado"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Observaciones del Profesor
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObsText}
                    onChange={(e) => setNewObsText(e.target.value)}
                    placeholder="Ej. Excelente participación..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                  />
                  <button
                    disabled={savingObs}
                    onClick={handleAddObs}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
                <div className="space-y-1.5">
                  {studentObs.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Sin observaciones registradas.</p>
                  ) : (
                    studentObs.map((o) => (
                      <div key={o.id} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 mr-1.5">
                          {new Date(o.created_at).toLocaleDateString("es-DO")}:
                        </span>
                        <span className="text-slate-700">{o.contenido_preview}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleSolicitarRecepcion}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition"
              >
                Solicitar seguimiento a Recepción
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
