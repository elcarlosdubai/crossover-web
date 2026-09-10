"use client";
import Link from "next/link";import React, { useState } from "react";

  const cursosIdiomas = [
    {
      nombre: "Inglés Básico Niños (5-7 años)",
      descripcion: "A través de juegos y dinámicas, los niños pierden el miedo a hablar de forma natural, sentando las bases del idioma desde temprana edad.",
      icono: "child_care",
      duracion: "9 meses",
      horarios: ["Sábados | 8:30am a 12:00pm"],
      precio: "RD$ 1,600 / mes",
      linkParams: "?area=instituto&curso=Inglés+Básico+Niños+(5-7+años)"
    },
    {
      nombre: "Inglés Básico Niños (7-12 años)",
      descripcion: "100% conversacional e interactivo. Uso de juegos de rol y dinámicas grupales para asegurar fluidez y confianza.",
      icono: "face",
      duracion: "18 meses",
      horarios: ["Martes y Jueves | 3:00pm - 4:30pm", "Martes y Jueves | 4:30pm - 6:00pm", "Sábados | 8:30am - 12:00pm", "Sábados | 1:00pm - 4:00pm"],
      precio: "RD$ 1,600 / mes",
      linkParams: "?area=instituto&curso=Inglés+Básico+Niños+(7-12+años)"
    },
    {
      nombre: "Inglés Adolescentes (13-17 años)",
      descripcion: "Enfoque en debates, cultura pop y temas actuales para desarrollar una comunicación asertiva bilingüe.",
      icono: "school",
      duracion: "12 meses",
      horarios: ["Martes y Jueves | 3:00pm - 4:30pm", "Martes y Jueves | 4:30pm - 6:00pm", "Sábados | 8:30am - 12:00pm", "Sábados | 1:00pm - 4:00pm", "Sábados | 4:00pm - 7:00pm"],
      precio: "RD$ 1,600 / mes",
      linkParams: "?area=instituto&curso=Inglés+Adolescentes+(13-17+años)"
    },
    {
      nombre: "Inglés Adultos (18+ años)",
      descripcion: "Simulaciones de entornos laborales, redacción de correos y vocabulario profesional para potenciar tu currículum.",
      icono: "work",
      duracion: "12 meses",
      horarios: ["Martes y Jueves | 6:30pm - 8:00pm", "Sábados | 1:00pm - 4:00pm", "Sábados | 4:00pm - 7:00pm"],
      precio: "RD$ 1,600 / mes",
      linkParams: "?area=instituto&curso=Inglés+Adultos+(18%2B+años)"
    }
  ];

  const cursosTecnicos = [
    {
      nombre: "Informática Básica",
      descripcion: "Dominio del Paquete de Oficina (Word, Excel, PowerPoint) y navegación web segura. Indispensable para el mundo moderno.",
      icono: "computer",
      duracion: "3 meses",
      horarios: ["Sábados | 8:30am a 12:00pm", "Sábados | 1:00pm a 4:00pm"],
      precio: "RD$ 1,600 / mes",
      linkParams: "?area=instituto&curso=Informática+Básica"
    },
    {
      nombre: "Informática Avanzada",
      descripcion: "Profundiza en Word/Excel avanzado y fundamentos de Redes. Basado en proyectos prácticos reales.",
      icono: "devices",
      duracion: "3 meses",
      horarios: ["Sábados | 8:30am a 12:00pm", "Sábados | 1:00pm a 4:00pm"],
      precio: "RD$ 1,600 / mes",
      linkParams: "?area=instituto&curso=Informática+Avanzada"
    }
  ];

