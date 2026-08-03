"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { profileService } from "@/services/profile.service";
import { companyService } from "@/services/company.service";
import {
  Profile,
  CreateProfileDto,
  EmploymentType,
} from "@/types/profile.types";
import { Company } from "@/types/company.types";
import {
  UserCheck,
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
  Briefcase,
  Layers,
} from "lucide-react";

export default function ProfileManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [employmentFilter, setEmploymentFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
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

  // Load profiles and companies
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, companyData] = await Promise.all([
        profileService.getAllProfiles(),
        companyService.getAllCompanies().catch(() => []),
      ]);
      setProfiles(profileData);
      setCompanies(companyData);
    } catch (err: any) {
      console.error("Fetch profiles error:", err);
      setError(err?.message || "Failed to load profiles directory.");
      showToast("error", err?.message || "Unable to fetch profiles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initial Form State
  const initialFormState: CreateProfileDto = {
    companyId: companies.length > 0 ? companies[0].id : 1,
    profileCode: "",
    profileName: "",
    jobTitle: "",
    department: "Engineering",
    designation: "",
    jobLevel: "L3",
    employmentType: "full_time",
    description: "",
    remark: "",
  };

  const [formData, setFormData] = useState<CreateProfileDto>(initialFormState);

  // Open modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingProfile(null);
    const randomCode = `PROF-POSITION-${Math.floor(10 + Math.random() * 90)}`;
    setFormData({
      ...initialFormState,
      companyId: companies.length > 0 ? companies[0].id : 1,
      profileCode: randomCode,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (prof: Profile) => {
    setEditingProfile(prof);
    setFormData({
      companyId: prof.companyId || (companies.length > 0 ? companies[0].id : 1),
      profileCode: prof.profileCode || "",
      profileName: prof.profileName || "",
      jobTitle: prof.jobTitle || "",
      department: prof.department || "",
      designation: prof.designation || "",
      jobLevel: prof.jobLevel || "",
      employmentType: prof.employmentType || "full_time",
      description: prof.description || "",
      remark: prof.remark || "",
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
    });

    try {
      if (editingProfile) {
        const updated = await profileService.updateProfile(editingProfile.id, payload);
        setProfiles((prev) =>
          prev.map((p) => (p.id === editingProfile.id ? { ...p, ...updated } : p))
        );
        showToast("success", `Profile "${payload.profileName || editingProfile.profileName}" updated successfully!`);
      } else {
        const created = await profileService.createProfile(payload as CreateProfileDto);
        setProfiles((prev) => [created, ...prev]);
        showToast("success", `Profile "${created.profileName}" created successfully!`);
      }

      setIsFormModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Save profile error:", err);
      showToast("error", err?.message || "Failed to save profile record.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Single Profile
  const handleDeleteProfile = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete profile "${name}"?`)) return;

    try {
      await profileService.deleteProfile(id, "Deleted via admin portal");
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast("success", `Profile "${name}" deleted successfully.`);
    } catch (err: any) {
      console.error("Delete profile error:", err);
      showToast("error", err?.message || "Failed to delete profile.");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected profiles?`)) return;

    try {
      await profileService.bulkDeleteProfiles(selectedIds, "Bulk deleted");
      setProfiles((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      showToast("success", `${selectedIds.length} profile record(s) deleted.`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      showToast("error", err?.message || "Bulk delete operation failed.");
    }
  };

  // Checkbox selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProfiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProfiles.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered List
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      (p.profileName && p.profileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.profileCode && p.profileCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.jobTitle && p.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.designation && p.designation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = employmentFilter === "all" || p.employmentType === employmentFilter;

    return matchesSearch && matchesType;
  });

  const getEmploymentBadge = (type?: EmploymentType) => {
    switch (type) {
      case "full_time":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            Full Time
          </span>
        );
      case "part_time":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/30">
            Part Time
          </span>
        );
      case "contract":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
            Contract
          </span>
        );
      case "intern":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            Intern
          </span>
        );
      case "freelance":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
            Freelance
          </span>
        );
      default:
        return <span className="text-slate-500">—</span>;
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
          {/* Notification Toast */}
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

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Job Profiles & Role Definitions
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure position profiles, designations, departments, and job level specifications
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
                <span>Add Profile</span>
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
                Total Profiles
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {profiles.length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Full-Time Positions
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {profiles.filter((p) => p.employmentType === "full_time").length}
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-[#1E2638]">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                Contract & Intern
              </span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {profiles.filter((p) => p.employmentType === "contract" || p.employmentType === "intern").length}
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
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by profile code, name, department, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Employment Type Filter */}
              <div className="flex items-center gap-2 bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={employmentFilter}
                  onChange={(e) => setEmploymentFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#141A2C]">All Employment Types</option>
                  <option value="full_time" className="bg-[#141A2C]">Full Time</option>
                  <option value="part_time" className="bg-[#141A2C]">Part Time</option>
                  <option value="contract" className="bg-[#141A2C]">Contract</option>
                  <option value="intern" className="bg-[#141A2C]">Intern</option>
                  <option value="freelance" className="bg-[#141A2C]">Freelance</option>
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

          {/* Profiles Data Table */}
          <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-mono">Loading profiles directory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                    <tr>
                      <th className="py-3.5 px-4 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.length > 0 && selectedIds.length === filteredProfiles.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-bold">Code</th>
                      <th className="py-3.5 px-4 font-bold">Profile Name</th>
                      <th className="py-3.5 px-4 font-bold">Company</th>
                      <th className="py-3.5 px-4 font-bold">Job Title & Level</th>
                      <th className="py-3.5 px-4 font-bold">Department</th>
                      <th className="py-3.5 px-4 font-bold">Employment Type</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.map((prof) => {
                        const isSelected = selectedIds.includes(prof.id);
                        const companyObj = prof.company || companies.find((c) => c.id === prof.companyId);

                        return (
                          <tr
                            key={prof.id}
                            className={`hover:bg-[#121829] transition-colors group cursor-pointer ${
                              isSelected ? "bg-indigo-950/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleSelectOne(prof.id)}
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
                              onClick={() => router.push(`/profile/${prof.id}`)}
                            >
                              {prof.profileCode}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/profile/${prof.id}`)}
                            >
                              <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors">
                                {prof.profileName}
                              </span>
                              {prof.designation && (
                                <span className="text-[10px] text-slate-500 truncate block">
                                  {prof.designation}
                                </span>
                              )}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-300 font-medium"
                              onClick={() => router.push(`/profile/${prof.id}`)}
                            >
                              {companyObj ? companyObj.companyName : `Company #${prof.companyId}`}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/profile/${prof.id}`)}
                            >
                              <span className="text-slate-200 font-medium block">
                                {prof.jobTitle || "—"}
                              </span>
                              {prof.jobLevel && (
                                <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                                  Level {prof.jobLevel}
                                </span>
                              )}
                            </td>

                            <td
                              className="py-3.5 px-4 text-slate-400"
                              onClick={() => router.push(`/profile/${prof.id}`)}
                            >
                              {prof.department || "—"}
                            </td>

                            <td
                              className="py-3.5 px-4"
                              onClick={() => router.push(`/profile/${prof.id}`)}
                            >
                              {getEmploymentBadge(prof.employmentType)}
                            </td>

                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/profile/${prof.id}`}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-white transition-colors"
                                  title="View Full Profile Page"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleOpenEditModal(prof)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Quick Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProfile(prof.id, prof.profileName)}
                                  className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete Profile"
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
                          {profiles.length === 0
                            ? "No profile records found. Click 'Add Profile' to create your first position definition."
                            : "No profile records found matching your search filters."}
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

      {/* CREATE / QUICK EDIT PROFILE MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0F1424] border border-[#1E273E] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#0C101D]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProfile ? `Edit Profile (${editingProfile.profileCode})` : "Create Role Profile"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define position requirements, department, and employment specifications
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
                    onChange={(e) => setFormData({ ...formData, companyId: Number(e.target.value) })}
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
                    Profile Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PROF-ENG-01"
                    value={formData.profileCode}
                    onChange={(e) => setFormData({ ...formData, profileCode: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer Profile"
                  value={formData.profileName}
                  onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                  className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Backend Developer"
                    value={formData.jobTitle || ""}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={formData.department || ""}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Senior Consultant"
                    value={formData.designation || ""}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Level
                  </label>
                  <input
                    type="text"
                    placeholder="L4"
                    value={formData.jobLevel || ""}
                    onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value })}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType || "full_time"}
                    onChange={(e) =>
                      setFormData({ ...formData, employmentType: e.target.value as EmploymentType })
                    }
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role Expectations & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed job responsibilities, skills, and expectations..."
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
                    {formSubmitting ? "Saving..." : editingProfile ? "Save Changes" : "Create Profile"}
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
