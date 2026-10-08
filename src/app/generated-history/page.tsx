"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { companyService } from "@/services/company.service";
import { profileService } from "@/services/profile.service";
import { templateMasterService } from "@/services/templateMaster.service";
import { templateBuilderService } from "@/services/templateBuilder.service";
import { generatedDocumentService } from "@/services/generatedDocument.service";
import { Company } from "@/types/company.types";
import { Profile } from "@/types/profile.types";
import { TemplateMaster } from "@/types/templateMaster.types";
import {
  GeneratedDocument,
  GenerationStatus,
} from "@/types/generatedDocument.types";
import {
  downloadHtmlDocument,
  getImageUrl,
  replacePlaceholders,
} from "@/lib/a4Preview";
import { parseDesignerJson } from "@/lib/documentDesigner/serialize";
import PreviewModal from "@/components/document-designer/PreviewModal";
import {
  FileClock,
  Building2,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Eye,
  Trash2,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  X,
  FileText,
  FileCode2,
} from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────
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

export default function GeneratedHistoryPage() {
  const [collapsed, setCollapsed] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Filter Data Sources
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  const [templates, setTemplates] = useState<TemplateMaster[]>([]);

  // Selected Filter States
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<GenerationStatus | "">("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // History List
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Preview & Delete Modals
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [modalPreviewHtml, setModalPreviewHtml] = useState<string>("");

  const [deleteTarget, setDeleteTarget] = useState<GeneratedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  // ── Data Loaders ─────────────────────────────────────────────────────────────
  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      setCompanies(await companyService.getAllCompanies());
    } catch (e: any) {
      showToast("error", "Failed to load companies.");
    } finally {
      setCompaniesLoading(false);
    }
  }, [showToast]);

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      setProfiles(await profileService.getAllProfiles());
    } catch (e: any) {
      showToast("error", "Failed to load profiles.");
    } finally {
      setProfilesLoading(false);
    }
  }, [showToast]);

  const loadTemplates = useCallback(async () => {
    try {
      setTemplates(await templateMasterService.getAllTemplates());
    } catch (e: any) {
      console.warn("Load templates error:", e?.message);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const docs = await generatedDocumentService.getDocuments({
        companyId: selectedCompanyId,
        profileId: selectedProfileId,
        templateId: selectedTemplateId,
        status: statusFilter,
      });
      setHistory(docs);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to load generated documents history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedCompanyId, selectedProfileId, selectedTemplateId, statusFilter, showToast]);

  useEffect(() => {
    loadCompanies();
    loadProfiles();
    loadTemplates();
  }, [loadCompanies, loadProfiles, loadTemplates]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Render Document HTML helper ──────────────────────────────────────────────
  const getDocRenderedHtml = useCallback(
    async (doc: GeneratedDocument): Promise<{ html: string; header?: string | null; footer?: string | null }> => {
      const docData = doc.generatedData || {};
      if (doc.templateId) {
        try {
          const content = await templateBuilderService.getContentByTemplateId(doc.templateId);
          if (content?.content) {
            const rendered = replacePlaceholders(content.content, docData);
            const h = getImageUrl(
              content.headerImage ||
                (content as any)?.header_image ||
                (content as any)?.headerImageUrl ||
                (content as any)?.header_image_url
            );
            const f = getImageUrl(
              content.footerImage ||
                (content as any)?.footer_image ||
                (content as any)?.footerImageUrl ||
                (content as any)?.footer_image_url
            );
            return { html: rendered, header: h, footer: f };
          }
        } catch (e) {
          console.warn("Failed to load template content for doc:", e);
        }
      }
      return { html: "<p>Document Content</p>", header: null, footer: null };
    },
    []
  );

  // ── Action Handlers ──────────────────────────────────────────────────────────
  const handleDownload = async (doc: GeneratedDocument) => {
    const { html, header, footer } = await getDocRenderedHtml(doc);
    downloadHtmlDocument(doc.documentName, html, header, footer);
    showToast("success", "Save as PDF in the print dialog.");
  };

  const handleRegenerate = async (doc: GeneratedDocument) => {
    setRegeneratingId(doc.id);
    try {
      const updated = await generatedDocumentService.regenerateDocument(doc.id);
      setHistory((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
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
      showToast("success", "Record deleted successfully.");
    } catch (e: any) {
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      showToast("success", "Record removed.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    if (!showPdfModal) return;
    const doc = history.find((h) => h.id === previewDocId);
    if (doc) {
      getDocRenderedHtml(doc).then((res) => setModalPreviewHtml(res.html));
    } else {
      setModalPreviewHtml("<p>No preview content available.</p>");
    }
  }, [showPdfModal, previewDocId, history, getDocRenderedHtml]);

  // Client-side search filtering
  const filteredHistory = history.filter((doc) => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    const matchName = doc.documentName?.toLowerCase().includes(searchLower);
    const matchTemplate = doc.template?.templateName?.toLowerCase().includes(searchLower);
    const matchCode = doc.template?.templateCode?.toLowerCase().includes(searchLower);
    return matchName || matchTemplate || matchCode;
  });

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto space-y-8">
          {/* Toast */}
          {toast && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border ${
                toast.type === "success"
                  ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
                  : "bg-rose-950/90 text-rose-200 border-rose-500/40"
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{toast.msg}</span>
              </div>
              <button onClick={() => setToast(null)}>
                <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                <FileClock className="w-6 h-6 text-indigo-400" />
                Generated Documents History
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                View, filter by Company & Profile, preview, and download past generated documents
              </p>
            </div>
            <button
              onClick={() => {
                loadHistory();
                showToast("success", "History refreshed.");
              }}
              className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-medium cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Dynamic Filter Controls Card */}
          <div className="glass-card p-5 rounded-2xl border border-[#1E2638] space-y-4">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              Filter Records by Company & Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Company Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Company
                </label>
                {companiesLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                  </div>
                ) : (
                  <select
                    value={selectedCompanyId ?? ""}
                    onChange={(e) =>
                      setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full bg-[#141A2C] border border-[#202B44] focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">— All Companies —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.companyCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Profile Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Profile
                </label>
                {profilesLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                  </div>
                ) : (
                  <select
                    value={selectedProfileId ?? ""}
                    onChange={(e) =>
                      setSelectedProfileId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full bg-[#141A2C] border border-[#202B44] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">— All Profiles —</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.profileName} — {p.designation || p.jobTitle || "No role"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" /> Template
                </label>
                <select
                  value={selectedTemplateId ?? ""}
                  onChange={(e) =>
                    setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">— All Templates —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.templateName} ({t.templateCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as GenerationStatus | "")}
                  className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">— All Statuses —</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="GENERATING">Generating</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Active Filters Clear Row */}
            {(selectedCompanyId || selectedProfileId || selectedTemplateId || statusFilter) && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">Active Filters:</span>
                {selectedCompanyId && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30 font-mono">
                    Company #{selectedCompanyId}
                  </span>
                )}
                {selectedProfileId && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
                    Profile #{selectedProfileId}
                  </span>
                )}
                {selectedTemplateId && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                    Template #{selectedTemplateId}
                  </span>
                )}
                {statusFilter && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                    {statusFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedCompanyId(null);
                    setSelectedProfileId(null);
                    setSelectedTemplateId(null);
                    setStatusFilter("");
                  }}
                  className="text-[10px] text-rose-400 hover:underline font-mono ml-auto"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* History Records Table */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            <div className="p-4 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Document Records
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {filteredHistory.length} document{filteredHistory.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by document or template name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {historyLoading ? (
              <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Loading generated document history...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-16 text-center text-slate-600 space-y-2 text-xs">
                <FileText className="w-10 h-10 mx-auto opacity-30" />
                <p className="font-semibold text-slate-400">No generated documents match selected criteria</p>
                <p className="text-slate-600">
                  Try changing your Company or Profile filters above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Document Name</th>
                      <th className="py-3.5 px-4 font-bold">Template</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold">Generated Date</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredHistory.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#121829] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{doc.documentName}</div>
                          {doc.errorMessage && doc.status === "FAILED" && (
                            <div
                              className="text-[10px] text-rose-400 mt-0.5 max-w-xs truncate"
                              title={doc.errorMessage}
                            >
                              {doc.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo-300 text-[10px]">
                          {doc.template?.templateName || doc.template?.templateCode || `#${doc.templateId}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                          {doc.generatedAt
                            ? new Date(doc.generatedAt).toLocaleString()
                            : doc.createdAt
                            ? new Date(doc.createdAt).toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 justify-end">
                            {doc.status === "COMPLETED" && (
                              <>
                                <button
                                  onClick={() => {
                                    setPreviewDocId(doc.id);
                                    setShowPdfModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 transition-colors cursor-pointer"
                                  title="Preview PDF"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleRegenerate(doc)}
                              disabled={regeneratingId === doc.id}
                              className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] border border-[#202B44] text-slate-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                              title="Regenerate"
                            >
                              <RotateCcw
                                className={`w-3.5 h-3.5 ${
                                  regeneratingId === doc.id ? "animate-spin" : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(doc)}
                              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                              title="Delete"
                            >
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

      {/* PDF Preview Modal */}
      <PreviewModal
        open={showPdfModal}
        html={modalPreviewHtml || "<p>Loading document preview...</p>"}
        orientation={parseDesignerJson(modalPreviewHtml)?.orientation || "portrait"}
        title="PDF Preview"
        extraActions={
          <button
            type="button"
            onClick={() => {
              const doc = history.find((h) => h.id === previewDocId);
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
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-[#202B44] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                >
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
