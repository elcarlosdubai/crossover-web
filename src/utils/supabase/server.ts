import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function checkAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized: Debes iniciar sesión para realizar esta acción.')
  }
  return user
}

export interface PerfilAutenticado {
  id: string;
  rol: string;
  activo: boolean;
  nombre: string;
  email: string;
}

/**
 * Verifica que el usuario tenga sesión activa, perfil activo y uno de los roles permitidos.
 */
export async function requireRole(allowedRoles: string[]): Promise<{ user: Awaited<ReturnType<typeof checkAuth>>; perfil: PerfilAutenticado }> {
  const user = await checkAuth()

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: perfil, error } = await supabaseAdmin
    .from('perfiles_usuarios')
    .select('id, rol, activo, nombre, email')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !perfil || perfil.activo === false) {
    throw new Error('Forbidden: Tu cuenta no tiene un perfil activo autorizado.')
  }

  if (!allowedRoles.includes(perfil.rol)) {
    throw new Error(`Forbidden: El rol "${perfil.rol}" no tiene permisos para esta operación.`)
  }

  return { user, perfil }
}

export function authErrorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Error de autenticación'
  if (msg.startsWith('Unauthorized:')) {
    return NextResponse.json({ error: msg }, { status: 401 })
  }
  if (msg.startsWith('Forbidden:')) {
    return NextResponse.json({ error: msg }, { status: 403 })
  }
  return null
}
