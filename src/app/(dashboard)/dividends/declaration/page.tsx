"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllDividendsTab } from "@/components/custom/dividend-declaration/all-dividends-tab";
import { IcuApprovalTab } from "@/components/custom/dividend-declaration/icu-approval-tab";
import { HopApprovalTab } from "@/components/custom/dividend-declaration/hop-approval-tab";
import { MdApprovalTab } from "@/components/custom/dividend-declaration/md-approval-tab";
import { PaymentResultsTab } from "@/components/custom/dividend-declaration/payment-results-tab";
import { NotificationsTab } from "@/components/custom/dividend-declaration/notifications-tab";

const TAB_TRIGGER_CLASS =
  "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all";

export default function DeclarationPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dividend Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Declare, compute, and route dividends from initiation through payment and dispatch
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || "")} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 flex-wrap">
          <TabsTrigger value="all" className={TAB_TRIGGER_CLASS}>
            All Dividends
          </TabsTrigger>
          <TabsTrigger value="icu1" className={TAB_TRIGGER_CLASS}>
            ICU Approval
          </TabsTrigger>
          <TabsTrigger value="hop" className={TAB_TRIGGER_CLASS}>
            HOP Approval
          </TabsTrigger>
          <TabsTrigger value="icu2" className={TAB_TRIGGER_CLASS}>
            ICU Approval (2nd)
          </TabsTrigger>
          <TabsTrigger value="md" className={TAB_TRIGGER_CLASS}>
            MD Approval
          </TabsTrigger>
          <TabsTrigger value="results" className={TAB_TRIGGER_CLASS}>
            Payment Results
          </TabsTrigger>
          <TabsTrigger value="notify" className={TAB_TRIGGER_CLASS}>
            Notifications &amp; Reporting
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all">
            <AllDividendsTab />
          </TabsContent>

          <TabsContent value="icu1">
            <IcuApprovalTab stage="ICU_1" />
          </TabsContent>

          <TabsContent value="hop">
            <HopApprovalTab />
          </TabsContent>

          <TabsContent value="icu2">
            <IcuApprovalTab stage="ICU_2" />
          </TabsContent>

          <TabsContent value="md">
            <MdApprovalTab />
          </TabsContent>

          <TabsContent value="results">
            <PaymentResultsTab />
          </TabsContent>

          <TabsContent value="notify">
            <NotificationsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
