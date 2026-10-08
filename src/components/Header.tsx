"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, ChevronDown, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface HeaderProps {
  onOpenGenerateModal: () => void;
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  companies: string[];
}

export default function Header({
  onOpenGenerateModal,
  selectedCompany,
  setSelectedCompany,
  companies,
}: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/login");
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          Document Operations Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Universal Corporate Document Generation, Templates & Distribution Engine
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Header Logout Button */}
        <button
          onClick={handleLogout}
          title="Logout Admin"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Company Switcher Dropdown (Multi-Tenant Support) */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-200 text-sm font-medium border border-[#1E2638] transition-all shadow-sm group"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-100">{selectedCompany}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0F1422] border border-[#1E2638] rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-xl">
              <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 border-b border-[#1A2234]">
                Active Company Scope
              </div>
              {companies.map((company) => (
                <button
                  key={company}
                  onClick={() => {
                    setSelectedCompany(company);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCompany === company
                      ? "bg-indigo-600/20 text-indigo-300 font-bold border-l-2 border-indigo-500"
                      : "text-slate-300 hover:bg-[#182033]"
                  }`}
                >
                  <span>{company}</span>
                  {selectedCompany === company && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Generate Document Action Button */}
        <Link
          href="/document-generation"
          className="gradient-btn flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Generate Document</span>
        </Link>
      </div>
    </header>
  );
}
