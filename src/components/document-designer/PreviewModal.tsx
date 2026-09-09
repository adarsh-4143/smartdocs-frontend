"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { extractDesignerPageHtml, isDesignerHtml } from "@/lib/documentDesigner/serialize";
import { getPaginatedPages } from "@/lib/a4Preview";
import { pageSize } from "@/lib/documentDesigner/constants";
import type { PageOrientation } from "@/types/documentDesigner.types";

interface PreviewModalProps {
  open: boolean;
  html: string;
  orientation: PageOrientation;
  onClose: () => void;
  title?: string;
  extraActions?: React.ReactNode;
}

export default function PreviewModal({
  open,
  html,
  orientation,
  onClose,
  title = "Print preview",
  extraActions,
}: PreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const size = pageSize(orientation);
  let pages: string[] = [];
  try {
    pages = isDesignerHtml(html) ? extractDesignerPageHtml(html) : getPaginatedPages(html);
  } catch {
    pages = html ? [html] : [];
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/85 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0C101D] shrink-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <div className="flex items-center gap-3">
          {extraActions}
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8 space-y-8 flex flex-col items-center bg-[#1a1d27]">
        {pages.length === 0 ? (
          <p className="text-sm text-slate-400 py-20">Nothing to preview yet.</p>
        ) : (
          pages.map((pageHtml, index) => (
            <div
              key={index}
              className="bg-white shadow-2xl overflow-hidden"
              style={{
                width: size.widthMm + "mm",
                height: size.heightMm + "mm",
              }}
            >
              <div
                className="hrms-preview-page"
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
