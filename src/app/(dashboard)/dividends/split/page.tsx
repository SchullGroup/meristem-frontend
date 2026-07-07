"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AlertCircle, X } from "lucide-react";
import { SplitFormPanel } from "@/components/custom/dividend-split/split-form-panel";
import { PendingSplitsTable } from "@/components/custom/dividend-split/pending-split-table";

export default function DivSplitPage() {
  const [activeTab, setActiveTab] = useState("split");
  const [rejectedComment, setRejectedComment] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dividend Split</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Split a single dividend warrant to multiple destination accounts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="split"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Split
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="split" className="space-y-6">
            {rejectedComment && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Request Rejected
                  </div>
                  <div className="text-[13px] text-red-700">
                    {rejectedComment}
                  </div>
                </div>
                <button
                  onClick={() => setRejectedComment("")}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <SplitFormPanel />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <PendingSplitsTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
