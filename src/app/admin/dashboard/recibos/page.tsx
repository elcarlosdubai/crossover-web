"use client";
import React, { useState, useEffect } from "react";
import { getRecibos, emitirRecibo } from "@/app/actions/recepcion";
import { getEstudiantesDirector } from "@/app/actions/estudiantes";

export default function RecibosPage() {
  const [recibos, setRecibos] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Formulario nuevo recibo
  const [esEstudianteMatriculado, setEsEstudianteMatriculado] = useState(true);
  const [formData, setFormData] = useState({
    estudiante_id: "",
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_email: "",
    concepto: "Mensualidad de Inglés",
    monto: 2500,
    metodo_pago: "EFECTIVO" as 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA',
    notas: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [recData, estData] = await Promise.all([
      getRecibos(),
      getEstudiantesDirector()
    ]);
    setRecibos(recData);
    setEstudiantes(estData);
    if (estData.length > 0) {
      const primerEst = estData[0];
      setFormData(prev => ({
        ...prev,
        estudiante_id: primerEst.id,
        cliente_nombre: `${primerEst.nombres} ${primerEst.apellidos}`,
        cliente_telefono: primerEst.tutor_telefono || ""
      }));
    }
    setLoading(false);
  }

  const handleSeleccionarEstudiante = (estId: string) => {
    const est = estudiantes.find(e => e.id === estId);
    if (est) {
      setFormData({
        ...formData,
        estudiante_id: est.id,
        cliente_nombre: `${est.nombres} ${est.apellidos}`,
        cliente_telefono: est.tutor_telefono || "",
        cliente_email: est.email || ""
      });
    }
  };

  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_nombre || !formData.monto || !formData.concepto) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }
    setSaving(true);
    const payload = {
      ...formData,
      estudiante_id: esEstudianteMatriculado ? formData.estudiante_id : null
    };

    const res = await emitirRecibo(payload);
    if (res.success) {
      setIsModalOpen(false);
      await loadData();
      // Abrir recibo en nueva pestaña
      window.open(`/recibo/${res.recibo.token}`, '_blank');
    } else {
      alert("Error al emitir recibo: " + res.error);
    }
    setSaving(false);
  };

  const handleCopiarEnlace = (token: string) => {
    const url = `${window.location.origin}/recibo/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filtrados = recibos.filter(r => {
    const q = busqueda.toLowerCase();
    const num = (r.numero_recibo || "").toLowerCase();
    const cliente = (r.cliente_nombre || "").toLowerCase();
    const concepto = (r.concepto || "").toLowerCase();
    return num.includes(q) || cliente.includes(q) || concepto.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Caja & Recaudaciones
            </span>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Emisión de Recibos Digitales
          </h1>
          <p className="text-gray-500 font-medium">
            Factura pagos de mensualidades, reservas y servicios para alumnos y clientes particulares con enlace público compartible.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
        >
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          Nuevo Cobro / Recibo
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por número de recibo, cliente o concepto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary font-medium"
          />
        </div>
        <div className="text-xs font-bold text-gray-400">
          Total cobrado: RD$ {filtrados.reduce((a, b) => a + Number(b.monto || 0), 0).toLocaleString()}
        </div>
      </div>

      {/* Tabla de Recibos */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin mb-2">progress_activity</span>
          <p className="text-gray-500 font-medium">Cargando libro de recibos...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/80">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">receipt</span>
          <h3 className="text-lg font-bold text-gray-800">No se encontraron recibos</h3>
          <p className="text-gray-500 text-sm mt-1">Genera el primer comprobante digital usando el botón superior.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Comprobante</th>
                  <th className="py-3.5 px-6">Cliente / Alumno</th>
                  <th className="py-3.5 px-6">Concepto</th>
                  <th className="py-3.5 px-6">Método de Pago</th>
                  <th className="py-3.5 px-6 text-right">Monto</th>
                  <th className="py-3.5 px-6 text-right">Enlace de Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtrados.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-black text-gray-900 block">{r.numero_recibo}</span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900 block">{r.cliente_nombre}</span>
                      <span className="text-xs text-gray-400">{r.cliente_telefono || 'Sin teléfono'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-700">{r.concepto}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md">
                        {r.metodo_pago}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-black text-gray-900 text-base">
                        RD$ {Number(r.monto).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/recibo/${r.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                          title="Ver Recibo Digital"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </a>
                        <button
                          onClick={() => handleCopiarEnlace(r.token)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedToken === r.token ? "check" : "share"}
                          </span>
                          {copiedToken === r.token ? "Copiado" : "Copiar Link"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Emitir Recibo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-display font-black text-gray-900">Emitir Recibo Digital</h3>
                <p className="text-xs text-gray-500 font-medium">Genera el comprobante electrónico oficial con link público.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEmitir} className="space-y-4">
              {/* Toggle Estudiante Matriculado vs Cliente Particular */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEsEstudianteMatriculado(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    esEstudianteMatriculado ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Estudiante Matriculado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEsEstudianteMatriculado(false);
                    setFormData({ ...formData, estudiante_id: "", cliente_nombre: "", cliente_telefono: "" });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    !esEstudianteMatriculado ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Cliente / Reserva Externa
                </button>
              </div>

              {esEstudianteMatriculado ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Seleccionar Estudiante *</label>
                  <select
                    required
                    value={formData.estudiante_id}
                    onChange={e => handleSeleccionarEstudiante(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary font-medium"
                  >
                    {estudiantes.map(e => (
                      <option key={e.id} value={e.id}>{e.nombres} {e.apellidos} ({e.matricula})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.cliente_nombre}
                      onChange={e => setFormData({ ...formData, cliente_nombre: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary font-medium"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.cliente_telefono}
                      onChange={e => setFormData({ ...formData, cliente_telefono: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary font-medium"
                      placeholder="809-000-0000"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Concepto del Pago *</label>
                  <input
                    type="text"
                    required
                    value={formData.concepto}
                    onChange={e => setFormData({ ...formData, concepto: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary font-medium"
                    placeholder="Mensualidad Inglés, Matrícula..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Monto (DOP) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.monto}
                    onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Método de Pago *</label>
                <select
                  value={formData.metodo_pago}
                  onChange={e => setFormData({ ...formData, metodo_pago: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary font-medium"
                >
                  <option value="EFECTIVO">Efectivo en Caja</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="TARJETA">Tarjeta de Crédito / Débito</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Emitiendo...
                    </>
                  ) : (
                    "Generar y Abrir Recibo"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
