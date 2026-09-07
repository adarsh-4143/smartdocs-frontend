"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { documentTypeService } from "@/services/documentType.service";
import { companyService } from "@/services/company.service";
import {
  DocumentType,
  UpdateDocumentTypeDto,
  DocumentTypeStatus,
} from "@/types/documentType.types";
import { Company } from "@/types/company.types";
import {
  ArrowLeft,
  FileSpreadsheet,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Tag,
  FileText,
  Clock,
  ShieldCheck,
  Archive,
  Ban,
} from "lucide-react";

export default function DocumentTypeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const docTypeId = params?.id as string;

  const [collapsed, setCollapsed] = useState(false);
  const [docType, setDocType] = useState<DocumentType | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateDocumentTypeDto>({} as any);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cleanPayload = (data: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      const val = data[key];
      if (val === "" || val === undefined) {
        cleaned[key] = null;
      } else {
        cleaned[key] = typeof val === "string" ? val.trim() : val;
      }
    });
    return cleaned;
  };

  const fetchDocTypeDetails = useCallback(async () => {
    if (!docTypeId) return;
    setLoading(true);
    setError(null);
    try {
      const [dtData, companyData] = await Promise.all([
        documentTypeService.getDocumentTypeById(docTypeId),
        companyService.getAllCompanies().catch(() => []),
      ]);
      setDocType(dtData);
      setCompanies(companyData);
      populateEditForm(dtData);
    } catch (err: any) {
      console.error("Fetch document type details error:", err);
      setError(err?.message || "Failed to load document type details.");
    } finally {
      setLoading(false);
    }
  }, [docTypeId]);

  useEffect(() => {
    fetchDocTypeDetails();
  }, [fetchDocTypeDetails]);

  const populateEditForm = (data: DocumentType) => {
    setEditForm({
      companyId: data.companyId,
      documentTypeCode: data.documentTypeCode || "",
      documentTypeName: data.documentTypeName || "",
      category: data.category || "",
      status: data.status || "active",
      description: data.description || "",
      remark: data.remark || "",
    });
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docType) return;
    setSaving(true);

    const payload = cleanPayload({
      ...editForm,
      companyId: Number(editForm.companyId),
    });

    try {
      const updated = await documentTypeService.updateDocumentType(docType.id, payload);
      setDocType(updated);
      populateEditForm(updated);
      setIsEditing(false);
      showToast("success", `Document type "${updated.documentTypeName}" updated successfully!`);
    } catch (err: any) {
      console.error("Save document type error:", err);
      showToast("error", err?.message || "Failed to update document type details.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (value: string | number | null | undefined, placeholder: string = "—") => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-600 italic">{placeholder}</span>;
    }
    return <span className="text-slate-100 font-medium">{value}</span>;
  };

  const getStatusPill = (status?: DocumentTypeStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-700">
            <Ban className="w-3.5 h-3.5" /> Inactive
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-400 border border-purple-500/30">
            <Archive className="w-3.5 h-3.5" /> Archived
          </span>
        );
      default:
        return <span className="text-slate-500">—</span>;
    }
  };

  const companyObj = docType?.company || companies.find((c) => c.id === docType?.companyId);

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {toast && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border animate-in slide-in-from-top duration-200 ${
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href="/document-type"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Document Types Directory</span>
            </Link>

            {docType && (
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchDocTypeDetails}
                  className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all"
                  title="Reload Details"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-500/20"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Document Type</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#141A2C] hover:bg-[#1E2638] text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchDocTypeDetails}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[11px] text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="glass-card p-16 rounded-2xl border border-[#1E2638] text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-mono text-slate-400">Loading document type specifications...</p>
            </div>
          ) : docType ? (
            <form onSubmit={handleSaveEdits} className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xl font-extrabold shadow-xl">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-extrabold text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            required
                            value={editForm.documentTypeName}
                            onChange={(e) => setEditForm({ ...editForm, documentTypeName: e.target.value })}
                            className="bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1 text-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          docType.documentTypeName
                        )}
                      </h1>
                      {getStatusPill(isEditing ? editForm.status : docType.status)}
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                      Code: <span className="text-indigo-400 font-bold">{docType.documentTypeCode}</span>
                      {companyObj && ` • Company: ${companyObj.companyName}`}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <button
                      type="submit"
                      disabled={saving}
                      className="gradient-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-500/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E2638] pb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  Document Type Specifications & All Fields
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Document Type Code</span>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.documentTypeCode}
                        onChange={(e) => setEditForm({ ...editForm, documentTypeCode: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    ) : (
                      renderField(docType.documentTypeCode)
                    )}
                  </div>

                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Document Type Name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.documentTypeName}
                        onChange={(e) => setEditForm({ ...editForm, documentTypeName: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(docType.documentTypeName)
                    )}
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500">Document type record not found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
