"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileOfertaOpen, setIsMobileOfertaOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel-light border-b border-black/5 transition-all duration-300">
      <div className="flex justify-between items-center w-full px-6 md:px-12 py-4 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link href="/">
            <Image src="/rojo.png" alt="Crossover Logo" width={180} height={60} className="object-contain" priority />
          </Link>
        </div>
        
        {/* Menú Desktop (Alineado a la derecha) */}
        <div className="hidden md:flex flex-1 justify-end gap-8 items-center pr-8">
          <Link className="font-body text-sm text-on-background-muted font-bold tracking-widest uppercase hover:text-primary transition-colors" href="/nosotros">Crossover</Link>
          
          {/* Oferta Académica Dropdown Desktop */}
          <div className="relative group">
            <Link className="font-body text-sm text-on-background-muted font-bold tracking-widest uppercase hover:text-primary transition-colors flex items-center gap-1 py-4 -my-4" href="/#oferta">
              Oferta Académica
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </Link>
            
            {/* Contenido del Dropdown Desktop */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 w-48">
              <div className="bg-white rounded-2xl shadow-xl border border-black/5 flex flex-col p-2">
                <Link href="/colegio" className="px-4 py-3 text-sm font-body font-bold text-on-background hover:bg-black/5 hover:text-primary rounded-xl transition-colors">Colegio</Link>
                <Link href="/instituto" className="px-4 py-3 text-sm font-body font-bold text-on-background hover:bg-black/5 hover:text-primary rounded-xl transition-colors">Instituto</Link>
                <Link href="/infotep" className="px-4 py-3 text-sm font-body font-bold text-on-background hover:bg-black/5 hover:text-primary rounded-xl transition-colors">Infotep</Link>
                <Link href="/deportes" className="px-4 py-3 text-sm font-body font-bold text-on-background hover:bg-black/5 hover:text-primary rounded-xl transition-colors">Deportes</Link>
              </div>
            </div>
          </div>

          <Link className="font-body text-sm text-on-background-muted font-bold tracking-widest uppercase hover:text-primary transition-colors" href="/noticias">Noticias</Link>
          <Link className="font-body text-sm text-on-background-muted font-bold tracking-widest uppercase hover:text-primary transition-colors" href="/contacto">Contáctanos</Link>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-4">
          <Link href="/inscripcion" className="hidden sm:block bg-primary text-white px-8 py-3 rounded-full font-body text-sm font-bold uppercase tracking-widest active:scale-95 transition-all duration-300 hover:bg-on-background hover:shadow-[0_10px_20px_rgba(204,0,0,0.2)]">
            Inscríbete
          </Link>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-primary flex items-center justify-center p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-3xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full bg-white shadow-2xl border-t border-black/5 flex flex-col p-6 max-h-[calc(100vh-80px)] overflow-y-auto">
          <Link 
            href="/nosotros" 
            className="py-4 border-b border-black/5 font-body text-lg font-bold text-on-background uppercase tracking-wider"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Crossover
          </Link>
          
          <div className="flex flex-col border-b border-black/5">
            <button 
              className="py-4 font-body text-lg font-bold text-on-background uppercase tracking-wider flex justify-between items-center w-full text-left"
              onClick={() => setIsMobileOfertaOpen(!isMobileOfertaOpen)}
            >
              Oferta Académica
              <span className={`material-symbols-outlined transition-transform duration-300 ${isMobileOfertaOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            
            {/* Mobile Submenu */}
            {isMobileOfertaOpen && (
              <div className="flex flex-col bg-black/5 rounded-2xl mb-4 p-2 gap-1 transition-all duration-300">
                <Link href="/colegio" className="py-3 px-4 font-body font-bold text-on-background hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Colegio</Link>
                <Link href="/instituto" className="py-3 px-4 font-body font-bold text-on-background hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Instituto</Link>
                <Link href="/infotep" className="py-3 px-4 font-body font-bold text-on-background hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Infotep</Link>
                <Link href="/deportes" className="py-3 px-4 font-body font-bold text-on-background hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Deportes</Link>
              </div>
            )}
          </div>
          
          <Link 
            href="/noticias" 
            className="py-4 border-b border-black/5 font-body text-lg font-bold text-on-background uppercase tracking-wider"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Noticias
          </Link>
          <Link 
            href="/contacto" 
            className="py-4 mb-8 font-body text-lg font-bold text-on-background uppercase tracking-wider"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contáctanos
          </Link>

          <Link 
            href="/inscripcion" 
            className="w-full text-center bg-primary text-white px-8 py-4 rounded-full font-body font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-xl block"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Inscríbete
          </Link>
        </div>
      )}
    </nav>
  );
}
