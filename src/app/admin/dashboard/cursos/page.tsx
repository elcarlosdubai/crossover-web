import React from "react";
import { getCursos, getProfesores } from "@/app/actions/cursos";
import CursosClient from "./CursosClient";

export const dynamic = "force-dynamic";

// Server Component: Renderizado instantáneo en el servidor sin loaders iniciales
export default async function CursosPage() {
  const [initialCursos, initialProfesores] = await Promise.all([
    getCursos(),
    getProfesores()
  ]);

  return <CursosClient initialCursos={initialCursos} initialProfesores={initialProfesores} />;
}
