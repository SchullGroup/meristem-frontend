"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// import Image from "next/image";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Mail,
  KeyRound,
  Eye,
  EyeClosed,
} from "lucide-react";
import { BrandPanel } from "@/components/custom/auth/brand-panel";
import { SiteLogo } from "@/components/custom/auth/site-logo";
import { LOGIN, REQUEST_OTP, REQUEST_PASSWORD_RESET, VERIFY_OTP } from "@/actions/authAction";
import { useMutation } from "@tanstack/react-query";
import { setUserSession } from "@/services/AuthServices";

type Step = "credentials" | "2fa" | "forgot" | "forgot-sent";

// const MOCK_OTP = "123456";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();

  // ── Flow state ────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  // const [resolvedUserId, setResolvedUserId] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (currentUser) router.replace("/");
  }, [currentUser, router]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const maskedEmail = email.replace(
    /^(.)(.*)(@.*)$/,
    (_, a, _b, c) => `${a}${"•".repeat(4)}${c}`,
  );

  // ── Step handlers ─────────────────────────────────────────────

  const loginMutation = useMutation({
    mutationFn: LOGIN,
    onSuccess: (data) => {
      if (data?.isSuccessful && data?.data) {
        // If the message contains "Otp Sent", switch to the 2FA step
        if (data.data.message?.toLowerCase().includes("otp sent")) {
          setStep("2fa");
          setOtp(["", "", "", "", "", ""]); // Clear OTP boxes
          setResendCountdown(30);
          setError(""); // Clear any previous errors
          return;
        }

        // Otherwise, assume it's a direct login success with a token
        const { token, ...userObject } = data.data;

        if (token) {
          setUserSession(userObject, token);
          setCurrentUser(userObject);
          router.replace("/");
        } else {
          setError("Session token not found. Please try again.");
        }
      } else {
        setError(data?.responseMessage || "Login failed. Please try again.");
      }
    },
    onError: (error) => {
      setError(
        error?.message || "Invalid email or password. Please try again.",
      );
      console.error("Login Error:", error);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: VERIFY_OTP,
    onSuccess: (data) => {
      if (data?.isSuccessful && data?.data) {
        const { token, ...userObject } = data.data;
        setUserSession(userObject, token);
        setCurrentUser(userObject);
        router.replace("/");
      } else {
        setError(data?.responseMessage || "Verification failed.");
      }
    },
    onError: (error) => {
      setError(error?.message || "Invalid Otp. Please try again.");
      console.error("OTP Verification Error:", error);
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: REQUEST_OTP,
    onSuccess: (data) => {
      if (data?.isSuccessful && data?.data) {
        setResendCountdown(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        setError(data?.responseMessage || "Verification failed.");
      }
    },
    onError: (error) => {
      setError(error?.message || "Failed to resend code. Please try again.");
    },
  });

  const passwordResetRequestMutation = useMutation({
    mutationFn: REQUEST_PASSWORD_RESET,
    onSuccess: (data) => {
      if (data?.isSuccessful && data?.data) {
        setStep("forgot-sent");
      } else {
        setError(data?.responseMessage || "Password reset request failed.");
      }
    },
    onError: (error) => {
      setError(error?.message || "Failed to request password reset. Please try again.");
    },
  });

  const handleCredentials = () => {
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    const payload = {
      email,
      password,
    };
    loginMutation.mutate({
      email: payload?.email,
      password: payload.password,
    });
  };

  const handleVerifyOtp = () => {
    setError("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    verifyOtpMutation.mutate({
      email,
      otp: code,
    });
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    requestOtpMutation.mutate({
      email,
      otpReason: "LOGIN",
    });
  };

  const handleForgot = () => {
    setError("");
    if (!forgotEmail) {
      setError("Please enter your email address.");
      return;
    }
    passwordResetRequestMutation.mutate({
      email: forgotEmail,
    });
  };

  // ── OTP input handlers ────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "") && next.join("").length === 6) {
      // auto-submit when complete
      const code = next.join("");
      verifyOtpMutation.mutate({
        email,
        otp: code,
      });
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
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
    const next = Array(6).fill("");
    text.split("").forEach((d, i) => {
      next[i] = d;
    });
    setOtp(next);
    setError("");
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // ── Render ────────────────────────────────────────────────────
  if (currentUser) return null;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* ── STEP: Credentials ── */}
          {step === "credentials" && (
            <div className="space-y-8">
              <SiteLogo />

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to your MRPSL CPA account
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleCredentials()}
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
                  <div className="flex items-center relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCredentials()
                      }
                      placeholder="••••••••"
                      className="mrpsl-input"
                    />
                    <button
                      type="button"
                      className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        setShowPassword((prev) => !prev);
                      }}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeClosed className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-destructive font-medium">
                    {error}
                  </p>
                )}

                <Button
                  className="w-full mt-2 cursor-pointer"
                  size="lg"
                  onClick={handleCredentials}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {loginMutation.isPending ? "Verifying…" : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: 2FA OTP ── */}
          {step === "2fa" && (
            <div className="space-y-8">
              <SiteLogo />

              {/* Icon */}
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
              </div>

              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  Two-factor authentication
                </h1>
                <p className="text-sm text-muted-foreground">
                  A 6-digit code was sent to
                </p>
                <p className="text-sm font-semibold">{maskedEmail}</p>
              </div>

              <div className="space-y-6">
                {/* OTP boxes */}
                <div
                  className="flex justify-center gap-2"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={`h-14 w-11 rounded-xl border text-center text-xl font-bold tabular-nums outline-none transition-all
                        focus:border-primary focus:ring-2 focus:ring-primary/20
                        ${digit ? "border-primary/40 bg-primary/5" : "border-gray-400 bg-muted/20"}
                        ${error ? "border-destructive/50 bg-destructive/5" : ""}
                      `}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-destructive font-medium text-center">
                    {error}
                  </p>
                )}

                <Button
                  className="w-full cursor-pointer"
                  size="lg"
                  onClick={handleVerifyOtp}
                  disabled={
                    otp.join("").length < 6 || verifyOtpMutation.isPending
                  }
                >
                  {verifyOtpMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {verifyOtpMutation.isPending
                    ? "Verifying…"
                    : "Verify & Sign In"}
                </Button>

                {/* Resend */}
                <div className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive a code?{" "}
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground/60">
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline underline-offset-2 cursor-pointer"
                      onClick={handleResend}
                    >
                      <div className="flex items-center gap-1">
                        Resend code
                        {requestOtpMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="flex items-center cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                onClick={() => {
                  setStep("credentials");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {/* ── STEP: Forgot Password ── */}
          {step === "forgot" && (
            <div className="space-y-8">
              <SiteLogo />

              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  Reset your password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to
                  reset your password.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Email Address</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleForgot()}
                    placeholder="name@meristemregistrars.com"
                    className="mrpsl-input"
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive font-medium">
                    {error}
                  </p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleForgot}
                  disabled={passwordResetRequestMutation.isPending}
                >
                  {passwordResetRequestMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {passwordResetRequestMutation.isPending ? "Sending…" : "Send Reset Link"}
                </Button>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {/* ── STEP: Forgot Sent ── */}
          {step === "forgot-sent" && (
            <div className="space-y-8 text-center">
              <SiteLogo />

              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-green-700" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Check your email
                </h1>
                <p className="text-sm text-muted-foreground">
                  A password reset link has been sent to
                </p>
                <p className="text-sm font-semibold">{forgotEmail}</p>
                <p className="text-xs text-muted-foreground pt-2">
                  The link expires in 30 minutes. Check your spam folder if you
                  don&apos;t see it.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep("forgot");
                    setError("");
                  }}
                >
                  Try a different email
                </Button>

                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  onClick={() => {
                    setStep("credentials");
                    setError("");
                  }}
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
