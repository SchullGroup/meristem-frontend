"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewConsolidation from "@/components/custom/certificate-consolidation/new-consolidation";
import PendingConsolidationApprovals from "@/components/custom/certificate-consolidation/pending-approval";
import { ApprovedConsolidations } from "@/components/custom/certificate-consolidation/approved-consolidations";

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
