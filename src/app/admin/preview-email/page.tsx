import React from "react";
import { generarHtmlInscripcion } from "@/lib/email";

export const dynamic = "force-dynamic";

export default function PreviewEmailPage() {
  const html = generarHtmlInscripcion({
    nombre: "Carlos Báez",
    curso: "Inglés Intensivo Adultos",
    horario: "Sábados 9:00 AM - 1:00 PM",
  });

  return (
    <div style={{ backgroundColor: "#1e293b", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", marginBottom: 24 }}>
        <span style={{ backgroundColor: "#990000", color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>
          Vista Previa de Correo Oficial
        </span>
        <h1 style={{ color: "#ffffff", fontSize: 24, fontWeight: 900, marginTop: 12 }}>
          Así lo verá el Alumno en su Bandeja de Entrada
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          Con el logo oficial blanco sobre fondo carmesí, tablas de información y botón de WhatsApp directo.
        </p>
      </div>

      <div
        style={{
          maxWidth: 620,
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
