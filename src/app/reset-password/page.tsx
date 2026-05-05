"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { BrandPanel } from "@/components/custom/auth/brand-panel";
import { SiteLogo } from "@/components/custom/auth/site-logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = () => {
    setError("");
    
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {!isSuccess ? (
            <div className="space-y-8">
              <SiteLogo />

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  Set new password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Please choose a strong password for your account
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">New Password</label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="••••••••"
                      className="mrpsl-input"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="mrpsl-label">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="mrpsl-input"
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive font-medium">
                    {error}
                  </p>
                )}

                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={handleReset}
                  disabled={isLoading || !token}
                >
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {isLoading ? "Resetting…" : "Reset Password"}
                </Button>
                
                {!token && (
                  <p className="text-[10px] text-center text-destructive/80">
                    Invalid or missing reset token. Please request a new link.
                  </p>
                )}
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                onClick={() => router.push("/login")}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          ) : (
            <div className="space-y-8 text-center animate-in fade-in zoom-in duration-300">
              <SiteLogo />

              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-700" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Password updated
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully.
                </p>
                <p className="text-sm text-muted-foreground pt-4">
                  Redirecting you to the login page...
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Go to login now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
