"use client";
import React from "react";

export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
    >
      <span className="material-symbols-outlined text-[16px]">print</span>
      Imprimir Comprobante
    </button>
  );
}
