"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { companyService } from "@/services/company.service";
import { Company, UpdateCompanyDto, CompanyStatus } from "@/types/company.types";
import {
  ArrowLeft,
  Building2,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Palette,
  Clock,
  ShieldCheck,
  Ban,
  Check,
} from "lucide-react";

export default function CompanyDetailClient() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [collapsed, setCollapsed] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateCompanyDto>({} as any);

  const [activeTab, setActiveTab] = useState<
    "overview" | "tax" | "contact" | "address" | "branding" | "defaults"
  >("overview");

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

  const fetchCompanyDetails = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getCompanyById(companyId);
      setCompany(data);
      populateEditForm(data);
    } catch (err: any) {
      console.error("Fetch company error:", err);
      setError(err?.message || "Failed to load company details.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  const populateEditForm = (data: Company) => {
    setEditForm({
      companyCode: data.companyCode || "",
      companyName: data.companyName || "",
      legalName: data.legalName || "",
      displayName: data.displayName || "",
      companyType: data.companyType || "Private Limited",
      industry: data.industry || "",
      description: data.description || "",

      registrationNumber: data.registrationNumber || "",
      cinNumber: data.cinNumber || "",
      gstNumber: data.gstNumber || "",
      panNumber: data.panNumber || "",
      tanNumber: data.tanNumber || "",
      taxIdentificationNumber: data.taxIdentificationNumber || "",

      officialEmail: data.officialEmail || "",
      hrEmail: data.hrEmail || "",
      accountsEmail: data.accountsEmail || "",
      supportEmail: data.supportEmail || "",
      phoneNumber: data.phoneNumber || "",
      alternatePhoneNumber: data.alternatePhoneNumber || "",
      website: data.website || "",

      registeredAddressLine1: data.registeredAddressLine1 || "",
      registeredAddressLine2: data.registeredAddressLine2 || "",
      registeredCity: data.registeredCity || "",
      registeredState: data.registeredState || "",
      registeredCountry: data.registeredCountry || "",
      registeredPostalCode: data.registeredPostalCode || "",

      officeAddressLine1: data.officeAddressLine1 || "",
      officeAddressLine2: data.officeAddressLine2 || "",
      officeCity: data.officeCity || "",
      officeState: data.officeState || "",
      officeCountry: data.officeCountry || "",
      officePostalCode: data.officePostalCode || "",

      logoUrl: data.logoUrl || "",
      signatureUrl: data.signatureUrl || "",
      stampUrl: data.stampUrl || "",
      letterheadUrl: data.letterheadUrl || "",
      primaryColor: data.primaryColor || "",
      secondaryColor: data.secondaryColor || "",
      fontFamily: data.fontFamily || "",

      defaultCurrency: data.defaultCurrency || "INR",
      defaultTimezone: data.defaultTimezone || "Asia/Kolkata",
      defaultDateFormat: data.defaultDateFormat || "YYYY-MM-DD",
      defaultLanguage: data.defaultLanguage || "en",

      status: data.status || "active",
      remark: data.remark || "",
    });
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);

    const payload = cleanPayload(editForm as Record<string, any>);

    try {
      const updated = await companyService.updateCompany(company.id, payload);
      setCompany(updated);
      populateEditForm(updated);
      setIsEditing(false);
      showToast("success", `Company "${updated.companyName}" updated successfully!`);
    } catch (err: any) {
      console.error("Save error:", err);
      showToast("error", err?.message || "Failed to update company details.");
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

  const getStatusPill = (status?: CompanyStatus) => {
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
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Suspended
          </span>
        );
      default:
        return <span className="text-slate-500">—</span>;
    }
  };

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
              href="/company"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Company Directory</span>
            </Link>

            {company && (
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchCompanyDetails}
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
                    <span>Edit Company Details</span>
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
                onClick={fetchCompanyDetails}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[11px] text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="glass-card p-16 rounded-2xl border border-[#1E2638] text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-mono text-slate-400">Loading company specifications...</p>
            </div>
          ) : company ? (
            <form onSubmit={handleSaveEdits} className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xl font-extrabold shadow-xl">
                    {company.companyCode ? company.companyCode.substring(0, 4) : "CMP"}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-extrabold text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            required
                            value={editForm.companyName}
                            onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                            className="bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1 text-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          company.companyName
                        )}
                      </h1>
                      {getStatusPill(isEditing ? editForm.status : company.status)}
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Code: <span className="text-indigo-400 font-bold">{company.companyCode}</span>
                      {company.legalName && ` • ${company.legalName}`}
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

              <div className="flex border-b border-[#1E2638] bg-[#0A0D17] px-2 gap-4 overflow-x-auto text-xs font-semibold">
                {[
                  { id: "overview", label: "General & Overview" },
                  { id: "tax", label: "Tax & Registration (6 fields)" },
                  { id: "contact", label: "Contacts & Web (7 fields)" },
                  { id: "address", label: "Registered & Office Address (12 fields)" },
                  { id: "branding", label: "Branding & Media (7 fields)" },
                  { id: "defaults", label: "Defaults & Settings (6 fields)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3.5 px-3 border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-white font-bold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="glass-card p-6 rounded-2xl border border-[#1E2638] space-y-6 animate-in fade-in">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-[#1E2638] pb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    General Entity Overview
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                      <span className="text-slate-400 block mb-1 font-medium">Company Code</span>
                      {isEditing ? (
                        <input
                          type="text"
                          required
                          value={editForm.companyCode}
                          onChange={(e) => setEditForm({ ...editForm, companyCode: e.target.value })}
                          className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      ) : (
                        renderField(company.companyCode)
                      )}
                    </div>

                    <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                      <span className="text-slate-400 block mb-1 font-medium font-medium">Legal Registered Name</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.legalName || ""}
                          onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })}
                          className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      ) : (
                        renderField(company.legalName)
                      )}
                    </div>

                    <div className="p-4 bg-[#111626] rounded-xl border border-[#1E2638]">
                      <span className="text-slate-400 block mb-1 font-medium font-medium">Display Brand Name</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.displayName || ""}
                          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      ) : (
                        renderField(company.displayName)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500">Company record not found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
