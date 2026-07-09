"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataVettingDashboard } from "@/components/custom/offer-administration/data-vetting-dashboard";
import { RegulatoryReportHub } from "@/components/custom/offer-administration/regulatory-report-hub";
import { AllotmentRulesEngine } from "@/components/custom/offer-administration/allotment-rules-engine";
import { CSCSReversalsWorkspace } from "@/components/custom/offer-administration/cscs-reversals-workspace";
import { DispatchNotificationPanel } from "@/components/custom/offer-administration/dispatch-notification-panel";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIPO from "@/components/custom/ipo/pending-approval";
import IcuApprovalIPO from "@/components/custom/ipo/icu-approval";
import ICULodgment from "@/components/custom/ipo/lodgment";
import IPOReports from "@/components/custom/ipo/ipo-reports";
import { OfferReversalPanel } from "@/components/custom/offer-administration/offer-reversal-panel";

const TABS = [
  "upload",
  "vetting",
  "sec-reports",
  "allotment",
  "approval",
  "icu",
  "lodgement",
  "reversals",
  "reversal",
  "dispatch",
  "reports",
] as const;

type TabValue = typeof TABS[number];

const TAB_LABELS: Record<TabValue, string> = {
  upload: "Subscription Data Upload",
  vetting: "Data Vetting & Duplicates",
  "sec-reports": "SEC Clearance Reports",
  allotment: "Allotment Rules Engine",
  approval: "Pending Approval",
  icu: "ICU Approval",
  lodgement: "CSCS Lodgement",
  reversals: "CSCS Reversals & Error Resolution",
  reversal: "Reversal",
  dispatch: "Dispatch & Notifications",
  reports: "Reports",
};

export default function IPOPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("upload");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          IPO / Public Offer Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage subscriber lists, vetting, SEC clearance, allotment, and lodgement for
          Initial Public Offers.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "upload")}
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
          <TabsContent value="upload" className="space-y-6">
            <UploadIPOData tab="upload" />
          </TabsContent>

          <TabsContent value="vetting">
            <DataVettingDashboard />
          </TabsContent>

          <TabsContent value="sec-reports">
            <RegulatoryReportHub />
          </TabsContent>

          <TabsContent value="allotment">
            <AllotmentRulesEngine />
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <PendingApprovalIPO tab="approval" />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <IcuApprovalIPO tab="icu" />
          </TabsContent>

          <TabsContent value="lodgement" className="space-y-4">
            <ICULodgment tab="lodgement" />
          </TabsContent>

          <TabsContent value="reversals">
            <CSCSReversalsWorkspace />
          </TabsContent>

          <TabsContent value="reversal">
            <OfferReversalPanel
              offerType="ipo"
              offerName="Access Holdings Public Offer 2024"
              totalUnitsAllotted={97_800_000}
              totalRefundValue={220_312_500}
            />
          </TabsContent>

          <TabsContent value="dispatch">
            <DispatchNotificationPanel />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <IPOReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
