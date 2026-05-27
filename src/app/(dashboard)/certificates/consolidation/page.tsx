"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewConsolidation from "@/components/custom/certificate-consolidation/new-consolidation";
import PendingConsolidationApprovals from "@/components/custom/certificate-consolidation/pending-approval";
import { ApprovedConsolidations } from "@/components/custom/certificate-consolidation/approved-consolidations";

type ConsolCert = { num: string; units: number; issueDate: string };

type PendingConsol = {
  id: string;
  date: string;
  account: string;
  holder: string;
  register: string;
  certCount: number;
  totalUnits: number;
  submittedBy: string;
  certs: ConsolCert[];
};

const PENDING_CONSOLS: PendingConsol[] = [
  {
    id: "CO1",
    date: "28 Apr 2026",
    account: "DANGCEM-10015",
    holder: "Binta Lawal",
    register: "Dangote Cement — DANGCEM",
    certCount: 2,
    totalUnits: 20000,
    submittedBy: "Chidi Okafor",
    certs: [
      { num: "CERT-DANGCEM-10015-01", units: 12000, issueDate: "01 Jan 2024" },
      { num: "CERT-DANGCEM-10015-02", units: 8000, issueDate: "15 Mar 2025" },
    ],
  },
  {
    id: "CO2",
    date: "27 Apr 2026",
    account: "ACCESS-00553",
    holder: "Ngozi Eze",
    register: "Access Bank — ACCESS",
    certCount: 3,
    totalUnits: 35000,
    submittedBy: "Ngozi Eze",
    certs: [
      { num: "CERT-ACCESS-00553-01", units: 10000, issueDate: "12 Feb 2023" },
      { num: "CERT-ACCESS-00553-02", units: 15000, issueDate: "01 Apr 2024" },
      { num: "CERT-ACCESS-00553-03", units: 10000, issueDate: "20 Jan 2026" },
    ],
  },
];

export default function ConsolidationPage() {
  const [activeTab, setActiveTab] = useState("new");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Consolidation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merge multiple certificates for a single account into one
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "new")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Consolidation
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Approved
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="new" className="space-y-6">
            <NewConsolidation setTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <PendingConsolidationApprovals />
          </TabsContent>
          <TabsContent value="approved" className="space-y-4">
            <ApprovedConsolidations />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
