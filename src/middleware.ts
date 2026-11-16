import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas del dashboard
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    if (!user) {
      // Si no hay usuario, redirigir a la pantalla de login
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Validación de rol por ruta
    const { data: perfil } = await supabase
      .from('perfiles_usuarios')
      .select('rol, activo')
      .eq('id', user.id)
      .maybeSingle()

    if (perfil && perfil.activo === false) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    const rol = (perfil?.rol || (user.user_metadata?.rol as string) || '').toLowerCase()
    if (rol && rol !== 'admin') {
      const path = request.nextUrl.pathname
      const routeRules: { prefix: string; roles: string[] }[] = [
        { prefix: '/admin/dashboard/usuarios', roles: ['admin'] },
        { prefix: '/admin/dashboard/configuracion', roles: ['admin'] },
        { prefix: '/admin/dashboard/whatsapp', roles: ['admin'] },
        { prefix: '/admin/dashboard/migracion', roles: ['admin'] },
        { prefix: '/admin/dashboard/maestros', roles: ['admin', 'director'] },
        { prefix: '/admin/dashboard/caja', roles: ['admin', 'caja', 'recepcion', 'director'] },
        { prefix: '/admin/dashboard/recibos', roles: ['admin', 'caja', 'recepcion', 'director'] },
        { prefix: '/admin/dashboard/inscripciones', roles: ['admin', 'director', 'recepcion', 'caja'] },
        { prefix: '/admin/dashboard/ausencias', roles: ['admin', 'director', 'recepcion', 'caja'] },
        { prefix: '/admin/dashboard/comunicaciones', roles: ['admin', 'director', 'recepcion', 'caja'] },
        { prefix: '/admin/dashboard/broadcast', roles: ['admin', 'director', 'recepcion'] },
        { prefix: '/admin/dashboard/noticias', roles: ['admin', 'editor'] },
        { prefix: '/admin/dashboard/portada', roles: ['admin', 'editor'] },
      ]

      const matched = routeRules.find((r) => path.startsWith(r.prefix))
      if (matched && !matched.roles.includes(rol)) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  // Si el usuario ya inicio sesion e intenta ir al login, mandarlo al dashboard
  if (request.nextUrl.pathname === '/admin') {
    if (user) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
