"use client";

import React from "react";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";

interface StatItem {
  id: string;
  label: string;
  value: number | string;
  icon: React.ElementType;
  badgeBg: string;
  iconColor: string;
  borderColor: string;
}

interface StatCardsProps {
  statsData: {
    candidates: number;
    documents: number;
    pending: number;
    approved: number;
    sent: number;
    accepted: number;
    rejected: number;
  };
}

export default function StatCards({ statsData }: StatCardsProps) {
  const stats: StatItem[] = [
    {
      id: "candidates",
      label: "Total Candidates",
      value: statsData.candidates,
      icon: Users,
      badgeBg: "bg-[#1C1C36]",
      iconColor: "text-indigo-400",
      borderColor: "border-[#25254A]",
    },
    {
      id: "documents",
      label: "Total Documents",
      value: statsData.documents,
      icon: FileText,
      badgeBg: "bg-[#132E3E]",
      iconColor: "text-cyan-400",
      borderColor: "border-[#1A3D52]",
    },
    {
      id: "pending",
      label: "Pending Approvals",
      value: statsData.pending,
      icon: Clock,
      badgeBg: "bg-[#332A15]",
      iconColor: "text-amber-400",
      borderColor: "border-[#473B1D]",
    },
    {
      id: "approved",
      label: "Approved Documents",
      value: statsData.approved,
      icon: CheckCircle,
      badgeBg: "bg-[#123326]",
      iconColor: "text-emerald-400",
      borderColor: "border-[#194735]",
    },
    {
      id: "sent",
      label: "Sent Documents",
      value: statsData.sent,
      icon: Send,
      badgeBg: "bg-[#142940]",
      iconColor: "text-blue-400",
      borderColor: "border-[#1B3857]",
    },
    {
      id: "accepted",
      label: "Accepted Offers",
      value: statsData.accepted,
      icon: UserCheck,
      badgeBg: "bg-[#113338]",
      iconColor: "text-teal-400",
      borderColor: "border-[#17464D]",
    },
    {
      id: "rejected",
      label: "Rejected Offers",
      value: statsData.rejected,
      icon: XCircle,
      badgeBg: "bg-[#3A1926]",
      iconColor: "text-rose-400",
      borderColor: "border-[#4F2234]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between min-h-[125px]"
          >
            <div
              className={`w-9 h-9 rounded-full ${stat.badgeBg} flex items-center justify-center mb-3 border ${stat.borderColor}`}
            >
              <IconComponent className={`w-4 h-4 ${stat.iconColor}`} />
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                {stat.label}
              </span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {stat.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
