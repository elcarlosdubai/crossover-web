import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getExpedienteEstudiantePorToken } from "@/app/actions/recepcion";

export default async function ConsultaEstudiantePage({ params }: { params: { token: string } }) {
  const data = await getExpedienteEstudiantePorToken(params.token);

  if (!data) {
    notFound();
  }

  const { estudiante, resumen, criteriosEvaluacion, historialAsistencia, historialPagos } = data;
  const pctColor = resumen.pctAsistencia >= 80 ? "text-emerald-600 bg-emerald-50" : resumen.pctAsistencia >= 70 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Encabezado del Portal del Estudiante */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black">
              {estudiante.nombres.charAt(0)}{estudiante.apellidos.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  Portal de Consulta Oficial
                </span>
                <span className="font-mono text-xs text-gray-400 font-bold">{estudiante.matricula}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900">
                {estudiante.nombres} {estudiante.apellidos}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Curso: <span className="font-bold text-gray-800">{estudiante.curso?.nombre}</span> ({estudiante.curso?.tipo}) | Tutor: {estudiante.tutor_nombre || 'N/D'}
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
            <Image src="/rojo.png" alt="Crossover" width={110} height={35} className="object-contain" />
            <span className="text-[10px] text-gray-400 font-medium mt-1">Actualizado en tiempo real</span>
          </div>
        </div>

        {/* Métricas Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Asistencia Global</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${pctColor}`}>{resumen.pctAsistencia}%</span>
              <span className="text-xs font-bold text-gray-400">({resumen.ausencias} ausencias)</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Mínimo para aprobar: {estudiante.curso?.minimo_asistencia_pct || 80}%</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nota Ponderada</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{resumen.notaFinalPonderada}</span>
              <span className="text-xs font-bold text-gray-400">/ 100 pts</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              {resumen.notaFinalPonderada >= 70 ? 'Estado: APROBANDO' : 'Estado: EN OBSERVACIÓN'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Clases Impartidas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600">{resumen.totalClases}</span>
              <span className="text-xs font-bold text-gray-400">sesiones</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Prof: {estudiante.curso?.profesor?.nombre || 'Docente'}</p>
          </div>
        </div>

        {/* 1. Desglose de Calificaciones por Criterio */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Desglose de Calificaciones Oficiales</h3>
            <span className="text-xs font-bold text-gray-400">Evaluación Continua</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3 px-6">Criterio Institucional</th>
                  <th className="py-3 px-6 text-center">Valor Máx.</th>
                  <th className="py-3 px-6 text-center">Puntos Obtenidos</th>
                  <th className="py-3 px-6 text-right">Rendimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {criteriosEvaluacion.map((crit: any) => {
                  const maxPts = Number(crit.porcentaje);
                  const obtenido = crit.calificacion !== null ? Number(crit.calificacion) : null;
                  const pct = obtenido !== null && maxPts > 0 ? (obtenido / maxPts) * 100 : 0;
                  const pasa = pct >= 70;

                  return (
                    <tr key={crit.id} className="hover:bg-gray-50/40">
                      <td className="py-3.5 px-6 font-bold text-gray-800">{crit.nombre}</td>
                      <td className="py-3.5 px-6 text-center font-bold text-gray-500 font-mono">{maxPts} pts</td>
                      <td className="py-3.5 px-6 text-center font-black">
                        {obtenido !== null ? (
                          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                            pasa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {obtenido} / {maxPts} pts
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Pendiente</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right font-black">
                        {obtenido !== null ? (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            pasa ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(pct)}% ({pasa ? 'Satisfactorio' : 'A reforzar'})
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Historial de Pagos y Recibos Digitales */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Recibos y Comprobantes de Pago ({historialPagos.length})</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Al Día</span>
          </div>

          {historialPagos.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No hay pagos registrados aún en el portal.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Comprobante</th>
                    <th className="py-3 px-6">Concepto</th>
                    <th className="py-3 px-6">Fecha</th>
                    <th className="py-3 px-6 text-right">Monto</th>
                    <th className="py-3 px-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {historialPagos.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50/40">
                      <td className="py-3.5 px-6 font-mono font-bold text-xs text-gray-800">{r.numero_recibo}</td>
                      <td className="py-3.5 px-6 font-medium text-gray-700">{r.concepto}</td>
                      <td className="py-3.5 px-6 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-6 text-right font-black text-gray-900">RD$ {Number(r.monto).toLocaleString()}</td>
                      <td className="py-3.5 px-6 text-right">
                        <a
                          href={`/recibo/${r.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Ver Recibo
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
