"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCursos, getProfesores, createCurso, updateCurso, deleteCurso, toggleEstadoCurso, getDetalleCursoCompleto } from "@/app/actions/cursos";

const DIAS_OPCIONES = [
  { id: 1, label: "Lun", nombre: "Lunes" },
  { id: 2, label: "Mar", nombre: "Martes" },
  { id: 3, label: "Mié", nombre: "Miércoles" },
  { id: 4, label: "Jue", nombre: "Jueves" },
  { id: 5, label: "Vie", nombre: "Viernes" },
  { id: 6, label: "Sáb", nombre: "Sábado" },
  { id: 0, label: "Dom", nombre: "Domingo" }
];

// Cursos base oficiales de Inglés predefinidos (3 renglones: Kids, Teens, Adultos)
const CURSOS_CATALOGO_PREDEFINIDOS = [
  { 
    idTag: "KID",
    nombre: "Inglés Kids (Niños)", 
    categoria: "Idiomas", 
    totalNiveles: 6, // 18 meses = 6 trimestres (1 año y medio)
    duracionTotalTexto: "18 Meses (6 Niveles / Trimestres)",
    dias: [6], 
    horaInicio: "09:00", 
    horaFin: "12:00", 
    criterios: [
      { nombre: "Oral", porcentaje: 40 },
      { nombre: "Writing", porcentaje: 20 },
      { nombre: "Reading", porcentaje: 10 },
      { nombre: "Dictation", porcentaje: 10 },
      { nombre: "Assistance", porcentaje: 20 }
    ]
  },
  { 
    idTag: "TEEN",
    nombre: "Inglés Teens (Adolescentes)", 
    categoria: "Idiomas", 
    totalNiveles: 4, // 12 meses = 4 trimestres (1 año)
    duracionTotalTexto: "12 Meses (4 Niveles / Trimestres)",
    dias: [6], 
    horaInicio: "09:00", 
    horaFin: "12:00", 
    criterios: [
      { nombre: "Oral", porcentaje: 40 },
      { nombre: "Writing", porcentaje: 20 },
      { nombre: "Reading", porcentaje: 10 },
      { nombre: "Dictation", porcentaje: 10 },
      { nombre: "Assistance", porcentaje: 20 }
    ]
  },
  { 
    idTag: "ADU",
    nombre: "Inglés Adultos", 
    categoria: "Idiomas", 
    totalNiveles: 4, // 12 meses = 4 trimestres (1 año)
    duracionTotalTexto: "12 Meses (4 Niveles / Trimestres)",
    dias: [6], 
    horaInicio: "14:00", 
    horaFin: "18:00", 
    criterios: [
      { nombre: "Oral", porcentaje: 40 },
      { nombre: "Writing", porcentaje: 20 },
      { nombre: "Reading", porcentaje: 10 },
      { nombre: "Dictation", porcentaje: 10 },
      { nombre: "Assistance", porcentaje: 20 }
    ]
  }
];

