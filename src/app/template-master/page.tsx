"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { templateMasterService } from "@/services/templateMaster.service";
import { companyService } from "@/services/company.service";
import { documentTypeService } from "@/services/documentType.service";
import { profileService } from "@/services/profile.service";
import {
  TemplateMaster,
  CreateTemplateMasterDto,
  TemplateMasterStatus,
} from "@/types/templateMaster.types";
import { Company } from "@/types/company.types";
import { DocumentType } from "@/types/documentType.types";
import { Profile } from "@/types/profile.types";
import {
  FileCode2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  CheckSquare,
  Square,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  UserCheck,
  Star,
  Archive,
  Ban,
} from "lucide-react";
import { generateNextCode } from "@/lib/codeGenerator";

export default function TemplateMasterManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  // Data state
  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateMaster | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Notification Banner
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

  // Load templates, companies, document types, and profiles
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tmpData, companyData, docTypeData, profileData] = await Promise.all([
        templateMasterService.getAllTemplates(),
        companyService.getAllCompanies().catch(() => []),
        documentTypeService.getAllDocumentTypes().catch(() => []),
        profileService.getAllProfiles().catch(() => []),
      ]);
      setTemplates(tmpData);
      setCompanies(companyData);
      setDocumentTypes(docTypeData);
      setProfiles(profileData);
    } catch (err: any) {
      console.error("Fetch templates error:", err);
      setError(err?.message || "Failed to load template masters directory.");
      showToast("error", err?.message || "Unable to fetch template masters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initial Form State
  const initialFormState: CreateTemplateMasterDto = {
    companyId: companies.length > 0 ? companies[0].id : 1,
    documentTypeId: documentTypes.length > 0 ? documentTypes[0].id : 1,
    profileId: null,
    templateCode: "",
    templateName: "",
    description: "",
    version: "1.0.0",
    status: "draft",
    isDefault: false,
    remark: "",
  };

  const [formData, setFormData] = useState<CreateTemplateMasterDto>(initialFormState);

  // Open modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    const initialCompanyId = companies.length > 0 ? companies[0].id : 1;
    const existingCodes = templates.map((t) => t.templateCode);
    const nextCode = generateNextCode("TMP", existingCodes, 3);
    setFormData({
      ...initialFormState,
      companyId: initialCompanyId,
      documentTypeId: documentTypes.length > 0 ? documentTypes[0].id : 1,
      templateCode: nextCode,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (t: TemplateMaster) => {
    setEditingTemplate(t);
    setFormData({
      companyId: t.companyId || (companies.length > 0 ? companies[0].id : 1),
      documentTypeId: t.documentTypeId || (documentTypes.length > 0 ? documentTypes[0].id : 1),
      profileId: t.profileId || null,
      templateCode: t.templateCode || "",
      templateName: t.templateName || "",
      description: t.description || "",
      version: t.version || "1.0.0",
      status: t.status || "draft",
      isDefault: Boolean(t.isDefault),
      remark: t.remark || "",
    });
    setIsFormModalOpen(true);
  };

  // Submit Handler for Create & Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    const payload = cleanPayload({
      ...formData,
      companyId: Number(formData.companyId),
      documentTypeId: Number(formData.documentTypeId),
      profileId: formData.profileId ? Number(formData.profileId) : null,
    });

    try {
      if (editingTemplate) {
        await templateMasterService.updateTemplate(editingTemplate.id, payload);
        showToast("success", `Template "${payload.templateName || editingTemplate.templateName}" updated successfully!`);
      } else {
        const created = await templateMasterService.createTemplate(payload as CreateTemplateMasterDto);
        showToast("success", `Template "${created.templateName}" created successfully!`);
      }

      setIsFormModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Save template error:", err);
      showToast("error", err?.message || "Failed to save template record.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Status Patch Update
  const handleStatusChange = async (id: number, newStatus: TemplateMasterStatus) => {
    try {
      const updated = await templateMasterService.updateTemplateStatus(
        id,
        newStatus,
        "Status updated via template master portal"
      );
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: updated.status || newStatus } : t))
      );
      showToast("success", `Template status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error("Status Change Error:", err);
      showToast("error", err?.message || "Failed to update template status.");
    }
  };

  // Delete Single Template
  const handleDeleteTemplate = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;

    try {
      await templateMasterService.deleteTemplate(id, "Deleted via admin portal");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast("success", `Template "${name}" deleted successfully.`);
    } catch (err: any) {
      console.error("Delete template error:", err);
      showToast("error", err?.message || "Failed to delete template.");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected templates?`)) return;

    try {
      await templateMasterService.bulkDeleteTemplates(selectedIds, "Bulk deleted");
      setTemplates((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
      showToast("success", `${selectedIds.length} template record(s) deleted.`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      showToast("error", err?.message || "Bulk delete operation failed.");
    }
  };

  // Checkbox selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTemplates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTemplates.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered List
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      (t.templateName && t.templateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.templateCode && t.templateCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.version && t.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: TemplateMasterStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Draft
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-700">
            <Ban className="w-3 h-3" /> Inactive
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-400 border border-purple-500/30">
            <Archive className="w-3 h-3" /> Archived
          </span>
        );
    }
  };

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

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Template Master Library
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage master document templates, versioning, default presets, and role-specific layouts
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Template Master</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[11px] text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* KPI Overview Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Total Templates
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {templates.length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Active Templates
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {templates.filter((t) => t.status === "active").length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Default Master Presets
              </span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {templates.filter((t) => t.isDefault).length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Document Categories
              </span>
              <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                {documentTypes.length}
              </span>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="glass-card p-4 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by template code, name, version, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#141A2C]">All Statuses</option>
                  <option value="active" className="bg-[#141A2C]">Active Only</option>
                  <option value="draft" className="bg-[#141A2C]">Draft</option>
                  <option value="inactive" className="bg-[#141A2C]">Inactive</option>
                  <option value="archived" className="bg-[#141A2C]">Archived</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <span className="text-xs text-indigo-400 font-mono">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
          </div>

          {/* Templates Data Table */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-mono">Loading template master library...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                    <tr>
                      <th className="py-3.5 px-4 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.length > 0 && selectedIds.length === filteredTemplates.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-bold">Code</th>
                      <th className="py-3.5 px-4 font-bold">Template Name</th>
                      <th className="py-3.5 px-4 font-bold">Company</th>
                      <th className="py-3.5 px-4 font-bold">Document Type</th>
                      <th className="py-3.5 px-4 font-bold">Profile</th>
                      <th className="py-3.5 px-4 font-bold">Version</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((t) => {
                        const isSelected = selectedIds.includes(t.id);
                        const companyObj = t.company || companies.find((c) => c.id === t.companyId);
                        const docTypeObj = t.documentType || documentTypes.find((d) => d.id === t.documentTypeId);
                        const profileObj = t.profile || profiles.find((p) => p.id === t.profileId);

                        return (
                          <tr
                            key={t.id}
                            className={`hover:bg-[#121829] transition-colors group cursor-pointer ${isSelected ? "bg-indigo-950/20" : ""
                              }`}
                          >
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleSelectOne(t.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            <td
                              className="py-3.5 px-4 font-mono font-bold text-indigo-400"
                              onClick={() => router.push(`/template-master/${t.id}`)}
                            >
                              {t.templateCode}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/template-master/${t.id}`)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors">
                                  {t.templateName}
                                </span>
                                {t.isDefault && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-amber-300" /> Default
                                  </span>
                                )}
                              </div>
                              {t.description && (
                                <span className="text-[10px] text-slate-500 truncate block max-w-xs">
                                  {t.description}
                                </span>
                              )}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-300 font-medium"
                              onClick={() => router.push(`/template-master/${t.id}`)}
                            >
                              {companyObj ? companyObj.companyName : `Company #${t.companyId}`}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-300 font-medium"
                              onClick={() => router.push(`/template-master/${t.id}`)}
                            >
                              {docTypeObj ? docTypeObj.documentTypeName : `Type #${t.documentTypeId}`}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-400 font-medium"
                              onClick={() => router.push(`/template-master/${t.id}`)}
                            >
                              {profileObj ? profileObj.profileName : "All Profiles"}
                            </td>

                            <td
                              className="py-3.5 px-4 font-mono text-cyan-300 font-semibold"
                              onClick={() => router.push(`/template-master/${t.id}`)}
                            >
                              v{t.version || "1.0.0"}
                            </td>

                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {getStatusPill(t.status)}
                                <select
                                  value={t.status}
                                  onChange={(e) =>
                                    handleStatusChange(t.id, e.target.value as TemplateMasterStatus)
                                  }
                                  className="bg-[#141A2B] text-[10px] text-slate-400 rounded px-1 py-0.5 border border-[#202B44] focus:outline-none cursor-pointer"
                                >
                                  <option value="active">Active</option>
                                  <option value="draft">Draft</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/template-master/${t.id}`}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-white transition-colors"
                                  title="View Full Details Page"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleOpenEditModal(t)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Quick Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(t.id, t.templateName)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          {templates.length === 0
                            ? "No template masters found. Click 'Add Template' to create your first template master."
                            : "No template masters found matching your search filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE / QUICK EDIT TEMPLATE MASTER MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0F1424] border border-[#1E273E] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#0C101D]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingTemplate ? `Edit Template (${editingTemplate.templateCode})` : "Create Master Template"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure template metadata, parent entity linkage, and publishing status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#141A2B] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Company *
                  </label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => {
                      const newCompId = Number(e.target.value);
                      if (!editingTemplate) {
                        const existingCodes = templates.map((t) => t.templateCode);
                        const nextCode = generateNextCode("TMP", existingCodes, 3);
                        setFormData({ ...formData, companyId: newCompId, templateCode: nextCode });
                      } else {
                        setFormData({ ...formData, companyId: newCompId });
                      }
                    }}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.companyCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Document Type *
                  </label>
                  <select
                    required
                    value={formData.documentTypeId}
                    onChange={(e) => setFormData({ ...formData, documentTypeId: Number(e.target.value) })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.documentTypeName} ({dt.documentTypeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Job Profile (Optional)
                  </label>
                  <select
                    value={formData.profileId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profileId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Profiles (Global)</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.profileName} ({p.profileCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Template Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TMP-OFFER-STD-01"
                    value={formData.templateCode}
                    onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Employment Offer Template"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={formData.version || "1.0.0"}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.status || "draft"}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TemplateMasterStatus })
                    }
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isDefault)}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded bg-[#141A2C] border-[#202B44] text-indigo-600 focus:ring-0"
                  />
                  <span className="font-semibold text-white">Set as Default Template for Document Type</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Template Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Purpose, target audience, layout details..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Administrative remarks..."
                  value={formData.remark || ""}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 flex items-center justify-between border-t border-[#1E2638] mt-6">
                <div className="text-[11px] text-slate-500">
                  All changes are saved securely.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="gradient-btn px-6 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    {formSubmitting ? "Saving..." : editingTemplate ? "Save Changes" : "Create Template"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
