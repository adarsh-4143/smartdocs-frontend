"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  FONT_FAMILIES,
  FONT_GROUP_LABELS,
  matchFontFamily,
  type DesignerFont,
  type FontGroup,
} from "@/lib/documentDesigner/constants";

const GROUP_ORDER: FontGroup[] = ["sans", "serif", "display", "mono", "indic"];

interface FontPickerProps {
  value?: string | null;
  onChange: (font: DesignerFont) => void;
}

export default function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = matchFontFamily(value);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? FONT_FAMILIES.filter((font) => font.label.toLowerCase().includes(q) || font.name.toLowerCase().includes(q))
      : FONT_FAMILIES;
    return GROUP_ORDER.map((group) => ({
      group,
      label: FONT_GROUP_LABELS[group],
      fonts: filtered.filter((font) => font.group === group),
    })).filter((item) => item.fonts.length > 0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    searchRef.current?.focus();
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        title="Font"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="h-8 min-w-[168px] max-w-[220px] px-2 rounded-md bg-[#141A2C] border border-[#202B44] text-[11px] text-slate-200 flex items-center justify-between gap-2 hover:border-indigo-400/50"
      >
        <span className="truncate" style={{ fontFamily: current.value }}>
          {current.label}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl border border-[#202B44] bg-[#0F1422] shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-[#1E2638]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fonts..."
                className="w-full h-8 pl-8 pr-2 rounded-lg bg-[#141A2C] border border-[#202B44] text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {grouped.length === 0 && (
              <p className="px-3 py-4 text-[11px] text-slate-500">No fonts match “{query}”.</p>
            )}
            {grouped.map((section) => (
              <div key={section.group}>
                <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                  {section.label}
                </p>
                {section.fonts.map((font) => {
                  const active = font.value === current.value;
                  return (
                    <button
                      key={font.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(font);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[12px] ${
                        active ? "bg-indigo-600 text-white" : "text-slate-200 hover:bg-[#1A2236]"
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
