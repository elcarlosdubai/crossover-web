import Image from "next/image";

export default function NosotrosPage() {
  const valores = [
    { name: "La Fe", icon: "church" },
    { name: "Honradez", icon: "gavel" },
    { name: "Excelencia de Servicio", icon: "star" },
    { name: "Efectividad", icon: "task_alt" },
    { name: "Creatividad", icon: "lightbulb" },
    { name: "Trabajo en Equipo", icon: "groups" },
  ];

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white">
      
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/secundaria.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-white font-display text-5xl md:text-7xl font-black tracking-tight uppercase">
            Sobre <span className="text-primary">Nosotros</span>
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
        </div>
      </section>

      {/* Filosofía Section */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="text-center relative">
          <span className="material-symbols-outlined absolute -top-10 left-1/2 -translate-x-1/2 text-7xl text-primary/10 select-none">format_quote</span>
          <p className="font-body text-xl md:text-3xl text-on-background-muted leading-relaxed font-medium relative z-10">
            "Trabajar en equipo, fomentando el amor a DIOS y el respeto a la patria; inspirados en la justicia, la libertad, la identidad ciudadana, la responsabilidad y la teoría de construcción de conocimientos, cuya estrategia implantamos en el Centro Educativo Crossover para lograr el desarrollo de hábitos que permitan la convivencia agradable."
          </p>
        </div>
      </section>

      {/* Misión & Visión Bento Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Misión */}
          <div className="group relative overflow-hidden rounded-[2rem] glass-panel-light p-10 shadow-xl border border-black/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
            {/* Background Image Placeholder (Mesa de trabajo 2 copia) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all duration-500 group-hover:bg-primary/20"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl text-primary">public</span>
              </div>
              <h2 className="font-display text-3xl font-black text-on-background mb-4 uppercase tracking-widest">Nuestra Misión</h2>
              <p className="font-body text-on-background-muted text-lg leading-relaxed">
                Formar individuos conscientes de sus condiciones y realidades, que con su formación contribuyan a la construcción de una patria mejor, fieles a Dios, a su familia y la comunidad.
              </p>
            </div>
          </div>

          {/* Visión */}
          <div className="group relative overflow-hidden rounded-[2rem] glass-panel-light p-10 shadow-xl border border-black/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
            {/* Background Image Placeholder (Mesa de trabajo 2 copia 2) */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -mr-20 -mb-20 transition-all duration-500 group-hover:bg-black/10"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl text-on-background">visibility</span>
              </div>
              <h2 className="font-display text-3xl font-black text-on-background mb-4 uppercase tracking-widest">Nuestra Visión</h2>
              <p className="font-body text-on-background-muted text-lg leading-relaxed">
                Ser una institución de formación integral de la que egresen niños, jóvenes y adultos con la más alta calidad educativa que nos permita convertirnos en el mayor y más completo centro de toda el área.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Valores */}
      <section className="bg-white/50 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-black text-on-background uppercase tracking-widest">Nuestros Valores</h2>
            <p className="font-body text-on-background-muted mt-4 text-lg">Los pilares que sostienen nuestra excelencia.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {valores.map((valor, index) => (
              <div key={index} className="glass-panel-light p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 hover:bg-white hover:shadow-xl transition-all duration-300 border border-black/5 hover:border-primary/20 hover:-translate-y-1">
                <span className="material-symbols-outlined text-3xl text-primary">{valor.icon}</span>
                <span className="font-body font-bold text-sm text-on-background uppercase tracking-wider">{valor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfil del Egresado */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-24">
        <div className="bg-primary rounded-[3rem] p-10 md:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          {/* Watermark Logo */}
          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
            <Image src="/blanco.png" alt="Watermark" width={600} height={600} className="object-contain" />
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/20">
              <span className="material-symbols-outlined text-4xl">school</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-8 uppercase tracking-widest">Perfil del Egresado</h2>
            <p className="font-body text-lg md:text-xl text-white/90 leading-relaxed mb-12">
              El egresado del Centro Educativo Crossover debe poseer la capacidad, conocimiento y actitud para desarrollarse en cualquier ámbito de su vida y para producir y construir los medios requeridos para insertarse en el mercado laboral.
            </p>
            
            <a href="#" className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-full font-body font-bold text-sm uppercase tracking-widest hover:bg-on-background hover:text-white transition-all duration-300 shadow-xl hover:-translate-y-1 group">
              <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">download</span>
              Descargar Perfil Completo (PDF)
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
