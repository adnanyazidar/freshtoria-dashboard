import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route is a public static route or an API route
    if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // Check for standard better-auth cookie (could be configured to be something else depending on domain)
    // We check both typical better-auth cookie names just in case
    const sessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token");

    // Check if user is trying to access login page
    const isAuthRoute = pathname.startsWith("/login");

    // If user is not logged in and tries to access anything other than login
    if (!sessionCookie && !isAuthRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is logged in and tries to access login page, redirect them to dashboard
    if (sessionCookie && isAuthRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Only run middleware on all pages EXCEPT static files / images / api
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
