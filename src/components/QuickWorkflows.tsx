"use client";

import React from "react";
import {
  UserPlus,
  FileCode2,
  ArrowRight,
  Database,
  Sliders,
  CheckCircle2,
} from "lucide-react";

interface QuickWorkflowsProps {
  onOpenCandidateModal: () => void;
  onOpenTemplateModal: () => void;
}

export default function QuickWorkflows({
  onOpenCandidateModal,
  onOpenTemplateModal,
}: QuickWorkflowsProps) {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full min-h-[380px]">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight mb-1">
          Quick Workflows
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Common administrative actions
        </p>

        {/* Workflow Cards */}
        <div className="space-y-4">
          {/* Card 1: Add New Candidate */}
          <button
            onClick={onOpenCandidateModal}
            className="w-full text-left p-4 rounded-xl bg-[#121828] hover:bg-[#182035] border border-[#1E2638] hover:border-indigo-500/40 transition-all duration-200 group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1B1E38] text-indigo-400 border border-[#2B2E54] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Add New Candidate
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Store profile & compensation
                </p>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Card 2: Create Template */}
          <button
            onClick={onOpenTemplateModal}
            className="w-full text-left p-4 rounded-xl bg-[#121828] hover:bg-[#182035] border border-[#1E2638] hover:border-cyan-500/40 transition-all duration-200 group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#132A3A] text-cyan-400 border border-[#1F415A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Create Template
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure variables & layout
                </p>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* Bottom MySQL DB Status Card (Exact match from screenshot!) */}
      <div className="mt-6 pt-4 border-t border-[#1E2638]">
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#111626] to-[#0D121F] border border-[#1E273C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Database className="w-4 h-4" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0D121F] animate-pulse"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-200">
                  MySQL Database Active
                </h4>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                  14ms
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Host: 127.0.0.1:3306 | Schema: SmartDocs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
