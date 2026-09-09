"use client";

import React, { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import type { DataSource, DynamicField } from "@/types/dynamicField.types";

interface DynamicFieldsPanelProps {
  fields: DynamicField[];
  loading?: boolean;
  onInsert: (fieldKey: string) => void;
}

const GROUPS: DataSource[] = ["EMPLOYEE", "COMPANY", "PROFILE", "SYSTEM", "MANUAL"];

export default function DynamicFieldsPanel({ fields, loading, onInsert }: DynamicFieldsPanelProps) {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = fields.filter((field) => {
      if (!q) return true;
      return (
        field.fieldName?.toLowerCase().includes(q) ||
        field.fieldKey?.toLowerCase().includes(q) ||
        field.description?.toLowerCase().includes(q)
      );
    });
    return GROUPS.map((source) => ({
      source,
      items: filtered.filter((f) => f.dataSource === source),
    })).filter((g) => g.items.length > 0);
  }, [fields, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-[#1E2638]">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Dynamic Fields</p>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-full bg-[#141A2C] border border-[#202B44] rounded-md pl-8 pr-2 py-1.5 text-[11px] text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
        {loading && <p className="text-[11px] text-slate-500">Loading fields...</p>}
        {!loading && grouped.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-8">No fields match this template.</p>
        )}
        {grouped.map((group) => (
          <div key={group.source}>
            <p className="text-[10px] font-bold tracking-wider text-slate-500 mb-1.5">{group.source}</p>
            <div className="space-y-1">
              {group.items.map((field) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/hrms-field", field.fieldKey);
                    e.dataTransfer.setData("text/plain", `{{${field.fieldKey}}}`);
                  }}
                  className="group flex items-start justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-[#151C2F] cursor-grab"
                >
                  <button type="button" onClick={() => onInsert(field.fieldKey)} className="text-left flex-1 min-w-0">
                    <p className="text-[12px] text-slate-200 truncate">{field.fieldName}</p>
                    <p className="text-[10px] font-mono text-indigo-300/80 truncate">{`{{${field.fieldKey}}}`}</p>
                    {field.defaultValue && (
                      <p className="text-[10px] text-slate-500 truncate">Preview: {field.defaultValue}</p>
                    )}
                  </button>
                  <button
                    type="button"
                    title="Copy placeholder"
                    onClick={() => navigator.clipboard.writeText(`{{${field.fieldKey}}}`)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
