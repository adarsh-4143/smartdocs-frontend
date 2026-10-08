"use client";

import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";

interface GenerationTrendChartProps {
  monthlyStats?: Array<{ month: string; count: number }>;
}

export default function GenerationTrendChart({ monthlyStats }: GenerationTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; val: number } | null>(null);

  const points =
    monthlyStats && monthlyStats.length > 0
      ? monthlyStats.map((item) => ({ day: item.month, val: item.count }))
      : [
          { day: "May", val: 0 },
          { day: "Jun", val: 0 },
          { day: "Jul", val: 0 },
          { day: "Aug", val: 0 },
          { day: "Sep", val: 0 },
          { day: "Oct", val: 0 },
        ];

  const rawMax = Math.max(...points.map((p) => p.val));
  const maxVal = rawMax > 0 ? rawMax * 1.25 : 10;

  // Generate SVG path string
  const svgWidth = 600;
  const svgHeight = 180;
  const stepX = points.length > 1 ? svgWidth / (points.length - 1) : svgWidth;

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: svgHeight - (p.val / maxVal) * svgHeight,
    ...p,
  }));

  // Create smooth SVG cubic bezier path
  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const mx = (curr.x + next.x) / 2;
    pathD += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaPathD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden h-full min-h-[360px]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Document Generation Trend (MySQL Live)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monthly generation volume calculated directly from database records
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold">
          <span>Live 6-Month Trend</span>
        </div>
      </div>

      {/* SVG Area Line Chart */}
      <div className="relative flex-1 flex flex-col justify-end pt-4 pb-2">
        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-[#131929] border border-[#3f5f59]/40 px-3 py-1.5 rounded-lg text-xs shadow-xl z-20 flex items-center gap-2 animate-in fade-in">
            <span className="text-slate-400">{hoveredPoint.day}:</span>
            <span className="font-bold text-white">{hoveredPoint.val} Documents</span>
          </div>
        )}

        <div className="w-full h-44 relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f5f59" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#8aa8a1" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3f5f59" />
                <stop offset="50%" stopColor="#6d8f87" />
                <stop offset="100%" stopColor="#8aa8a1" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="0" x2={svgWidth} y2="0" stroke="#1E2638" strokeDasharray="4 4" />
            <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="#1E2638" strokeDasharray="4 4" />
            <line x1="0" y1={svgHeight} x2={svgWidth} y2={svgHeight} stroke="#1E2638" />

            {/* Filled Area */}
            <path d={areaPathD} fill="url(#glowGradient)" />

            {/* Stroke Line */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {coords.map((c, i) => (
              <g key={i} className="group cursor-pointer">
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="5"
                  className="fill-[#3f5f59] stroke-[#fffdf8] stroke-2 group-hover:r-7 transition-all"
                  onMouseEnter={() => setHoveredPoint({ day: c.day, val: c.val })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-[#1E2638]">
          {coords.map((c, i) => (
            <span key={i} className="font-mono text-[11px]">
              {c.day} ({c.val})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
