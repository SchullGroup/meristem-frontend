"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Consolidate from "@/components/custom/account-maintenance/consolidate-form";
import PendingAuth from "@/components/custom/account-maintenance/pending-authorization";
import History from "@/components/custom/account-maintenance/history";
import { ConsolidationSuggested } from "@/components/custom/account-maintenance/consolidation-suggested";
import type { AccountConsolidationSuggestion } from "@/actions/accountMaintenanceActions";

const triggerCls =
  "rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all";

export default function ConsolidationPage() {
  const [activeTab, setActiveTab] = useState<string>("suggested");
  // A suggestion the officer chose to "Consolidate These" — handed to the Consolidate form so it
  // loads those accounts directly, with no re-search. Cleared once the form has consumed it.
  const [prefill, setPrefill] = useState<AccountConsolidationSuggestion | null>(
    null,
  );

  const clearPrefill = useCallback(() => setPrefill(null), []);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger value="suggested" className={triggerCls}>
            System Suggestions
          </TabsTrigger>
          <TabsTrigger value="consol" className={triggerCls}>
            Consolidate
          </TabsTrigger>
          <TabsTrigger value="auth" className={triggerCls}>
            Pending Authorisation
          </TabsTrigger>
          <TabsTrigger value="history" className={triggerCls}>
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="suggested">
            {/* Read-only discovery of fragmented accounts; "Consolidate These" loads the accounts
                into the Consolidate form (no re-search) and jumps to it. */}
            <ConsolidationSuggested
              onUseSuggestion={(suggestion) => {
                setPrefill(suggestion);
                setActiveTab("consol");
              }}
            />
          </TabsContent>

          <TabsContent value="consol" className="space-y-6">
            <Consolidate
              tab="consol"
              prefill={prefill}
              onPrefillConsumed={clearPrefill}
            />
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
