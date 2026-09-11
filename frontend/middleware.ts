import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1️⃣ Define public routes (no auth required)
const publicRoutes = ["/", "/login", "/signup"];

/** Employee-only portal paths */
function isEmployeePortalRoute(pathname: string): boolean {
  if (pathname === "/employee-dashboard" || pathname.startsWith("/employee-dashboard/")) return true;
  if (pathname.startsWith("/employee/")) return true;
  return false;
}

function normalizeRole(rawRole: unknown): "admin" | "employee" | "manager" | null {
  if (typeof rawRole !== "string") return null;
  const role = rawRole.trim().toLowerCase();
  if (role === "admin" || role.endsWith(".admin")) return "admin";
  if (role === "employee" || role.endsWith(".employee")) return "employee";
  if (role === "manager" || role.endsWith(".manager")) return "manager";
  return null;
}

/** Safely decode JWT payload without throwing unhandled exceptions */
function decodeJwtPayload(rawToken: string): any | null {
  try {
    let cleanToken = rawToken.trim();
    if (cleanToken.startsWith("Bearer ")) {
      cleanToken = cleanToken.slice(7).trim();
    }
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1);
    }
    try {
      cleanToken = decodeURIComponent(cleanToken);
    } catch {}

    const parts = cleanToken.split(".");
    if (parts.length !== 3) return null;

    const tokenPart = parts[1];
    const base64 = tokenPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    if (typeof Buffer !== "undefined") {
      return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    } else {
      return JSON.parse(atob(padded));
    }
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2️⃣ Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  
  if (isPublicRoute && pathname !== "/login") {
    // If accessing root and has a valid cookie token, redirect to dashboard
    if (pathname === "/") {
      const cookieTokenForRoot = request.cookies.get("access_token")?.value;
      if (cookieTokenForRoot) {
        const payload = decodeJwtPayload(cookieTokenForRoot);
        if (payload && typeof payload.exp === "number") {
          const isExpiredRoot = payload.exp * 1000 < Date.now();
          const role = normalizeRole(payload.role);
          if (!isExpiredRoot && role) {
            const dashboardUrl = role === "admin" ? "/admin/dashboard" : "/employee-dashboard";
            return NextResponse.redirect(new URL(dashboardUrl, request.url));
          }
        }
      }
    }
    return NextResponse.next();
  }

  const rawCookieToken = request.cookies.get("access_token")?.value;
  let userRole: string | null = null;
  let isExpired = false;
  let hasValidToken = false;

  if (rawCookieToken) {
    const payload = decodeJwtPayload(rawCookieToken);
    if (payload) {
      userRole = normalizeRole(payload.role);
      if (typeof payload.exp === "number") {
        isExpired = payload.exp * 1000 < Date.now();
      }
      hasValidToken = !isExpired;
    }
  }

  // 5️⃣ If user visits /login with a valid non-expired cookie token, redirect to dashboard
  if (pathname === "/login") {
    if (hasValidToken && userRole) {
      const dashboardUrl = userRole === "admin" ? "/admin/dashboard" : "/employee-dashboard";
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.next();
  }

  // 3️⃣ Admin routes (/admin/*, /dashboard)
  const isAdminRoute = pathname.startsWith("/admin") || pathname === "/dashboard";
  if (isAdminRoute) {
    // Only hard-redirect if cookie is explicitly present AND expired
    if (rawCookieToken && isExpired) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      return response;
    }

    // If no cookie, allow client-side ProtectedRoute to verify localStorage token
    if (!rawCookieToken) {
      return NextResponse.next();
    }

    // Role check if cookie is valid
    if (userRole && userRole !== "admin") {
      return NextResponse.redirect(new URL("/employee-dashboard", request.url));
    }

    return NextResponse.next();
  }

  // 4️⃣ Employee portal routes (/employee-dashboard, /employee/...)
  if (isEmployeePortalRoute(pathname)) {
    if (rawCookieToken && isExpired) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      return response;
    }

    if (!rawCookieToken) {
      return NextResponse.next();
    }
    
    if (userRole && userRole !== "employee") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    
    return NextResponse.next();
  }

  // Other protected routes (/employees, /tasks, /attendance, /requests, /payroll, etc.)
  const protectedRoutes = [
    "/employees",
    "/tasks",
    "/attendance",
    "/requests",
    "/reports",
    "/payroll",
    "/profile",
    "/project-management",
    "/my-space",
    "/my-day",
  ];
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  
  if (isProtectedRoute) {
    if (!rawCookieToken) {
      return NextResponse.next();
    }
    
    if (isExpired) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      return response;
    }
  }

  // Default: allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
    "/",
  ],
};

