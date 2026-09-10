"use client";

import React, { useState } from "react";

const techProgram = [
  {
    year: "1ero Secundaria",
    level: "Usuario Azul",
    title: "Creador de Contenido",
    description: "Dominarás las herramientas esenciales para la creación de documentos profesionales y la mecanografía eficiente.",
    subjects: ["Mecanografía Digital", "Diseño de Documentos (Word)"],
    color: "bg-blue-500",
    shadow: "shadow-blue-500/50",
    icon: "draw"
  },
  {
    year: "2do Secundaria",
    level: "Usuario Rojo",
    title: "Analista Visual",
    description: "Aprenderás a gestionar datos, analizar información con hojas de cálculo y comunicar ideas de manera visual y efectiva.",
    subjects: ["Presentaciones de Impacto (PowerPoint)", "Análisis de Datos (Excel)"],
    color: "bg-red-500",
    shadow: "shadow-red-500/50",
    icon: "monitoring"
  },
  {
    year: "3ero Secundaria",
    level: "Usuario Verde",
    title: "Diseñador Digital",
    description: "Despertarás tu creatividad, introduciéndote al mundo del diseño gráfico vectorial y los principios de la animación 2D.",
    subjects: ["Diseño Gráfico Vectorial (Inkscape)", "Animación Digital 2D (OpenToonz)"],
    color: "bg-emerald-500",
    shadow: "shadow-emerald-500/50",
    icon: "brush"
  },
  {
    year: "4to Secundaria",
    level: "Usuario Naranja",
    title: "Desarrollador Web",
    description: "Serás capaz de construir aplicaciones web completas, programando desde la interfaz de usuario hasta la base de datos.",
    subjects: ["Maquetación Web (HTML5 & CSS)", "Programación Web (JS, MySQL, PHP)"],
    color: "bg-orange-500",
    shadow: "shadow-orange-500/50",
    icon: "code"
  },
  {
    year: "5to Secundaria",
    level: "Usuario Marrón",
    title: "Diseñador Técnico",
    description: "Entrarás al mundo del diseño de precisión para ingeniería y arquitectura, creando planos y piezas para manufactura aditiva (Impresión 3D)",
    subjects: ["Diseño Arquitectónico CAD (FreeCAD Arch)", "Diseño de Piezas CAD (FreeCAD PartDesign)"],
    color: "bg-stone-600",
    shadow: "shadow-stone-600/50",
    icon: "architecture"
  },
  {
    year: "6to Secundaria",
    level: "Usuario Violeta",
    title: "Especialista y Emprendedor",
    description: "Culminarás tu formación con el dominio del modelado 3D avanzado y el desarrollo de un plan de negocios para tus propias ideas.",
    subjects: ["Modelado 3D (Blender)", "Taller de Emprendimiento Lean", "Proyecto Final de Grado"],
    color: "bg-purple-500",
    shadow: "shadow-purple-500/50",
    icon: "rocket_launch"
  }
];

const inicialInfo = {
  title: "Nivel Inicial",
  subtitle: "El primer tramo del viaje educativo",
  description: "Dirigido a niños y niñas desde los 6 meses hasta los 6 años de edad, enfocado en el desarrollo oportuno y la preparación para la educación primaria a través del juego constructivista y la estimulación temprana.",
  cycles: [
    {
      name: "Primer Ciclo (0 a 3 años)",
      focus: "Enfocado en el cuidado y desarrollo oportuno.",
      items: ["Maternal: 6 meses a 11 meses.", "Infantes: 1 año.", "Párvulos: 2 años."],
      color: "bg-pink-500",
      shadow: "shadow-pink-500/50"
    },
    {
      name: "Segundo Ciclo (3 a 6 años)",
      focus: "Prepara para la educación primaria de forma lúdica.",
      items: ["Pre-Kínder: 3 años.", "Kínder: 4 años.", "Preprimario: 5 años (obligatorio)."],
      color: "bg-yellow-500",
      shadow: "shadow-yellow-500/50"
    }
  ],
  pedagogy: [
    { title: "Currículo por Competencias", desc: "Promueve el desarrollo integral (cognitivo, psicomotor, socioafectivo y del lenguaje)." },
    { title: "El Juego como Estrategia", desc: "El juego y las rutinas diarias son los vehículos de aprendizaje y exploración del entorno." },
    { title: "Estrategias de Socialización", desc: "Juego de exploración, juego-trabajo e indagación dialógica basada en valores." }
  ],
  competencies: ["Ética y Ciudadana", "Comunicativa", "Pensamiento Lógico-Crítico", "Resolución de Problemas", "Científica y Tecnológica", "Ambiental y Salud", "Desarrollo Personal"]
};

