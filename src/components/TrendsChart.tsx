"use client";

import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";

interface MonthData {
  month: string;
  generated: number;
  accepted: number;
}

export default function TrendsChart() {
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);

  const monthlyData: MonthData[] = [
    { month: "Jan", generated: 32, accepted: 24 },
    { month: "Feb", generated: 48, accepted: 36 },
    { month: "Mar", generated: 42, accepted: 35 },
    { month: "Apr", generated: 65, accepted: 52 },
    { month: "May", generated: 58, accepted: 49 },
    { month: "Jun", generated: 76, accepted: 64 },
    { month: "Jul", generated: 92, accepted: 78 },
  ];

  const maxVal = 100;

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Offer Generation & Acceptance Trends
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monthly conversion rate overview
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+24.8% growth</span>
        </div>
      </div>

      {/* Interactive Tooltip Overlay */}
      {hoveredMonth && (
        <div className="absolute top-16 right-6 bg-[#121828] border border-indigo-500/30 px-3.5 py-2 rounded-xl text-xs shadow-2xl z-20 flex items-center gap-4 animate-in fade-in duration-150">
          <span className="font-bold text-slate-200">{hoveredMonth.month} Data:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            <span className="text-slate-300">Generated:</span>
            <span className="font-bold text-white">{hoveredMonth.generated}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span className="text-slate-300">Accepted:</span>
            <span className="font-bold text-white">{hoveredMonth.accepted}</span>
          </div>
        </div>
      )}

      {/* Chart Bars Grid */}
      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-6 pt-8 pb-4 px-2 border-b border-[#1E2638]">
        {monthlyData.map((item) => {
          const genHeight = `${(item.generated / maxVal) * 100}%`;
          const accHeight = `${(item.accepted / maxVal) * 100}%`;

          return (
            <div
              key={item.month}
              onMouseEnter={() => setHoveredMonth(item)}
              onMouseLeave={() => setHoveredMonth(null)}
              className="flex-1 flex flex-col items-center gap-3 h-full justify-end group cursor-pointer"
            >
              {/* Twin Bars */}
              <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-56">
                {/* Purple Bar - Generated */}
                <div
                  style={{ height: genHeight }}
                  className="w-1/2 max-w-[28px] bar-purple rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                ></div>
                {/* Cyan Bar - Accepted */}
                <div
                  style={{ height: accHeight }}
                  className="w-1/2 max-w-[28px] bar-cyan rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                ></div>
              </div>

              {/* Month Label */}
              <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-4 px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bar-purple"></div>
            <span>Offers Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bar-cyan"></div>
            <span>Offers Accepted</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Hover bars for detailed breakdown</span>
        </div>
      </div>
    </div>
  );
}