export default function CursosClient({ 
  initialCursos, 
  initialProfesores 
}: { 
  initialCursos: any[]; 
  initialProfesores: any[] 
}) {
  const router = useRouter();
  const [cursos, setCursos] = useState<any[]>(initialCursos);
  const [profesores] = useState<any[]>(initialProfesores);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Switcher: Activos vs Inactivos / Finalizados
  const [tabEstado, setTabEstado] = useState<"activos" | "inactivos">("activos");

  // Vistas: Tarjetas vs Lista
  const [vistaModo, setVistaModo] = useState<"tarjetas" | "lista">("tarjetas");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 9;

  // Modal Detalle / Expediente 360 del Curso
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [expedienteTab, setExpedienteTab] = useState<"estudiantes" | "asistencia" | "calificaciones">("estudiantes");
  const [expedienteData, setExpedienteData] = useState<any>(null);
  const [loadingExpediente, setLoadingExpediente] = useState(false);

  // Modo de Formulario: Crear vs Editar
  const [editingCursoId, setEditingCursoId] = useState<string | null>(null);

  // Form State: Modalidad de selección (Catálogo existente vs Personalizado / Nuevo)
  const [modoOrigen, setModoOrigen] = useState<"catalogo" | "nuevo">("catalogo");
  const [cursoBaseSeleccionado, setCursoBaseSeleccionado] = useState(CURSOS_CATALOGO_PREDEFINIDOS[0].nombre);
  
  const [codigo, setCodigo] = useState("ING-KID-N1-01");
  const [nombre, setNombre] = useState(CURSOS_CATALOGO_PREDEFINIDOS[0].nombre);
  const [nivelIngles, setNivelIngles] = useState<number>(1);
  const [categoria, setCategoria] = useState(CURSOS_CATALOGO_PREDEFINIDOS[0].categoria);
  const [profesorId, setProfesorId] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>(CURSOS_CATALOGO_PREDEFINIDOS[0].dias);
  const [horaInicio, setHoraInicio] = useState(CURSOS_CATALOGO_PREDEFINIDOS[0].horaInicio);
  const [horaFin, setHoraFin] = useState(CURSOS_CATALOGO_PREDEFINIDOS[0].horaFin);

  // Helper para generar código sugerido automático (ej: "ING-KID-N1-SAB", "INF-01")
  const generarCodigoSugerido = (nombreCurso: string, dias: number[], hora: string, nivel?: number) => {
    let prefijo = "CUR";
    const esKids = nombreCurso.toLowerCase().includes("kid") || nombreCurso.toLowerCase().includes("niño");
    const esTeens = nombreCurso.toLowerCase().includes("teen") || nombreCurso.toLowerCase().includes("adoles");
    const esAdulto = nombreCurso.toLowerCase().includes("adult");

    if (esKids) prefijo = "ING-KID";
    else if (esTeens) prefijo = "ING-TEEN";
    else if (esAdulto) prefijo = "ING-ADU";
    else {
      const palabras = nombreCurso.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
      if (palabras.length >= 2) {
        prefijo = `${palabras[0].slice(0, 3)}-${palabras[1].slice(0, 3)}`.toUpperCase();
      } else if (palabras.length === 1 && palabras[0].length > 0) {
        prefijo = palabras[0].slice(0, 4).toUpperCase();
      }
    }

    const nTag = nivel ? `N${nivel}` : (nombreCurso.match(/Nivel\s*(\d+)/i) ? `N${nombreCurso.match(/Nivel\s*(\d+)/i)![1]}` : "");
    const esSabado = dias.includes(6);
    const tagDia = esSabado ? "SAB" : "SEM";
    const horaTag = hora ? hora.replace(":", "").slice(0, 2) : "01";

    const partes = [prefijo];
    if (nTag) partes.push(nTag);
    partes.push(tagDia);
    partes.push(horaTag);
    return partes.join("-");
  };

  // Helper para separar código del nombre (ej: "[ING-KID-01] Inglés Niños" -> { codigo: "ING-KID-01", titulo: "Inglés Niños" })
  const extraerCodigoYNombre = (nombreCompleto: string) => {
    const match = (nombreCompleto || "").match(/^\[([^\]]+)\]\s*(.*)$/);
    if (match) {
      return { codigo: match[1], titulo: match[2] };
    }
    return { codigo: null, titulo: nombreCompleto || "" };
  };

  // Fechas del Ciclo (Inicio y Fin del curso)
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });

  // Estructura Modular y Duración en Meses
  const [duracionMeses, setDuracionMeses] = useState<number>(3);
  const [esModular, setEsModular] = useState<boolean>(false);
  const [nombresModulos, setNombresModulos] = useState<string[]>([]);

  // Criterios Dinámicos iniciales (Rigen cada mes/módulo por igual)
  const [criterios, setCriterios] = useState<{ nombre: string; porcentaje: number }[]>([
    { nombre: "Asistencia y Puntualidad", porcentaje: 20 },
    { nombre: "Prácticas de Aula", porcentaje: 40 },
    { nombre: "Prueba / Examen del Módulo", porcentaje: 40 }
  ]);

  const sumaCriterios = criterios.reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);

  async function refreshData() {
    const data = await getCursos();
    setCursos(data);
  }

  // Abrir Expediente 360 del Curso al darle clic
  const handleAbrirExpediente = async (curso: any) => {
    setSelectedCurso(curso);
    setExpedienteTab("estudiantes");
    setLoadingExpediente(true);
    const res = await getDetalleCursoCompleto(curso.id);
    if (res.success) {
      setExpedienteData(res);
    } else {
      setExpedienteData({
        curso,
        estudiantes: [],
        asistencias: [],
        fechasTomadas: [],
        calificaciones: []
      });
    }
    setLoadingExpediente(false);
  };

  // Abrir modal en modo crear
  const openCrearModal = () => {
    setEditingCursoId(null);
    setModoOrigen("catalogo");
    const item = CURSOS_CATALOGO_PREDEFINIDOS[0];
    setCursoBaseSeleccionado(item.nombre);
    setNombre(item.nombre);
    setCategoria(item.categoria);
    setProfesorId("");
    setDiasSeleccionados([...item.dias]);
    setHoraInicio(item.horaInicio);
    setHoraFin(item.horaFin);
    setCodigo(generarCodigoSugerido(item.nombre, item.dias, item.horaInicio));
    setCriterios(item.criterios.map(c => ({ ...c })));
    setShowModal(true);
  };

  // Abrir modal en modo edición para un curso existente
  const openEditarModal = (curso: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const info = extraerCodigoYNombre(curso.nombre || "");
    setEditingCursoId(curso.id);
    setModoOrigen("nuevo");
    setNombre(info.titulo);
    setCodigo(info.codigo || generarCodigoSugerido(info.titulo, curso.dias_semana || [6], curso.hora_inicio || "08:00"));
    setCategoria(curso.tipo || "Idiomas");
    setProfesorId(curso.profesor_id || curso.profesor?.id || "");
    setDiasSeleccionados(Array.isArray(curso.dias_semana) ? [...curso.dias_semana] : [6]);
    setHoraInicio(curso.hora_inicio || "08:00");
    setHoraFin(curso.hora_fin || "10:00");
    if (curso.criterios && curso.criterios.length > 0) {
      setCriterios(curso.criterios.map((c: any) => ({
        nombre: c.nombre,
        porcentaje: Number(c.porcentaje) || 0
      })));
    } else {
      setCriterios([
        { nombre: "Oral", porcentaje: 40 },
        { nombre: "Writing", porcentaje: 20 },
        { nombre: "Reading", porcentaje: 10 },
        { nombre: "Dictation", porcentaje: 10 },
        { nombre: "Assistance", porcentaje: 20 }
      ]);
    }

    const matchNivel = info.titulo.match(/Nivel\s*(\d+)/i);
    if (matchNivel) {
      setNivelIngles(parseInt(matchNivel[1], 10) || 1);
    } else {
      setNivelIngles(1);
    }

    // Cargar configuración de duración y esquema directamente del curso
    if (curso.modalidad_evaluacion) {
      setEsModular(curso.modalidad_evaluacion === 'MODULOS');
    } else {
      setEsModular(curso.tipo === "Idiomas" || curso.nombre?.toLowerCase().includes("informa"));
    }

    if (curso.total_periodos && curso.total_periodos > 0) {
      setDuracionMeses(curso.total_periodos);
    } else {
      setDuracionMeses(3);
    }

    if (Array.isArray(curso.nombres_periodos) && curso.nombres_periodos.length > 0) {
      setNombresModulos(curso.nombres_periodos);
    } else {
      setNombresModulos([]);
    }

    if (selectedCurso?.id === curso.id) {
      setSelectedCurso(null);
    }
    setShowModal(true);
  };

  // Auto-abrir modal de edición si se pasa ?editar=ID por URL desde la página del curso
  const searchParams = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get("editar");
    if (editId && cursos.length > 0) {
      const target = cursos.find(c => c.id === editId);
      if (target) {
        openEditarModal(target);
      }
    }
  }, [searchParams, cursos]);

  // Periodo / Frecuencia de Evaluación del Curso
  const [periodoEvaluacion, setPeriodoEvaluacion] = useState<string>("Mensual");

  // Cuando el director selecciona un curso del catálogo base
  const handleSeleccionarCatalogo = (nombreCurso: string, nivelSeleccionado: number = nivelIngles) => {
    setCursoBaseSeleccionado(nombreCurso);
    if (nombreCurso === "__custom__") {
      setModoOrigen("nuevo");
      setNombre("");
      setCodigo("");
      return;
    }
    const item = CURSOS_CATALOGO_PREDEFINIDOS.find(c => c.nombre === nombreCurso);
    if (item) {
      setModoOrigen("catalogo");
      const esIngles = item.categoria === "Idiomas";
      const nombreCompleto = esIngles 
        ? `${item.nombre} - Nivel ${nivelSeleccionado}`
        : item.nombre;
      setNombre(nombreCompleto);
      setCategoria(item.categoria);
      setCodigo(generarCodigoSugerido(item.nombre, diasSeleccionados, horaInicio, esIngles ? nivelSeleccionado : undefined));
      setCriterios(item.criterios.map(c => ({ ...c })));
      if (esIngles) {
        setEsModular(false);
        setDuracionMeses(3);
        setNombresModulos([]);
      }
    }
  };

  // Atajos rápidos para días de asistencia
  const aplicarAtajoDias = (dias: number[]) => {
    setDiasSeleccionados(dias);
    if (codigo) {
      setCodigo(generarCodigoSugerido(nombre, dias, horaInicio));
    }
  };

  const toggleDia = (diaId: number) => {
    let nuevosDias: number[];
    if (diasSeleccionados.includes(diaId)) {
      if (diasSeleccionados.length > 1) {
        nuevosDias = diasSeleccionados.filter(d => d !== diaId);
      } else {
        nuevosDias = diasSeleccionados;
      }
    } else {
      nuevosDias = [...diasSeleccionados, diaId].sort();
    }
    setDiasSeleccionados(nuevosDias);
  };

  const addCriterio = () => {
    setCriterios([...criterios, { nombre: "Nuevo Criterio", porcentaje: 0 }]);
  };

  const removeCriterio = (idx: number) => {
    if (criterios.length > 1) {
      setCriterios(criterios.filter((_, i) => i !== idx));
    }
  };

  const updateCriterio = (idx: number, field: "nombre" | "porcentaje", val: any) => {
    const updated = [...criterios];
    if (field === "porcentaje") {
      updated[idx].porcentaje = Number(val) || 0;
    } else {
      updated[idx].nombre = val;
    }
    setCriterios(updated);
  };

  const handleGuardarCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("El nombre del curso es obligatorio");
    if (sumaCriterios !== 100) {
      return alert(`Los criterios de calificación deben sumar exactamente 100%. Actualmente suman ${sumaCriterios}%.`);
    }

    setSaving(true);

    // Formatear el nombre con el código si fue especificado: "[ING-KID-01] Inglés Niños"
    const nombreLimpio = nombre.replace(/^\[[^\]]+\]\s*/, "").trim();
    const codigoLimpio = codigo.trim().toUpperCase();
    const nombreFinal = codigoLimpio ? `[${codigoLimpio}] ${nombreLimpio}` : nombreLimpio;

    let res;
    if (editingCursoId) {
      res = await updateCurso({
        id: editingCursoId,
        nombre: nombreFinal,
        tipo: categoria,
        profesor_id: profesorId,
        dias_semana: diasSeleccionados,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        modalidad_evaluacion: esModular ? 'MODULOS' : 'MESES',
        total_periodos: duracionMeses || 3,
        nombres_periodos: nombresModulos,
        criterios
      });
    } else {
      res = await createCurso({
        nombre: nombreFinal,
        tipo: categoria,
        profesor_id: profesorId,
        dias_semana: diasSeleccionados,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        modalidad_evaluacion: esModular ? 'MODULOS' : 'MESES',
        total_periodos: duracionMeses || 3,
        nombres_periodos: nombresModulos,
        criterios
      });
    }

    if (res.success) {
      setShowModal(false);
      setEditingCursoId(null);
      await refreshData();
    } else {
      alert("Error: " + res.error);
    }
    setSaving(false);
  };

  const handleToggleEstado = async (id: string, nuevoEstado: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCursos(prev => prev.map(c => c.id === id ? { ...c, activo: nuevoEstado } : c));
    if (selectedCurso?.id === id) {
      setSelectedCurso((prev: any) => ({ ...prev, activo: nuevoEstado }));
    }
    await toggleEstadoCurso(id, nuevoEstado);
  };

  const handleDeleteDefinitivo = async (id: string, nombreCurso: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`⚠️ ELIMINACIÓN DEFINITIVA: ¿Seguro que deseas eliminar el curso "${nombreCurso}"? Esta acción borrará el aula y no se puede deshacer.`)) {
      setCursos(prev => prev.filter(c => c.id !== id));
      if (selectedCurso?.id === id) setSelectedCurso(null);
      await deleteCurso(id);
      await refreshData();
    }
  };

  // Filtrado
  const cursosPorEstado = cursos.filter(c => tabEstado === "activos" ? c.activo !== false : c.activo === false);

  const filtrados = cursosPorEstado.filter(c => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const n = (c.nombre || "").toLowerCase();
    const t = (c.tipo || "").toLowerCase();
    const p = (c.profesor?.nombre || "").toLowerCase();
    return n.includes(q) || t.includes(q) || p.includes(q);
  });

  // Paginación
  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const cursosPaginados = filtrados.slice(indexInicio, indexInicio + itemsPorPagina);

  const totalActivos = cursos.filter(c => c.activo !== false).length;
  const totalInactivos = cursos.filter(c => c.activo === false).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12">
      
      {/* Header Coordinación de Cursos */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Planificación Curricular
          </span>
          <h1 className="text-xl sm:text-2xl font-display font-black text-gray-900 tracking-tight mt-0.5">
            Gestor de Cursos & Aulas
          </h1>
          <p className="text-xs text-gray-500 font-medium">Crea o edita cursos, define evaluaciones mensuales/trimestrales y matricula alumnos.</p>
        </div>

        <button 
          onClick={openCrearModal}
          className="bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Crear Nuevo Curso
        </button>
      </div>

      {/* Barra de Control */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Switcher Estado */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => { setTabEstado("activos"); setPaginaActual(1); }}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tabEstado === "activos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Cursos Abiertos ({totalActivos})
          </button>
          <button
            onClick={() => { setTabEstado("inactivos"); setPaginaActual(1); }}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tabEstado === "inactivos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Cerrados / Histórico ({totalInactivos})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por curso, tipo o profesor..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
            className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-primary transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Selector de Vista: Tarjetas vs Lista */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
          <button
            onClick={() => setVistaModo("tarjetas")}
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all ${
              vistaModo === "tarjetas" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-700"
            }`}
            title="Vista de Tarjetas"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button
            onClick={() => setVistaModo("lista")}
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all ${
              vistaModo === "lista" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-700"
            }`}
            title="Vista de Lista / Tabla"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          </button>
        </div>

      </div>

      {/* Contenido Principal */}
      {filtrados.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">auto_stories</span>
          <h3 className="font-bold text-gray-800 text-sm">
            {tabEstado === "activos" ? "No hay cursos abiertos encontrados" : "No hay cursos cerrados"}
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            {busqueda ? `Sin coincidencias para "${busqueda}".` : "Crea tu primer curso usando el botón superior."}
          </p>
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="mt-2 text-xs font-bold text-primary hover:underline">
              Limpiar filtro
            </button>
          )}
        </div>
      ) : vistaModo === "tarjetas" ? (
        /* VISTA 1: TARJETAS CON BOTÓN DIRECTO DE MATRICULAR ALUMNOS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursosPaginados.map(c => {
            const diasTxt = (c.dias_semana || []).map((d: number) => DIAS_OPCIONES.find(op => op.id === d)?.label).filter(Boolean).join(" · ");
            const esSabatino = Array.isArray(c.dias_semana) && c.dias_semana.length === 1 && c.dias_semana[0] === 6;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div 
                      onClick={() => router.push(`/admin/dashboard/cursos/${c.id}`)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      {(() => {
                        const { codigo: codBadge, titulo } = extraerCodigoYNombre(c.nombre);
                        return (
                          <>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {codBadge && (
                                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-gray-900 text-amber-400 tracking-wider shadow-sm">
                                  {codBadge}
                                </span>
                              )}
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                esSabatino ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                              }`}>
                                {esSabatino ? "Sabatino" : "Semanal"}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold truncate">{c.tipo}</span>
                            </div>
                            <h3 className="font-black text-gray-900 text-base leading-tight truncate group-hover:text-primary transition-colors">
                              {titulo}
                            </h3>
                          </>
                        );
                      })()}
                    </div>

                    {c.activo === false ? (
                      <button 
                        onClick={(e) => handleDeleteDefinitivo(c.id, c.nombre, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Eliminar curso definitivamente"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => handleToggleEstado(c.id, false, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0"
                        title="Desactivar / Cerrar Grupo"
                      >
                        <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                      </button>
                    )}
                  </div>

                  {/* Datos del Aula: Frecuencia de Asistencia y Horario */}
                  <div 
                    onClick={() => router.push(`/admin/dashboard/cursos/${c.id}`)}
                    className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3 space-y-1 text-xs cursor-pointer hover:bg-amber-50/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Docente a cargo:</span>
                      <strong className="text-gray-900 truncate ml-2">
                        {c.profesor?.nombre || "Sin profesor asignado"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Pase de Lista:</span>
                      <strong className="text-amber-700 font-bold">{diasTxt || "Días flexibles"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Horario:</span>
                      <span className="text-gray-700 font-mono font-bold">
                        {c.hora_inicio || "Flexible"} {c.hora_fin ? `- ${c.hora_fin}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Criterios de Evaluación */}
                  <div 
                    onClick={() => router.push(`/admin/dashboard/cursos/${c.id}`)}
                    className="cursor-pointer"
                  >
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Calificación Oficial ({c.criterios?.length || 0} criterios):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.criterios?.map((crit: any) => (
                        <span key={crit.id} className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded font-bold">
                          {crit.nombre} ({crit.porcentaje}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer de Tarjeta con Botón de Inscribir / Matricular y Editar */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/dashboard/estudiantes?curso=${c.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
                      title="Inscribir o matricular estudiantes en este curso"
                    >
                      <span className="material-symbols-outlined text-[15px]">person_add</span>
                      Matricular
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditarModal(c, e);
                      }}
                      className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 font-bold bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                      title="Editar nombre, horario o criterios de calificación"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      Editar
                    </button>
                  </div>

                  <Link
                    href={`/admin/dashboard/cursos/${c.id}`}
                    className="text-gray-400 group-hover:text-primary font-bold flex items-center gap-0.5"
                  >
                    Ver Expediente <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: LISTA / TABLA COMPACTA */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Curso / Aula</th>
                  <th className="py-3 px-4">Docente Responsable</th>
                  <th className="py-3 px-4">Días de Clase</th>
                  <th className="py-3 px-4">Horario</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Inscripciones & Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cursosPaginados.map(c => {
                  const diasTxt = (c.dias_semana || []).map((d: number) => DIAS_OPCIONES.find(op => op.id === d)?.label).filter(Boolean).join(" · ");

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => router.push(`/admin/dashboard/cursos/${c.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        {(() => {
                          const { codigo: codBadge, titulo } = extraerCodigoYNombre(c.nombre);
                          return (
                            <div className="flex items-center gap-2">
                              {codBadge && (
                                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-gray-900 text-amber-400 tracking-wider shadow-sm shrink-0">
                                  {codBadge}
                                </span>
                              )}
                              <div>
                                <strong className="text-gray-900 block">{titulo}</strong>
                                <span className="text-[11px] text-gray-400">{c.tipo}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {c.profesor?.nombre || "Sin asignar"}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        {diasTxt || "Días flexibles"}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {c.hora_inicio || "--"} {c.hora_fin ? `- ${c.hora_fin}` : ""}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          c.activo !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                        }`}>
                          {c.activo !== false ? "Abierto" : "Cerrado"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <Link
                            href={`/admin/dashboard/estudiantes?curso=${c.id}`}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">person_add</span>
                            Matricular
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => openEditarModal(c, e)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                            title="Editar curso"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Editar
                          </button>

                          {c.activo === false ? (
                            <>
                              <button
                                onClick={() => handleToggleEstado(c.id, true)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[11px]"
                              >
                                Reabrir
                              </button>
                              <button
                                onClick={(e) => handleDeleteDefinitivo(c.id, c.nombre, e)}
                                className="p-1 text-red-500 hover:text-red-700 rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleEstado(c.id, false)}
                              className="px-2 py-1 bg-gray-100 hover:bg-amber-50 hover:text-amber-700 font-bold text-gray-600 rounded text-[11px]"
                            >
                              Cerrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-200/80 shadow-sm text-xs font-bold text-gray-500">
          <span>Página {paginaActual} de {totalPaginas}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setPaginaActual(num)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  paginaActual === num ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPEDIENTE 360 DEL CURSO (ESTUDIANTES, ASISTENCIA Y CALIFICACIONES) */}
      {/* ========================================================================= */}
      {selectedCurso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            
            {/* Header del Expediente */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="min-w-0 pr-2">
                {(() => {
                  const { codigo: codBadge, titulo } = extraerCodigoYNombre(selectedCurso.nombre);
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {codBadge && (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-gray-900 text-amber-400 tracking-wider shadow-sm">
                            {codBadge}
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
                          Expediente Oficial de Aula
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          selectedCurso.activo !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                        }`}>
                          {selectedCurso.activo !== false ? "Aula Abierta" : "Aula Cerrada"}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                        {titulo}
                      </h3>
                    </>
                  );
                })()}
                <p className="text-xs text-gray-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                  <span><strong>Área:</strong> {selectedCurso.tipo}</span>
                  <span>•</span>
                  <span><strong>Docente:</strong> {selectedCurso.profesor?.nombre || "Sin profesor asignado"}</span>
                  <span>•</span>
                  <span><strong>Horario:</strong> {selectedCurso.hora_inicio || "Flexible"} - {selectedCurso.hora_fin || ""}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEditarModal(selectedCurso)}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1 transition-colors"
                  title="Editar datos de este curso"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  Editar
                </button>
                <button 
                  onClick={() => setSelectedCurso(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Switcher / Pestañas de Vista */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl my-3">
              <button
                onClick={() => setExpedienteTab("estudiantes")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expedienteTab === "estudiantes" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">groups</span>
                Alumnos Matriculados ({expedienteData?.estudiantes?.length || 0})
              </button>

              <button
                onClick={() => setExpedienteTab("asistencia")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expedienteTab === "asistencia" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                Asistencia del Ciclo
              </button>

              <button
                onClick={() => setExpedienteTab("calificaciones")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expedienteTab === "calificaciones" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grade</span>
                Sábana de Calificaciones
              </button>
            </div>

            {/* Contenido con Scroll según Pestaña */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loadingExpediente ? (
                <div className="p-12 text-center text-xs text-gray-400 font-bold">
                  Cargando expediente del curso...
                </div>
              ) : expedienteTab === "estudiantes" ? (
                /* ================= PESTAÑA 1: LISTA DE ESTUDIANTES ================= */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                      Estudiantes Registrados ({expedienteData?.estudiantes?.length || 0})
                    </span>
                    <Link
                      href={`/admin/dashboard/estudiantes?curso=${selectedCurso.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">person_add</span>
                      + Inscribir Nuevo Alumno Aquí
                    </Link>
                  </div>

                  {!expedienteData?.estudiantes || expedienteData.estudiantes.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="material-symbols-outlined text-3xl text-gray-300 mb-1">person_off</span>
                      <p className="text-xs font-bold text-gray-700">No hay alumnos inscritos en este curso todavía.</p>
                      <Link
                        href={`/admin/dashboard/estudiantes?curso=${selectedCurso.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-xl shadow-sm hover:bg-primary-hover"
                      >
                        <span className="material-symbols-outlined text-[15px]">person_add</span>
                        Matricular Primer Estudiante
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden text-xs">
                      {expedienteData.estudiantes.map((est: any) => (
                        <div key={est.id} className="p-3 bg-white hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-gray-900 font-bold">{est.apellidos}, {est.nombres}</strong>
                              <span className="font-mono text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                                {est.matricula}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                              <span>Tutor: {est.tutor_nombre || "No registrado"}</span>
                              {est.tutor_telefono && (
                                <>
                                  <span>•</span>
                                  <a 
                                    href={`https://wa.me/1${est.tutor_telefono.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">chat</span>
                                    {est.tutor_telefono}
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div className="bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                              <span className="block text-[9px] text-amber-800 uppercase font-black">Asistencia</span>
                              <strong className="text-xs font-black text-amber-900">{est.metricas?.pctAsistencia ?? 100}%</strong>
                            </div>
                            <div className="bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200/60">
                              <span className="block text-[9px] text-purple-800 uppercase font-black">Nota Final</span>
                              <strong className="text-xs font-black text-purple-900">
                                {est.metricas?.notaFinal !== null ? `${est.metricas.notaFinal}/100` : "Pendiente"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : expedienteTab === "asistencia" ? (
                /* ================= PESTAÑA 2: ASISTENCIA Y CALENDARIO DEL CICLO ================= */
                <div className="space-y-3">
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="text-amber-950 block text-xs">Auditoría de Asistencias del Ciclo</strong>
                      <p className="text-amber-800 text-[11px]">
                        Listas tomadas: <strong>{expedienteData?.fechasTomadas?.length || 0} sesiones oficiales</strong> registradas.
                      </p>
                    </div>
                    <Link
                      href={`/admin/dashboard/cursos/${selectedCurso.id}`}
                      className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0 self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-[15px]">fact_check</span>
                      Ver Expediente Completo
                    </Link>
                  </div>

                  {!expedienteData?.fechasTomadas || expedienteData.fechasTomadas.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                      <span className="material-symbols-outlined text-3xl text-gray-300 mb-1">event_busy</span>
                      <p className="font-bold text-gray-700">Aún no se ha registrado pase de lista en este curso.</p>
                      <p className="text-gray-400 mt-0.5">El docente o la dirección pueden iniciar el registro en cualquier fecha de clase.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expedienteData.fechasTomadas.map((f: string) => {
                        const registrosFecha = expedienteData.asistencias.filter((a: any) => a.fecha === f);
                        const presentes = registrosFecha.filter((a: any) => a.estado === 'PRESENTE').length;
                        const ausentes = registrosFecha.filter((a: any) => a.estado === 'AUSENTE').length;
                        const tardanzas = registrosFecha.filter((a: any) => a.estado === 'TARDANZA').length;

                        return (
                          <div key={f} className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <strong className="text-gray-900 block font-bold">Fecha: {f}</strong>
                              <span className="text-gray-400 text-[11px] font-medium">
                                Total alumnos auditados: {registrosFecha.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                {presentes} Presentes
                              </span>
                              {tardanzas > 0 && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold">
                                  {tardanzas} Tardanzas
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded font-bold border ${
                                ausentes > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-400 border-gray-200"
                              }`}>
                                {ausentes} Ausentes
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ================= PESTAÑA 3: CALIFICACIONES ================= */
                <div className="space-y-3">
                  <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="text-purple-950 block text-xs">Criterios de Evaluación Configuradas (100%)</strong>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedCurso.criterios?.map((c: any) => (
                          <span key={c.id} className="bg-white border border-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold text-[11px]">
                            {c.nombre}: <strong>{c.porcentaje}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/admin/dashboard/cursos/${selectedCurso.id}`}
                      className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0 self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit_note</span>
                      Abrir Expediente y Sábana
                    </Link>
                  </div>

                  {!expedienteData?.estudiantes || expedienteData.estudiantes.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 font-bold">
                      No hay estudiantes para calificar en este curso aún.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                            <th className="p-2.5 px-3">Estudiante</th>
                            {selectedCurso.criterios?.map((c: any) => (
                              <th key={c.id} className="p-2.5 px-2 text-center">
                                {c.nombre} ({c.porcentaje}%)
                              </th>
                            ))}
                            <th className="p-2.5 px-3 text-right">Nota Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {expedienteData.estudiantes.map((est: any) => (
                            <tr key={est.id} className="hover:bg-gray-50/50">
                              <td className="p-2.5 px-3 font-bold text-gray-900">
                                {est.apellidos}, {est.nombres}
                              </td>
                              {selectedCurso.criterios?.map((c: any) => {
                                const cal = expedienteData.calificaciones?.find(
                                  (calRecord: any) => calRecord.estudiante_id === est.id && calRecord.criterio_id === c.id
                                );
                                return (
                                  <td key={c.id} className="p-2.5 px-2 text-center font-mono font-bold text-gray-700">
                                    {cal ? cal.calificacion : "--"}
                                  </td>
                                );
                              })}
                              <td className="p-2.5 px-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                                  est.metricas?.notaFinal >= 70 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : est.metricas?.notaFinal !== null 
                                    ? "bg-red-100 text-red-800" 
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                  {est.metricas?.notaFinal !== null ? est.metricas.notaFinal : "--"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal Expediente */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <Link
                href={`/admin/dashboard/estudiantes?curso=${selectedCurso.id}`}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Matricular Alumnos en Este Curso
              </Link>

              <button
                onClick={() => setSelectedCurso(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR O EDITAR CURSO (LIMPIO, CON EVALUACIÓN TRIMESTRAL/MENSUAL) */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {editingCursoId ? "Edición de Aula & Criterios" : "Apertura de Aula"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                  {editingCursoId ? `Editar: ${nombre || "Curso"}` : "Crear o Abrir Curso"}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {editingCursoId 
                    ? "Modifica el docente, horario o el esquema de notas de los 3 meses."
                    : "Elige un curso del catálogo o escribe el nombre de uno nuevo."}
                </p>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditingCursoId(null); }} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarCurso} className="space-y-4 flex-1 overflow-y-auto pr-1">
              
              {/* Selector: ¿Elegir del Catálogo o Crear uno Nuevo? */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Seleccionar Curso Existente o Escribir Nuevo:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (modoOrigen === "catalogo") {
                        setModoOrigen("nuevo");
                        setNombre("");
                      } else {
                        handleSeleccionarCatalogo(CURSOS_CATALOGO_PREDEFINIDOS[0].nombre);
                      }
                    }}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    {modoOrigen === "catalogo" ? "✏️ Escribir nombre personalizado" : "📚 Elegir del catálogo"}
                  </button>
                </div>

                {modoOrigen === "catalogo" ? (
                  <div className="space-y-2">
                    <select
                      value={cursoBaseSeleccionado}
                      onChange={e => handleSeleccionarCatalogo(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary shadow-sm"
                    >
                      {CURSOS_CATALOGO_PREDEFINIDOS.map(item => (
                        <option key={item.nombre} value={item.nombre}>
                          {item.nombre} — [Programa Oficial]
                        </option>
                      ))}
                      <option value="__custom__">➕ Otro curso / taller personalizado...</option>
                    </select>

                    {/* Selector de Nivel TRIMESTRAL (Exclusivo para programas de Inglés) */}
                    {categoria === "Idiomas" && (() => {
                      const progActual = CURSOS_CATALOGO_PREDEFINIDOS.find(c => c.nombre === cursoBaseSeleccionado) || CURSOS_CATALOGO_PREDEFINIDOS[0];
                      const maxNiveles = progActual.totalNiveles || 4;
                      return (
                        <div className="p-2.5 bg-purple-50/80 rounded-xl border border-purple-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-purple-700">stairs</span>
                              Nivel del Programa (Trimestre):
                            </label>
                            <span className="text-[10px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200">
                              Nivel {nivelIngles} de {maxNiveles} ({progActual.duracionTotalTexto})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {Array.from({ length: maxNiveles }, (_, i) => i + 1).map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setNivelIngles(n);
                                  handleSeleccionarCatalogo(cursoBaseSeleccionado, n);
                                }}
                                className={`flex-1 min-w-[62px] py-1.5 px-2 rounded-lg text-xs font-black transition-all text-center ${
                                  nivelIngles === n
                                    ? "bg-purple-900 text-white shadow-sm ring-2 ring-purple-400/40"
                                    : "bg-white text-purple-900 border border-purple-200 hover:bg-purple-100/60"
                                }`}
                              >
                                Nivel {n}
                              </button>
                            ))}
                            <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-lg px-2 py-0.5 shrink-0">
                              <span className="text-[10px] font-bold text-purple-900">Otro:</span>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={nivelIngles > maxNiveles ? nivelIngles : ""}
                                placeholder={`${maxNiveles + 1}+`}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val > 0) {
                                    setNivelIngles(val);
                                    handleSeleccionarCatalogo(cursoBaseSeleccionado, val);
                                  }
                                }}
                                className="w-8 text-center text-xs font-black text-purple-950 focus:outline-none"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-purple-700/80 font-medium">
                            Cada nivel dura 1 trimestre (3 meses). Al terminar el nivel, se promueve a los aprobados.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div>
                    <input 
                      type="text" 
                      value={nombre} 
                      onChange={e => {
                        const val = e.target.value;
                        setNombre(val);
                        if (!editingCursoId) {
                          setCodigo(generarCodigoSugerido(val, diasSeleccionados, horaInicio));
                        }
                      }}
                      placeholder="Ej: Taller de Locución y Oratoria, Francés Básico, Robótica..." 
                      className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary shadow-sm"
                      required
                      autoFocus
                    />
                  </div>
                )}

                {/* Código o Sección de Aula (Para diferenciar 10 cursos de inglés simultáneos) */}
                <div className="pt-2 border-t border-gray-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-amber-600">tag</span>
                      Código de Aula / Sección *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCodigo(generarCodigoSugerido(nombre, diasSeleccionados, horaInicio))}
                      className="text-[10px] font-bold text-amber-700 hover:underline"
                    >
                      ⚡ Generar Código
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codigo}
                      onChange={e => setCodigo(e.target.value.toUpperCase())}
                      placeholder="Ej: ING-KID-SAB-01"
                      className="flex-1 bg-white border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:border-primary shadow-sm"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Permite diferenciar entre múltiples grupos del mismo curso (ej: Grupo 01, Grupo 02, etc.).
                  </p>
                </div>
              </div>

              {/* Categoría y Docente Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoría / Área *</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    <option value="Idiomas">Idiomas (Inglés / Francés)</option>
                    <option value="Infotep">Infotep / Cursos Técnicos</option>
                    <option value="Talleres">Talleres Especiales / Masterclass</option>
                    <option value="Deportes">Deportes (Basketball)</option>
                    <option value="Arte & Música">Arte & Música</option>
                    <option value="Otro">Otra Disciplina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Profesor Responsable <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <select
                    value={profesorId}
                    onChange={e => setProfesorId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    <option value="">⏳ Sin profesor asignado aún (Por definir)</option>
                    {profesores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Días de Asistencia y Horario */}
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                    Días en que se pasará lista:
                  </span>
                  
                  {/* Botones de atajo rápido */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => aplicarAtajoDias([6])}
                      className="text-[10px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
                    >
                      Solo Sábados
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoDias([1, 2, 3, 4, 5])}
                      className="text-[10px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
                    >
                      Lunes a Viernes
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoDias([2, 4])}
                      className="text-[10px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
                    >
                      Mar y Jue
                    </button>
                  </div>
                </div>

                {/* Toggles de días */}
                <div className="flex gap-1.5 flex-wrap">
                  {DIAS_OPCIONES.map(dia => {
                    const selected = diasSeleccionados.includes(dia.id);
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => toggleDia(dia.id)}
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
                      value={horaInicio}
                      onChange={e => setHoraInicio(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={horaFin}
                      onChange={e => setHoraFin(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-gray-800"
                    />
                  </div>
                </div>

                {/* Fechas Oficiales del Ciclo: Cuándo inicia y cuándo finaliza */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/50">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-amber-700">event_available</span>
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={e => setFechaInicio(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-amber-700">event_busy</span>
                      Fecha de Cierre / Fin *
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={e => setFechaFin(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-gray-900"
                      required
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
                      onClick={() => setEsModular(false)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        !esModular
                          ? "bg-purple-900 border-purple-900 text-white shadow-sm"
                          : "bg-white border-purple-200 text-purple-950 hover:bg-purple-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span className="material-symbols-outlined text-[17px]">
                          {!esModular ? "radio_button_checked" : "radio_button_unchecked"}
                        </span>
                        Por Meses (Promedio Final)
                      </div>
                      <p className={`text-[10px] mt-1 ${!esModular ? "text-purple-200" : "text-gray-500"}`}>
                        Ej: Inglés. Se evalúa cada mes y al final se promedian todos los meses.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEsModular(true)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        esModular
                          ? "bg-purple-900 border-purple-900 text-white shadow-sm"
                          : "bg-white border-purple-200 text-purple-950 hover:bg-purple-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span className="material-symbols-outlined text-[17px]">
                          {esModular ? "radio_button_checked" : "radio_button_unchecked"}
                        </span>
                        Por Módulos (Aprobación Modular)
                      </div>
                      <p className={`text-[10px] mt-1 ${esModular ? "text-purple-200" : "text-gray-500"}`}>
                        Ej: Informática. Cada módulo se aprueba con mín. 70 y se saca promedio al final.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Pregunta directa de cantidad de meses o módulos */}
                <div className="pt-2 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black text-purple-950 uppercase tracking-wider">
                      {esModular ? "¿Cuántos módulos tiene?" : "¿Cuántos meses dura?"}
                    </label>
                    <p className="text-[11px] text-purple-800/80 font-medium">
                      {esModular ? "Generará una pestaña por cada módulo." : "Generará una pestaña por cada mes."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-purple-200 shadow-sm">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={duracionMeses}
                      onChange={e => {
                        const val = Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1));
                        setDuracionMeses(val);
                        try {
                          localStorage.setItem(`duracion_curso_${editingCursoId || nombre.trim()}`, String(val));
                        } catch (_) {}
                        const d = new Date(fechaInicio || Date.now());
                        d.setMonth(d.getMonth() + val);
                        setFechaFin(d.toISOString().split('T')[0]);
                        setNombresModulos(prev => {
                          const arr = [...prev];
                          return Array.from({ length: val }, (_, i) => arr[i] || (esModular ? `Módulo ${i + 1}` : `Mes ${i + 1}`));
                        });
                      }}
                      className="w-14 text-center bg-purple-50 border border-purple-200 rounded-lg py-1 text-sm font-black text-purple-900 focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-xs font-bold text-purple-900 pr-1.5">
                      {esModular ? (duracionMeses === 1 ? "módulo" : "módulos") : (duracionMeses === 1 ? "mes" : "meses")}
                    </span>
                  </div>
                </div>

                {/* Si es modular, nombres opcionales de módulos */}
                {esModular && (
                  <div className="pt-2 border-t border-purple-200/60 space-y-2">
                    <span className="text-[11px] font-bold text-purple-950 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-purple-700">edit_note</span>
                      Nombres de los módulos (Opcional):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {Array.from({ length: duracionMeses }).map((_, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-purple-200/80 shadow-sm">
                          <label className="block text-[10px] font-black uppercase text-purple-900 mb-0.5">
                            Módulo {idx + 1}
                          </label>
                        <input
                          type="text"
                          value={nombresModulos[idx] || ""}
                          onChange={e => {
                            const updated = [...nombresModulos];
                            updated[idx] = e.target.value;
                            setNombresModulos(updated);
                          }}
                          placeholder={`Ej: ${idx === 0 ? "Windows" : idx === 1 ? "Word" : "Excel"}`}
                          className="w-full bg-purple-50/30 border border-purple-100 rounded-lg py-1 px-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

              {/* 2. CÓMO SE VA A EVALUAR */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider">
                  {esModular ? "Criterios de Evaluación Modular (100% por Módulo)" : "Criterios de Evaluación Oficial (100% Total)"}
                </label>
                <p className="text-[11px] text-gray-500 font-medium">
                  {esModular 
                    ? `Este esquema de evaluación rige cada uno de los ${duracionMeses} módulos. Al final se promedian todos.` 
                    : "Este esquema rige la calificación total y definitiva del curso."}
                </p>
              </div>
                  <div className={`px-2.5 py-1 rounded-xl font-black text-xs shrink-0 ${
                    sumaCriterios === 100 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    Total: {sumaCriterios}% / 100%
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {criterios.map((crit, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={crit.nombre}
                        onChange={e => updateCriterio(idx, "nombre", e.target.value)}
                        placeholder="Ej: Asistencia, Oral Test, Examen..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2.5 text-xs font-bold text-gray-800"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...criterios];
                            (updated[idx] as any).es_asistencia_automatica = !(updated[idx] as any).es_asistencia_automatica;
                            setCriterios(updated);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all ${
                            (crit as any).es_asistencia_automatica
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-gray-100 text-gray-400 hover:text-gray-700"
                          }`}
                          title="Si está activo, la nota se calcula automáticamente con el porcentaje de asistencia"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {(crit as any).es_asistencia_automatica ? "check_circle" : "radio_button_unchecked"}
                          </span>
                          Auto Asistencia
                        </button>
                        <div className="relative w-18">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={crit.porcentaje}
                            onChange={e => updateCriterio(idx, "porcentaje", e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1 pl-2 pr-5 text-xs font-bold text-right text-gray-900"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCriterio(idx)}
                          disabled={criterios.length <= 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-20"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addCriterio}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Agregar otro criterio
                </button>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingCursoId(null); }}
                  className="py-2 px-4 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving || sumaCriterios !== 100}
                  className="bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white py-2 px-5 rounded-xl font-bold text-xs shadow-sm"
                >
                  {saving 
                    ? "Guardando..." 
                    : editingCursoId 
                    ? "Actualizar Cambios del Curso" 
                    : "Guardar y Abrir Curso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
