"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Eye, EyeClosed, ArrowRight, Loader2, ServerCrash } from "lucide-react";
import { getApiBaseUrl, setAuth } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverWaking, setServerWaking] = useState(false);
  const router = useRouter();

  // 2️⃣ Auto-redirect if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (token && role) {
      if (role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/employee-dashboard";
      }
    }
  }, []);

  // 3️⃣ Ping server on mount so Railway wakes up before the user even clicks Login
  useEffect(() => {
    let cancelled = false;

    const wakeAndPoll = async () => {
      // Step 1: no-cors fire-and-forget to wake Railway without hitting CORS error
      // (Railway's sleeping proxy returns 502 with no CORS headers; no-cors ignores that)
      try {
        await fetch(`${getApiBaseUrl()}/health`, { method: "GET", mode: "no-cors", cache: "no-store" });
      } catch {}

      // Step 2: poll with normal CORS fetch until FastAPI is actually up
      for (let attempt = 0; attempt < 15; attempt++) {
        if (cancelled) break;
        if (attempt === 1) setServerWaking(true); // show "waking up" banner after first retry
        try {
          const res = await fetch(`${getApiBaseUrl()}/health`, { signal: AbortSignal.timeout(5000) });
          if (res.ok) { setServerWaking(false); return; }
        } catch {}
        await new Promise(r => setTimeout(r, 4000));
      }
      if (!cancelled) setServerWaking(false);
    };

    wakeAndPoll();
    return () => { cancelled = true; };
  }, []);

  // 1️⃣ Login handler with direct fetch
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPendingMessage("");
    setIsSubmitting(true);

    try {
      const controller = new AbortController();
      const t1 = setTimeout(() => controller.abort(), 35000);
      let res: Response;
      try {
        res = await fetch(`${getApiBaseUrl()}/auth/login/json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        clearTimeout(t1);
      } catch (fetchErr: any) {
        clearTimeout(t1);
        if (fetchErr.name === "AbortError") {
          // retry once for cold start
          const res2 = await fetch(`${getApiBaseUrl()}/auth/login/json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          res = res2;
        } else {
          throw fetchErr;
        }
      }

      if (!res.ok) {
        let detail = "Login failed";
        try {
          const errorData = await res.json();
          detail = errorData?.detail || detail;
          console.error("Login failed:", errorData);
        } catch {
          const errorText = await res.text().catch(() => "");
          if (errorText) {
            if (/ECONNREFUSED|Failed to proxy|Bad Gateway|502/i.test(errorText)) {
              detail = "Cannot reach API server. Start backend and try again.";
            } else {
              detail = `Login failed (${res.status})`;
            }
          }
          console.error("Login failed with non-JSON response:", errorText || `status ${res.status}`);
        }
        if (res.status === 403) {
          setPendingMessage(detail || "Your account is pending admin approval.");
          setIsSubmitting(false);
          return;
        }
        throw new Error(detail || "Invalid credentials");
      }

      const data = await res.json();

      // Ensure role exists
      if (!data.role) {
        console.error("Role missing in response");
        setError("Login failed: Role information missing");
        setIsSubmitting(false);
        return;
      }

      // Store token, role, and user data — AND set the access_token cookie so
      // the Next.js middleware can protect /admin/* routes without redirecting
      // back to /login on every navigation.
      setAuth(data.access_token, {
        user_id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role,
      });

      // Redirect based on role using window.location for full page reload
      if (data.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/employee-dashboard";
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err?.message || "";
      if (msg === "Failed to fetch" || err?.name === "TypeError") {
        setError(
          "Cannot reach the API. In development, start the backend in another terminal: cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
        );
      } else {
        setError(msg || "An unexpected error occurred");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-shell">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="login-page-logo">
          <div className="login-page-logo-mark">
            <Zap size={20} className="text-white" />
          </div>
          <span className="login-page-brand-name">
            WorkForce <span className="login-page-brand-pro">Pro</span>
          </span>
        </div>

        {/* Card */}
        <div className="login-page-card">
          <div className="text-center mb-8">
            <h1 className="login-page-title">Welcome back</h1>
            <p className="login-page-subtitle">Sign in to your account to continue</p>
          </div>

          {serverWaking && (
            <div className="mb-5 p-3 rounded-xl flex items-center gap-3 border border-amber-400/40 bg-amber-500/10 text-amber-300 text-xs">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>Server is waking up (free tier cold start). Login will work in ~20 seconds…</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-xl glass-light bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {pendingMessage && (
            <div className="mb-6 p-4 rounded-xl border-2 border-purple-400/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <span className="text-lg">⏳</span>
                Account Pending Approval
              </div>
              <p>{pendingMessage}</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Please wait until an administrator approves your request.</p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="login-page-label">Email</label>
              <div className="relative">
                <Mail size={16} className="login-page-field-icon" />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-page-input text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="login-page-label">Password</label>
              <div className="login-page-password-wrap">
                <div className="relative flex-1">
                  <Lock size={16} className="login-page-field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-page-input text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="login-page-password-toggle"
                >
                  {showPassword ? <Eye size={16} /> : <EyeClosed size={16} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="login-page-meta-row">
              <label className="login-page-remember">
                <input type="checkbox" className="login-page-checkbox" />
                <span>Remember me</span>
              </label>
              <Link href="#" className="login-page-forgot">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="login-page-submit w-full inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-page-signup">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="login-page-signup-link">Sign up</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
