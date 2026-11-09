"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { generarHtmlBienvenidaUsuario, generarHtmlRecuperarPassword } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export type RolUsuario = "admin" | "director" | "recepcion" | "profesor" | "editor";

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  email: string; // Puede ser correo real o usuario@crossover.local
  email_notificaciones?: string | null;
  username?: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  last_sign_in_at?: string | null;
}

/**
 * Obtener todos los perfiles de usuario
 */
export async function getUsuarios(): Promise<UsuarioPerfil[]> {
  try {
    const { data: perfiles, error } = await supabase
      .from("perfiles_usuarios")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error al obtener perfiles:", error);
      return [];
    }

    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUsersMap = new Map((authData?.users || []).map((u) => [u.id, u]));

      return (perfiles || []).map((p) => {
        const authUser = authUsersMap.get(p.id);
        const userMeta = authUser?.user_metadata || {};
        const extractedUsername = userMeta.username || (p.email.includes("@crossover") ? p.email.split("@")[0] : null);
        const emailNotif = userMeta.email_notificaciones || (p.email.includes("@") && !p.email.endsWith(".local") ? p.email : null);

        return {
          ...p,
          username: extractedUsername,
          email_notificaciones: emailNotif,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      });
    } catch {
      return perfiles || [];
    }
  } catch (err: any) {
    console.error("Error inesperado en getUsuarios:", err);
    return [];
  }
}

/**
 * Crear un nuevo usuario por NOMBRE DE USUARIO (Username), Nombre y Apellidos
 */
