"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateRightsDeclaration from "@/components/custom/rights-issue/create-rights-declaration";
import RightsIssuePendingApproval from "@/components/custom/rights-issue/pending-approval";
import RightsIssueICUApproval from "@/components/custom/rights-issue/icu-approval";
import RightsIssueAllottment from "@/components/custom/rights-issue/allotment";
import RightsIssueTradedLodgment from "@/components/custom/rights-issue/trade-lodgment";
import RightsIssueReports from "@/components/custom/rights-issue/rights-reports";

/* ─── main component ─── */

export default function RightsIssuePage() {
  const [activeTab, setActiveTab] = useState("declaration");

  // Rejection flow
  // const [rejectedDecl, setRejectedDecl] = useState<{
  //   ref: string;
  //   comment: string;
  // } | null>(null);
  // const [pendingBatchDismissed, setPendingBatchDismissed] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rights Issue Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage rights offerings, compute entitlements, and process traded
          rights
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          {[
            ["declaration", "Declaration"],
            ["auth", "Pending Approval"],
            ["icu", "ICU Approval"],
            ["allotment", "Allotment"],
            ["lodgment", "Traded Rights Lodgment"],
            ["reports", "Reports"],
          ].map(([v, label]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {/* ── Declaration ── */}
          <TabsContent value="declaration" className="space-y-6">
            <CreateRightsDeclaration />
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            <RightsIssuePendingApproval setActiveTab={setActiveTab} />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <RightsIssueICUApproval setActiveTab={setActiveTab} />
          </TabsContent>

          {/* ── Allotment ── */}
          <TabsContent value="allotment" className="space-y-4">
            <RightsIssueAllottment />
          </TabsContent>

          {/* ── Traded Rights Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-6">
            <RightsIssueTradedLodgment />
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="space-y-6">
            <RightsIssueReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
