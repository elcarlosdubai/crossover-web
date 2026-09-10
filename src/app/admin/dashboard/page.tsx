"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-black text-gray-900 mb-2 tracking-tight">¡Bienvenido, Administrador!</h1>
        <p className="text-gray-500 font-medium">Panel de control de <span className="font-bold text-primary">{user?.email || "Cargando..."}</span></p>
      </div>

      {/* KPI Cards / Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Visitas */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Visitas del Mes</p>
            <h3 className="text-4xl font-black text-gray-900">--</h3>
            <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Conectando a Vercel...
            </p>
          </div>
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">visibility</span>
          </div>
        </div>

        {/* Card 2: Formularios Llenos */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Pre-Inscripciones</p>
            <h3 className="text-4xl font-black text-gray-900">0</h3>
            <p className="text-gray-400 text-xs font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">sync</span> Esperando conexión
            </p>
          </div>
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">app_registration</span>
          </div>
        </div>

        {/* Card 3: Ingresos / Pagados */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Alumnos Pagos</p>
            <h3 className="text-4xl font-black text-gray-900">0</h3>
            <p className="text-gray-400 text-xs font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">sync</span> Esperando conexión
            </p>
          </div>
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
        </div>
      </div>

      {/* Módulos Principales */}
      <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-widest text-sm">Módulos de Gestión</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">group</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Base de Datos: Inscripciones</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">Revisa la lista completa de estudiantes, sus teléfonos, qué cursos eligieron y marca quiénes ya pagaron la inscripción.</p>
          <button className="text-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform">
            Entrar al Módulo <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">newspaper</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Editor: Noticias y Blog</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">Escribe nuevos artículos, sube galerías de fotos de eventos deportivos y mantén la portada del colegio actualizada.</p>
          <button className="text-blue-600 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform">
            Entrar al Módulo <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
