import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Whitelist of public paths that don't require authentication
const publicPaths = [
    '/',
    '/login',
    '/about-us',
    '/checkout',
    '/contact-us',
    '/privacy-policy',
    '/terms-of-service',
];

// File extensions that should be public
const publicFileExtensions = [
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('auth_token')?.value;

    // 1. Allow internal Next.js requests and public files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        publicFileExtensions.some(ext => pathname.endsWith(ext))
    ) {
        return NextResponse.next();
    }

    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    const isAuthPage = pathname.startsWith('/login');

    // Redirect legacy dashboard paths to admin
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        const newPathname = pathname.replace('/dashboard', '/admin');
        return NextResponse.redirect(new URL(newPathname, request.url));
    }

    // 2. Redirect unauthenticated users trying to access private paths
    if (!token && !isPublicPath) {
        const loginUrl = new URL('/login', request.url);
        // Optionally preserve the attempted URL to redirect back after login
        // loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Redirect authenticated users away from the login page
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

// Ensure the middleware runs on all routes except internal ones
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
