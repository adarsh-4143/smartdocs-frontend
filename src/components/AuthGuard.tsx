"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Perform authentication check
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    if (pathname === "/login") {
      // If user is already logged in and visits /login, send them to dashboard
      if (token) {
        router.replace("/");
      } else {
        setAuthorized(true);
      }
    } else {
      // For any other page, token is required
      if (!token) {
        setAuthorized(false);
        router.replace("/login");
      } else {
        setAuthorized(true);
      }
    }

    setChecking(false);
  }, [pathname, router]);

  // Show smooth splash screen while checking authentication status
  if (checking) {
    return (
      <div className="min-h-screen w-full bg-[#070911] flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  // Prevent rendering protected content if unauthenticated
  if (!authorized && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