const primarioInfo = {
  title: "Nivel Primario",
  subtitle: "Consolidando saberes y valores ciudadanos",
  description: "Dirigido a niños de 6 a 11 años, con una duración de seis años. Nos fundamentamos en un enfoque por competencias para el desarrollo integral del estudiante, preparándolos para los desafíos del futuro.",
  cycles: [
    {
      name: "Primer Ciclo (1.º a 3.º grado)",
      focus: "Edades de 6 a 8 años.",
      items: ["Consolidación de la lectura.", "Escritura comprensiva.", "Operaciones matemáticas básicas."],
      color: "bg-cyan-500",
      shadow: "shadow-cyan-500/50"
    },
    {
      name: "Segundo Ciclo (4.º a 6.º grado)",
      focus: "Edades de 9 a 11 años.",
      items: ["Pensamiento crítico.", "Profundización en las ciencias.", "Ciudadanía activa y responsable."],
      color: "bg-indigo-500",
      shadow: "shadow-indigo-500/50"
    }
  ],
  areas: [
    "Lengua Española (alfabetización inicial)",
    "Matemáticas",
    "Ciencias Sociales",
    "Ciencias de la Naturaleza",
    "Educación Artística",
    "Educación Física",
    "Formación Humana y Religiosa",
    "Lenguas Extranjeras (Inglés/Francés)"
  ],
  components: [
    { title: "Competencias Fundamentales", desc: "Capacidad para actuar de manera eficaz y autónoma en contextos diversos (Ética, Comunicativa, Lógica)." },
    { title: "Estrategias de Enseñanza", desc: "Secuencias de actividades organizadas sistemáticamente para facilitar la construcción de conocimientos." },
    { title: "Evaluación de Aprendizajes", desc: "Guía procesual para identificar logros y áreas de mejora continua en base a indicadores." }
  ]
};

