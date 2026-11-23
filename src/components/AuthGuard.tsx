"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<"checking" | "authorized" | "redirecting">("checking");

  useEffect(() => {
    const isTokenValid = (rawToken: string | null): boolean => {
      if (!rawToken) return false;
      try {
        const parts = rawToken.split(".");
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };

    const token = localStorage.getItem("adminToken");
    const valid = isTokenValid(token);
    const currentPath = window.location.pathname;

    const isLoginPage =
      currentPath === "/login" ||
      currentPath === "/login/" ||
      currentPath.endsWith("/login/index.html");

    if (isLoginPage) {
      if (valid) {
        // Already logged in with valid token, go to dashboard
        window.location.replace("/");
      } else {
        if (token && !valid) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
        }
        setStatus("authorized");
      }
    } else {
      if (!valid) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setStatus("redirecting");
        window.location.replace(token ? "/login?expired=true" : "/login/");
      } else {
        setStatus("authorized");
      }
    }
  }, []);

  if (status === "checking" || status === "redirecting") {
    return (
      <div className="min-h-screen w-full bg-[#070911] flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>{status === "redirecting" ? "Redirecting to login..." : "Verifying admin session..."}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
