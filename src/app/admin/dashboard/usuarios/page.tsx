"use client";
import React from "react";

export default function UsuariosAdmin() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-gray-500 font-medium">Crea accesos y contraseñas para los empleados que administrarán el sistema.</p>
        </div>
        <button className="bg-primary text-white py-2.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#cc0000] transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">person_add</span> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario / Correo</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Rol en el Sistema</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Último Acceso</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">CA</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">crossovercaja@gmail.com</p>
                    <p className="text-xs text-gray-500">Tú (Propietario)</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-full">Súper Administrador</span>
              </td>
              <td className="py-4 px-6 text-sm text-gray-500 font-medium">Hace 2 horas</td>
              <td className="py-4 px-6 text-right">
                <span className="text-xs text-gray-400 italic">No modificable</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
