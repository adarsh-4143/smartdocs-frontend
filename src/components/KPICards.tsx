"use client";

import React from "react";
import {
  FileCheck2,
  TrendingUp,
  FileCode,
  CheckCircle,
  FileClock,
  AlertTriangle,
} from "lucide-react";

interface KPICardsProps {
  kpiData: {
    totalDocuments: number;
    generatedThisMonth: number;
    templates: number;
    activeTemplates: number;
    draftDocuments: number;
    failedDocuments: number;
  };
}

export default function KPICards({ kpiData }: KPICardsProps) {
  const cards = [
    {
      id: "total",
      label: "Total Documents",
      value: kpiData.totalDocuments.toLocaleString(),
      growth: "↑ 12.5% this month",
      growthColor: "text-emerald-400 bg-emerald-950/50 border-emerald-500/20",
      icon: FileCheck2,
      badgeBg: "bg-[#142338]",
      iconColor: "text-indigo-400",
    },
    {
      id: "month",
      label: "Generated This Month",
      value: kpiData.generatedThisMonth.toLocaleString(),
      growth: "↑ 8.2%",
      growthColor: "text-emerald-400 bg-emerald-950/50 border-emerald-500/20",
      icon: TrendingUp,
      badgeBg: "bg-[#112E3C]",
      iconColor: "text-cyan-400",
    },
    {
      id: "templates",
      label: "Templates",
      value: kpiData.templates,
      icon: FileCode,
      badgeBg: "bg-[#251A38]",
      iconColor: "text-purple-400",
    },
    {
      id: "active_templates",
      label: "Active Templates",
      value: kpiData.activeTemplates,
      icon: CheckCircle,
      badgeBg: "bg-[#103024]",
      iconColor: "text-emerald-400",
    },
    {
      id: "drafts",
      label: "Draft Documents",
      value: kpiData.draftDocuments,
      icon: FileClock,
      badgeBg: "bg-[#332A15]",
      iconColor: "text-amber-400",
    },
    {
      id: "failed",
      label: "Failed Documents",
      value: kpiData.failedDocuments,
      icon: AlertTriangle,
      badgeBg: "bg-[#3D1A25]",
      iconColor: "text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="glass-card glass-card-hover p-4.5 rounded-2xl flex flex-col justify-between min-h-[135px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl ${card.badgeBg} flex items-center justify-center border border-white/5`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>

              {card.growth && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.growthColor}`}
                >
                  {card.growth}
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                {card.label}
              </span>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
