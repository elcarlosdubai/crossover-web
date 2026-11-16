"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCuadernoInscripciones,
  getFamiliasConHijos,
  buscarSugerenciaFamilia,
  crearFamilia,
  inscribirEstudianteFormal,
} from "@/app/actions/caja";
import { getTodayRD } from "@/lib/dateRD";

interface CuadernoInscripcionesProps {
  mode: "cuaderno" | "familias";
  userName?: string;
}

export default function CuadernoInscripciones({ mode, userName = "Recepción" }: CuadernoInscripcionesProps) {
  const [loading, setLoading] = useState(true);
  const [schemaListo, setSchemaListo] = useState(true);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("TODAS");

  // Modal Nueva Inscripción Formal
  const [inscModalOpen, setInscModalOpen] = useState(false);
  const [savingInsc, setSavingInsc] = useState(false);
  const [sugerenciaFam, setSugerenciaFam] = useState<{ familia: any; hijosExistentes: any[] }>({
    familia: null,
    hijosExistentes: [],
  });
  const [formInsc, setFormInsc] = useState({
    nombres: "",
    apellidos: "",
    curso_id: "",
    tutor_nombre: "",
    tutor_telefono: "",
    familia_id: "",
    crear_familia_nueva: false,
    nombre_familia: "",
    generar_cargo_inicial: true,
    monto_inscripcion: 500,
    monto_primera_cuota: 2500,
  });

  // Modal Nueva Familia
  const [famModalOpen, setFamModalOpen] = useState(false);
  const [savingFam, setSavingFam] = useState(false);
  const [formFam, setFormFam] = useState({
    nombre_familia: "",
    responsable_principal: "",
    telefono: "",
    telefono_secundario: "",
    email: "",
    direccion: "",
  });

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" | "info" }[]>([]);
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  };

  const loadData = async () => {
    setLoading(true);
    const [cuadernoRes, famsRes] = await Promise.all([
      getCuadernoInscripciones(),
      getFamiliasConHijos(),
    ]);
    setSchemaListo(cuadernoRes.schemaListo && famsRes.schemaListo);
    setEstudiantes(cuadernoRes.estudiantes || []);
    setCursos(cuadernoRes.cursos || []);
    setFamilias(famsRes.familias || []);
    if ((cuadernoRes.cursos || []).length > 0 && !formInsc.curso_id) {
      setFormInsc((prev) => ({ ...prev, curso_id: cuadernoRes.cursos[0].id }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-detectar familia existente cuando escriben teléfono del tutor
  useEffect(() => {
    const digits = formInsc.tutor_telefono.replace(/\D/g, "");
    if (digits.length < 7) {
      setSugerenciaFam({ familia: null, hijosExistentes: [] });
      return;
    }
    const timer = setTimeout(async () => {
      const res: any = await buscarSugerenciaFamilia(formInsc.tutor_telefono);
      setSugerenciaFam({
        familia: res?.familia || null,
        hijosExistentes: res?.hijosExistentes || [],
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [formInsc.tutor_telefono]);

  const filtrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    return estudiantes.filter((e) => {
      if (areaFilter !== "TODAS" && String(e.curso?.tipo || "").toUpperCase() !== areaFilter) {
        return false;
      }
      if (!q) return true;
      const hay = `${e.nombres || ""} ${e.apellidos || ""} ${e.matricula || ""} ${e.tutor_nombre || ""} ${e.tutor_telefono || ""} ${e.curso?.nombre || ""} ${e.familia?.nombre_familia || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [estudiantes, search, areaFilter]);

  const familiasFiltradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return familias;
    return familias.filter((f) =>
      `${f.nombre_familia || ""} ${f.responsable_principal || ""} ${f.telefono || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [familias, search]);

  const exportarCuadernoCSV = () => {
    if (filtrados.length === 0) return;
    const headers = [
      "Fecha Inscripcion",
      "Matricula",
      "Estudiante",
      "Curso",
      "Area",
      "Tutor",
      "Telefono",
      "Familia",
      "Inscrito Por",
      "Estado",
    ];
    const rows = filtrados.map((e) => [
      e.fecha_inscripcion_formal || new Date(e.created_at).toLocaleDateString("es-DO"),
      e.matricula || "",
      `"${`${e.nombres || ""} ${e.apellidos || ""}`.trim().replace(/"/g, '""')}"`,
      `"${(e.curso?.nombre || "").replace(/"/g, '""')}"`,
      e.curso?.tipo || "",
      `"${(e.tutor_nombre || "").replace(/"/g, '""')}"`,
      e.tutor_telefono || "",
      `"${(e.familia?.nombre_familia || "").replace(/"/g, '""')}"`,
      `"${(e.inscrito_por || "").replace(/"/g, '""')}"`,
      e.estado || "",
    ]);

    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `cuaderno_inscripciones_${getTodayRD()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGuardarInscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInsc.nombres.trim() || !formInsc.apellidos.trim() || !formInsc.curso_id) {
      showToast("Completa nombre, apellido y curso.", "error");
      return;
    }
    setSavingInsc(true);
    const res = await inscribirEstudianteFormal({
      ...formInsc,
      familia_id: formInsc.familia_id || null,
      inscrito_por: userName.split("(")[0].trim() || "Recepción",
    });
    setSavingInsc(false);

    if (res.success) {
      showToast(`Estudiante ${res.estudiante.matricula} inscrito en el cuaderno.`, "success");
      setInscModalOpen(false);
      setFormInsc((prev) => ({
        ...prev,
        nombres: "",
        apellidos: "",
        tutor_nombre: "",
        tutor_telefono: "",
        familia_id: "",
        crear_familia_nueva: false,
        nombre_familia: "",
      }));
      await loadData();
    } else {
      showToast(res.error || "Error al inscribir estudiante", "error");
    }
  };

  const handleGuardarFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFam.nombre_familia.trim() || !formFam.responsable_principal.trim() || !formFam.telefono.trim()) {
      showToast("Nombre de familia, responsable y teléfono son obligatorios.", "error");
      return;
    }
    setSavingFam(true);
    const res = await crearFamilia(formFam);
    setSavingFam(false);
    if (res.success) {
      showToast("Familia registrada correctamente.", "success");
      setFamModalOpen(false);
      setFormFam({
        nombre_familia: "",
        responsable_principal: "",
        telefono: "",
        telefono_secundario: "",
        email: "",
        direccion: "",
      });
      await loadData();
    } else {
      showToast(res.error || "No se pudo guardar la familia", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* TOASTS */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl shadow-lg text-xs font-bold border ${
                t.type === "error"
                  ? "bg-rose-600 text-white border-rose-700"
                  : "bg-slate-900 text-white border-slate-800"
              }`}
            >
              {t.msg}
            </div>
          ))}
        </div>
      )}

      {!schemaListo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">info</span>
          <div>
            <p className="font-bold">Falta ejecutar la migración SQL en Supabase</p>
            <p className="mt-0.5 text-amber-800">
              Para activar Familias, Cuaderno con fecha formal y Cargos iniciales de Caja, ejecuta el archivo{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">migration_caja_administracion.sql</code>{" "}
              en el SQL Editor de Supabase.
            </p>
          </div>
        </div>
      )}

      {/* BARRA DE ACCIÓN Y FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                mode === "cuaderno"
                  ? "Buscar por alumno, matrícula, tutor, teléfono o familia..."
                  : "Buscar familia, responsable o teléfono..."
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-[#990000]"
            />
          </div>

          {mode === "cuaderno" && (
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700"
            >
              <option value="TODAS">Todas las áreas</option>
              <option value="INSTITUTO">Instituto</option>
              <option value="COLEGIO">Colegio</option>
              <option value="DEPORTES">Deportes</option>
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "cuaderno" ? (
            <>
              <button
                type="button"
                onClick={exportarCuadernoCSV}
                className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Exportar Libro
              </button>
              <button
                type="button"
                onClick={() => setInscModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">person_add</span>
                Nueva Inscripción Formal
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setFamModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">group_add</span>
              Nueva Familia
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          Cargando registros...
        </div>
      ) : mode === "cuaderno" ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Curso / Área</th>
                  <th className="py-3 px-4">Tutor / Familia</th>
                  <th className="py-3 px-4">Inscrito por</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      No hay inscripciones que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((est) => (
                    <tr key={est.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {est.fecha_inscripcion_formal ||
                          new Date(est.created_at).toLocaleDateString("es-DO")}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                        {est.matricula}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">
                          {est.nombres} {est.apellidos}
                        </p>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {est.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{est.curso?.nombre || "Sin curso"}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {est.curso?.tipo || "—"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">
                          {est.tutor_nombre || est.familia?.responsable_principal || "N/D"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {est.tutor_telefono || est.familia?.telefono || "Sin teléfono"}
                          {est.familia?.nombre_familia && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                              {est.familia.nombre_familia}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {est.inscrito_por || "Sistema"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/dashboard/estudiantes/${est.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px]"
                        >
                          Ficha
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {familiasFiltradas.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-10 text-center text-xs text-gray-500">
              Aún no hay familias registradas. Puedes crear una aquí o vincular hermanos al inscribir.
            </div>
          ) : (
            familiasFiltradas.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{f.nombre_familia}</h4>
                    <p className="text-xs text-gray-600 font-medium">
                      Resp: {f.responsable_principal} · {f.telefono}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-black">
                    {(f.hijos || []).length} hijo(s)
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                  {(f.hijos || []).length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">Sin estudiantes vinculados</span>
                  ) : (
                    (f.hijos || []).map((h: any) => (
                      <Link
                        key={h.id}
                        href={`/admin/dashboard/estudiantes/${h.id}`}
                        className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[11px] font-semibold text-gray-800"
                      >
                        {h.nombres} {h.apellidos} ({h.curso?.nombre || "Curso"})
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL NUEVA INSCRIPCIÓN FORMAL */}
      {inscModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <form
            onSubmit={handleGuardarInscripcion}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Nueva Inscripción al Cuaderno</h3>
                <p className="text-[11px] text-gray-500">Fecha operativa RD: {getTodayRD()}</p>
              </div>
              <button type="button" onClick={() => setInscModalOpen(false)} className="text-gray-400 hover:text-gray-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={formInsc.nombres}
                  onChange={(e) => setFormInsc({ ...formInsc, nombres: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={formInsc.apellidos}
                  onChange={(e) => setFormInsc({ ...formInsc, apellidos: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Curso / Disciplina *</label>
              <select
                value={formInsc.curso_id}
                onChange={(e) => setFormInsc({ ...formInsc, curso_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-semibold"
              >
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Nombre del Tutor / Pagador *</label>
                <input
                  type="text"
                  required
                  value={formInsc.tutor_nombre}
                  onChange={(e) => setFormInsc({ ...formInsc, tutor_nombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={formInsc.tutor_telefono}
                  onChange={(e) => setFormInsc({ ...formInsc, tutor_telefono: e.target.value })}
                  placeholder="809-000-0000"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            {/* SUGERENCIA AUTOMÁTICA DE FAMILIA */}
            {(sugerenciaFam.familia || sugerenciaFam.hijosExistentes.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-1.5">
                <p className="font-bold text-blue-900">
                  Teléfono detectado en registros existentes:
                </p>
                {sugerenciaFam.familia && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormInsc({
                        ...formInsc,
                        familia_id: sugerenciaFam.familia.id,
                        crear_familia_nueva: false,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg font-bold border ${
                      formInsc.familia_id === sugerenciaFam.familia.id
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-blue-800 border-blue-300"
                    }`}
                  >
                    Vincular a {sugerenciaFam.familia.nombre_familia}
                  </button>
                )}
                {sugerenciaFam.hijosExistentes.length > 0 && (
                  <p className="text-[11px] text-blue-800">
                    Hermanos encontrados:{" "}
                    {sugerenciaFam.hijosExistentes.map((h: any) => `${h.nombres} ${h.apellidos}`).join(", ")}
                  </p>
                )}
              </div>
            )}

            <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/70">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formInsc.crear_familia_nueva}
                  onChange={(e) =>
                    setFormInsc({
                      ...formInsc,
                      crear_familia_nueva: e.target.checked,
                      familia_id: e.target.checked ? "" : formInsc.familia_id,
                    })
                  }
                />
                Crear grupo familiar nuevo para este tutor
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formInsc.generar_cargo_inicial}
                  onChange={(e) => setFormInsc({ ...formInsc, generar_cargo_inicial: e.target.checked })}
                />
                Generar cargo inicial pendiente para Caja
              </label>

              {formInsc.generar_cargo_inicial && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">Inscripción (RD$)</label>
                    <input
                      type="number"
                      min={0}
                      value={formInsc.monto_inscripcion}
                      onChange={(e) => setFormInsc({ ...formInsc, monto_inscripcion: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">Primera Cuota (RD$)</label>
                    <input
                      type="number"
                      min={0}
                      value={formInsc.monto_primera_cuota}
                      onChange={(e) => setFormInsc({ ...formInsc, monto_primera_cuota: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInscModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingInsc}
                className="px-4 py-2 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-bold disabled:opacity-50"
              >
                {savingInsc ? "Guardando..." : "Guardar en Cuaderno"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NUEVA FAMILIA */}
      {famModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <form
            onSubmit={handleGuardarFamilia}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-5 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-black text-gray-900">Registrar Familia</h3>
              <button type="button" onClick={() => setFamModalOpen(false)} className="text-gray-400 hover:text-gray-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Nombre de la Familia *</label>
              <input
                type="text"
                required
                placeholder="Ej: Familia Gómez Pérez"
                value={formFam.nombre_familia}
                onChange={(e) => setFormFam({ ...formFam, nombre_familia: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Responsable Principal *</label>
              <input
                type="text"
                required
                value={formFam.responsable_principal}
                onChange={(e) => setFormFam({ ...formFam, responsable_principal: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Teléfono WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={formFam.telefono}
                  onChange={(e) => setFormFam({ ...formFam, telefono: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Teléfono 2</label>
                <input
                  type="text"
                  value={formFam.telefono_secundario}
                  onChange={(e) => setFormFam({ ...formFam, telefono_secundario: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Dirección</label>
              <input
                type="text"
                value={formFam.direccion}
                onChange={(e) => setFormFam({ ...formFam, direccion: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFamModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingFam}
                className="px-4 py-2 rounded-xl bg-[#990000] hover:bg-[#800000] text-white text-xs font-bold disabled:opacity-50"
              >
                {savingFam ? "Guardando..." : "Guardar Familia"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
