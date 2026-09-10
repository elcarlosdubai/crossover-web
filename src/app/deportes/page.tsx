"use client";
import Link from "next/link";import React, { useState } from "react";

const deportes = [
  { 
    nombre: "Basketball", 
    icon: "sports_basketball", 
    precio: "RD$ 1,000 / mes",
    desc: "¡Aprende a driblar, lanzar y trabajar en equipo! Nuestro programa desarrolla la coordinación y la agilidad de los más pequeños en un ambiente lleno de energía.", 
    color: "bg-orange-500", 
    shadow: "shadow-orange-500/50",
    text_color: "text-orange-500",
    beneficios: "Mejora la resistencia cardiovascular, desarrolla la concentración y fomenta el trabajo en equipo.",
    horarios: [
      "• Jueves: 2:00pm - 4:00pm (6 a 12 años)",
      "• Jueves: 4:00pm - 6:00pm (13 a 18 años)", "• Sábados: 2:00pm - 4:00pm (6 a 12 años)", "• Sábados: 4:00pm - 6:00pm (13 a 18 años)"
    ],
    etiqueta: "¡Más Popular!",
    linkParams: "?area=deportes&curso=Basketball"
  },
  { 
    nombre: "Volleyball", 
    icon: "sports_volleyball", 
    precio: "RD$ 1,000 / mes",
    desc: "¡Saltos, remates y mucha diversión! Clases diseñadas para enseñar los fundamentos del voleibol mientras los niños se divierten y hacen amigos.", 
    color: "bg-blue-500", 
    shadow: "shadow-blue-500/50",
    text_color: "text-blue-500",
    beneficios: "Aumenta la agilidad, mejora los reflejos y enseña disciplina deportiva.",
    horarios: [
      "• Martes: 4:00pm - 6:00pm",
      "• Sábados: 8:00am - 10:00am"
    ],
    etiqueta: "¡Súper Dinámico!",
    linkParams: "?area=deportes&curso=Volleyball"
  },
  { 
    nombre: "Soccer (Fútbol)", 
    icon: "sports_soccer", 
    precio: "RD$ 1,000 / mes",
    desc: "¡Pasión por el balón! Una academia donde cada niño desarrolla sus habilidades técnicas, control del balón y tácticas de juego en nuestra cancha.", 
    color: "bg-emerald-500", 
    shadow: "shadow-emerald-500/50",
    text_color: "text-emerald-500",
    beneficios: "Fortalece las piernas, mejora la capacidad aeróbica y fomenta la estrategia de grupo.",
    horarios: [
      "• Miércoles: 2:00pm - 5:00pm (5 a 9 años)",
      "• Viernes: 2:00pm - 5:00pm (10 a 15 años)"
    ],
    etiqueta: "¡Pura Adrenalina!",
    linkParams: "?area=deportes&curso=Soccer (Fútbol)"
  },
  { 
    nombre: "Karate", 
    icon: "sports_martial_arts", 
    precio: "RD$ 1,000 / mes",
    desc: "¡Disciplina, respeto y autocontrol! Nuestras clases enseñan defensa personal al mismo tiempo que forman el carácter y la confianza de los niños.", 
    color: "bg-red-500", 
    shadow: "shadow-red-500/50",
    text_color: "text-red-500",
    beneficios: "Mejora la flexibilidad, fomenta el respeto hacia los demás y aumenta la confianza en sí mismos.",
    horarios: [
      "• Martes: 2:00pm - 4:00pm", "• Sábados: 9:00am - 12:00pm", "• Sábados: 4:00pm - 6:00pm"
    ],
    etiqueta: "¡Disciplina Total!",
    linkParams: "?area=deportes&curso=Karate"
  },
];

