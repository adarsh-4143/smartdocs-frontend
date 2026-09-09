"use client";

import React from "react";
import {
  FileCheck,
  FileUp,
  FileWarning,
  Loader2,
  X,
} from "lucide-react";
import type { TemplateDocument } from "@/types/templateDocument.types";
import { templateDocumentService } from "@/services/templateDocument.service";

interface ImportDocumentModalProps {
  open: boolean;
  onClose: () => void;
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  isConverting: boolean;
  conversionError: string | null;
  activeDoc: TemplateDocument | null;
  existingDocs: TemplateDocument[];
  onRetry: () => void;
}

export default function ImportDocumentModal({
  open,
  onClose,
  selectedFile,
  onFileChange,
  onUpload,
  isUploading,
  isConverting,
  conversionError,
  activeDoc,
  existingDocs,
  onRetry,
}: ImportDocumentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#1E2638] bg-[#0F1422] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2638]">
          <div>
            <h2 className="text-sm font-semibold text-white">Import existing document</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">PDF, DOCX, or DOC up to 10 MB</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block rounded-xl border border-dashed border-[#2A3550] p-6 text-center cursor-pointer hover:border-indigo-400">
            <FileUp className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
            <p className="text-xs text-slate-300">{selectedFile ? selectedFile.name : "Choose a document to convert"}</p>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFileChange} />
          </label>
          {conversionError && (
            <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
              <FileWarning className="w-3.5 h-3.5" /> {conversionError}
            </p>
          )}
          {isConverting && (
            <p className="text-[11px] text-indigo-300 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting document...
            </p>
          )}
          {activeDoc?.status === "CONVERTED" && (
            <p className="text-[11px] text-emerald-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" /> Converted and ready to edit
            </p>
          )}
          {existingDocs.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-slate-500">Previous imports</p>
              {existingDocs.slice(0, 4).map((doc) => (
                <a
                  key={doc.id}
                  href={templateDocumentService.getOriginalUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[11px] text-slate-400 hover:text-indigo-300 truncate"
                >
                  {doc.originalFileName} · {doc.status}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-[#1E2638] flex justify-end gap-2">
          {activeDoc && activeDoc.status === "FAILED" && (
            <button type="button" onClick={onRetry} className="h-9 px-3 rounded-lg border border-[#202B44] text-[12px] text-slate-300">
              Retry conversion
            </button>
          )}
          <button type="button" onClick={onClose} className="h-9 px-3 rounded-lg border border-[#202B44] text-[12px] text-slate-300">
            Close
          </button>
          <button
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={onUpload}
            className="h-9 px-4 rounded-lg gradient-btn text-[12px] font-semibold text-white disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload & convert"}
          </button>
        </div>
      </div>
    </div>
  );
}
