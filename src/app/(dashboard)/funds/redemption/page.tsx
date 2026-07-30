"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RedemptionRequest } from "@/components/custom/fund-subscription/redemption-request";
import { RedemptionApproval } from "@/components/custom/fund-subscription/redemption-approval";
import { ApprovedRedemptions } from "@/components/custom/fund-subscription/approved-redemptions";
import { FundReports } from "@/components/custom/fund-subscription/fund-reports";

const TABS = ["redemption", "approval", "approved", "reports"] as const;
type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  redemption: "Redemption Request",
  approval: "Redemption Approval",
  approved: "Approved Redemptions",
  reports: "Reports",
};

export default function FundRedemptionPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("redemption");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fund Redemption</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Process unit redemption requests and manage approvals for fund registers.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "redemption")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all cursor-pointer"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="redemption"><RedemptionRequest /></TabsContent>
          <TabsContent value="approval"><RedemptionApproval /></TabsContent>
          <TabsContent value="approved"><ApprovedRedemptions /></TabsContent>
          <TabsContent value="reports"><FundReports variant="redemption" /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
