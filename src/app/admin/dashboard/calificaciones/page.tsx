"use client";
import React from "react";

export default function CalificacionesAdmin() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Registro de Calificaciones</h1>
        <p className="text-gray-500 font-medium">Módulo exclusivo para profesores. Selecciona un grupo para evaluar a los estudiantes.</p>
      </div>

      {/* Selectores */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seleccionar Nivel / Área</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-medium focus:outline-none focus:border-primary">
            <option>Instituto de Inglés</option>
            <option>Deportes (Basketball)</option>
            <option>Infotep</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seleccionar Grupo</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-medium focus:outline-none focus:border-primary">
            <option>Inglés Niños (Sábados AM)</option>
            <option>Inglés Adultos (Noche)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="bg-blue-600 text-white py-3 px-6 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors h-[46px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">search</span> Buscar Lista
          </button>
        </div>
      </div>

      {/* Tabla de Calificaciones */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Grupo: Inglés Niños (Sábados AM)</h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">25 Estudiantes</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Estudiante</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Reading</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Writing</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Oral</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Nota Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 font-bold text-gray-900">Lucas Ramírez</td>
                <td className="py-3 px-6"><input type="number" defaultValue="85" className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-medium" /></td>
                <td className="py-3 px-6"><input type="number" defaultValue="90" className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-medium" /></td>
                <td className="py-3 px-6"><input type="number" className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-medium" placeholder="--" /></td>
                <td className="py-3 px-6 font-black text-gray-400">87.5</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 font-bold text-gray-900">Sofia Mateo</td>
                <td className="py-3 px-6"><input type="number" defaultValue="95" className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-medium" /></td>
                <td className="py-3 px-6"><input type="number" defaultValue="98" className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-medium" /></td>
                <td className="py-3 px-6"><input type="number" className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 focus:border-primary focus:outline-none font-medium" placeholder="--" /></td>
                <td className="py-3 px-6 font-black text-gray-400">96.5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button className="bg-emerald-600 text-white py-3 px-8 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined">save</span> Guardar Calificaciones
          </button>
        </div>
      </div>
    </div>
  );
}
