import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fetchMaintenanceFlag = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { enabled: false, message: null };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?id=eq.global&select=maintenance_enabled,maintenance_message`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return { enabled: false, message: null };
    }

    const data = await response.json();
    const settings = Array.isArray(data) ? data[0] : null;
    return {
      enabled: Boolean(settings?.maintenance_enabled),
      message: settings?.maintenance_message || null,
    };
  } catch {
    return { enabled: false, message: null };
  }
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAdmin = token?.role === 'admin';

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/admin/analytics') || pathname.startsWith('/admin/moderation')) {
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    }

    return NextResponse.next();
  }

  if (pathname !== '/maintenance') {
    const maintenance = await fetchMaintenanceFlag();
    if (maintenance.enabled && !isAdmin) {
      return NextResponse.redirect(new URL('/maintenance', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
};
