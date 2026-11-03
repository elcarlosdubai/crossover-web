"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateCurso, createCurso } from "@/app/actions/cursos";
import { guardarCalificacionesDocente } from "@/app/actions/docente";
import { createEstudiante, matricularEstudiantesDemoEnCurso, promoverEstudiantes } from "@/app/actions/estudiantes";
import { getSabanaAsistenciaCurso, guardarSabanaAsistencia, toggleSuspensionClase } from "@/app/actions/asistencia";

const DIAS_OPCIONES = [
  { id: 1, label: "Lun", nombre: "Lunes" },
  { id: 2, label: "Mar", nombre: "Martes" },
  { id: 3, label: "Mié", nombre: "Miércoles" },
  { id: 4, label: "Jue", nombre: "Jueves" },
  { id: 5, label: "Vie", nombre: "Viernes" },
  { id: 6, label: "Sáb", nombre: "Sábado" },
  { id: 0, label: "Dom", nombre: "Domingo" }
];

export default function CursoDetalleClient({ 
  expediente, 
  profesores = [],
  cursosDisponibles = []
}: { 
  expediente: any; 
  profesores?: any[];
  cursosDisponibles?: any[];
}) {
  const router = useRouter();
  const { curso: initialCurso, estudiantes = [], asistencias = [], fechasTomadas = [], calificaciones: initialCalifs = [] } = expediente;
  const [curso, setCurso] = useState<any>(initialCurso);
  const [activeTab, setActiveTab] = useState<"estudiantes" | "asistencia" | "calificaciones">("estudiantes");
  const [filtroEstudiante, setFiltroEstudiante] = useState("");

  // Duración dinámica en meses/módulos (detecta si es de 9, 6, 3, etc.)
  const [esModular, setEsModular] = useState<boolean>(true);
  const [totalMeses, setTotalMeses] = useState<number>(3);
  const [nombresModulos, setNombresModulos] = useState<string[]>([]);

  // Pestaña activa en la sábana de notas (Mes 1, Mes 2, ... o Resumen Final)
  const [mesActivo, setMesActivo] = useState<number | "resumen">("resumen");
  const [savingNotas, setSavingNotas] = useState(false);

  // Modal para matricular estudiante directamente en este curso
  const [showMatricularModal, setShowMatricularModal] = useState(false);
  const [savingEstudiante, setSavingEstudiante] = useState(false);
  const [nuevoEstudiante, setNuevoEstudiante] = useState({
    nombres: "",
    apellidos: "",
    tutor_nombre: "",
    tutor_telefono: "",
    email: ""
  });

  // Modal para Promover Alumnos al siguiente nivel
  const [showPromoverModal, setShowPromoverModal] = useState(false);
  const [cursoDestinoSeleccionado, setCursoDestinoSeleccionado] = useState("");
  const [estudiantesSeleccionadosPromover, setEstudiantesSeleccionadosPromover] = useState<string[]>([]);
  const [concluirCursoActual, setConcluirCursoActual] = useState(false);
  const [promoviendo, setPromoviendo] = useState(false);
  const [creandoNuevoNivel, setCreandoNuevoNivel] = useState(false);

  // Estados para la Sábana Mensual de Asistencias
  const [sabanaAnio, setSabanaAnio] = useState<number>(new Date().getFullYear());
  const [sabanaMes, setSabanaMes] = useState<number>(new Date().getMonth() + 1);
  const [sabanaData, setSabanaData] = useState<any>(null);
  const [loadingSabana, setLoadingSabana] = useState(false);
  const [savingSabana, setSavingSabana] = useState(false);
  const [sabanaEditada, setSabanaEditada] = useState<Record<string, Record<string, string>>>({});

  const cargarSabana = async (cId: string, anio: number, mes: number) => {
    setLoadingSabana(true);
    const res = await getSabanaAsistenciaCurso(cId, anio, mes);
    if (res.success) {
      setSabanaData(res);
      const inicial: Record<string, Record<string, string>> = {};
      (res.estudiantes || []).forEach((e: any) => {
        inicial[e.id] = {};
        Object.entries(e.registros || {}).forEach(([f, val]: any) => {
          inicial[e.id][f] = val.estado;
        });
      });
      setSabanaEditada(inicial);
    }
    setLoadingSabana(false);
  };

  useEffect(() => {
    if (activeTab === "asistencia" && curso?.id) {
      cargarSabana(curso.id, sabanaAnio, sabanaMes);
    }
  }, [activeTab, sabanaAnio, sabanaMes, curso?.id]);

  const handleCambiarEstadoAsistencia = (estudianteId: string, fecha: string) => {
    const actual = sabanaEditada[estudianteId]?.[fecha] || "PENDIENTE";
    let siguiente = "PRESENTE";
    if (actual === "PRESENTE") siguiente = "AUSENTE";
    else if (actual === "AUSENTE") siguiente = "TARDANZA";
    else if (actual === "TARDANZA") siguiente = "EXCUSADO";
    else if (actual === "EXCUSADO") siguiente = "PRESENTE";

    setSabanaEditada(prev => ({
      ...prev,
      [estudianteId]: {
        ...(prev[estudianteId] || {}),
        [fecha]: siguiente
      }
    }));
  };

  const handleMarcarTodosPresentesFecha = (fecha: string) => {
    setSabanaEditada(prev => {
      const nuevo = { ...prev };
      (sabanaData?.estudiantes || []).forEach((e: any) => {
        const estadoActual = e.registros?.[fecha]?.estado;
        if (estadoActual !== "NO_MATRICULADO" && estadoActual !== "FERIADO") {
          nuevo[e.id] = {
            ...(nuevo[e.id] || {}),
            [fecha]: "PRESENTE"
          };
        }
      });
      return nuevo;
    });
  };

  const handleGuardarSabanaCompleta = async () => {
    if (!curso?.id || !sabanaData) return;
    setSavingSabana(true);
    const registrosAGuardar: any[] = [];

    Object.entries(sabanaEditada).forEach(([estId, fechasMap]) => {
      Object.entries(fechasMap).forEach(([f, est]) => {
        if (est && est !== "PENDIENTE" && est !== "NO_MATRICULADO" && est !== "FERIADO") {
          registrosAGuardar.push({
            estudiante_id: estId,
            fecha: f,
            estado: est,
            periodo: 1
          });
        }
      });
    });

    const res = await guardarSabanaAsistencia(curso.id, registrosAGuardar);
    if (res.success) {
      alert("✅ Sábana de asistencias guardada exitosamente.");
      await cargarSabana(curso.id, sabanaAnio, sabanaMes);
    } else {
      alert("❌ Error guardando asistencia: " + res.error);
    }
    setSavingSabana(false);
  };

  const handleToggleFeriado = async (fecha: string) => {
    if (!curso?.id) return;
    const res = await toggleSuspensionClase(curso.id, fecha, "Feriado / Suspensión Oficial");
    if (res.success) {
      await cargarSabana(curso.id, sabanaAnio, sabanaMes);
    }
  };

  const handleMatricularEstudiante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEstudiante.nombres.trim() || !nuevoEstudiante.apellidos.trim()) {
      alert("Nombres y apellidos son obligatorios.");
      return;
    }
    setSavingEstudiante(true);
    const res = await createEstudiante({
      ...nuevoEstudiante,
      curso_id: curso.id
    });
    if (res.success) {
      setShowMatricularModal(false);
      setNuevoEstudiante({
        nombres: "",
        apellidos: "",
        tutor_nombre: "",
        tutor_telefono: "",
        email: ""
      });
      router.refresh();
    } else {
      alert("Error matriculando estudiante: " + res.error);
    }
    setSavingEstudiante(false);
  };

  // Mapa de notas por mes para este curso: { [`${estudianteId}_${criterioId}_mes${mesNum}`]: number }
  const [notasMap, setNotasMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialCalifs.forEach((c: any) => {
      const n = Number(c.nota !== undefined && c.nota !== null ? c.nota : c.calificacion) || 0;
      const p = c.periodo || 1;
      map[`${c.estudiante_id}_${c.criterio_id}_mes${p}`] = n;
      if (p === 1) {
        map[`${c.estudiante_id}_${c.criterio_id}`] = n;
      }
    });
    return map;
  });

  // Sincronizar duración y modalidad desde la base de datos del curso
  useEffect(() => {
    if (curso.modalidad_evaluacion) {
      setEsModular(curso.modalidad_evaluacion === 'MODULOS');
    }
    if (curso.total_periodos && curso.total_periodos > 0) {
      setTotalMeses(curso.total_periodos);
    }
    if (Array.isArray(curso.nombres_periodos) && curso.nombres_periodos.length > 0) {
      setNombresModulos(curso.nombres_periodos);
    }
  }, [curso]);

  // Guardar calificaciones del mes activo directamente en la base de datos Supabase
  const handleGuardarCalificacionesMes = async () => {
    setSavingNotas(true);
    const mesNum = typeof mesActivo === "number" ? mesActivo : 1;

    const items: { estudiante_id: string; criterio_id: string; calificacion: number; periodo: number }[] = [];

    estudiantes.forEach((est: any) => {
      curso.criterios?.forEach((crit: any) => {
        const keyMes = `${est.id}_${crit.id}_mes${mesNum}`;
        const keyGen = `${est.id}_${crit.id}`;
        const val = notasMap[keyMes] !== undefined ? notasMap[keyMes] : (mesNum === 1 ? notasMap[keyGen] : undefined);

        if (val !== undefined && val !== null && String(val) !== "") {
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
      alert(`✅ Calificaciones de ${esModular ? `Módulo ${mesNum}` : `Mes ${mesNum}`} guardadas en la nube.`);
      router.refresh();
    } else {
      alert("Error guardando calificaciones: " + res.error);
    }
    setSavingNotas(false);
  };

  // Calcular la nota ponderada de un estudiante en un mes específico (sobre 100, suma directa de criterios)
  const calcularNotaMes = (estudianteId: string, mesNum: number) => {
    if (!curso?.criterios || curso.criterios.length === 0) return 0;
    let suma = 0;
    let hayNota = false;

    curso.criterios.forEach((crit: any) => {
      const key = `${estudianteId}_${crit.id}_mes${mesNum}`;
      const val = notasMap[key] !== undefined ? notasMap[key] : (mesNum === 1 ? notasMap[`${estudianteId}_${crit.id}`] : undefined);
      if (val !== undefined && val !== null && String(val) !== "") {
        hayNota = true;
        suma += Number(val);
      }
    });

    if (!hayNota) return null;
    return Math.round(suma * 10) / 10;
  };

  // Calcular el promedio general de todos los meses para la nota final
  // SOLO se calcula si todos los meses del nivel han sido completados
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

    // Si aún no ha completado todos los meses del nivel, el promedio final está pendiente
    if (mesesConNota < totalMeses) return null;
    return Math.round((sumaMeses / totalMeses) * 10) / 10;
  };

  // Resumen de aprobación de estudiantes para el aula
  const evaluacionEstudiantes = useMemo(() => {
    return estudiantes.map((est: any) => {
      const notasPorMes = Array.from({ length: totalMeses }, (_, i) => calcularNotaMes(est.id, i + 1));
      const promTotal = calcularPromedioTotal(est.id, totalMeses);

      const modulosCompletados = notasPorMes.filter(n => n !== null).length;
      const modulosAprobados = notasPorMes.filter(n => n !== null && n >= 70).length;
      const todosModulosAprobados = modulosCompletados === totalMeses && modulosAprobados === totalMeses;

      // Un estudiante solo está aprobado si cursó TODOS los meses/módulos y su promedio es >= 70
      const cicloCompleto = modulosCompletados === totalMeses;
      const aprobado = cicloCompleto && (esModular ? todosModulosAprobados : (promTotal !== null && promTotal >= 70));

      return {
        ...est,
        notasPorMes,
        promTotal,
        modulosCompletados,
        modulosAprobados,
        cicloCompleto,
        aprobado
      };
    });
  }, [estudiantes, totalMeses, esModular, notasMap]);

  const estudiantesAprobados = evaluacionEstudiantes.filter((e: any) => e.aprobado);
  const estudiantesReprobados = evaluacionEstudiantes.filter((e: any) => e.cicloCompleto && !e.aprobado);
  const estudiantesEnCurso = evaluacionEstudiantes.filter((e: any) => !e.cicloCompleto);

  // Inicializar selección de promovidos por defecto con todos los aprobados
  const abrirModalPromocion = () => {
    const aprobadosIds = estudiantesAprobados.map((e: any) => e.id);
    setEstudiantesSeleccionadosPromover(aprobadosIds);
    setShowPromoverModal(true);
  };

  const handlePromoverEstudiantes = async () => {
    if (!cursoDestinoSeleccionado) {
      alert("Por favor selecciona el curso o aula destino.");
      return;
    }
    if (estudiantesSeleccionadosPromover.length === 0) {
      alert("Debes seleccionar al menos un estudiante para promover.");
      return;
    }

    setPromoviendo(true);
    const res = await promoverEstudiantes(
      estudiantesSeleccionadosPromover,
      curso.id,
      cursoDestinoSeleccionado,
      concluirCursoActual
    );

    if (res.success) {
      alert(`🎉 ¡Éxito! ${res.count} estudiantes han sido promovidos correctamente.`);
      setShowPromoverModal(false);
      router.refresh();
      router.push(`/admin/dashboard/cursos/${cursoDestinoSeleccionado}`);
    } else {
      alert("Error al promover estudiantes: " + res.error);
    }
    setPromoviendo(false);
  };

  // Crear el siguiente nivel automáticamente si no existe (ej: Inglés Niños - Nivel 2)
  const handleCrearSiguienteNivel = async () => {
    setCreandoNuevoNivel(true);
    const nombreActual = curso.nombre || "";
    // Buscar si ya tiene Nivel X
    let nuevoNombre = "";
    if (nombreActual.includes("N1") || nombreActual.includes("Nivel 1")) {
      nuevoNombre = nombreActual.replace(/N1|Nivel 1/g, "Nivel 2").replace(/\[([^\]]+)\]/, (_: string, code: string) => `[${code.replace("N1", "N2")}]`);
    } else if (/Nivel\s*(\d+)/i.test(nombreActual)) {
      nuevoNombre = nombreActual.replace(/Nivel\s*(\d+)/i, (_: string, n: string) => `Nivel ${parseInt(n, 10) + 1}`);
    } else {
      nuevoNombre = `${nombreActual} - Nivel 2`;
    }

    const res = await createCurso({
      nombre: nuevoNombre,
      tipo: curso.tipo || "Idiomas",
      profesor_id: curso.profesor_id || "",
      dias_semana: curso.dias_semana || [6],
      hora_inicio: curso.hora_inicio || "09:00",
      hora_fin: curso.hora_fin || "12:00",
      criterios: (curso.criterios || []).map((c: any) => ({ nombre: c.nombre, porcentaje: Number(c.porcentaje) || 0 }))
    });

    if (res.success && res.cursoId) {
      alert(`✅ Aula "${nuevoNombre}" creada exitosamente como siguiente nivel.`);
      setCursoDestinoSeleccionado(res.cursoId);
      router.refresh();
    } else {
      alert("Error creando siguiente nivel: " + res.error);
    }
    setCreandoNuevoNivel(false);
  };

  // Estado para Modal de Edición Directo
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Helper para extraer código y título
  const matchCode = (curso.nombre || "").match(/^\[([^\]]+)\]\s*(.*)$/);
  const [editCodigo, setEditCodigo] = useState(matchCode ? matchCode[1] : "");
  const [editNombre, setEditNombre] = useState(matchCode ? matchCode[2] : (curso.nombre || ""));
  const [editCategoria, setEditCategoria] = useState(curso.tipo || "Infotep");
  const [editProfesorId, setEditProfesorId] = useState(curso.profesor_id || curso.profesor?.id || "");
  const [editDias, setEditDias] = useState<number[]>(Array.isArray(curso.dias_semana) ? [...curso.dias_semana] : [6]);
  const [editHoraInicio, setEditHoraInicio] = useState(curso.hora_inicio || "09:00");
  const [editHoraFin, setEditHoraFin] = useState(curso.hora_fin || "12:00");
  const [editCriterios, setEditCriterios] = useState<{ nombre: string; porcentaje: number }[]>(
    curso.criterios && curso.criterios.length > 0
      ? curso.criterios.map((c: any) => ({ nombre: c.nombre, porcentaje: Number(c.porcentaje) || 0 }))
      : [
          { nombre: "Módulo 1: Windows & Fundamentos", porcentaje: 30 },
          { nombre: "Módulo 2: Microsoft Word", porcentaje: 30 },
          { nombre: "Módulo 3: Microsoft Excel & Evaluación", porcentaje: 40 }
        ]
  );

  const [editEsModular, setEditEsModular] = useState<boolean>(esModular);
  const [editTotalMeses, setEditTotalMeses] = useState<number>(totalMeses);

  useEffect(() => {
    setEditEsModular(esModular);
    setEditTotalMeses(totalMeses);
  }, [esModular, totalMeses]);

  const sumaCriterios = editCriterios.reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim()) return alert("El nombre del curso es obligatorio");
    if (sumaCriterios !== 100) {
      return alert(`Los criterios o módulos deben sumar exactamente 100%. Actualmente suman ${sumaCriterios}%.`);
    }

    setSavingEdit(true);
    const nombreLimpio = editNombre.replace(/^\[[^\]]+\]\s*/, "").trim();
    const codigoLimpio = editCodigo.trim().toUpperCase();
    const nombreFinal = codigoLimpio ? `[${codigoLimpio}] ${nombreLimpio}` : nombreLimpio;

    const res = await updateCurso({
      id: curso.id,
      nombre: nombreFinal,
      tipo: editCategoria,
      profesor_id: editProfesorId,
      dias_semana: editDias,
      hora_inicio: editHoraInicio,
      hora_fin: editHoraFin,
      modalidad_evaluacion: editEsModular ? 'MODULOS' : 'MESES',
      total_periodos: editEsModular ? editTotalMeses : 3,
      nombres_periodos: editEsModular 
        ? Array.from({ length: editTotalMeses }, (_, i) => `Módulo ${i + 1}`) 
        : ['Mes 1', 'Mes 2', 'Mes 3'],
      criterios: editCriterios
    });

    if (res.success) {
      setEsModular(editEsModular);
      setTotalMeses(editEsModular ? editTotalMeses : 3);

      setCurso((prev: any) => ({
        ...prev,
        nombre: nombreFinal,
        tipo: editCategoria,
        profesor_id: editProfesorId,
        profesor: profesores.find(p => p.id === editProfesorId) || prev.profesor,
        dias_semana: editDias,
        hora_inicio: editHoraInicio,
        hora_fin: editHoraFin,
        modalidad_evaluacion: editEsModular ? 'MODULOS' : 'MESES',
        total_periodos: editEsModular ? editTotalMeses : 3,
        criterios: editCriterios
      }));
      setShowEditModal(false);
      router.refresh();
    } else {
      alert("Error actualizando curso: " + res.error);
    }
    setSavingEdit(false);
  };

  const diasTxt = (curso.dias_semana || [])
    .map((d: number) => DIAS_OPCIONES.find(op => op.id === d)?.nombre)
    .filter(Boolean)
    .join(", ");

  const esSabatino = Array.isArray(curso.dias_semana) && curso.dias_semana.length === 1 && curso.dias_semana[0] === 6;

  // Filtrado de alumnos
  const estudiantesFiltrados = estudiantes.filter((e: any) => {
    const q = filtroEstudiante.toLowerCase().trim();
    if (!q) return true;
    const full = `${e.nombres} ${e.apellidos} ${e.matricula} ${e.tutor_nombre || ''}`.toLowerCase();
    return full.includes(q);
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-16 animate-in fade-in duration-150">
      
      {/* Botón Volver y Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/dashboard/cursos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200/80 px-3 py-1.5 rounded-xl shadow-sm hover:border-gray-300 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a Todos los Cursos
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
            title="Editar nombre, horario, docente o módulos de evaluación"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Editar Curso
          </button>

          <button
            type="button"
            onClick={() => setShowMatricularModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Matricular Alumno
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calificaciones")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3.5 py-1.5 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">grade</span>
            Ver Sábana de Notas
          </button>
        </div>
      </div>

      {/* Tarjeta Cabecera Oficial del Aula */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            {(() => {
              const match = (curso.nombre || "").match(/^\[([^\]]+)\]\s*(.*)$/);
              const cod = match ? match[1] : null;
              const tit = match ? match[2] : curso.nombre;
              return (
                <>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {cod && (
                      <span className="text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded bg-gray-900 text-amber-400 tracking-wider shadow-sm">
                        {cod}
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
                      Expediente Oficial de Aula
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      curso.activo !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>
                      {curso.activo !== false ? "Aula Abierta" : "Aula Cerrada / Finalizada"}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      esSabatino ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {esSabatino ? "Sabatino" : "Semanal"}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 tracking-tight">
                    {tit}
                  </h1>
                </>
              );
            })()}
            <p className="text-xs text-gray-500 font-medium mt-1">
              Disciplina: <strong className="text-gray-800">{curso.tipo}</strong>
            </p>
          </div>

          {/* Métricas Resumen del Aula */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">Alumnos</span>
              <strong className="text-lg font-black text-gray-900">{estudiantes.length}</strong>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100 min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-amber-800 block mb-0.5">Sesiones</span>
              <strong className="text-lg font-black text-amber-900">{fechasTomadas.length}</strong>
            </div>
            <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100 min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-purple-800 block mb-0.5">Criterios</span>
              <strong className="text-lg font-black text-purple-900">{curso.criterios?.length || 0}</strong>
            </div>
          </div>
        </div>

        {/* Fila de Datos del Curso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium mb-0.5">Docente Responsable</span>
            <strong className="text-gray-900 text-sm">
              {curso.profesor?.nombre || "Sin profesor asignado aún"}
            </strong>
          </div>
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium mb-0.5">Días de Pase de Lista</span>
            <strong className="text-amber-800 font-bold text-sm">
              {diasTxt || "Días flexibles"}
            </strong>
          </div>
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium mb-0.5">Horario Oficial</span>
            <strong className="font-mono text-gray-900 text-sm">
              {curso.hora_inicio || "Flexible"} {curso.hora_fin ? `- ${curso.hora_fin}` : ""}
            </strong>
          </div>
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium mb-0.5">Mínimo Asistencia Exigido</span>
            <strong className="text-emerald-700 font-bold text-sm">
              {curso.minimo_asistencia_pct || 80}% para aprobar
            </strong>
          </div>
        </div>
      </div>

      {/* Switcher / Pestañas de Navegación de la Página */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("estudiantes")}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "estudiantes" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            Alumnos Matriculados ({estudiantes.length})
          </button>

          <button
            onClick={() => setActiveTab("asistencia")}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "asistencia" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            Historial de Asistencia ({fechasTomadas.length})
          </button>

          <button
            onClick={() => setActiveTab("calificaciones")}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "calificaciones" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grade</span>
            Sábana de Calificaciones
          </button>
        </div>

        {activeTab === "estudiantes" && (
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, matrícula o tutor..."
              value={filtroEstudiante}
              onChange={e => setFiltroEstudiante(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: ALUMNOS MATRICULADOS */}
      {/* ========================================================================= */}
      {activeTab === "estudiantes" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden p-4 sm:p-6">
          {estudiantesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_off</span>
              <h3 className="font-bold text-gray-800 text-sm">
                {filtroEstudiante ? `Sin coincidencias para "${filtroEstudiante}"` : "No hay estudiantes inscritos en este curso todavía."}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                Matricula alumnos desde la secretaría o el gestor de admisiones.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMatricularModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  Matricular Alumno
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await matricularEstudiantesDemoEnCurso(curso.id);
                    if (res.success) {
                      router.refresh();
                    } else {
                      alert("Error: " + res.error);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-200 px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">group_add</span>
                  + Cargar 10 Alumnos de Prueba
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Estudiante / Matrícula</th>
                    <th className="py-3 px-4">Tutor & WhatsApp</th>
                    <th className="py-3 px-4 text-center">Asistencia Acumulada</th>
                    <th className="py-3 px-4 text-center">Promedio Calificación</th>
                    <th className="py-3 px-4 text-center">Estado Académico</th>
                    <th className="py-3 px-4 text-right">Expediente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {estudiantesFiltrados.map((est: any) => {
                    const cleanPhone = (est.tutor_telefono || "").replace(/\D/g, "");
                    const pct = est.metricas?.pctAsistencia ?? 100;
                    const nota = est.metricas?.notaFinal;

                    return (
                      <tr key={est.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <strong className="text-gray-900 block text-xs">
                            {est.apellidos}, {est.nombres}
                          </strong>
                          <span className="font-mono text-[10px] text-gray-400 font-bold">
                            {est.matricula}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-800 block font-medium">{est.tutor_nombre || "No registrado"}</span>
                          {est.tutor_telefono && (
                            <a
                              href={`https://wa.me/1${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5 mt-0.5"
                            >
                              <span className="material-symbols-outlined text-[13px]">chat</span>
                              {est.tutor_telefono}
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-lg font-black text-[11px] ${
                              pct >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                              {pct}%
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {est.metricas?.ausencias || 0} ausencias
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {nota !== null ? (
                            <span className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                              nota >= 70 ? "bg-purple-100 text-purple-900" : "bg-red-100 text-red-900"
                            }`}>
                              {nota} / 100
                            </span>
                          ) : (
                            <span className="text-gray-400 font-bold text-[11px]">En curso</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            nota !== null && nota >= 70 && pct >= 80
                              ? "bg-emerald-100 text-emerald-800"
                              : nota !== null && (nota < 70 || pct < 80)
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {nota !== null && nota >= 70 && pct >= 80
                              ? "Aprobando"
                              : nota !== null && (nota < 70 || pct < 80)
                              ? "En Riesgo"
                              : "Cursando"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/dashboard/estudiantes/${est.id}`}
                            className="text-primary hover:underline font-bold text-xs inline-flex items-center gap-0.5"
                          >
                            Ver Ficha
                            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                          </Link>
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

      {/* ========================================================================= */}
      {/* PESTAÑA 2: SÁBANA MENSUAL DE ASISTENCIA (MATRIZ POR FECHA) */}
      {/* ========================================================================= */}
      {activeTab === "asistencia" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-5 sm:p-7 space-y-6">
          {/* Header de la Sábana */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-200/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-2xl">table_chart</span>
                <h3 className="font-bold text-gray-900 text-base">Sábana Oficial de Asistencia Mensual</h3>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Matriz en Vivo
                </span>
              </div>
              <p className="text-gray-600 text-xs mt-1">
                Haz clic en cualquier celda para alternar estado (<strong>P</strong> = Presente, <strong>A</strong> = Ausente, <strong>T</strong> = Tardanza, <strong>E</strong> = Excusado).
              </p>
            </div>

            {/* Selector de Mes / Año */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sabanaMes}
                onChange={e => setSabanaMes(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {[
                  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                ].map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>

              <select
                value={sabanaAnio}
                onChange={e => setSabanaAnio(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>

              <button
                type="button"
                onClick={handleGuardarSabanaCompleta}
                disabled={savingSabana || loadingSabana}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                {savingSabana ? "Guardando..." : "Guardar Sábana"}
              </button>
            </div>
          </div>

          {/* Leyenda y Acciones Rápidas */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/60">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-gray-500 font-bold text-[11px] uppercase tracking-wider">Leyenda:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px]">P</span>
                <span className="text-gray-700 font-medium">Presente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-rose-100 text-rose-800 border border-rose-300 text-[10px]">A</span>
                <span className="text-gray-700 font-medium">Ausente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-amber-100 text-amber-800 border border-amber-300 text-[10px]">T</span>
                <span className="text-gray-700 font-medium">Tardanza</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-blue-100 text-blue-800 border border-blue-300 text-[10px]">E</span>
                <span className="text-gray-700 font-medium">Excusado (Médico)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-purple-100 text-purple-800 border border-purple-300 text-[10px]">F</span>
                <span className="text-gray-700 font-medium">Feriado/Suspendida</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 italic">
              * Las ausencias excusadas no perjudican la nota del alumno.
            </div>
          </div>

          {/* Estado de carga */}
          {loadingSabana ? (
            <div className="p-16 text-center bg-gray-50 rounded-2xl border border-gray-100">
              <span className="material-symbols-outlined text-4xl text-amber-500 animate-spin mb-2">progress_activity</span>
              <p className="font-bold text-gray-700 text-sm">Cargando sábana de asistencia...</p>
            </div>
          ) : !sabanaData || sabanaData.estudiantes?.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">group_off</span>
              <p className="font-bold text-gray-700 text-sm">No hay alumnos matriculados para este curso.</p>
              <p className="text-gray-400 mt-1">Matricula alumnos primero para poder generar su sábana de asistencias.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto border border-gray-200 rounded-2xl shadow-sm scrollbar-thin scrollbar-thumb-gray-300">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/90 text-gray-700 border-b border-gray-200">
                    <th className="py-3 px-3 font-bold sticky left-0 bg-gray-100 z-10 w-48 shadow-sm">
                      Estudiante
                    </th>
                    {(sabanaData.fechasClase || []).map((fecha: string) => {
                      const esFeriado = !!sabanaData.mapaSuspensiones?.[fecha];
                      const partes = fecha.split("-");
                      const diaMes = `${partes[2]}/${partes[1]}`;
                      return (
                        <th key={fecha} className={`py-2 px-2 text-center font-bold border-l border-gray-200 min-w-[76px] ${esFeriado ? "bg-purple-50 text-purple-900" : ""}`}>
                          <div className="text-[11px]">{diaMes}</div>
                          {esFeriado ? (
                            <button
                              type="button"
                              onClick={() => handleToggleFeriado(fecha)}
                              title="Hacer clic para reanudar clase (desmarcar feriado)"
                              className="text-[9px] bg-purple-200 text-purple-950 px-1 py-0.5 rounded font-black hover:bg-purple-300 mt-1 block mx-auto"
                            >
                              Feriado
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleMarcarTodosPresentesFecha(fecha)}
                                title="Marcar a todos Presentes en esta fecha"
                                className="text-[9px] bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-1 py-0.5 rounded font-black"
                              >
                                Todos P
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleFeriado(fecha)}
                                title="Marcar fecha como Feriado o Clase Suspendida"
                                className="text-[9px] text-gray-400 hover:text-purple-600"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </th>
                      );
                    })}
                    <th className="py-3 px-2 text-center font-bold border-l border-gray-200 bg-gray-50 min-w-[50px]">
                      P
                    </th>
                    <th className="py-3 px-2 text-center font-bold border-l border-gray-200 bg-gray-50 min-w-[50px]">
                      A
                    </th>
                    <th className="py-3 px-2 text-center font-bold border-l border-gray-200 bg-gray-50 min-w-[70px]">
                      % Asist.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sabanaData.estudiantes.map((est: any) => {
                    let pCount = 0;
                    let aCount = 0;
                    let tCount = 0;
                    let eCount = 0;
                    let validas = 0;

                    (sabanaData.fechasClase || []).forEach((f: string) => {
                      const st = sabanaEditada[est.id]?.[f] || est.registros?.[f]?.estado || "PENDIENTE";
                      if (st !== "NO_MATRICULADO" && st !== "FERIADO") {
                        if (st !== "PENDIENTE") validas++;
                        if (st === "PRESENTE") pCount++;
                        else if (st === "AUSENTE") aCount++;
                        else if (st === "TARDANZA") tCount++;
                        else if (st === "EXCUSADO") eCount++;
                      }
                    });

                    const pct = validas > 0 ? Math.round(((pCount + eCount) / validas) * 100) : 100;

                    return (
                      <tr key={est.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200 shadow-sm">
                          <Link 
                            href={`/admin/dashboard/estudiantes/${est.id}`}
                            className="hover:underline font-bold text-gray-900 hover:text-primary flex items-center gap-1.5"
                          >
                            <span>{est.apellidos}, {est.nombres}</span>
                          </Link>
                          <span className="text-[10px] text-gray-400 block font-mono">{est.matricula}</span>
                        </td>

                        {(sabanaData.fechasClase || []).map((fecha: string) => {
                          const esFeriado = !!sabanaData.mapaSuspensiones?.[fecha];
                          const estado = esFeriado ? "FERIADO" : (sabanaEditada[est.id]?.[fecha] || est.registros?.[fecha]?.estado || "PENDIENTE");

                          if (estado === "NO_MATRICULADO") {
                            return (
                              <td key={fecha} className="p-1 text-center border-l border-gray-200 bg-gray-50/60">
                                <span className="text-[9px] text-gray-300 font-bold" title="Aún no estaba matriculado">-</span>
                              </td>
                            );
                          }

                          if (estado === "FERIADO") {
                            return (
                              <td key={fecha} className="p-1 text-center border-l border-gray-200 bg-purple-50/50">
                                <span className="text-[10px] text-purple-700 font-black" title="Clase Suspendida / Feriado">F</span>
                              </td>
                            );
                          }

                          let badgeColor = "bg-gray-100 text-gray-400 border-gray-200";
                          let letra = "-";

                          if (estado === "PRESENTE") {
                            badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-black";
                            letra = "P";
                          } else if (estado === "AUSENTE") {
                            badgeColor = "bg-rose-100 text-rose-800 border-rose-300 font-black";
                            letra = "A";
                          } else if (estado === "TARDANZA") {
                            badgeColor = "bg-amber-100 text-amber-800 border-amber-300 font-black";
                            letra = "T";
                          } else if (estado === "EXCUSADO") {
                            badgeColor = "bg-blue-100 text-blue-800 border-blue-300 font-black";
                            letra = "E";
                          }

                          return (
                            <td key={fecha} className="p-1 text-center border-l border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoAsistencia(est.id, fecha)}
                                className={`w-7 h-7 rounded-lg border text-[11px] transition-all hover:scale-105 shadow-xs mx-auto flex items-center justify-center ${badgeColor}`}
                                title={`Hacer clic para cambiar: ${estado}`}
                              >
                                {letra}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-2 px-2 text-center font-bold text-emerald-700 border-l border-gray-200 bg-gray-50/40">
                          {pCount}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-rose-700 border-l border-gray-200 bg-gray-50/40">
                          {aCount}
                        </td>
                        <td className="py-2 px-2 text-center font-black border-l border-gray-200 bg-gray-50/60">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${pct >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
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

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CALIFICACIONES & EVALUACIONES INTEGRADA POR MESES */}
      {/* ========================================================================= */}
      {activeTab === "calificaciones" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-5 sm:p-7 space-y-4">
          
          {/* Header con Pestañas: Se adapta si es modular o evaluación continua */}
          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-purple-900 bg-white border border-purple-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  Sábana Oficial del Aula
                </span>
                <span className="text-xs text-purple-800 font-bold">
                  {esModular 
                    ? `Estructura: ${totalMeses} ${totalMeses === 1 ? "Módulo" : "Módulos Independientes"}`
                    : `Estructura: ${totalMeses} ${totalMeses === 1 ? "Mes" : "Meses (Promedio Final)"}`}
                </span>
              </div>
              <h3 className="font-black text-gray-900 text-base">
                {mesActivo === "resumen" 
                  ? "🏆 Sábana General y Promedio de Aprobación" 
                  : esModular
                    ? `Evaluación Oficial: Módulo ${mesActivo}${nombresModulos[Number(mesActivo) - 1] ? ` (${nombresModulos[Number(mesActivo) - 1]})` : ""}`
                    : `Evaluación Oficial: Mes ${mesActivo}`}
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                {mesActivo === "resumen"
                  ? `Muestra las notas obtenidas en cada uno de los ${totalMeses} ${esModular ? "módulos" : "meses"} y el promedio final acumulado.`
                  : `Criterios: ${curso.criterios?.map((c: any) => `${c.nombre} (${c.porcentaje}%)`).join(", ") || "Sin criterios"}`}
              </p>
            </div>

            {/* Switcher Dinámico de Módulos / Meses (SIEMPRE VISIBLE) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-purple-200 shadow-sm self-start md:self-auto max-w-full overflow-x-auto">
              {Array.from({ length: totalMeses }, (_, i) => i + 1).map(m => (
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
                  {!esModular 
                    ? `Mes ${m}` 
                    : (nombresModulos[m - 1] || `Módulo ${m}`)}
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

          {/* TABLA RESUMEN FINAL DINÁMICA */}
          {mesActivo === "resumen" ? (
            <div className="space-y-4">
              {/* Banner de Promoción y Métricas de Cierre */}
              <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl text-amber-300">school</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white flex items-center gap-2">
                      Estado de Acreditación y Promoción
                      {estudiantesEnCurso.length > 0 ? (
                        <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md">
                          Nivel en Curso ({totalMeses} Meses)
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                            {estudiantesAprobados.length} Aprobados (≥ 70)
                          </span>
                          {estudiantesReprobados.length > 0 && (
                            <span className="text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-md">
                              {estudiantesReprobados.length} Reprobados (&lt; 70)
                            </span>
                          )}
                        </>
                      )}
                    </h4>
                    <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                      {estudiantesEnCurso.length > 0 
                        ? `El ciclo está actualmente en desarrollo. La promoción al siguiente nivel se activará cuando los estudiantes completen los ${totalMeses} meses.`
                        : "Los estudiantes con ciclo completo y promedio final aprobatorio están listos para ser promovidos al siguiente nivel del programa."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirModalPromocion}
                  disabled={estudiantesAprobados.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  {estudiantesAprobados.length > 0 ? "Promover Aprobados al Siguiente Nivel" : "Promoción (Pendiente Cierre de Nivel)"}
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200/80 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                    <th className="py-3 px-4">Estudiante</th>
                    {Array.from({ length: totalMeses }, (_, i) => i + 1).map(m => (
                      <th key={m} className="py-3 px-3 text-center whitespace-nowrap">
                        {!esModular ? `Mes ${m}` : (nombresModulos[m - 1] || `Módulo ${m}`)} 
                        <span className="block text-[9px] text-gray-400 font-normal">
                          {esModular ? "(Mín. 70)" : "(100 pts)"}
                        </span>
                      </th>
                    ))}
                    {esModular ? (
                      <th className="py-3 px-6 text-center font-black text-purple-900 whitespace-nowrap">Módulos Aprobados</th>
                    ) : (
                      <th className="py-3 px-6 text-center font-black text-primary whitespace-nowrap">Promedio General</th>
                    )}
                    <th className="py-3 px-4 text-center font-black whitespace-nowrap">Condición Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {estudiantes.length === 0 ? (
                    <tr>
                      <td colSpan={totalMeses + 3} className="py-12 text-center text-gray-400 font-bold bg-gray-50/50">
                        <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-1">group_off</span>
                        No hay alumnos matriculados en este curso aún para calificar.
                        <div className="mt-2">
                          <Link 
                            href={`/admin/dashboard/estudiantes?curso=${curso.id}`}
                            className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm hover:bg-primary-hover"
                          >
                            <span className="material-symbols-outlined text-[15px]">person_add</span>
                            Matricular Estudiantes
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    estudiantes.map((est: any) => {
                    const notasPorMes = Array.from({ length: totalMeses }, (_, i) => calcularNotaMes(est.id, i + 1));
                    const promTotal = calcularPromedioTotal(est.id, totalMeses);
                    
                    // Lógica para cursos modulares (Informática): debe tener todos aprobados
                    const modulosCompletados = notasPorMes.filter(n => n !== null).length;
                    const modulosAprobados = notasPorMes.filter(n => n !== null && n >= 70).length;
                    const todosModulosAprobados = modulosCompletados === totalMeses && modulosAprobados === totalMeses;
                    const tieneModulosReprobados = notasPorMes.some(n => n !== null && n < 70);

                    // Lógica para cursos por mes (Inglés): debe haber terminado todos los meses y tener promedio >= 70
                    const cicloCompleto = modulosCompletados === totalMeses;
                    const aprobadoPorPromedio = cicloCompleto && promTotal !== null && promTotal >= 70;

                    return (
                      <tr key={est.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                          {est.apellidos}, {est.nombres}
                          <span className="block text-[11px] font-mono text-gray-400 font-normal">{est.matricula}</span>
                        </td>

                        {notasPorMes.map((nota, idx) => {
                          const paso = nota !== null && nota >= 70;
                          return (
                            <td key={idx} className="py-3 px-3 text-center font-mono font-bold">
                              {nota !== null ? (
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-xs ${
                                  esModular 
                                    ? paso ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-600 bg-red-50 border border-red-200"
                                    : paso ? "text-emerald-700" : "text-red-600"
                                }`}>
                                  {nota}
                                </span>
                              ) : (
                                <span className="text-gray-300">--</span>
                              )}
                            </td>
                          );
                        })}

                        {esModular ? (
                          <td className="py-3 px-6 text-center whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-xl font-black text-xs ${
                              modulosCompletados === 0 
                                ? "text-gray-400 bg-gray-50" 
                                : modulosAprobados === totalMeses 
                                  ? "text-emerald-700 bg-emerald-50 border border-emerald-200" 
                                  : "text-amber-800 bg-amber-50 border border-amber-200"
                            }`}>
                              {modulosAprobados} de {totalMeses} Aprobados
                            </span>
                          </td>
                        ) : (
                          <td className="py-3 px-6 text-center whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${
                              promTotal !== null 
                                ? aprobadoPorPromedio ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-700 bg-red-50 border border-red-200"
                                : "text-gray-400 bg-gray-50"
                            }`}>
                              {promTotal !== null ? `${promTotal} / 100` : `Pendiente (${modulosCompletados}/${totalMeses} meses)`}
                            </span>
                          </td>
                        )}

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {esModular ? (
                            modulosCompletados === 0 ? (
                              <span className="text-xs text-gray-400 font-bold">En curso</span>
                            ) : todosModulosAprobados ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-emerald-100 text-emerald-800">
                                🎓 Acreditado
                              </span>
                            ) : tieneModulosReprobados ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-red-100 text-red-800">
                                ❌ Módulo Reprobado
                              </span>
                            ) : (
                              <span className="text-xs text-amber-700 font-bold">Cursando ({modulosAprobados}/{totalMeses})</span>
                            )
                          ) : (
                            !cicloCompleto ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200">
                                ⏳ Cursando (Mes {modulosCompletados} de {totalMeses})
                              </span>
                            ) : promTotal !== null ? (
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                                aprobadoPorPromedio ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                              }`}>
                                {aprobadoPorPromedio ? "✅ Aprobado" : "❌ Reprobado"}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">En curso</span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
            </div>
          ) : (
            /* TABLA INTERACTIVA DE CALIFICACIONES DEL MES */
            <div className="space-y-3">
              <div className="overflow-x-auto border border-gray-200/80 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Estudiante</th>
                      {curso.criterios?.map((c: any) => (
                        <th key={c.id} className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="block text-gray-800 font-bold">{c.nombre}</span>
                          <span className="inline-block text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded font-black mt-0.5">
                            {c.porcentaje} pts máx.
                          </span>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-right whitespace-nowrap">Nota Mes {mesActivo} (100 pts)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {estudiantes.length === 0 ? (
                      <tr>
                        <td colSpan={(curso.criterios?.length || 0) + 2} className="py-12 text-center text-gray-400 font-bold bg-gray-50/50">
                          <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-1">group_off</span>
                          No hay alumnos matriculados en este curso aún para asentar notas.
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => setShowMatricularModal(true)}
                              className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm hover:bg-primary-hover"
                            >
                              <span className="material-symbols-outlined text-[15px]">person_add</span>
                              Matricular Alumno
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await matricularEstudiantesDemoEnCurso(curso.id);
                                if (res.success) {
                                  router.refresh();
                                } else {
                                  alert("Error: " + res.error);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-200 px-3 py-1.5 rounded-xl shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">group_add</span>
                              + Cargar 10 Alumnos de Prueba
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      estudiantes.map((est: any) => {
                      const mesNum = typeof mesActivo === "number" ? mesActivo : 1;
                      const notaMes = calcularNotaMes(est.id, mesNum);
                      const finalColor = notaMes !== null && notaMes >= 70 
                        ? "text-emerald-700 bg-emerald-50" 
                        : notaMes !== null 
                        ? "text-red-700 bg-red-50" 
                        : "text-gray-400 bg-gray-50";

                      return (
                        <tr key={est.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {est.apellidos}, {est.nombres}
                            <span className="block text-[11px] font-mono text-gray-400 font-normal">{est.matricula}</span>
                          </td>

                          {curso.criterios?.map((crit: any) => {
                            const key = `${est.id}_${crit.id}_mes${mesNum}`;
                            const keyFallback = `${est.id}_${crit.id}`;
                            const val = notasMap[key] !== undefined 
                              ? notasMap[key] 
                              : (mesNum === 1 && notasMap[keyFallback] !== undefined ? notasMap[keyFallback] : "");

                            const ptsVal = val !== "" && val !== undefined && val !== null 
                              ? Number(val)
                              : null;

                            return (
                              <td key={crit.id} className="py-3 px-3 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={crit.porcentaje}
                                    value={val}
                                    onChange={e => {
                                      const num = Math.min(Number(crit.porcentaje), Math.max(0, Number(e.target.value)));
                                      setNotasMap({ ...notasMap, [key]: num });
                                    }}
                                    className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-bold text-gray-800 text-xs"
                                    placeholder="0"
                                  />
                                  <span className="text-[10px] text-gray-400 font-medium mt-0.5" title="Puntos reales aportados al mes">
                                    {ptsVal !== null ? `${ptsVal}/${crit.porcentaje} pts` : `0/${crit.porcentaje} pts`}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block px-3 py-1 rounded-xl font-black text-xs ${finalColor}`}>
                              {notaMes !== null ? `${notaMes} / 100` : "--"}
                            </span>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>

              {/* Botón de Guardar en el curso */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
                <span className="text-xs text-gray-500 font-medium">
                  Guarda las notas del <strong>Mes {mesActivo}</strong> para este curso. El promedio de los 3 meses se actualizará automáticamente.
                </span>
                <button
                  type="button"
                  disabled={savingNotas || estudiantes.length === 0}
                  onClick={handleGuardarCalificacionesMes}
                  className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {savingNotas ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Guardar Notas Mes {mesActivo}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN DIRECTO EN LA PÁGINA DEL CURSO */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Edición del Aula
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                  Editar: {editNombre || "Curso"}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Modifica el docente, horario o los módulos de evaluación (Windows, Word, Excel, etc.).
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4 flex-1 overflow-y-auto pr-1">
              
              {/* Nombre y Código */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Curso / Materia *</label>
                  <input 
                    type="text" 
                    value={editNombre} 
                    onChange={e => setEditNombre(e.target.value)}
                    placeholder="Ej: Informática de Oficina, Francés Básico..." 
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Código de Aula / Sección
                  </label>
                  <input
                    type="text"
                    value={editCodigo}
                    onChange={e => setEditCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: INF-SAB-01"
                    className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              {/* Categoría y Docente Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoría / Área *</label>
                  <select
                    value={editCategoria}
                    onChange={e => setEditCategoria(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    <option value="Infotep">Infotep / Cursos Técnicos</option>
                    <option value="Idiomas">Idiomas (Inglés / Francés)</option>
                    <option value="Talleres">Talleres Especiales / Masterclass</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Otro">Otra Disciplina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Profesor Responsable <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <select
                    value={editProfesorId}
                    onChange={e => setEditProfesorId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    <option value="">⏳ Sin profesor asignado aún</option>
                    {profesores.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Días y Horas */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                    Días de Clase:
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDias([6])}
                      className="text-[10px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
                    >
                      Sábados
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDias([1, 2, 3, 4, 5])}
                      className="text-[10px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
                    >
                      L-V
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {DIAS_OPCIONES.map(dia => {
                    const selected = editDias.includes(dia.id);
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => {
                          if (editDias.includes(dia.id)) {
                            if (editDias.length > 1) setEditDias(editDias.filter(d => d !== dia.id));
                          } else {
                            setEditDias([...editDias, dia.id].sort());
                          }
                        }}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                          selected 
                            ? "bg-gray-900 text-white shadow-sm ring-2 ring-gray-900/20" 
                            : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={editHoraInicio}
                      onChange={e => setEditHoraInicio(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={editHoraFin}
                      onChange={e => setEditHoraFin(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* SISTEMA DE EVALUACIÓN ULTRA LIMPIO */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/70 space-y-3.5">
                <div>
                  <label className="block text-xs font-black text-purple-950 uppercase tracking-wider mb-1.5">
                    ¿Cómo se evalúa este curso?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditEsModular(false)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        !editEsModular
                          ? "bg-purple-900 border-purple-900 text-white shadow-sm"
                          : "bg-white border-purple-200 text-purple-950 hover:bg-purple-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span className="material-symbols-outlined text-[17px]">
                          {!editEsModular ? "radio_button_checked" : "radio_button_unchecked"}
                        </span>
                        Por Meses (Promedio Final)
                      </div>
                      <p className={`text-[10px] mt-1 ${!editEsModular ? "text-purple-200" : "text-gray-500"}`}>
                        Ej: Inglés. Se evalúa cada mes y al final se promedian todos los meses.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditEsModular(true)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        editEsModular
                          ? "bg-purple-900 border-purple-900 text-white shadow-sm"
                          : "bg-white border-purple-200 text-purple-950 hover:bg-purple-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span className="material-symbols-outlined text-[17px]">
                          {editEsModular ? "radio_button_checked" : "radio_button_unchecked"}
                        </span>
                        Por Módulos (Aprobación Modular)
                      </div>
                      <p className={`text-[10px] mt-1 ${editEsModular ? "text-purple-200" : "text-gray-500"}`}>
                        Ej: Informática. Cada módulo se aprueba con mín. 70 y se saca promedio al final.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Pregunta directa de cantidad de meses o módulos */}
                <div className="pt-2 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black text-purple-950 uppercase tracking-wider">
                      {editEsModular ? "¿Cuántos módulos tiene?" : "¿Cuántos meses dura?"}
                    </label>
                    <p className="text-[11px] text-purple-800/80 font-medium">
                      {editEsModular ? "Generará una pestaña por cada módulo." : "Generará una pestaña por cada mes."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-purple-200 shadow-sm">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={editTotalMeses}
                      onChange={e => setEditTotalMeses(Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                      className="w-14 text-center bg-purple-50 border border-purple-200 rounded-lg py-1 text-sm font-black text-purple-900 focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-xs font-bold text-purple-900 pr-1.5">
                      {editEsModular ? (editTotalMeses === 1 ? "módulo" : "módulos") : (editTotalMeses === 1 ? "mes" : "meses")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Módulos o Criterios de Evaluación */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-wider">
                      Método de Evaluación Mensual (100% por mes)
                    </label>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Este esquema se evalúa cada mes (ej: Mes 1, Mes 2, Mes 3). Al final se promedia el total.
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl font-black text-xs shrink-0 ${
                    sumaCriterios === 100 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    Total: {sumaCriterios}% / 100%
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {editCriterios.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={crit.nombre}
                        onChange={e => {
                          const updated = [...editCriterios];
                          updated[idx].nombre = e.target.value;
                          setEditCriterios(updated);
                        }}
                        placeholder={`Ej: Módulo ${idx + 1}`}
                        className="flex-1 bg-white border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary shadow-sm"
                        required
                      />
                      <div className="flex items-center gap-1 shrink-0 w-24">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={crit.porcentaje}
                          onChange={e => {
                            const updated = [...editCriterios];
                            updated[idx].porcentaje = Number(e.target.value) || 0;
                            setEditCriterios(updated);
                          }}
                          className="w-16 bg-white border border-gray-200 rounded-xl py-1.5 px-2 text-xs font-bold text-center text-gray-900 focus:outline-none focus:border-primary shadow-sm"
                          required
                        />
                        <span className="text-xs font-bold text-gray-500">%</span>
                      </div>
                      {editCriterios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditCriterios(editCriterios.filter((_, i) => i !== idx))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setEditCriterios([...editCriterios, { nombre: `Módulo ${editCriterios.length + 1}`, porcentaje: 0 }])}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>
                    Agregar otro módulo o criterio
                  </button>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || sumaCriterios !== 100}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  {savingEdit ? "Guardando..." : "Guardar Cambios del Aula"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL MATRICULAR ESTUDIANTE DIRECTO EN ESTE CURSO */}
      {/* ========================================================================= */}
      {showMatricularModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Inscripción Directa
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  Matricular Alumno en Esta Aula
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {curso.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMatricularModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleMatricularEstudiante} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Sofía"
                    value={nuevoEstudiante.nombres}
                    onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, nombres: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Martínez Díaz"
                    value={nuevoEstudiante.apellidos}
                    onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, apellidos: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tutor / Padre</label>
                  <input
                    type="text"
                    placeholder="Ej: Roberto Martínez"
                    value={nuevoEstudiante.tutor_nombre}
                    onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, tutor_nombre: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 809-555-0102"
                    value={nuevoEstudiante.tutor_telefono}
                    onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, tutor_telefono: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="tutor@ejemplo.com"
                  value={nuevoEstudiante.email}
                  onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMatricularModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEstudiante}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEstudiante ? "Matriculando..." : "Matricular en Esta Aula"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL OFICIAL DE PROMOCIÓN DE ALUMNOS AL SIGUIENTE NIVEL */}
      {/* ========================================================================= */}
      {showPromoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-black">
                  <span className="material-symbols-outlined text-xl">rocket_launch</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Promover Alumnos al Siguiente Nivel</h3>
                  <p className="text-xs text-purple-200">
                    {curso.nombre} • Nivel Concluido
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoverModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Selección del Curso Destino */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-gray-600 tracking-wider">
                  1. Seleccionar Aula o Curso Destino
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={cursoDestinoSeleccionado}
                    onChange={e => setCursoDestinoSeleccionado(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Selecciona el aula destino --</option>
                    {cursosDisponibles
                      .filter(c => c.id !== curso.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.tipo})
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleCrearSiguienteNivel}
                    disabled={creandoNuevoNivel}
                    className="px-3 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-900 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-xs"
                    title="Crea el siguiente nivel automáticamente si aún no existe en el sistema"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    {creandoNuevoNivel ? "Creando..." : "+ Crear Nivel 2"}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Los estudiantes seleccionados serán transferidos y matriculados formalmente en esta nueva aula.
                </p>
              </div>

              {/* Lista de Alumnos Aprobados y Selección */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase text-gray-600 tracking-wider">
                    2. Estudiantes a Promover ({estudiantesSeleccionadosPromover.length} seleccionados)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEstudiantesSeleccionadosPromover(estudiantesAprobados.map((e: any) => e.id))}
                      className="text-purple-700 hover:underline font-bold text-[11px]"
                    >
                      Seleccionar Todos ({estudiantesAprobados.length})
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => setEstudiantesSeleccionadosPromover([])}
                      className="text-gray-500 hover:underline font-bold text-[11px]"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto bg-gray-50/50">
                  {estudiantesAprobados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No hay estudiantes con nota final aprobatoria (≥ 70) para promover.
                    </div>
                  ) : (
                    estudiantesAprobados.map((est: any) => {
                      const isSelected = estudiantesSeleccionadosPromover.includes(est.id);
                      return (
                        <label
                          key={est.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-purple-50/60" : "hover:bg-gray-100/60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) {
                                  setEstudiantesSeleccionadosPromover(prev => [...prev, est.id]);
                                } else {
                                  setEstudiantesSeleccionadosPromover(prev => prev.filter(id => id !== est.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                            />
                            <div>
                              <span className="text-xs font-bold text-gray-900 block">
                                {est.apellidos}, {est.nombres}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {est.matricula}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800">
                              Promedio: {est.promTotal} pts
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Opción de Cierre de Ciclo */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chkConcluir"
                  checked={concluirCursoActual}
                  onChange={e => setConcluirCursoActual(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                />
                <label htmlFor="chkConcluir" className="text-xs cursor-pointer">
                  <strong className="text-amber-950 block">Marcar esta aula actual como CONCLUIDA / CERRADA</strong>
                  <span className="text-amber-800 text-[11px] block mt-0.5">
                    Archiva el ciclo académico de este grupo actual en el catálogo general preservando el historial.
                  </span>
                </label>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPromoverModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={promoviendo || !cursoDestinoSeleccionado || estudiantesSeleccionadosPromover.length === 0}
                onClick={handlePromoverEstudiantes}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {promoviendo ? "Procesando Promoción..." : `Confirmar y Promover (${estudiantesSeleccionadosPromover.length}) Alumnos`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
