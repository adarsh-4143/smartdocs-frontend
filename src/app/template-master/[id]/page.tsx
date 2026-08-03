"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { templateMasterService } from "@/services/templateMaster.service";
import { companyService } from "@/services/company.service";
import { documentTypeService } from "@/services/documentType.service";
import { profileService } from "@/services/profile.service";
import {
  TemplateMaster,
  UpdateTemplateMasterDto,
  TemplateMasterStatus,
} from "@/types/templateMaster.types";
import { Company } from "@/types/company.types";
import { DocumentType } from "@/types/documentType.types";
import { Profile } from "@/types/profile.types";
import {
  ArrowLeft,
  FileCode2,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  UserCheck,
  Clock,
  ShieldCheck,
  Star,
  Archive,
  Ban,
} from "lucide-react";

export default function TemplateMasterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string;

  const [collapsed, setCollapsed] = useState(false);
  const [template, setTemplate] = useState<TemplateMaster | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateTemplateMasterDto>({} as any);

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Clean payload helper
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

  // Load single template by ID and metadata
  const fetchTemplateDetails = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const [tData, companyData, docTypeData, profileData] = await Promise.all([
        templateMasterService.getTemplateById(templateId),
        companyService.getAllCompanies().catch(() => []),
        documentTypeService.getAllDocumentTypes().catch(() => []),
        profileService.getAllProfiles().catch(() => []),
      ]);
      setTemplate(tData);
      setCompanies(companyData);
      setDocumentTypes(docTypeData);
      setProfiles(profileData);
      populateEditForm(tData);
    } catch (err: any) {
      console.error("Fetch template details error:", err);
      setError(err?.message || "Failed to load template master details.");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplateDetails();
  }, [fetchTemplateDetails]);

  const populateEditForm = (data: TemplateMaster) => {
    setEditForm({
      companyId: data.companyId,
      documentTypeId: data.documentTypeId,
      profileId: data.profileId || null,
      templateCode: data.templateCode || "",
      templateName: data.templateName || "",
      description: data.description || "",
      version: data.version || "1.0.0",
      status: data.status || "draft",
      isDefault: Boolean(data.isDefault),
      remark: data.remark || "",
    });
  };

  // Submit edits directly from this page
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    setSaving(true);

    const payload = cleanPayload({
      ...editForm,
      companyId: Number(editForm.companyId),
      documentTypeId: Number(editForm.documentTypeId),
      profileId: editForm.profileId ? Number(editForm.profileId) : null,
    });

    try {
      const updated = await templateMasterService.updateTemplate(template.id, payload);
      setTemplate(updated);
      populateEditForm(updated);
      setIsEditing(false);
      showToast("success", `Template "${updated.templateName}" updated successfully!`);
    } catch (err: any) {
      console.error("Save template error:", err);
      showToast("error", err?.message || "Failed to update template details.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to render blank fields explicitly
  const renderField = (value: string | number | null | undefined, placeholder: string = "—") => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-600 italic">{placeholder}</span>;
    }
    return <span className="text-slate-100 font-medium">{value}</span>;
  };

  const getStatusPill = (status?: TemplateMasterStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-700">
            <Ban className="w-3.5 h-3.5" /> Inactive
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

  const companyObj = template?.company || companies.find((c) => c.id === template?.companyId);
  const docTypeObj = template?.documentType || documentTypes.find((d) => d.id === template?.documentTypeId);
  const profileObj = template?.profile || profiles.find((p) => p.id === template?.profileId);

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${collapsed ? "ml-20" : "ml-64"
          }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Notification Toast */}
          {toast && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border animate-in slide-in-from-top duration-200 ${toast.type === "success"
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

          {/* Top Bar Navigation & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href="/template-master"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Templates Directory</span>
            </Link>

            {template && (
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchTemplateDetails}
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
                    <span>Edit Template Details</span>
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

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchTemplateDetails}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[11px] text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="glass-card p-16 rounded-2xl border border-[#1E2638] text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-mono text-slate-400">Loading template specifications...</p>
            </div>
          ) : template ? (
            <form onSubmit={handleSaveEdits} className="space-y-6">
              {/* Header Banner Card */}
              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xl font-extrabold shadow-xl">
                    <FileCode2 className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-extrabold text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            required
                            value={editForm.templateName}
                            onChange={(e) => setEditForm({ ...editForm, templateName: e.target.value })}
                            className="bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1 text-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          template.templateName
                        )}
                      </h1>

                      {getStatusPill(isEditing ? editForm.status : template.status)}

                      {(isEditing ? editForm.isDefault : template.isDefault) && (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300" /> Default Master
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                      Code: <span className="text-indigo-400 font-bold">{template.templateCode}</span>
                      {companyObj && ` • Company: ${companyObj.companyName}`}
                      {` • v${template.version || "1.0.0"}`}
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

              {/* Full Details Display / Edit Grid */}
              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E2638] pb-3 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  Template Master Specifications & All Fields
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Field 1: Template Code */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Template Code</span>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.templateCode}
                        onChange={(e) => setEditForm({ ...editForm, templateCode: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    ) : (
                      renderField(template.templateCode)
                    )}
                  </div>

                  {/* Field 2: Template Name */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Template Name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.templateName}
                        onChange={(e) => setEditForm({ ...editForm, templateName: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(template.templateName)
                    )}
                  </div>

                  {/* Field 3: Company */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Associated Company</span>
                    {isEditing ? (
                      <select
                        value={editForm.companyId}
                        onChange={(e) => setEditForm({ ...editForm, companyId: Number(e.target.value) })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName} ({c.companyCode})
                          </option>
                        ))}
                      </select>
                    ) : (
                      renderField(companyObj ? `${companyObj.companyName} (${companyObj.companyCode})` : `Company ID #${template.companyId}`)
                    )}
                  </div>

                  {/* Field 4: Document Type */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Document Type Category</span>
                    {isEditing ? (
                      <select
                        value={editForm.documentTypeId}
                        onChange={(e) => setEditForm({ ...editForm, documentTypeId: Number(e.target.value) })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        {documentTypes.map((dt) => (
                          <option key={dt.id} value={dt.id}>
                            {dt.documentTypeName} ({dt.documentTypeCode})
                          </option>
                        ))}
                      </select>
                    ) : (
                      renderField(docTypeObj ? `${docTypeObj.documentTypeName} (${docTypeObj.documentTypeCode})` : `Type ID #${template.documentTypeId}`)
                    )}
                  </div>

                  {/* Field 5: Target Profile */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Target Job Profile</span>
                    {isEditing ? (
                      <select
                        value={editForm.profileId || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            profileId: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">All Profiles (Global)</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.profileName} ({p.profileCode})
                          </option>
                        ))}
                      </select>
                    ) : (
                      renderField(profileObj ? `${profileObj.profileName} (${profileObj.profileCode})` : "All Profiles (Global)")
                    )}
                  </div>

                  {/* Field 6: Version */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Version Tag</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.version || "1.0.0"}
                        onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    ) : (
                      renderField(template.version ? `v${template.version}` : null)
                    )}
                  </div>

                  {/* Field 7: Status */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Publish Status</span>
                    {isEditing ? (
                      <select
                        value={editForm.status || "draft"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value as TemplateMasterStatus })
                        }
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      getStatusPill(template.status)
                    )}
                  </div>

                  {/* Field 8: Is Default */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Default Master Setting</span>
                    {isEditing ? (
                      <label className="flex items-center gap-2 text-xs text-white mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editForm.isDefault)}
                          onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                        />
                        <span>Is Default Master</span>
                      </label>
                    ) : (
                      renderField(template.isDefault ? "Yes (Default Master)" : "No (Standard Version)")
                    )}
                  </div>

                  {/* Field 9: Internal Remark */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Internal Remark</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.remark || ""}
                        onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(template.remark)
                    )}
                  </div>

                  {/* Field 10: Created At */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Created Timestamp</span>
                    {renderField(template.createdAt ? new Date(template.createdAt).toLocaleString() : null)}
                  </div>

                  {/* Field 11: Updated At */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Last Modified Timestamp</span>
                    {renderField(template.updatedAt ? new Date(template.updatedAt).toLocaleString() : null)}
                  </div>
                </div>

                {/* Field 12: Description */}
                <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                  <span className="text-slate-400 block mb-1 font-medium">Description & Usage Notes</span>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg p-3 text-xs text-white"
                    />
                  ) : (
                    renderField(template.description)
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Template master record not found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
