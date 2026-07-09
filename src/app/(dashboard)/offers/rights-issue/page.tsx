"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// New Rights Issue-specific components (built this sprint)
import { ProvisionalAllotment } from "@/components/custom/rights-issue/provisional-allotment";
import { RightsTrading } from "@/components/custom/rights-issue/rights-trading";
import { ReturnsCapture } from "@/components/custom/rights-issue/returns-capture";

// Shared offer-administration components (reused with rights-specific config)
import { AllotmentRulesEngine } from "@/components/custom/offer-administration/allotment-rules-engine";
import { CSCSReversalsWorkspace } from "@/components/custom/offer-administration/cscs-reversals-workspace";
import { DispatchNotificationPanel } from "@/components/custom/offer-administration/dispatch-notification-panel";

// Existing API-connected rights-issue components (preserved untouched)
import RightsIssuePendingApproval from "@/components/custom/rights-issue/pending-approval";
import RightsIssueICUApproval from "@/components/custom/rights-issue/icu-approval";
import RightsIssueTradedLodgment from "@/components/custom/rights-issue/trade-lodgment";
import RightsIssueReports from "@/components/custom/rights-issue/rights-reports";

const TABS = [
  "provisional",
  "trading",
  "returns",
  "allotment",
  "approval",
  "icu",
  "lodgement",
  "reversals",
  "dispatch",
  "reports",
] as const;

type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  provisional: "Provisional Allotment",
  trading: "Rights Trading / Renunciation",
  returns: "Returns Capture",
  allotment: "Allotment Rules Engine",
  approval: "Pending Approval",
  icu: "ICU Approval",
  lodgement: "CSCS Lodgement",
  reversals: "CSCS Reversals & Error Resolution",
  dispatch: "Dispatch & Notifications",
  reports: "Reports",
};

const RIGHTS_ALLOTMENT_BANNER =
  "Accepted Rights (guaranteed) are excluded from banding — only Additional Shares Applied and Traded/Bought Rights are subject to the bands below.";

export default function RightsIssuePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("provisional");

  // Legacy approval components still call setActiveTab with old tab names
  const setActiveTabCompat = (tab: string) => {
    const remap: Partial<Record<string, TabValue>> = {
      declaration: "provisional",
      auth: "approval",
    };
    setActiveTab((remap[tab] ?? tab) as TabValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rights Issue Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compute provisional entitlements, capture returns, process traded rights,
          and manage allotment and dispatch for Rights Issues.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "provisional")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-full gap-0.5 flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="provisional">
            <ProvisionalAllotment />
          </TabsContent>

          <TabsContent value="trading">
            <RightsTrading />
          </TabsContent>

          <TabsContent value="returns">
            <ReturnsCapture />
          </TabsContent>

          <TabsContent value="allotment">
            <AllotmentRulesEngine bannerMessage={RIGHTS_ALLOTMENT_BANNER} />
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <RightsIssuePendingApproval setActiveTab={setActiveTabCompat} />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <RightsIssueICUApproval setActiveTab={setActiveTabCompat} />
          </TabsContent>

          <TabsContent value="lodgement" className="space-y-6">
            <RightsIssueTradedLodgment />
          </TabsContent>

          <TabsContent value="reversals">
            <CSCSReversalsWorkspace />
          </TabsContent>

          <TabsContent value="dispatch">
            <DispatchNotificationPanel />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <RightsIssueReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
