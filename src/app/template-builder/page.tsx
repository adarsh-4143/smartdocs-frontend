"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { templateMasterService } from "@/services/templateMaster.service";
import { TemplateMaster } from "@/types/templateMaster.types";
import {
  PenTool,
  Search,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Building2,
  FileSpreadsheet,
  UserCheck,
  Star,
  CheckCircle2,
  Clock,
  Ban,
  Archive,
  ArrowRight,
} from "lucide-react";

export default function TemplateBuilderDirectoryPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await templateMasterService.getAllTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error("Fetch templates error:", err);
      setError(err?.message || "Failed to load template masters directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleLaunchBuilder = (id?: string) => {
    const targetId = id || selectedTemplateId;
    if (!targetId) return;
    router.push(`/template-builder/${targetId}`);
  };

  const filteredTemplates = templates.filter((t) => {
    return (
      (t.templateName && t.templateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.templateCode && t.templateCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.version && t.version.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Template Builder Studio
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Phase 2 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select a Template Master to open the two-panel Tiptap rich-text editor and live A4 preview
              </p>
            </div>

            <button
              onClick={fetchTemplates}
              className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all self-start md:self-auto"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchTemplates}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[11px] text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Quick Select & Launch Card */}
          <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Quick Template Selector
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-[#121829] border border-[#202B44] rounded-xl px-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-lg"
              >
                {templates.length === 0 ? (
                  <option value="">No Template Masters Available</option>
                ) : (
                  <>
                    <option value="" disabled className="bg-[#0F1424]">Select a Template Master...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#0F1424]">
                        {t.templateName} ({t.templateCode}) — v{t.version || "1.0.0"}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <button
              onClick={() => handleLaunchBuilder()}
              disabled={!selectedTemplateId}
              className="gradient-btn flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-40 shrink-0 self-end md:self-auto"
            >
              <PenTool className="w-4 h-4" />
              <span>Open Template Builder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="glass-card p-4 rounded-2xl border border-[#1E2638] flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search templates by code, name, or version..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {filteredTemplates.length} of {templates.length} templates
            </span>
          </div>

          {/* Templates Directory Table */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-mono">Loading template records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Code</th>
                      <th className="py-3.5 px-4 font-bold">Template Name</th>
                      <th className="py-3.5 px-4 font-bold">Company</th>
                      <th className="py-3.5 px-4 font-bold">Document Category</th>
                      <th className="py-3.5 px-4 font-bold">Target Profile</th>
                      <th className="py-3.5 px-4 font-bold">Version</th>
                      <th className="py-3.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-[#121829] transition-colors group cursor-pointer"
                          onClick={() => handleLaunchBuilder(String(t.id))}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                            {t.templateCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {t.templateName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {t.company ? t.company.companyName : `Company #${t.companyId}`}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {t.documentType ? t.documentType.documentTypeName : `Type #${t.documentTypeId}`}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {t.profile ? t.profile.profileName : "All Profiles (Global)"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-cyan-300 font-semibold">
                            v{t.version || "1.0.0"}
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleLaunchBuilder(String(t.id))}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>Build Content</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No template master records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
