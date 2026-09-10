"use client";
import React from "react";

export default function InscripcionesAdmin() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Registro de Inscripciones</h1>
          <p className="text-gray-500 font-medium">Gestiona todos los prospectos y formularios enviados desde la web.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span> Exportar a Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input type="text" placeholder="Buscar por nombre o teléfono..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary" />
        </div>
        <select className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:outline-none focus:border-primary">
          <option>Todas las Áreas</option>
          <option>Instituto</option>
          <option>Colegio</option>
          <option>Deportes</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:outline-none focus:border-primary">
          <option>Estado: Todos</option>
          <option>Pendiente de Pago</option>
          <option>Pagado</option>
        </select>
      </div>

      {/* Table Mockup */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Prospecto</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Área y Curso</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Dummy Row 1 */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">Hoy, 10:45 AM</td>
                <td className="py-4 px-6">
                  <p className="text-sm font-bold text-gray-900">Carlos Pérez</p>
                  <p className="text-xs text-gray-500">Padre / Tutor</p>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-1">Instituto</span>
                  <p className="text-sm font-medium text-gray-900">Inglés Niños (7-12 años)</p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-900 font-medium">809-555-0123</p>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Pendiente
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-gray-400 hover:text-primary transition-colors p-1" title="Ver Detalles">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </td>
              </tr>
              {/* Dummy Row 2 */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">Ayer, 03:20 PM</td>
                <td className="py-4 px-6">
                  <p className="text-sm font-bold text-gray-900">María González</p>
                  <p className="text-xs text-gray-500">Estudiante Independiente</p>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-1">Infotep</span>
                  <p className="text-sm font-medium text-gray-900">Visita Médica</p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-900 font-medium">829-555-9876</p>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Confirmado / Pagado
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-gray-400 hover:text-primary transition-colors p-1" title="Ver Detalles">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">Mostrando 2 de 2 prospectos</p>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-400"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
            <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-400"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
