"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdateReconciliation from "@/components/custom/certificate-reconciliation/update-reconciliation";
import GeneralCertificateReconciliation from "@/components/custom/certificate-reconciliation/general-certificate-recon";
import { RequeueLodgment } from "@/components/custom/certificate-reconciliation/requeue-lodgment";

const tabTriggerClass =
  "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground " +
  "data-active:bg-background data-active:text-foreground data-active:shadow-sm " +
  "hover:text-foreground transition-all";

// Inner component reads search params — must be inside <Suspense>
function ReconciliationContent() {
  const searchParams = useSearchParams();
  const initialTab   = searchParams.get("tab")   ?? "cscs";
  const batchRef     = searchParams.get("batch")  ?? undefined;

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v || "cscs")}
      className="w-full flex! flex-col!"
    >
      <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
        <TabsTrigger value="cscs"    className={tabTriggerClass}>CSCS Update Reconciliation</TabsTrigger>
        <TabsTrigger value="general" className={tabTriggerClass}>General Certificate Reconciliation</TabsTrigger>
        <TabsTrigger value="requeue" className={tabTriggerClass}>Re-Queue For Lodgment</TabsTrigger>
      </TabsList>

      <div className="mt-6 space-y-4">
        <TabsContent value="cscs" className="space-y-4">
          <UpdateReconciliation batchRef={batchRef} />
        </TabsContent>
        <TabsContent value="general" className="space-y-4">
          <GeneralCertificateReconciliation />
        </TabsContent>
        <TabsContent value="requeue" className="space-y-4">
          <RequeueLodgment />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export default function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificate Reconciliation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identify and resolve discrepancies between the MRPSL register and CSCS positions.
        </p>
      </div>

      <Suspense fallback={null}>
        <ReconciliationContent />
      </Suspense>
    </div>
  );
}
