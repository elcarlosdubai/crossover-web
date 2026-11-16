import type { Metadata } from "next";
import Script from "next/script";
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Centro Educativo Crossover",
  url: "https://www.crossoverrd.com",
  telephone: "+1-809-922-0880",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Avenida las Palmas #58",
    addressLocality: "Santo Domingo",
    addressCountry: "DO",
  },
  sameAs: [
    "https://www.instagram.com/centroeducativocrossover/",
    "https://www.facebook.com/CentroEducativoCrossover/",
  ],
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-full flex flex-col relative">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WNBS2DZS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WNBS2DZS');`}
        </Script>
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
