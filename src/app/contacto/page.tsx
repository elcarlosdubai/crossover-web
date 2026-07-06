import React from "react";

export default function ContactoPage() {
  const extensions = [
    { name: "Recepción", ext: "100", icon: "support_agent" },
    { name: "Caja", ext: "101", icon: "point_of_sale" },
    { name: "Institute", ext: "102", icon: "language" },
    { name: "Inicial", ext: "103", icon: "child_care" },
    { name: "Media", ext: "104", icon: "school" },
    { name: "Básica", ext: "106", icon: "local_library" },
    { name: "Papelería", ext: "107", icon: "edit_document" },
  ];

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white">
      
      {/* Hero Section */}
      <section className="bg-primary pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <h1 className="text-white font-display text-5xl md:text-7xl font-black tracking-tight uppercase mb-6">
            Ponte en <span className="text-black/20">Contacto</span>
          </h1>
          <p className="font-body text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Estamos aquí para ayudarte. Comunícate con nuestros departamentos, escríbenos directamente o visítanos en nuestras instalaciones.
          </p>
        </div>
      </section>

      {/* Main Content (Grid) */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Col 1: Información de Contacto */}
          <div className="glass-panel-light p-8 md:p-10 rounded-[2rem] shadow-xl border border-black/5 bg-white">
            <h2 className="font-display text-2xl font-black text-on-background uppercase tracking-widest mb-8 border-b border-black/5 pb-4">
              Información Directa
            </h2>
            
            <div className="flex flex-col gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <h3 className="font-body font-bold text-on-background text-sm uppercase tracking-wider mb-1">Dirección</h3>
                  <p className="font-body text-on-background-muted leading-relaxed">
                    Av. Las Palmas #58, Herrera<br/>
                    Santo Domingo Oeste 10701<br/>
                    República Dominicana
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <h3 className="font-body font-bold text-on-background text-sm uppercase tracking-wider mb-1">Teléfono & WhatsApp</h3>
                  <p className="font-body text-on-background-muted leading-relaxed">
                    <a href="tel:+18099220880" className="hover:text-primary transition-colors block">+1 809-922-0880</a>
                    <a href="https://wa.me/18099220880" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-sm font-medium text-green-600 mt-1 inline-block">Enviar WhatsApp</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h3 className="font-body font-bold text-on-background text-sm uppercase tracking-wider mb-1">Correo Electrónico</h3>
                  <p className="font-body text-on-background-muted leading-relaxed">
                    <a href="mailto:crossover@crossoverrd.com" className="hover:text-primary transition-colors">crossover@crossoverrd.com</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-background p-6 rounded-2xl border border-black/5 mt-2">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <h3 className="font-body font-bold text-on-background text-sm uppercase tracking-wider mb-1">Horario</h3>
                  <p className="font-body text-on-background-muted leading-relaxed">
                    Lunes a Sábado<br/>
                    <span className="font-bold text-on-background">8:00 AM - 8:00 PM</span><br/>
                    <span className="text-red-500 text-sm font-medium mt-1 inline-block">Domingo Cerrado</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2 & 3: Directorio y Formulario */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Directorio de Extensiones */}
            <div className="glass-panel-light p-8 md:p-10 rounded-[2rem] shadow-xl border border-black/5 bg-white">
              <h2 className="font-display text-2xl font-black text-on-background uppercase tracking-widest mb-4">
                Directorio de Extensiones
              </h2>
              <p className="font-body text-on-background-muted mb-8">
                Si necesita comunicarse con algún departamento o área del Centro Educativo Crossover, por favor marque el número principal y luego la extensión deseada.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {extensions.map((ext, idx) => (
                  <a href={`tel:+18099220880,${ext.ext}`} key={idx} className="bg-background border border-black/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer block">
                    <span className="material-symbols-outlined text-3xl text-on-background/30 group-hover:text-primary transition-colors mb-3">
                      {ext.icon}
                    </span>
                    <span className="font-body font-bold text-xs uppercase tracking-wider text-on-background mb-1">{ext.name}</span>
                    <span className="font-display font-black text-xl text-primary">Ext. {ext.ext}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Formulario Rápido */}
            <div className="glass-panel-light p-8 md:p-10 rounded-[2rem] shadow-xl border border-black/5 bg-white">
              <h2 className="font-display text-2xl font-black text-on-background uppercase tracking-widest mb-6 border-b border-black/5 pb-4">
                Envíanos un Mensaje
              </h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="font-body text-xs font-bold uppercase tracking-wider text-on-background-muted">Nombre Completo</label>
                  <input type="text" id="name" placeholder="Ej. Juan Pérez" className="bg-background border border-black/5 rounded-xl px-4 py-3 font-body text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-body text-xs font-bold uppercase tracking-wider text-on-background-muted">Correo Electrónico</label>
                  <input type="email" id="email" placeholder="ejemplo@correo.com" className="bg-background border border-black/5 rounded-xl px-4 py-3 font-body text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label htmlFor="message" className="font-body text-xs font-bold uppercase tracking-wider text-on-background-muted">Mensaje</label>
                  <textarea id="message" rows={4} placeholder="¿En qué podemos ayudarte?" className="bg-background border border-black/5 rounded-xl px-4 py-3 font-body text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"></textarea>
                </div>
                <div className="md:col-span-2 mt-2">
                  <button type="button" className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-full font-body font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-xl hover:bg-on-background">
                    Enviar Mensaje
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="w-full h-[500px] relative">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15136.892745237568!2d-69.986702!3d18.473547!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eaf8a76ebf38801%3A0x9315b1ba4d38e35f!2sCrossover%20Center!5e0!3m2!1sen!2sus!4v1783301891765!5m2!1sen!2sus" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Ubicación Crossover"
          className="grayscale hover:grayscale-0 transition-all duration-700"
        ></iframe>
        {/* Decorative Overlay for Elite Vibe (optional) */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]"></div>
      </section>

    </main>
  );
}
