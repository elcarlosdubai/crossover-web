"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Datos para el Slider del Hero
const heroSlides = [
  {
    tag: "Colegio e Instituto de Élite",
    title: "EDUCACIÓN",
    subtitle: "DEL MAÑANA.",
    description: "Formamos la próxima generación de líderes íntegros en un ecosistema de alto rendimiento académico y tecnológico.",
    bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDY8zTgaXvxBi8uts6nUC4ZVfCEDZ0gQALy2vAM2KXtT90VcK3fckz9T8i-LNB8lccn5c702h6UmixM1f4Ksltc6LVdr3jpqzt6sHXeJDdRf1-l9K32hZpl1cidMuOq-0q4ZbLwwTaN6M6F7cMTPAWe0f3cCiuhk1vgOTCvI6aWgpYSnli8Nrer1Khj3HM6hu7leqkP7_DBohdGDvYTT45JkmzsewvTrryRhSBxREh9tes9FuCQthvRAmo0blS6-iyv9aCndwEPSfc"
  },
  {
    tag: "Educación Inicial y Primaria",
    title: "DESCUBRE",
    subtitle: "SU POTENCIAL.",
    description: "Fomentamos la curiosidad y la alegría por aprender desde los primeros años en un ambiente seguro e inspirador.",
    bg: "/ninos_slider.jpg"
  },
  {
    tag: "Metodología Innovadora",
    title: "LÍDERES EN",
    subtitle: "FORMACIÓN.",
    description: "Desarrollamos el potencial humano a través del aprendizaje activo, valores sólidos y disciplina deportiva.",
    bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuATHycRDkpQ2DaEMQjRKZvk8pZDwGmj3w7IuHGHi2yNrFznn8BigC8WW5zb4GtXF3KgiT59Niv0LHvQnIWZufbjA7H9B1BgwA_U7sKDfgqzOXJ1W4NzKRZdWfgn-nUGybRZ4HSZ1wUzOFvvqUnFdyQUBTJ5LTB543yvqOZYlXUhf4AkKn1Ls4_GPQds2KsMDowJYXaaROyFAneom7H6huf1ksKvcJsgPeDuzBpkyi8gANmHniW9WWNpEZ7oAqINxy3IgGjoO_44xQk"
  },
  {
    tag: "Especialización Técnica",
    title: "VANGUARDIA",
    subtitle: "TÉCNICA.",
    description: "Única institución que combina el bachillerato tradicional con certificaciones tecnológicas de clase mundial.",
    bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuCI-BOQ_aRhhlaJZeVfEK6Q8WgDW-U-OocC1nOJ67-ihWBM0-LjCrKh71P5RjDCdfT_aNCi5sp-io6yXc_FcZSp1aQPucWhiw_YKQV028JJmOcPiK9HvFbFojomLFVXjVnJ3Ehm1NuoZ2gFDLbmnT2XHmCHeMZ5yfbF1PYZq54pkBpu04-Ewuuc_un3VCQ95OgQZw79M9wXz8giUpi-0CmlL3LLSadbE98tgysRxylHbywPTBVUmM_xIrgcP6b6wFq-g7mxwFnkjSY"
  }
];

