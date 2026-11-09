"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type CategoryId = "instituto" | "informatica" | "colegio" | "deportes" | "infotep";

interface CourseOption {
  id: string;
  name: string;
  badge?: string;
  ages?: string;
  duration?: string;
  isInfotep?: boolean;
  fechasImportantes?: {
    limite?: string;
    inicio?: string;
    induccion?: string;
  };
  prices?: {
    inscripcion?: string;
    mensualidad?: string;
    nota?: string;
  };
  beneficios?: string[];
  schedules: string[];
}

const CATEGORIES: {
  id: CategoryId;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  courses: CourseOption[];
}[] = [
  {
    id: "instituto",
    title: "Inglés",
    subtitle: "Niños, Adolescentes y Adultos",
    icon: "language",
    badge: "Más Solicitado",
    courses: [
      {
        id: "ing-kids-5-7",
        name: "Inglés Básico Niños (5 a 7 años)",
        ages: "Edad: 5 a 7 años",
        duration: "9 meses (3 meses cada nivel)",
        badge: "⭐ Inicio Próximo Mes",
        fechasImportantes: {
          limite: "Lunes 28 de Septiembre 2026",
          inicio: "1 o 3 de Octubre 2026",
          induccion: "8 o 10 de Octubre 2026",
        },
        prices: {
          inscripcion: "RD$ 2,000 (Oferta)",
          mensualidad: "RD$ 1,600 / mes",
          nota: "Material de apoyo requerido (Libro: RD$ 1,700)."
        },
        beneficios: [
          "Aprenderán jugando con dinámicas 100% naturales.",
          "Desarrollo de pronunciación nativa y vocabulario auditivo.",
          "Grupos pequeños para atención personalizada."
        ],
        schedules: [
          "Sábados: 8:30 AM - 12:00 PM",
        ],
      },
      {
        id: "ing-kids-7-12",
        name: "Inglés Niños (7 a 12 años)",
        ages: "Edad: 7 a 12 años",
        duration: "1 año y 6 meses (3 meses por nivel)",
        fechasImportantes: {
          limite: "Lunes 28 de Septiembre 2026",
          inicio: "1 o 3 de Octubre 2026",
          induccion: "8 o 10 de Octubre 2026",
        },
        prices: {
          inscripcion: "RD$ 2,000 (Oferta)",
          mensualidad: "RD$ 1,600 / mes",
          nota: "Material de apoyo requerido (Libro: RD$ 1,700)."
        },
        beneficios: [
          "Metodología 100% conversacional e interactiva.",
          "Juegos de rol y comprensión de diálogos reales.",
          "Base sólida para su educación escolar y futuro."
        ],
        schedules: [
          "Sábados: 8:30 AM - 12:00 PM",
          "Sábados: 1:00 PM - 4:00 PM",
          "Mar y Jue: 3:00 PM - 4:30 PM",
          "Mar y Jue: 4:30 PM - 6:00 PM",
        ],
      },
      {
        id: "ing-teens",
        name: "Inglés Adolescentes (13 a 17 años)",
        ages: "Edad: 13 a 17 años",
        duration: "1 año (3 meses por nivel)",
        prices: {
          inscripcion: "RD$ 2,000 (Oferta)",
          mensualidad: "RD$ 1,600 / mes",
          nota: "Material de apoyo requerido (Libro: RD$ 1,700)."
        },
        beneficios: [
          "Enfoque en debates y temas juveniles actuales.",
          "Fluidez auditiva y seguridad al hablar en público.",
          "Preparación para exámenes y oportunidades de empleo."
        ],
        schedules: [
          "Sábados: 8:30 AM - 12:00 PM",
          "Sábados: 1:00 PM - 4:00 PM",
          "Sábados: 4:00 PM - 7:00 PM",
          "Mar y Jue: 3:00 PM - 4:30 PM",
          "Mar y Jue: 4:30 PM - 6:00 PM",
        ],
      },
      {
        id: "ing-adultos",
        name: "Inglés Adultos (18+)",
        ages: "Edad: 18 años en adelante",
        duration: "1 año (3 meses por nivel)",
        prices: {
          inscripcion: "RD$ 2,000 (Oferta)",
          mensualidad: "RD$ 1,600 / mes",
          nota: "Material de apoyo requerido (Libro: RD$ 1,700)."
        },
        beneficios: [
          "Horarios nocturnos y sabatinos para trabajadores.",
          "Inglés práctico enfocado en Call Centers y negocios.",
          "Profesores con experiencia intensiva."
        ],
        schedules: [
          "Sábados: 1:00 PM - 4:00 PM",
          "Sábados: 4:00 PM - 7:00 PM",
          "Mar y Jue: 6:30 PM - 8:00 PM",
        ],
      },
    ],
  },
  {
    id: "informatica",
    title: "Informática",
    subtitle: "Ofimática, Excel y Redes",
    icon: "computer",
    badge: "Laboratorio Moderno",
    courses: [
      {
        id: "info-basica",
        name: "Informática de Oficina (Paquete Esencial)",
        ages: "Jóvenes y Adultos (13+)",
        duration: "3 meses (100% Práctico)",
        badge: "⭐ Alta Demanda Laboral",
        prices: {
          inscripcion: "RD$ 2,000",
          mensualidad: "RD$ 1,600 / mes",
        },
        beneficios: [
          "Manejo profesional de Word, Excel práctico, PowerPoint e Internet corporativo.",
          "Una computadora propia por estudiante en laboratorio climatizado.",
          "Certificado avalado ideal para insertar en tu currículum de trabajo."
        ],
        schedules: [
          "Sábados: 8:30 AM - 12:00 PM",
          "Sábados: 1:00 PM - 4:00 PM",
        ],
      },
      {
        id: "info-avanzada",
        name: "Excel Avanzado & Redes Empresariales",
        ages: "Jóvenes y Adultos (13+)",
        duration: "3 meses",
        badge: "Especialización",
        prices: {
          inscripcion: "RD$ 2,000",
          mensualidad: "RD$ 1,600 / mes",
          nota: "Requisito: Manejo básico de computadora."
        },
        beneficios: [
          "Fórmulas financieras, Tablas Dinámicas, gráficos y gestión de nóminas.",
          "Instalación de redes locales, configuración de impresoras y seguridad.",
          "Preparación directa para puestos administrativos y de contabilidad."
        ],
        schedules: [
          "Sábados: 8:30 AM - 12:00 PM",
          "Sábados: 1:00 PM - 4:00 PM",
        ],
      },
    ],
  },
  {
    id: "colegio",
    title: "Colegio",
    subtitle: "Inicial, Primaria y Secundaria",
    icon: "school",
    badge: "Admisiones 2026-2027",
    courses: [
      {
        id: "col-inicial",
        name: "Nivel Inicial & Preescolar",
        ages: "Párvulo, Pre-Kínder y Kínder (2 a 5 años)",
        duration: "Año Escolar Oficial",
        badge: "Cupos Limitados",
        beneficios: [
          "Aulas climatizadas, estimulación temprana y entorno de cuidado con amor.",
          "Base pedagógica en valores cristianos, disciplina y primeras palabras en inglés.",
          "Atención personalizada con maestras especializadas en primera infancia."
        ],
        schedules: ["Tanda Matutina: 7:45 AM - 12:30 PM"],
      },
      {
        id: "col-primaria",
        name: "Educación Primaria (1ro a 6to)",
        ages: "6 a 11 años",
        duration: "Año Escolar Oficial",
        beneficios: [
          "Excelencia académica integral, robótica educativa y programa intensivo de inglés.",
          "Deportes formativos en cancha techada y educación física estructurada.",
          "Gabinete de orientación psicológica y seguimiento cercano a cada familia."
        ],
        schedules: ["Tanda Matutina: 7:45 AM - 1:00 PM"],
      },
      {
        id: "col-secundaria",
        name: "Secundaria & Bachillerato (1ro a 6to)",
        ages: "12 a 17 años",
        duration: "Año Escolar Oficial",
        badge: "Pre-Universitario",
        beneficios: [
          "Preparación pre-universitaria de alto rendimiento avalada por MINERD.",
          "Laboratorios de ciencias y computación de punta con proyectos prácticos.",
          "Promociones con reconocimientos académicos en pruebas nacionales."
        ],
        schedules: ["Tanda Matutina: 7:45 AM - 1:45 PM"],
      },
    ],
  },
  {
    id: "deportes",
    title: "Deportes",
    subtitle: "Basketball, Volleyball, Fútbol y Karate",
    icon: "sports_soccer",
    badge: "Cancha Techada",
    courses: [
      {
        id: "dep-basketball",
        name: "Academia de Basketball (Baloncesto)",
        ages: "6 a 18 años (Grupos por edad)",
        duration: "Entrenamiento Continuo",
        prices: {
          inscripcion: "RD$ 1,500 (Incluye 1er mes de práctica)",
          mensualidad: "RD$ 1,000 / mes",
          nota: "Cancha techada con piso reglamentario y entrenadores federados."
        },
        beneficios: [
          "Desarrollo de fundamentos: drible, pase, tiro, defensa y táctica de juego.",
          "Fomenta la disciplina, el trabajo en equipo y aleja a los chicos de las pantallas.",
          "Participación en torneos inter-colegiales y clínicas especializadas."
        ],
        schedules: [
          "Jueves: 2:00 PM - 4:00 PM (6 a 12 años)",
          "Jueves: 4:00 PM - 6:00 PM (13 a 18 años)",
          "Sábados: 2:00 PM - 4:00 PM (6 a 12 años)",
          "Sábados: 4:00 PM - 6:00 PM (13 a 18 años)",
        ],
      },
      {
        id: "dep-volleyball",
        name: "Academia de Volleyball Femenino & Juvenil",
        ages: "Niñas y Jóvenes (7 a 18 años)",
        duration: "Entrenamiento Continuo",
        prices: {
          inscripcion: "RD$ 1,500 (Incluye 1er mes)",
          mensualidad: "RD$ 1,000 / mes",
        },
        beneficios: [
          "Técnica de saque, voleo, recepción y remate en cancha techada protegida del sol.",
          "Mejora notable de la agilidad, reflejos, resistencia física y compañerismo.",
          "Ambiente familiar, seguro y con supervisión constante."
        ],
        schedules: [
          "Martes: 4:00 PM - 6:00 PM",
          "Sábados: 8:00 AM - 10:00 AM",
        ],
      },
      {
        id: "dep-futbol",
        name: "Escuela Formativa de Fútbol",
        ages: "5 a 15 años",
        duration: "Entrenamiento Continuo",
        prices: {
          inscripcion: "RD$ 1,500 (Incluye 1er mes)",
          mensualidad: "RD$ 1,000 / mes",
        },
        beneficios: [
          "Coordinación motriz, control de balón, pases precisos y definición.",
          "Valores de deportivismo, respeto al compañero y superación personal.",
          "Entrenamientos dinámicos que garantizan condición física y diversión."
        ],
        schedules: [
          "Miércoles: 2:00 PM - 5:00 PM (5 a 9 años)",
          "Viernes: 2:00 PM - 5:00 PM (10 a 15 años)",
        ],
      },
      {
        id: "dep-karate",
        name: "Dojo de Karate & Artes Marciales",
        ages: "Niños, Jóvenes y Adultos",
        duration: "Entrenamiento Continuo",
        badge: "Disciplina & Defensa",
        prices: {
          inscripcion: "RD$ 1,500 (Incluye 1er mes)",
          mensualidad: "RD$ 1,000 / mes",
          nota: "Exámenes de grado de cinta con aval federativo."
        },
        beneficios: [
          "Autocontrol mental, respeto estricto, concentración escolar y defensa personal.",
          "Acondicionamiento físico completo, flexibilidad y coordinación neuromuscular.",
          "Instrucción por cinturones negros con amplia trayectoria docente."
        ],
        schedules: [
          "Martes: 2:00 PM - 4:00 PM",
          "Sábados: 8:30 AM - 12:00 PM",
          "Sábados: 4:00 PM - 6:00 PM",
        ],
      },
    ],
  },
  {
    id: "infotep",
    title: "Infotep",
    subtitle: "Cursos Técnicos 100% Becados",
    icon: "workspace_premium",
    badge: "100% Gratis / Becado",
    courses: [
      {
        id: "inf-cajero",
        name: "Cajero Bancario",
        ages: "16 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Operaciones de caja bancaria, cuadre diario y arqueo.",
          "Detección de billetes falsos y medidas de seguridad.",
          "Preparación para plazas en bancos y supermercados."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
      {
        id: "inf-farmacia",
        name: "Básico de Farmacia",
        ages: "16 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Lectura e interpretación de recetas médicas.",
          "Clasificación y dispensación de medicamentos.",
          "Alta demanda de empleo en cadenas de farmacias."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
      {
        id: "inf-contabilidad",
        name: "Básico de Contabilidad",
        ages: "16 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Registro contable, manejo de libros diarios y nómina.",
          "Preparación como auxiliar contable para empresas.",
          "Certificación oficial de validez nacional."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
      {
        id: "inf-fiscal",
        name: "Contabilidad Fiscal (DGII)",
        ages: "16 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Llenado de formularios de la DGII (ITBIS, IR-17, 606, 607).",
          "Retenciones impositivas corporativas.",
          "Especialidad de alta cotización en el mercado laboral."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
      {
        id: "inf-visita-medica",
        name: "Visita Médica",
        ages: "18 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Técnicas de promoción médica y farmacología básica.",
          "Abordaje profesional y relaciones con doctores.",
          "Inserción en una de las industrias comerciales mejor remuneradas."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
      {
        id: "inf-ventas",
        name: "Básico de Ventas",
        ages: "16 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Persuasión, manejo de objeciones y cierre de ventas.",
          "Atención al cliente y fidelización.",
          "Habilidades prácticas para comercio y call centers."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
      {
        id: "inf-inventario",
        name: "Manejo de Inventario y Almacén",
        ages: "16 años en adelante con Cédula",
        duration: "Capacitación Técnica Oficial",
        isInfotep: true,
        beneficios: [
          "Control de entradas y salidas de mercancía.",
          "Métodos de valuación PEPS y UEPS, prevención de mermas.",
          "Capacitación como encargado o auxiliar de almacén."
        ],
        schedules: [
          "Lunes a Viernes: 2:00 PM - 6:00 PM (Tarde)",
          "Lunes a Viernes: 6:00 PM - 10:00 PM (Noche)",
        ],
      },
    ],
  },
];

export default function MobileLinkHub() {
  const [view, setView] = useState<"categories" | "courses" | "detail" | "form">("categories");
  const [selectedCat, setSelectedCat] = useState<CategoryId | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");

  const [intentType, setIntentType] = useState<"inscribirme" | "pedir_info">("inscribirme");

  // Form states completos
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const activeCategoryData = CATEGORIES.find((c) => c.id === selectedCat);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mantener solo dígitos y limitar a 10 dígitos (809/829/849 + 7 dígitos)
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setTelefono(formatted);
  };

  const handleSelectCategory = (catId: CategoryId) => {
    setSelectedCat(catId);
    setSelectedCourse(null);
    setSelectedSchedule("");
    setView("courses");
  };

  const handleSelectCourse = (course: CourseOption) => {
    setSelectedCourse(course);
    setSelectedSchedule(course.schedules[0] || "");
    setView("detail");
  };

  const handleAction = (type: "inscribirme" | "pedir_info") => {
    setIntentType(type);
    setView("form");
  };

  const handleBack = () => {
    if (view === "form") {
      setView("detail");
    } else if (view === "detail") {
      setView("courses");
    } else if (view === "courses") {
      setView("categories");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return;

    setEnviando(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        email: email.trim() || null,
        area: activeCategoryData?.title || "",
        curso: selectedCourse?.name || "",
        horario: selectedSchedule || "",
        tipo: intentType,
        fecha: new Date().toISOString()
      };

      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Disparador interno:", err);
      }

      setExito(true);

    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-gray-900 flex flex-col items-center justify-start p-4 sm:p-6 selection:bg-[#990000] selection:text-white font-sans">
      
      {/* Contenedor central móvil */}
      <div className="w-full max-w-md mx-auto pt-2 pb-12 flex flex-col">
        
        {/* LOGO DESTACADO Y LIBRE */}
        <header className="text-center mb-5 flex flex-col items-center">
          <Link href="/" className="inline-block transition-transform active:scale-95 mb-2">
            <Image
              src="/rojo.png"
              alt="Crossover Logo"
              width={160}
              height={55}
              className="object-contain drop-shadow-xs"
              priority
            />
          </Link>

          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Centro Educativo Crossover
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#990000]/10 border border-[#990000]/20 text-[#990000] text-xs font-black uppercase tracking-wider mt-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#990000] animate-pulse"></span>
            Inscripciones Abiertas
          </div>
        </header>

        {/* Botón Volver sutil */}
        {view !== "categories" && !exito && (
          <button
            onClick={handleBack}
            className="self-start text-xs font-bold text-gray-600 hover:text-[#990000] flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver
          </button>
        )}

        {/* TARJETA PRINCIPAL BLANCA */}
        <main className="bg-white border border-gray-200/90 rounded-3xl p-5 shadow-lg relative">

          {/* ================= VISTA 1: LAS 5 ÁREAS DIRECTAS ================= */}
          {view === "categories" && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
                ¿Qué deseas estudiar?
              </p>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="w-full p-3.5 rounded-2xl bg-gray-50/70 hover:bg-red-50/60 border border-gray-200/80 hover:border-[#990000]/40 transition-all text-left flex items-center justify-between group active:scale-[0.98] shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#990000]/10 group-hover:bg-[#990000] flex items-center justify-center text-[#990000] group-hover:text-white transition-all shrink-0">
                      <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-gray-900 group-hover:text-[#990000] transition-colors">
                          {cat.title}
                        </h3>
                        {cat.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#990000] text-white">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{cat.subtitle}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#990000] group-hover:translate-x-1 transition-all">
                    chevron_right
                  </span>
                </button>
              ))}

              {/* Botón directo a Recepción */}
              <div className="pt-3 border-t border-gray-100 mt-3">
                <a
                  href="https://wa.me/18099220880?text=Hola%20Crossover,%20tengo%20una%20pregunta%20general%20sobre%20los%20programas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-base text-emerald-600">chat</span>
                  ¿Dudas? Hablar directo con Recepción
                </a>
              </div>
            </div>
          )}

          {/* ================= VISTA 2: LISTA DE CURSOS ================= */}
          {view === "courses" && activeCategoryData && (
            <div className="space-y-2.5">
              <div className="mb-3 pb-2 border-b border-gray-100">
                <span className="text-[11px] uppercase font-black tracking-widest text-[#990000] block mb-1">
                  {activeCategoryData.title}
                </span>
                <p className="text-xs font-semibold text-gray-600">
                  Selecciona la opción para ver detalles y precios:
                </p>
              </div>

              {activeCategoryData.courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className="w-full p-3.5 rounded-2xl bg-gray-50 hover:bg-red-50/60 border border-gray-200 hover:border-[#990000]/40 transition-all text-left flex items-center justify-between group active:scale-[0.98] shadow-xs"
                >
                  <div>
                    {course.badge && (
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-[#990000] text-white px-2 py-0.5 rounded-md mb-1 shadow-xs">
                        {course.badge}
                      </span>
                    )}
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-[#990000] transition-colors">
                      {course.name}
                    </h4>
                    {course.ages && (
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{course.ages}</p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#990000] group-hover:translate-x-1 transition-all">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ================= VISTA 3: FICHA DE DETALLES Y PRECIOS ================= */}
          {view === "detail" && selectedCourse && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                {selectedCourse.badge && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-[#990000] text-white px-2 py-0.5 rounded-md mb-1.5 shadow-xs">
                    {selectedCourse.badge}
                  </span>
                )}
                <h3 className="text-lg font-black text-gray-950 leading-tight">
                  {selectedCourse.name}
                </h3>
                {selectedCourse.duration && (
                  <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#990000]">timelapse</span>
                    Duración: {selectedCourse.duration}
                  </p>
                )}
              </div>

              {/* CAJA DE FECHAS EN 2 COLUMNAS (MODERNO, COMPACTO Y SIN TEXTO PESADO) */}
              {selectedCourse.fechasImportantes && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedCourse.fechasImportantes.limite && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-2.5 flex flex-col justify-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">timer</span>
                        Cierre Cupos
                      </span>
                      <span className="text-xs font-black text-gray-900 mt-0.5">
                        {selectedCourse.fechasImportantes.limite}
                      </span>
                    </div>
                  )}
                  {selectedCourse.fechasImportantes.inicio && (
                    <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-2.5 flex flex-col justify-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">rocket_launch</span>
                        Inicio Clases
                      </span>
                      <span className="text-xs font-black text-gray-900 mt-0.5">
                        {selectedCourse.fechasImportantes.inicio}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* DISTINCIÓN PSICOLÓGICA: CURSO REGULAR VS INFOTEP BECADO */}
              {selectedCourse.isInfotep ? (
                <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                      100% Becado
                    </span>
                    <span className="text-xs font-bold text-emerald-950">
                      Capacitación Técnica Gratuita
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    Programa financiado y avalado oficialmente en convenio con <strong className="text-emerald-900 font-bold">INFOTEP</strong>. No pagas costo de inscripción ni cuotas mensuales.
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                    <span className="material-symbols-outlined text-sm text-emerald-700">verified</span>
                    <span>Requisitos: Cédula de identidad y récord de notas</span>
                  </div>
                </div>
              ) : selectedCourse.prices && (
                <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#990000] block">
                    Inversión del Programa
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Inscripción:</span>
                    <span className="text-sm font-black text-[#990000]">{selectedCourse.prices.inscripcion}</span>
                  </div>
                  {selectedCourse.prices.mensualidad && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Mensualidad:</span>
                      <span className="text-sm font-black text-gray-900">{selectedCourse.prices.mensualidad}</span>
                    </div>
                  )}
                  {selectedCourse.prices.nota && (
                    <p className="text-[10px] text-gray-500 pt-1 border-t border-red-100">
                      * {selectedCourse.prices.nota}
                    </p>
                  )}
                </div>
              )}

              {/* Beneficios Clave */}
              {selectedCourse.beneficios && selectedCourse.beneficios.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 block">
                    ¿Qué incluye este programa?
                  </span>
                  <ul className="space-y-1.5">
                    {selectedCourse.beneficios.map((b, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-[#990000] shrink-0 mt-0.5">check_circle</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECCIÓN ESPECIAL COLEGIO VS CURSOS REGULARES */}
              {selectedCat === "colegio" ? (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-700 text-lg mt-0.5 shrink-0">meeting_room</span>
                    <div className="text-xs text-gray-700">
                      <p className="font-bold text-gray-900">Admisiones y Conoce el Plantel</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Te contactaremos para coordinar una visita guiada y explicarte los requisitos de nuevo ingreso.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAction("inscribirme")}
                    className="w-full py-4 px-4 rounded-2xl bg-[#990000] hover:bg-[#800000] text-white font-black text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">event_available</span>
                    <span>Solicitar Admisión / Visita</span>
                  </button>

                  <Link
                    href="/colegio"
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-gray-500">open_in_new</span>
                    <span>Ver Propuesta Educativa e Instalaciones</span>
                  </Link>
                </div>
              ) : (
                <>
                  {/* MENÚ DESPLEGABLE ELEGANTE PARA HORARIOS */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-700 block">
                      Selecciona un Horario:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSchedule}
                        onChange={(e) => setSelectedSchedule(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white transition-all appearance-none shadow-xs pr-10 cursor-pointer"
                      >
                        {selectedCourse.schedules.map((s, idx) => (
                          <option key={idx} value={s} className="py-1">
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xl">
                        arrow_drop_down
                      </span>
                    </div>
                  </div>

                  {/* BOTÓN DIRECTO "INSCRIBIRME AHORA" */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleAction("inscribirme")}
                      className="w-full py-4 px-4 rounded-2xl bg-[#990000] hover:bg-[#800000] text-white font-black text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">how_to_reg</span>
                      <span>Inscribirme Ahora</span>
                    </button>

                    <button
                      onClick={() => handleAction("pedir_info")}
                      className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg text-emerald-600">chat</span>
                      <span>Solo tengo dudas / Pedir información</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= VISTA 4: FORMULARIO COMPLETO Y SERIO ================= */}
          {view === "form" && selectedCourse && (
            <div>
              {!exito ? (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="bg-[#990000]/10 border border-[#990000]/20 rounded-2xl p-3.5 mb-2">
                    <span className="text-[10px] font-black text-[#990000] uppercase tracking-wider block">
                      {selectedCat === "colegio"
                        ? "Solicitud de Admisiones & Visita"
                        : intentType === "inscribirme"
                        ? "Completar Pre-Inscripción"
                        : "Solicitud de Información"}
                    </span>
                    <p className="text-sm font-black text-gray-900 leading-tight mt-0.5">
                      {selectedCourse.name}
                    </p>
                    {selectedCat !== "colegio" && selectedSchedule && (
                      <p className="text-xs text-gray-700 font-medium mt-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#990000]">schedule</span>
                        {selectedSchedule}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Juan"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#990000] focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        required
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        placeholder="Ej. Pérez"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#990000] focus:bg-white transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={handlePhoneChange}
                      placeholder="809-000-0000"
                      maxLength={12}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#990000] focus:bg-white transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Correo Electrónico <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#990000] focus:bg-white transition-all shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full py-4 px-6 rounded-2xl bg-[#990000] hover:bg-[#800000] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#990000]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {enviando ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">send</span>
                        <span>
                          {intentType === "inscribirme" ? "Completar Pre-Inscripción" : "Enviar Solicitud"}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    🔒 Recibirás la confirmación oficial y los pasos a seguir directamente a tu contacto.
                  </p>
                </form>
              ) : (
                <div className="py-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  {/* ÍCONO CHECK ANIMADO */}
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <span className="material-symbols-outlined text-3xl font-black">check</span>
                  </div>

                  {/* TÍTULO Y SUBTÍTULO */}
                  <div className="text-center space-y-1">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                      {selectedCat === "colegio" ? "Cita de Admisión Registrada" : "Pre-Inscripción Confirmada"}
                    </span>
                    <h3 className="text-xl font-black text-gray-950">
                      ¡Todo Listo, {nombre.trim() || "Estudiante"}!
                    </h3>
                    <p className="text-xs text-gray-600 max-w-xs mx-auto">
                      Tu solicitud ha sido ingresada en nuestro sistema con éxito.
                    </p>
                  </div>

                  {/* TARJETA RESUMEN DE SU REGISTRO (TRANQUILIDAD PSICOLÓGICA) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                      Resumen de tu Solicitud
                    </span>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-gray-500 font-medium">Programa:</span>
                        <span className="font-bold text-gray-900 text-right">{selectedCourse.name}</span>
                      </div>

                      {selectedCat !== "colegio" && selectedSchedule && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-gray-500 font-medium">Horario:</span>
                          <span className="font-bold text-[#990000] text-right">{selectedSchedule}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/70">
                        <span className="text-gray-500 font-medium">Teléfono de contacto:</span>
                        <span className="font-black text-gray-900">{telefono}</span>
                      </div>

                      {email && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-500 font-medium">Correo electrónico:</span>
                          <span className="font-medium text-gray-700">{email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MENSAJE DE PASOS A SEGUIR (NEUTRAL PARA WHATSAPP Y EMAIL) */}
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-left">
                    <span className="material-symbols-outlined text-blue-600 text-lg shrink-0 mt-0.5">info</span>
                    <p className="text-xs text-blue-950 font-medium leading-relaxed">
                      {selectedCat === "colegio"
                        ? "Nuestro departamento de admisiones se comunicará a tus datos de contacto para coordinar la fecha de tu visita al campus escolar."
                        : "Un asesor académico te enviará a tus datos de contacto los pasos para formalizar tu cupo e información de inicio."}
                    </p>
                  </div>

                  {/* BOTÓN LIMPIO INSTITUCIONAL DE RETORNO */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setExito(false);
                        setView("categories");
                        setSelectedCourse(null);
                        setNombre("");
                        setApellidos("");
                        setTelefono("");
                        setEmail("");
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      Volver al Inicio
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* Enlaces Rápidos a la Web */}
        <footer className="mt-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500">
            <Link href="/" className="hover:text-[#990000] transition-colors">
              Página Web
            </Link>
            <span>•</span>
            <Link href="/noticias" className="hover:text-[#990000] transition-colors">
              Noticias
            </Link>
            <span>•</span>
            <Link href="/contacto" className="hover:text-[#990000] transition-colors">
              Contacto
            </Link>
          </div>
          <p className="text-[11px] text-gray-400">
            Av. Las Palmas #58, Herrera • Tel: 809-922-0880
          </p>
        </footer>

      </div>
    </div>
  );
}
