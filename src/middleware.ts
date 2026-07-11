import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname)
  // Must match Laravel's session cookie name: Str::slug(APP_NAME).'-session'
  // (config/session.php) — with APP_NAME=KBM that's 'kbm-session', not the
  // Laravel default 'laravel-session'.
  const hasSession = request.cookies.has('kbm-session')

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
