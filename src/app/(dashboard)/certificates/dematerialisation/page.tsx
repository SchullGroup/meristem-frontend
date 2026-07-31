"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DematVerification } from "@/components/custom/cert-dematerialization/demat-verification";
import { DematCertificateCapture } from "@/components/custom/cert-dematerialization/demat-certificate-capture";
import { DematTeamLeadApproval } from "@/components/custom/cert-dematerialization/demat-team-lead-approval";
import { DematHodApproval } from "@/components/custom/cert-dematerialization/demat-hod-approval";
import { DematIcuApproval } from "@/components/custom/cert-dematerialization/demat-icu-approval-new";
import { DematCooApproval } from "@/components/custom/cert-dematerialization/demat-coo-approval";
import { DematLodgment } from "@/components/custom/cert-dematerialization/demat-lodgment-new";
import { DematReversal } from "@/components/custom/cert-dematerialization/demat-reversal-new";
import { DematHistory } from "@/components/custom/cert-dematerialization/demat-history";
import { useGetWorkflowStageCounts } from "@/hooks/useCertDematerialisation";

function CountBadge({ n }: { n?: number }) {
  if (!n) return null;
  return <Badge variant="secondary" className="text-xs px-1.5 py-0">{n}</Badge>;
}

export default function DematerializationPage() {
  const [activeTab, setActiveTab] = useState("verification");
  const { data: counts } = useGetWorkflowStageCounts();

  // Backend stage-counts keys (per DematStatus + derived PENDING_COO / READY_FOR_ICU).
  const teamLead = counts?.DRAFT;
  const hod = counts?.CALLOVER;
  const icu = counts?.READY_FOR_ICU;
  const ceo = counts?.PENDING_COO;
  const lodgment = counts?.ICU_APPROVED;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dematerialisation</h1>
        <p className="text-sm text-muted-foreground mt-1">Convert physical share certificates to electronic form.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab((v as string) || "verification")} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-5">
          <TabsTrigger value="verification" className="gap-1.5 cursor-pointer px-3 py-2">Verification</TabsTrigger>
          <TabsTrigger value="capture" className="gap-1.5 cursor-pointer px-3 py-2">Certificate Capture</TabsTrigger>
          <TabsTrigger value="teamlead" className="gap-1.5 cursor-pointer px-3 py-2">Team Lead Approval <CountBadge n={teamLead} /></TabsTrigger>
          <TabsTrigger value="hod" className="gap-1.5 cursor-pointer px-3 py-2">HOD Approval <CountBadge n={hod} /></TabsTrigger>
          <TabsTrigger value="icu" className="gap-1.5 cursor-pointer px-3 py-2">ICU Approval <CountBadge n={icu} /></TabsTrigger>
          <TabsTrigger value="coo" className="gap-1.5 cursor-pointer px-3 py-2">CEO Approval <CountBadge n={ceo} /></TabsTrigger>
          <TabsTrigger value="lodgment" className="gap-1.5 cursor-pointer px-3 py-2">CSCS Lodgment <CountBadge n={lodgment} /></TabsTrigger>
          <TabsTrigger value="reversal" className="gap-1.5 cursor-pointer px-3 py-2">Reversal</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 cursor-pointer px-3 py-2">History</TabsTrigger>
        </TabsList>

        <TabsContent value="verification"><DematVerification /></TabsContent>
        <TabsContent value="capture"><DematCertificateCapture /></TabsContent>
        <TabsContent value="teamlead"><DematTeamLeadApproval /></TabsContent>
        <TabsContent value="hod"><DematHodApproval /></TabsContent>
        <TabsContent value="icu"><DematIcuApproval /></TabsContent>
        <TabsContent value="coo"><DematCooApproval /></TabsContent>
        <TabsContent value="lodgment"><DematLodgment /></TabsContent>
        <TabsContent value="reversal"><DematReversal /></TabsContent>
        <TabsContent value="history"><DematHistory /></TabsContent>
      </Tabs>
    </div>
  );
}
