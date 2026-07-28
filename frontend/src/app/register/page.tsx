"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Lock, Mail, ArrowRight, ShieldAlert, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2, Circle, AlertCircle, User as UserIcon } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const { register } = useAuth();

  // Email formatting validation
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

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

  const canSubmit = isEmailValid && isPasswordValid && passwordsMatch && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);

    if (!isEmailValid) {
      setError("Please enter a valid business or personal email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please satisfy all security password criteria before proceeding.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Entered password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, fullName);
    } catch (err: any) {
      setError(err.message || "Could not register account. Email might already exist in database.");
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
      <div className="absolute top-1/3 right-1/3 w-[450px] h-[450px] bg-indigo-600/15 dark:bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] bg-blue-600/15 dark:bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 my-8">
        <div className="text-center space-y-2">
          <span className="font-cursive font-bold text-4xl text-blue-600 dark:text-blue-400 select-none drop-shadow-[0_2px_12px_rgba(37,99,235,0.3)] block">
            VisionGuard Ai
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white mt-3">
            Complete your registration here
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
            Create an automated security profile with email verification and credential validation enabled.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl p-7 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Full Legal / Professional Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Email Field with Validation Feedback */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Official Email Address</span>
                {emailTouched && email.length > 0 && (
                  isEmailValid ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid Email format
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" /> Invalid domain format
                    </span>
                  )
                )}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onBlur={() => setEmailTouched(true)}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-black/40 border text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    emailTouched && email.length > 0 && !isEmailValid
                      ? "border-rose-500/50 focus:ring-rose-500/30"
                      : "border-slate-200 dark:border-white/15 focus:ring-blue-500/50"
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Create Secure Password
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
                <span>Confirm Security Password</span>
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
                  placeholder="Re-type password exactly"
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
                    <span>Dispatching Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              {!canSubmit && (email.length > 0 || password.length > 0) && (
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  ⚠️ Complete all validation rules above to activate registration.
                </p>
              )}
            </div>
          </form>

          <div className="pt-3 border-t border-slate-200/70 dark:border-white/5 text-center text-xs text-slate-500 dark:text-muted-foreground">
            Already enrolled in VisionGuard?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
