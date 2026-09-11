"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPublicSlides } from '@/app/actions/portada';




interface SlideData {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  bg: string;
  btnText?: string;
  btnLink?: string;
  btn2Text?: string;
  btn2Link?: string;
}

function optimizeImageUrl(url: string) {
  if (url && url.includes('res.cloudinary.com') && !url.includes('q_auto')) {
    return url.replace('/image/upload/', '/image/upload/q_auto,f_auto,w_1920,c_limit/');
  }
  return url;
}

// Datos para el Slider del Hero
const heroSlides: SlideData[] = [
  {
    tag: "Colegio e Instituto de Élite",
    title: "EDUCACIÓN",
    subtitle: "DEL MAÑANA.",
    description: "Formamos la próxima generación de líderes íntegros en un ecosistema de alto rendimiento académico y tecnológico.",
    bg: "/1crossover.jpg"
  },
  {
    tag: "Educación Inicial y Primaria",
    title: "DESCUBRE",
    subtitle: "SU POTENCIAL.",
    description: "Fomentamos la curiosidad y la alegría por aprender desde los primeros años en un ambiente seguro e inspirador.",
    bg: "/3crossover.jpg"
  },
  {
    tag: "Metodología Innovadora",
    title: "LÍDERES EN",
    subtitle: "FORMACIÓN.",
    description: "Desarrollamos el potencial humano a través del aprendizaje activo, valores sólidos y disciplina deportiva.",
    bg: "/2crossover.jpg"
  },
  {
    tag: "Especialización Técnica",
    title: "INNOVACIÓN",
    subtitle: "Y FUTURO.",
    description: "Integramos el bachillerato tradicional con certificaciones tecnológicas de clase mundial para formar a los profesionales del mañana.",
    bg: "/secundaria.jpg"
  }
];

// Datos Simulados para Instagram
const mockIgPosts = [
  { id: 1, img: "/1crossover.jpg", likes: "1.2k", comments: "45", permalink: "#" },
  { id: 2, img: "/2crossover.jpg", likes: "856", comments: "12", permalink: "#" },
  { id: 3, img: "/3crossover.jpg", likes: "2.1k", comments: "89", permalink: "#" },
  { id: 4, img: "/secundaria.jpg", likes: "945", comments: "23", permalink: "#" },
  { id: 5, img: "/1crossover.jpg", likes: "1.5k", comments: "56", permalink: "#" },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [igPosts, setIgPosts] = useState(mockIgPosts);
  const [slides, setSlides] = useState<SlideData[]>(heroSlides);

  useEffect(() => {
    async function loadSlides() {
      const publicSlides = await getPublicSlides();
      if (publicSlides && publicSlides.length > 0) {
        setSlides(publicSlides);
      }
    }
    loadSlides();
  }, []);


  // Autoplay para el Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // RESTAURADO: API de Instagram del usuario
  useEffect(() => {
    fetch('/api/instagram')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.slice(0, 5).map((item: any) => ({
            id: item.id,
            img: item.media_type === 'VIDEO' ? (item.thumbnail_url || item.media_url) : item.media_url,
            likes: "Ig",
            comments: "Ver",
            permalink: item.permalink
          }));
          setIgPosts(formatted);
        }
      })
      .catch(err => console.error("Error loading IG posts:", err));
  }, []);



  // Intersection Observer para animaciones en scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="bg-background min-h-screen selection:bg-primary selection:text-white">
      

      {/* Hero Section (Slider) */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 overflow-hidden bg-background">
        {/* Background Images Layer */}
        {slides.map((slide, index) => (
          <div 
            key={`bg-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${optimizeImageUrl(slide.bg)}')` }}></div>
            {/* Soft white gradient overlay to ensure text readability in light theme */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40"></div>
          </div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col justify-center min-h-[60vh]">
          {slides.map((slide, index) => (
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
              <h1 className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-[6rem] xl:text-[7rem] font-black leading-[1.1] leading-[0.9] tracking-tighter text-on-background mb-6 sm:mb-8 transition-transform duration-700">
                {slide.title}<br />
                <span className="text-primary">{slide.subtitle}</span>
              </h1>
              <p className="font-body text-lg sm:text-xl md:text-2xl text-on-background-muted max-w-2xl font-light leading-relaxed mb-8 sm:mb-12">
                {slide.description}
              </p>
              
                                          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                {slide.btnText && (
                  <Link href={slide.btnLink || "#"} className="bg-primary text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-body text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_15px_30px_-10px_rgba(204,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(204,0,0,0.4)] text-center">
                    {slide.btnText}
                  </Link>
                )}
                {slide.btn2Text && (
                  <Link href={slide.btn2Link || "#"} className="bg-surface text-on-background border border-black/5 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-body text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-black/5 text-center">
                    {slide.btn2Text}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-6 md:left-12 flex gap-3 z-20">
          {slides.map((_, index) => (
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
      <section id="oferta" className="py-20 sm:py-32 bg-blue-50/40 relative z-10 border-b border-black/5 overflow-hidden">
        <div className="absolute top-1/2 -right-32 w-[40rem] h-[40rem] bg-yellow-300/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="mb-12 sm:mb-20 animate-on-scroll text-center md:text-left">
            <h2 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-on-background tracking-tighter mb-4 sm:mb-6">
              NUESTRA <span className="text-primary">OFERTA.</span>
            </h2>
            <p className="text-on-background-muted text-lg sm:text-xl max-w-2xl font-light">
              Programas diseñados para el desarrollo integral de tus hijos, acompañándolos desde la niñez hasta que se gradúan como técnicos profesionales listos para el mercado laboral.
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
              <div className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" style={{ backgroundImage: "url('/2crossover.jpg')" }}></div>
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
            <a href="https://www.instagram.com/centroeducativocrossover" target="_blank" rel="noopener noreferrer" className="font-body text-sm sm:text-base font-bold uppercase tracking-widest text-on-background hover:text-primary transition-colors flex items-center gap-2">
              @crossover.rd <span className="material-symbols-outlined">arrow_outward</span>
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 sm:gap-6 animate-on-scroll">
            {igPosts.map((post, index) => (
              <a 
                href={post.permalink || "#"} 
                target="_blank"
                rel="noopener noreferrer"
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
