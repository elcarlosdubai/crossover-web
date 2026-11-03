import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getReciboPorToken } from "@/app/actions/recepcion";
import BotonImprimir from "./BotonImprimir";

export default async function ReciboPublicoPage({ params }: { params: { token: string } }) {
  const recibo = await getReciboPorToken(params.token);

  if (!recibo) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none">
        
        {/* Cabecera Oficial */}
        <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 flex items-center justify-between">
          <div>
            <Image src="/rojo.png" alt="Instituto Crossover" width={140} height={45} className="brightness-200 contrast-200 object-contain mb-2" />
            <p className="text-xs text-gray-400 font-medium tracking-wide">Instituto Crossover & Centro Comunitario</p>
            <p className="text-[11px] text-gray-500">RNC: 4-30-00000-0 | Tel: 809-592-0000</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md mb-2">
              Comprobante Oficial
            </span>
            <h2 className="text-xl font-mono font-black text-white">{recibo.numero_recibo}</h2>
            <p className="text-xs text-gray-400">{new Date(recibo.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Cuerpo del Recibo */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Datos del Cliente */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">Recibido de:</span>
              <p className="text-base font-bold text-gray-900">{recibo.cliente_nombre}</p>
              {recibo.cliente_telefono && (
                <p className="text-xs text-gray-500 font-medium">Tel: {recibo.cliente_telefono}</p>
              )}
            </div>
            {recibo.estudiante && (
              <div className="sm:text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">Matrícula:</span>
                <span className="inline-block bg-primary/10 text-primary font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                  {recibo.estudiante.matricula}
                </span>
                <p className="text-xs text-gray-500 font-medium mt-1">{recibo.estudiante.curso?.nombre}</p>
              </div>
            )}
          </div>

          {/* Detalle del Cobro */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-200">
                  <th className="py-3 px-4">Descripción del Concepto</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-800">
                    {recibo.concepto}
                    {recibo.notas && (
                      <span className="block text-xs font-normal text-gray-500 mt-0.5">{recibo.notas}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-gray-900 text-base">
                    RD$ {Number(recibo.monto).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Resumen Total */}
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 block">Forma de Pago: {recibo.metodo_pago}</span>
              <span className="text-[11px] text-emerald-600 font-medium">Estado: PAGADO Y CONFIRMADO</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">Total Recibido</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                RD$ {Number(recibo.monto).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Sello de Autenticidad */}
          <div className="text-center pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs text-gray-400 font-medium">
              Documento digital generado por la administración del Instituto Crossover.
            </p>
            <p className="text-[10px] text-gray-400 font-mono mt-1">
              Token de Verificación: {recibo.token}
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 justify-center pt-2 print:hidden">
            <BotonImprimir />
          </div>
        </div>

      </div>
    </div>
  );
}
