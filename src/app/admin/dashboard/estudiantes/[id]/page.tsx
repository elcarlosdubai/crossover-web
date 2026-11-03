import React from "react";
import { notFound } from "next/navigation";
import { getExpedienteCompletoEstudiante } from "@/app/actions/estudiantes";
import { getCursos } from "@/app/actions/cursos";
import EstudianteDetalleClient from "./EstudianteDetalleClient";

export default async function EstudianteDetallePage({ params }: { params: { id: string } }) {
  const [expediente, cursos] = await Promise.all([
    getExpedienteCompletoEstudiante(params.id),
    getCursos()
  ]);

  if (!expediente || !expediente.estudiante) {
    notFound();
  }

  return (
    <EstudianteDetalleClient 
      expediente={expediente} 
      cursos={cursos || []} 
    />
  );
}