export default function ColegioPage() {
  const [activeTab, setActiveTab] = useState("inicial");
  const [showModal, setShowModal] = useState<string | null>(null);

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white pb-24">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/3crossover.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <span className="text-primary font-body text-sm font-bold uppercase tracking-[0.3em] mb-4 block">Oferta Académica</span>
          <h1 className="text-white font-display text-5xl md:text-6xl font-black tracking-tight uppercase mb-4">
            COLEGIO CROSSOVER
          </h1>
          <p className="text-white/80 font-body text-lg md:text-xl font-light tracking-wide">
            Descubre nuestro programa educativo nivel por nivel.
          </p>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="w-full bg-background/90 backdrop-blur-lg border-b border-black/10 sticky top-[70px] md:top-[80px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap justify-center gap-2 md:gap-8">
            {[
              { id: "inicial", label: "Nivel Inicial", icon: "toys" },
              { id: "primaria", label: "Nivel Primario", icon: "school" },
              { id: "secundaria", label: "Nivel Secundario", icon: "laptop_mac" },
              { id: "semi-internado", label: "Semi-Internado", icon: "family_home" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3 md:px-6 md:py-5 border-b-4 transition-all duration-300 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-on-background-muted hover:text-on-background hover:border-black/10"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">{tab.icon}</span>
                <span className="font-display font-bold text-xs md:text-lg tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        
        {/* NIVEL INICIAL TAB */}
        {activeTab === "inicial" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">toys</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">{inicialInfo.title}</h2>
              <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
                {inicialInfo.description}
              </p>
              <button onClick={() => setShowModal('inicial')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-16">
                <span className="material-symbols-outlined text-xl">list_alt</span>
                Ver Requisitos
              </button>

              <div className="max-w-4xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 aspect-video relative">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/8PCUxEWfY0U?autoplay=1&mute=1" 
                  title="Tour Nivel Inicial" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {inicialInfo.cycles.map((cycle, idx) => (
                <div key={idx} className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl">
                  <div className={`absolute top-0 left-0 w-full h-2 ${cycle.color}`}></div>
                  <h3 className="font-display text-2xl font-bold text-on-background mb-3">{cycle.name}</h3>
                  <div className={`px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-6 ${cycle.color} ${cycle.shadow} shadow-lg`}>{cycle.focus}</div>
                  <ul className="space-y-4">
                    {cycle.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-on-background">
                        <span className={`material-symbols-outlined text-xl mt-0.5 ${cycle.color.replace('bg-', 'text-')}`}>child_care</span>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="md:col-span-3 mb-4">
                <h3 className="font-display text-3xl font-bold text-on-background text-center">Enfoque Pedagógico</h3>
              </div>
              {inicialInfo.pedagogy.map((ped, idx) => (
                <div key={idx} className="bg-surface p-6 rounded-2xl border border-black/5">
                  <h4 className="font-bold text-lg text-on-background mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    {ped.title}
                  </h4>
                  <p className="text-on-background-muted text-sm leading-relaxed">{ped.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-primary/5 rounded-[2rem] p-8 md:p-12 border border-primary/10 text-center">
              <h3 className="font-display text-2xl font-bold text-on-background mb-8">Competencias Fundamentales</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {inicialInfo.competencies.map((comp, idx) => (
                  <span key={idx} className="bg-white px-4 py-2 rounded-full text-sm font-bold text-on-background-muted shadow-sm border border-black/5">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
            
            <button onClick={() => setShowModal('inicial')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mt-16 mb-8">
              <span className="material-symbols-outlined text-xl">list_alt</span>
              Ver Requisitos
            </button>
          </div>
        )}

        {/* NIVEL PRIMARIO TAB */}
        {activeTab === "primaria" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">school</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">{primarioInfo.title}</h2>
              <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
                {primarioInfo.description}
              </p>
              <button onClick={() => setShowModal('primaria')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-16">
                <span className="material-symbols-outlined text-xl">list_alt</span>
                Ver Requisitos
              </button>

              <div className="max-w-4xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 aspect-video relative">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/JJU1kx_s_2g?autoplay=1&mute=1" 
                  title="Tour Nivel Primario" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {primarioInfo.cycles.map((cycle, idx) => (
                <div key={idx} className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl">
                  <div className={`absolute top-0 left-0 w-full h-2 ${cycle.color}`}></div>
                  <h3 className="font-display text-2xl font-bold text-on-background mb-3">{cycle.name}</h3>
                  <div className={`px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-6 ${cycle.color} ${cycle.shadow} shadow-lg`}>{cycle.focus}</div>
                  <ul className="space-y-4">
                    {cycle.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-on-background">
                        <span className={`material-symbols-outlined text-xl mt-0.5 ${cycle.color.replace('bg-', 'text-')}`}>menu_book</span>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="md:col-span-3 mb-4">
                <h3 className="font-display text-3xl font-bold text-on-background text-center">Componentes del Programa</h3>
              </div>
              {primarioInfo.components.map((comp, idx) => (
                <div key={idx} className="bg-surface p-6 rounded-2xl border border-black/5">
                  <h4 className="font-bold text-lg text-on-background mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">extension</span>
                    {comp.title}
                  </h4>
                  <p className="text-on-background-muted text-sm leading-relaxed">{comp.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-[2rem] p-8 md:p-12 border border-primary/10 text-center">
              <h3 className="font-display text-2xl font-bold text-on-background mb-8">Áreas Curriculares</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {primarioInfo.areas.map((area, idx) => (
                  <span key={idx} className="bg-white px-4 py-2 rounded-full text-sm font-bold text-on-background-muted shadow-sm border border-black/5">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            
            <button onClick={() => setShowModal('primaria')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mt-16 mb-8">
              <span className="material-symbols-outlined text-xl">list_alt</span>
              Ver Requisitos
            </button>
          </div>
        )}

        {/* NIVEL SECUNDARIO TAB */}
        {activeTab === "secundaria" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 block">laptop_mac</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">Nivel Secundario</h2>
              <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
                Con una duración de seis años, dirigido a jóvenes de 12 a 17 años, nuestro nivel secundario prepara a los estudiantes para la educación superior y el mundo laboral con un programa de excelencia integral.
              </p>
              <button onClick={() => setShowModal('secundaria')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-16">
                <span className="material-symbols-outlined text-xl">list_alt</span>
                Ver Requisitos
              </button>

              <div className="max-w-4xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 aspect-video relative mb-16">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/JJU1kx_s_2g?autoplay=1&mute=1" 
                  title="Tour Nivel Secundario" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
                <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl">
                  <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
                  <h3 className="font-display text-2xl font-bold text-on-background mb-2">Primer Ciclo (1.º a 3.º grado)</h3>
                  <div className="px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-4 bg-teal-500 shadow-teal-500/50 shadow-lg">Tronco Común</div>
                  <p className="text-on-background-muted leading-relaxed">
                    Asignaturas generales. Formamos una base académica analítica e intelectual sumamente sólida para todos nuestros estudiantes, preparándolos para su especialización futura.
                  </p>
                </div>
                <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl">
                  <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
                  <h3 className="font-display text-2xl font-bold text-on-background mb-2">Segundo Ciclo (4.º a 6.º grado)</h3>
                  <div className="px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-4 bg-rose-500 shadow-rose-500/50 shadow-lg">Salidas Especializadas</div>
                  <p className="text-on-background-muted leading-relaxed mb-4">
                    Etapa donde el estudiante elige su camino profesional:
                  </p>
                  <ul className="space-y-3 text-sm text-on-background-muted">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5">school</span>
                      <span><strong className="text-on-background">Modalidad Académica:</strong> Prepara directamente para el ingreso a la educación superior profundizando en ciencias y humanidades.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5">engineering</span>
                      <span><strong className="text-on-background">Modalidad Técnico-Profesional:</strong> Formación en especialidades de alta demanda para la inserción laboral o universitaria.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center mb-16">
              <div className="w-24 h-1 bg-black/5 mx-auto mb-16 rounded-full"></div>
              <span className="text-primary font-body text-sm font-bold uppercase tracking-widest mb-4 block">Nuestra Especialidad Técnico-Profesional</span>
              <h2 className="font-display text-4xl md:text-6xl font-black text-on-background tracking-tighter mb-6 uppercase">
                Tecnólogo <span className="text-primary">Digital 4.0</span>
              </h2>
              <p className="font-body text-on-background-muted text-xl max-w-4xl mx-auto leading-relaxed">
                Un viaje progresivo, año por año, diseñado para transformarte. Empezarás con los fundamentos digitales y te graduarás como un especialista técnico con mentalidad de emprendedor, listo para los desafíos de la Industria 4.0.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-24">
              {techProgram.map((prog, idx) => (
                <div key={idx} className="glass-panel-light rounded-[2rem] p-8 border border-black/5 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col h-full bg-white shadow-lg hover:shadow-2xl">
                  <div className={`absolute top-0 left-0 w-full h-2 ${prog.color}`}></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider ${prog.color} ${prog.shadow} shadow-lg`}>
                      {prog.year}
                    </div>
                    <span className={`material-symbols-outlined text-4xl ${prog.color.replace('bg-', 'text-')}`}>
                      {prog.icon}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className={`text-xs font-black uppercase tracking-[0.2em] mb-2 block ${prog.color.replace('bg-', 'text-')}`}>{prog.level}</span>
                    <h3 className="font-display text-2xl font-bold text-on-background leading-tight">{prog.title}</h3>
                  </div>
                  
                  <p className="text-on-background-muted text-sm leading-relaxed mb-8 flex-grow">
                    {prog.description}
                  </p>
                  
                  <div className="mt-auto bg-background/50 rounded-xl p-5 border border-black/5">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-background mb-3">Materias Clave</h4>
                    <ul className="space-y-3">
                      {prog.subjects.map((sub, sidx) => (
                        <li key={sidx} className="flex items-start gap-3 text-sm text-on-background font-medium">
                          <span className={`material-symbols-outlined text-[18px] mt-0.5 ${prog.color.replace('bg-', 'text-')}`}>check_circle</span>
                          <span className="leading-tight">{sub}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Open Source Section */}
            <div className="glass-panel-light rounded-[3rem] p-8 md:p-16 border border-black/5 text-center relative overflow-hidden hover:border-primary/20 transition-colors duration-500 shadow-xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="relative z-10">
                <span className="material-symbols-outlined text-6xl text-primary mb-8 animate-bounce">public</span>
                <h2 className="font-display text-3xl md:text-5xl font-black text-on-background tracking-tight mb-8">
                  Tecnología de Vanguardia,<br className="hidden md:block"/> Accesible para Todos
                </h2>
                <p className="font-body text-on-background-muted text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-light">
                  Creemos que el acceso a herramientas profesionales no debería ser un privilegio. Por eso, formamos a nuestros estudiantes con el <strong className="font-semibold text-on-background">ecosistema de software de código abierto</strong> más potente y respetado a nivel mundial. Son las mismas tecnologías que utilizan desde estudios de animación independientes hasta innovadoras startups de ingeniería, y les dan a nuestros egresados la libertad de crear y emprender sin la barrera de licencias costosas.
                </p>
              </div>
            </div>
            
            <button onClick={() => setShowModal('secundaria')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mt-16 mb-8">
              <span className="material-symbols-outlined text-xl">list_alt</span>
              Ver Requisitos
            </button>
          </div>
        )}

        {/* SEMI-INTERNADO TAB */}
        {activeTab === "semi-internado" && (
          <div className="animate-fade-in-up mb-24">
            <div className="text-center mb-16">
              <span className="material-symbols-outlined text-6xl text-[#ffcc00] mb-4 block animate-bounce">family_home</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">Semi-Internado</h2>
              <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
                Pensando en la tranquilidad de los padres que trabajan, ofrecemos un programa extendido donde tus hijos aprenden, almuerzan, hacen sus tareas y se divierten en un ambiente totalmente seguro.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="bg-[#ffcc00] text-black px-5 py-2.5 rounded-full font-bold text-sm shadow-md border border-black/5 flex items-center gap-2"><span className="material-symbols-outlined text-base">schedule</span> Lunes a Viernes de 7:30 a.m. a 6:00 p.m.</span>
                <span className="bg-[#004e9a] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md flex items-center gap-2"><span className="material-symbols-outlined text-base">child_care</span> De Párvulo a 6to de Primaria</span>
              </div>

              <button onClick={() => setShowModal('semi-internado')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-16">
                <span className="material-symbols-outlined text-xl">list_alt</span>
                Ver Requisitos
              </button>

              {/* Video */}
              <div className="max-w-4xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 aspect-video relative mb-16">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/8PCUxEWfY0U?autoplay=1&mute=1" 
                  title="Tour Semi-Internado" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Beneficios Grid */}
            <h3 className="font-display text-3xl font-bold text-center mb-10">¿Qué incluye nuestro programa?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {/* 1. Sala de Tareas */}
              <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                <span className="material-symbols-outlined text-4xl text-blue-500 mb-4 block">auto_stories</span>
                <h4 className="font-bold text-xl mb-3 text-on-background">Sala de Tareas Guiada</h4>
                <p className="text-on-background-muted text-sm">Apoyo en sus tareas y reforzamiento en matemáticas y lecto-escritura. ¡Llegan a casa a descansar!</p>
              </div>

              {/* 2. Alimentación */}
              <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                <span className="material-symbols-outlined text-4xl text-green-500 mb-4 block">restaurant</span>
                <h4 className="font-bold text-xl mb-3 text-on-background">Alimentación Saludable</h4>
                <p className="text-on-background-muted text-sm">Almuerzo diario con un menú balanceado y merienda vespertina para mantener su energía al máximo.</p>
              </div>

              {/* 3. Disciplinas Deportivas */}
              <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
                <span className="material-symbols-outlined text-4xl text-orange-500 mb-4 block">sports_martial_arts</span>
                <h4 className="font-bold text-xl mb-3 text-on-background">Disciplinas Deportivas</h4>
                <p className="text-on-background-muted text-sm">Prácticas de Karate, Básquetbol y Voleibol para fomentar su salud, disciplina y trabajo en equipo.</p>
              </div>

              {/* 4. Artes y Creatividad */}
              <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
                <span className="material-symbols-outlined text-4xl text-purple-500 mb-4 block">palette</span>
                <h4 className="font-bold text-xl mb-3 text-on-background">Artes y Creatividad</h4>
                <p className="text-on-background-muted text-sm">Desarrollan su lado artístico con talleres de pintura, clases de ballet y clases de flauta.</p>
              </div>

              {/* 5. Clases Formales */}
              <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                <span className="material-symbols-outlined text-4xl text-red-500 mb-4 block">school</span>
                <h4 className="font-bold text-xl mb-3 text-on-background">Programa Académico</h4>
                <p className="text-on-background-muted text-sm">Todo el programa de clases del horario matutino está totalmente cubierto con nuestros docentes.</p>
              </div>

              {/* 6. Proyectos Especiales */}
              <div className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500"></div>
                <span className="material-symbols-outlined text-4xl text-yellow-500 mb-4 block">extension</span>
                <h4 className="font-bold text-xl mb-3 text-on-background">Proyectos Especiales</h4>
                <p className="text-on-background-muted text-sm">Actividades por temporada diseñadas para la diversión y el desarrollo cognitivo del niño.</p>
              </div>
            </div>

            <button onClick={() => setShowModal('semi-internado')} className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-16">
              <span className="material-symbols-outlined text-xl">list_alt</span>
              Ver Requisitos
            </button>
          </div>
        )}
        {/* ADMISSIONS MODAL */}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl relative animate-fade-in-up my-8">
            <button 
              onClick={() => setShowModal(null)}
              className="absolute top-4 right-4 bg-black/5 hover:bg-black/10 text-on-background p-2 rounded-full transition-colors z-10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="p-8 md:p-10 max-h-[85vh] overflow-y-auto">
              <div className="text-center mb-8">
                <span className="material-symbols-outlined text-5xl text-primary mb-2 block">assignment</span>
                <h2 className="font-display text-3xl md:text-4xl font-black text-on-background uppercase">
                  Requisitos e Inversión
                </h2>
                <p className="text-primary font-bold text-lg">
                  {showModal === 'inicial' && "Nivel Inicial"}
                  {showModal === 'primaria' && "Nivel Primario"}
                  {showModal === 'secundaria' && "Nivel Secundario"}
                  {showModal === 'semi-internado' && "Semi-Internado"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Lo Específico */}
                <div className="bg-surface p-6 rounded-2xl border border-black/5">
                  <h3 className="font-bold text-lg text-on-background mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span> 
                    Documentación
                  </h3>
                  
                  {(showModal === 'inicial' || showModal === 'primaria' || showModal === 'semi-internado') ? (
                    <ul className="list-disc pl-5 space-y-2 text-sm text-on-background-muted">
                      <li>Acta de nacimiento original y certificada</li>
                      <li>2 fotos 2x2</li>
                      <li>Copia de seguro</li>
                      {showModal === 'inicial' && <li>Copia de récord de vacunas</li>}
                      <li>Nota del curso anterior (si lo requiere)</li>
                      <li>Carta de saldo (si lo requiere)</li>
                      <li>Copia de cédula de los padres o tutores</li>
                      <li>Historial del SIGERD</li>
                    </ul>
                  ) : (
                    <ul className="list-disc pl-5 space-y-2 text-sm text-on-background-muted">
                      <li>Acta de nacimiento original y certificada</li>
                      <li>2 fotos 2x2</li>
                      <li>Copia de seguro o certificado médico</li>
                      <li>Récord de notas de los cursos anteriores</li>
                      <li>Certificación de conclusión nivel primario (6to)</li>
                      <li>Carta de saldo (si lo requiere)</li>
                      <li>Copia de cédula de los padres o tutores</li>
                      <li>Hoja de inscripción o convalidación (Extranjeros)</li>
                      <li>Historial del SIGERD</li>
                    </ul>
                  )}
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-black/5">
                  <h3 className="font-bold text-lg text-on-background mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">payments</span> 
                    Inversión (2026-2027)
                  </h3>
                  
                  {(showModal === 'inicial' || showModal === 'primaria') && (
                    <div>
                      <p className="text-sm text-on-background-muted mb-2">Inscripción: RD$ 4,000<br/>Septiembre: RD$ 7,900<br/>Material: RD$ 3,000</p>
                      <p className="font-bold text-primary text-xl mt-4">Mensualidad: RD$ 7,900</p>
                      <p className="text-sm font-bold text-on-background mt-2">Total a pagar al inscribir: RD$ 14,900</p>
                    </div>
                  )}

                  {showModal === 'secundaria' && (
                    <div>
                      <p className="text-sm text-on-background-muted mb-2">Inscripción: RD$ 4,000<br/>Material: RD$ 1,500</p>
                      <div className="mt-4 mb-4 border-l-2 border-primary pl-3">
                        <p className="font-bold text-primary">Matutino</p>
                        <p className="text-sm">Mensualidad: RD$ 7,900</p>
                        <p className="text-xs font-bold text-on-background">Total al inscribir: RD$ 13,400</p>
                      </div>
                      <div className="border-l-2 border-[#ffcc00] pl-3">
                        <p className="font-bold text-[#ffcc00] drop-shadow-sm">Vespertino</p>
                        <p className="text-sm">Mensualidad: RD$ 5,000</p>
                        <p className="text-xs font-bold text-on-background">Total al inscribir: RD$ 10,500</p>
                      </div>
                    </div>
                  )}

                  {showModal === 'semi-internado' && (
                    <div>
                      <p className="text-sm text-on-background-muted mb-2">Inscripción: RD$ 4,000<br/>Septiembre: RD$ 14,500<br/>Material: RD$ 5,000</p>
                      <p className="font-bold text-primary text-xl mt-4">Mensualidad: RD$ 14,500</p>
                      <p className="text-sm font-bold text-on-background mt-2">Total a pagar al inscribir: RD$ 23,500</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lo General (Beneficios y Ofertas) */}
              <div className="bg-[#002244] text-white p-6 rounded-2xl relative overflow-hidden mt-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
                
                <h3 className="font-bold text-xl mb-4 text-[#ffcc00] flex items-center gap-2">
                  <span className="material-symbols-outlined">campaign</span> Información General y Ofertas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div>
                    <h4 className="font-bold text-sm text-[#ffcc00] mb-2">Descuentos y Ofertas</h4>
                    <ul className="space-y-1 text-xs text-white/90 list-disc pl-4 mb-4">
                      <li><strong>30 Jun al 20 Jul:</strong> Cero pago por inscripción (solo Sept. + Material).</li>
                      <li><strong>10% OFF</strong> al pagar el año escolar completo por adelantado.</li>
                      <li><strong>10% OFF</strong> en mensualidad para familias con 3 o más hijos.</li>
                      <li className="text-red-300">NO se realizan descuentos a subsidios institucionales.</li>
                    </ul>

                    <h4 className="font-bold text-sm text-[#ffcc00] mb-2">Normas de Admisión</h4>
                    <ul className="space-y-1 text-xs text-white/90 list-disc pl-4">
                      <li>Extranjeros deben realizar proceso de convalidación.</li>
                      <li>La entrega de documentos debe realizarse el mismo día de la inscripción.</li>
                      <li className="text-red-300">El pago de inscripción o reinscripción no es reembolsable.</li>
                    </ul>
                  </div>
                  <div>
                    <div className="bg-white/10 p-3 rounded-lg border border-white/20 mb-4">
                      <p className="text-sm mb-1"><strong className="text-[#ffcc00]">Límite de Admisión:</strong> Jueves 20 Agosto 2026</p>
                      <p className="text-sm"><strong className="text-[#ffcc00]">Inicio de Clases:</strong> Jueves 3 Septiembre 2026</p>
                    </div>

                    <h4 className="font-bold text-sm text-[#ffcc00] mb-2">Servicios y Extracurriculares</h4>
                    <div className="space-y-2 text-xs text-white/90">
                      <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">directions_bus</span> <strong>Transporte:</strong> RD$ 4,900 / mes (Ida y vuelta).</p>
                      <div className="flex gap-2 items-start mt-2">
                        <span className="material-symbols-outlined text-sm mt-0.5">sports_basketball</span> 
                        <div>
                          <strong>Disciplinas (Vespertinas y Sabatinas):</strong>
                          <p className="mt-1 text-white/70">Voleibol • Baloncesto • Karate • Ballet • Fútbol</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <button onClick={() => setShowModal(null)} className="bg-surface text-on-background px-8 py-3 rounded-full font-bold text-sm hover:bg-black/5 transition-colors border border-black/10">
                  Entendido, volver a la página
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
