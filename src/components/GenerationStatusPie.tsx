"use client";

import React from "react";
import { Activity } from "lucide-react";

interface GenerationStatusPieProps {
  statusDistribution?: {
    completed: number;
    pending: number;
    failed: number;
  };
}

export default function GenerationStatusPie({ statusDistribution }: GenerationStatusPieProps) {
  const completed = statusDistribution?.completed || 0;
  const pending = statusDistribution?.pending || 0;
  const failed = statusDistribution?.failed || 0;
  const total = completed + pending + failed;

  const effTotal = total > 0 ? total : 1;

  const completedPct = total > 0 ? Math.round((completed / effTotal) * 100) : 100;
  const pendingPct = total > 0 ? Math.round((pending / effTotal) * 100) : 0;
  const failedPct = total > 0 ? Math.round((failed / effTotal) * 100) : 0;

  const statuses = [
    { label: "Completed (Generated)", count: completed, percentage: completedPct, color: "bg-emerald-500", textColor: "text-emerald-400" },
    { label: "Processing / Pending", count: pending, percentage: pendingPct, color: "bg-amber-500", textColor: "text-amber-400" },
    { label: "Failed", count: failed, percentage: failedPct, color: "bg-rose-500", textColor: "text-rose-400" },
  ];

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full min-h-[340px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Generation Status Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live MySQL document status breakdown
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="my-4">
          <div className="w-full h-4 rounded-xl overflow-hidden flex bg-[#121828] p-0.5 border border-[#1E2638]">
            {statuses.map((st) => (
              <div
                key={st.label}
                style={{ width: `${st.percentage}%` }}
                className={`h-full ${st.color} first:rounded-l-lg last:rounded-r-lg shadow-sm transition-all duration-300`}
                title={`${st.label}: ${st.count} (${st.percentage}%)`}
              ></div>
            ))}
          </div>
        </div>

        {/* Status Legend Breakdown */}
        <div className="space-y-2.5">
          {statuses.map((st) => (
            <div key={st.label} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#0F1424] border border-[#1E2638]">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${st.color}`}></span>
                <span className="text-slate-200 font-medium">{st.label}</span>
              </div>
              <span className={`font-mono font-bold ${st.textColor}`}>
                {st.count} ({st.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>MySQL Pipeline Sync</span>
        <span className="text-emerald-400 font-bold">{completedPct}% Success Rate</span>
      </div>
    </div>
  );
}
