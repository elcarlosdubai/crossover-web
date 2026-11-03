"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface PostMigrado {
  id: string;
  titulo: string;
  slug: string;
  foto_portada: string;
  created_at: string;
  galeria_urls: string[];
}

export default function PortalMigracion() {
  const [wpTotal, setWpTotal] = useState<number>(73);
  const [supabaseTotal, setSupabaseTotal] = useState<number>(0);
  const [ultimasMigradas, setUltimasMigradas] = useState<PostMigrado[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  // Migration Runner State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Load Status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/migracion/status");
      const data = await res.json();
      if (data.success) {
        setWpTotal(data.wpTotal || 73);
        setSupabaseTotal(data.supabaseTotal || 0);
        setUltimasMigradas(data.ultimasMigradas || []);
      }
    } catch (err) {
      console.error("Error al cargar estado de migración:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Run a single batch
  const runBatch = async (batchSize: number, page: number) => {
    addLog(`⏳ Conectando con Hostinger... solicitando lote (página ${page}, tamaño ${batchSize})...`);
    try {
      const res = await fetch("/api/migracion/ejecutar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize, page })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error en el servidor");
      }

      if (data.logs && data.logs.length > 0) {
        data.logs.forEach((l: string) => addLog(l));
      }

      await fetchStatus();
      return data;
    } catch (err: any) {
      addLog(`❌ ERROR: ${err.message}`);
      throw err;
    }
  };

  // 1 Test Post
  const handleTestOne = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog("🧪 Iniciando prueba de migración con 1 sola publicación...");
    try {
      await runBatch(1, 1);
      addLog("🎉 ¡Prueba de 1 noticia completada! Revisa la vista previa abajo.");
    } catch (e) {
      // Handled in runBatch
    } finally {
      setIsRunning(false);
    }
  };

  // Batch of 5
  const handleBatchFive = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog(`🚀 Iniciando migración de lote de 5 noticias (Página ${currentPage})...`);
    try {
      await runBatch(5, currentPage);
      setCurrentPage((prev) => prev + 1);
      addLog("✅ Lote de 5 noticias procesado exitosamente.");
    } catch (e) {
      // Handled
    } finally {
      setIsRunning(false);
    }
  };

  // Full Migration Loop
  const handleFullMigration = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog("⚡ INICIANDO MIGRACIÓN COMPLETA DESATENDIDA...");
    addLog("ℹ️ Puedes pausar en cualquier momento con el botón 'Pausar Proceso'.");

    let page = 1;
    let keepGoing = true;

    while (keepGoing) {
      try {
        addLog(`📦 Procesando bloque (página ${page})...`);
        const res = await runBatch(2, page);
        
        // Stop condition when reaching end of pages
        if (page > 37) {
          addLog("🏁 ¡Se han procesado todas las páginas de WordPress!");
          keepGoing = false;
          break;
        }
        page++;
        // Short breathing delay
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        addLog("⚠️ Se detuvo la migración continua debido a un error o pausa.");
        keepGoing = false;
        break;
      }
    }

    setIsRunning(false);
    addLog("🏁 Proceso de migración finalizado.");
    await fetchStatus();
  };

  const handleStop = () => {
    setIsRunning(false);
    addLog("🛑 Migración detenida por el usuario.");
  };

  // Calculate percentage
  const porcentaje = wpTotal > 0 ? Math.min(100, Math.round((supabaseTotal / wpTotal) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
              Hostinger ➔ Supabase Cloud
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600">API WordPress Conectada</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Portal de Migración de Actividades & Fotos
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Descarga, comprime y optimiza todas las galerías de crossoverrd.com a la nueva web automáticamente.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isLoadingStatus}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span className={`material-symbols-outlined text-[16px] ${isLoadingStatus ? 'animate-spin' : ''}`}>
            sync
          </span>
          Actualizar Métricas
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Origen WordPress</span>
            <span className="material-symbols-outlined text-blue-500 text-xl">cloud_download</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{wpTotal}</div>
          <div className="text-xs text-gray-400 mt-1">Noticias con Galerías en Hostinger</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Migradas a Supabase</span>
            <span className="material-symbols-outlined text-emerald-500 text-xl">verified</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">{supabaseTotal}</div>
          <div className="text-xs text-gray-400 mt-1">Disponibles en el Nuevo Blog</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pendientes</span>
            <span className="material-symbols-outlined text-amber-500 text-xl">pending_actions</span>
          </div>
          <div className="text-3xl font-black text-amber-600">{Math.max(0, wpTotal - supabaseTotal)}</div>
          <div className="text-xs text-gray-400 mt-1">Por importar y optimizar</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compresión WebP</span>
            <span className="material-symbols-outlined text-purple-500 text-xl">speed</span>
          </div>
          <div className="text-3xl font-black text-purple-600">~80%</div>
          <div className="text-xs text-gray-400 mt-1">Ahorro de peso y carga instantánea</div>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Progreso General de Migración</h2>
            <p className="text-xs text-gray-500">
              {supabaseTotal} de {wpTotal} publicaciones procesadas en el nuevo sistema
            </p>
          </div>
          <span className="text-2xl font-black text-primary">{porcentaje}%</span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
      </div>

      {/* Control Panel Actions */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-xl">play_circle</span>
          Controles de Ejecución de Migración
        </h2>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleTestOne}
            disabled={isRunning}
            className="px-5 py-3 rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">science</span>
            Probar con 1 Noticia
          </button>

          <button
            onClick={handleBatchFive}
            disabled={isRunning}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">filter_5</span>
            Migrar Lote de 5
          </button>

          <button
            onClick={handleFullMigration}
            disabled={isRunning}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            Iniciar Migración Completa
          </button>

          {isRunning && (
            <button
              onClick={handleStop}
              className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all shadow-sm flex items-center gap-2 animate-pulse"
            >
              <span className="material-symbols-outlined text-base">stop_circle</span>
              Pausar Proceso
            </button>
          )}
        </div>
      </div>

      {/* Live Console Logs */}
      <div className="bg-gray-950 text-gray-100 rounded-3xl p-6 border border-gray-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 inline-block"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500 inline-block"></span>
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-xs font-mono text-gray-400 ml-2">terminal: live migration feed</span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Limpiar Pantalla
          </button>
        </div>

        <div
          ref={logContainerRef}
          className="h-48 overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800 pr-2"
        >
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">
              Consola en espera... Haz clic en cualquiera de los botones de arriba para iniciar la migración.
            </p>
          ) : (
            logs.map((log, idx) => (
              <p
                key={idx}
                className={
                  log.includes("✅")
                    ? "text-emerald-400"
                    : log.includes("❌")
                    ? "text-red-400"
                    : log.includes("⚠️")
                    ? "text-yellow-400"
                    : "text-gray-300"
                }
              >
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Live Preview of Migrated Posts */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Últimas Publicaciones Guardadas en Supabase</h2>
            <p className="text-xs text-gray-500">Haz clic en cualquier noticia para verificar cómo quedó en el nuevo blog.</p>
          </div>
          <Link
            href="/admin/dashboard/noticias"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver Todas en Gestor
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        {ultimasMigradas.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aún no hay publicaciones migradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ultimasMigradas.map((item) => (
              <div
                key={item.id}
                className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between bg-white"
              >
                <div>
                  <div className="relative h-36 bg-gray-100 overflow-hidden">
                    {item.foto_portada ? (
                      <img
                        src={item.foto_portada}
                        alt={item.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="material-symbols-outlined text-4xl">image</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">photo_library</span>
                      {item.galeria_urls?.length || 0} fotos
                    </span>
                  </div>

                  <div className="p-3.5">
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                      {item.titulo}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {new Date(item.created_at).toLocaleDateString("es-DO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0 flex gap-2">
                  <a
                    href={`/noticias/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    Ver Noticia
                  </a>
                  <Link
                    href={`/admin/dashboard/noticias/${item.id}`}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors"
                    title="Editar en Gestor"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
