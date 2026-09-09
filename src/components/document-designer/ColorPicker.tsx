"use client";

import React, { useEffect, useRef, useState } from "react";
import { PRESET_COLORS } from "@/lib/documentDesigner/constants";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

const RECENT_KEY = "hrms_designer_recent_colors";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(color: string) {
  if (!color) return;
  const next = [color, ...readRecent().filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function ColorPicker({
  label,
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = "None",
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value || "#000000");
  const [recent, setRecent] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHex(value || "#000000");
  }, [value]);

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const commit = (color: string) => {
    onChange(color);
    pushRecent(color);
    setRecent(readRecent());
    setHex(color);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[#202B44] bg-[#141A2C] hover:border-indigo-500/40 text-[11px] text-slate-300"
        title={label}
      >
        <span
          className="w-4 h-4 rounded border border-white/20 shrink-0"
          style={{ background: value || "transparent" }}
        />
        <span className="truncate max-w-[72px]">{label}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-56 p-3 rounded-xl border border-[#202B44] bg-[#0F1422] shadow-2xl">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{label}</p>
          <div className="grid grid-cols-10 gap-1 mb-2">
            {allowEmpty && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-5 h-5 rounded border border-dashed border-slate-500 bg-transparent"
                title={emptyLabel}
              />
            )}
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => commit(color)}
                className={`w-5 h-5 rounded border ${value === color ? "ring-2 ring-indigo-400" : "border-white/10"}`}
                style={{ background: color }}
                title={color}
              />
            ))}
          </div>
          {recent.length > 0 && (
            <>
              <p className="text-[9px] uppercase text-slate-500 mb-1">Recent</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {recent.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => commit(color)}
                    className="w-5 h-5 rounded border border-white/10"
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#([0-9a-f]{6})$/i.test(hex) ? hex : "#000000"}
              onChange={(e) => commit(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              onBlur={() => {
                if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) commit(hex);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
                  commit(hex);
                  setOpen(false);
                }
              }}
              className="flex-1 bg-[#141A2C] border border-[#202B44] rounded-md px-2 py-1 text-[11px] font-mono text-slate-200"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}
