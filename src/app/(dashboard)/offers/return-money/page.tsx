"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RejectedRightsTab } from "@/components/custom/ipo/return-money/rejected-rights";
import { RejectedBonusesTab } from "@/components/custom/ipo/return-money/rejected-bonuses";
import { Coins, FileText, RefreshCcw } from "lucide-react";
import { IPOBatchSubscribersTab } from "@/components/custom/ipo/return-money/ipo-batch-subscribers-tab";

export default function ReturnMoneyPage() {
  const [activeTab, setActiveTab] = useState("refund-rights");

  const tabsConfig = [
    {
      id: "refund-rights",
      label: "Refund Rights",
      icon: FileText,
      component: RejectedRightsTab,
    },
    {
      id: "refund-bonuses",
      label: "Refund Bonuses",
      icon: Coins,
      component: RejectedBonusesTab,
    },
    {
      id: "refund-eligible",
      label: "Refund Eligible Subscribers",
      icon: RefreshCcw,
      component: IPOBatchSubscribersTab,
    },

  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Return Money
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Track and authorize refunds for rejected rights, failed bonus claims, and incorrect subscriber details.
        </p>
      </div>

      {/* Tabs Layout */}
      <Tabs
        defaultValue="refund-rights"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        <TabsList className="bg-muted/50 p-1 rounded-xl flex gap-1 h-auto w-max max-w-full overflow-x-auto">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabsConfig.map((tab) => {
          const TabComponent = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="outline-none text-sm sm:text-lg">
              <TabComponent />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
