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

export default function ProfileDetailClient() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;

  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateProfileDto>({} as any);

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

          {loading ? (
            <div className="glass-card p-16 rounded-2xl border border-[#1E2638] text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-mono text-slate-400">Loading profile specifications...</p>
            </div>
          ) : profile ? (
            <form onSubmit={handleSaveEdits} className="space-y-6">
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
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500">Profile record not found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
