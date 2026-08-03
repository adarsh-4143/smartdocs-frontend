"use client";

import React from "react";
import { Layers, ArrowRight } from "lucide-react";

export default function TemplateUsageChart() {
  const templates = [
    { name: "Software Developer Offer Letter", count: 182, max: 200, barClass: "bg-gradient-to-r from-indigo-600 to-blue-500" },
    { name: "BDE Offer Letter", count: 121, max: 200, barClass: "bg-gradient-to-r from-blue-500 to-cyan-400" },
    { name: "Experience Letter", count: 82, max: 200, barClass: "bg-gradient-to-r from-cyan-400 to-teal-400" },
    { name: "Salary Certificate", count: 64, max: 200, barClass: "bg-gradient-to-r from-purple-500 to-indigo-500" },
    { name: "Intern Offer Letter", count: 51, max: 200, barClass: "bg-gradient-to-r from-slate-400 to-indigo-400" },
  ];

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full min-h-[340px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Most Used Templates
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preset frequency across all corporate departments
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Horizontal Bar Chart List */}
        <div className="space-y-3.5 my-2">
          {templates.map((tpl) => {
            const widthPct = `${(tpl.count / tpl.max) * 100}%`;
            return (
              <div key={tpl.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 truncate pr-2">
                    {tpl.name}
                  </span>
                  <span className="font-mono font-bold text-white shrink-0">
                    {tpl.count}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-[#121828] rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    style={{ width: widthPct }}
                    className={`h-full rounded-full ${tpl.barClass} shadow-sm transition-all duration-500`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-[11px] text-slate-400">
        <span>Template Presets Active</span>
        <button className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors">
          <span>Manage All</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
