"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  solicitarRecuperacionPassword,
  restablecerPasswordConToken,
} from "@/app/actions/usuarios";

function RecuperarPasswordContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  // Estados para solicitar correo
  const [identificador, setIdentificador] = useState("");
  const [solicitando, setSolicitando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null);

  // Estados para restablecer contraseña con token
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [restableciendo, setRestableciendo] = useState(false);
  const [exitoRestablecimiento, setExitoRestablecimiento] = useState(false);
  const [errorRestablecimiento, setErrorRestablecimiento] = useState<string | null>(null);

  // Enviar solicitud de recuperación
  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) return;

    setSolicitando(true);
    setErrorSolicitud(null);

    const res = await solicitarRecuperacionPassword(identificador);
    if (res.success) {
      setSolicitudEnviada(true);
    } else {
      setErrorSolicitud(res.error || "Ocurrió un error al procesar tu solicitud.");
    }
    setSolicitando(false);
  };

  // Restablecer con token
  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenParam) return;

    if (nuevaPassword.length < 6) {
      setErrorRestablecimiento("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorRestablecimiento("Las contraseñas no coinciden.");
      return;
    }

    setRestableciendo(true);
    setErrorRestablecimiento(null);

    const res = await restablecerPasswordConToken(tokenParam, nuevaPassword);
    if (res.success) {
      setExitoRestablecimiento(true);
    } else {
      setErrorRestablecimiento(res.error || "No se pudo actualizar la contraseña.");
    }
    setRestableciendo(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[#002244]"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-white/20">
        <div className="flex justify-center mb-6">
          <Link href="/admin">
            <Image src="/rojo.png" alt="Crossover Logo" width={160} height={50} className="object-contain" />
          </Link>
        </div>

        {/* ================= VISTA 1: RESTABLECER CON TOKEN EN URL ================= */}
        {tokenParam ? (
          <div>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">lock_reset</span>
              </div>
              <h2 className="text-xl font-display font-black text-gray-900 tracking-tight">
                Crea tu Nueva Contraseña
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Ingresa una contraseña segura de al menos 6 caracteres.
              </p>
            </div>

            {exitoRestablecimiento ? (
              <div className="text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl font-black">check</span>
                </div>
                <h3 className="text-base font-black text-gray-900">¡Contraseña Actualizada!</h3>
                <p className="text-xs text-gray-600">
                  Tu acceso ha sido restablecido con éxito. Ya puedes ingresar al portal con tu nueva contraseña.
                </p>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className="block w-full bg-[#990000] hover:bg-[#800000] text-white py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md transition-all text-center"
                  >
                    Ir al Inicio de Sesión
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRestablecer} className="space-y-4">
                {errorRestablecimiento && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{errorRestablecimiento}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={restableciendo}
                  className="w-full bg-[#990000] hover:bg-[#800000] text-white py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {restableciendo ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Actualizar Contraseña</span>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ================= VISTA 2: SOLICITAR RECUPERACIÓN ================= */
          <div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-display font-black text-gray-900 tracking-tight">
                ¿Olvidaste tu Contraseña?
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Ingresa tu usuario o correo para enviarte las instrucciones de recuperación.
              </p>
            </div>

            {solicitudEnviada ? (
              <div className="text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl font-black">mail</span>
                </div>
                <h3 className="text-base font-black text-gray-900">Revisa tu Bandeja de Entrada</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Si tu usuario o correo está registrado en el sistema, hemos enviado un enlace de recuperación seguro. Revisa tu carpeta principal y de Spam.
                </p>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-center"
                  >
                    Volver al Inicio de Sesión
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSolicitar} className="space-y-4">
                {errorSolicitud && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{errorSolicitud}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Nombre de Usuario o Correo
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      placeholder="ej: pedro o pedro@crossoverrd.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={solicitando}
                  className="w-full bg-[#990000] hover:bg-[#800000] text-white py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {solicitando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Enlace de Recuperación</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/admin"
                    className="text-xs font-bold text-gray-500 hover:text-[#990000] transition-colors"
                  >
                    ← Regresar al Inicio de Sesión
                  </Link>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 font-medium border-t border-gray-100 pt-4">
          Centro Educativo Crossover • Seguridad de Acceso
        </div>
      </div>
    </main>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#002244] flex items-center justify-center text-white text-xs font-bold">
          Cargando...
        </div>
      }
    >
      <RecuperarPasswordContent />
    </Suspense>
  );
}
