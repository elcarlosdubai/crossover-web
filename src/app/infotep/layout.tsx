import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cursos INFOTEP (Centro Operativo COS)",
  description:
    "Centro Operativo del Sistema (COS) autorizado por INFOTEP en Santo Domingo. Formación técnica gratuita y avalada en Contabilidad, Informática, Ventas y más.",
  alternates: { canonical: "/infotep" },
};

export default function InfotepLayout({ children }: { children: React.ReactNode }) {
  return children;
}
