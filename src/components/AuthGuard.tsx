"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<"checking" | "authorized" | "redirecting">("checking");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const currentPath = window.location.pathname;

    const isLoginPage =
      currentPath === "/login" ||
      currentPath === "/login/" ||
      currentPath.endsWith("/login/index.html");

    if (isLoginPage) {
      if (token) {
        // Already logged in, go to dashboard
        window.location.replace("/");
      } else {
        setStatus("authorized");
      }
    } else {
      if (!token) {
        setStatus("redirecting");
        window.location.replace("/login/");
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
