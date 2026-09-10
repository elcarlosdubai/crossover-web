"use client";
import React, { useState } from "react";
import { CldUploadWidget } from 'next-cloudinary';
import { createSlide } from "@/app/actions/portada";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CrearSlide() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bg: "",
    tag: "",
    title: "",
    subtitle: "",
    description: "", btnText: "", btnLink: "", btn2Text: "", btn2Link: ""
  });

  const handleGuardar = async () => {
    if (!formData.bg || !formData.title) {
      alert("Por favor sube una foto y ponle un título.");
      return;
    }
    setIsSaving(true);
    const res = await createSlide(formData);
    setIsSaving(false);
    if (res.success) {
      alert("✅ ¡Imagen añadida al carrusel con éxito!");
      router.push("/admin/dashboard/portada");
      router.refresh();
    } else {
      alert("❌ Error: " + res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link href="/admin/dashboard/portada" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm font-bold mb-4 transition-colors">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Volver a la lista
      </Link>
      <h1 className="text-3xl font-display font-black text-gray-900 mb-8 tracking-tight">Añadir Foto al Carrusel</h1>
      
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Foto de Fondo (Cloudinary)</label>
          <CldUploadWidget 
            signatureEndpoint="/api/sign-cloudinary-params"
            onSuccess={(result: any) => setFormData({...formData, bg: result?.info?.secure_url})}
            options={{ multiple: false, maxFiles: 1, maxImageWidth: 2500, maxImageHeight: 2500 }}
          >
            {({ open }) => (
              <div onClick={() => open()} className={`w-full aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer relative border-4 border-dashed transition-all ${formData.bg ? 'border-transparent shadow-lg' : 'border-gray-300 hover:bg-gray-50 bg-gray-100 flex items-center justify-center'}`}>
                {formData.bg ? (
                  <img src={formData.bg} alt="Portada" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                    <p className="font-bold">Haz clic para subir una imagen</p>
                  </div>
                )}
              </div>
            )}
          </CldUploadWidget>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Etiqueta Superior (Texto pequeño amarillo)</label>
          <input type="text" value={formData.tag} onChange={(e) => setFormData({...formData, tag: e.target.value})} placeholder="Ej. Colegio e Instituto de Élite" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Título Gigante 1</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ej. EDUCACIÓN" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none uppercase" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Título Gigante 2</label>
          <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="Ej. DEL MAÑANA." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none uppercase" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Descripción</label>
          <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ej. Formamos la próxima generación..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none" />
        </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Texto del Botón 1 (Primario)</label>
            <input type="text" value={formData.btnText} onChange={(e) => setFormData({...formData, btnText: e.target.value})} placeholder="Ej. ¡Inscríbete Hoy!" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Enlace del Botón 1</label>
            <input type="text" value={formData.btnLink} onChange={(e) => setFormData({...formData, btnLink: e.target.value})} placeholder="Ej. /inscripcion" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Texto del Botón 2 (Secundario)</label>
            <input type="text" value={formData.btn2Text} onChange={(e) => setFormData({...formData, btn2Text: e.target.value})} placeholder="Ej. Ver Programas" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Enlace del Botón 2</label>
            <input type="text" value={formData.btn2Link} onChange={(e) => setFormData({...formData, btn2Link: e.target.value})} placeholder="Ej. /contacto" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 outline-none" />
          </div>
        </div>
        
        <button onClick={handleGuardar} disabled={isSaving} className="mt-4 bg-blue-600 text-white py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-colors w-full flex justify-center items-center gap-2">
          <span className="material-symbols-outlined">{isSaving ? 'sync' : 'save'}</span> {isSaving ? 'Guardando...' : 'Guardar y Publicar'}
        </button>
      </div>
    </div>
  );
}
