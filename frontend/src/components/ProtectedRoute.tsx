"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "";
  const hasRedirected = useRef(false);
  const [authLoadTimedOut, setAuthLoadTimedOut] = useState(false);

  const hasLocalSession =
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("token") && localStorage.getItem("role") && localStorage.getItem("user_id"));

  const RedirectState = ({ message }: { message: string }) => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/20 dark:bg-white/5 px-8 py-6 backdrop-blur-xl shadow-lg">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );

  useEffect(() => {
    if (!isLoading) {
      setAuthLoadTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setAuthLoadTimedOut(true);
      console.warn("[PROTECTED ROUTE] Auth load timeout reached, using fallback behavior");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  // Reset the redirect guard whenever the path changes so navigating to a new
  // protected route doesn't get silently blocked by a stale redirect state.
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    const userRole = user?.role;
    
    // 3️⃣ Don't interfere with login page
    if (pathname === "/login") {
      return;
    }
    
    // Wait for loading to finish unless we timed out and have a local session fallback.
    if (isLoading && !(authLoadTimedOut && hasLocalSession)) {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    // Check if not logged in
    if (!isLoggedIn) {
      hasRedirected.current = true;
      router.replace("/login");
      return;
    }

    // 3️⃣ Check role permission
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      const targetPath = userRole === "admin" ? "/admin/dashboard" : "/employee-dashboard";
      
      // Only redirect if not already on target path
      if (pathname !== targetPath) {
        hasRedirected.current = true;
        router.replace(targetPath);
      }
      return;
    }
  }, [isLoading, isLoggedIn, user, allowedRoles, router, pathname, authLoadTimedOut, hasLocalSession]);

  // 3️⃣ Show loading spinner while checking auth
  if (isLoading && !authLoadTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Fallback: if auth hydration is stuck but local session exists, render children instead of blank screen.
  if (isLoading && authLoadTimedOut && hasLocalSession) {
    return <>{children}</>;
  }

  // Don't render anything if not logged in (redirecting)
  if (!isLoggedIn) {
    return <RedirectState message="Redirecting to login..." />;
  }

  // Don't render if role mismatch (redirecting)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <RedirectState message="Redirecting to your dashboard..." />;
  }

  return <>{children}</>;
}
