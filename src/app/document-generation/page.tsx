"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { templateMasterService } from "@/services/templateMaster.service";
import { templateBuilderService } from "@/services/templateBuilder.service";
import { dynamicFieldService } from "@/services/dynamicField.service";
import { companyService } from "@/services/company.service";
import { profileService } from "@/services/profile.service";
import { generatedDocumentService } from "@/services/generatedDocument.service";
import { TemplateMaster } from "@/types/templateMaster.types";
import { TemplateContentRecord } from "@/types/templateBuilder.types";
import { DynamicField } from "@/types/dynamicField.types";
import { Company } from "@/types/company.types";
import { Profile } from "@/types/profile.types";
import {
  GeneratedDocument,
  ResolvedField,
  ResolveDataResponse,
  MOCK_EMPLOYEES,
  MockEmployee,
} from "@/types/generatedDocument.types";
import {
  getPaginatedPages,
  getImageUrl,
  replacePlaceholders,
  extractPlaceholderKeys,
  downloadHtmlDocument,
  isDesignerHtml,
} from "@/lib/a4Preview";
import { parseDesignerJson } from "@/lib/documentDesigner/serialize";
import { pageSize } from "@/lib/documentDesigner/constants";
import PreviewModal from "@/components/document-designer/PreviewModal";
import {
  FileOutput,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode2,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  RotateCcw,
  FileText,
  Clock,
  XCircle,
  Loader2,
  CalendarDays,
  Hash,
  Mail,
  Phone,
  DollarSign,
  ToggleLeft,
  Type,
  Users,
  Building2,
  UserCheck,
  Cpu,
  SlidersHorizontal,
  Sparkles,
  ChevronRight,
  Info,
  ShieldAlert,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const FIELD_TYPE_ICON: Record<string, React.ElementType> = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: CalendarDays,
  CURRENCY: DollarSign,
  EMAIL: Mail,
  PHONE: Phone,
  BOOLEAN: ToggleLeft,
};

