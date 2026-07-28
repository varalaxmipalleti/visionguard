"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldAlert, Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!token || !user)) {
      router.replace("/login");
    }
  }, [isLoading, token, user, router]);

  if (isLoading || !token || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-500 dark:text-muted-foreground space-y-4 font-sans transition-colors duration-300">
        <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide animate-pulse">
          Authenticating access credentials...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
