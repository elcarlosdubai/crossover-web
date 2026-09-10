"use client";
import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Youtube from '@tiptap/extension-youtube'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { updateNoticia } from "@/app/actions/blog";
import { CldUploadWidget } from 'next-cloudinary';
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("portada");
  const [tags, setTags] = useState<string[]>(initialData.etiquetas || []);
  const [tagInput, setTagInput] = useState("");
  
  const [titulo, setTitulo] = useState(initialData.titulo || "");
  const [slug, setSlug] = useState(initialData.slug || "");
  const [portadaUrl, setPortadaUrl] = useState(initialData.foto_portada || "");
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>(initialData.galeria_urls || []);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Youtube.configure({ width: 840, height: 472.5, HTMLAttributes: { class: 'rounded-xl overflow-hidden' } }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Comienza a escribir tu noticia aquí...' }),
    ],
    content: initialData.contenido_html || "",
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-blue max-w-none focus:outline-none min-h-[400px]',
      },
    },
  });

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitulo(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleGuardar = async () => {
    if (!titulo || !slug || !editor) {
      alert("Faltan campos obligatorios");
      return;
    }
    setIsSaving(true);
    const res = await updateNoticia(initialData.id, {
      titulo,
      slug,
      foto_portada: portadaUrl,
      galeria_urls: galeriaUrls,
      etiquetas: tags,
      contenido_html: editor.getHTML()
    });
    
    setIsSaving(false);
    if (res.success) {
      alert("✅ ¡Cambios guardados con éxito!");
      router.push("/admin/dashboard/noticias");
      router.refresh();
    } else {
      alert("❌ Error: " + res.error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin/dashboard/noticias" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm font-bold mb-2 transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Volver a la lista
          </Link>
          <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Editar Noticia</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings</span> Configuración
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Foto Principal (Portada)</label>
                <CldUploadWidget 
                  signatureEndpoint="/api/sign-cloudinary-params"
                  onSuccess={(result: any) => setPortadaUrl(result?.info?.secure_url)}
                  options={{ multiple: false, maxFiles: 1, maxImageWidth: 1920, maxImageHeight: 1920, clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp', 'heic'] }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 ${portadaUrl ? 'text-gray-800' : 'text-emerald-600'} font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors h-[46px]`}>
                      {portadaUrl ? (
                        <><span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span> Cambiar Portada</>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">add_a_photo</span> Subir Portada</>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
                {portadaUrl && <img src={portadaUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Galería Interna</label>
                <CldUploadWidget 
                  signatureEndpoint="/api/sign-cloudinary-params"
                  onSuccess={(result: any) => setGaleriaUrls(prev => [...prev, result?.info?.secure_url])}
                  options={{ multiple: true, maxImageWidth: 1920, maxImageHeight: 1920 }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 ${galeriaUrls.length > 0 ? 'text-gray-800' : 'text-blue-600'} font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors h-[46px]`}>
                      <span className="material-symbols-outlined text-[20px]">collections</span> 
                      {galeriaUrls.length > 0 ? `${galeriaUrls.length} Fotos` : 'Subir Galería'}
                    </button>
                  )}
                </CldUploadWidget>
              </div>

              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Etiquetas / Categorías</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-primary transition-colors">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span key={tag} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                        {tag}
                        <span onClick={() => setTags(tags.filter(t => t !== tag))} className="material-symbols-outlined text-[14px] cursor-pointer hover:text-red-500">close</span>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (!tags.includes(tagInput.trim())) {
                          setTags([...tags, tagInput.trim()]);
                        }
                        setTagInput("");
                      }
                    }}
                    placeholder="Ej. Deportes (Presiona Enter)" 
                    className="w-full bg-transparent border-none focus:outline-none text-sm px-2 py-1 text-gray-700 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">URL Amigable (Slug)</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-500 text-sm font-medium focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <input type="text" value={titulo} onChange={handleTituloChange} className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none" placeholder="Título..." />
            </div>
            <div className="p-8 min-h-[400px]">
              <EditorContent editor={editor} />
            </div>
          </div>

          <button type="button" onClick={handleGuardar} disabled={isSaving} className="bg-emerald-600 text-white py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-emerald-700 transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-[20px]">{isSaving ? 'sync' : 'save'}</span> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
