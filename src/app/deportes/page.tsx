import React from "react";

export default function DeportesPage() {
  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/kikito.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-white font-display text-5xl md:text-7xl font-black tracking-tight uppercase mb-4">
            Academia de Deportes
          </h1>
          <p className="text-white/90 font-body text-xl md:text-2xl font-medium tracking-wide">
            Disciplina y Trabajo en Equipo
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-8 rounded-full"></div>
        </div>
      </section>

      {/* Placeholder Content */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-24 text-center">
        <div className="glass-panel-light p-12 rounded-[3rem] shadow-xl border border-black/5 inline-block">
          <span className="material-symbols-outlined text-6xl text-primary mb-6">construction</span>
          <h2 className="font-display text-3xl font-black text-on-background uppercase tracking-widest mb-4">
            En Construcción
          </h2>
          <p className="font-body text-on-background-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Estamos preparando esta área para mostrarte todos los detalles sobre nuestra <strong>Academia de Deportes</strong>. ¡Estará lista muy pronto!
          </p>
        </div>
      </section>
    </main>
  );
}
