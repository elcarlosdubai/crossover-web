"use client";
import React, { useState } from "react";
import { CldUploadWidget } from 'next-cloudinary';
import { savePortadaConfig } from "@/app/actions/portada";
import { useRouter } from "next/navigation";

interface SlideData {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  bg: string;
}

export default function PortadaForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  
  // Parse existing JSON or start with one empty slide
  let defaultSlides: SlideData[] = [{ tag: "", title: "", subtitle: "", description: "", bg: "" }];
  if (initialData?.contenido_html) {
    try { defaultSlides = JSON.parse(initialData.contenido_html); } catch (e) {}
  }
  
  const [slides, setSlides] = useState<SlideData[]>(defaultSlides);
  const [isSaving, setIsSaving] = useState(false);

  const updateSlide = (index: number, field: keyof SlideData, value: string) => {
    const newSlides = [...slides];
    newSlides[index][field] = value;
    setSlides(newSlides);
  };

  const addSlide = () => {
    setSlides([...slides, { tag: "", title: "", subtitle: "", description: "", bg: "" }]);
  };

  const removeSlide = (index: number) => {
    if (slides.length === 1) {
      alert("Debe haber al menos 1 imagen en el Slide Show.");
      return;
    }
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    const res = await savePortadaConfig(JSON.stringify(slides));
    setIsSaving(false);
    
    if (res.success) {
      alert("✅ ¡Slide Show actualizado con éxito!");
      router.refresh();
    } else {
      alert("❌ Error: " + res.error);
    }
  };

  return (
    <div className="space-y-8">
      {slides.map((slide, index) => (
        <div key={index} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-6 relative">
          
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Imagen del Carrusel #{index + 1}
            </h3>
            <button onClick={() => removeSlide(index)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">delete</span> Eliminar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Foto de Fondo */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">Foto de Fondo (Cloudinary)</label>
              <CldUploadWidget 
                signatureEndpoint="/api/sign-cloudinary-params"
                onSuccess={(result: any) => updateSlide(index, "bg", result?.info?.secure_url)}
                options={{ multiple: false, maxFiles: 1, maxImageWidth: 2500, maxImageHeight: 2500, clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp', 'heic'] }}
              >
                {({ open }) => (
                  <div onClick={() => open()} className={`w-full aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer relative border-4 border-dashed transition-all ${slide.bg ? 'border-transparent shadow-lg' : 'border-gray-300 hover:bg-gray-50 bg-gray-100 flex items-center justify-center'}`}>
                    {slide.bg ? (
                      <>
                        <img src={slide.bg} alt="Portada" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white text-4xl mb-2">edit</span>
                          <p className="text-white font-bold">Cambiar Imagen</p>
                        </div>
                      </>
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

            {/* Tag Arriba */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Etiqueta Superior (Texto pequeño amarillo)</label>
              <input type="text" value={slide.tag} onChange={(e) => updateSlide(index, "tag", e.target.value)} placeholder="Ej. Colegio e Instituto de Élite" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium focus:outline-none focus:border-primary" />
            </div>

            {/* Descripcion */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Descripción (Texto de abajo)</label>
              <input type="text" value={slide.description} onChange={(e) => updateSlide(index, "description", e.target.value)} placeholder="Ej. Formamos líderes..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium focus:outline-none focus:border-primary" />
            </div>

            {/* Titulo */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Título Gigante 1</label>
              <input type="text" value={slide.title} onChange={(e) => updateSlide(index, "title", e.target.value)} placeholder="Ej. EDUCACIÓN" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium focus:outline-none focus:border-primary uppercase" />
            </div>

            {/* Subtitulo */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Título Gigante 2</label>
              <input type="text" value={slide.subtitle} onChange={(e) => updateSlide(index, "subtitle", e.target.value)} placeholder="Ej. DEL MAÑANA." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium focus:outline-none focus:border-primary uppercase" />
            </div>

          </div>
        </div>
      ))}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-8 mt-8">
        <button onClick={addSlide} className="bg-gray-100 text-gray-600 py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add_circle</span> Añadir Nueva Imagen
        </button>
        
        <button onClick={handleGuardar} disabled={isSaving} className="bg-primary text-white py-4 px-10 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#cc0000] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">{isSaving ? 'sync' : 'cloud_upload'}</span> 
          {isSaving ? 'Guardando...' : 'Actualizar Portada (Slide Show)'}
        </button>
      </div>
    </div>
  );
}
