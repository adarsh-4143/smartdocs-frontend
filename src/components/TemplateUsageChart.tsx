"use client";

import React from "react";
import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";

interface TemplateUsageChartProps {
  templateUsage?: Array<{ name: string; count: number }>;
}

export default function TemplateUsageChart({ templateUsage }: TemplateUsageChartProps) {
  const barClasses = ["bg-[#3f5f59]", "bg-[#4a6f68]", "bg-[#6d8f87]", "bg-[#7d9e97]", "bg-[#8aa8a1]"];

  const rawMax =
    templateUsage && templateUsage.length > 0
      ? Math.max(...templateUsage.map((t) => t.count))
      : 10;
  const max = rawMax > 0 ? rawMax : 10;

  const templates =
    templateUsage && templateUsage.length > 0
      ? templateUsage.map((tpl, idx) => ({
          name: tpl.name,
          count: tpl.count,
          max,
          barClass: barClasses[idx % barClasses.length],
        }))
      : [
          { name: "Software Developer Offer Letter", count: 0, max: 10, barClass: "bg-[#3f5f59]" },
          { name: "BDE Offer Letter", count: 0, max: 10, barClass: "bg-[#4a6f68]" },
          { name: "Experience Letter", count: 0, max: 10, barClass: "bg-[#6d8f87]" },
          { name: "Salary Certificate", count: 0, max: 10, barClass: "bg-[#7d9e97]" },
          { name: "Intern Offer Letter", count: 0, max: 10, barClass: "bg-[#8aa8a1]" },
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
              Live preset usage frequencies from MySQL
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Horizontal Bar Chart List */}
        <div className="space-y-3.5 my-2">
          {templates.map((tpl) => {
            const widthPct = tpl.max > 0 ? `${(tpl.count / tpl.max) * 100}%` : "0%";
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
                    style={{ width: widthPct === "0%" && tpl.count > 0 ? "5%" : widthPct }}
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
        <Link href="/template-master" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors">
          <span>Manage All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
