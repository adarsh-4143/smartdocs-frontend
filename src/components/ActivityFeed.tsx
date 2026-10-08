"use client";

import React from "react";
import { Sparkles, FileText, CheckCircle2, RefreshCw, Send, PlusCircle } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: "generated" | "updated" | "sent" | "created";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "generated":
        return { icon: FileText, bg: "bg-indigo-950/80 text-indigo-400 border-indigo-500/30" };
      case "updated":
        return { icon: RefreshCw, bg: "bg-cyan-950/80 text-cyan-400 border-cyan-500/30" };
      case "sent":
        return { icon: Send, bg: "bg-blue-950/80 text-blue-400 border-blue-500/30" };
      case "created":
        return { icon: PlusCircle, bg: "bg-purple-950/80 text-purple-400 border-purple-500/30" };
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full min-h-[380px]">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live corporate event stream
            </p>
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        {/* Timeline Items */}
        {activities.length > 0 ? (
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#1E2638]">
            {activities.map((act) => {
              const style = getIcon(act.type);
              const Icon = style.icon;
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Dot Badge */}
                  <div
                    className={`absolute -left-6 top-0 w-5 h-5 rounded-full ${style.bg} border flex items-center justify-center -translate-x-1/2`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{act.subtitle}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-1">
            <p>No recent system activity yet.</p>
            <p className="text-[10px] text-slate-600">Events will appear here as documents are generated.</p>
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-[#1E2638] text-[11px] text-slate-500 text-center font-mono">
        Showing real-time enterprise events
      </div>
    </div>
  );
}
