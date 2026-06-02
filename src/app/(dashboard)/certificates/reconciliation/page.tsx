"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdateReconciliation from "@/components/custom/certificate-reconciliation/update-reconciliation";
import GeneralCertificateReconciliation from "@/components/custom/certificate-reconciliation/general-certificate-recon";

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState("cscs");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Certificate Reconciliation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identify and resolve discrepancies between the MRPSL register and CSCS
          positions
        </p>
      </div>

      {/* Tabs + Content — single vertical column */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full flex! flex-col!"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="cscs"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            CSCS Update Reconciliation
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            General Certificate Reconciliation
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {/* ── CSCS Update Reconciliation ── */}
          <TabsContent value="cscs" className="space-y-4">
            <UpdateReconciliation tab="cscs" />
          </TabsContent>

          {/* ── General Certificate Reconciliation ── */}
          <TabsContent value="general" className="space-y-4">
            <GeneralCertificateReconciliation />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
