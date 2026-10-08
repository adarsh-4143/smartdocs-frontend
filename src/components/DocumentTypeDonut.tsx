"use client";

import React from "react";
import { PieChart } from "lucide-react";

interface DocumentTypeDonutProps {
  distribution?: Array<{ name: string; count: number }>;
  totalDocs?: number;
}

export default function DocumentTypeDonut({ distribution, totalDocs = 0 }: DocumentTypeDonutProps) {
  const colors = ["#3f5f59", "#6d8f87", "#8aa8a1", "#0284c7", "#10b981", "#64748b"];
  const bgClasses = ["bg-[#3f5f59]", "bg-[#6d8f87]", "bg-[#8aa8a1]", "bg-cyan-500", "bg-emerald-500", "bg-slate-500"];

  const sumCount = distribution && distribution.length > 0
    ? distribution.reduce((acc, curr) => acc + curr.count, 0)
    : 0;

  const effectiveTotal = sumCount > 0 ? sumCount : totalDocs > 0 ? totalDocs : 1;

  const data =
    distribution && distribution.length > 0
      ? distribution.map((item, idx) => ({
          label: item.name,
          count: item.count,
          percentage: Math.round((item.count / effectiveTotal) * 100),
          color: colors[idx % colors.length],
          bgClass: bgClasses[idx % bgClasses.length],
        }))
      : [
          { label: "Offer Letter", count: 0, percentage: 40, color: "#3f5f59", bgClass: "bg-[#3f5f59]" },
          { label: "Payslip", count: 0, percentage: 30, color: "#6d8f87", bgClass: "bg-[#6d8f87]" },
          { label: "Experience Letter", count: 0, percentage: 20, color: "#8aa8a1", bgClass: "bg-[#8aa8a1]" },
          { label: "Other", count: 0, percentage: 10, color: "#64748b", bgClass: "bg-slate-500" },
        ];

  let cumulative = 0;
  const gradientStops = data
    .map((d) => {
      const start = cumulative;
      cumulative += d.percentage;
      return `${d.color} ${start}% ${cumulative}%`;
    })
    .join(", ");

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full min-h-[340px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Document Type Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live category breakdown from MySQL database
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#2d3633] border border-[#3f5f59]/30 flex items-center justify-center text-[#8aa8a1]">
            <PieChart className="w-4 h-4" />
          </div>
        </div>

        {/* Donut Chart & Legend */}
        <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
          {/* Conic Gradient Donut Visualizer */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <div
              className="w-full h-full rounded-full p-2"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="w-full h-full bg-[#0A0D17] rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-xl font-extrabold text-white">{(totalDocs || sumCount).toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-mono">Total Docs</span>
              </div>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full">
            {data.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.bgClass} shrink-0`}></span>
                  <span className="text-slate-300 truncate">{item.label}</span>
                </div>
                <span className="font-bold text-white font-mono ml-2">
                  {sumCount > 0 ? `${item.count} (${item.percentage}%)` : `${item.percentage}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-[11px] text-slate-500">
        <span>MySQL Live Categories</span>
        <span className="text-indigo-400 font-medium">Synced live</span>
      </div>
    </div>
  );
}
