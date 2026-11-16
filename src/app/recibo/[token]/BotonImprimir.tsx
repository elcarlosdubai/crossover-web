"use client";
import React from "react";

export default function BotonImprimir() {
  const imprimirFormato = (formato: "a4" | "80mm" | "58mm") => {
    const existing = document.getElementById("crossover-print-mode");
    if (existing) existing.remove();

    if (formato !== "a4") {
      const style = document.createElement("style");
      style.id = "crossover-print-mode";
      const width = formato === "58mm" ? "58mm" : "80mm";
      style.innerHTML = `
        @media print {
          @page { size: ${width} auto; margin: 2mm; }
          body { width: ${width}; margin: 0 auto; font-size: 11px !important; }
          .max-w-xl { max-width: ${width} !important; width: ${width} !important; border-radius: 0 !important; }
        }
      `;
      document.head.appendChild(style);
    }

    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => imprimirFormato("a4")}
        className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">print</span>
        Imprimir A4
      </button>
      <button
        type="button"
        onClick={() => imprimirFormato("80mm")}
        className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-3 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
      >
        Ticket 80mm
      </button>
      <button
        type="button"
        onClick={() => imprimirFormato("58mm")}
        className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-3 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
      >
        Ticket 58mm
      </button>
    </div>
  );
}
