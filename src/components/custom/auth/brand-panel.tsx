"use client";

import { ShieldCheck } from "lucide-react";
import { WhiteSiteLogo } from "./site-logo-white";

export function BrandPanel() {
  return (
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
        style={{
          background: "radial-gradient(circle, white 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-fit">
        <WhiteSiteLogo />
        {/* <p className="text-white font-bold text-lg tracking-tight leading-none">
          MRPSL
        </p>
        <p className="text-white/50 text-[10px] uppercase tracking-[0.18em] mt-0.5">
          Core Processing Application
        </p> */}
      </div>
      <div className="relative z-10 space-y-4">
        <h2 className="text-white text-[2.6rem] font-bold tracking-tight leading-[1.15] max-w-sm">
          Registrar
          <br />
          Excellence.
          <br />
          <span className="text-white/60">
            Powered by
            <br />
            Precision.
          </span>
        </h2>
        <div className="flex items-center gap-2 mt-6">
          <ShieldCheck className="h-4 w-4 text-white/40" />
          <p className="text-white/40 text-xs">
            ISO 27001 compliant · SEC-regulated · End-to-end encrypted
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-white/30 text-xs">v2.0 — April 2026</span>
        <span className="text-white/30 text-xs">
          Meristem Registrars Limited
        </span>
      </div>
    </div>
  );
}
