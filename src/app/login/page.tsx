"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import DocumentScene from "@/components/login/DocumentScene";
import "./login.css";

export default function AdminLoginPage() {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "in" | "work">("idle");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedAdminUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("work");
      setFormOpen(true);
      return;
    }

    const sit = window.setTimeout(() => setPhase("in"), 80);
    const work = window.setTimeout(() => setPhase("work"), 520);
    const open = window.setTimeout(() => setFormOpen(true), 1180);
    return () => {
      window.clearTimeout(sit);
      window.clearTimeout(work);
      window.clearTimeout(open);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both username and password.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
      const response = await fetch(`${baseUrl}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid username or password");
      }

      if (rememberMe) {
        localStorage.setItem("rememberedAdminUsername", username.trim());
      } else {
        localStorage.removeItem("rememberedAdminUsername");
      }

      if (data.data?.token) {
        localStorage.setItem("adminToken", data.data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.data.admin));
      }

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        window.location.replace("/");
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell" data-theme={theme}>
      <div className="absolute top-4 right-4 z-20">
        <button type="button" onClick={toggleTheme} className="login-theme-btn" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="login-stage">
        <div className="login-stage-inner">
        <div className="login-copy">
          <p className="login-kicker text-[11px] font-semibold uppercase tracking-[0.18em] mb-2">DOCGEN</p>
          <h1 className="login-title text-[32px] sm:text-[40px] font-semibold leading-tight">
            Every letter leaves this desk.
          </h1>
          <p className="login-muted mt-3 text-[15px] leading-relaxed max-w-[420px]">
            Create it. Check it. Send it — all from one sign-in.
          </p>
          <div className="mt-5 w-full">
            <DocumentScene phase={phase} />
          </div>
        </div>

        <div className={`login-form w-full ${formOpen ? "is-open" : ""}`}>
          <div className="login-card rounded-2xl p-8 sm:p-10">
            <div className="mb-6">
              <h2 className="login-title text-xl font-semibold">Admin sign in</h2>
              <p className="login-muted text-sm mt-1">Use your office credentials to continue.</p>
            </div>

            {error && (
              <div className="login-alert-error mb-5 p-3 rounded-xl flex items-start gap-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="login-alert-ok mb-5 p-3 rounded-xl flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className={`login-field ${username ? "is-filled" : ""}`}>
                <User className="login-field-icon w-4 h-4" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=" "
                  className="login-input"
                  disabled={loading}
                  autoComplete="username"
                />
                <label htmlFor="login-username" className="login-float">
                  Username
                </label>
              </div>

              <div className={`login-field login-field-password ${password ? "is-filled" : ""}`}>
                <Lock className="login-field-icon w-4 h-4" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="login-input"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <label htmlFor="login-password" className="login-float">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--login-muted)" }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className="login-muted flex items-center gap-2 text-xs cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[#3f5f59] cursor-pointer"
                />
                Remember me
              </label>

              <button
                type="submit"
                disabled={loading}
                className="login-submit w-full font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