export default function DeportesPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white pb-24 relative overflow-hidden">
      
      {/* Background Fun Elements */}
      <div className="fixed top-20 -left-20 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
        {/* Decorative background icons */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none flex flex-wrap justify-center items-center gap-16">
          <span className="material-symbols-outlined text-8xl text-white">sports_basketball</span>
          <span className="material-symbols-outlined text-9xl text-white">sports_soccer</span>
          <span className="material-symbols-outlined text-7xl text-white">sports_volleyball</span>
          <span className="material-symbols-outlined text-8xl text-white">sports_martial_arts</span>
        </div>
        
        <div className="relative z-10 text-center px-6 animate-fade-in-up">
          <div className="inline-block px-4 py-2 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-full mb-6 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
            ¡Mente sana en cuerpo sano! 🏆
          </div>
          <h1 className="text-white font-display text-5xl md:text-7xl font-black tracking-tight uppercase mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
            Academia de Deportes
          </h1>
          <p className="text-white/90 font-body text-xl md:text-2xl font-medium tracking-wide max-w-2xl mx-auto">
            El lugar donde los niños descubren su pasión, hacen amigos y se divierten en grande.
          </p>
          <div className="w-24 h-2 bg-yellow-500 mx-auto mt-8 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
        </div>
      </section>

      {/* Intro Text */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="font-display text-4xl font-black text-on-background mb-4 uppercase">¡Elige tu Deporte Favorito!</h2>
          <p className="font-body text-on-background-muted text-lg max-w-3xl mx-auto leading-relaxed">
            Nuestros programas están diseñados especialmente para niños y jóvenes. Contamos con entrenadores capacitados que garantizan un aprendizaje divertido, seguro y lleno de energía.
          </p>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {deportes.map((deporte, idx) => (
            <div 
              key={idx} 
              className="glass-panel p-8 md:p-10 rounded-[3rem] border border-black/5 hover:-translate-y-3 transition-all duration-300 relative overflow-hidden bg-white shadow-lg hover:shadow-2xl cursor-pointer group"
              onClick={() => setSelectedItem(deporte)}
            >
              {/* Card decorative gradient */}
              <div className={`absolute -right-20 -top-20 w-48 h-48 ${deporte.color} opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${deporte.color} ${deporte.shadow}`}>
                    <span className="material-symbols-outlined text-4xl">{deporte.icon}</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest shadow-md transform rotate-3 ${deporte.color}`}>
                    {deporte.etiqueta}
                  </div>
                </div>
                
                <h3 className="font-display text-3xl font-black text-on-background mb-3">{deporte.nombre}</h3>
                <p className="text-on-background-muted leading-relaxed mb-8">
                  {deporte.desc}
                </p>
                
                <div className={`flex items-center gap-2 ${deporte.text_color} font-bold uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform`}>
                  Ver Horarios e Info <span className="material-symbols-outlined">touch_app</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPUP (MODAL) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedItem(null)}
          ></div>
          
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative z-10 animate-fade-in-up border border-black/5 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors text-on-background"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-xl mx-auto transform -rotate-3 ${selectedItem.color} ${selectedItem.shadow}`}>
              <span className="material-symbols-outlined text-5xl">{selectedItem.icon}</span>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="font-display text-4xl font-black text-on-background mb-2">
                {selectedItem.nombre}
              </h3>
              <div className={`inline-block px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-widest ${selectedItem.color}`}>
                {selectedItem.etiqueta}
              </div>
            </div>
            
            <p className="text-lg text-center text-on-background-muted leading-relaxed mb-8 px-4">
              {selectedItem.desc}
            </p>
            
            <div className="space-y-6">
              <div className="bg-surface p-6 rounded-3xl border border-black/5 relative overflow-hidden group hover:border-black/10 transition-colors">
                <div className={`absolute top-0 left-0 w-2 h-full ${selectedItem.color}`}></div>
                <h4 className="font-bold flex items-center gap-2 mb-3 text-on-background">
                  <span className={`material-symbols-outlined ${selectedItem.text_color}`}>vital_signs</span>
                  Beneficios del Deporte
                </h4>
                <p className="text-on-background-muted ml-8">{selectedItem.beneficios}</p>
              </div>
              
              <div className="bg-surface p-6 rounded-3xl border border-black/5 relative overflow-hidden group hover:border-black/10 transition-colors">
                <div className={`absolute top-0 left-0 w-2 h-full ${selectedItem.color}`}></div>
                <h4 className="font-bold flex items-center gap-2 mb-3 text-on-background">
                  <span className={`material-symbols-outlined ${selectedItem.text_color}`}>schedule</span>
                  Horarios de Entrenamiento
                </h4>
                <div className="text-on-background-muted ml-8 font-medium space-y-1">
                  {Array.isArray(selectedItem.horarios) ? (
                    selectedItem.horarios.map((h: string, idx: number) => <p key={idx}>{h}</p>)
                  ) : (
                    <p>{selectedItem.horarios}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <Link href={`/inscripcion${selectedItem.linkParams || ''}`} className={`block w-full py-5 text-center rounded-full text-white font-black uppercase tracking-widest text-sm shadow-xl transition-transform hover:scale-105 hover:-translate-y-1 ${selectedItem.color} ${selectedItem.shadow}`}>
                ¡Quiero Inscribirme!
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
