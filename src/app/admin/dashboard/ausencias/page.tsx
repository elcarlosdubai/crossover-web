"use client";
import React, { useState, useEffect } from "react";
import { getAusenciasTriage, actualizarEstadoAusencia } from "@/app/actions/recepcion";

export default function AusenciasRecepcionPage() {
  const [ausencias, setAusencias] = useState<any[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  useEffect(() => {
    loadData(fecha);
  }, [fecha]);

  async function loadData(f: string) {
    setLoading(true);
    const data = await getAusenciasTriage(f);
    setAusencias(data);
    setLoading(false);
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: 'PENDIENTE' | 'JUSTIFICADA' | 'WHATSAPP_ENVIADO' | 'LLAMADO_REALIZADO') => {
    setProcesandoId(id);
    const res = await actualizarEstadoAusencia(id, nuevoEstado);
    if (res.success) {
      await loadData(fecha);
    } else {
      alert("Error actualizando: " + res.error);
    }
    setProcesandoId(null);
  };

  const handleEnviarWhatsApp = (ausencia: any) => {
    const telefono = (ausencia.estudiante?.tutor_telefono || "").replace(/\D/g, "");
    if (!telefono) {
      alert("El estudiante no tiene número de teléfono registrado.");
      return;
    }
    const nombreAlumno = `${ausencia.estudiante?.nombres} ${ausencia.estudiante?.apellidos}`;
    const curso = ausencia.curso?.nombre || "su clase";
    const mensaje = encodeURIComponent(
      `Hola ${ausencia.estudiante?.tutor_nombre || 'estimado padre/tutor'}, le escribimos del Instituto Crossover. Le informamos que hoy ${fecha} el estudiante ${nombreAlumno} no se presentó a su clase de ${curso}. Por favor infórmenos si cuenta con alguna justificación médica o eventualidad. ¡Saludos!`
    );

    // Marcar como WHATSAPP_ENVIADO en la base de datos
    handleCambiarEstado(ausencia.id, 'WHATSAPP_ENVIADO');

    // Abrir WhatsApp Web / App
    window.open(`https://wa.me/1${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Ventanilla & Seguimiento
            </span>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Triage de Ausencias Diarias
          </h1>
          <p className="text-gray-500 font-medium">
            Atención rápida de recepción: justifica ausencias o contacta inmediatamente a los padres por WhatsApp.
          </p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 p-2 rounded-2xl shadow-sm">
          <span className="material-symbols-outlined text-gray-400 pl-2">calendar_month</span>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="text-sm font-bold text-gray-800 bg-transparent focus:outline-none pr-3"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin mb-2">progress_activity</span>
          <p className="text-gray-500 font-medium">Cargando reporte de inasistencias...</p>
        </div>
      ) : ausencias.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined text-5xl text-emerald-400 mb-3">verified</span>
          <h3 className="text-lg font-bold text-gray-800">No hay inasistencias reportadas</h3>
          <p className="text-gray-500 text-sm mt-1">¡Excelente! Todos los alumnos asistieron o aún no se ha reportado inasistencia hoy.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              <h3 className="font-black text-gray-900">Alumnos Faltantes por Gestionar ({ausencias.length})</h3>
            </div>
            <span className="text-xs text-gray-500 font-bold">Fecha: {fecha}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/20">
                  <th className="py-3.5 px-6">Estudiante & Matrícula</th>
                  <th className="py-3.5 px-6">Clase / Curso</th>
                  <th className="py-3.5 px-6">Tutor & Teléfono</th>
                  <th className="py-3.5 px-6 text-center">Estado Triage</th>
                  <th className="py-3.5 px-6 text-right">Acciones de Ventanilla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {ausencias.map(item => {
                  const estado = item.atencion_recepcion || 'PENDIENTE';
                  const isPending = estado === 'PENDIENTE';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-900 block">
                          {item.estudiante?.nombres} {item.estudiante?.apellidos}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-400">{item.estudiante?.matricula}</span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-800 block text-xs">{item.curso?.nombre}</span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          Horario: {item.curso?.hora_inicio || 'N/D'} - {item.curso?.hora_fin || 'N/D'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-gray-800 block">{item.estudiante?.tutor_nombre || 'N/D'}</span>
                        <span className="text-xs text-primary font-bold">{item.estudiante?.tutor_telefono || 'Sin teléfono'}</span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                          estado === 'JUSTIFICADA'
                            ? 'bg-blue-100 text-blue-700'
                            : estado === 'WHATSAPP_ENVIADO'
                            ? 'bg-emerald-100 text-emerald-700'
                            : estado === 'LLAMADO_REALIZADO'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {estado === 'WHATSAPP_ENVIADO' ? 'WhatsApp Enviado' : estado === 'LLAMADO_REALIZADO' ? 'Llamada Realizada' : estado}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón WhatsApp Directo */}
                          <button
                            type="button"
                            onClick={() => handleEnviarWhatsApp(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                            title="Abrir WhatsApp con mensaje pre-redactado"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                            WhatsApp
                          </button>

                          {/* Botón Justificar */}
                          <button
                            type="button"
                            disabled={procesandoId === item.id}
                            onClick={() => handleCambiarEstado(item.id, 'JUSTIFICADA')}
                            className="bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
                          >
                            Justificar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
