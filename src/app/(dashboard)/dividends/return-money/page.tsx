"use client";

import { useState } from "react";
import { Coins, Wallet, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnclaimedOverviewTab } from "@/components/custom/dividend-return-money/unclaimed-overview";
import { WithheldPaymentsTab } from "@/components/custom/dividend-return-money/withheld-payments";
import { RefundRequestsTab } from "@/components/custom/dividend-return-money/refund-requests";

const TABS = [
  {
    id: "unclaimed",
    label: "Unclaimed Dividends",
    icon: Coins,
    component: UnclaimedOverviewTab,
  },
  {
    id: "withheld-payments",
    label: "Withheld Payments",
    icon: Wallet,
    component: WithheldPaymentsTab,
  },
  {
    id: "refund-requests",
    label: "Refund Requests",
    icon: RefreshCcw,
    component: RefundRequestsTab,
  },
];

const TRIGGER_CLASS =
  "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all flex items-center gap-1.5";

export default function DividendReturnMoneyPage() {
  const [activeTab, setActiveTab] = useState("unclaimed");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Return Money</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage unclaimed dividend returns — 90% to company, 10% withheld
            for shareholder claims
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className={TRIGGER_CLASS}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          {TABS.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <Component />
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
