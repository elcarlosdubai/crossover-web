"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  getPreinscripciones,
  updateEstadoPreinscripcion,
  deletePreinscripcion,
  Preinscripcion
} from "@/app/actions/inscripciones";

export default function InscripcionesAdmin() {
  const [leads, setLeads] = useState<Preinscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(15);

  const cargarDatos = async () => {
    setLoading(true);
    const data = await getPreinscripciones();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Al filtrar o buscar, reiniciar a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [search, filtroArea, filtroEstado, itemsPorPagina]);

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    setUpdatingId(id);
    const res = await updateEstadoPreinscripcion(id, nuevoEstado);
    if (res.success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, estado: nuevoEstado as any } : l))
      );
    }
    setUpdatingId(null);
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el registro de ${nombre}?`)) return;
    const res = await deletePreinscripcion(id);
    if (res.success) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const leadsFiltrados = useMemo(() => {
    return leads.filter((item) => {
      const matchSearch =
        search === "" ||
        `${item.nombres_aspirante} ${item.apellidos_aspirante}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.telefono_tutor.includes(search) ||
        (item.curso_solicitado || "").toLowerCase().includes(search.toLowerCase());

      const matchArea =
        filtroArea === "TODAS" ||
        (item.area || "").toUpperCase() === filtroArea.toUpperCase();

      const matchEstado =
        filtroEstado === "TODOS" || item.estado === filtroEstado;

      return matchSearch && matchArea && matchEstado;
    });
  }, [leads, search, filtroArea, filtroEstado]);

  // Cálculo de Paginación
  const totalPaginas = Math.ceil(leadsFiltrados.length / itemsPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const leadsPaginados = leadsFiltrados.slice(indiceInicio, indiceFin);

  const exportarCSV = () => {
    if (leadsFiltrados.length === 0) return;
    const headers = [
      "Fecha",
      "Nombre",
      "Apellidos",
      "Teléfono",
      "Email",
      "Área",
      "Curso",
      "Horario",
      "Estado",
      "Notas"
    ];
    const rows = leadsFiltrados.map((l) => [
      new Date(l.created_at).toLocaleDateString("es-DO"),
      l.nombres_aspirante,
      l.apellidos_aspirante,
      l.telefono_tutor,
      l.email_tutor || "",
      l.area || "",
      `"${l.curso_solicitado.replace(/"/g, '""')}"`,
      `"${(l.horario || "").replace(/"/g, '""')}"`,
      l.estado,
      `"${(l.notas_internas || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `preinscripciones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Control de Pre-Inscripciones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#990000]/10 text-[#990000] text-xs font-black">
              {leads.length} Registros
            </span>
          </div>
          <p className="text-gray-500 text-xs md:text-sm font-medium mt-1">
            Prospectos recibidos desde el link de Instagram y la página web en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-50 shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            title="Recargar datos"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
              sync
            </span>
          </button>

          <button
            onClick={exportarCSV}
            className="bg-[#990000] hover:bg-[#800000] text-white py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por estudiante, teléfono o curso..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs md:text-sm font-medium focus:outline-none focus:border-[#990000] focus:bg-white transition-all shadow-xs"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs md:text-sm font-bold text-gray-700 focus:outline-none focus:border-[#990000] cursor-pointer"
          >
            <option value="TODAS">Todas las Áreas</option>
            <option value="Inglés">Inglés</option>
            <option value="Informática">Informática</option>
            <option value="Colegio">Colegio</option>
            <option value="Deportes">Deportes</option>
            <option value="Infotep">Infotep</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs md:text-sm font-bold text-gray-700 focus:outline-none focus:border-[#990000] cursor-pointer"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="NUEVA">NUEVA (Sin contactar)</option>
            <option value="CONTACTADO">CONTACTADO</option>
            <option value="APROBADO">APROBADO / INSCRITO</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE DATOS EN VIVO */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80">
                <th className="py-3.5 px-5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="py-3.5 px-5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Estudiante / Prospecto
                </th>
                <th className="py-3.5 px-5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Programa & Horario
                </th>
                <th className="py-3.5 px-5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="py-3.5 px-5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-3.5 px-5 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">
                  Acciones Rápidas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-[#990000] animate-spin">
                        progress_activity
                      </span>
                      <span>Cargando pre-inscripciones de Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : leadsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    <span className="material-symbols-outlined text-3xl mb-1 text-gray-300 block">
                      inbox
                    </span>
                    No se encontraron pre-inscripciones con los filtros actuales.
                  </td>
                </tr>
              ) : (
                leadsPaginados.map((item) => {
                  const phoneDigits = item.telefono_tutor.replace(/\D/g, "");
                  const whatsappMsg = `Hola ${item.nombres_aspirante}, le escribimos de Centro Educativo Crossover respecto a su pre-inscripción para el curso ${item.curso_solicitado}.`;
                  const whatsappUrl = `https://wa.me/1${phoneDigits}?text=${encodeURIComponent(whatsappMsg)}`;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* FECHA */}
                      <td className="py-3.5 px-5 text-gray-500 font-medium whitespace-nowrap text-xs">
                        {new Date(item.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>

                      {/* PROSPECTO */}
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-gray-900 leading-tight">
                          {item.nombres_aspirante} {item.apellidos_aspirante}
                        </p>
                        {item.notas_internas && (
                          <p className="text-[11px] text-gray-400 mt-0.5 italic">
                            {item.notas_internas}
                          </p>
                        )}
                      </td>

                      {/* PROGRAMA Y HORARIO */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.area && (
                            <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                              {item.area}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-mono">
                            {item.origen || "web"}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 text-xs md:text-sm leading-snug">
                          {item.curso_solicitado}
                        </p>
                        {item.horario && (
                          <p className="text-xs text-[#990000] font-medium flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            {item.horario}
                          </p>
                        )}
                      </td>

                      {/* CONTACTO */}
                      <td className="py-3.5 px-5">
                        <p className="font-black text-gray-900">{item.telefono_tutor}</p>
                        {item.email_tutor && (
                          <p className="text-xs text-gray-500 font-medium">{item.email_tutor}</p>
                        )}
                      </td>

                      {/* ESTADO SELECTOR */}
                      <td className="py-3.5 px-5">
                        <select
                          value={item.estado}
                          disabled={updatingId === item.id}
                          onChange={(e) => handleCambiarEstado(item.id, e.target.value)}
                          className={`text-xs font-black rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer transition-colors ${
                            item.estado === "NUEVA"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : item.estado === "CONTACTADO"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : item.estado === "APROBADO"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          <option value="NUEVA">NUEVA</option>
                          <option value="CONTACTADO">CONTACTADO</option>
                          <option value="APROBADO">APROBADO / INSCRITO</option>
                          <option value="RECHAZADO">RECHAZADO</option>
                        </select>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                            title="Abrir WhatsApp directo"
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>

                          <button
                            onClick={() =>
                              handleEliminar(item.id, `${item.nombres_aspirante} ${item.apellidos_aspirante}`)
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA CON CONTROLES DE PAGINACIÓN */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-3">
            <p>
              Mostrando{" "}
              <strong>
                {leadsFiltrados.length === 0 ? 0 : indiceInicio + 1}
              </strong>{" "}
              a{" "}
              <strong>
                {Math.min(indiceFin, leadsFiltrados.length)}
              </strong>{" "}
              de <strong>{leadsFiltrados.length}</strong> solicitudes
            </p>

            <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
              <span className="text-[11px] text-gray-400">Ver:</span>
              <select
                value={itemsPorPagina}
                onChange={(e) => setItemsPorPagina(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-md py-1 px-2 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* BOTONES ANTERIOR / SIGUIENTE Y NÚMEROS DE PÁGINA */}
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-colors flex items-center justify-center cursor-pointer"
                title="Página Anterior"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                  // Mostrar primera, última y páginas cercanas para no saturar si hay muchas
                  if (
                    num === 1 ||
                    num === totalPaginas ||
                    (num >= paginaActual - 1 && num <= paginaActual + 1)
                  ) {
                    return (
                      <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          paginaActual === num
                            ? "bg-[#990000] text-white shadow-xs"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  } else if (
                    num === paginaActual - 2 ||
                    num === paginaActual + 2
                  ) {
                    return (
                      <span key={num} className="text-gray-400 text-xs px-0.5">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-colors flex items-center justify-center cursor-pointer"
                title="Página Siguiente"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
