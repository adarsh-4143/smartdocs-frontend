"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { companyService } from "@/services/company.service";
import {
  Company,
  CreateCompanyDto,
  CompanyStatus,
} from "@/types/company.types";
import {
  Building2,
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
  Ban,
  X,
  CheckSquare,
  Square,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { generateNextCode } from "@/lib/codeGenerator";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/FloatField";
import AppToast, { isValidEmail, type ToastType } from "@/components/AppToast";

export default function CompanyManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  // Data state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"basic" | "tax" | "contact" | "address" | "branding" | "settings">("basic");

  // Notification Banner
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);

  const showToast = (type: ToastType, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  // Clean form payload helper (converts empty strings to null or strips them)
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

  // Fetch Companies from Backend API
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (err: any) {
      console.error("Backend API Error:", err);
      setError(err?.message || "Failed to fetch company records.");
      showToast("error", err?.message || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Initial Form State with ALL 35+ backend fields!
  const initialFormState: CreateCompanyDto = {
    companyCode: "",
    companyName: "",
    legalName: "",
    displayName: "",
    companyType: "Private Limited",
    industry: "Information Technology",
    description: "",

    registrationNumber: "",
    cinNumber: "",
    gstNumber: "",
    panNumber: "",
    tanNumber: "",
    taxIdentificationNumber: "",

    officialEmail: "",
    hrEmail: "",
    accountsEmail: "",
    supportEmail: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    website: "",

    registeredAddressLine1: "",
    registeredAddressLine2: "",
    registeredCity: "",
    registeredState: "",
    registeredCountry: "India",
    registeredPostalCode: "",

    officeAddressLine1: "",
    officeAddressLine2: "",
    officeCity: "",
    officeState: "",
    officeCountry: "",
    officePostalCode: "",

    logoUrl: "",
    signatureUrl: "",
    stampUrl: "",
    letterheadUrl: "",
    primaryColor: "",
    secondaryColor: "",
    fontFamily: "",

    defaultCurrency: "INR",
    defaultTimezone: "Asia/Kolkata",
    defaultDateFormat: "YYYY-MM-DD",
    defaultLanguage: "en",

    status: "active",
    remark: "",
  };

  const [formData, setFormData] = useState<CreateCompanyDto>(initialFormState);

  // Open modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingCompany(null);
    const existingCodes = companies.map((c) => c.companyCode);
    const nextCode = generateNextCode("CMP", existingCodes, 3);
    setFormData({ ...initialFormState, companyCode: nextCode });
    setActiveTab("basic");
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setFormData({
      companyCode: comp.companyCode || "",
      companyName: comp.companyName || "",
      legalName: comp.legalName || "",
      displayName: comp.displayName || "",
      companyType: comp.companyType || "Private Limited",
      industry: comp.industry || "Information Technology",
      description: comp.description || "",

      registrationNumber: comp.registrationNumber || "",
      cinNumber: comp.cinNumber || "",
      gstNumber: comp.gstNumber || "",
      panNumber: comp.panNumber || "",
      tanNumber: comp.tanNumber || "",
      taxIdentificationNumber: comp.taxIdentificationNumber || "",

      officialEmail: comp.officialEmail || "",
      hrEmail: comp.hrEmail || "",
      accountsEmail: comp.accountsEmail || "",
      supportEmail: comp.supportEmail || "",
      phoneNumber: comp.phoneNumber || "",
      alternatePhoneNumber: comp.alternatePhoneNumber || "",
      website: comp.website || "",

      registeredAddressLine1: comp.registeredAddressLine1 || "",
      registeredAddressLine2: comp.registeredAddressLine2 || "",
      registeredCity: comp.registeredCity || "",
      registeredState: comp.registeredState || "",
      registeredCountry: comp.registeredCountry || "India",
      registeredPostalCode: comp.registeredPostalCode || "",

      officeAddressLine1: comp.officeAddressLine1 || "",
      officeAddressLine2: comp.officeAddressLine2 || "",
      officeCity: comp.officeCity || "",
      officeState: comp.officeState || "",
      officeCountry: comp.officeCountry || "",
      officePostalCode: comp.officePostalCode || "",

      logoUrl: comp.logoUrl || "",
      signatureUrl: comp.signatureUrl || "",
      stampUrl: comp.stampUrl || "",
      letterheadUrl: comp.letterheadUrl || "",
      primaryColor: comp.primaryColor || "",
      secondaryColor: comp.secondaryColor || "",
      fontFamily: comp.fontFamily || "",

      defaultCurrency: comp.defaultCurrency || "INR",
      defaultTimezone: comp.defaultTimezone || "Asia/Kolkata",
      defaultDateFormat: comp.defaultDateFormat || "YYYY-MM-DD",
      defaultLanguage: comp.defaultLanguage || "en",

      status: comp.status || "active",
      remark: comp.remark || "",
    });
    setActiveTab("basic");
    setIsFormModalOpen(true);
  };

  // Submit Handler for Create & Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!formData.companyCode?.trim()) missing.push("Company Code");
    if (!formData.companyName?.trim()) missing.push("Company Name");

    if (missing.length) {
      setActiveTab("basic");
      showToast(
        "warning",
        `Fill the required fields before saving: ${missing.join(", ")}.`
      );
      return;
    }

    const emailChecks: Array<[string | undefined, string]> = [
      [formData.officialEmail, "Official Email"],
      [formData.hrEmail, "HR Email"],
      [formData.accountsEmail, "Accounts Email"],
      [formData.supportEmail, "Support Email"],
    ];
    const badEmails = emailChecks
      .filter(([value]) => value?.trim() && !isValidEmail(value || ""))
      .map(([, label]) => label);

    if (badEmails.length) {
      setActiveTab("contact");
      showToast("warning", `Enter a valid email for: ${badEmails.join(", ")}.`);
      return;
    }

    setFormSubmitting(true);

    const payload = cleanPayload(formData as Record<string, any>);

    try {
      if (editingCompany) {
        const updatedRecord = await companyService.updateCompany(editingCompany.id, payload);
        setCompanies((prev) =>
          prev.map((c) => (c.id === editingCompany.id ? { ...c, ...updatedRecord } : c))
        );
        showToast("success", `Company "${payload.companyName || editingCompany.companyName}" updated successfully!`);
      } else {
        const createdRecord = await companyService.createCompany(payload as CreateCompanyDto);
        setCompanies((prev) => [createdRecord, ...prev]);
        showToast("success", `Company "${createdRecord.companyName}" created successfully!`);
      }

      setIsFormModalOpen(false);
      await fetchCompanies();
    } catch (err: any) {
      console.error("Save Error:", err);
      showToast("error", err?.message || "Failed to save company details.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Status Patch Update
  const handleStatusChange = async (id: number, newStatus: CompanyStatus) => {
    try {
      const updated = await companyService.updateCompanyStatus(
        id,
        newStatus,
        "Status updated via directory table"
      );
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: updated.status || newStatus } : c))
      );
      showToast("success", `Company status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error("Status Change Error:", err);
      showToast("error", err?.message || "Failed to update company status.");
    }
  };

  // Delete Single Company
  const handleDeleteCompany = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete company "${name}"?`)) return;

    try {
      await companyService.deleteCompany(id, "Deleted via directory table");
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast("success", `Company "${name}" deleted successfully.`);
    } catch (err: any) {
      console.error("Delete Error:", err);
      showToast("error", err?.message || "Failed to delete company.");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected companies?`)) return;

    try {
      await companyService.bulkDeleteCompanies(selectedIds, "Bulk deleted");
      setCompanies((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      showToast("success", `${selectedIds.length} company record(s) deleted.`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Bulk Delete Error:", err);
      showToast("error", err?.message || "Bulk delete failed.");
    }
  };

  // Checkbox selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCompanies.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered List
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.companyCode && c.companyCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.officialEmail && c.officialEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: CompanyStatus) => {
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
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Suspended
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
                  Company Directory
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Live System
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage enterprise companies, legal entities, tax identifiers, and document branding
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchCompanies}
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
                <span>Add Company</span>
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
                onClick={fetchCompanies}
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
                Total Companies
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {companies.length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Active Entities
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {companies.filter((c) => c.status === "active").length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Pending Setup
              </span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {companies.filter((c) => c.status === "pending").length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Multi-Tenant Scope
              </span>
              <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                Active
              </span>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="glass-card p-4 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`page-filter float-field ${statusFilter !== "all" ? "is-filled" : ""}`}>
                <Filter className="page-filter-icon" />
                <select
                  id="company-status-filter"
                  value={statusFilter === "all" ? "" : statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value || "all")}
                  className="float-input"
                >
                  <option value="" hidden disabled />
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                <label htmlFor="company-status-filter" className="float-label">
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
                id="company-search"
                type="text"
                placeholder=" "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="float-input"
                autoComplete="off"
              />
              <label htmlFor="company-search" className="float-label">
                Search companies
              </label>
            </div>
          </div>

          {/* Company Data Table */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-mono">Loading company directory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                    <tr>
                      <th className="py-3.5 px-4 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.length > 0 && selectedIds.length === filteredCompanies.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-bold">Code</th>
                      <th className="py-3.5 px-4 font-bold">Company Name</th>
                      <th className="py-3.5 px-4 font-bold">Industry / Type</th>
                      <th className="py-3.5 px-4 font-bold">Contact Email</th>
                      <th className="py-3.5 px-4 font-bold">Location</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((comp) => {
                        const isSelected = selectedIds.includes(comp.id);
                        return (
                          <tr
                            key={comp.id}
                            className={`hover:bg-[#121829] transition-colors group cursor-pointer ${
                              isSelected ? "bg-indigo-950/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleSelectOne(comp.id)}
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
                              onClick={() => router.push(`/company/${comp.id}`)}
                            >
                              {comp.companyCode}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/company/${comp.id}`)}
                            >
                              <div>
                                <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors">
                                  {comp.companyName}
                                </span>
                                {comp.legalName && comp.legalName !== comp.companyName && (
                                  <span className="text-[10px] text-slate-500 truncate block">
                                    {comp.legalName}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/company/${comp.id}`)}
                            >
                              <span className="text-slate-300 font-medium block">
                                {comp.industry || "—"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {comp.companyType || "Private Ltd"}
                              </span>
                            </td>

                            <td
                              className="py-3.5 px-4 font-mono text-slate-300"
                              onClick={() => router.push(`/company/${comp.id}`)}
                            >
                              {comp.officialEmail || "—"}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-400"
                              onClick={() => router.push(`/company/${comp.id}`)}
                            >
                              {comp.registeredCity
                                ? `${comp.registeredCity}${comp.registeredCountry ? `, ${comp.registeredCountry}` : ""}`
                                : "—"}
                            </td>

                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {getStatusPill(comp.status)}
                                <select
                                  value={comp.status}
                                  onChange={(e) =>
                                    handleStatusChange(comp.id, e.target.value as CompanyStatus)
                                  }
                                  className="bg-[#141A2B] text-[10px] text-slate-400 rounded px-1 py-0.5 border border-[#202B44] focus:outline-none cursor-pointer"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="pending">Pending</option>
                                  <option value="suspended">Suspended</option>
                                </select>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Open details in new page /company/[id] */}
                                <Link
                                  href={`/company/${comp.id}`}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-white transition-colors"
                                  title="View Full Details Page"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleOpenEditModal(comp)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Quick Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCompany(comp.id, comp.companyName)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete Company"
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
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          {companies.length === 0
                            ? "No company records found. Click 'Add Company' to create your first entity."
                            : "No company records found matching your filters."}
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

      {/* CREATE / QUICK EDIT COMPANY MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="company-form-modal bg-[#0F1424] border border-[#1E273E] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#0C101D]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCompany ? `Edit Company (${editingCompany.companyCode})` : "Register New Company"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCompany ? "Update company profile and legal details" : "Add a new legal entity to the directory"}
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

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#1E2638] bg-[#0B0E1B] px-5 gap-4 overflow-x-auto text-xs font-semibold">
              {[
                { id: "basic", label: "Basic Info" },
                { id: "tax", label: "Tax & Registration" },
                { id: "contact", label: "Contact & Web" },
                { id: "address", label: "Address Info" },
                { id: "branding", label: "Branding & Media" },
                { id: "settings", label: "Status & Defaults" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? "border-indigo-500 text-white font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form Body */}
            <form noValidate onSubmit={handleSubmitForm} className="p-6 pt-7 overflow-y-auto space-y-4 flex-1">
              {activeTab === "basic" && (
                <div className="space-y-4 animate-in fade-in duration-150 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="company-code"
                      label="Company Code *"
                      required
                      value={formData.companyCode}
                      onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                    />
                    <FloatInput
                      id="company-name"
                      label="Company Name *"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="legal-name"
                      label="Legal Name"
                      value={formData.legalName || ""}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    />
                    <FloatInput
                      id="display-name"
                      label="Display Name"
                      value={formData.displayName || ""}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatSelect
                      id="company-type"
                      label="Company Type"
                      value={formData.companyType || "Private Limited"}
                      onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                    </FloatSelect>
                    <FloatInput
                      id="industry"
                      label="Industry"
                      value={formData.industry || ""}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>

                  <FloatTextarea
                    id="description"
                    label="Company Overview / Description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              )}

              {activeTab === "tax" && (
                <div className="space-y-4 animate-in fade-in duration-150 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="gst-number"
                      label="GST Number"
                      value={formData.gstNumber || ""}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    />
                    <FloatInput
                      id="pan-number"
                      label="PAN Number"
                      value={formData.panNumber || ""}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="cin-number"
                      label="CIN Number"
                      value={formData.cinNumber || ""}
                      onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })}
                    />
                    <FloatInput
                      id="tan-number"
                      label="TAN Number"
                      value={formData.tanNumber || ""}
                      onChange={(e) => setFormData({ ...formData, tanNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="registration-number"
                      label="Registration Number"
                      value={formData.registrationNumber || ""}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    />
                    <FloatInput
                      id="tin-number"
                      label="Tax Identification Number (TIN)"
                      value={formData.taxIdentificationNumber || ""}
                      onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === "contact" && (
                <div className="space-y-4 animate-in fade-in duration-150 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="official-email"
                      label="Official Email"
                      type="email"
                      value={formData.officialEmail || ""}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    />
                    <FloatInput
                      id="hr-email"
                      label="HR Email"
                      type="email"
                      value={formData.hrEmail || ""}
                      onChange={(e) => setFormData({ ...formData, hrEmail: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="accounts-email"
                      label="Accounts Email"
                      type="email"
                      value={formData.accountsEmail || ""}
                      onChange={(e) => setFormData({ ...formData, accountsEmail: e.target.value })}
                    />
                    <FloatInput
                      id="support-email"
                      label="Support Email"
                      type="email"
                      value={formData.supportEmail || ""}
                      onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FloatInput
                      id="phone-number"
                      label="Phone Number"
                      value={formData.phoneNumber || ""}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                    <FloatInput
                      id="alternate-phone"
                      label="Alternate Phone"
                      value={formData.alternatePhoneNumber || ""}
                      onChange={(e) => setFormData({ ...formData, alternatePhoneNumber: e.target.value })}
                    />
                    <FloatInput
                      id="website"
                      label="Website URL"
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === "address" && (
                <div className="space-y-4 animate-in fade-in duration-150 pt-1">
                  <span className="text-xs font-bold text-[#8aa8a1] block uppercase">
                    Registered Legal Address
                  </span>
                  <FloatInput
                    id="registered-line-1"
                    label="Registered Line 1"
                    value={formData.registeredAddressLine1 || ""}
                    onChange={(e) => setFormData({ ...formData, registeredAddressLine1: e.target.value })}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FloatInput
                      id="registered-city"
                      label="Registered City"
                      value={formData.registeredCity || ""}
                      onChange={(e) => setFormData({ ...formData, registeredCity: e.target.value })}
                    />
                    <FloatInput
                      id="registered-state"
                      label="Registered State"
                      value={formData.registeredState || ""}
                      onChange={(e) => setFormData({ ...formData, registeredState: e.target.value })}
                    />
                    <FloatInput
                      id="postal-code"
                      label="Postal Code"
                      value={formData.registeredPostalCode || ""}
                      onChange={(e) => setFormData({ ...formData, registeredPostalCode: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === "branding" && (
                <div className="space-y-4 animate-in fade-in duration-150 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      id="logo-url"
                      label="Logo URL"
                      value={formData.logoUrl || ""}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    />
                    <FloatInput
                      id="primary-color"
                      label="Primary Color"
                      value={formData.primaryColor || ""}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4 animate-in fade-in duration-150 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatSelect
                      id="initial-status"
                      label="Initial Status"
                      value={formData.status || "active"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as CompanyStatus })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </FloatSelect>
                    <FloatSelect
                      id="default-currency"
                      label="Default Currency"
                      value={formData.defaultCurrency || "INR"}
                      onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </FloatSelect>
                  </div>
                </div>
              )}

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
                    {formSubmitting ? "Saving..." : editingCompany ? "Save Changes" : "Create Company"}
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
