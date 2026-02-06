import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for protecting admin routes
 * 
 * Protects all routes under /admin/* except /admin/login
 * Redirects unauthenticated users to the login page
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to login page
    if (pathname === '/admin/login') {
      // If already authenticated, redirect to dashboard
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Check if user is authenticated for all other admin routes
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin role for sensitive routes
    if (pathname.startsWith('/admin/analytics') || pathname.startsWith('/admin/moderation')) {
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow login page without authentication
        if (req.nextUrl.pathname === '/admin/login') {
          return true;
        }
        // Require token for all other admin routes
        return token !== null;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

/**
 * Matcher configuration for middleware
 * Only applies to admin routes
 */
export const config = {
  matcher: ['/admin/:path*'],
};
