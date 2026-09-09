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
    },
    {
      id: "documents",
      label: "Total Documents",
      value: statsData.documents,
      icon: FileText,
    },
    {
      id: "pending",
      label: "Pending Approvals",
      value: statsData.pending,
      icon: Clock,
    },
    {
      id: "approved",
      label: "Approved Documents",
      value: statsData.approved,
      icon: CheckCircle,
    },
    {
      id: "sent",
      label: "Sent Documents",
      value: statsData.sent,
      icon: Send,
    },
    {
      id: "accepted",
      label: "Accepted Offers",
      value: statsData.accepted,
      icon: UserCheck,
    },
    {
      id: "rejected",
      label: "Rejected Offers",
      value: statsData.rejected,
      icon: XCircle,
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
            <div className="dash-icon-box mb-3 rounded-full">
              <IconComponent />
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
