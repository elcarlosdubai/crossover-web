"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    } else {
      // Temporary success state until we build the dashboard
      window.location.href = "/admin/dashboard";
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[#002244]"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-white/95 backdrop-blur-xl p-10 md:p-14 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-white/20">
        <div className="flex justify-center mb-8">
          <Image src="/rojo.png" alt="Crossover Logo" width={180} height={60} className="object-contain" />
        </div>
        
        <div className="text-center mb-10">
          <p className="text-on-background-muted text-sm font-medium">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-start gap-2 border border-red-100 animate-fade-in-up">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-on-background-muted uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-on-background font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="admin@crossover.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-on-background-muted uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-on-background font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-body font-bold uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-[#cc0000] active:scale-95 transition-all shadow-[0_10px_20px_rgba(204,0,0,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>Ingresar <span className="material-symbols-outlined text-[20px]">login</span></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          Acceso restringido a personal autorizado.
        </p>
      </div>
    </main>
  );
}
