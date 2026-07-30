"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewSubscription } from "@/components/custom/fund-subscription/new-subscription";
import { SubscriptionApproval } from "@/components/custom/fund-subscription/subscription-approval";
import { ApprovedSubscriptions } from "@/components/custom/fund-subscription/approved-subscriptions";
import { FundReports } from "@/components/custom/fund-subscription/fund-reports";

const TABS = ["subscription", "approval", "approved", "reports"] as const;
type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  subscription: "New Subscription",
  approval: "Subscription Approval",
  approved: "Approved Subscriptions",
  reports: "Reports",
};

export default function FundSubscriptionPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("subscription");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fund Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Process new fund subscription requests and manage approvals for fund registers.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "subscription")}
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
          <TabsContent value="subscription"><NewSubscription /></TabsContent>
          <TabsContent value="approval"><SubscriptionApproval /></TabsContent>
          <TabsContent value="approved"><ApprovedSubscriptions /></TabsContent>
          <TabsContent value="reports"><FundReports variant="subscription" /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
