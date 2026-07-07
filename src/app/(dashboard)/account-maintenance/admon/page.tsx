"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewAdmonForm from "@/components/custom/account-maintenance/new-admon-form";
import PendingAdmon from "@/components/custom/account-maintenance/pending-admon";
import AdmonReversal from "@/components/custom/account-maintenance/admon-reversal";
import AdmonHistory from "@/components/custom/account-maintenance/admon-history";
import ApprovedAdmons from "@/components/custom/account-maintenance/approved-admons";

export default function AdmonPage() {
  const [activeTab, setActiveTab] = useState("new");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Estate Administration (ADMON)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer account administration from deceased holders to their estates
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
            New Administration
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Authorisation
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Approved
          </TabsTrigger>
          <TabsTrigger
            value="reversal"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Reverse Administration
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="new" className="space-y-6">
            <NewAdmonForm />
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            <PendingAdmon tab={activeTab} />
          </TabsContent>
          <TabsContent value="approved" className="space-y-4">
            <ApprovedAdmons tab={activeTab} />
          </TabsContent>
          <TabsContent value="reversal" className="space-y-4">
            <AdmonReversal tab={activeTab} />
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
            <AdmonHistory tab={activeTab} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
