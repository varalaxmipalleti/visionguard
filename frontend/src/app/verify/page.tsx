"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldCheck, Mail, ArrowRight, ShieldAlert, Loader2, KeyRound, RefreshCw, CheckCircle2 } from "lucide-react";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifyEmail, resendOtp } = useAuth();

  useEffect(() => {
    const pendingEmail = localStorage.getItem("vg_pending_email");
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      setEmail("");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    
    if (otpCode.trim().length !== 6) {
      setError("Please enter a valid 6-digit cryptographic verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail(email, otpCode);
    } catch (err: any) {
      setError(err.message || "Invalid verification code provided.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setIsResending(true);
    try {
      await resendOtp(email);
      setInfoMsg("A fresh 6-digit code has been dispatched to your email & developer console!");
    } catch (err: any) {
      setError("Could not dispatch code. Make sure server is running.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Absolute theme selector */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 dark:bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-lg shadow-blue-500/15 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Verify Email Ownership
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
            Enter the 6-digit verification code dispatched to <span className="text-slate-800 dark:text-slate-200 font-bold">{email || "your email"}</span>.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Target Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block text-left">
                6-Digit Verification Pin
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center tracking-[12px] font-mono py-3.5 rounded-2xl bg-slate-100 dark:bg-black/50 border-2 border-blue-500/40 text-slate-900 dark:text-blue-300 font-extrabold text-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-left">
                Check server console output if SMTP credentials are omitted in dev mode.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Token Signature...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Unlock Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full py-2.5 rounded-xl bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                <span>{isResending ? "Dispatching..." : "Resend Verification Code"}</span>
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-200/70 dark:border-white/5 text-center text-xs text-slate-500 dark:text-muted-foreground">
            Return to portal?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
