"use client";
import React, { useEffect, useState } from "react";
import { getConfiguracion, updateConfiguracion } from "@/app/actions/admin";

export default function ConfiguracionAdmin() {
  const [formData, setFormData] = useState({
    whatsapp: "",
    email_soporte: "",
    ciclo_actual: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const data = await getConfiguracion();
      if (data) {
        setFormData({
          whatsapp: data.whatsapp || "18099220880",
          email_soporte: data.email_soporte || "info@crossover.edu.do",
          ciclo_actual: data.ciclo_actual || "Inscripciones Octubre 2026"
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const result = await updateConfiguracion(formData);
    
    if (result.success) {
      setMessage("✅ ¡Configuración guardada con éxito!");
    } else {
      setMessage("❌ Error al guardar: " + result.error);
    }
    
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <div className="p-8 text-gray-500 font-bold animate-pulse">Cargando base de datos...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Conexión WhatsApp y Ajustes</h1>
        <p className="text-gray-500 font-medium">Vincula el número del colegio y administra los ajustes globales del sistema.</p>
      </div>

      <div className="space-y-6">
                {/* Conexión WhatsApp API */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#25D366]">qr_code_scanner</span> Vincular WhatsApp Web
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Escanea este código QR con el celular oficial del colegio (desde <strong>Dispositivos Vinculados</strong>) para que el sistema Crossover pueda enviar mensajes automáticos y Broadcasts a los padres.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 w-fit">
              <span className="material-symbols-outlined text-[18px]">phonelink_erase</span> Desconectado actualmente
            </div>
          </div>
          <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center p-4">
            <div className="text-center opacity-50">
              <span className="material-symbols-outlined text-5xl mb-2">qr_code_2</span>
              <p className="text-xs font-bold uppercase">Cargando QR API...</p>
            </div>
          </div>
        </div>

        {/* Contacto Info */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">contact_support</span> Datos de Contacto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">WhatsApp Principal</label>
              <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-medium focus:outline-none focus:border-primary" />
              <p className="text-xs text-gray-500 mt-1">Ej: 18099220880 (Sin espacios ni guiones).</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Correo de Soporte</label>
              <input type="email" name="email_soporte" value={formData.email_soporte} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-medium focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Global Banner / Ciclo */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">campaign</span> Período de Inscripción
          </h2>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Texto Oficial del Año/Ciclo</label>
            <input type="text" name="ciclo_actual" value={formData.ciclo_actual} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-bold focus:outline-none focus:border-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Este texto aparecerá en todos los formularios y cabeceras de la web.</p>
          </div>
        </div>
        
        <div className="flex justify-end items-center gap-4">
          {message && <span className="text-sm font-bold animate-fade-in-up">{message}</span>}
          <button onClick={handleSave} disabled={saving} className="bg-primary text-white py-3 px-8 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#cc0000] transition-colors flex items-center gap-2 shadow-md disabled:opacity-50">
            <span className="material-symbols-outlined text-[20px]">{saving ? 'sync' : 'save'}</span> 
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
