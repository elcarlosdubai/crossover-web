import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instituto Técnico e Idiomas",
  description:
    "Cursos técnicos en Santo Domingo: Inglés por niveles, Informática, Excel Avanzado, Contabilidad, Diseño Gráfico y Secretariado. Horarios entre semana y sabatinos.",
  alternates: { canonical: "/instituto" },
};

export default function InstitutoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
