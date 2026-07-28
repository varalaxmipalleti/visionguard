"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/context/auth-context";
import {
  Users2, RefreshCw, ShieldCheck,
  Loader2, AlertCircle, CheckCircle2, UserX, Trash2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface UserRecord {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function UserManagementContent() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users.");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user: UserRecord) => {
    if (!token) return;
    setActionLoading(user.id);
    setError(null);
    const action = user.is_active ? "deactivate" : "activate";
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail?.detail || "Action failed.");
      }
      setSuccessMsg(`User "${user.full_name || user.email}" ${action}d successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: UserRecord) => {
    if (!token) return;
    setActionLoading(user.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail?.detail || "Delete failed.");
      }
      setSuccessMsg(`User "${user.full_name || user.email}" permanently deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeleteConfirmId(null);
      await fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Users2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              User Management
            </h1>
          </div>
          <p className="text-slate-500 dark:text-muted-foreground mt-1 text-sm ml-12">
            Manage all registered accounts, roles, and access permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            {total} Total Users
          </span>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-500 dark:text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-muted-foreground">
            <Users2 className="w-8 h-8" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {users.map((u) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  const initials = u.full_name
                    ? u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                    : u.email.charAt(0).toUpperCase();

                  return (
                    <tr key={u.id} className={`group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5 ${!u.is_active ? "opacity-60" : ""}`}>
                      {/* User info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${u.role === "admin" ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-blue-600 to-indigo-600"}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                              {(u.full_name || u.email.split("@")[0]).toUpperCase()}
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">YOU</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          u.role === "admin"
                            ? "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/15"
                            : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${u.is_active ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {u.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      {/* Joined date */}
                      <td className="px-6 py-4 text-slate-500 dark:text-muted-foreground text-xs font-medium">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        {isCurrentUser ? (
                          <span className="text-xs text-slate-400 dark:text-muted-foreground italic">Your account</span>
                        ) : deleteConfirmId === u.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-500 dark:text-red-400 font-semibold">Confirm delete?</span>
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={actionLoading === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={actionLoading === u.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                u.is_active
                                  ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/15"
                                  : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                              }`}
                            >
                              {actionLoading === u.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : u.is_active ? (
                                <UserX className="w-3 h-3" />
                              ) : (
                                <ShieldCheck className="w-3 h-3" />
                              )}
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              disabled={actionLoading === u.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UserManagementContent />
    </AdminGuard>
  );
}
