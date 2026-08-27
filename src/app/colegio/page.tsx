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

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white pb-24">
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/secundaria.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
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
              { id: "secundaria", label: "Nivel Secundario", icon: "laptop_mac" }
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
              <button className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-16">
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
              <button className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto">
                <span className="material-symbols-outlined text-xl">list_alt</span>
                Ver Requisitos
              </button>
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
              <button className="bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_20px_-10px_rgba(204,0,0,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(204,0,0,0.5)] flex items-center gap-2 mx-auto mb-12">
                <span className="material-symbols-outlined text-xl">list_alt</span>
                Ver Requisitos
              </button>

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
          </div>
        )}
      </section>
    </main>
  );
}
