import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Colegio (Inicial, Primaria y Secundaria)",
  description:
    "Educación escolar integral en Centro Educativo Crossover, Santo Domingo. Niveles Inicial, Primaria y Secundaria con formación en tecnología, valores y excelencia académica.",
  alternates: { canonical: "/colegio" },
};

export default function ColegioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
