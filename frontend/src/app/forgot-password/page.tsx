"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mail, ArrowRight, ShieldAlert, Loader2, CheckCircle2, KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid administrator email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit recovery request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Absolute theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/3 w-[450px] h-[450px] bg-blue-600/15 dark:bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-lg shadow-blue-500/15 mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Password Recovery Engine
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
            Enter your official email to receive a secure cryptographic password reset link.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl p-8 space-y-6">
          {submitted ? (
            <div className="space-y-6 text-center animate-in fade-in duration-500">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium space-y-2 text-left">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Recovery Link Dispatched!</span>
                </div>
                <p>
                  If an account matching <strong>{email}</strong> exists in our Neon DB repository, a real password reset link has just been dispatched directly to your inbox from our Gmail server!
                </p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Check your spam folder if you do not see it within 60 seconds, or review the terminal output in developer console mode.
              </p>
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In Portal</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Neural Mailer...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="pt-5 border-t border-slate-200/70 dark:border-white/5 text-center text-xs text-slate-500 dark:text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
