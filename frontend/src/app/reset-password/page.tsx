"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Lock, ArrowRight, ShieldAlert, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2, Circle, AlertCircle, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword } = useAuth();

  // Real-time password criteria
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordCriteria).every(Boolean);
  }, [passwordCriteria]);

  const passwordsMatch = useMemo(() => {
    return confirmPassword.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  const canSubmit = isPasswordValid && passwordsMatch && !isSubmitting && token.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("No valid security token found in URL link. Please request a new recovery email.");
      return;
    }

    if (!isPasswordValid || !passwordsMatch) {
      setError("Please satisfy all password criteria and match validation rules.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
    } catch (err: any) {
      setError(err.message || "Invalid or expired password reset token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl p-8 space-y-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold space-y-2 text-left">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <span>Missing Security Token</span>
          </div>
          <p>
            No recovery token was supplied in your URL address. Please make sure you clicked the entire link delivered to your Gmail inbox.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/25"
        >
          <span>Request New Reset Link</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl p-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs flex items-center gap-2 font-medium">
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>Security Token Validated: Ready to assign new encrypted password.</span>
        </div>

        {/* New Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Enter New Secure Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters with symbol & digit"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-100/70 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Interactive Password Strength Validator */}
        {password.length > 0 && (
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

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Confirm New Password</span>
            {confirmPassword.length > 0 && (
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
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password exactly"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-black/40 border text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                confirmPassword.length > 0 && !passwordsMatch
                  ? "border-rose-500/50 focus:ring-rose-500/30"
                  : "border-slate-200 dark:border-white/15 focus:ring-blue-500/50"
              }`}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encrypting & Updating Credentials...</span>
              </>
            ) : (
              <>
                <span>Save New Password & Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Absolute theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-indigo-600/15 dark:bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 my-8">
        <div className="text-center space-y-2">
          <span className="font-cursive font-bold text-4xl text-blue-600 dark:text-blue-400 select-none drop-shadow-[0_2px_12px_rgba(37,99,235,0.3)] block">
            VisionGuard Ai
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white mt-3">
            Set New Secure Password
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
            Verify your cryptographic token and assign a fresh password to restore dashboard clearance.
          </p>
        </div>

        <Suspense fallback={<div className="text-center p-12 text-slate-500 text-sm">Verifying security token...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-muted-foreground">
          Return without resetting?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
