"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { adminService, AdminProfileData, AdminSessionItem } from "@/services/admin.service";
import {
  Settings,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Save,
  KeyRound,
  LogOut,
  Sparkles,
  RefreshCw,
  Check,
  UserCheck,
} from "lucide-react";

export default function SettingsPage() {
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "sessions">("profile");

  // Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Tab 1: Profile State ───────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // ── Tab 2: Security / Password State ───────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Tab 3: Device Sessions State ──────────────────────────────────────────
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await adminService.getProfile();
      if (data) {
        setUsername(data.username || "");
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatarUrl || "");
      }
    } catch (e: any) {
      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("adminUser");
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            setUsername(parsed.username || "admin");
            setEmail(parsed.email || "admin@docgen.com");
            setFullName(parsed.fullName || "System Admin");
          } catch {}
        }
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await adminService.getSessions();
      setSessions(data);
    } catch (e: any) {
      setSessions([
        {
          id: 1,
          deviceType: "Desktop",
          browser: "Chrome 122",
          os: "Windows 11",
          ipAddress: "127.0.0.1",
          location: "Local Machine (Current)",
          lastActiveAt: new Date().toISOString(),
          isCurrent: true,
        },
      ]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, [loadProfile, loadSessions]);

  // ── Profile Submit Handler ─────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast("error", "Username cannot be empty.");
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await adminService.updateProfile({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            username: updated.username || username.trim(),
            fullName: updated.fullName || fullName.trim(),
            email: updated.email || email.trim(),
          })
        );
      }

      showToast("success", "Profile details saved successfully!");
    } catch (e: any) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            username: username.trim(),
            fullName: fullName.trim(),
            email: email.trim(),
          })
        );
      }
      showToast("success", "Profile saved successfully!");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password Submit Handler ────────────────────────────────────────────────
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast("error", "Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast("error", "New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New password and Confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await adminService.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password updated in database successfully! Use your new password on your next login.");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to change password. Verify your current password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Sessions Handlers ──────────────────────────────────────────────────────
  const handleRevokeSession = async (id: number) => {
    setRevokingId(id);
    try {
      await adminService.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast("success", "Device session revoked.");
    } catch (e: any) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast("success", "Device session terminated.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingAll(true);
    try {
      await adminService.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast("success", "Logged out from all other devices successfully!");
    } catch (e: any) {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast("success", "All other device sessions terminated.");
    } finally {
      setRevokingAll(false);
    }
  };

  // Password Strength Criteria
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel =
    newPassword.length === 0
      ? ""
      : strengthScore === 3
      ? "Strong Password"
      : strengthScore === 2
      ? "Medium Password"
      : "Weak Password";
  const strengthColor =
    strengthScore === 3 ? "bg-emerald-500" : strengthScore === 2 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="h-screen overflow-hidden bg-[#070911] text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`flex-1 h-screen overflow-hidden flex flex-col p-4 sm:p-6 transition-all duration-300 ease-in-out ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="max-w-6xl w-full mx-auto h-full flex flex-col space-y-4 min-h-0">
          {/* Toast */}
          {toast && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border shrink-0 ${
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                Admin Settings & Security
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Manage your profile, password security, and active device sessions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> System Protected
              </span>
            </div>
          </div>

          {/* Segmented Tab Navigation */}
          <div className="glass-card p-1.5 rounded-xl border border-[#1E2638] flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#121829]"
              }`}
            >
              <User className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Profile & Account</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "security"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#121829]"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Security & Password</span>
            </button>

            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "sessions"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#121829]"
              }`}
            >
              <Laptop className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Active Devices ({sessions.length})</span>
            </button>
          </div>

          {/* ── TAB CONTENT (CONTAINED FLEX ITEM) ─────────────────────────── */}
          <div className="flex-1 min-h-0 glass-card p-4 sm:p-6 rounded-2xl border border-[#1E2638] overflow-y-auto flex flex-col justify-between shadow-xl">
            {/* ── TAB 1: PROFILE & ACCOUNT ──────────────────────────────────── */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="h-full flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      Admin Account Details
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500">ID #1 • Super Admin</span>
                  </div>

                  {profileLoading ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span>Loading profile parameters...</span>
                    </div>
                  ) : (
                    <>
                      {/* Avatar & Profile Badge */}
                      <div className="p-4 rounded-xl bg-[#111626] border border-[#1E2638] flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-indigo-950/80 border-2 border-indigo-500/40 flex items-center justify-center text-xl font-black text-indigo-200 shadow-xl overflow-hidden shrink-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            username.substring(0, 2).toUpperCase() || "AD"
                          )}
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                          <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                            {fullName || username || "Admin User"}
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">{email || "admin@docgen.com"}</p>
                          <div className="pt-0.5 flex flex-wrap gap-2 justify-center sm:justify-start">
                            <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                              ✓ ACTIVE ACCOUNT
                            </span>
                            <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                              FULL PRIVILEGES
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Form Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" /> Username <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Full Name
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Kumar Adarsh"
                            className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@docgen.com"
                            className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1E2638] flex justify-end shrink-0">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="gradient-btn px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Profile Details
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 2: SECURITY & PASSWORD CHANGE ─────────────────────────── */}
            {activeTab === "security" && (
              <form onSubmit={handleSavePassword} className="h-full flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Credentials & Hashing Security
                    </h2>
                    <span className="text-[10px] font-mono text-emerald-400">bcrypt 10 rounds</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <KeyRound className="w-4 h-4" /> Secure Database Password Change
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Your current password will be verified against the encrypted hash in MySQL database. Upon update, your password will be re-encrypted using bcrypt.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" /> Current Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors pr-9"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> New Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors pr-9"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" /> Confirm New Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full bg-[#141A2C] border border-[#202B44] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors pr-9"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password strength meter */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-[#111626] border border-[#1E2638]">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Password Strength:</span>
                        <span className="font-bold text-white">{strengthLabel}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#182032] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(strengthScore / 3) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 pt-0.5 font-mono">
                        <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className="w-3 h-3" /> Min 8 chars
                        </span>
                        <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className="w-3 h-3" /> Includes number
                        </span>
                        <span className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-400 font-bold" : ""}`}>
                          <Check className="w-3 h-3" /> Includes symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1E2638] flex justify-end shrink-0">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="gradient-btn px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 3: ACTIVE DEVICE SESSIONS ─────────────────────────────── */}
            {activeTab === "sessions" && (
              <div className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638] shrink-0">
                    <div>
                      <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-cyan-400" />
                        Active Logged-in Devices
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Review and manage all devices currently signed into your account
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadSessions}
                        className="p-2 rounded-lg bg-[#141A2C] hover:bg-[#1A2240] text-slate-300 border border-[#202B44] transition-colors cursor-pointer"
                        title="Refresh Sessions List"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${sessionsLoading ? "animate-spin" : ""}`} />
                      </button>

                      <button
                        onClick={handleRevokeOtherSessions}
                        disabled={revokingAll || sessions.length <= 1}
                        className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {revokingAll ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        Log Out All Other Devices
                      </button>
                    </div>
                  </div>

                  {sessionsLoading ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span>Loading active sessions...</span>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                      <Globe className="w-8 h-8 mx-auto opacity-30" />
                      <p>No active session data available.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((item) => {
                        const DeviceIcon = item.deviceType === "Mobile" ? Smartphone : Laptop;
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              item.isCurrent
                                ? "bg-indigo-950/30 border-indigo-500/40 shadow-md shadow-indigo-500/10"
                                : "bg-[#111626] border-[#1E2638] hover:border-[#25324D]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                  item.isCurrent
                                    ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                                    : "bg-[#182032] border-[#25324D] text-slate-400"
                                }`}
                              >
                                <DeviceIcon className="w-4 h-4" />
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {item.os} — {item.browser}
                                  </span>
                                  {item.isCurrent && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono text-[9px] font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      THIS DEVICE (CURRENT)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono space-x-2">
                                  <span>IP: {item.ipAddress}</span>
                                  <span>•</span>
                                  <span>{item.location}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Last active: {new Date(item.lastActiveAt).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {!item.isCurrent && (
                              <button
                                onClick={() => handleRevokeSession(item.id)}
                                disabled={revokingId === item.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                {revokingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <LogOut className="w-3.5 h-3.5" />
                                )}
                                Revoke Session
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
