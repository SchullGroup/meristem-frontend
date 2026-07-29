"use client";

import { useState } from "react";
import { KycLanding, type KycView } from "@/components/custom/kyc-module/landing";
import { StandardKyc } from "@/components/custom/kyc-module/standard-kyc";
import { NibssMandate } from "@/components/custom/kyc-module/nibss-mandate";
import { CscsInbox } from "@/components/custom/kyc-module/cscs-inbox";
import { MericonnectInbox } from "@/components/custom/kyc-module/mericonnect-inbox";
import { HodQueue } from "@/components/custom/kyc-module/hod-queue";

export default function KYCUpdatePage() {
  const [view, setView] = useState<KycView | "landing">("landing");

  const backToHome = () => setView("landing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KYC Update</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update shareholder identity and bank information across all channels through one auditable
          approval pipeline.
        </p>
      </div>

      {view === "landing" && <KycLanding onNavigate={setView} />}
      {view === "standard" && <StandardKyc onBack={backToHome} />}
      {view === "nibss" && <NibssMandate onBack={backToHome} />}
      {view === "cscs" && <CscsInbox onBack={backToHome} />}
      {view === "mericonnect" && <MericonnectInbox onBack={backToHome} />}
      {view === "hod" && <HodQueue onBack={backToHome} />}
    </div>
  );
}
