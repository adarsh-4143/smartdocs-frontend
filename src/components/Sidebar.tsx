"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  FileSpreadsheet,
  FormInput,
  FileCode2,
  PenTool,
  FileOutput,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = React.useState<string>("Admin");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("adminUser");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj.username) setAdminName(userObj.username);
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/login");
  };

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      href: "/company",
      label: "Company",
      icon: Building2,
      isActive: pathname === "/company" || pathname?.startsWith("/company"),
    },
    {
      href: "/profile",
      label: "Profiles",
      icon: UserCheck,
      isActive: pathname === "/profile" || pathname?.startsWith("/profile"),
    },
    {
      href: "/document-type",
      label: "Document Types",
      icon: FileSpreadsheet,
      isActive: pathname === "/document-type" || pathname?.startsWith("/document-type"),
    },
    {
      href: "/dynamic-field",
      label: "Dynamic Fields",
      icon: FormInput,
      isActive: pathname === "/dynamic-field" || pathname?.startsWith("/dynamic-field"),
    },
    {
      href: "/template-master",
      label: "Template Master",
      icon: FileCode2,
      isActive: pathname === "/template-master" || pathname?.startsWith("/template-master"),
    },
    {
      href: "/template-builder",
      label: "Template Builder",
      icon: PenTool,
      isActive: pathname === "/template-builder" || pathname?.startsWith("/template-builder"),
    },
    {
      href: "/document-generation",
      label: "Document Generation",
      icon: FileOutput,
      isActive:
        pathname === "/document-generation" ||
        pathname?.startsWith("/document-generation"),
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0A0D17] border-r border-[#1E2638] transition-all duration-300 ease-in-out flex flex-col justify-between ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div
          className={`border-b border-[#1E2638] transition-all ${
            collapsed
              ? "py-4 px-2 flex flex-col items-center gap-3"
              : "h-20 px-4 flex items-center justify-between"
          }`}
        >
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#121829] border border-[#232D42] shadow-lg shadow-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="DOCGEN Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-300 truncate">
                  DOCGEN
                </span>
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-semibold truncate">
                  Universal Engine
                </span>
              </div>
            )}
          </Link>

          {/* Toggle Collapse & Theme Buttons */}
          <div className="flex items-center gap-2">
            {!collapsed && <ThemeToggle className="scale-90" />}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className={`rounded-lg bg-[#141A29] hover:bg-[#1E2638] text-slate-400 hover:text-white transition-all border border-[#232D42] shrink-0 flex items-center justify-center ${
                collapsed ? "w-8 h-8 mt-1" : "p-1.5"
              }`}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  item.isActive
                    ? "bg-gradient-to-r from-indigo-600/20 to-blue-600/10 text-white border border-indigo-500/30 shadow-md shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#131929]"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-[#182032] text-slate-400 group-hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#141A29] text-white text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-[#232D42] z-50">
                    {item.label}
                  </div>
                )}

                {item.isActive && !collapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Admin Profile & Logout */}
      <div className="p-3 border-t border-[#1E2638]">
        {!collapsed ? (
          <div className="bg-[#121726] p-3 rounded-xl border border-[#1E2638] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/30 shrink-0 bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-300">
                {adminName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate capitalize">
                  {adminName}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" /> Admin Session
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300"
              title={`Logged in as ${adminName}`}
            >
              {adminName.substring(0, 2).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
