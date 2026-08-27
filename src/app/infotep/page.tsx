"use client";
import React, { useState } from "react";

const cursosInfotep = [
  { nombre: "Auxiliar de Contabilidad", icon: "calculate", desc: "Principios contables, manejo de libros, nómina y transacciones financieras diarias.", color: "bg-emerald-500", shadow: "shadow-emerald-500/50", text_color: "text-emerald-500", metodologia: "Ejercicios prácticos con comprobantes reales y llenado de formularios fiscales.", horarios: "Sábados o Domingos" },
  { nombre: "Auxiliar de Farmacia", icon: "medical_services", desc: "Atención al cliente en farmacias, lectura de recetas, clasificación de medicamentos y manejo de inventario.", color: "bg-teal-500", shadow: "shadow-teal-500/50", text_color: "text-teal-500", metodologia: "Simulación de farmacia, práctica de lectura de récipes médicos y farmacología básica.", horarios: "Sábados en la tarde." },
  { nombre: "Cajero Bancario y Comercial", icon: "point_of_sale", desc: "Operaciones de caja, cuadre diario, detección de billetes falsos y excelente servicio al cliente.", color: "bg-indigo-500", shadow: "shadow-indigo-500/50", text_color: "text-indigo-500", metodologia: "Práctica con máquinas contadoras, detectores de billetes y simulador de caja bancaria.", horarios: "Sábados intensivos." },
  { nombre: "Programas de Oficina e Internet", icon: "computer", desc: "Dominio de Microsoft Word, Excel, PowerPoint y herramientas web para el entorno laboral moderno.", color: "bg-blue-500", shadow: "shadow-blue-500/50", text_color: "text-blue-500", metodologia: "Práctica 100% en laboratorio de informática. Un estudiante por computadora.", horarios: "Sábados o Domingos." },
  { nombre: "Auxiliar de Secretariado Ejecutivo", icon: "desk", desc: "Redacción comercial, archivo, relaciones humanas y gestión eficiente de oficinas.", color: "bg-pink-500", shadow: "shadow-pink-500/50", text_color: "text-pink-500", metodologia: "Simulaciones de atención telefónica, organización de agenda y redacción de documentos corporativos.", horarios: "Sábados en la mañana." },
  { nombre: "Ventas y Servicio al Cliente", icon: "support_agent", desc: "Técnicas de persuasión, fidelización de clientes, inteligencia emocional y manejo de quejas.", color: "bg-orange-500", shadow: "shadow-orange-500/50", text_color: "text-orange-500", metodologia: "Role-play (juegos de rol) y análisis de situaciones reales de ventas.", horarios: "Martes y Jueves nocturno." },
];

export default function InfotepPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null); // State for the modal

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white pb-24 relative">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/cielo.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[4px]"></div>
        <div className="relative z-10 text-center px-6">
          <img src="https://images.seeklogo.com/logo-png/21/1/infotep-logo-png_seeklogo-219550.png" alt="INFOTEP Logo" className="w-48 h-auto object-contain mx-auto mb-8 drop-shadow-2xl" />
          <h1 className="text-white font-display text-4xl md:text-6xl font-black tracking-tight uppercase mb-4">
            Programas INFOTEP
          </h1>
          <p className="text-white/90 font-body text-xl md:text-2xl font-medium tracking-wide">
            Centro Operativo del Sistema (COS)
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto mt-8 rounded-full"></div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="animate-fade-in-up">
          <div className="text-center mb-16">
            <span className="material-symbols-outlined text-6xl text-blue-600 mb-4 block">verified</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-on-background mb-4 uppercase">Avalados por INFOTEP</h2>
            <p className="font-body text-on-background-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Somos un <strong className="text-blue-600">Centro Operativo del Sistema (COS) autorizado</strong> por el INFOTEP, la institución rectora de la capacitación técnica en República Dominicana. Impartimos formación de excelencia para impulsar tu desarrollo laboral.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {cursosInfotep.map((curso, idx) => (
              <div 
                key={idx} 
                className="glass-panel-light p-8 rounded-[2rem] border border-black/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-white shadow-md hover:shadow-xl group cursor-pointer"
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
        </div>
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
                <p className="text-on-background-muted">{selectedItem.horarios}</p>
              </div>
            </div>
            
            <div className="mt-10 flex gap-4">
              <button className={`flex-1 py-4 rounded-full text-white font-bold uppercase tracking-widest text-sm shadow-lg transition-transform hover:scale-105 ${selectedItem.color} ${selectedItem.shadow}`}>
                Inscribirme
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
