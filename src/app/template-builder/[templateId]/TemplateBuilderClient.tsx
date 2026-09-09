"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { templateMasterService } from "@/services/templateMaster.service";
import { templateBuilderService } from "@/services/templateBuilder.service";
import { templateDocumentService } from "@/services/templateDocument.service";
import { dynamicFieldService } from "@/services/dynamicField.service";
import { TemplateMaster } from "@/types/templateMaster.types";
import { TemplateContentRecord } from "@/types/templateBuilder.types";
import { TemplateDocument } from "@/types/templateDocument.types";
import { DynamicField } from "@/types/dynamicField.types";
import { createBlankDocument } from "@/lib/documentDesigner/model";
import { serializeDocument } from "@/lib/documentDesigner/serialize";
import { htmlToDocument } from "@/lib/documentDesigner/migrate";
import { cleanHtmlContent } from "@/lib/documentDesigner/cleanHtml";
import { AUTOSAVE_MS, MAX_IMPORT_BYTES } from "@/lib/documentDesigner/constants";
import { useDocumentDesigner } from "@/components/document-designer/useDocumentDesigner";
import DocumentDesigner from "@/components/document-designer/DocumentDesigner";
import ImportDocumentModal from "@/components/document-designer/ImportDocumentModal";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Save,
} from "lucide-react";

