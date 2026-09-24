import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const studentToken = request.cookies.get('student_token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/student/login') || 
                     request.nextUrl.pathname.startsWith('/student/register');
  
  // Exclude API routes from middleware redirect (let them handle their own auth)
  // except we might want to protect API routes too, but usually it's handled inside the route.
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const isPublicPage = request.nextUrl.pathname === '/';

  if (!token && !studentToken && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If a student tries to access non-student pages, redirect them to their dashboard
  if (studentToken && !token && !request.nextUrl.pathname.startsWith('/student')) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }
  
  // If a non-student tries to access student dashboard, redirect them
  if (token && !studentToken && request.nextUrl.pathname.startsWith('/student/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Removed to prevent infinite redirect loop with invalid tokens
  // if (token && isAuthPage) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
