import React from "react";
import { getMaestros } from "@/app/actions/maestros";
import MaestrosClient from "./MaestrosClient";

// Server Component: Los datos ya vienen listos desde el servidor. Cero spinners iniciales.
export default async function MaestrosPage() {
  const initialMaestros = await getMaestros();

  return <MaestrosClient initialMaestros={initialMaestros} />;
}
