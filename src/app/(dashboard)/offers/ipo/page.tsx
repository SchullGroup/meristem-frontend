"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIPO from "@/components/custom/ipo/pending-approval";
import IcuApprovalIPO from "@/components/custom/ipo/icu-approval";
import ICULodgment from "@/components/custom/ipo/lodgment";
import IPOReports from "@/components/custom/ipo/ipo-reports";

export default function IPOPage() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          IPO / Public Offer Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage subscriber lists, approvals, lodgment, and allotment for
          Initial Public Offers
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="upload"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Upload Data
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approval
          </TabsTrigger>
          <TabsTrigger
            value="icu"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            ICU Approval
          </TabsTrigger>
          <TabsTrigger
            value="lodgment"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Lodgment
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Reports
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── Upload Data ── */}
          <TabsContent value="upload" className="space-y-6">
            <UploadIPOData tab="upload" />
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            <PendingApprovalIPO tab="auth" />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <IcuApprovalIPO tab="icu" />
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-4">
            <ICULodgment tab="lodgment" />
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="space-y-4">
            <IPOReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
