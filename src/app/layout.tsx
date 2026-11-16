import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist", // Keep variable name so we don't break globals.css
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.crossoverrd.com"),
  title: {
    default: "Centro Educativo Crossover | Educación Escolar y Formación Técnica",
    template: "%s | Centro Educativo Crossover",
  },
  description:
    "Centro Educativo Crossover es una institución de educación escolar y formación técnica ubicada en Santo Domingo, República Dominicana. Niveles Inicial, Primaria y Secundaria, Inglés, Informática, Excel, Contabilidad, Diseño Gráfico y cursos INFOTEP.",
  openGraph: {
    title: "Centro Educativo Crossover",
    description:
      "Institución de educación escolar y formación técnica en Santo Domingo, República Dominicana.",
    url: "https://www.crossoverrd.com",
    siteName: "Centro Educativo Crossover",
    locale: "es_DO",
    type: "website",
  },
};

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-full flex flex-col relative">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
