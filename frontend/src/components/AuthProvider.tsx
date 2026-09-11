"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  clearAuth,
  getMyProfile,
} from "@/lib/api";

interface User {
  id: number;
  email: string;
  role: "admin" | "employee";
  name: string;
  profile_picture?: string;
  age?: number;
  date_joined?: string;
  github_url?: string;
  linkedin_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "admin" | "employee"
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  refreshUser: () => Promise<void>;
}

function normalizeUserRole(rawRole: unknown): "admin" | "employee" {
  if (typeof rawRole !== "string") return "employee";
  const normalized = rawRole.trim().toLowerCase();
  if (
    normalized === "admin" ||
    normalized === "administrator" ||
    normalized === "super_admin" ||
    normalized === "superadmin" ||
    normalized === "org-admin" ||
    normalized === "org_admin" ||
    normalized === "manager" ||
    normalized.endsWith(".admin") ||
    normalized.endsWith(".manager")
  ) return "admin";
  if (
    normalized === "employee" ||
    normalized === "staff" ||
    normalized === "user" ||
    normalized.endsWith(".employee")
  ) return "employee";
  return "employee";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshedUserIdRef = useRef<number | null>(null);

  // 1️⃣ Check localStorage on app load
  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('user_id');
      const userName = localStorage.getItem('user_name');
      const userEmail = localStorage.getItem('user_email');
      
      if (token && role && userId && userEmail) {
        const validRole = normalizeUserRole(role);
        
        // Restore user from localStorage
        const restoredUser: User = {
          id: parseInt(userId),
          email: userEmail,
          role: validRole,
          name: userName || userEmail,
        };
        
        setUser(restoredUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH] Error checking localStorage:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for 401 events from API and handle session expiration.
  // Uses a short debounce to ignore spurious 401s from transient network errors
  // (e.g. Railway cold-start, brief backend unavailability) when the local JWT
  // is still valid.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastRedirectAt = 0; // debounce: prevent multiple rapid redirects

    const handle401 = (event: Event) => {
      const customEvent = event as CustomEvent;
      const endpoint = customEvent.detail?.endpoint || '';

      // Never redirect from the login page itself.
      if (window.location.pathname === '/login') return;

      const currentToken = typeof window !== 'undefined'
        ? (localStorage.getItem('token') || localStorage.getItem('access_token'))
        : null;

      if (!currentToken) {
        // No token at all — session is definitely gone.
        clearAuth();
        setUser(null);
        router.push('/login');
        return;
      }

      // Check if token is actually expired before logging out
      try {
        const parts = currentToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            return; // Token still valid, do NOT redirect.
          }
        }
      } catch (e) {
        // Token is malformed — treat as expired below.
      }

      // Debounce: ignore duplicate 401 events fired within 3 seconds.
      const now = Date.now();
      if (now - lastRedirectAt < 3000) {
        return;
      }
      lastRedirectAt = now;

      // Token confirmed expired (or malformed) → clear session and redirect.
      clearAuth();
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth-401', handle401);
    return () => window.removeEventListener('auth-401', handle401);
  }, [router]);

  // 🆕 Refresh user data from backend
  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token) {
      return;
    }
    
    try {
      const result = await getMyProfile();
      
      if (result.data) {
        const updatedUser: User = {
          id: result.data.id,
          email: result.data.email,
          role: normalizeUserRole(result.data.role),
          name: result.data.name,
          profile_picture: result.data.profile_picture,
          age: result.data.age,
          date_joined: result.data.date_joined,
          github_url: result.data.github_url,
          linkedin_url: result.data.linkedin_url,
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('[AUTH] Error refreshing user:', error);
    }
  }, []);

  // Fetch full user profile after initial auth check completes.
  // NOTE: depend on user?.id (primitive), NOT on `user` (object reference).
  // Using the object reference caused an infinite loop: setUser(newObj) → effect
  // fires → refreshUser → setUser(newObj) → effect fires → …
  useEffect(() => {
    const userId = user?.id ?? null;

    if (!userId) {
      refreshedUserIdRef.current = null;
      return;
    }

    if (!isLoading && refreshedUserIdRef.current !== userId) {
      refreshedUserIdRef.current = userId;
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user?.id, refreshUser]); // Depend on user?.id, not `user`

  // 2️⃣ Login function - update state BEFORE redirect
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const result = await apiLogin(email, password);

      if (result.error) {
        setIsLoading(false);
        return { success: false, error: result.error };
      }

      if (result.data) {
        
        // Update user state IMMEDIATELY
        const newUser: User = {
          id: result.data.user_id,
          email: result.data.email,
          role: normalizeUserRole(result.data.role),
          name: result.data.name,
        };
        
        setUser(newUser);
        
        // Fetch full profile with picture
        // Use setTimeout to ensure token is stored before API call
        setTimeout(async () => {
          await refreshUser();
        }, 100);
        
        setIsLoading(false);
        return { success: true, role: normalizeUserRole(result.data.role) };
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'Login failed' };
    }
    
    setIsLoading(false);
    return { success: false, error: 'Unknown error' };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "admin" | "employee"
  ) => {
    const result = await apiRegister(name, email, password, role);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  };

  const logout = async () => {
    await apiLogout();
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        checkAuth,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
