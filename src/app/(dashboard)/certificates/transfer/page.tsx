"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transfer } from "@/components/custom/certificate-transfer/transfer";
import { PendingApprovals } from "@/components/custom/certificate-transfer/pending-approvals";
import { ApprovedTransfers } from "@/components/custom/certificate-transfer/approved-transfers";


export default function TransferPage() {
  const [activeTab, setActiveTab] = useState("transfer");


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Transfer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer ownership of units between accounts
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "transfer")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="transfer"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Transfer
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Approved Transfers
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="transfer" className="space-y-6">
            <Transfer setTab={setActiveTab} />

          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <PendingApprovals />
          </TabsContent>
          <TabsContent value="approved" className="space-y-4">
            <ApprovedTransfers />
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}
