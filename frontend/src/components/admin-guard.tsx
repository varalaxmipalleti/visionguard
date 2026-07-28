"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldX, Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * AdminGuard wraps any page that requires admin role.
 * - If loading: shows spinner
 * - If user is not admin: shows access denied screen and redirects to /dashboard
 * - If user is admin: renders the protected children
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">
          Verifying administrator clearance...
        </p>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-4 text-center px-6">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-muted-foreground max-w-sm">
          This area requires Administrator clearance. You are being redirected to your dashboard.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
