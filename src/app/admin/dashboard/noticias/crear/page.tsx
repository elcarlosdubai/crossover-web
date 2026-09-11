"use client";
import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { createNoticia } from "@/app/actions/blog";
import { CldUploadWidget } from 'next-cloudinary';



export default function NoticiasAdmin() {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // Blog State
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [portadaUrl, setPortadaUrl] = useState("");
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitulo(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handlePublicar = async () => {
    if (!titulo || !slug || !editor) {
      alert("Faltan campos obligatorios");
      return;
    }
    setIsSaving(true);
    const res = await createNoticia({
      titulo,
      slug,
      foto_portada: portadaUrl,
      galeria_urls: galeriaUrls,
      etiquetas: tags,
      contenido_html: editor.getHTML()
    });
    
    setIsSaving(false);
    if (res.success) {
      alert("✅ ¡Noticia publicada con éxito en Supabase!");
      router.push("/admin/dashboard/noticias");
    } else {
      alert("❌ Error: " + res.error);
    }
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Comienza a escribir tu noticia aquí...' }),
      Youtube.configure({
        controls: false,
        nocookie: true,
      }),
    ],
    content: '<p>Escribe aquí tu artículo...</p>',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[300px] bg-gray-50 py-4 px-4 text-gray-800 font-medium focus:outline-none prose max-w-none'
      }
    }
  });

  const addYoutubeVideo = useCallback(() => {
    const url = prompt('Ingresa la URL del video de YouTube:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const suggestedTags = ["Académico", "Eventos", "Deportes", "Excursiones", "Avisos", "Inglés"];
  const tagColors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700"
  ];

  const getTagColor = (tag: string) => {
    // Simple hash to consistently pick a color based on the tag string
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash += tag.charCodeAt(i);
    return tagColors[hash % tagColors.length];
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput("");
    }
  };

  const addTag = (newTag: string) => {
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Crear Noticia</h1>
        <p className="text-gray-500 font-medium">Publica un nuevo artículo o evento en el blog oficial del instituto.</p>
      </div>

      {/* Contenido de la Pestaña 2: Blog */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">post_add</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Crear Nueva Noticia</h2>
              <p className="text-sm text-gray-500">Publica un artículo en el blog oficial del instituto.</p>
            </div>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título de la Noticia</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-bold text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={titulo} onChange={handleTituloChange} placeholder="Ej. Ganamos el torneo intercolegial de Basketball" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">Enlace del Artículo (Slug)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-400 text-xs">/noticias/</span>
                  <input type="text" className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium text-sm focus:outline-none focus:border-blue-500" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gran-final" />
                </div>
              </div>
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
                        <><span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span> ¡Portada Subida!</>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">add_a_photo</span> Subir Portada</>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Galería Interna</label>
                <CldUploadWidget 
                  signatureEndpoint="/api/sign-cloudinary-params"
                  onSuccess={(result: any) => setGaleriaUrls(prev => [...prev, result?.info?.secure_url])}
                  options={{ multiple: true, maxImageWidth: 1920, maxImageHeight: 1920, clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp', 'heic'] }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 ${galeriaUrls.length > 0 ? 'text-gray-800' : 'text-blue-600'} font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors h-[46px]`}>
                      <span className="material-symbols-outlined text-[20px]">collections</span> 
                      {galeriaUrls.length > 0 ? `${galeriaUrls.length} Fotos Subidas` : 'Subir Galería'}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Etiquetas (Tags)</label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap gap-2 items-center mb-2">
                {tags.map((tag, index) => (
                  <span key={index} className={`${getTagColor(tag)} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
                    {tag} 
                    <span onClick={() => removeTag(tag)} className="material-symbols-outlined text-[14px] cursor-pointer hover:text-black/50 transition-colors">close</span>
                  </span>
                ))}
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-transparent border-none outline-none text-sm font-medium flex-1 text-gray-700 placeholder-gray-400 min-w-[150px]" 
                  placeholder="Escribe una etiqueta y presiona Enter..." 
                />
              </div>
              
              {/* Sugerencias */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sugerencias:</span>
                {suggestedTags.filter(t => !tags.includes(t)).map((tag, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => addTag(tag)}
                    className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span> {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contenido de la Noticia (Editor Rico)</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Real TipTap Toolbar */}
                {editor && (
                  <div className="bg-gray-100 border-b border-gray-200 p-2 flex gap-1 flex-wrap items-center">
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition-all ${editor.isActive('bold') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[20px]">format_bold</span>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition-all ${editor.isActive('italic') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[20px]">format_italic</span>
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[20px]">title</span>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded transition-all ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded transition-all ${editor.isActive('orderedList') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    <button type="button" onClick={() => {
                        const url = window.prompt('URL del enlace:');
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                      }} className={`p-1.5 rounded transition-all ${editor.isActive('link') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </button>
                    <button type="button" onClick={addYoutubeVideo} className="p-1.5 text-red-600 hover:bg-white hover:shadow-sm rounded transition-all flex items-center gap-1 font-bold text-xs">
                      <span className="material-symbols-outlined text-[18px]">smart_display</span> Añadir Video
                    </button>
                  </div>
                )}
                {/* Real Editor Content */}
                <EditorContent editor={editor} />
              </div>
            </div>

            <button type="button" onClick={handlePublicar} disabled={isSaving} className="bg-blue-600 text-white py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-colors w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50">
              <span className="material-symbols-outlined text-[20px]">{isSaving ? 'sync' : 'send'}</span> {isSaving ? 'Publicando...' : 'Publicar en el Blog'}
            </button>
          </form>
        </div>
    </div>
  );
}
