"use client";

import React from "react";
import { Activity } from "lucide-react";

export default function GenerationStatusPie() {
  const statuses = [
    { label: "Generated", percentage: 78, color: "bg-emerald-500", textColor: "text-emerald-400" },
    { label: "Draft", percentage: 8, color: "bg-amber-500", textColor: "text-amber-400" },
    { label: "Sent", percentage: 7, color: "bg-[#3f5f59]", textColor: "text-[#3f5f59]" },
    { label: "Processing", percentage: 5, color: "bg-[#6d8f87]", textColor: "text-[#6d8f87]" },
    { label: "Failed", percentage: 2, color: "bg-rose-500", textColor: "text-rose-400" },
  ];

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full min-h-[340px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Generation Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pipeline health & queue state
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
                className={`h-full ${st.color} first:rounded-l-lg last:rounded-r-lg shadow-sm`}
                title={`${st.label}: ${st.percentage}%`}
              ></div>
            ))}
          </div>
        </div>

        {/* Status Legend Breakdown */}
        <div className="space-y-2.5">
          {statuses.map((st) => (
            <div key={st.label} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0F1424] border border-[#1E2638]">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${st.color}`}></span>
                <span className="text-slate-200 font-medium">{st.label}</span>
              </div>
              <span className={`font-mono font-bold ${st.textColor}`}>
                {st.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Worker Pool: Healthy</span>
        <span className="text-emerald-400">99.8% Success Rate</span>
      </div>
    </div>
  );
}
