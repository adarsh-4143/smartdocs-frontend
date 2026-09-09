"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { documentTypeService } from "@/services/documentType.service";
import { companyService } from "@/services/company.service";
import {
  DocumentType,
  CreateDocumentTypeDto,
  DocumentTypeStatus,
} from "@/types/documentType.types";
import { Company } from "@/types/company.types";
import {
  FileSpreadsheet,
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
  Tag,
  FileText,
  Archive,
  Ban,
} from "lucide-react";
import { generateNextCode } from "@/lib/codeGenerator";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/FloatField";
import AppToast, { type ToastType } from "@/components/AppToast";

export default function DocumentTypeManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Data state
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingDocType, setEditingDocType] = useState<DocumentType | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Notification Banner
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);

  const showToast = (type: ToastType, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
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

  // Load document types and companies
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docData, companyData] = await Promise.all([
        documentTypeService.getAllDocumentTypes(),
        companyService.getAllCompanies().catch(() => []),
      ]);
      setDocumentTypes(docData);
      setCompanies(companyData);
    } catch (err: any) {
      console.error("Fetch document types error:", err);
      setError(err?.message || "Failed to load document types directory.");
      showToast("error", err?.message || "Unable to fetch document types.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initial Form State
  const initialFormState: CreateDocumentTypeDto = {
    companyId: companies.length > 0 ? companies[0].id : 1,
    documentTypeCode: "",
    documentTypeName: "",
    category: "HR & Recruitment",
    status: "active",
    description: "",
    remark: "",
  };

  const [formData, setFormData] = useState<CreateDocumentTypeDto>(initialFormState);

  // Open modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingDocType(null);
    const existingCodes = documentTypes.map((d) => d.documentTypeCode);
    const nextCode = generateNextCode("DOC", existingCodes, 3);
    setFormData({
      ...initialFormState,
      companyId: companies.length > 0 ? companies[0].id : 1,
      documentTypeCode: nextCode,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (dt: DocumentType) => {
    setEditingDocType(dt);
    setFormData({
      companyId: dt.companyId || (companies.length > 0 ? companies[0].id : 1),
      documentTypeCode: dt.documentTypeCode || "",
      documentTypeName: dt.documentTypeName || "",
      category: dt.category || "",
      status: dt.status || "active",
      description: dt.description || "",
      remark: dt.remark || "",
    });
    setIsFormModalOpen(true);
  };

  // Submit Handler for Create & Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!formData.companyId) missing.push("Company");
    if (!formData.documentTypeCode?.trim()) missing.push("Document Type Code");
    if (!formData.documentTypeName?.trim()) missing.push("Document Type Name");

    if (missing.length) {
      showToast(
        "warning",
        `Fill the required fields before saving: ${missing.join(", ")}.`
      );
      return;
    }

    setFormSubmitting(true);

    const payload = cleanPayload({
      ...formData,
      companyId: Number(formData.companyId),
    });

    try {
      if (editingDocType) {
        const updated = await documentTypeService.updateDocumentType(editingDocType.id, payload);
        setDocumentTypes((prev) =>
          prev.map((d) => (d.id === editingDocType.id ? { ...d, ...updated } : d))
        );
        showToast("success", `Document type "${payload.documentTypeName || editingDocType.documentTypeName}" updated successfully!`);
      } else {
        const created = await documentTypeService.createDocumentType(payload as CreateDocumentTypeDto);
        setDocumentTypes((prev) => [created, ...prev]);
        showToast("success", `Document type "${created.documentTypeName}" created successfully!`);
      }

      setIsFormModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Save document type error:", err);
      showToast("error", err?.message || "Failed to save document type record.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (id: number, newStatus: DocumentTypeStatus) => {
    try {
      const updated = await documentTypeService.updateDocumentTypeStatus(
        id,
        newStatus,
        "Status updated via document types portal"
      );
      setDocumentTypes((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: updated.status || newStatus } : d))
      );
      showToast("success", `Document type status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error("Status Change Error:", err);
      showToast("error", err?.message || "Failed to update document type status.");
    }
  };

  // Delete Single Document Type
  const handleDeleteDocumentType = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete document type "${name}"?`)) return;

    try {
      await documentTypeService.deleteDocumentType(id, "Deleted via admin portal");
      setDocumentTypes((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast("success", `Document type "${name}" deleted successfully.`);
    } catch (err: any) {
      console.error("Delete document type error:", err);
      showToast("error", err?.message || "Failed to delete document type.");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected document types?`)) return;

    try {
      await documentTypeService.bulkDeleteDocumentTypes(selectedIds, "Bulk deleted");
      setDocumentTypes((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      showToast("success", `${selectedIds.length} document type record(s) deleted.`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      showToast("error", err?.message || "Bulk delete operation failed.");
    }
  };

  // Checkbox selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDocTypes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocTypes.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered List
  const filteredDocTypes = documentTypes.filter((d) => {
    const matchesSearch =
      (d.documentTypeName && d.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.documentTypeCode && d.documentTypeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: DocumentTypeStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-700">
            <Ban className="w-3 h-3" /> Inactive
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Draft
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
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {toast && (
            <AppToast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />
          )}

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Document Types & Categories
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage document classification categories, offer letter types, payslips, and compliance contracts
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
                <span>Add Document Type</span>
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
                Total Document Types
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {documentTypes.length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Active Categories
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {documentTypes.filter((d) => d.status === "active").length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Drafts & Pending
              </span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {documentTypes.filter((d) => d.status === "draft").length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Assigned Companies
              </span>
              <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                {companies.length}
              </span>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="glass-card p-4 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`page-filter float-field ${statusFilter !== "all" ? "is-filled" : ""}`}>
                <Filter className="page-filter-icon" />
                <select
                  id="doctype-status-filter"
                  value={statusFilter === "all" ? "" : statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value || "all")}
                  className="float-input"
                >
                  <option value="" hidden disabled />
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <label htmlFor="doctype-status-filter" className="float-label">
                  Status
                </label>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    className="page-filter-clear"
                    onClick={() => setStatusFilter("all")}
                    title="Clear filter"
                    aria-label="Clear status filter"
                  >
                    <X />
                  </button>
                )}
              </div>

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

            <div className={`page-search float-field ${searchTerm ? "is-filled" : ""}`}>
              <Search className="page-search-icon" />
              <input
                id="doctype-search"
                type="text"
                placeholder=" "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="float-input"
                autoComplete="off"
              />
              <label htmlFor="doctype-search" className="float-label">
                Search document types
              </label>
            </div>
          </div>

          {/* Document Types Data Table */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-mono">Loading document types directory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                    <tr>
                      <th className="py-3.5 px-4 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.length > 0 && selectedIds.length === filteredDocTypes.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-bold">Code</th>
                      <th className="py-3.5 px-4 font-bold">Document Type Name</th>
                      <th className="py-3.5 px-4 font-bold">Company</th>
                      <th className="py-3.5 px-4 font-bold">Category</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredDocTypes.length > 0 ? (
                      filteredDocTypes.map((dt) => {
                        const isSelected = selectedIds.includes(dt.id);
                        const companyObj = dt.company || companies.find((c) => c.id === dt.companyId);

                        return (
                          <tr
                            key={dt.id}
                            className={`hover:bg-[#121829] transition-colors group cursor-pointer ${
                              isSelected ? "bg-indigo-950/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleSelectOne(dt.id)}
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
                              onClick={() => router.push(`/document-type/${dt.id}`)}
                            >
                              {dt.documentTypeCode}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/document-type/${dt.id}`)}
                            >
                              <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors">
                                {dt.documentTypeName}
                              </span>
                              {dt.description && (
                                <span className="text-[10px] text-slate-500 truncate block max-w-xs">
                                  {dt.description}
                                </span>
                              )}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-300 font-medium"
                              onClick={() => router.push(`/document-type/${dt.id}`)}
                            >
                              {companyObj ? companyObj.companyName : `Company #${dt.companyId}`}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-300 font-medium"
                              onClick={() => router.push(`/document-type/${dt.id}`)}
                            >
                              <span className="inline-flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
                                <Tag className="w-3 h-3" />
                                {dt.category || "General"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {getStatusPill(dt.status)}
                                <select
                                  value={dt.status}
                                  onChange={(e) =>
                                    handleStatusChange(dt.id, e.target.value as DocumentTypeStatus)
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
                                  href={`/document-type/${dt.id}`}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-white transition-colors"
                                  title="View Full Details Page"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleOpenEditModal(dt)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Quick Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDocumentType(dt.id, dt.documentTypeName)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete Document Type"
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
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          {documentTypes.length === 0
                            ? "No document type records found. Click 'Add Document Type' to create your first template category."
                            : "No document type records found matching your search filters."}
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

      {/* CREATE / QUICK EDIT DOCUMENT TYPE MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="float-form-modal bg-[#0F1424] border border-[#1E273E] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#0C101D]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingDocType ? `Edit Document Type (${editingDocType.documentTypeCode})` : "Create Document Type"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define document classification category, naming, and deployment status
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
            <form noValidate onSubmit={handleSubmitForm} className="p-6 pt-7 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <FloatSelect
                  id="doctype-company"
                  label="Select Company *"
                  required
                  value={String(formData.companyId)}
                  onChange={(e) => setFormData({ ...formData, companyId: Number(e.target.value) })}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.companyCode})
                    </option>
                  ))}
                </FloatSelect>
                <FloatInput
                  id="doctype-code"
                  label="Document Type Code *"
                  required
                  value={formData.documentTypeCode}
                  onChange={(e) => setFormData({ ...formData, documentTypeCode: e.target.value })}
                />
              </div>

              <FloatInput
                id="doctype-name"
                label="Document Type Name *"
                required
                value={formData.documentTypeName}
                onChange={(e) => setFormData({ ...formData, documentTypeName: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <FloatInput
                  id="doctype-category"
                  label="Classification Category"
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
                <FloatSelect
                  id="doctype-status"
                  label="Deployment Status"
                  value={formData.status || "active"}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as DocumentTypeStatus })
                  }
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </FloatSelect>
              </div>

              <FloatTextarea
                id="doctype-description"
                label="Description & Usage Scope"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <FloatInput
                id="doctype-remark"
                label="Internal Remarks / Notes"
                value={formData.remark || ""}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              />

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
                    {formSubmitting ? "Saving..." : editingDocType ? "Save Changes" : "Create Document Type"}
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