export default function InstitutoPage() {
  const [activeTab, setActiveTab] = useState("idiomas");
  const [selectedItem, setSelectedItem] = useState<any>(null); // State for the modal

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white pb-24 relative">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/1crossover.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-white font-display text-5xl md:text-7xl font-black tracking-tight uppercase mb-4">
            Instituto Técnico
          </h1>
          <p className="text-white/90 font-body text-xl md:text-2xl font-medium tracking-wide">
            Idiomas y Tecnología
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-8 rounded-full"></div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="sticky top-[70px] md:top-[80px] z-40 bg-background/90 backdrop-blur-lg border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap justify-center gap-2 md:gap-8">
            {[
              { id: "idiomas", label: "Academia de Idiomas", icon: "language" },
              { id: "tecnicos", label: "Cursos Técnicos Extras", icon: "engineering" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3 md:px-6 md:py-5 border-b-4 transition-all duration-300 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-on-background-muted hover:text-on-background hover:border-black/10"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">{tab.icon}</span>
                <span className="font-display font-bold text-xs md:text-lg tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        {/* IDIOMAS TAB */}
        {activeTab === "idiomas" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">forum</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">Academia de Idiomas</h2>
              <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-16">
                Dominar el inglés abre las puertas del mundo. Ofrecemos programas especializados y dinámicos diseñados específicamente para cada etapa de la vida.
              </p>
            </div>

            {/* Inglés Sabatino para Niños (Destacado) */}
            <div 
              className="glass-panel p-8 md:p-12 rounded-[3rem] border border-black/5 mb-16 relative overflow-hidden bg-gradient-to-br from-white to-orange-50 shadow-xl group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              onClick={() => setSelectedItem(cursosIdiomas[0])}
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest w-fit mb-6 bg-orange-500 shadow-orange-500/50 shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    Programa Estrella
                  </div>
                  <h3 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4">
                    Inglés para <span className="text-orange-500">Niños</span>
                  </h3>
                  <p className="font-bold text-xl text-on-background-muted mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500">event</span>
                    ¡Todos los sábados!
                  </p>
                  <p className="text-on-background-muted leading-relaxed text-lg mb-8">
                    {cursosIdiomas[0].desc}
                  </p>
                  <button className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform">
                    Ver Detalles y Horarios <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
                <div className="w-full md:w-1/3 aspect-square bg-white/50 backdrop-blur-md border border-white/50 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-8 text-center rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <span className="material-symbols-outlined text-8xl text-orange-500 mb-4 drop-shadow-md">celebration</span>
                  <p className="font-display font-black text-2xl text-on-background">¡Aprender es divertido!</p>
                </div>
              </div>
            </div>

            {/* Otros programas de inglés */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div 
                className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl cursor-pointer group"
                onClick={() => setSelectedItem(cursosIdiomas[1])}
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                <span className="material-symbols-outlined text-5xl text-blue-500 mb-4 block">school</span>
                <h3 className="font-display text-2xl font-bold text-on-background mb-3">{cursosIdiomas[1].nombre}</h3>
                <p className="text-on-background-muted leading-relaxed mb-6">
                  {cursosIdiomas[1].desc}
                </p>
                <button className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform">
                    Ver Detalles <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div 
                className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl cursor-pointer group"
                onClick={() => setSelectedItem(cursosIdiomas[2])}
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <span className="material-symbols-outlined text-5xl text-emerald-500 mb-4 block">work</span>
                <h3 className="font-display text-2xl font-bold text-on-background mb-3">{cursosIdiomas[2].nombre}</h3>
                <p className="text-on-background-muted leading-relaxed mb-6">
                  {cursosIdiomas[2].desc}
                </p>
                <button className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform">
                    Ver Detalles <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CURSOS TECNICOS TAB */}
        {activeTab === "tecnicos" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">engineering</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">Cursos Técnicos Extras</h2>
              <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-16">
                Formación práctica y acelerada. Además de los programas oficiales, ofrecemos especializaciones y talleres continuos para complementar tus habilidades.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8">
              {cursosTecnicos.map((curso, idx) => (
                <div 
                  key={idx} 
                  className="w-full md:max-w-md glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl group cursor-pointer"
                  onClick={() => setSelectedItem(curso)}
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${curso.color}`}></div>
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform duration-500 group-hover:rotate-6 ${curso.color} ${curso.shadow}`}>
                    <span className="material-symbols-outlined text-3xl">{curso.icon}</span>
                  </div>
                  
                  <h3 className="font-display text-xl font-bold text-on-background mb-3">{curso.nombre}</h3>
                  <p className="text-on-background-muted leading-relaxed text-sm mb-6">
                    {curso.desc}
                  </p>
                  
                  <div className={`flex items-center gap-1 ${curso.text_color} font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300`}>
                    Ver Info <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 bg-surface p-8 rounded-[2rem] border border-black/5 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h4 className="font-display text-2xl font-bold text-on-background mb-2">¿No encuentras lo que buscas?</h4>
                <p className="text-on-background-muted">Constantemente abrimos nuevas ofertas formativas. Contáctanos para conocer los próximos cursos.</p>
              </div>
              <a href="https://wa.me/18099220880" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 whitespace-nowrap px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors duration-300 shadow-lg">
                <span className="material-symbols-outlined">chat</span> Escribir por WhatsApp
              </a>
            </div>
          </div>
        )}
      </section>

      {/* POPUP (MODAL) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedItem(null)}
          ></div>
          
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative z-10 animate-fade-in-up border border-black/5 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors text-on-background"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl ${selectedItem.color} ${selectedItem.shadow}`}>
              <span className="material-symbols-outlined text-4xl">{selectedItem.icon}</span>
            </div>
            
            <h3 className="font-display text-3xl md:text-4xl font-black text-on-background mb-4">
              {selectedItem.nombre}
            </h3>
            
            <p className="text-lg text-on-background-muted leading-relaxed mb-8">
              {selectedItem.desc}
            </p>
            
            <div className="space-y-6">
              <div className="bg-surface p-6 rounded-2xl border border-black/5">
                <h4 className="font-bold flex items-center gap-2 mb-2 text-on-background">
                  <span className={`material-symbols-outlined ${selectedItem.text_color}`}>psychology</span>
                  Metodología
                </h4>
                <p className="text-on-background-muted">{selectedItem.metodologia}</p>
              </div>
              
              <div className="bg-surface p-6 rounded-2xl border border-black/5">
                <h4 className="font-bold flex items-center gap-2 mb-2 text-on-background">
                  <span className={`material-symbols-outlined ${selectedItem.text_color}`}>schedule</span>
                  Horarios Disponibles
                </h4>
                <div className="text-on-background-muted text-sm space-y-1">
                  {Array.isArray(selectedItem.horarios) ? (
                    selectedItem.horarios.map((h: string, idx: number) => <p key={idx}>{h}</p>)
                  ) : (
                    <p>{selectedItem.horarios}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex gap-4">
              <Link href={`/inscripcion${selectedItem.linkParams || ''}`} className={`flex-1 py-4 text-center rounded-full text-white font-bold uppercase tracking-widest text-sm shadow-lg transition-transform hover:scale-105 block ${selectedItem.color} ${selectedItem.shadow}`}>
                Inscribirme
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