export default function TemplateBuilderClient() {
  const params = useParams();
  const templateId = params?.templateId as string;

  const api = useDocumentDesigner(createBlankDocument());
  const [collapsed, setCollapsed] = useState(true);
  const [template, setTemplate] = useState<TemplateMaster | null>(null);
  const [contentRecord, setContentRecord] = useState<TemplateContentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeDoc, setActiveDoc] = useState<TemplateDocument | null>(null);
  const [existingDocs, setExistingDocs] = useState<TemplateDocument[]>([]);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isScratchConfirmed, setIsScratchConfirmed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);
  const skipAutosaveRef = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const persistHtml = useCallback(
    async (html: string, silent = false) => {
      if (!templateId) return;
      if (!silent) setSaving(true);
      setSaveState("saving");
      try {
        if (contentRecord?.id) {
          const updated = await templateBuilderService.updateContent(contentRecord.id, {
            content: html,
            headerImage: contentRecord.headerImage || (contentRecord as { header_image?: string }).header_image || null,
            footerImage: contentRecord.footerImage || (contentRecord as { footer_image?: string }).footer_image || null,
            status: "draft",
          });
          setContentRecord((prev) => ({ ...prev, ...updated } as TemplateContentRecord));
        } else {
          const created = await templateBuilderService.createContent({
            templateId: Number(templateId),
            contentType: "EDITOR",
            content: html,
            status: "draft",
          });
          setContentRecord(created);
        }
        setSaveState("saved");
        if (!silent) showToast("success", "Template saved.");
      } catch (err: unknown) {
        setSaveState("idle");
        showToast("error", err instanceof Error ? err.message : "Failed to save template.");
      } finally {
        if (!silent) setSaving(false);
      }
    },
    [contentRecord, templateId]
  );

  const handleSave = useCallback(async () => {
    await persistHtml(serializeDocument(api.doc), false);
  }, [api.doc, persistHtml]);

  const loadBuilderData = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const [tData, cData, docs] = await Promise.all([
        templateMasterService.getTemplateById(templateId),
        templateBuilderService.getContentByTemplateId(templateId).catch(() => null),
        templateDocumentService.getDocumentsByTemplateId(templateId).catch(() => []),
      ]);

      const localHeader = typeof window !== "undefined" ? localStorage.getItem(`template_header_${templateId}`) : null;
      const localFooter = typeof window !== "undefined" ? localStorage.getItem(`template_footer_${templateId}`) : null;
      const mergedRecord = cData
        ? {
            ...cData,
            headerImage: cData.headerImage || (cData as { header_image?: string }).header_image || localHeader,
            footerImage: cData.footerImage || (cData as { footer_image?: string }).footer_image || localFooter,
          }
        : null;

      setTemplate(tData);
      setContentRecord(mergedRecord);
      setExistingDocs(docs);
      if (docs.length > 0) setActiveDoc(docs[0]);

      const rawHtml = cData?.content || "";
      const doc = htmlToDocument(rawHtml, {
        headerImage: mergedRecord?.headerImage,
        footerImage: mergedRecord?.footerImage,
      });
      api.replaceDocument(doc);
      loadedRef.current = true;
      skipAutosaveRef.current = true;

      if (!cData?.content && docs.length === 0) {
        setIsScratchConfirmed(false);
      } else {
        setIsScratchConfirmed(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load template builder.");
    } finally {
      setLoading(false);
    }
  }, [api, templateId]);

  useEffect(() => {
    loadBuilderData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const fetchDynamicFields = useCallback(async () => {
    if (!template) return;
    setFieldsLoading(true);
    try {
      const docTypeId = template.documentTypeId;
      const [specificFields, globalFields] = await Promise.all([
        docTypeId
          ? dynamicFieldService.getDynamicFields({ document_type_id: docTypeId, is_active: true })
          : Promise.resolve([]),
        dynamicFieldService.getDynamicFields({ is_active: true }),
      ]);
      const filteredGlobal = globalFields.filter((f) => !f.documentTypeId);
      const combined = [...specificFields, ...filteredGlobal];
      setDynamicFields(combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i));
    } catch {
      showToast("error", "Could not load dynamic fields.");
    } finally {
      setFieldsLoading(false);
    }
  }, [template]);

  useEffect(() => {
    if (template) fetchDynamicFields();
  }, [template, fetchDynamicFields]);

  useEffect(() => {
    if (!loadedRef.current || loading) return;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persistHtml(serializeDocument(api.doc), true);
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [api.doc, loading, persistHtml]);

  const applyImportedHtml = (html: string) => {
    const cleaned = cleanHtmlContent(html);
    skipAutosaveRef.current = true;
    api.replaceDocument(htmlToDocument(cleaned));
    setIsScratchConfirmed(true);
  };

  const pollConversionStatus = useCallback(
    (docId: number) => {
      if (pollRef.current) clearInterval(pollRef.current);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 30) {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsConverting(false);
          setConversionError("Conversion timed out. Please retry conversion.");
          return;
        }
        try {
          const doc = await templateDocumentService.getDocumentById(docId);
          if (doc.status === "CONVERTED") {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsConverting(false);
            setActiveDoc(doc);
            if (doc.convertedContent) applyImportedHtml(doc.convertedContent);
            showToast("success", "Document converted and loaded.");
          } else if (doc.status === "FAILED") {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsConverting(false);
            setActiveDoc(doc);
            setConversionError("Conversion failed. Please verify the document format or retry.");
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
    },
    [api]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      showToast("error", "File exceeds the 10 MB limit.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      showToast("error", "Please upload a PDF, DOCX, or DOC file.");
      return;
    }
    setSelectedFile(file);
    setConversionError(null);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setConversionError(null);
    try {
      const doc = await templateDocumentService.uploadDocument(Number(templateId), selectedFile);
      setActiveDoc(doc);
      setExistingDocs((prev) => [doc, ...prev]);
      showToast("success", "Document uploaded.");
      if (doc.status === "UPLOADED") {
        setIsConverting(true);
        pollConversionStatus(doc.id);
      } else if (doc.status === "CONVERTED" && doc.convertedContent) {
        applyImportedHtml(doc.convertedContent);
      }
      setShowImportModal(false);
      setSelectedFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      showToast("error", msg);
      setConversionError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryConversion = async () => {
    if (!activeDoc) return;
    setIsConverting(true);
    setConversionError(null);
    try {
      const doc = await templateDocumentService.convertDocument(activeDoc.id);
      setActiveDoc(doc);
      if (doc.status === "UPLOADED") pollConversionStatus(doc.id);
      else if (doc.status === "CONVERTED" && doc.convertedContent) {
        setIsConverting(false);
        applyImportedHtml(doc.convertedContent);
        showToast("success", "Document converted.");
      }
    } catch (err: unknown) {
      setIsConverting(false);
      const msg = err instanceof Error ? err.message : "Conversion retry failed.";
      setConversionError(msg);
      showToast("error", msg);
    }
  };

  const showStartChoice = !contentRecord?.content && !isScratchConfirmed && existingDocs.length === 0 && !loading;

  return (
    <div className="h-screen overflow-hidden bg-[#070911] text-slate-100 flex flex-col font-sans">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`relative flex-1 min-h-0 flex flex-col ${collapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
        <div className="h-11 shrink-0 border-b border-[#1E2638] bg-[#0A0D17] px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/template-builder" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight">{template?.templateName || "Template"}</p>
              <p className="text-[9px] text-slate-500 font-mono truncate leading-tight">
                A4 · {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Ready"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="h-7 px-2.5 rounded-md border border-[#202B44] text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
            >
              <FileUp className="w-3.5 h-3.5" /> Import
            </button>
            <button
              type="button"
              onClick={loadBuilderData}
              className="h-7 w-7 rounded-md border border-[#202B44] text-slate-300 hover:text-white flex items-center justify-center"
              title="Reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-7 px-3 rounded-md gradient-btn text-[11px] font-semibold text-white flex items-center gap-1 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 border shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-950/95 text-emerald-200 border-emerald-500/40"
                : "bg-rose-950/95 text-rose-200 border-rose-500/40"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {error && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg text-[11px] text-rose-200 bg-rose-950/95 border border-rose-500/30">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading document...</div>
          ) : (
            <DocumentDesigner
              api={api}
              fields={dynamicFields}
              fieldsLoading={fieldsLoading}
              previewOpen={previewOpen}
              onPreviewOpenChange={setPreviewOpen}
            />
          )}

          {showStartChoice && (
            <div className="absolute inset-0 z-30 bg-[#070911]/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-lg rounded-2xl border border-[#1E2638] bg-[#0F1422] p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Start a blank A4 document</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  No header, footer, logo, or layout is added for you. Place text, images, tables, and fields anywhere you want.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      api.replaceDocument(createBlankDocument());
                      setIsScratchConfirmed(true);
                    }}
                    className="flex-1 h-10 rounded-lg gradient-btn text-sm font-semibold text-white"
                  >
                    Start from scratch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScratchConfirmed(true);
                      setShowImportModal(true);
                    }}
                    className="flex-1 h-10 rounded-lg border border-[#202B44] text-sm text-slate-200"
                  >
                    Import existing document
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ImportDocumentModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedFile={selectedFile}
        onFileChange={handleFileChange}
        onUpload={handleUploadDocument}
        isUploading={isUploading}
        isConverting={isConverting}
        conversionError={conversionError}
        activeDoc={activeDoc}
        existingDocs={existingDocs}
        onRetry={handleRetryConversion}
      />
    </div>
  );
}
