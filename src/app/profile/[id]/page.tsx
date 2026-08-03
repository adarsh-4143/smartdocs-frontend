"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { profileService } from "@/services/profile.service";
import { companyService } from "@/services/company.service";
import { Profile, UpdateProfileDto, EmploymentType } from "@/types/profile.types";
import { Company } from "@/types/company.types";
import {
  ArrowLeft,
  UserCheck,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Briefcase,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  Tag,
} from "lucide-react";

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;

  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateProfileDto>({} as any);

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

  // Load single profile by ID and companies list
  const fetchProfileDetails = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const [profData, companyData] = await Promise.all([
        profileService.getProfileById(profileId),
        companyService.getAllCompanies().catch(() => []),
      ]);
      setProfile(profData);
      setCompanies(companyData);
      populateEditForm(profData);
    } catch (err: any) {
      console.error("Fetch profile details error:", err);
      setError(err?.message || "Failed to load profile specifications.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfileDetails();
  }, [fetchProfileDetails]);

  const populateEditForm = (data: Profile) => {
    setEditForm({
      companyId: data.companyId,
      profileCode: data.profileCode || "",
      profileName: data.profileName || "",
      jobTitle: data.jobTitle || "",
      department: data.department || "",
      designation: data.designation || "",
      jobLevel: data.jobLevel || "",
      employmentType: data.employmentType || "full_time",
      description: data.description || "",
      remark: data.remark || "",
    });
  };

  // Submit edits directly from this page
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const payload = cleanPayload({
      ...editForm,
      companyId: Number(editForm.companyId),
    });

    try {
      const updated = await profileService.updateProfile(profile.id, payload);
      setProfile(updated);
      populateEditForm(updated);
      setIsEditing(false);
      showToast("success", `Profile "${updated.profileName}" updated successfully!`);
    } catch (err: any) {
      console.error("Save profile error:", err);
      showToast("error", err?.message || "Failed to update profile details.");
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

  const getEmploymentBadge = (type?: EmploymentType) => {
    switch (type) {
      case "full_time":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            Full Time
          </span>
        );
      case "part_time":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/30">
            Part Time
          </span>
        );
      case "contract":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
            Contract
          </span>
        );
      case "intern":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            Intern
          </span>
        );
      case "freelance":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
            Freelance
          </span>
        );
      default:
        return <span className="text-slate-500">—</span>;
    }
  };

  const companyObj = profile?.company || companies.find((c) => c.id === profile?.companyId);

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

          {/* Top Bar Navigation & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Profiles Directory</span>
            </Link>

            {profile && (
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchProfileDetails}
                  className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all"
                  title="Reload Profile"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-500/20"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile Details</span>
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
                onClick={fetchProfileDetails}
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
              <p className="text-xs font-mono text-slate-400">Loading profile specifications...</p>
            </div>
          ) : profile ? (
            <form onSubmit={handleSaveEdits} className="space-y-6">
              {/* Header Banner Card */}
              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xl font-extrabold shadow-xl">
                    <UserCheck className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-extrabold text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            required
                            value={editForm.profileName}
                            onChange={(e) => setEditForm({ ...editForm, profileName: e.target.value })}
                            className="bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1 text-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          profile.profileName
                        )}
                      </h1>
                      {getEmploymentBadge(isEditing ? editForm.employmentType : profile.employmentType)}
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                      Code: <span className="text-indigo-400 font-bold">{profile.profileCode}</span>
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

              {/* Full Details Display / Edit Grid */}
              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E2638] pb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Profile Specifications & All Fields
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Field 1: Profile Code */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Profile Code</span>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.profileCode}
                        onChange={(e) => setEditForm({ ...editForm, profileCode: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    ) : (
                      renderField(profile.profileCode)
                    )}
                  </div>

                  {/* Field 2: Profile Name */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Profile Name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.profileName}
                        onChange={(e) => setEditForm({ ...editForm, profileName: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(profile.profileName)
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
                      renderField(companyObj ? `${companyObj.companyName} (${companyObj.companyCode})` : `Company ID #${profile.companyId}`)
                    )}
                  </div>

                  {/* Field 4: Job Title */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Job Title</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.jobTitle || ""}
                        onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(profile.jobTitle)
                    )}
                  </div>

                  {/* Field 5: Department */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Department</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.department || ""}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(profile.department)
                    )}
                  </div>

                  {/* Field 6: Designation */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Designation</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.designation || ""}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    ) : (
                      renderField(profile.designation)
                    )}
                  </div>

                  {/* Field 7: Job Level */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Job Level</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.jobLevel || ""}
                        onChange={(e) => setEditForm({ ...editForm, jobLevel: e.target.value })}
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    ) : (
                      renderField(profile.jobLevel)
                    )}
                  </div>

                  {/* Field 8: Employment Type */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Employment Type</span>
                    {isEditing ? (
                      <select
                        value={editForm.employmentType || "full_time"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, employmentType: e.target.value as EmploymentType })
                        }
                        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                        <option value="freelance">Freelance</option>
                      </select>
                    ) : (
                      getEmploymentBadge(profile.employmentType)
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
                      renderField(profile.remark)
                    )}
                  </div>

                  {/* Field 10: Created At */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Created Timestamp</span>
                    {renderField(profile.createdAt ? new Date(profile.createdAt).toLocaleString() : null)}
                  </div>

                  {/* Field 11: Updated At */}
                  <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                    <span className="text-slate-400 block mb-1 font-medium">Last Modified Timestamp</span>
                    {renderField(profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : null)}
                  </div>
                </div>

                {/* Field 12: Description */}
                <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                  <span className="text-slate-400 block mb-1 font-medium">Description & Role Expectations</span>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg p-3 text-xs text-white"
                    />
                  ) : (
                    renderField(profile.description)
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Profile record not found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
