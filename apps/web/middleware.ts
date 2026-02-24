import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes that anyone can access
    const isPublicRoute = pathname === '/' || pathname === '/login';

    // Static assets and internal next.js paths
    const isStaticAsset = pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname.startsWith('/api');

    if (isStaticAsset) {
        return NextResponse.next();
    }

    // If no token and trying to access private route -> login
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If has token and trying to access login -> dashboard (or home)
    if (token && pathname === '/login') {
        // Ideally we redirect to the correct dashboard based on role, 
        // but middleware can't easily read the JWT payload without a library.
        // For now, redirecting to a generic entry or just home.
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
