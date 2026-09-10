"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type Area = "colegio" | "instituto" | "deportes" | "infotep" | null;
type Course = string | null;

export default function InscripcionPage() {
  const [activeArea, setActiveArea] = useState<Area>(null);
  const [activeCourse, setActiveCourse] = useState<Course>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const area = params.get("area") as Area;
    const curso = params.get("curso");
    if (area) setActiveArea(area);
    if (curso) {
      setActiveCourse(curso);
      // If coming from a direct link/vitrina, they already saw the details, but we'll still show the details step just to be safe, or we could skip to form. Let's show details step.
    }
  }, []);

  // Reset form when changing course or area
  const handleAreaChange = (area: Area) => {
    setActiveArea(area);
    setActiveCourse(null);
    setIsFormVisible(false);
    setIsFormSubmitted(false);
  };

  const handleCourseChange = (course: Course) => {
    setActiveCourse(course);
    setIsFormVisible(false);
    setIsFormSubmitted(false);
  };

  const handleShowForm = () => {
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to save lead
    setIsFormSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderLeadForm = (schedules: string[], courseName: string, areaName: string) => {
    return (
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-2xl mx-auto animate-fade-in-up">
        <button type="button" onClick={() => setIsFormVisible(false)} className="text-on-background-muted hover:text-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold uppercase tracking-wider mb-4 md:mb-8">
          <span className="material-symbols-outlined">arrow_back</span> Volver a Detalles
        </button>

        <div className="text-center mb-8">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">{areaName}</span>
          <h2 className="font-display text-3xl font-black text-on-background mb-2">Completar Pre-Inscripción</h2>
          <p className="text-on-background-muted">Estás aplicando para: <strong>{courseName}</strong></p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-on-background mb-2">Nombre del Estudiante *</label>
              <input type="text" required className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Ej. Juan" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-background mb-2">Apellidos *</label>
              <input type="text" required className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Ej. Pérez" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-on-background mb-2">Teléfono (WhatsApp) *</label>
              <input type="tel" required className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="809-000-0000" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-background mb-2">Correo Electrónico</label>
              <input type="email" className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-background mb-2">Selecciona un Horario *</label>
            <select required className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-background appearance-none">
              <option value="">-- Elige el horario de tu preferencia --</option>
              {schedules.map((s, i) => (
                <option key={i} value={s}>{s.replace(/•/g, '').trim()}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="mt-10 w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform">
          Continuar y Ver Requisitos
        </button>
      </form>
    );
  };

  const renderInstitutoCourses = () => {
    const courses = [
      { 
        nombre: "Inglés Básico Niños (5-7 años)", 
        desc: "A través de juegos y dinámicas, los niños pierden el miedo a hablar de forma natural.",
        beneficios: ["Aprenderán vocabulario fundamental (colores, animales, números).", "Desarrollarán una pronunciación nativa desde pequeños.", "Interactuarán con otros niños en un ambiente 100% en inglés."]
      },
      { 
        nombre: "Inglés Básico Niños (7-12 años)", 
        desc: "100% conversacional e interactivo. Uso de juegos de rol y dinámicas grupales.",
        beneficios: ["Comprenderán diálogos completos y podrán formular oraciones.", "Mejorarán su comprensión auditiva con herramientas audiovisuales.", "Estarán preparados para continuar su educación secundaria con bases sólidas."]
      },
      { 
        nombre: "Inglés Adolescentes (13-17 años)", 
        desc: "Enfoque en debates y temas actuales para desarrollar fluidez y confianza al hablar.",
        beneficios: ["Aprenderán a debatir y argumentar sus ideas en inglés.", "Preparación ideal para exámenes estandarizados y universidades.", "Uso de vocabulario avanzado y cultura pop para mantener el interés."]
      },
      { 
        nombre: "Inglés Adultos (18+ años)", 
        desc: "Simulaciones de entornos laborales, redacción de correos y presentaciones en público.",
        beneficios: ["Pierde el miedo a hablar en reuniones de trabajo y entrevistas.", "Aprende a redactar correos formales y profesionales.", "Mejora tu currículum y ábrete puertas a mejores salarios."]
      },
      { 
        nombre: "Informática Básica", 
        desc: "Dominio del Paquete de Oficina (Word, Excel, PowerPoint) y navegación web. 13+ años.",
        beneficios: ["Domina la creación de documentos profesionales en Word.", "Aprende a hacer presupuestos y tablas dinámicas en Excel.", "Crea presentaciones impactantes en PowerPoint para tu escuela o trabajo."]
      },
      { 
        nombre: "Informática Avanzada", 
        desc: "Word/Excel avanzado y fundamentos de Redes. Basado en proyectos prácticos.",
        beneficios: ["Automatiza tareas con fórmulas avanzadas en Excel.", "Comprende cómo funcionan las redes de computadoras (IP, routers).", "Ideal para quienes buscan trabajo como asistentes administrativos o soporte técnico."]
      }
    ];

    if (!activeCourse) {
    return (
        <div className="animate-fade-in-up">
          <h3 className="font-display text-2xl font-bold text-center mb-8">¿Qué curso te interesa?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <button 
                key={course.nombre}
                onClick={() => handleCourseChange(course.nombre)}
                className="bg-white p-6 rounded-2xl border border-black/5 shadow-md hover:border-primary hover:shadow-lg transition-all text-left group flex flex-col justify-center"
              >
                <div className="flex justify-between items-center w-full mb-2">
                  <span className="font-bold text-on-background group-hover:text-primary transition-colors text-sm">{course.nombre}</span>
                  <span className="material-symbols-outlined text-black/20 group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
                <p className="text-xs text-on-background-muted line-clamp-2">{course.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => handleAreaChange(null)} className="mt-6 md:mt-8 text-on-background-muted hover:text-primary flex items-center justify-center gap-1 md:gap-2 mx-auto text-xs md:text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined">arrow_back</span> Volver a Áreas
          </button>
        </div>
      );
    }

    let schedule: string[] = [];
    if (activeCourse.includes("5-7 años")) {
      schedule = ["Sábados | 8:30am a 12:00pm (Duración 9 meses)"];
    } else if (activeCourse.includes("7-12 años")) {
      schedule = [
        "Martes y Jueves | 3:00pm a 4:30pm",
        "Martes y Jueves | 4:30pm a 6:00pm",
        "Sábados | 8:30am a 12:00pm",
        "Sábados | 1:00pm a 4:00pm"
      ];
    } else if (activeCourse.includes("Adolescentes")) {
      schedule = [
        "Martes y Jueves | 3:00pm a 4:30pm",
        "Martes y Jueves | 4:30pm a 6:00pm",
        "Sábados | 8:30am a 12:00pm",
        "Sábados | 1:00pm a 4:00pm",
        "Sábados | 4:00pm a 7:00pm"
      ];
    } else if (activeCourse.includes("Adultos")) {
      schedule = [
        "Martes y Jueves | 6:30pm a 8:00pm",
        "Sábados | 1:00pm a 4:00pm",
        "Sábados | 4:00pm a 7:00pm"
      ];
    } else if (activeCourse.includes("Informática Básica")) {
      schedule = [
        "Sábados | 8:30am a 12:00pm",
        "Sábados | 1:00pm a 4:00pm"
      ];
    } else if (activeCourse.includes("Informática Avanzada")) {
      schedule = [
        "Sábados | 8:30am a 12:00pm",
        "Sábados | 1:00pm a 4:00pm"
      ];
    }

    if (isFormSubmitted) {
    return (
        <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="font-display text-4xl font-black text-on-background mb-4">¡Tus datos fueron recibidos!</h2>
          <p className="text-lg text-on-background-muted mb-10">Para asegurar tu cupo en <strong>{activeCourse}</strong>, por favor completa el pago de inscripción siguiendo estas instrucciones:</p>
          
          <div className="bg-surface p-8 rounded-3xl border border-black/5 max-w-xl mx-auto mb-10 text-left">
            <div className="flex justify-between items-end mb-6 border-b border-black/10 pb-4">
              <div>
                <p className="text-sm text-on-background-muted mb-1">Inscripción (Incluye 1er mes)</p>
                <p className="font-display text-3xl font-black text-on-background">RD$ 2,500</p>
              </div>
              <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg text-right">
                OFERTA: RD$ 2,000<br/>hasta el 25 de Septiembre
              </div>
            </div>
            <div>
              <p className="text-sm text-on-background-muted mb-1">Mensualidad</p>
              <p className="font-display text-2xl font-bold text-primary">RD$ 1,600</p>
            </div>
          </div>

                    {activeCourse.includes("Inglés") && (
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 text-left max-w-xl mx-auto mb-6">
              <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2"><span className="material-symbols-outlined">menu_book</span> Material de Apoyo</h4>
              <p className="text-sm text-orange-800">El libro de texto para este nivel tiene un costo de <strong>RD$ 1,700</strong> y es obligatorio para el desarrollo de las clases. Podrás adquirirlo en nuestras instalaciones.</p>
            </div>
          )}
<div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 text-left max-w-xl mx-auto">
            <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2"><span className="material-symbols-outlined">info</span> Métodos de Pago</h4>
            <p className="text-sm text-yellow-800 mb-4">Realiza tu pago vía transferencia o con Tarjeta de Crédito/Débito:</p>
            
            <div className="bg-white p-4 rounded-xl text-sm border border-yellow-100 mb-4 font-medium">
              <p className="mb-2 text-primary font-bold border-b pb-1">Transferencia Bancaria</p>
              <p><strong>Banco:</strong> Popular</p>
              <p><strong>Cuenta:</strong> 790471106 (Corriente)</p>
              <p><strong>A nombre de:</strong> Instituto Crossover (RNC: 130684642)</p>
              <p><strong>Correo:</strong> crossovercaja@gmail.com</p>
            </div>

            <div className="bg-white p-4 rounded-xl text-sm border border-yellow-100 mb-4 font-medium">
              <p className="mb-2 text-primary font-bold border-b pb-1">Pago en Línea (Tarjeta)</p>
              <p className="mb-2">Paga seguro desde tu celular con Clink.</p>
              <a href="https://app.portaldom.com.do/payment-link/66de6d" target="_blank" className="inline-block bg-[#004e9a] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#003875] transition-colors">
                Pagar con Tarjeta Aquí
              </a>
            </div>

            <p className="text-xs text-yellow-800 italic">* IMPORTANTE: Al pagar, coloca SOLO los apellidos y nombres del estudiante. Envía el comprobante al WhatsApp (809-922-0880).</p>
            <p className="text-xs text-red-600 mt-4 font-bold">* NOTA: El monto pagado por inscripción no es reembolsable bajo ninguna circunstancia.</p>
          </div>
        </div>
      );
    }

    if (isFormVisible) {
      return renderLeadForm(schedule, activeCourse, "Instituto Crossover");
    }

    const courseDetails = courses.find((c) => c.nombre === activeCourse);
    return (
      <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-4xl mx-auto">
        <button onClick={() => handleCourseChange(null)} className="text-on-background-muted hover:text-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold uppercase tracking-wider mb-4 md:mb-8">
          <span className="material-symbols-outlined">arrow_back</span> Cambiar Curso
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">Instituto Crossover</span>
            <h2 className="font-display text-3xl font-black text-on-background mb-4">{activeCourse}</h2>
            {courseDetails && (
              <div className="mb-8">
                <p className="text-on-background-muted text-sm md:text-base mb-4 leading-relaxed border-l-4 border-primary pl-4 italic">
                  "{courseDetails.desc}"
                </p>
                {courseDetails.beneficios && (
                  <div className="bg-surface p-4 rounded-xl border border-black/5">
                    <h5 className="font-bold text-sm mb-2">Beneficios del programa:</h5>
                    <ul className="space-y-2">
                      {courseDetails.beneficios.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-on-background-muted">
                          <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <h4 className="font-bold text-lg mb-3">Horarios Disponibles</h4>
            <ul className="space-y-2 mb-8">
              {schedule.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-on-background-muted">
                  <span className="material-symbols-outlined text-primary text-sm mt-1">schedule</span> {s}
                </li>
              ))}
            </ul>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-8">
              <h4 className="font-bold text-yellow-900 mb-1 flex items-center gap-2"><span className="material-symbols-outlined">info</span> Fechas Importantes</h4>
              <p className="text-sm text-yellow-800 mb-2"><strong>¡Atención! Fecha Límite de Inscripción: Lunes 28 de Septiembre 2026</strong></p><p className="text-sm text-yellow-800">Inicio de clases: <strong>1 o 3 de Octubre 2026</strong><br/>Inducción (Obligatoria): <strong>8 o 10 de Octubre 2026</strong></p>
            </div>
          </div>

          <div className="w-full md:w-80 bg-surface p-6 rounded-2xl border border-black/5 shrink-0">
            <h3 className="font-bold text-lg mb-4 border-b border-black/10 pb-4">Inversión</h3>
            <p className="text-sm text-on-background-muted mb-1">Inscripción (Incluye 1er mes)</p>
            <p className="font-display text-3xl font-black text-on-background mb-2">RD$ 2,500</p>
            <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded inline-block mb-4">
              OFERTA: RD$ 2,000 hasta el 25 de Septiembre
            </div>
            
            <p className="text-sm text-on-background-muted mb-1">Mensualidad</p>
            <p className="font-display text-2xl font-bold text-primary mb-6">RD$ 1,600</p>

            <button onClick={handleShowForm} className="block text-center w-full bg-primary text-white px-6 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 shadow-lg transition-all">
              ¡Inscribirme Ahora!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeportesCourses = () => {
    const sports = [
      { 
        nombre: "Basketball", 
        icon: "sports_basketball", 
        desc: "¡Aprende a driblar, lanzar y trabajar en equipo en un ambiente lleno de energía!",
        beneficios: ["Mejora la resistencia cardiovascular y la coordinación.", "Fomenta el trabajo en equipo y el liderazgo desde pequeños.", "Desarrolla disciplina y enfoque mental a través del juego."]
      },
      { 
        nombre: "Volleyball", 
        icon: "sports_volleyball", 
        desc: "Clases diseñadas para enseñar los fundamentos del voleibol mientras se divierten.",
        beneficios: ["Aumenta la agilidad, velocidad y mejora los reflejos.", "Fortalece la comunicación y el compañerismo en la cancha.", "Ayuda a mantener una excelente condición física general."]
      },
      { 
        nombre: "Fútbol", 
        icon: "sports_soccer", 
        desc: "Una academia donde desarrollan habilidades técnicas, control del balón y tácticas.",
        beneficios: ["Fortalece las piernas y mejora la capacidad aeróbica.", "Fomenta la estrategia de grupo y la toma rápida de decisiones.", "Promueve el respeto, la tolerancia y el espíritu deportivo."]
      },
      { 
        nombre: "Karate", 
        icon: "sports_martial_arts", 
        desc: "Defensa personal que forma el carácter, el respeto y la confianza.",
        beneficios: ["Aumenta la flexibilidad, fuerza y coordinación motriz.", "Enseña autocontrol, disciplina y respeto hacia los demás.", "Brinda seguridad y autoconfianza a los estudiantes en su día a día."]
      }
    ];

    if (!activeCourse) {
    return (
        <div className="animate-fade-in-up">
          <h3 className="font-display text-2xl font-bold text-center mb-8">¿Qué disciplina prefieres?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sports.map(sport => (
              <button 
                key={sport.nombre}
                onClick={() => handleCourseChange(sport.nombre)}
                className="bg-white p-6 rounded-2xl border border-black/5 shadow-md hover:border-primary hover:shadow-lg transition-all text-center group flex flex-col items-center justify-center"
              >
                <span className="material-symbols-outlined text-4xl text-black/20 group-hover:text-primary transition-colors mb-3 block">
                  {sport.icon}
                </span>
                <span className="font-bold text-on-background mb-2">{sport.nombre}</span>
                <p className="text-xs text-on-background-muted line-clamp-3">{sport.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => handleAreaChange(null)} className="mt-6 md:mt-8 text-on-background-muted hover:text-primary flex items-center justify-center gap-1 md:gap-2 mx-auto text-xs md:text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined">arrow_back</span> Volver a Áreas
          </button>
        </div>
      );
    }

    let schedule: string[] = [];
    if (activeCourse === "Basketball") {
      schedule = [
        "Jueves | 2:00pm - 4:00pm (6 a 12 años)",
        "Jueves | 4:00pm - 6:00pm (13 a 18 años)",
        "Sábados | 2:00pm - 4:00pm (6 a 12 años)",
        "Sábados | 4:00pm - 6:00pm (13 a 18 años)"
      ];
    } else if (activeCourse === "Volleyball") {
      schedule = ["Martes | 4:00pm - 6:00pm", "Sábados | 8:00am - 10:00am"];
    } else if (activeCourse === "Fútbol" || activeCourse === "Soccer (Fútbol)") {
      schedule = ["Miércoles | 2:00pm - 5:00pm (5 a 9 años)", "Viernes | 2:00pm - 5:00pm (10 a 15 años)"];
    } else if (activeCourse === "Karate") {
      schedule = ["Martes | 2:00pm - 4:00pm", "Sábados | 8:30am - 12:00pm", "Sábados | 4:00pm - 6:00pm"];
    }

    if (isFormSubmitted) {
    return (
        <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="font-display text-4xl font-black text-on-background mb-4">¡Tus datos fueron recibidos!</h2>
          <p className="text-lg text-on-background-muted mb-10">Para asegurar tu lugar en <strong>{activeCourse}</strong>, por favor completa el pago siguiendo estas instrucciones:</p>
          
          <div className="bg-surface p-8 rounded-3xl border border-black/5 max-w-xl mx-auto mb-10 text-left">
            <div className="flex justify-between items-end mb-6 border-b border-black/10 pb-4">
              <div>
                <p className="text-sm text-on-background-muted mb-1">Inscripción (Incluye 1er mes)</p>
                <p className="font-display text-3xl font-black text-on-background">RD$ 1,500</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-on-background-muted mb-1">Mensualidad</p>
              <p className="font-display text-2xl font-bold text-primary">RD$ 1,000</p>
            </div>
          </div>

                    {activeCourse.includes("Inglés") && (
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 text-left max-w-xl mx-auto mb-6">
              <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2"><span className="material-symbols-outlined">menu_book</span> Material de Apoyo</h4>
              <p className="text-sm text-orange-800">El libro de texto para este nivel tiene un costo de <strong>RD$ 1,700</strong> y es obligatorio para el desarrollo de las clases. Podrás adquirirlo en nuestras instalaciones.</p>
            </div>
          )}
<div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 text-left max-w-xl mx-auto">
            <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2"><span className="material-symbols-outlined">info</span> Métodos de Pago</h4>
            <p className="text-sm text-yellow-800 mb-4">Realiza tu pago vía transferencia o con Tarjeta de Crédito/Débito:</p>
            
            <div className="bg-white p-4 rounded-xl text-sm border border-yellow-100 mb-4 font-medium">
              <p className="mb-2 text-primary font-bold border-b pb-1">Transferencia Bancaria</p>
              <p><strong>Banco:</strong> Popular</p>
              <p><strong>Cuenta:</strong> 790471106 (Corriente)</p>
              <p><strong>A nombre de:</strong> Instituto Crossover (RNC: 130684642)</p>
              <p><strong>Correo:</strong> crossovercaja@gmail.com</p>
            </div>

            <div className="bg-white p-4 rounded-xl text-sm border border-yellow-100 mb-4 font-medium">
              <p className="mb-2 text-primary font-bold border-b pb-1">Pago en Línea (Tarjeta)</p>
              <p className="mb-2">Paga seguro desde tu celular con Clink.</p>
              <a href="https://app.portaldom.com.do/payment-link/66de6d" target="_blank" className="inline-block bg-[#004e9a] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#003875] transition-colors">
                Pagar con Tarjeta Aquí
              </a>
            </div>

            <p className="text-xs text-yellow-800 italic">* IMPORTANTE: Al pagar, coloca SOLO los apellidos y nombres del estudiante. Envía el comprobante al WhatsApp (809-922-0880).</p>
            <p className="text-xs text-red-600 mt-4 font-bold">* NOTA: El monto pagado por inscripción no es reembolsable bajo ninguna circunstancia.</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 text-left max-w-xl mx-auto mt-6">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><span className="material-symbols-outlined">styler</span> Uniformes</h4>
            <p className="text-sm text-blue-800">Los estudiantes deben asistir con el uniforme completo y en buen estado. Estará disponible a la venta en nuestra tienda física.</p>
          </div>
        </div>
      );
    }

    if (isFormVisible) {
      return renderLeadForm(schedule, activeCourse, "Deportes Crossover");
    }

    const sportDetails = sports.find((s) => s.nombre === activeCourse);
    return (
      <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-4xl mx-auto">
        <button onClick={() => handleCourseChange(null)} className="text-on-background-muted hover:text-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold uppercase tracking-wider mb-4 md:mb-8">
          <span className="material-symbols-outlined">arrow_back</span> Cambiar Disciplina
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">Crossover Deportes</span>
            <h2 className="font-display text-3xl font-black text-on-background mb-4">{activeCourse}</h2>
            {sportDetails && (
              <div className="mb-8">
                <p className="text-on-background-muted text-sm md:text-base mb-4 leading-relaxed border-l-4 border-primary pl-4 italic">
                  "{sportDetails.desc}"
                </p>
                {sportDetails.beneficios && (
                  <div className="bg-surface p-4 rounded-xl border border-black/5">
                    <h5 className="font-bold text-sm mb-2">Beneficios del programa:</h5>
                    <ul className="space-y-2">
                      {sportDetails.beneficios.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-on-background-muted">
                          <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <h4 className="font-bold text-lg mb-3">Horarios</h4>
            <ul className="space-y-2 mb-8">
              {schedule.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-on-background-muted">
                  <span className="material-symbols-outlined text-primary text-sm mt-1">event_available</span> {s}
                </li>
              ))}
            </ul>

                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-8">
              <h4 className="font-bold text-yellow-900 mb-1 flex items-center gap-2"><span className="material-symbols-outlined">event</span> Fecha Límite</h4>
              <p className="text-sm text-yellow-800">Inscripción límite: <strong>Lunes 28 de Septiembre 2026</strong></p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-8">
              <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2"><span className="material-symbols-outlined">styler</span> Uniformes</h4>
              <p className="text-sm text-blue-800">Los estudiantes deben asistir con el uniforme completo y en buen estado. Disponible a la venta en nuestra tienda física.</p>
            </div>
          </div>

          <div className="w-full md:w-80 bg-surface p-6 rounded-2xl border border-black/5 shrink-0">
            <h3 className="font-bold text-lg mb-4 border-b border-black/10 pb-4">Inversión</h3>
            <p className="text-sm text-on-background-muted mb-1">Inscripción (Incluye 1er mes)</p>
            <p className="font-display text-3xl font-black text-on-background mb-4">RD$ 1,500</p>
            
            <p className="text-sm text-on-background-muted mb-1">Mensualidad</p>
            <p className="font-display text-2xl font-bold text-primary mb-6">RD$ 1,000</p>

            <button onClick={handleShowForm} className="block text-center w-full bg-primary text-white px-6 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 shadow-lg transition-all">
              ¡Inscribirme Ahora!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInfotepCourses = () => {
    const courses = [
      { 
        nombre: "Básico de Contabilidad", 
        desc: "Domina los principios contables, manejo de libros, nómina y transacciones empresariales.",
        beneficios: ["Aprende a registrar transacciones financieras correctamente.", "Capacítate para trabajar como auxiliar contable en empresas.", "Conoce cómo manejar la nómina y los libros diarios."]
      },
      { 
        nombre: "Básico de Farmacia", 
        desc: "Fórmate para la atención al cliente, lectura de recetas y manejo de medicamentos en farmacias.",
        beneficios: ["Conoce la clasificación y manejo de medicamentos.", "Desarrolla habilidades de servicio al cliente enfocado en salud.", "Capacítate para una rápida inserción laboral en farmacias locales."]
      },
      { 
        nombre: "Básico de Ventas", 
        desc: "Desarrolla técnicas de persuasión, fidelización de clientes y manejo efectivo de objeciones.",
        beneficios: ["Aprende a cerrar ventas y fidelizar clientes a largo plazo.", "Mejora tu comunicación persuasiva y lenguaje corporal.", "Ideal para emprendedores o aspirantes a ejecutivos de ventas."]
      },
      { 
        nombre: "Cajero Bancario", 
        desc: "Entrénate en operaciones de caja, cuadre diario y detección de billetes falsos.",
        beneficios: ["Domina el cuadre de caja rápido y sin errores.", "Aprende los protocolos de seguridad y detección de fraudes.", "Prepárate para aplicar a vacantes en bancos y supermercados."]
      },
      { 
        nombre: "Contabilidad Fiscal", 
        desc: "Especialízate en el llenado de formularios fiscales, retenciones y manejo de impuestos en la RD.",
        beneficios: ["Domina el llenado de formularios de la DGII (ITBIS, IR-17).", "Conoce los procesos de retención de impuestos corporativos.", "Añade un gran valor a tu perfil como profesional de la contabilidad."]
      },
      { 
        nombre: "Manejo de Inventario", 
        desc: "Aprende el control de almacén, registro de entradas/salidas y métodos de valuación (PEPS, UEPS).",
        beneficios: ["Organiza y optimiza los espacios de almacenamiento.", "Aprende a prevenir pérdidas y realizar inventarios cíclicos.", "Capacítate para trabajar como encargado o auxiliar de almacén."]
      },
      { 
        nombre: "Programas de Oficina e Internet", 
        desc: "Domina Word, Excel, PowerPoint y las herramientas de navegación segura por internet.",
        beneficios: ["Crea documentos formales y hojas de cálculo funcionales.", "Aprende a usar internet de forma productiva y profesional.", "Certificación indispensable para cualquier trabajo de oficina."]
      },
      { 
        nombre: "Ventas Externas", 
        desc: "Conoce las estrategias de ventas en la calle (B2B), captación de prospectos y cierre de negocios.",
        beneficios: ["Desarrolla estrategias para captar clientes fuera de la oficina.", "Aprende a planificar rutas y administrar tu tiempo en la calle.", "Conviértete en un vendedor de alto rendimiento por comisión."]
      },
      { 
        nombre: "Visita Médica", 
        desc: "Fórmate en técnicas de promoción médica, farmacología básica y manejo de territorios.",
        beneficios: ["Aprende a comunicarte efectivamente con médicos y especialistas.", "Conoce la farmacología básica para promover productos.", "Ábrete puertas en una de las industrias mejor pagadas del país."]
      }
    ];

    if (!activeCourse) {
    return (
        <div className="animate-fade-in-up">
          <h3 className="font-display text-2xl font-bold text-center mb-8">¿Qué curso técnico deseas realizar?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <button 
                key={course.nombre}
                onClick={() => handleCourseChange(course.nombre)}
                className="bg-white p-6 rounded-2xl border border-black/5 shadow-md hover:border-primary hover:shadow-lg transition-all text-left group flex flex-col justify-center"
              >
                <div className="flex justify-between items-center w-full mb-2">
                  <span className="font-bold text-on-background group-hover:text-primary transition-colors text-sm">{course.nombre}</span>
                  <span className="material-symbols-outlined text-black/20 group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
                <p className="text-xs text-on-background-muted line-clamp-2">{course.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => handleAreaChange(null)} className="mt-6 md:mt-8 text-on-background-muted hover:text-primary flex items-center justify-center gap-1 md:gap-2 mx-auto text-xs md:text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined">arrow_back</span> Volver a Áreas
          </button>
        </div>
      );
    }

    const schedule = [
      "Lunes a Viernes de 2:00pm a 6:00pm",
      "Lunes a Viernes de 6:00pm a 10:00pm"
    ];

    if (isFormSubmitted) {
    return (
        <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="font-display text-4xl font-black text-on-background mb-4">¡Tus datos fueron recibidos!</h2>
          <p className="text-lg text-on-background-muted mb-10">Tu registro para <strong>{activeCourse}</strong> está casi listo. Por favor completa los siguientes pasos obligatorios:</p>
          
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-xl mx-auto text-left mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-4xl text-red-600">storefront</span>
              <h3 className="font-bold text-xl text-red-900">Inscripción Presencial</h3>
            </div>
            <p className="text-sm text-red-800 mb-6 leading-relaxed">
              Los cursos de INFOTEP son gratuitos, pero requieren validación física. Descarga, imprime y llena el formulario de inscripción para ahorrar tiempo al llegar a nuestras instalaciones.
            </p>
            
            <h4 className="font-bold text-sm text-red-900 mb-2">Requisitos a llevar:</h4>
            <ul className="text-sm text-red-800 mb-6 space-y-1">
              <li>• Certificado de bachiller o carta de estudios de 5to.</li>
              <li>• 2 fotocopias de la cédula.</li>
              <li>• Formulario físico lleno.</li>
            </ul>

            <a href="/FormulariodeInfortep.pdf" download className="flex items-center justify-center gap-2 text-center w-full bg-red-600 text-white px-4 py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-red-700 shadow-md transition-all">
              <span className="material-symbols-outlined text-lg">download</span> Descargar PDF
            </a>
          </div>
        </div>
      );
    }

    if (isFormVisible) {
      return renderLeadForm(schedule, activeCourse, "INFOTEP (Gratuito)");
    }

    const courseDetails = courses.find((c) => c.nombre === activeCourse);
    return (
      <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-4xl mx-auto">
        <button onClick={() => handleCourseChange(null)} className="text-on-background-muted hover:text-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm font-bold uppercase tracking-wider mb-4 md:mb-8">
          <span className="material-symbols-outlined">arrow_back</span> Cambiar Curso
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <span className="bg-[#004e9a] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">INFOTEP (Gratuito)</span>
            <h2 className="font-display text-3xl font-black text-on-background mb-4">{activeCourse}</h2>
            {courseDetails && (
              <div className="mb-8">
                <p className="text-on-background-muted text-sm md:text-base mb-4 leading-relaxed border-l-4 border-[#004e9a] pl-4 italic">
                  "{courseDetails.desc}"
                </p>
                {courseDetails.beneficios && (
                  <div className="bg-surface p-4 rounded-xl border border-black/5">
                    <h5 className="font-bold text-sm mb-2">Beneficios del programa:</h5>
                    <ul className="space-y-2">
                      {courseDetails.beneficios.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-on-background-muted">
                          <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <h4 className="font-bold text-lg mb-3">Horarios Disponibles</h4>
            <ul className="space-y-2 mb-6 text-on-background-muted">
              <li>• Lunes a viernes de 2:00pm a 6:00pm</li>
              <li>• Lunes a viernes de 6:00pm a 10:00pm</li>
            </ul>

            <h4 className="font-bold text-lg mb-3 mt-6">Requisitos de Inscripción</h4>
            <ul className="space-y-2 mb-6 text-on-background-muted">
              <li>• Certificado de bachiller o carta de estudios de 5to de secundaria.</li>
              <li>• 2 fotocopias de la cédula de identidad.</li>
            </ul>
          </div>

          <div className="w-full md:w-80 bg-red-50 p-6 rounded-2xl border border-red-100 shrink-0 text-center flex flex-col justify-center">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">assignment</span>
            <h3 className="font-bold text-xl text-primary mb-2">Paso 1: Pre-Inscripción</h3>
            <p className="text-sm text-red-900 mb-6">Completa tus datos en el sistema antes de traer tus documentos físicos al centro.</p>
            <button onClick={handleShowForm} className="block text-center w-full bg-primary text-white px-6 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 shadow-lg transition-all">
              Completar Datos
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderColegio = () => {
    return (
      <div className="animate-fade-in-up bg-white p-8 md:p-12 rounded-[2rem] border border-black/5 shadow-xl max-w-4xl mx-auto text-center">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">school</span>
        <h2 className="font-display text-3xl md:text-4xl font-black text-on-background mb-4 uppercase">Admisiones del Colegio</h2>
        <p className="text-on-background-muted mb-8 max-w-2xl mx-auto">
          Para ver los requisitos de admisión, costos y becas del año escolar, por favor dirígete a la sección del Colegio y selecciona el nivel de tu interés.
        </p>
        <Link href="/colegio" className="inline-block bg-primary text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 shadow-lg transition-all">
          Ir al Colegio
        </Link>
        <div className="mt-8">
          <button onClick={() => setActiveArea(null)} className="text-on-background-muted hover:text-primary flex items-center justify-center gap-2 mx-auto text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined">arrow_back</span> Volver a Áreas
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="bg-background min-h-screen pt-24 selection:bg-primary selection:text-white pb-24">
      {/* Hero Section */}
      <section className={`bg-[#002244] relative overflow-hidden transition-all duration-500 ${activeArea ? 'pt-8 pb-12' : 'pt-12 pb-20 md:pt-16 md:pb-24'}`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          {!activeArea && <span className="material-symbols-outlined text-4xl md:text-5xl text-[#ffcc00] mb-2 md:mb-4">how_to_reg</span>}
          <h1 className={`text-white font-display font-black tracking-tight uppercase transition-all duration-500 ${activeArea ? 'text-2xl md:text-4xl mb-0' : 'text-3xl md:text-6xl mb-4 md:mb-6'}`}>
            Inscripciones <span className="text-primary">2026</span>
          </h1>
          
        </div>
      </section>

      {/* Main Wizard Area */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 -mt-12 relative z-20">
        {!activeArea ? (
          <div className="animate-fade-in-up">
            <h2 className="font-display text-3xl font-bold text-center mb-10 text-on-background">¿A qué área deseas ingresar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button 
                onClick={() => { setActiveArea("instituto"); setActiveCourse(null); }}
                className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all text-center group"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                  <span className="material-symbols-outlined text-4xl">language</span>
                </div>
                <h3 className="font-display font-black text-xl mb-2 text-on-background uppercase tracking-wider">Instituto</h3>
                <p className="text-sm text-on-background-muted">Idiomas e Informática Básica/Avanzada.</p>
              </button>

              <button 
                onClick={() => { setActiveArea("deportes"); setActiveCourse(null); }}
                className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all text-center group"
              >
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors text-orange-600">
                  <span className="material-symbols-outlined text-4xl">sports_basketball</span>
                </div>
                <h3 className="font-display font-black text-xl mb-2 text-on-background uppercase tracking-wider">Deportes</h3>
                <p className="text-sm text-on-background-muted">Equipos extracurriculares Crossover.</p>
              </button>

              <button 
                onClick={() => { setActiveArea("infotep"); setActiveCourse(null); }}
                className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all text-center group"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors text-green-600">
                  <span className="material-symbols-outlined text-4xl">engineering</span>
                </div>
                <h3 className="font-display font-black text-xl mb-2 text-on-background uppercase tracking-wider">INFOTEP</h3>
                <p className="text-sm text-on-background-muted">Cursos técnicos totalmente gratuitos.</p>
              </button>

              <button 
                onClick={() => { setActiveArea("colegio"); setActiveCourse(null); }}
                className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all text-center group"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <span className="material-symbols-outlined text-4xl">school</span>
                </div>
                <h3 className="font-display font-black text-xl mb-2 text-on-background uppercase tracking-wider">Colegio</h3>
                <p className="text-sm text-on-background-muted">Inicial, Primaria, Secundaria y Semi-Internado.</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {activeArea === "colegio" && renderColegio()}
            {activeArea === "instituto" && renderInstitutoCourses()}
            {activeArea === "deportes" && renderDeportesCourses()}
            {activeArea === "infotep" && renderInfotepCourses()}
          </div>
        )}
      </section>

    </main>
  );
}
