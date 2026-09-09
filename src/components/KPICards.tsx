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
      icon: FileCheck2,
    },
    {
      id: "month",
      label: "Generated This Month",
      value: kpiData.generatedThisMonth.toLocaleString(),
      growth: "↑ 8.2%",
      icon: TrendingUp,
    },
    {
      id: "templates",
      label: "Templates",
      value: kpiData.templates,
      icon: FileCode,
    },
    {
      id: "active_templates",
      label: "Active Templates",
      value: kpiData.activeTemplates,
      icon: CheckCircle,
    },
    {
      id: "drafts",
      label: "Draft Documents",
      value: kpiData.draftDocuments,
      icon: FileClock,
    },
    {
      id: "failed",
      label: "Failed Documents",
      value: kpiData.failedDocuments,
      icon: AlertTriangle,
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
              <div className="dash-icon-box">
                <Icon />
              </div>

              {card.growth && (
                <span className="dash-growth">{card.growth}</span>
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
