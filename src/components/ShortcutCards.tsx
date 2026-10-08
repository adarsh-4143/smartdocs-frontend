"use client";

import React from "react";
import Link from "next/link";
import {
  FilePlus,
  FileCode2,
  UserPlus,
  Building2,
  FolderKanban,
  Files,
  ArrowUpRight,
} from "lucide-react";

export default function ShortcutCards() {
  const shortcuts = [
    {
      id: "generate",
      title: "Generate Document",
      desc: "Go to document generator page",
      icon: FilePlus,
      href: "/document-generation",
    },
    {
      id: "create_template",
      title: "Create Template",
      desc: "Build new A4 template layout",
      icon: FileCode2,
      href: "/template-builder",
    },
    {
      id: "add_employee",
      title: "Add Profiles",
      desc: "Manage employee profiles",
      icon: UserPlus,
      href: "/profile",
    },
    {
      id: "add_company",
      title: "Add Company",
      desc: "Manage corporate entities",
      icon: Building2,
      href: "/company",
    },
    {
      id: "manage_templates",
      title: "Manage Templates",
      desc: "View preset master templates",
      icon: FolderKanban,
      href: "/template-master",
    },
    {
      id: "view_documents",
      title: "Generated History",
      desc: "View and print all documents",
      icon: Files,
      href: "/generated-history",
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
            <Link
              key={sc.id}
              href={sc.href}
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
