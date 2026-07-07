"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Consolidate from "@/components/custom/account-maintenance/consolidate-form";
import PendingAuth from "@/components/custom/account-maintenance/pending-authorization";
import History from "@/components/custom/account-maintenance/history";

export default function ConsolidationPage() {


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Account Consolidation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merge duplicate shareholder accounts into a single surviving account
          </p>
        </div>
      </div>

      <Tabs defaultValue="consol" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="consol"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Consolidate
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Authorisation
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="consol" className="space-y-6">
            <Consolidate tab="consol" />
          </TabsContent>

          <TabsContent value="auth">
            <PendingAuth tab="auth" />
          </TabsContent>

          <TabsContent value="history">
            <History tab="history" />
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}
