
// middleware.ts
// middleware to know current path an the current selected version
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const response = NextResponse.next()
  response.headers.set('x-current-path', pathname)

  return response
}

// Aplica a todas las rutas
export const config = {
  matcher: '/:path*',
}
