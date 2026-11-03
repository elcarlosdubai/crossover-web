"use client";
import React, { useState } from "react";
import { getMaestros, createMaestro, deleteMaestro, toggleEstadoMaestro } from "@/app/actions/maestros";

// Estructura de Departamentos y Disciplinas
const DISCIPLINAS_POR_DEPARTAMENTO: Record<string, string[]> = {
  "Idiomas": [
    "Inglés General (A1, A2, B1, B2)",
    "Inglés para Niños / Teens",
    "Inglés Conversacional / Avanzado",
    "Francés Básico / Intermedio",
    "Español para Extranjeros"
  ],
  "Infotep / Técnico": [
    "Informática & Ofimática",
    "Contabilidad Básica",
    "Servicio al Cliente & Ventas",
    "Secretariado Ejecutivo",
    "Auxiliar de Farmacia"
  ],
  "Deportes": [
    "Basketball (Entrenamiento & Táctica)",
    "Voleibol",
    "Acondicionamiento Físico",
    "Fútbol Sala"
  ],
  "Arte & Cultura": [
    "Música & Guitarra",
    "Canto & Expresión Vocal",
    "Pintura & Dibujo"
  ]
};

function formatPhoneNumber(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function MaestrosClient({ initialMaestros }: { initialMaestros: any[] }) {
  const [maestros, setMaestros] = useState<any[]>(initialMaestros);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Control de Estado (Switcher: Activos vs Inactivos)
  const [tabEstado, setTabEstado] = useState<"activos" | "inactivos">("activos");

  // Control de Vista: Tarjetas vs Lista / Tabla
  const [vistaModo, setVistaModo] = useState<"tarjetas" | "lista">("tarjetas");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 9;

  // Ficha Detalle del Profesor (Modal)
  const [selectedProfesor, setSelectedProfesor] = useState<any>(null);

  // Form State
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamento, setDepartamento] = useState("Idiomas");
  const [especialidad, setEspecialidad] = useState(DISCIPLINAS_POR_DEPARTAMENTO["Idiomas"][0]);
  const [tanda, setTanda] = useState("Matutina (AM)");
  const [password, setPassword] = useState("123456");

  const handleDepartamentoChange = (dep: string) => {
    setDepartamento(dep);
    const opciones = DISCIPLINAS_POR_DEPARTAMENTO[dep] || [];
    if (opciones.length > 0) setEspecialidad(opciones[0]);
  };

  async function refreshData() {
    const data = await getMaestros();
    setMaestros(data);
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return alert("Completa los campos obligatorios");

    setSaving(true);
    const res = await createMaestro({ nombre, email, telefono, departamento, especialidad, tanda, password });
    if (res.success) {
      setShowModal(false);
      setNombre("");
      setEmail("");
      setTelefono("");
      setDepartamento("Idiomas");
      setEspecialidad(DISCIPLINAS_POR_DEPARTAMENTO["Idiomas"][0]);
      await refreshData();
    } else {
      alert("Error: " + res.error);
    }
    setSaving(false);
  };

  // Cambiar estado entre Activo e Inactivo (Desactivar en vez de borrar directo)
  const handleToggleEstado = async (id: string, nuevoEstado: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // UI Optimista inmediata
    setMaestros(prev => prev.map(m => m.id === id ? { ...m, activo: nuevoEstado } : m));
    if (selectedProfesor?.id === id) {
      setSelectedProfesor((prev: any) => ({ ...prev, activo: nuevoEstado }));
    }
    await toggleEstadoMaestro(id, nuevoEstado);
  };

  // Botón eliminar definitivo (Solo disponible si el docente ya está inactivo)
  const handleDeleteDefinitivo = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`⚠️ ELIMINACIÓN DEFINITIVA: ¿Seguro que deseas borrar el registro de "${name}"? Esta acción no se puede deshacer.`)) {
      setMaestros(prev => prev.filter(m => m.id !== id));
      if (selectedProfesor?.id === id) setSelectedProfesor(null);
      await deleteMaestro(id);
      await refreshData();
    }
  };

  const handleAbrirWhatsApp = (tel: string, nombreDocente: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanTel = tel.replace(/\D/g, "");
    if (!cleanTel) return alert("El docente no tiene un número registrado.");
    const msg = encodeURIComponent(`Hola ${nombreDocente}, le escribimos desde la Dirección Académica.`);
    window.open(`https://wa.me/1${cleanTel}?text=${msg}`, "_blank");
  };

  // 1. Filtrar por estado activo/inactivo
  const maestrosPorEstado = maestros.filter(m => tabEstado === "activos" ? m.activo !== false : m.activo === false);

  // 2. Filtrar por búsqueda
  const filtrados = maestrosPorEstado.filter(m => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const n = (m.nombre || "").toLowerCase();
    const em = (m.email || "").toLowerCase();
    const tel = (m.telefono || "").replace(/\D/g, "");
    const cursosStr = (m.cursos || []).map((c: any) => c.nombre.toLowerCase()).join(" ");
    return n.includes(q) || em.includes(q) || tel.includes(q.replace(/\D/g, "")) || cursosStr.includes(q);
  });

  // 3. Paginación
  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const maestrosPaginados = filtrados.slice(indexInicio, indexInicio + itemsPorPagina);

  const totalActivos = maestros.filter(m => m.activo !== false).length;
  const totalInactivos = maestros.filter(m => m.activo === false).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12">
      
      {/* Header Coordinación */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
            Coordinación Académica
          </span>
          <h1 className="text-xl sm:text-2xl font-display font-black text-gray-900 tracking-tight mt-0.5">
            Cuerpo Docente
          </h1>
          <p className="text-xs text-gray-500 font-medium">Asignaciones de aula, horarios y seguimiento pedagógico de los profesores.</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Registrar Profesor
        </button>
      </div>

      {/* Barra de Control: Switcher Activos/Inactivos + Vistas (Tarjetas/Lista) + Búsqueda */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Switcher Estado: Activos vs Inactivos */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => { setTabEstado("activos"); setPaginaActual(1); }}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tabEstado === "activos"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Activos ({totalActivos})
          </button>
          <button
            onClick={() => { setTabEstado("inactivos"); setPaginaActual(1); }}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tabEstado === "inactivos"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Inactivos / Archivo ({totalInactivos})
          </button>
        </div>

        {/* Buscador en Vivo */}
        <div className="relative w-full md:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o materia..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
            className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-primary transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
              title="Borrar búsqueda"
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

      {/* Contenedor Principal: Sin resultados vs Tarjetas vs Lista */}
      {filtrados.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
            {tabEstado === "activos" ? "school" : "archive"}
          </span>
          <h3 className="font-bold text-gray-800 text-sm">
            {tabEstado === "activos" ? "No hay profesores activos encontrados" : "No hay profesores inactivos"}
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            {busqueda ? `Sin coincidencias para "${busqueda}".` : "El listado está limpio."}
          </p>
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="mt-2 text-xs font-bold text-primary hover:underline">
              Limpiar filtro
            </button>
          )}
        </div>
      ) : vistaModo === "tarjetas" ? (
        /* VISTA 1: TARJETAS (IDEAL TABLET) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maestrosPaginados.map(m => (
            <div 
              key={m.id}
              onClick={() => setSelectedProfesor(m)}
              className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                      {m.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-900 text-sm leading-tight truncate">{m.nombre}</h3>
                      <p className="text-[11px] text-gray-400 font-medium truncate">{m.email}</p>
                    </div>
                  </div>

                  {/* Si está inactivo, botón eliminar definitivo. Si está activo, botón para desactivar */}
                  {m.activo === false ? (
                    <button 
                      onClick={(e) => handleDeleteDefinitivo(m.id, m.nombre, e)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Eliminar registro definitivamente"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleToggleEstado(m.id, false, e)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0"
                      title="Desactivar / Pasar a Inactivo"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_off</span>
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">WhatsApp:</span>
                    {m.telefono ? (
                      <button
                        onClick={(e) => handleAbrirWhatsApp(m.telefono, m.nombre, e)}
                        className="text-emerald-700 font-mono font-bold hover:underline flex items-center gap-1"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {formatPhoneNumber(m.telefono)}
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">Sin registrar</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Alumnos a cargo:</span>
                    <strong className="text-purple-700">{m.estudiantesACargo || 0} alumnos</strong>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Cursos que Imparte:</span>
                    <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {m.totalCursos} clases
                    </span>
                  </div>

                  {(!m.cursos || m.cursos.length === 0) ? (
                    <p className="text-xs text-gray-400 italic py-1">Sin cursos vinculados todavía.</p>
                  ) : (
                    <div className="space-y-1">
                      {m.cursos.map((c: any) => (
                        <div key={c.id} className="text-xs bg-purple-50/50 border border-purple-100/60 px-2.5 py-1 rounded-lg text-purple-900 font-bold flex justify-between items-center">
                          <span className="truncate">{c.nombre}</span>
                          <span className="text-[10px] font-normal text-purple-600 shrink-0 ml-1">{c.tipo}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                {m.activo !== false ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Activo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Inactivo
                  </span>
                )}
                <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Ver Ficha <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA 2: LISTA / TABLA COMPACTA (IDEAL PARA MUCHOS PROFESORES) */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Cursos Asignados</th>
                  <th className="py-3 px-4 text-center">Alumnos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maestrosPaginados.map(m => (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedProfesor(m)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs shrink-0">
                          {m.nombre.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{m.nombre}</span>
                          <span className="text-[11px] text-gray-400">{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">
                      {m.telefono ? formatPhoneNumber(m.telefono) : "--"}
                    </td>
                    <td className="py-3 px-4">
                      {m.totalCursos > 0 ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {m.totalCursos} {m.totalCursos === 1 ? "curso" : "cursos"}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sin cursos</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      {m.estudiantesACargo || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        m.activo !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}>
                        {m.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {m.activo === false ? (
                          <>
                            <button
                              onClick={() => handleToggleEstado(m.id, true)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[11px]"
                              title="Reactivar profesor"
                            >
                              Reactivar
                            </button>
                            <button
                              onClick={(e) => handleDeleteDefinitivo(m.id, m.nombre, e)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                              title="Eliminar de la base de datos"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleEstado(m.id, false)}
                            className="px-2 py-1 bg-gray-100 hover:bg-amber-50 hover:text-amber-700 font-bold text-gray-600 rounded text-[11px]"
                            title="Desactivar docente"
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación Profesional (Muestra páginas cuando hay volumen) */}
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

      {/* MODAL DETALLE DOCENTE (Con switcher de estado integrado) */}
      {selectedProfesor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                  {selectedProfesor.nombre.charAt(0)}
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    selectedProfesor.activo !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {selectedProfesor.activo !== false ? "Docente Activo" : "Docente Inactivo"}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">{selectedProfesor.nombre}</h3>
                  <p className="text-xs text-gray-400">{selectedProfesor.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProfesor(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                  <span className="text-gray-400 block mb-0.5 font-medium">WhatsApp Directo</span>
                  {selectedProfesor.telefono ? (
                    <button
                      onClick={() => handleAbrirWhatsApp(selectedProfesor.telefono, selectedProfesor.nombre)}
                      className="text-emerald-700 text-sm font-mono font-bold hover:underline flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      {formatPhoneNumber(selectedProfesor.telefono)}
                    </button>
                  ) : (
                    <span className="text-gray-400 italic">Sin registrar</span>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5 font-medium">Contraseña de Acceso</span>
                  <strong className="font-mono text-gray-800 text-sm">123456</strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Aulas y Cursos Asignados</h4>
                {(!selectedProfesor.cursos || selectedProfesor.cursos.length === 0) ? (
                  <div className="p-4 text-center bg-gray-50 rounded-xl text-gray-400 text-xs">
                    Este profesor aún no tiene cursos asignados. Puedes vincularlo en "Gestor de Cursos".
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                    {selectedProfesor.cursos.map((c: any) => (
                      <div key={c.id} className="p-3 flex items-center justify-between">
                        <div>
                          <strong className="text-gray-900 block">{c.nombre}</strong>
                          <span className="text-gray-400 text-[11px]">{c.tipo} · Horario: {c.hora_inicio || 'Flexible'}</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded">
                          Aula Activa
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              {selectedProfesor.activo !== false ? (
                <button
                  onClick={() => handleToggleEstado(selectedProfesor.id, false)}
                  className="text-xs font-bold text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">person_off</span>
                  Pasar a Inactivo
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEstado(selectedProfesor.id, true)}
                    className="text-xs font-bold text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Reactivar
                  </button>
                  <button
                    onClick={(e) => handleDeleteDefinitivo(selectedProfesor.id, selectedProfesor.nombre, e)}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    Eliminar Definitivo
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedProfesor(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO MAESTRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Registrar Nuevo Profesor</h3>
                <p className="text-xs text-gray-500 font-medium">Asigna departamento, disciplina de impartición y contacto.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo del Docente *</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Lic. Nelson Santana" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Área / Departamento *</label>
                  <select
                    value={departamento}
                    onChange={e => handleDepartamentoChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    {Object.keys(DISCIPLINAS_POR_DEPARTAMENTO).map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Disciplina Específica *</label>
                  <select
                    value={especialidad}
                    onChange={e => setEspecialidad(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                  >
                    {(DISCIPLINAS_POR_DEPARTAMENTO[departamento] || []).map(disc => (
                      <option key={disc} value={disc}>{disc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanda de Disponibilidad</label>
                <select
                  value={tanda}
                  onChange={e => setTanda(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
                >
                  <option value="Matutina (AM)">Matutina (8:00 AM - 12:00 PM)</option>
                  <option value="Vespertina (PM)">Vespertina (2:00 PM - 6:00 PM)</option>
                  <option value="Nocturna">Nocturna (6:00 PM - 9:00 PM)</option>
                  <option value="Sabatina (Fines de Semana)">Sabatina (Sábados Intensivos)</option>
                  <option value="Tiempo Completo">Tiempo Completo / Flexible</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Correo (Login de Acceso) *</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="profesor@crossover.edu.do" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono WhatsApp (xxx-xxx-xxxx) *</label>
                  <input 
                    type="tel" 
                    value={telefono} 
                    onChange={e => setTelefono(formatPhoneNumber(e.target.value))}
                    placeholder="809-555-0100" 
                    maxLength={12}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-900 font-mono focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña Inicial</label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-gray-700"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white py-2 px-5 rounded-xl font-bold text-xs shadow-sm"
                >
                  {saving ? "Registrando..." : "Guardar Docente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