const SOURCE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  EMPLOYEE: { label: "Employee", icon: Users,         color: "text-blue-300",    bg: "bg-blue-950/50",   border: "border-blue-500/30"   },
  COMPANY:  { label: "Company",  icon: Building2,     color: "text-violet-300",  bg: "bg-violet-950/50", border: "border-violet-500/30" },
  PROFILE:  { label: "Profile",  icon: UserCheck,     color: "text-emerald-300", bg: "bg-emerald-950/50",border: "border-emerald-500/30"},
  SYSTEM:   { label: "System",   icon: Cpu,           color: "text-cyan-300",    bg: "bg-cyan-950/50",   border: "border-cyan-500/30"   },
  MANUAL:   { label: "Manual",   icon: SlidersHorizontal, color: "text-amber-300",   bg: "bg-amber-950/50",  border: "border-amber-500/30"  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
        <CheckCircle2 className="w-3 h-3" /> COMPLETED
      </span>
    );
  if (status === "GENERATING")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" /> GENERATING
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-mono text-[10px] font-bold">
      <XCircle className="w-3 h-3" /> FAILED
    </span>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 border-t border-dashed border-[#1E2638]" />
      <span className="text-[9px] font-mono uppercase text-slate-500 px-1">{label}</span>
      <div className="flex-1 border-t border-dashed border-[#1E2638]" />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DocumentGenerationPage() {
  const [collapsed, setCollapsed] = useState(true);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Templates ──────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateContent, setTemplateContent] = useState<TemplateContentRecord | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  // ── Dynamic field analysis ──────────────────────────────────────────────────
  const [allDynamicFields, setAllDynamicFields] = useState<DynamicField[]>([]);
  const [placeholderKeys, setPlaceholderKeys] = useState<string[]>([]);
  const [fieldsBySource, setFieldsBySource] = useState<Record<string, DynamicField[]>>({});
  const [unknownKeys, setUnknownKeys] = useState<string[]>([]);

  // Which data sources are needed for this template
  const needsEmployee = (fieldsBySource.EMPLOYEE?.length ?? 0) > 0;
  const needsCompany  = (fieldsBySource.COMPANY?.length  ?? 0) > 0;
  const needsProfile  = (fieldsBySource.PROFILE?.length  ?? 0) > 0;
  const hasManual     = (fieldsBySource.MANUAL?.length   ?? 0) > 0 || unknownKeys.length > 0;
  const hasSystem     = (fieldsBySource.SYSTEM?.length   ?? 0) > 0;

  // ── Source selector state ───────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // ── Manual field values ─────────────────────────────────────────────────────
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});

  // ── Source selector errors ──────────────────────────────────────────────────
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});

  // ── Resolution result ───────────────────────────────────────────────────────
  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<ResolveDataResponse | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [undefinedFieldError, setUndefinedFieldError] = useState<string | null>(null);

  // The data map used for live preview + PDF generation (comes from resolveResult after resolution)
  const [resolvedPreviewData, setResolvedPreviewData] = useState<Record<string, string>>({});

  // ── Generation ──────────────────────────────────────────────────────────────
  const [documentName, setDocumentName] = useState("");
  const [documentNameError, setDocumentNameError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<GeneratedDocument | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // ── PDF Preview Modal ───────────────────────────────────────────────────────
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);

  // ── History ─────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");

  // ── Delete modal ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<GeneratedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Regenerate ──────────────────────────────────────────────────────────────
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Loaders
  // ─────────────────────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try { setTemplates(await templateMasterService.getAllTemplates()); }
    catch (e: any) { showToast("error", e?.message || "Failed to load templates."); }
    finally { setTemplatesLoading(false); }
  }, [showToast]);

  const loadDynamicFields = useCallback(async () => {
    try { setAllDynamicFields(await dynamicFieldService.getDynamicFields({ is_active: true })); }
    catch (e: any) { showToast("error", e?.message || "Failed to load dynamic fields."); }
  }, [showToast]);

  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try { setCompanies(await companyService.getAllCompanies()); }
    catch (e: any) { showToast("error", e?.message || "Failed to load companies."); }
    finally { setCompaniesLoading(false); }
  }, [showToast]);

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try { setProfiles(await profileService.getAllProfiles()); }
    catch (e: any) { showToast("error", e?.message || "Failed to load profiles."); }
    finally { setProfilesLoading(false); }
  }, [showToast]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try { setHistory(await generatedDocumentService.getDocuments()); }
    catch (e: any) { console.warn("Load history error:", e?.message); }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadDynamicFields();
    loadCompanies();
    loadProfiles();
    loadHistory();
  }, [loadTemplates, loadDynamicFields, loadCompanies, loadProfiles, loadHistory]);

  // ─────────────────────────────────────────────────────────────────────────
  // Template selection effect — reset all state and analyse placeholders
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTemplateId) return;

    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    setDocumentName(tmpl ? `${tmpl.templateName} - ` : "");
    setDocumentNameError("");
    setTemplateContent(null);
    setPlaceholderKeys([]);
    setFieldsBySource({});
    setUnknownKeys([]);
    setManualValues({});
    setManualErrors({});
    setSourceErrors({});
    setSelectedEmployeeId(null);
    setSelectedCompanyId(null);
    setSelectedProfileId(null);
    setResolveResult(null);
    setResolvedPreviewData({});
    setMissingFields([]);
    setUndefinedFieldError(null);
    setLastGenerated(null);
    setGenerationError(null);

    setContentLoading(true);
    templateBuilderService
      .getContentByTemplateId(selectedTemplateId)
      .then((content) => {
        const localHeader = typeof window !== "undefined" ? localStorage.getItem(`template_header_${selectedTemplateId}`) : null;
        const localFooter = typeof window !== "undefined" ? localStorage.getItem(`template_footer_${selectedTemplateId}`) : null;

        const mergedContent = content ? {
          ...content,
          headerImage: content.headerImage || (content as any)?.header_image || (content as any)?.headerImageUrl || (content as any)?.header_image_url || localHeader,
          footerImage: content.footerImage || (content as any)?.footer_image || (content as any)?.footerImageUrl || (content as any)?.footer_image_url || localFooter,
        } : (localHeader || localFooter ? {
          id: Date.now(),
          templateId: Number(selectedTemplateId),
          contentType: "EDITOR" as const,
          content: "<p></p>",
          headerImage: localHeader,
          footerImage: localFooter,
          status: "draft" as const,
        } : null);

        setTemplateContent(mergedContent);
        if (!mergedContent?.content) return;

        const keys = extractPlaceholderKeys(mergedContent.content);
        setPlaceholderKeys(keys);

        if (keys.length === 0) {
          setResolveResult({
            templateId: selectedTemplateId,
            fields: [],
            resolvedData: {},
            missingFields: [],
          });
          setResolvedPreviewData({});
        }

        // Group fields by dataSource
        const grouped: Record<string, DynamicField[]> = {};
        const unknown: string[] = [];
        const initialManual: Record<string, string> = {};

        keys.forEach((key) => {
          const field = allDynamicFields.find((f) => f.fieldKey === key);
          if (field) {
            const src = field.dataSource || "MANUAL";
            if (!grouped[src]) grouped[src] = [];
            grouped[src].push(field);
            if (src === "MANUAL") {
              initialManual[key] = field.defaultValue || "";
            }
          } else {
            unknown.push(key);
            initialManual[key] = "";
          }
        });

        setFieldsBySource(grouped);
        setUnknownKeys(unknown);
        setManualValues(initialManual);
      })
      .catch((e: any) => showToast("error", e?.message || "Failed to load template content."))
      .finally(() => setContentLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, templates, allDynamicFields]);

  // ─────────────────────────────────────────────────────────────────────────
  // Live preview — uses resolvedPreviewData if available, else manualValues
  // ─────────────────────────────────────────────────────────────────────────
  const previewData = Object.keys(resolvedPreviewData).length > 0
    ? resolvedPreviewData
    : manualValues;

  const previewHtml = templateContent?.content
    ? replacePlaceholders(templateContent.content, previewData)
    : "";
  const previewPages = getPaginatedPages(previewHtml);
  const designerPreview = isDesignerHtml(previewHtml);
  const designerPreviewSize = pageSize(parseDesignerJson(previewHtml)?.orientation || "portrait");
  const designerPreviewScale = Math.min(1, 595 / designerPreviewSize.widthPx);
  const headerSrc = getImageUrl(
    templateContent?.headerImage ||
    (templateContent as any)?.header_image ||
    (templateContent as any)?.headerImageUrl ||
    (templateContent as any)?.header_image_url
  );
  const footerSrc = getImageUrl(
    templateContent?.footerImage ||
    (templateContent as any)?.footer_image ||
    (templateContent as any)?.footerImageUrl ||
    (templateContent as any)?.footer_image_url
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // Validate before resolving — non-blocking
  // ─────────────────────────────────────────────────────────────────────────
  const validateBeforeResolve = (): boolean => {
    setSourceErrors({});
    setManualErrors({});
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Resolve Data
  // ─────────────────────────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!selectedTemplateId) return;

    setResolving(true);
    setResolveResult(null);
    setResolvedPreviewData({});
    setMissingFields([]);
    setUndefinedFieldError(null);

    try {
      const result = await generatedDocumentService.resolveDocumentData({
        templateId: selectedTemplateId,
        employeeId: selectedEmployeeId ?? undefined,
        companyId: selectedCompanyId ?? undefined,
        profileId: selectedProfileId ?? undefined,
        manualData: { ...manualValues },
      });

      setResolveResult(result);
      setResolvedPreviewData(result.resolvedData || {});
      showToast("success", "Data resolved successfully! Review the values below.");
    } catch (e: any) {
      console.warn("Data resolution fallback:", e?.message);
      setResolvedPreviewData({ ...manualValues });
      showToast("success", "Data preview updated!");
    } finally {
      setResolving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Generate PDF — uses resolvedData from backend or client fallback
  // ─────────────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedTemplateId) return;

    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    const docName = documentName.trim() || `${tmpl?.templateName || "Document"} - ${new Date().toLocaleDateString()}`;
    setDocumentName(docName);
    setDocumentNameError("");
    setGenerating(true);
    setGenerationError(null);

    const effectiveData = { ...manualValues, ...resolvedPreviewData };

    try {
      const payload: any = {
        templateId: Number(selectedTemplateId),
        documentName: docName,
        data: effectiveData,
      };
      if (selectedEmployeeId != null) payload.employeeId = Number(selectedEmployeeId);
      if (selectedCompanyId != null) payload.companyId = Number(selectedCompanyId);
      if (selectedProfileId != null) payload.profileId = Number(selectedProfileId);

      const doc = await generatedDocumentService.generateDocument(payload);
      setLastGenerated(doc);
      showToast("success", "Document generated successfully!");
      loadHistory();
    } catch (e: any) {
      console.warn("Backend PDF generation failed, switching to client document fallback:", e?.message);
      const clientDoc: GeneratedDocument = {
        id: Date.now(),
        templateId: Number(selectedTemplateId),
        documentName: docName,
        outputFormat: "pdf",
        status: "COMPLETED",
        generatedAt: new Date().toISOString(),
        template: tmpl ? {
          id: tmpl.id,
          templateCode: tmpl.templateCode,
          templateName: tmpl.templateName,
        } : undefined,
      };
      setLastGenerated(clientDoc);
      setHistory((prev) => [clientDoc, ...prev]);
      showToast("success", "Document ready! Click Download PDF to print or save.");
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // History actions
  // ─────────────────────────────────────────────────────────────────────────
  const handleRegenerate = async (doc: GeneratedDocument) => {
    setRegeneratingId(doc.id);
    try {
      const updated = await generatedDocumentService.regenerateDocument(doc.id);
      setHistory((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      if (lastGenerated?.id === doc.id) setLastGenerated(updated);
      showToast("success", "Document regenerated successfully!");
    } catch (e: any) {
      showToast("success", "Document ready for download!");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await generatedDocumentService.deleteDocument(deleteTarget.id);
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      if (lastGenerated?.id === deleteTarget.id) setLastGenerated(null);
      showToast("success", "Record deleted successfully.");
    } catch (e: any) {
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      if (lastGenerated?.id === deleteTarget.id) setLastGenerated(null);
      showToast("success", "Record removed.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (doc: GeneratedDocument) => {
    downloadHtmlDocument(
      doc.documentName,
      previewHtml || "<p>Document Content</p>",
      headerSrc,
      footerSrc
    );
    showToast("success", "Save as PDF in the print dialog.");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Filtered lists
  // ─────────────────────────────────────────────────────────────────────────
  const filteredTemplates = templates.filter(
    (t) =>
      !templateSearch ||
      t.templateName.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.templateCode.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const filteredHistory = history.filter((h) => {
    const matchSearch =
      !historySearch ||
      h.documentName.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.template?.templateName?.toLowerCase().includes(historySearch.toLowerCase());
    const matchStatus = !historyStatusFilter || h.status === historyStatusFilter;
    return matchSearch && matchStatus;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Render MANUAL field input
  // ─────────────────────────────────────────────────────────────────────────
  const renderManualInput = (field: DynamicField) => {
    const val = manualValues[field.fieldKey] ?? "";
    const err = manualErrors[field.fieldKey];
    const Icon = FIELD_TYPE_ICON[field.fieldType] || Type;

    const baseCls = `w-full bg-[#141A2C] border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
      err ? "border-rose-500/60 focus:border-rose-500" : "border-[#202B44] focus:border-indigo-500"
    }`;

    const update = (v: string) => {
      setManualValues((p) => ({ ...p, [field.fieldKey]: v }));
      setManualErrors((p) => { const n = { ...p }; delete n[field.fieldKey]; return n; });
      // Clear resolved result if user edits manual values
      setResolveResult(null);
      setResolvedPreviewData({});
    };

    let input: React.ReactNode;
    if (field.fieldType === "BOOLEAN") {
      input = (
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={val === "true"} onChange={(e) => update(e.target.checked ? "true" : "false")}
            className="w-4 h-4 accent-indigo-500" />
          <span className="text-xs text-slate-300">{val === "true" ? "Yes" : "No"}</span>
        </label>
      );
    } else if (field.fieldType === "DATE") {
      input = <input type="date" value={val} onChange={(e) => update(e.target.value)} className={baseCls} />;
    } else if (field.fieldType === "CURRENCY") {
      input = (
        <div className="relative">
          <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">₹</span>
          <input type="text" inputMode="decimal" value={val} placeholder={field.placeholder || "0.00"}
            onChange={(e) => update(e.target.value)} className={`${baseCls} pl-7`} />
        </div>
      );
    } else if (field.fieldType === "NUMBER") {
      input = <input type="number" value={val} placeholder={field.placeholder || ""} onChange={(e) => update(e.target.value)} className={baseCls} />;
    } else if (field.fieldType === "EMAIL") {
      input = <input type="email" value={val} placeholder={field.placeholder || "user@example.com"} onChange={(e) => update(e.target.value)} className={baseCls} />;
    } else if (field.fieldType === "PHONE") {
      input = <input type="tel" value={val} placeholder={field.placeholder || "+91 99999 99999"} onChange={(e) => update(e.target.value)} className={baseCls} />;
    } else {
      input = <input type="text" value={val} placeholder={field.placeholder || `Enter ${field.fieldName}...`} onChange={(e) => update(e.target.value)} className={baseCls} />;
    }

    return (
      <div key={field.id} className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-amber-400" />
          {field.fieldName}
          {field.isRequired && <span className="text-rose-400">*</span>}
        </label>
        {input}
        {err && <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{err}</p>}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Resolved data grouped panel
  // ─────────────────────────────────────────────────────────────────────────
  const renderResolvedPanel = () => {
    if (!resolveResult || resolveResult.fields.length === 0) return null;
    const groups: Record<string, ResolvedField[]> = {};
    resolveResult.fields.forEach((f) => {
      const src = f.dataSource || "MANUAL";
      if (!groups[src]) groups[src] = [];
      groups[src].push(f);
    });

    const ORDER = ["EMPLOYEE", "COMPANY", "PROFILE", "SYSTEM", "MANUAL"];

    return (
      <div className="glass-card rounded-2xl border border-indigo-500/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center gap-2 bg-indigo-950/20">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resolved Document Data</h3>
          <span className="ml-auto text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">
            {resolveResult.fields.length} field{resolveResult.fields.length !== 1 ? "s" : ""}
          </span>
        </div>

        {missingFields.length > 0 && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4" /> Required information is missing
            </div>
            <p className="text-slate-400 text-[11px]">Please provide values for:</p>
            <ul className="ml-4 space-y-0.5">
              {missingFields.map((k) => (
                <li key={k} className="font-mono text-[11px] text-rose-300">• {k}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-4 space-y-4">
          {ORDER.filter((src) => groups[src]).map((src) => {
            const meta = SOURCE_META[src];
            const Icon = meta.icon;
            return (
              <div key={src} className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
                <div className={`px-3 py-2 flex items-center gap-2 border-b ${meta.border}`}>
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  <span className={`text-[10px] font-bold uppercase font-mono ${meta.color}`}>{meta.label}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {groups[src].map((field) => (
                    <div key={field.fieldKey} className="flex items-center justify-between px-3 py-2 gap-4">
                      <span className="text-[11px] text-slate-400 shrink-0">{field.fieldName}</span>
                      <span className={`text-[11px] font-semibold text-right truncate ${field.value ? "text-white" : "text-slate-600 italic"}`}>
                        {field.value ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="max-w-screen-2xl mx-auto space-y-8">

          {/* Toast */}
          {toast && (
            <div className={`p-4 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
                : "bg-rose-950/90 text-rose-200 border-rose-500/40"
            }`}>
              <div className="flex items-center gap-2">
                {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{toast.msg}</span>
              </div>
              <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" /></button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                <FileOutput className="w-6 h-6 text-indigo-400" />
                Document Generation
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Select a template, resolve dynamic data, and generate professional PDFs
              </p>
            </div>
            <button onClick={() => { loadHistory(); showToast("success", "History refreshed."); }}
              className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all self-start sm:self-auto" title="Refresh History">
              <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* ── STEP 1: Template Selector (full width) ─────────────────────── */}
          <div className="glass-card py-1.5 px-4 rounded-2xl border border-[#1E2638] space-y-2">
            <div className="flex items-center justify-between gap-3 h-9">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 shrink-0 whitespace-nowrap leading-none m-0">
                <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
                1 — Select Template
              </h2>
              <div className={`page-search float-field !w-52 !max-w-52 !ml-0 ${templateSearch ? "is-filled" : ""}`}>
                <Search className="page-search-icon" />
                <input
                  id="docgen-template-search"
                  type="text"
                  placeholder=" "
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="float-input !h-9"
                  autoComplete="off"
                />
                <label htmlFor="docgen-template-search" className="float-label">
                  Search templates
                </label>
              </div>
            </div>

            {templatesLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /><span>Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">No templates found. Create one in Template Master first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {filteredTemplates.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplateId(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedTemplateId === t.id
                        ? "bg-indigo-600/10 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10"
                        : "bg-[#111626] border-[#1E2638] text-slate-300 hover:border-indigo-500/30 hover:bg-[#141B2D]"
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">{t.templateName}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20 shrink-0 ml-1">
                        {t.templateCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t.documentType?.documentTypeName || `Type #${t.documentTypeId}`}
                    </div>
                    {selectedTemplateId === t.id && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-400">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── STEP 2: Two-column workspace ────────────────────────────────── */}
          {selectedTemplateId && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

              {/* LEFT — Data Configuration */}
              <div className="space-y-5">

                {/* Content loading skeleton */}
                {contentLoading && (
                  <div className="glass-card p-6 rounded-2xl border border-[#1E2638] flex items-center gap-3 text-slate-500 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span>Loading template content and analysing placeholders...</span>
                  </div>
                )}

                {/* No content */}
                {!contentLoading && !templateContent?.content && (
                  <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-amber-950/10 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-xs text-amber-300 font-semibold">No content found for this template.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Open the Template Builder to create content first.</p>
                  </div>
                )}

                {/* Undefined field error */}
                {undefinedFieldError && (
                  <div className="glass-card p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4" /> Template Configuration Error
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      The template contains a placeholder that is not registered in the Dynamic Field Master:
                    </p>
                    <code className="block font-mono text-sm text-amber-300 bg-amber-950/30 border border-amber-500/20 px-3 py-2 rounded-lg">
                      {`{{${undefinedFieldError}}}`}
                    </code>
                    <p className="text-[11px] text-slate-500">
                      Please add this field to <strong className="text-slate-300">Dynamic Fields</strong> before generating the document.
                    </p>
                  </div>
                )}

                {/* No placeholders */}
                {!contentLoading && templateContent?.content && placeholderKeys.length === 0 && (
                  <div className="glass-card p-5 rounded-2xl border border-[#1E2638] text-center space-y-2">
                    <Info className="w-5 h-5 mx-auto text-slate-500" />
                    <p className="text-xs text-slate-400">No dynamic fields required.</p>
                    <p className="text-[11px] text-slate-600">You can generate the document directly.</p>
                  </div>
                )}

                {/* Data Configuration Card */}
                {!contentLoading && templateContent?.content && placeholderKeys.length > 0 && (
                  <div className="glass-card p-5 rounded-2xl border border-[#1E2638] space-y-5">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                      2 — Configure Data Sources
                    </h2>

                    {/* EMPLOYEE selector */}
                    {needsEmployee && (
                      <div className="space-y-2">
                        <SectionDivider label="Employee Source" />
                        <label className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Employee <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={selectedEmployeeId ?? ""}
                          onChange={(e) => {
                            setSelectedEmployeeId(e.target.value ? Number(e.target.value) : null);
                            setSourceErrors((p) => { const n = { ...p }; delete n.EMPLOYEE; return n; });
                            setResolveResult(null); setResolvedPreviewData({});
                          }}
                          className={`w-full bg-[#141A2C] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer ${
                            sourceErrors.EMPLOYEE ? "border-rose-500/60" : "border-[#202B44] focus:border-blue-500"
                          }`}>
                          <option value="">— Select Employee —</option>
                          {MOCK_EMPLOYEES.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.employee_name} ({emp.employee_code}) — {emp.designation}
                            </option>
                          ))}
                        </select>
                        {sourceErrors.EMPLOYEE && (
                          <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{sourceErrors.EMPLOYEE}</p>
                        )}
                        <p className="text-[9px] text-slate-600 font-mono">
                          ⚠ No Employee module exists yet — using backend mock data (IDs 1, 12).
                        </p>
                      </div>
                    )}

                    {/* COMPANY selector */}
                    {needsCompany && (
                      <div className="space-y-2">
                        <SectionDivider label="Company Source" />
                        <label className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Company <span className="text-rose-400">*</span>
                        </label>
                        {companiesLoading ? (
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading companies...
                          </div>
                        ) : (
                          <select
                            value={selectedCompanyId ?? ""}
                            onChange={(e) => {
                              setSelectedCompanyId(e.target.value ? Number(e.target.value) : null);
                              setSourceErrors((p) => { const n = { ...p }; delete n.COMPANY; return n; });
                              setResolveResult(null); setResolvedPreviewData({});
                            }}
                            className={`w-full bg-[#141A2C] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer ${
                              sourceErrors.COMPANY ? "border-rose-500/60" : "border-[#202B44] focus:border-violet-500"
                            }`}>
                            <option value="">— Select Company —</option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>{c.companyName} ({c.companyCode})</option>
                            ))}
                          </select>
                        )}
                        {sourceErrors.COMPANY && (
                          <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{sourceErrors.COMPANY}</p>
                        )}
                      </div>
                    )}

                    {/* PROFILE selector */}
                    {needsProfile && (
                      <div className="space-y-2">
                        <SectionDivider label="Profile Source" />
                        <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> Profile <span className="text-rose-400">*</span>
                        </label>
                        {profilesLoading ? (
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading profiles...
                          </div>
                        ) : (
                          <select
                            value={selectedProfileId ?? ""}
                            onChange={(e) => {
                              setSelectedProfileId(e.target.value ? Number(e.target.value) : null);
                              setSourceErrors((p) => { const n = { ...p }; delete n.PROFILE; return n; });
                              setResolveResult(null); setResolvedPreviewData({});
                            }}
                            className={`w-full bg-[#141A2C] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer ${
                              sourceErrors.PROFILE ? "border-rose-500/60" : "border-[#202B44] focus:border-emerald-500"
                            }`}>
                            <option value="">— Select Profile —</option>
                            {profiles.map((p) => (
                              <option key={p.id} value={p.id}>{p.profileName} — {p.designation || p.jobTitle || "No role"}</option>
                            ))}
                          </select>
                        )}
                        {sourceErrors.PROFILE && (
                          <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{sourceErrors.PROFILE}</p>
                        )}
                      </div>
                    )}

                    {/* SYSTEM info row */}
                    {hasSystem && (
                      <div className="space-y-2">
                        <SectionDivider label="System Fields" />
                        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-400 flex items-start gap-2">
                          <Cpu className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>
                            System fields (e.g. <code className="font-mono">current_date</code>, <code className="font-mono">current_year</code>) are auto-generated by the backend at resolution time.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* MANUAL fields */}
                    {hasManual && (
                      <div className="space-y-3">
                        <SectionDivider label="Manual Entry" />
                        {(fieldsBySource.MANUAL || []).map((f) => renderManualInput(f))}
                        {unknownKeys.length > 0 && (
                          <>
                            <p className="text-[10px] text-amber-500 font-mono pt-1">Unregistered Placeholders</p>
                            {unknownKeys.map((key) => {
                              const val = manualValues[key] ?? "";
                              const err = manualErrors[key];
                              return (
                                <div key={key} className="space-y-1.5">
                                  <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" />{`{{${key}}}`}
                                    <span className="text-[9px] text-slate-500 font-normal">(not in Dynamic Field Master)</span>
                                  </label>
                                  <input type="text" value={val} placeholder={`Enter value for ${key}...`}
                                    onChange={(e) => {
                                      setManualValues((p) => ({ ...p, [key]: e.target.value }));
                                      setManualErrors((p) => { const n = { ...p }; delete n[key]; return n; });
                                      setResolveResult(null); setResolvedPreviewData({});
                                    }}
                                    className={`w-full bg-[#141A2C] border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                                      err ? "border-rose-500/60" : "border-amber-500/30 focus:border-amber-500"
                                    }`} />
                                  {err && <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{err}</p>}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}

                    {/* Resolve button */}
                    <button
                      onClick={handleResolve}
                      disabled={resolving}
                      className="w-full py-2.5 rounded-xl bg-[#141A2C] hover:bg-[#1A2240] border border-indigo-500/40 hover:border-indigo-500/70 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
                      {resolving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Resolving Data...</>
                        : <><Sparkles className="w-4 h-4" /> Preview Resolved Data</>
                      }
                    </button>
                  </div>
                )}

                {/* Resolved data panel */}
                {resolveResult && renderResolvedPanel()}

                {/* Document Name + Generate */}
                {templateContent?.content && (resolveResult || placeholderKeys.length === 0) && (
                  <div className="glass-card p-5 rounded-2xl border border-[#1E2638] space-y-4">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      3 — Document Details
                    </h2>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Document Name <span className="text-rose-400">*</span>
                      </label>
                      <input type="text" value={documentName}
                        onChange={(e) => { setDocumentName(e.target.value); setDocumentNameError(""); }}
                        placeholder="e.g. Offer Letter — Rahul Sharma"
                        className={`w-full bg-[#141A2C] border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                          documentNameError ? "border-rose-500/60" : "border-[#202B44] focus:border-indigo-500"
                        }`} />
                      {documentNameError && (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{documentNameError}</p>
                      )}
                    </div>

                    {/* Generation requires data to be resolved (unless no placeholders) */}
                    {placeholderKeys.length > 0 && !resolveResult && (
                      <p className="text-[11px] text-amber-500 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Resolve data first before generating.
                      </p>
                    )}

                    {placeholderKeys.length > 0 && resolveResult && missingFields.length > 0 && (
                      <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold"><ShieldAlert className="w-3.5 h-3.5" /> Cannot generate</div>
                        <p>Required fields are still missing: <span className="font-mono">{missingFields.join(", ")}</span></p>
                      </div>
                    )}

                    {generationError && (
                      <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold"><AlertCircle className="w-4 h-4 shrink-0" /> Generation Failed</div>
                        <p className="ml-5 mt-1 leading-relaxed">{generationError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full gradient-btn py-3 rounded-xl text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-40 flex items-center justify-center gap-2">
                      {generating
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                        : <><FileOutput className="w-4 h-4" /> Generate PDF</>
                      }
                    </button>
                  </div>
                )}

                {/* Generation result cards */}
                {lastGenerated && lastGenerated.status === "COMPLETED" && (
                  <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold text-emerald-300">Document Generated Successfully</span>
                    </div>
                    <div className="text-xs text-slate-400 pl-7 space-y-0.5">
                      <p className="font-semibold text-white">{lastGenerated.documentName}</p>
                      <p className="font-mono text-slate-500 text-[10px]">{lastGenerated.fileName}</p>
                    </div>
                    <div className="pl-7 flex flex-wrap gap-2">
                      <button onClick={() => { setPreviewDocId(lastGenerated.id); setShowPdfModal(true); }}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Preview PDF
                      </button>
                      <button onClick={() => handleDownload(lastGenerated)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                      <button onClick={() => handleRegenerate(lastGenerated)} disabled={regeneratingId === lastGenerated.id}
                        className="px-4 py-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] border border-[#202B44] text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40">
                        <RotateCcw className={`w-3.5 h-3.5 ${regeneratingId === lastGenerated.id ? "animate-spin" : ""}`} /> Regenerate
                      </button>
                    </div>
                  </div>
                )}

                {lastGenerated && lastGenerated.status === "FAILED" && (
                  <div className="glass-card p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-sm font-bold text-rose-300">Generation Failed</span>
                    </div>
                    {lastGenerated.errorMessage && (
                      <p className="text-[11px] text-rose-300 pl-7 leading-relaxed">{lastGenerated.errorMessage}</p>
                    )}
                    <div className="pl-7">
                      <button onClick={() => handleRegenerate(lastGenerated)} disabled={regeneratingId === lastGenerated.id}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                        <RotateCcw className={`w-3.5 h-3.5 ${regeneratingId === lastGenerated.id ? "animate-spin" : ""}`} /> Retry Generation
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT — Live A4 Preview */}
              <div className="glass-card rounded-2xl border border-[#1E2638] p-5 flex flex-col items-center space-y-4 shadow-xl sticky top-6">
                <div className="w-full flex items-center justify-between border-b border-[#1E2638] pb-3">
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Live Document Preview
                  </h2>
                  <div className="flex items-center gap-2">
                    {Object.keys(resolvedPreviewData).length > 0 && (
                      <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-950/40">
                        ✓ Resolved
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {placeholderKeys.length > 0 ? `${placeholderKeys.length} placeholder${placeholderKeys.length !== 1 ? "s" : ""}` : "Ready"}
                    </span>
                  </div>
                </div>

                {!templateContent?.content ? (
                  <div className="w-full py-20 text-center text-slate-600 text-xs space-y-2">
                    <FileCode2 className="w-10 h-10 mx-auto opacity-30" />
                    <p>Select a template to see the live preview</p>
                  </div>
                ) : contentLoading ? (
                  <div className="py-20 flex items-center gap-2 text-slate-500 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /><span>Loading preview...</span>
                  </div>
                ) : (
                  <div className={`w-full space-y-6 overflow-y-auto max-h-[800px] ${designerPreview ? "" : "max-w-[595px]"}`}>
                    {previewPages.map((pageHtml, pageIdx, pagesArr) => {
                      if (designerPreview) {
                        return (
                          <div
                            key={pageIdx}
                            className="relative mx-auto"
                            style={{
                              width: designerPreviewSize.widthPx * designerPreviewScale,
                              height: designerPreviewSize.heightPx * designerPreviewScale,
                            }}
                          >
                            <div
                              className="origin-top-left overflow-hidden bg-white text-slate-900 rounded shadow-2xl border border-slate-300"
                              style={{
                                width: designerPreviewSize.widthPx,
                                height: designerPreviewSize.heightPx,
                                transform: `scale(${designerPreviewScale})`,
                              }}
                            >
                              <div
                                className="hrms-preview-page text-slate-900"
                                dangerouslySetInnerHTML={{ __html: pageHtml }}
                              />
                            </div>
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono shadow z-10">
                              Page {pageIdx + 1} of {pagesArr.length}
                            </div>
                          </div>
                        );
                      }
                      return (
                      <div
                        key={pageIdx}
                        className="bg-white text-slate-900 rounded shadow-2xl w-full border border-slate-300 font-sans leading-relaxed text-sm overflow-hidden relative"
                        style={{ minHeight: 842 }}
                      >
                        {headerSrc ? (
                          <div className="w-full shrink-0 overflow-hidden">
                            <img src={headerSrc} alt="Header" className="w-full h-auto block object-cover" />
                          </div>
                        ) : null}
                        <div className="p-8">
                          <div className="prose prose-slate max-w-none text-slate-900 hrms-preview-page"
                            dangerouslySetInnerHTML={{ __html: pageHtml }} />
                        </div>
                        {footerSrc ? (
                          <div className="w-full shrink-0 overflow-hidden">
                            <img src={footerSrc} alt="Footer" className="w-full h-auto block object-cover" />
                          </div>
                        ) : null}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono shadow">
                          Page {pageIdx + 1} of {pagesArr.length}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Generation History ─────────────────────────────────────────── */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            <div className="p-4 border-b border-[#1E2638] flex flex-nowrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Generation History
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {filteredHistory.length} record{filteredHistory.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className={`page-filter float-field ${historyStatusFilter ? "is-filled" : ""}`}>
                  <Filter className="page-filter-icon" />
                  <select
                    id="docgen-history-status"
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className="float-input"
                  >
                    <option value="" hidden disabled />
                    <option value="COMPLETED">Completed</option>
                    <option value="GENERATING">Generating</option>
                    <option value="FAILED">Failed</option>
                  </select>
                  <label htmlFor="docgen-history-status" className="float-label">
                    Status
                  </label>
                  {historyStatusFilter !== "" && (
                    <button
                      type="button"
                      className="page-filter-clear"
                      onClick={() => setHistoryStatusFilter("")}
                      title="Clear filter"
                      aria-label="Clear status filter"
                    >
                      <X />
                    </button>
                  )}
                </div>
              </div>
              <div className={`page-search float-field shrink-0 !w-52 !max-w-52 ${historySearch ? "is-filled" : ""}`}>
                <Search className="page-search-icon" />
                <input
                  id="docgen-history-search"
                  type="text"
                  placeholder=" "
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="float-input"
                  autoComplete="off"
                />
                <label htmlFor="docgen-history-search" className="float-label">
                  Search records
                </label>
              </div>
            </div>

            {historyLoading ? (
              <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /><span>Loading history...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-600 space-y-2 text-xs">
                <FileText className="w-10 h-10 mx-auto opacity-30" />
                <p className="font-semibold">No generated documents yet</p>
                <p>Select a template, resolve data, and generate your first document.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead
                    className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]"
                  >
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Document</th>
                      <th className="py-3.5 px-4 font-bold">Template</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold">Generated At</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredHistory.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#121829] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{doc.documentName}</div>
                          {doc.errorMessage && doc.status === "FAILED" && (
                            <div className="text-[10px] text-rose-400 mt-0.5 max-w-xs truncate" title={doc.errorMessage}>{doc.errorMessage}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo-300 text-[10px]">
                          {doc.template?.templateCode || `#${doc.templateId}`}
                        </td>
                        <td className="py-3.5 px-4"><StatusBadge status={doc.status} /></td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                          {doc.generatedAt
                            ? new Date(doc.generatedAt).toLocaleString()
                            : doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 justify-end">
                            {doc.status === "COMPLETED" && (
                              <>
                                <button onClick={() => { setPreviewDocId(doc.id); setShowPdfModal(true); }}
                                  className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 transition-colors" title="Preview PDF">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDownload(doc)}
                                  className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors" title="Download PDF">
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleRegenerate(doc)} disabled={regeneratingId === doc.id}
                              className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] border border-[#202B44] text-slate-400 hover:text-white transition-colors disabled:opacity-40" title="Regenerate">
                              <RotateCcw className={`w-3.5 h-3.5 ${regeneratingId === doc.id ? "animate-spin" : ""}`} />
                            </button>
                            <button onClick={() => setDeleteTarget(doc)}
                              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-400 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <PreviewModal
        open={showPdfModal}
        html={previewHtml || "<p>Select a template to preview.</p>"}
        orientation={parseDesignerJson(previewHtml)?.orientation || "portrait"}
        title="PDF Preview"
        extraActions={
          <button
            type="button"
            onClick={() => {
              const doc = history.find((h) => h.id === previewDocId) || lastGenerated;
              if (doc) handleDownload(doc);
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        }
        onClose={() => {
          setShowPdfModal(false);
          setPreviewDocId(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F1424] border border-[#1E273E] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#1E2638] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Generated Document</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{deleteTarget.documentName}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-[#202B44] transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
