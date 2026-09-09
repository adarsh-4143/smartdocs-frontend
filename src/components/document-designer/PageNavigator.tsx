"use client";

import React from "react";
import { Copy, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { DocumentDesignerApi } from "./useDocumentDesigner";
import { pageSize } from "@/lib/documentDesigner/constants";
import { normalizeBand } from "@/lib/documentDesigner/model";

interface PageNavigatorProps {
  api: DocumentDesignerApi;
  zoom: number;
}

export default function PageNavigator({ api, zoom: _zoom }: PageNavigatorProps) {
  const size = pageSize(api.doc.orientation);
  const scale = 108 / size.widthPx;

  return (
    <div className="h-full flex flex-col bg-[#0A0D17] border-r border-[#1E2638]">
      <div className="px-2 py-1.5 border-b border-[#1E2638] flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pages</p>
        <span className="text-[10px] font-mono text-slate-500">{api.doc.pages.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {api.doc.pages.map((page, index) => {
          const active = page.id === api.selectedPageId;
          const header = normalizeBand(page.header, 80);
          const footer = normalizeBand(page.footer, 56);
          return (
            <div key={page.id} className="group">
              <button
                type="button"
                onClick={() => api.selectPage(page.id)}
                className={`w-full rounded-lg overflow-hidden border ${
                  active ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-[#1E2638] hover:border-indigo-400/40"
                }`}
              >
                <div
                  className="bg-white mx-auto relative overflow-hidden"
                  style={{
                    width: size.widthPx * scale,
                    height: size.heightPx * scale,
                    backgroundColor: page.background.color,
                    backgroundImage: page.background.image ? `url(${page.background.image})` : undefined,
                    backgroundSize: "cover",
                  }}
                >
                  {header.enabled && header.image && (
                    <img
                      src={header.image}
                      alt=""
                      className="absolute top-0 left-0 w-full object-cover"
                      style={{ height: header.height * scale }}
                    />
                  )}
                  {footer.enabled && footer.image && (
                    <img
                      src={footer.image}
                      alt=""
                      className="absolute bottom-0 left-0 w-full object-cover"
                      style={{ height: footer.height * scale }}
                    />
                  )}
                </div>
              </button>
              <div className="flex items-center justify-between mt-1 px-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Page {index + 1}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <button type="button" title="Move up" onClick={() => api.movePage(page.id, -1)} className="p-0.5 text-slate-500 hover:text-white">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button type="button" title="Move down" onClick={() => api.movePage(page.id, 1)} className="p-0.5 text-slate-500 hover:text-white">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button type="button" title="Duplicate" onClick={() => api.duplicatePage(page.id)} className="p-0.5 text-slate-500 hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button type="button" title="Delete" onClick={() => api.deletePage(page.id)} className="p-0.5 text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t border-[#1E2638]">
        <button
          type="button"
          onClick={api.addPage}
          className="w-full h-8 rounded-md border border-dashed border-[#2A3550] text-[11px] text-slate-300 hover:border-indigo-400 hover:text-white flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add page
        </button>
      </div>
    </div>
  );
}