export async function crearUsuario(data: {
  nombres: string;
  apellidos: string;
  username: string;
  emailNotificaciones?: string;
  telefono?: string;
  rol: RolUsuario;
  password?: string;
}) {
  try {
    const cleanNombres = data.nombres.trim();
    const cleanApellidos = (data.apellidos || "").trim();
    const nombreCompleto = `${cleanNombres} ${cleanApellidos}`.trim();
    const cleanEmailNotif = data.emailNotificaciones ? data.emailNotificaciones.trim().toLowerCase() : null;
    
    // Limpiar username (solo letras, numeros, puntos y guiones bajos)
    const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: "El nombre de usuario debe tener al menos 3 caracteres (sin espacios ni caracteres especiales)." };
    }

    // Correo sintético interno para Supabase Auth (garantiza compatibilidad total)
    const internalEmail = `${cleanUsername}@crossover.local`;
    const tempPassword = data.password && data.password.length >= 6 ? data.password : "Crossover*2026!";

    // 1. Crear en Supabase Auth
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: internalEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nombre: nombreCompleto,
        nombres: cleanNombres,
        apellidos: cleanApellidos,
        username: cleanUsername,
        email_notificaciones: cleanEmailNotif,
        rol: data.rol,
        telefono: data.telefono || null,
      },
    });

    if (authErr) {
      if (authErr.message.includes("already been registered") || authErr.message.includes("already exists")) {
        return { success: false, error: `El nombre de usuario "${cleanUsername}" ya está en uso. Por favor elige otro.` };
      }
      return { success: false, error: authErr.message };
    }

    const userId = authUser.user.id;

    // 2. Guardar en perfiles_usuarios
    const { error: profErr } = await supabase.from("perfiles_usuarios").upsert({
      id: userId,
      nombre: nombreCompleto,
      email: cleanEmailNotif || internalEmail,
      telefono: data.telefono?.trim() || null,
      rol: data.rol,
      activo: true,
      created_at: new Date().toISOString(),
    });

    if (profErr) {
      return { success: false, error: profErr.message };
    }

    // 3. ENCOLAR CORREO DE BIENVENIDA EN COLA DE NAMECHEAP (registro_comunicaciones)
    if (cleanEmailNotif) {
      const bienvenidaHtml = generarHtmlBienvenidaUsuario({
        nombre: cleanNombres,
        username: cleanUsername,
        password: tempPassword,
        rol: data.rol,
      });

      await supabase.from("registro_comunicaciones").insert([
        {
          canal: "email",
          tipo_evento: "seguimiento",
          destinatario_nombre: nombreCompleto,
          destinatario_contacto: cleanEmailNotif,
          asunto_o_titulo: `¡Bienvenido al Sistema de Gestión Crossover! — Credenciales de Acceso`,
          contenido_preview: bienvenidaHtml,
          estado: "pendiente",
          responsable: "Sistema de Usuarios",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    revalidatePath("/admin/dashboard/usuarios");
    revalidatePath("/admin/dashboard/maestros");
    return { success: true, userId, username: cleanUsername, passwordUtilizada: tempPassword };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear el usuario." };
  }
}

/**
 * Solicitar Token de Recuperación de Contraseña y Encolar Correo
 */
export async function solicitarRecuperacionPassword(identificador: string) {
  try {
    const cleanId = identificador.trim().toLowerCase();
    if (!cleanId) return { success: false, error: "Ingresa tu usuario o correo electrónico." };

    // Buscar el usuario en Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) throw authErr;

    const user = (authData.users || []).find((u) => {
      const meta = u.user_metadata || {};
      const username = (meta.username || "").toLowerCase();
      const notifEmail = (meta.email_notificaciones || "").toLowerCase();
      const authEmail = (u.email || "").toLowerCase();

      return (
        username === cleanId ||
        notifEmail === cleanId ||
        authEmail === cleanId ||
        authEmail === `${cleanId}@crossover.local`
      );
    });

    // Medida de seguridad: Si no existe, no decimos "no existe", respondemos éxito neutro
    if (!user) {
      return { success: true };
    }

    const meta = user.user_metadata || {};
    const destinoEmail = meta.email_notificaciones || (user.email && !user.email.endsWith(".local") ? user.email : null);

    if (!destinoEmail) {
      return {
        success: false,
        error: "Esta cuenta no tiene un correo de notificaciones asignado. Contacta al Súper Administrador para que restablezca tu acceso directamente.",
      };
    }

    // Generar Token criptográfico de 32 bytes (64 caracteres hex)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 60 minutos de validez

    // Guardar el token en la metadata del usuario
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        reset_token: token,
        reset_token_expires_at: expiresAt,
      },
    });

    const resetUrl = `https://www.crossoverrd.com/admin/recuperar?token=${token}`;
    const recoveryHtml = generarHtmlRecuperarPassword({
      nombre: meta.nombres || meta.nombre || "Usuario",
      username: meta.username || cleanId,
      resetUrl,
    });

    // Encolar correo en Namecheap
    await supabase.from("registro_comunicaciones").insert([
      {
        canal: "email",
        tipo_evento: "seguimiento",
        destinatario_nombre: meta.nombre || "Usuario Crossover",
        destinatario_contacto: destinoEmail,
        asunto_o_titulo: "Instrucciones para Restablecer tu Contraseña — Crossover",
        contenido_preview: recoveryHtml,
        estado: "pendiente",
        responsable: "Recuperación de Contraseña",
        created_at: new Date().toISOString(),
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error("Error en solicitarRecuperacionPassword:", err);
    return { success: false, error: err.message || "Error al procesar la solicitud." };
  }
}

/**
 * Validar Token y Restablecer Contraseña
 */
export async function restablecerPasswordConToken(token: string, nuevaPassword: string) {
  try {
    if (!token) return { success: false, error: "Token inválido o expirado." };
    if (!nuevaPassword || nuevaPassword.length < 6) {
      return { success: false, error: "La contraseña debe tener mínimo 6 caracteres." };
    }

    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) throw authErr;

    const user = (authData.users || []).find((u) => {
      const meta = u.user_metadata || {};
      return meta.reset_token === token;
    });

    if (!user) {
      return { success: false, error: "El enlace de recuperación es inválido o ya fue utilizado." };
    }

    const meta = user.user_metadata || {};
    const expiresAt = Number(meta.reset_token_expires_at || 0);

    if (Date.now() > expiresAt) {
      return { success: false, error: "El enlace de recuperación ha expirado (más de 60 minutos). Solicita uno nuevo." };
    }

    // Actualizar contraseña y destruir el token para que sea de un solo uso
    const { error: upErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: nuevaPassword,
      user_metadata: {
        ...meta,
        reset_token: null,
        reset_token_expires_at: null,
      },
    });

    if (upErr) {
      return { success: false, error: upErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error en restablecerPasswordConToken:", err);
    return { success: false, error: err.message || "Error al restablecer la contraseña." };
  }
}

/**
 * Cambiar contraseña de cualquier usuario
 */
export async function cambiarPasswordUsuario(id: string, nuevaPassword: string) {
  try {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      return { success: false, error: "La contraseña debe tener mínimo 6 caracteres." };
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: nuevaPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Actualizar datos básicos (Nombre, Rol, Teléfono)
 */
export async function actualizarUsuario(
  id: string,
  data: {
    nombre: string;
    rol: RolUsuario;
    telefono?: string;
  }
) {
  try {
    const { error } = await supabase
      .from("perfiles_usuarios")
      .update({
        nombre: data.nombre.trim(),
        rol: data.rol,
        telefono: data.telefono?.trim() || null,
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        nombre: data.nombre.trim(),
        rol: data.rol,
        telefono: data.telefono?.trim() || null,
      },
    });

    revalidatePath("/admin/dashboard/usuarios");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Suspender o Reactivar un usuario
 */
export async function toggleEstadoUsuario(id: string, activo: boolean) {
  try {
    const { error } = await supabase
      .from("perfiles_usuarios")
      .update({ activo })
      .eq("id", id);

    if (error) throw error;

    if (!activo) {
      await supabase.auth.admin.updateUserById(id, { ban_duration: "876000h" });
    } else {
      await supabase.auth.admin.updateUserById(id, { ban_duration: "none" });
    }

    revalidatePath("/admin/dashboard/usuarios");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Eliminar un usuario permanentemente
 */
export async function eliminarUsuario(id: string) {
  try {
    await supabase.from("perfiles_usuarios").delete().eq("id", id);
    await supabase.auth.admin.deleteUser(id);
    revalidatePath("/admin/dashboard/usuarios");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
