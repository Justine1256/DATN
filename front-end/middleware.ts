// middleware.ts (ở source buyer)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
const AUTH_PAGES = ['/login', '/signup']


export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('authToken')?.value

  if (!token) return NextResponse.next()

  // Nếu đã đăng nhập thì chặn vào login/signup
  if (AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}


export const config = {
  matcher: ['/login', '/signup', '/:path*']
}
