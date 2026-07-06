import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary pt-24 sm:pt-32 pb-12 relative overflow-hidden">
      {/* Massive background logo watermark */}
      <div className="absolute -bottom-10 -right-10 sm:-bottom-20 sm:-right-20 opacity-10 pointer-events-none mix-blend-overlay">
        <Image src="/blanco.png" alt="Watermark" width={800} height={800} className="object-contain" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 sm:gap-16 mb-16 sm:mb-24">
          <div className="lg:w-1/3">
            <Image src="/blanco.png" alt="Crossover Logo" width={250} height={100} className="object-contain mb-6 sm:mb-8" />
            <p className="font-body text-white/90 text-base sm:text-lg mb-6 sm:mb-8 max-w-sm leading-relaxed">
              Trasciende con los mejores.
            </p>
            <div className="flex gap-4">
              {/* Facebook */}
              <a className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-sm" href="https://www.facebook.com/crossovercentroeducativo/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              {/* Instagram */}
              <a className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-sm" href="https://www.instagram.com/centroeducativocrossover" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              {/* YouTube */}
              <a className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-sm" href="https://www.youtube.com/hashtag/centroeducativocrossover" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-sm" href="https://wa.me/18099220880" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.031 2C6.496 2 2 6.497 2 12.032c0 1.76.458 3.479 1.332 5.006L2 22l5.107-1.339A9.975 9.975 0 0012.031 22c5.535 0 10.032-4.498 10.032-10.032S17.566 2 12.031 2zm0 18.286c-1.528 0-3.023-.396-4.341-1.144l-.312-.176-3.228.846.862-3.146-.192-.306c-.822-1.309-1.256-2.825-1.256-4.392 0-4.698 3.821-8.52 8.52-8.52 4.699 0 8.521 3.822 8.521 8.52s-3.822 8.52-8.52 8.52zm4.67-6.386c-.256-.128-1.517-.749-1.752-.835-.235-.085-.405-.128-.576.128-.17.256-.66 1.002-.81 1.208-.15.206-.3.235-.555.107-.256-.128-1.084-.4-2.064-1.272-.763-.679-1.277-1.518-1.427-1.774-.15-.256-.016-.395.112-.523.115-.114.256-.299.384-.448.128-.149.17-.256.256-.427.085-.17.042-.32-.021-.448-.064-.128-.576-1.389-.789-1.902-.208-.5-.418-.432-.576-.44-.15-.008-.32-.01-.49-.01-.17 0-.448.064-.683.32-.234.256-.895.875-.895 2.133s.917 2.475 1.045 2.645c.128.17 1.803 2.75 4.366 3.858 3.12 1.348 3.12.896 3.675.854.554-.043 1.792-.733 2.048-1.442.256-.709.256-1.317.18-1.444-.075-.128-.277-.206-.533-.334z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16 lg:w-1/2 w-full">
            <div className="flex flex-col gap-4 sm:gap-6">
              <h4 className="font-display text-xs sm:text-sm text-white font-bold tracking-[0.2em] uppercase">Sitemap</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/">Home</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/nosotros">Crossover</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/#oferta">Oferta Academica</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/instituto">Institute</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/colegio">Colegio</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/infotep">Infotep</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/noticias">Noticias</Link>
                <Link className="font-body font-medium text-white/80 hover:text-white transition-colors text-sm sm:text-base" href="/contacto">Contáctanos</Link>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-display text-xs sm:text-sm text-white font-bold tracking-[0.2em] uppercase mb-4">Contacto & Horario</h4>
              <address className="font-body text-white/80 not-italic text-sm sm:text-base leading-relaxed">
                Av. Las Palmas #58, Herrera<br/>
                Santo Domingo Oeste, Rep. Dom.<br/>
                <br/>
                <a href="tel:+18099220880" className="hover:text-white transition-colors inline-flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">call</span> 809-922-0880</a><br/>
                <a href="mailto:crossover@crossoverrd.com" className="hover:text-white transition-colors inline-flex items-center gap-2 mt-1"><span className="material-symbols-outlined text-[16px]">mail</span> crossover@crossoverrd.com</a>
              </address>
              <div className="mt-4 font-body text-white/80 text-sm sm:text-base">
                <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-green-400">schedule</span> Lun - Sab: 8:00 AM - 8:00 PM</p>
                <p className="flex items-center gap-2 mt-1"><span className="material-symbols-outlined text-[16px] text-red-400">event_busy</span> Domingo: Cerrado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/20 gap-4">
          <p className="font-body text-xs sm:text-sm text-white/80 font-medium text-center md:text-left">
            © {new Date().getFullYear()} Centro Educativo Crossover. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 sm:gap-8">
            <span className="font-body text-xs sm:text-sm text-white/80 font-bold hover:text-white cursor-pointer transition-colors">Privacidad</span>
            <span className="font-body text-xs sm:text-sm text-white/80 font-bold hover:text-white cursor-pointer transition-colors">Términos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
