"use client";

import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";

export default function GenerationTrendChart() {
  const [timeframe, setTimeframe] = useState<"Today" | "7 Days" | "30 Days" | "3 Months" | "1 Year">("30 Days");
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; val: number } | null>(null);

  const timeframeData = {
    "Today": [
      { day: "00:00", val: 5 },
      { day: "04:00", val: 2 },
      { day: "08:00", val: 18 },
      { day: "12:00", val: 42 },
      { day: "16:00", val: 38 },
      { day: "20:00", val: 24 },
    ],
    "7 Days": [
      { day: "Mon", val: 18 },
      { day: "Tue", val: 26 },
      { day: "Wed", val: 32 },
      { day: "Thu", val: 45 },
      { day: "Fri", val: 39 },
      { day: "Sat", val: 12 },
      { day: "Sun", val: 14 },
    ],
    "30 Days": [
      { day: "Day 1", val: 12 },
      { day: "Day 5", val: 19 },
      { day: "Day 10", val: 28 },
      { day: "Day 15", val: 45 },
      { day: "Day 20", val: 32 },
      { day: "Day 25", val: 38 },
      { day: "Day 30", val: 48 },
    ],
    "3 Months": [
      { day: "May", val: 120 },
      { day: "Jun", val: 154 },
      { day: "Jul", val: 184 },
    ],
    "1 Year": [
      { day: "Q1", val: 340 },
      { day: "Q2", val: 480 },
      { day: "Q3", val: 590 },
      { day: "Q4", val: 710 },
    ],
  };

  const points = timeframeData[timeframe];
  const maxVal = Math.max(...points.map((p) => p.val)) * 1.2;

  // Generate SVG path string
  const svgWidth = 600;
  const svgHeight = 180;
  const stepX = svgWidth / (points.length - 1);

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
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden h-full min-h-[380px]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Document Generation Trend
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time volume tracking across time periods
          </p>
        </div>

        {/* Timeframe selector tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#0B0E1A] border border-[#1E2638] self-start sm:self-auto">
          {(["Today", "7 Days", "30 Days", "3 Months", "1 Year"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tf
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Area Line Chart */}
      <div className="relative flex-1 flex flex-col justify-end pt-4 pb-2">
        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-[#131929] border border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs shadow-xl z-20 flex items-center gap-2 animate-in fade-in">
            <span className="text-slate-400">{hoveredPoint.day}:</span>
            <span className="font-bold text-white">{hoveredPoint.val} Documents</span>
          </div>
        )}

        <div className="w-full h-48 relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
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
                  className="fill-indigo-500 stroke-[#090C15] stroke-2 group-hover:r-7 transition-all"
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
              {c.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
