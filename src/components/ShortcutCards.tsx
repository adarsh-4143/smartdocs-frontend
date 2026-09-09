"use client";

import React from "react";
import {
  FilePlus,
  FileCode2,
  UserPlus,
  Building2,
  FolderKanban,
  Files,
  ArrowUpRight,
} from "lucide-react";

interface ShortcutCardsProps {
  onOpenModal: (type: "document" | "template" | "employee" | "company") => void;
  onScrollToTable: () => void;
}

export default function ShortcutCards({
  onOpenModal,
  onScrollToTable,
}: ShortcutCardsProps) {
  const shortcuts = [
    {
      id: "generate",
      title: "Generate Document",
      desc: "Quickly generate a new document",
      icon: FilePlus,
      onClick: () => onOpenModal("document"),
    },
    {
      id: "create_template",
      title: "Create Template",
      desc: "Create a new document template",
      icon: FileCode2,
      onClick: () => onOpenModal("template"),
    },
    {
      id: "add_employee",
      title: "Add Employee",
      desc: "Add employee / recipient details",
      icon: UserPlus,
      onClick: () => onOpenModal("employee"),
    },
    {
      id: "add_company",
      title: "Add Company",
      desc: "Add / manage company scope",
      icon: Building2,
      onClick: () => onOpenModal("company"),
    },
    {
      id: "manage_templates",
      title: "Manage Templates",
      desc: "Go directly to template presets",
      icon: FolderKanban,
      onClick: () => onOpenModal("template"),
    },
    {
      id: "view_documents",
      title: "Generated Documents",
      desc: "View all generated documents",
      icon: Files,
      onClick: onScrollToTable,
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions & Operations
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {shortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={sc.onClick}
              className="glass-card p-4 rounded-xl text-left border border-[#1E2638] hover:border-[#3f5f59]/50 transition-all duration-200 group flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="dash-icon-box group-hover:scale-110 transition-transform">
                  <Icon />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-white mb-0.5 truncate">
                  {sc.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                  {sc.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