// Datos Simulados para Instagram
const igPosts = [
  { id: 1, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDY8zTgaXvxBi8uts6nUC4ZVfCEDZ0gQALy2vAM2KXtT90VcK3fckz9T8i-LNB8lccn5c702h6UmixM1f4Ksltc6LVdr3jpqzt6sHXeJDdRf1-l9K32hZpl1cidMuOq-0q4ZbLwwTaN6M6F7cMTPAWe0f3cCiuhk1vgOTCvI6aWgpYSnli8Nrer1Khj3HM6hu7leqkP7_DBohdGDvYTT45JkmzsewvTrryRhSBxREh9tes9FuCQthvRAmo0blS6-iyv9aCndwEPSfc", likes: "1.2k", comments: "45" },
  { id: 2, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwBV0G-BQvbf570qjtCjPUwgUwUKGIk4bDihQP0QVy8VJa1jfiJjzyT7Q6o3bT9QiPEiQfK7IogoWpagX8Ou4weBd4i-_SOQXf1E7c4X6MEWtIEkc3Oss-nSNcYjcs_KBXh7tybrcOF4mW-f4ZhpnaRgGF2KUA30qgh6sDgm86OVyTzYKVzcjJBZ8ZaZx2eWBOurt0KNyFaCsEMOWUYGnUi5YU_AshMptlBiMHFN0Bni251e6NI-2NOvi0rL_XGV5c_rGu3Sfz-IY", likes: "856", comments: "12" },
  { id: 3, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuATHycRDkpQ2DaEMQjRKZvk8pZDwGmj3w7IuHGHi2yNrFznn8BigC8WW5zb4GtXF3KgiT59Niv0LHvQnIWZufbjA7H9B1BgwA_U7sKDfgqzOXJ1W4NzKRZdWfgn-nUGybRZ4HSZ1wUzOFvvqUnFdyQUBTJ5LTB543yvqOZYlXUhf4AkKn1Ls4_GPQds2KsMDowJYXaaROyFAneom7H6huf1ksKvcJsgPeDuzBpkyi8gANmHniW9WWNpEZ7oAqINxy3IgGjoO_44xQk", likes: "2.1k", comments: "89" },
  { id: 4, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlC4GrldPv4jwVeGoFzfBxBkOeHtTDxez_Oz1sMlQ5lfHdG7fyg_g4xrLt8hcvgjS0fQgwxXb_4xapzw2f3pAUYmxueypiD7ehH1Jpro18L2qygfAVIr3fHhbEeXf2qSr2h45V2j6f2HIdJTudrRbM20IYu_CuYwA26DwfaGB8dmT7b35OuLX2Cx0B8KhbQvtdce9hFcFMXkO5b2SFJxfXjt5XL5oLMiFg7VmABewS-wYeaTVLKvHVnuxyiKGNyjjOnsHZu2BDqeE", likes: "945", comments: "23" },
  { id: 5, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5B6CpcV2aNLUYJBLEVvCEPbdhsr2DmsuurbwqvLcwiIMdzJVTf7SWL0K6h43UNNu0xl54JMBSQCUPryqy_8g8F7LrhNW7yu0wSTiSuYZrjtlWzm2t0PjmPvFl43L2xwhaEyEVqIYewpmWKwi4hECjYIQHXpzKkCjb3wKDsCw_bJP0SzC6LuXrhyMWsbHeuoQ_Ix11SaP1v5RD1o-jOJjHauU3omWhwSkvK1g33AjouT86WRUKsdX00aWk14k0xB9wJrGKWk6OTps", likes: "1.5k", comments: "56" },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Auto-play del Hero Slider
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 5000); // Cambia cada 5 segundos

    // Intersection Observer para fade-in
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(section => {
      section.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-10');
      observer.observe(section);
    });

    return () => clearInterval(slideInterval);
  }, []);

  return (
    <main className="bg-background min-h-screen selection:bg-primary selection:text-white">
      

      {/* Hero Section (Slider) */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 overflow-hidden bg-background">
        {/* Background Images Layer */}
        {heroSlides.map((slide, index) => (
          <div 
            key={`bg-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${slide.bg}')` }}></div>
            {/* Soft white gradient overlay to ensure text readability in light theme */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40"></div>
          </div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col justify-center min-h-[60vh]">
          {heroSlides.map((slide, index) => (
            <div 
              key={index} 
              className={`absolute top-1/2 -translate-y-1/2 left-6 md:left-12 max-w-5xl transition-all duration-1000 ease-in-out ${
                currentSlide === index ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-px bg-primary"></div>
                <span className="text-primary font-body text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">
                  {slide.tag}
                </span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black leading-[0.9] tracking-tighter text-on-background mb-6 sm:mb-8 transition-transform duration-700">
                {slide.title}<br />
                <span className="text-primary">{slide.subtitle}</span>
              </h1>
              <p className="font-body text-lg sm:text-xl md:text-2xl text-on-background-muted max-w-2xl font-light leading-relaxed mb-8 sm:mb-12">
                {slide.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                <button className="bg-primary text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-body text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_15px_30px_-10px_rgba(204,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(204,0,0,0.4)] text-center">
                  Solicitar Admisión
                </button>
                <button className="bg-surface text-on-background border border-black/5 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-body text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-black/5 text-center">
                  Ver Programas
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-6 md:left-12 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button 
              key={index} 
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${currentSlide === index ? "w-12 bg-primary" : "w-4 bg-black/10 hover:bg-black/30"}`}
              aria-label={`Ir al slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Infinite Marquee Stats */}
      <div className="w-full bg-primary py-4 overflow-hidden flex items-center border-y border-primary/10 relative z-20">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8 sm:gap-16">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 sm:gap-16 font-display text-lg sm:text-2xl font-black uppercase tracking-widest text-white">
              <span>+10 Años Formando Líderes</span>
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>100% Excelencia Académica</span>
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>+5,000 Egresados</span>
              <span className="w-2 h-2 bg-white rounded-full"></span>
            </div>
          ))}
        </div>
      </div>

      {/* Bento Grid Academic Offer */}
      <section className="py-20 sm:py-32 bg-blue-50/40 relative z-10 border-b border-black/5 overflow-hidden">
        <div className="absolute top-1/2 -right-32 w-[40rem] h-[40rem] bg-yellow-300/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="mb-12 sm:mb-20 animate-on-scroll text-center md:text-left">
            <h2 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-on-background tracking-tighter mb-4 sm:mb-6">
              NUESTRA <span className="text-primary">OFERTA.</span>
            </h2>
            <p className="text-on-background-muted text-lg sm:text-xl max-w-2xl font-light">
              Programas diseñados para el desarrollo integral desde la infancia hasta la profesionalización técnica e industrial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 sm:gap-6 h-auto md:h-[700px]">
            {/* Nivel Secundario */}
            <div className="bento-card md:col-span-2 md:row-span-1 group animate-on-scroll h-80 md:h-auto">
              <div className="absolute inset-0 bg-cover bg-center opacity-[0.85] group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" style={{ backgroundImage: "url('/secundaria.jpg')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <span className="text-primary font-body text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 bg-white/90 w-fit px-3 py-1 rounded-full">Colegio</span>
                <h3 className="font-display text-2xl sm:text-4xl text-white font-bold mb-2 drop-shadow-lg">Nivel Secundario</h3>
                <p className="text-white/90 text-sm max-w-md drop-shadow-md font-medium">Formación pre-universitaria enfocada en excelencia, liderazgo y tecnología.</p>
              </div>
            </div>

            {/* Nivel Primario */}
            <div className="bento-card md:col-span-1 md:row-span-1 group animate-on-scroll h-80 md:h-auto">
              <div className="absolute inset-0 bg-cover bg-center opacity-[0.85] group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" style={{ backgroundImage: "url('/Primaria.jpg')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <span className="text-primary font-body text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 bg-white/90 w-fit px-3 py-1 rounded-full">Colegio</span>
                <h3 className="font-display text-2xl text-white font-bold drop-shadow-lg">Nivel Primario</h3>
              </div>
            </div>

            {/* Nivel Inicial */}
            <div className="bento-card md:col-span-1 md:row-span-1 group animate-on-scroll h-80 md:h-auto">
              <div className="absolute inset-0 bg-cover bg-center opacity-[0.85] group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" style={{ backgroundImage: "url('/cielo.jpg')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <span className="text-primary font-body text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 bg-white/90 w-fit px-3 py-1 rounded-full">Colegio</span>
                <h3 className="font-display text-2xl text-white font-bold drop-shadow-lg">Nivel Inicial</h3>
              </div>
            </div>

            {/* Deportes */}
            <div className="bento-card md:col-span-1 md:row-span-1 group animate-on-scroll h-80 md:h-auto bg-black overflow-hidden relative">
              <div className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" style={{ backgroundImage: "url('/inicial.jpg')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20"></div>
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <span className="text-primary font-body text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 bg-white/90 w-fit px-3 py-1 rounded-full">Desarrollo Físico</span>
                <h3 className="font-display text-2xl text-white font-bold mb-1 drop-shadow-lg">Academia de Deportes</h3>
                <p className="text-white/90 text-xs font-medium leading-relaxed">Disciplina, salud física y trabajo en equipo.</p>
              </div>
            </div>

            {/* Infotep */}
            <div className="bento-card md:col-span-1 md:row-span-1 group animate-on-scroll h-80 md:h-auto bg-[#002244] overflow-hidden relative">
              <div className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" style={{ backgroundImage: "url('/2.jpg')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#00152e] via-[#002244]/80 to-[#002244]/40"></div>
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end relative z-10">
                <span className="text-[#004e9a] font-body text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 bg-white w-fit px-3 py-1 rounded-full">Técnico</span>
                <h3 className="font-display text-2xl text-white font-bold mb-1 drop-shadow-lg">Cursos de INFOTEP</h3>
                <p className="text-white/90 text-xs font-medium leading-relaxed">Amplia oferta de cursos técnicos avalados para tu desarrollo profesional.</p>
              </div>
            </div>

            {/* Instituto */}
            <div className="bento-card md:col-span-2 md:row-span-1 group animate-on-scroll h-80 md:h-auto bg-blue-950 overflow-hidden relative">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700" style={{ backgroundImage: "url('/kikito.jpg')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/80 to-blue-950/30"></div>
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end relative z-10">
                <span className="text-blue-900 font-body text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 bg-white w-fit px-3 py-1 rounded-full">Instituto Técnico</span>
                <h3 className="font-display text-2xl sm:text-4xl text-white font-bold mb-2 drop-shadow-lg">Idiomas & Tecnología</h3>
                <p className="text-white/80 text-sm max-w-md drop-shadow-md font-medium leading-relaxed">Inglés, Cómputos, Contabilidad y más para jóvenes y adultos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-20 sm:py-32 bg-background relative overflow-hidden border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 sm:mb-16 gap-6 animate-on-scroll">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">photo_camera</span>
                </div>
                <span className="text-primary font-body text-sm font-bold uppercase tracking-[0.2em]">Comunidad</span>
              </div>
              <h2 className="font-display text-4xl sm:text-6xl font-bold text-on-background tracking-tighter">
                SÍGUENOS EN <span className="text-primary">IG.</span>
              </h2>
            </div>
            <a href="#" className="font-body text-sm sm:text-base font-bold uppercase tracking-widest text-on-background hover:text-primary transition-colors flex items-center gap-2">
              @crossover.rd <span className="material-symbols-outlined">arrow_outward</span>
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 sm:gap-6 animate-on-scroll">
            {igPosts.map((post, index) => (
              <a 
                href="#" 
                key={post.id} 
                className={`relative rounded-[2rem] overflow-hidden group bg-surface border border-black/5 shadow-sm ${
                  index === 0 
                    ? "col-span-2 row-span-2 aspect-[3/4] lg:aspect-auto" 
                    : "col-span-1 row-span-1 aspect-square"
                }`}
              >
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${post.img}')` }}></div>
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white font-body font-bold">
                    <span className="material-symbols-outlined text-white">favorite</span> {post.likes}
                  </div>
                  <div className="flex items-center gap-2 text-white font-body font-bold">
                    <span className="material-symbols-outlined text-white">chat_bubble</span> {post.comments}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Legacy / Modern Approach Split */}
      <section className="py-20 sm:py-32 bg-surface relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
          <div className="lg:w-1/2 animate-on-scroll">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-on-background mb-6 sm:mb-8">
              UN LEGADO QUE <br/>
              <span className="text-primary">DESAFÍA EL ESTATUS QUO.</span>
            </h2>
            <p className="font-body text-base sm:text-lg text-on-background-muted mb-6 leading-relaxed">
              Nuestra metodología permite a los alumnos desarrollar habilidades de liderazgo, resiliencia y un profundo dominio tecnológico, preparándolos para un mundo que aún no existe.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-8 sm:mt-12 w-full">
              <div className="flex items-center gap-4 bg-background px-6 py-4 rounded-full border border-black/5 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">public</span>
                </div>
                <span className="font-body text-xs sm:text-sm font-bold uppercase tracking-widest text-on-background">Validez Global</span>
              </div>
              <div className="flex items-center gap-4 bg-background px-6 py-4 rounded-full border border-black/5 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <span className="font-body text-xs sm:text-sm font-bold uppercase tracking-widest text-on-background">Alto Rendimiento</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative animate-on-scroll mt-10 lg:mt-0 w-full">
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden glass-panel-light relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
               <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/cielo.jpg')" }}></div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 glass-panel-light p-6 sm:p-8 rounded-[2rem] shadow-xl border border-black/5">
               <p className="text-primary font-display text-4xl sm:text-5xl font-black">2001</p>
               <p className="text-on-background-muted font-body text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-2">Año de Fundación</p>
            </div>
          </div>
        </div>
      </section>

      
    </main>
  );
}
