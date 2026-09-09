"use client";

import React from "react";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { objectLabel } from "@/lib/documentDesigner/model";
import type { DocumentDesignerApi } from "./useDocumentDesigner";

export default function LayersPanel({ api }: { api: DocumentDesignerApi }) {
  const objects = [...api.selectedPage.objects].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="p-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Layers</p>
      {objects.length === 0 && (
        <p className="text-[11px] text-slate-500 py-6 text-center">No objects on this page yet.</p>
      )}
      {objects.map((obj) => {
        const active = obj.id === api.selectedObjectId;
        return (
          <button
            key={obj.id}
            type="button"
            onClick={() => api.selectObject(obj.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] ${
              active ? "bg-indigo-600/20 text-white border border-indigo-500/30" : "text-slate-300 hover:bg-[#151C2F]"
            }`}
          >
            <span className="flex-1 truncate">{objectLabel(obj)}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                api.patchObject(obj.id, { visible: !obj.visible });
              }}
              className="p-0.5 text-slate-500 hover:text-white"
            >
              {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                api.patchObject(obj.id, { locked: !obj.locked });
              }}
              className="p-0.5 text-slate-500 hover:text-white"
            >
              {obj.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
