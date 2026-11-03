import React from "react";
import { notFound } from "next/navigation";
import { getDetalleCursoCompleto, getProfesores } from "@/app/actions/cursos";
import CursoDetalleClient from "./CursoDetalleClient";

export default async function CursoDetallePage({ params }: { params: { id: string } }) {
  const [res, profesores, cursosDisponibles] = await Promise.all([
    getDetalleCursoCompleto(params.id),
    getProfesores(),
    import("@/app/actions/cursos").then(m => m.getCursos())
  ]);

  if (!res.success || !res.curso) {
    notFound();
  }

  return (
    <CursoDetalleClient 
      expediente={res} 
      profesores={profesores || []} 
      cursosDisponibles={cursosDisponibles || []} 
    />
  );
}
