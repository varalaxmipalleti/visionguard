"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  User, ShieldCheck, Lock, CheckCircle2,
  Award, LogOut, KeyRound, Trash2, Eye, EyeOff, AlertCircle, Loader2, Circle
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getApiBaseUrl } from "@/lib/utils";

const API_BASE = getApiBaseUrl();

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [email, setEmail] = useState(user?.email || "");
  const [displayName, setDisplayName] = useState("");

  // Change password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setDisplayName((user.full_name || (user.email ? user.email.split("@")[0] : "User")).toUpperCase());
    }
  }, [user]);

  // Real-time password criteria
  const passwordCriteria = useMemo(() => {
    return {
      length: newPwd.length >= 8,
      uppercase: /[A-Z]/.test(newPwd),
      number: /[0-9]/.test(newPwd),
      special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(newPwd),
    };
  }, [newPwd]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordCriteria).every(Boolean);
  }, [passwordCriteria]);

  const passwordsMatch = useMemo(() => {
    return confirmPwd.length > 0 && newPwd === confirmPwd;
  }, [newPwd, confirmPwd]);

  const handleChangePassword = async () => {
    setPwdError(null);
    if (!newPwd || !currentPwd) { setPwdError("All fields are required."); return; }
    if (!isPasswordValid) { setPwdError("Please satisfy all security password criteria before proceeding."); return; }
    if (!passwordsMatch) { setPwdError("New passwords do not match."); return; }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Password change failed.");
      setPwdSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError((err as Error).message);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Deletion failed.");
      }
      logout(); // Auto-logout after account deletion
    } catch (err) {
      setDeleteError((err as Error).message);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {isAdmin ? "Administrator Profile" : "My Profile"}
          </h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-1 text-sm">
            {isAdmin
              ? "Manage enterprise credentials, security clearances, and API authentication keys."
              : "Manage your account details and personal access credentials."}
          </p>
        </div>
      </div>

      {/* Full-width Top Profile Summary Card */}
      <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg shadow-blue-500/25 border border-blue-400/30 uppercase">
              {email.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{displayName}</h2>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>{isAdmin ? "System Administrator" : "Surveillance User"}</span>
                <span>•</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-sm transition-colors border border-red-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </Card>

      {/* 2-Column Grid: Change Password & Delete Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Change Password Card */}
          <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 space-y-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70 dark:border-white/5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Change Password</h3>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Update your login password securely</p>
              </div>
            </div>

            {pwdError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />{pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Password changed successfully!
              </div>
            )}

            <div className="space-y-3">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="At least 8 characters with symbol & digit"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Interactive Password Strength Matrix */}
              {newPwd.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2.5 animate-in fade-in duration-300">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Security Requirement Matrix:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.length ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                      {passwordCriteria.length ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> : <Circle className="w-4 h-4 shrink-0 opacity-40" />}
                      <span>8+ Characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.uppercase ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                      {passwordCriteria.uppercase ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> : <Circle className="w-4 h-4 shrink-0 opacity-40" />}
                      <span>1+ Uppercase Letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.number ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                      {passwordCriteria.number ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> : <Circle className="w-4 h-4 shrink-0 opacity-40" />}
                      <span>1+ Number Digit</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.special ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                      {passwordCriteria.special ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> : <Circle className="w-4 h-4 shrink-0 opacity-40" />}
                      <span>1+ Special Symbol</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Confirm New Password</span>
                  {confirmPwd.length > 0 && (
                    passwordsMatch ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Mismatch detected
                      </span>
                    )
                  )}
                </label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 transition-all ${
                    confirmPwd.length > 0 && !passwordsMatch
                      ? "border-rose-500/50 focus:ring-rose-500/30"
                      : "border-slate-200 dark:border-white/15 focus:ring-blue-500/40"
                  }`}
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={pwdLoading || !isPasswordValid || !passwordsMatch || !currentPwd}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {pwdLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </Card>

          {/* Delete Account Card */}
          <Card className="bg-white dark:bg-white/5 border border-red-200/60 dark:border-red-500/15 rounded-2xl p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Delete Account</h3>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Permanently remove your account and all associated data</p>
              </div>
            </div>

            {deleteError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />{deleteError}
              </div>
            )}

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-sm transition-colors border border-red-500/20 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 text-center">
                  This action is permanent and cannot be undone.
                </p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground text-center">
                  All your cameras, media uploads, and detection history will be deleted forever.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleteLoading ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </Card>
      </div>
    </div>
  );
}
