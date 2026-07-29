"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewQueueTab } from "@/components/custom/new-mandate/review-queue-tab";
import { ApprovalStageTab } from "@/components/custom/new-mandate/approval-stage-tab";
import { InitiatorReReviewTab } from "@/components/custom/new-mandate/initiator-rereview-tab";
import { SecondIcuApprovalTab } from "@/components/custom/new-mandate/second-icu-approval-tab";
import { MdApprovalTab } from "@/components/custom/new-mandate/md-approval-tab";
import { PaymentResultsTab } from "@/components/custom/new-mandate/payment-results-tab";
import { NotificationsTab } from "@/components/custom/new-mandate/notifications-tab";
import { IcuSignOffBanner } from "@/components/custom/new-mandate/icu-sign-off-banner";

const TAB_TRIGGER_CLASS =
  "rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all";

export default function NewMandatePage() {
  const [activeTab, setActiveTab] = useState("queue");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          New Mandate Payment Processing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Batch newly-mandated accounts with outstanding dividends through a
          multi-level approval workflow before payment release
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "queue")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 flex-wrap">
          <TabsTrigger value="queue" className={TAB_TRIGGER_CLASS}>
            Review Queue
          </TabsTrigger>
          <TabsTrigger value="pending" className={TAB_TRIGGER_CLASS}>
            Pending Approval
          </TabsTrigger>
          <TabsTrigger value="hop" className={TAB_TRIGGER_CLASS}>
            HOP Approval
          </TabsTrigger>
          <TabsTrigger value="icu1" className={TAB_TRIGGER_CLASS}>
            ICU Approval
          </TabsTrigger>
          <TabsTrigger value="rereview" className={TAB_TRIGGER_CLASS}>
            Initiator Re-Review
          </TabsTrigger>
          <TabsTrigger value="icu2" className={TAB_TRIGGER_CLASS}>
            2nd ICU Approval
          </TabsTrigger>
          <TabsTrigger value="md" className={TAB_TRIGGER_CLASS}>
            MD Approval
          </TabsTrigger>
          <TabsTrigger value="results" className={TAB_TRIGGER_CLASS}>
            Payment Results
          </TabsTrigger>
          <TabsTrigger value="notify" className={TAB_TRIGGER_CLASS}>
            Notifications &amp; Reporting
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="queue">
            <ReviewQueueTab />
          </TabsContent>

          <TabsContent value="pending">
            <ApprovalStageTab
              status="PENDING_APPROVAL"
              stage="APPROVAL"
              description="Batches sent from the Review Queue, awaiting your first review."
              reviewTitle="Review New Mandate Batch"
              approveLabel="Send to HOP for Approval"
              emptyLabel="No batches pending approval."
              csvName="mandate_pending_approval.csv"
            />
          </TabsContent>

          <TabsContent value="hop">
            <ApprovalStageTab
              status="PENDING_HOP"
              stage="HOP"
              description="Batches awaiting Head of Payments (HOP) review."
              reviewTitle="HOP Approval"
              approveLabel="Send to ICU for Approval"
              emptyLabel="No batches pending HOP approval."
              csvName="mandate_hop_approval.csv"
            />
          </TabsContent>

          <TabsContent value="icu1">
            <ApprovalStageTab
              status="PENDING_ICU_1"
              stage="ICU_1"
              description="First Internal Control Unit checkpoint — approve or reject the batch."
              reviewTitle="ICU Approval (1st)"
              approveLabel="Approve"
              emptyLabel="No batches awaiting 1st ICU approval."
              csvName="mandate_icu_approval.csv"
              banner={<IcuSignOffBanner ordinal="1st" />}
            />
          </TabsContent>

          <TabsContent value="rereview">
            <InitiatorReReviewTab />
          </TabsContent>

          <TabsContent value="icu2">
            <SecondIcuApprovalTab />
          </TabsContent>

          <TabsContent value="md">
            <MdApprovalTab />
          </TabsContent>

          <TabsContent value="results">
            <PaymentResultsTab />
          </TabsContent>

          <TabsContent value="notify">
            <NotificationsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
