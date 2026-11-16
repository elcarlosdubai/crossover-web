import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academia Deportiva",
  description:
    "Programas deportivos formativos en Centro Educativo Crossover: disciplina, trabajo en equipo y desarrollo físico integral para niños y jóvenes.",
  alternates: { canonical: "/deportes" },
};

export default function DeportesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
