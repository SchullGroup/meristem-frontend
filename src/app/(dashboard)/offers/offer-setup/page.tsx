"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicOfferForm } from "@/components/custom/offer-setup/public-offer-form";
import { RightsSetupForm } from "@/components/custom/offer-setup/rights-setup-form";
import { BonusSetupForm } from "@/components/custom/offer-setup/bonus-setup-form";
import { AgentsStockbrokers } from "@/components/custom/offer-setup/agents-stockbrokers";

const TABS = ["ipo", "rights", "bonus", "agents"] as const;

export default function OfferSetupPage() {
  const [activeTab, setActiveTab] = useState<string>("ipo");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offer Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure Public Offers, Rights Issues, Bonus Issues, and Receiving Agents before
          they go live.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "ipo")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="ipo"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Public Offer (IPO) Setup
          </TabsTrigger>
          <TabsTrigger
            value="rights"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Rights Issue Setup
          </TabsTrigger>
          <TabsTrigger
            value="bonus"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Bonus Issue Setup
          </TabsTrigger>
          <TabsTrigger
            value="agents"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Receiving Agents & Stockbrokers
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="ipo">
            <PublicOfferForm />
          </TabsContent>

          <TabsContent value="rights">
            <RightsSetupForm />
          </TabsContent>

          <TabsContent value="bonus">
            <BonusSetupForm />
          </TabsContent>

          <TabsContent value="agents">
            <AgentsStockbrokers />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
