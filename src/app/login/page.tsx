"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ArrowLeft, Mail, KeyRound } from "lucide-react";

type Step = "credentials" | "2fa" | "forgot" | "forgot-sent";

const MOCK_OTP = "123456";

export default function LoginPage() {
  const router  = useRouter();
  const { currentUser, setCurrentUser, users, seedStore } = useStore();

  // ── Flow state ────────────────────────────────────────────────
  const [step, setStep]                 = useState<Step>("credentials");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [otp, setOtp]                   = useState(["", "", "", "", "", ""]);
  const [forgotEmail, setForgotEmail]   = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resolvedUserId, setResolvedUserId] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { seedStore(); }, [seedStore]);
  useEffect(() => { if (currentUser) router.replace("/"); }, [currentUser, router]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const maskedEmail = email.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}${"•".repeat(4)}${c}`);

  // ── Step handlers ─────────────────────────────────────────────

  const handleCredentials = () => {
    setError("");
    if (!email)    { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setIsLoading(true);
    setTimeout(() => {
      // Match by email for prototype; fall back to first user
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? users[0];
      setResolvedUserId(matched?.id ?? "");
      setIsLoading(false);
      setOtp(["", "", "", "", "", ""]);
      setStep("2fa");
      setResendCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }, 900);
  };

  const handleVerifyOtp = () => {
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setIsLoading(true);
    setTimeout(() => {
      if (code === MOCK_OTP) {
        const user = users.find(u => u.id === resolvedUserId) ?? users[0];
        if (user) { setCurrentUser(user); router.push("/"); }
      } else {
        setError("Incorrect code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        setIsLoading(false);
      }
    }, 800);
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setResendCountdown(30);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const handleForgot = () => {
    setError("");
    if (!forgotEmail) { setError("Please enter your email address."); return; }
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setStep("forgot-sent"); }, 1000);
  };

  // ── OTP input handlers ────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every(d => d !== "") && next.join("").length === 6) {
      // auto-submit when complete
      setTimeout(() => {
        const code = next.join("");
        if (code === MOCK_OTP) {
          setIsLoading(true);
          setTimeout(() => {
            const user = users.find(u => u.id === resolvedUserId) ?? users[0];
            if (user) { setCurrentUser(user); router.push("/"); }
          }, 600);
        } else {
          setError("Incorrect code. Please try again.");
          setOtp(["", "", "", "", "", ""]);
          setTimeout(() => otpRefs.current[0]?.focus(), 50);
        }
      }, 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp]; next[index] = ""; setOtp(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next  = Array(6).fill("");
    text.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    setError("");
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // ── Left brand panel (shared) ─────────────────────────────────

  const BrandPanel = () => (
    <div className="hidden lg:flex w-[52%] bg-primary flex-col justify-between p-14 relative overflow-hidden shrink-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-center">
          <Image src="/logo.svg" alt="Meristem Logo" width={120} height={28} className="h-7 w-auto object-contain" priority />
        </div>
      </div>
      <div className="relative z-10 space-y-4">
        <h2 className="text-white text-[2.6rem] font-bold tracking-tight leading-[1.15] max-w-sm">
          Registrar<br />Excellence.<br />
          <span className="text-white/60">Powered by<br />Precision.</span>
        </h2>
        <div className="flex items-center gap-2 mt-6">
          <ShieldCheck className="h-4 w-4 text-white/40" />
          <p className="text-white/40 text-xs">ISO 27001 compliant · SEC-regulated · End-to-end encrypted</p>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-white/30 text-xs">v2.0 — April 2026</span>
        <span className="text-white/30 text-xs">Meristem Registrars Limited</span>
      </div>
    </div>
  );

  const MobileLogo = () => (
    <div className="lg:hidden">
      <Image src="/logo.svg" alt="Meristem Logo" width={140} height={32} className="h-8 w-auto object-contain" priority />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex w-full bg-background">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* ── STEP: Credentials ── */}
          {step === "credentials" && (
            <div className="space-y-8">
              <MobileLogo />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to your MRPSL CPA account</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleCredentials()}
                    placeholder="name@meristemregistrars.com"
                    className="mrpsl-input"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="mrpsl-label">Password</label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline underline-offset-2"
                      onClick={() => {
                        setForgotEmail(email);
                        setError("");
                        setStep("forgot");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleCredentials()}
                    placeholder="••••••••"
                    className="mrpsl-input"
                  />
                </div>

                {error && <p className="text-xs text-destructive font-medium">{error}</p>}

                <Button className="w-full mt-2" size="lg" onClick={handleCredentials} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? "Verifying…" : "Continue"}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
                Prototype application — all data is simulated.<br />
                Select any user above to access the system.
              </p>
            </div>
          )}

          {/* ── STEP: 2FA OTP ── */}
          {step === "2fa" && (
            <div className="space-y-8">
              <MobileLogo />

              {/* Icon */}
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
              </div>

              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold tracking-tight">Two-factor authentication</h1>
                <p className="text-sm text-muted-foreground">
                  A 6-digit code was sent to
                </p>
                <p className="text-sm font-semibold">{maskedEmail}</p>
              </div>

              <div className="space-y-6">
                {/* OTP boxes */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                      className={`h-14 w-11 rounded-xl border text-center text-xl font-bold tabular-nums outline-none transition-all
                        focus:border-primary focus:ring-2 focus:ring-primary/20
                        ${digit ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}
                        ${error ? "border-destructive/50 bg-destructive/5" : ""}
                      `}
                    />
                  ))}
                </div>

                {error && <p className="text-xs text-destructive font-medium text-center">{error}</p>}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join("").length < 6}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? "Verifying…" : "Verify & Sign In"}
                </Button>

                {/* Resend */}
                <div className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive a code?{" "}
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground/60">Resend in {resendCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline underline-offset-2"
                      onClick={handleResend}
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground/50 text-center">
                  Prototype: use code <span className="font-mono font-bold text-foreground/60">{MOCK_OTP}</span>
                </p>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                onClick={() => { setStep("credentials"); setOtp(["","","","","",""]); setError(""); }}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {/* ── STEP: Forgot Password ── */}
          {step === "forgot" && (
            <div className="space-y-8">
              <MobileLogo />

              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Email Address</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleForgot()}
                    placeholder="name@meristemregistrars.com"
                    className="mrpsl-input"
                  />
                </div>

                {error && <p className="text-xs text-destructive font-medium">{error}</p>}

                <Button className="w-full" size="lg" onClick={handleForgot} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? "Sending…" : "Send Reset Link"}
                </Button>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                onClick={() => { setStep("credentials"); setError(""); }}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {/* ── STEP: Forgot Sent ── */}
          {step === "forgot-sent" && (
            <div className="space-y-8 text-center">
              <MobileLogo />

              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-green-700" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
                <p className="text-sm text-muted-foreground">
                  A password reset link has been sent to
                </p>
                <p className="text-sm font-semibold">{forgotEmail}</p>
                <p className="text-xs text-muted-foreground pt-2">
                  The link expires in 30 minutes. Check your spam folder if you don&apos;t see it.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setStep("forgot"); setError(""); }}
                >
                  Try a different email
                </Button>

                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  onClick={() => { setStep("credentials"); setError(""); }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
