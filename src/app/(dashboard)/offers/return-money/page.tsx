"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RejectedRightsTab } from "@/components/custom/ipo/return-money/rejected-rights";
import { RejectedBonusesTab } from "@/components/custom/ipo/return-money/rejected-bonuses";
import { InvalidAccountsTab } from "@/components/custom/ipo/return-money/invalid-accounts";
import { DisapprovedAccountsTab } from "@/components/custom/ipo/return-money/disapproved-accounts";
import { Coins, FileText, AlertTriangle, Ban } from "lucide-react";

export default function ReturnMoneyPage() {
  const [activeTab, setActiveTab] = useState("rejected-rights");

  const tabsConfig = [
    {
      id: "rejected-rights",
      label: "Rejected Rights",
      icon: FileText,
      component: RejectedRightsTab,
    },
    {
      id: "rejected-bonuses",
      label: "Rejected Bonuses",
      icon: Coins,
      component: RejectedBonusesTab,
    },
    {
      id: "disapproved-accounts",
      label: "Disapproved Accounts",
      icon: Ban,
      component: DisapprovedAccountsTab,
    },
    {
      id: "invalid-accounts",
      label: "Invalid Accounts",
      icon: AlertTriangle,
      component: InvalidAccountsTab,
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
        defaultValue="rejected-rights"
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
            <TabsContent key={tab.id} value={tab.id} className="outline-none">
              <TabComponent />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
