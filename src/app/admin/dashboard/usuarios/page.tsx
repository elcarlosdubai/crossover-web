"use client";

import React, { useState, useEffect } from "react";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  toggleEstadoUsuario,
  eliminarUsuario,
  UsuarioPerfil,
  RolUsuario,
} from "@/app/actions/usuarios";

const ROLES_INFO: Record<RolUsuario, { label: string; badgeClass: string; desc: string }> = {
  admin: {
    label: "Súper Administrador",
    badgeClass: "bg-red-50 text-[#990000] border-red-200",
    desc: "Acceso total y configuración del sistema",
  },
  director: {
    label: "Director Académico",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Supervisión de cursos, calificaciones y asistencia",
  },
  recepcion: {
    label: "Recepción & Caja",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Cobros, recibos, inscripciones y llamadas",
  },
  profesor: {
    label: "Cuerpo Docente",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Pase de lista y notas de sus alumnos",
  },
  editor: {
    label: "Editor de Noticias",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Gestión de noticias y portada web",
  },
};

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("todos");

  // Modal Crear Usuario
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [username, setUsername] = useState("");
  const [emailNotif, setEmailNotif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nuevoRol, setNuevoRol] = useState<RolUsuario>("recepcion");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [guardandoCrear, setGuardandoCrear] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  // Modal Editar Usuario
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioPerfil | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editRol, setEditRol] = useState<RolUsuario>("recepcion");
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Modal Cambiar Password
  const [usuarioPassword, setUsuarioPassword] = useState<UsuarioPerfil | null>(null);
  const [nuevoPasswordInput, setNuevoPasswordInput] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [msgPassword, setMsgPassword] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // Formateador con guiones automáticos: xxx-xxx-xxxx
  const handlePhoneFormat = (value: string, setter: (val: string) => void) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setter(formatted);
  };

  // Cargar usuarios
  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Handler Crear
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !username.trim()) return;

    setGuardandoCrear(true);
    setErrorCrear(null);

    const res = await crearUsuario({
      nombres,
      apellidos,
      username,
      emailNotificaciones: emailNotif || undefined,
      telefono,
      rol: nuevoRol,
      password: nuevaPassword || undefined,
    });

    if (res.success) {
      setModalCrearOpen(false);
      setNombres("");
      setApellidos("");
      setUsername("");
      setEmailNotif("");
      setTelefono("");
      setNuevaPassword("");
      setNuevoRol("recepcion");
      cargarUsuarios();
    } else {
      setErrorCrear(res.error || "No se pudo crear el usuario.");
    }
    setGuardandoCrear(false);
  };

  // Handler Editar
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setGuardandoEdit(true);
    const res = await actualizarUsuario(usuarioEditando.id, {
      nombre: editNombre,
      rol: editRol,
      telefono: editTelefono,
    });

    if (res.success) {
      setUsuarioEditando(null);
      cargarUsuarios();
    } else {
      alert("Error al actualizar: " + res.error);
    }
    setGuardandoEdit(false);
  };

  // Handler Cambiar Password
  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioPassword || !nuevoPasswordInput.trim()) return;

    setGuardandoPassword(true);
    setMsgPassword(null);

    const res = await cambiarPasswordUsuario(usuarioPassword.id, nuevoPasswordInput.trim());
    if (res.success) {
      setMsgPassword({ tipo: "exito", texto: "¡Contraseña actualizada con éxito!" });
      setTimeout(() => {
        setUsuarioPassword(null);
        setNuevoPasswordInput("");
        setMsgPassword(null);
      }, 1500);
    } else {
      setMsgPassword({ tipo: "error", texto: res.error || "Error al cambiar contraseña." });
    }
    setGuardandoPassword(false);
  };

  // Handler Toggle Estado
  const handleToggleEstado = async (u: UsuarioPerfil) => {
    const accion = u.activo ? "suspender" : "activar";
    if (!confirm(`¿Estás seguro de que deseas ${accion} el acceso a ${u.nombre}?`)) return;

    const res = await toggleEstadoUsuario(u.id, !u.activo);
    if (res.success) {
      cargarUsuarios();
    } else {
      alert("Error al cambiar estado: " + res.error);
    }
  };

  // Handler Eliminar
  const handleEliminar = async (u: UsuarioPerfil) => {
    if (!confirm(`⚠️ ATENCIÓN: ¿Eliminar definitivamente a ${u.nombre}? Esta acción no se puede deshacer.`)) return;

    const res = await eliminarUsuario(u.id);
    if (res.success) {
      cargarUsuarios();
    } else {
      alert("Error al eliminar: " + res.error);
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter((u) => {
    const loginIdentifier = u.username || u.email;
    const matchBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      loginIdentifier.toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.telefono && u.telefono.includes(busqueda));
    const matchRol = filtroRol === "todos" || u.rol === filtroRol;
    return matchBusqueda && matchRol;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Gestión de Usuarios & Roles
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Crea accesos mediante nombre de usuario, administra contraseñas y asigna roles a los empleados.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorCrear(null);
            setModalCrearOpen(true);
          }}
          className="bg-[#990000] hover:bg-[#800000] text-white py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[19px]">person_add</span>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <span className="material-symbols-outlined text-gray-400 text-lg ml-2">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o teléfono (xxx-xxx-xxxx)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="text-gray-400 hover:text-gray-700 text-xs">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rol:</label>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none"
          >
            <option value="todos">Todos los Roles ({usuarios.length})</option>
            <option value="admin">Súper Administrador</option>
            <option value="director">Director Académico</option>
            <option value="recepcion">Recepción & Caja</option>
            <option value="profesor">Cuerpo Docente</option>
            <option value="editor">Editor de Noticias</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE USUARIOS */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-xs font-bold text-gray-400 flex flex-col items-center gap-2">
            <span className="w-6 h-6 border-2 border-gray-300 border-t-[#990000] rounded-full animate-spin"></span>
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs font-bold">
            No se encontraron usuarios con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Nombre del Empleado</th>
                  <th className="py-3.5 px-6">Usuario de Acceso</th>
                  <th className="py-3.5 px-6">Rol en el Sistema</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6">Último Acceso</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {usuariosFiltrados.map((u) => {
                  const rolConfig = ROLES_INFO[u.rol] || {
                    label: u.rol,
                    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                    desc: "Rol personalizado",
                  };
                  const iniciales = u.nombre
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const displayUsername = u.username || u.email.split("@")[0];

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* NOMBRE Y TELEFONO */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 text-[#990000] font-black flex items-center justify-center text-xs shrink-0 border border-gray-200">
                            {iniciales}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.nombre}</p>
                            {u.telefono ? (
                              <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px] text-emerald-600">call</span>
                                {u.telefono}
                              </p>
                            ) : (
                              <p className="text-[10px] text-gray-400">Sin teléfono</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* USUARIO DE ACCESO */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-gray-400 text-sm">badge</span>
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                            {displayUsername}
                          </span>
                        </div>
                      </td>

                      {/* ROL */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${rolConfig.badgeClass}`}
                        >
                          {rolConfig.label}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{rolConfig.desc}</p>
                      </td>

                      {/* ESTADO ACTIVO/INACTIVO */}
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => handleToggleEstado(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            u.activo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${u.activo ? "bg-emerald-500" : "bg-gray-400"}`}
                          ></span>
                          {u.activo ? "Activo" : "Suspendido"}
                        </button>
                      </td>

                      {/* ULTIMO ACCESO */}
                      <td className="py-3.5 px-6 text-gray-500 font-medium">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString("es-DO", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Nunca ha ingresado"}
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Cambiar Contraseña"
                            onClick={() => {
                              setUsuarioPassword(u);
                              setNuevoPasswordInput("");
                              setMsgPassword(null);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>

                          <button
                            title="Editar Datos"
                            onClick={() => {
                              setUsuarioEditando(u);
                              setEditNombre(u.nombre);
                              setEditTelefono(u.telefono || "");
                              setEditRol(u.rol);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          <button
                            title="Eliminar Usuario"
                            onClick={() => handleEliminar(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: CREAR NUEVO USUARIO (POR USERNAME, NOMBRES Y APELLIDOS) ================= */}
      {modalCrearOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#990000] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <h3 className="text-sm font-black text-gray-900">Crear Nuevo Usuario</h3>
              </div>
              <button
                onClick={() => setModalCrearOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorCrear && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorCrear}</span>
              </div>
            )}

            <form onSubmit={handleCrearUsuario} className="space-y-3.5 text-xs">
              {/* NOMBRES Y APELLIDOS SEPARADOS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ej: Pedro"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej: Martínez"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                  />
                </div>
              </div>

              {/* NOMBRE DE USUARIO (USERNAME PARA INICIAR SESION) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre de Usuario (Para Iniciar Sesión) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    alternate_email
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="ej: pedro.martinez o pmartinez"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Este es el usuario con el que el empleado entrará al sistema.
                </p>
              </div>

              {/* CORREO DE NOTIFICACIONES & RECUPERACION */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Correo Electrónico Personal / Notificaciones (Para Bienvenida y Recuperación)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    mail
                  </span>
                  <input
                    type="email"
                    value={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.value)}
                    placeholder="pedro.martinez@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  A este correo se le enviará su bienvenida con credenciales y el enlace si olvida su contraseña.
                </p>
              </div>

              {/* ROL Y TELEFONO (CON GUIONES AUTOMATICOS xxx-xxx-xxxx) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Rol en el Sistema *
                  </label>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value as RolUsuario)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                  >
                    <option value="recepcion">Recepción & Caja</option>
                    <option value="profesor">Cuerpo Docente</option>
                    <option value="director">Director Académico</option>
                    <option value="editor">Editor de Noticias</option>
                    <option value="admin">Súper Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => handlePhoneFormat(e.target.value, setTelefono)}
                    placeholder="809-555-0100"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                  />
                </div>
              </div>

              {/* CONTRASEÑA INICIAL */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Contraseña Inicial (Opcional)
                </label>
                <input
                  type="text"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Por defecto: Crossover*2026!"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#990000] focus:bg-white"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Si la dejas vacía, se asignará <span className="font-mono font-bold text-gray-600">Crossover*2026!</span>.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCrear}
                  className="w-1/2 py-2.5 rounded-xl bg-[#990000] hover:bg-[#800000] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guardandoCrear ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDITAR DATOS DEL USUARIO ================= */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900">Editar Usuario</h3>
              <button
                onClick={() => setUsuarioEditando(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Rol Asignado
                </label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value as RolUsuario)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="recepcion">Recepción & Caja</option>
                  <option value="profesor">Cuerpo Docente</option>
                  <option value="director">Director Académico</option>
                  <option value="editor">Editor de Noticias</option>
                  <option value="admin">Súper Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Teléfono (xxx-xxx-xxxx)
                </label>
                <input
                  type="tel"
                  value={editTelefono}
                  onChange={(e) => handlePhoneFormat(e.target.value, setEditTelefono)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdit}
                  className="w-1/2 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guardandoEdit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CAMBIAR CONTRASEÑA ================= */}
      {usuarioPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">key</span>
                <h3 className="text-sm font-black text-gray-900">Cambiar Contraseña</h3>
              </div>
              <button
                onClick={() => setUsuarioPassword(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Establece una nueva contraseña de acceso para:{" "}
              <strong className="text-gray-900">{usuarioPassword.nombre}</strong> (
              <span className="font-mono">{usuarioPassword.username || usuarioPassword.email.split("@")[0]}</span>).
            </p>

            {msgPassword && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  msgPassword.tipo === "exito"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {msgPassword.tipo === "exito" ? "check_circle" : "error"}
                </span>
                <span>{msgPassword.texto}</span>
              </div>
            )}

            <form onSubmit={handleCambiarPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={nuevoPasswordInput}
                  onChange={(e) => setNuevoPasswordInput(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#990000] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsuarioPassword(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs uppercase cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPassword}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guardandoPassword ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
