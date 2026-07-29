"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingTab } from "@/components/custom/dividend-reversals/pending-tab";
import { HopApprovalTab } from "@/components/custom/dividend-reversals/hop-approval-tab";
import { HistoryTab } from "@/components/custom/dividend-reversals/history-tab";

const TAB_TRIGGER_CLASS =
  "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all";

export default function DividendReversalsPage() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dividend Reversals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reverse a paid-but-failed dividend, or exclude a mandated dividend from
          processing — one record at a time, with HOP approval and a full audit
          trail
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "pending")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="pending" className={TAB_TRIGGER_CLASS}>
            Pending
          </TabsTrigger>
          <TabsTrigger value="hop" className={TAB_TRIGGER_CLASS}>
            HOP Approval
          </TabsTrigger>
          <TabsTrigger value="history" className={TAB_TRIGGER_CLASS}>
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="pending">
            <PendingTab />
          </TabsContent>
          <TabsContent value="hop">
            <HopApprovalTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
