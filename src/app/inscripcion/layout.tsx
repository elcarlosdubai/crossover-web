import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscripción Online y Admisiones",
  description:
    "Solicita información o realiza tu preinscripción online en Centro Educativo Crossover (Colegio, Instituto Técnico o Cursos INFOTEP) en Santo Domingo.",
  alternates: { canonical: "/inscripcion" },
};

export default function InscripcionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
