"use client";
import React, { useState } from "react";

export default function BroadcastAdmin() {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("whatsapp");
  const [emailSubject, setEmailSubject] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2 tracking-tight">Broadcast (Mensajería Masiva)</h1>
        <p className="text-gray-500 font-medium">Envía anuncios masivos a múltiples estudiantes o padres a la vez.</p>
      </div>

      {/* Selector de Canal */}
      <div className="flex space-x-2 bg-gray-200/50 p-1 rounded-2xl mb-8 w-fit">
        <button 
          onClick={() => setMode("whatsapp")}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
            mode === "whatsapp" ? "bg-[#25D366] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          WhatsApp
        </button>
        <button 
          onClick={() => setMode("email")}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
            mode === "email" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">mail</span>
          Correo Electrónico
        </button>
      </div>

      {mode === "whatsapp" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        
        {/* Editor de Mensaje WhatsApp */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Destinatarios del Mensaje</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-800 font-bold focus:outline-none focus:border-[#25D366]">
                <option>Todos los estudiantes activos (152)</option>
                <option>Solo padres del Instituto de Inglés (89)</option>
                <option>Solo estudiantes con pagos PENDIENTES (14)</option>
                <option>Prospectos (No inscritos oficialmente) (32)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cuerpo del Mensaje (WhatsApp)</label>
              <textarea 
                rows={8} 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-800 font-medium focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] resize-none" 
                placeholder="Escribe el aviso aquí. Ej: Estimados padres, mañana no habrá docencia..."
              ></textarea>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">Puedes usar *negrita* o _cursiva_ como en WhatsApp.</p>
                <p className={`text-xs font-bold ${message.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{message.length} caracteres</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button className="bg-[#25D366] text-white py-4 px-10 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#20bd5a] transition-all flex items-center gap-3 shadow-lg shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:-translate-y-1">
                <span className="material-symbols-outlined">send</span> Enviar a 152 Contactos
              </button>
            </div>
          </div>
        </div>

        {/* Vista Previa del Celular */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ml-2">Vista Previa</h3>
            <div className="w-full h-[500px] bg-[#EFEAE2] rounded-[2.5rem] border-8 border-gray-900 shadow-xl overflow-hidden flex flex-col relative">
              {/* Header WhatsApp */}
              <div className="bg-[#008069] px-4 py-3 flex items-center gap-3 text-white z-10 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">Instituto Crossover</p>
                  <p className="text-[10px] text-white/70">en línea</p>
                </div>
              </div>
              
              {/* Chat Body */}
              <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "cover", opacity: 0.9 }}>
                
                {message.length > 0 ? (
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] mb-2">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
                    <p className="text-[10px] text-gray-400 text-right mt-1">10:45 a.m.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-center text-gray-500 bg-[#E1F3FB] px-3 py-2 rounded-xl border border-[#D5EAF4]">
                      Escribe un mensaje para ver cómo lucirá en el celular de los padres.
                    </p>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {mode === "email" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        {/* Editor de Email */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Destinatarios del Correo</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-800 font-bold focus:outline-none focus:border-blue-500">
                <option>Boletín Informativo (Todos) (152)</option>
                <option>Aviso de Cobros (Pendientes) (14)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Asunto del Correo</label>
              <input 
                type="text" 
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 font-bold focus:outline-none focus:border-blue-500" 
                placeholder="Ej: Aviso importante sobre la docencia"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Cuerpo del Correo</label>
                <button 
                  onClick={() => setIsHtmlMode(!isHtmlMode)}
                  className={`text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${isHtmlMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">code</span>
                  {isHtmlMode ? 'Modo Visual' : 'Modo HTML'}
                </button>
              </div>
              
              {isHtmlMode ? (
                <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#1E1E1E]">
                  <div className="bg-[#2D2D2D] px-4 py-2 flex items-center gap-2 border-b border-[#404040]">
                    <span className="text-gray-400 text-xs font-mono">index.html</span>
                  </div>
                  <textarea 
                    rows={12} 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#1E1E1E] text-[#D4D4D4] font-mono text-sm py-4 px-4 focus:outline-none resize-none" 
                    placeholder="<!-- Pega tu código HTML aquí -->"
                    spellCheck="false"
                  ></textarea>
                </div>
              ) : (
                <textarea 
                  rows={10} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-800 font-medium focus:outline-none focus:border-blue-500 resize-none" 
                  placeholder="Escribe el contenido del correo aquí..."
                ></textarea>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button className="bg-blue-600 text-white py-4 px-10 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-all flex items-center gap-3 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1">
                <span className="material-symbols-outlined">send</span> Enviar a 152 Correos
              </button>
            </div>
          </div>
        </div>

        {/* Vista Previa del Email */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ml-2">Vista Previa en Gmail</h3>
            <div className="w-full h-[500px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col relative">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              
              <div className="p-4 border-b border-gray-100 flex items-start gap-3">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">C</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">Instituto Crossover</p>
                  <p className="text-xs text-gray-500 truncate">info@crossover.edu.do</p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{emailSubject || "Asunto del Correo"}</h2>
                
                {isHtmlMode && message.includes('<') ? (
                  /* Render RAW HTML securely using dangerouslySetInnerHTML */
                  <div 
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: message }} 
                  />
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap font-medium">
                    {message || "Aquí aparecerá el texto de tu correo electrónico..."}
                  </div>
                )}
                
                {!isHtmlMode && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-bold">Instituto Crossover</p>
                      <p className="text-[10px] text-gray-400 mt-1">Has recibido este correo porque estás inscrito en nuestra base de datos.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
