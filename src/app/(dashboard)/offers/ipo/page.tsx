"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIPO from "@/components/custom/ipo/pending-approval";
import IcuApprovalIPO from "@/components/custom/ipo/icu-approval";
import ICULodgment from "@/components/custom/ipo/lodgment";
import IPOReports from "@/components/custom/ipo/ipo-reports";

export default function IPOPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [icuReviewingBatch, setIcuReviewingBatch] = useState<string | null>(
    null,
  );
  const [icuTab, setIcuTab] = useState<"approved" | "disapproved" | "invalid">(
    "approved",
  );
  const [icuComment, setIcuComment] = useState("");

  // Multi-submission ICU state
  const [icuSubmissionStatuses, setIcuSubmissionStatuses] = useState<
    Record<string, "pending" | "approved" | "returned">
  >({ "sub-1": "pending", "sub-2": "pending", "sub-3": "pending" });
  const [icuSubTab, setIcuSubTab] = useState<
    "approved" | "disapproved" | "invalid"
  >("approved");

  // Lodgment drill-down
  const [lodgmentReviewing, setLodgmentReviewing] = useState<string | null>(
    null,
  );
  const [lodgmentProcessed, setLodgmentProcessed] = useState<
    Record<string, boolean>
  >({});
  const [approvedFile, setApprovedFile] = useState<string | null>(null);
  const [disapprovedFile, setDisapprovedFile] = useState<string | null>(null);
  const [invalidFile, setInvalidFile] = useState<string | null>(null);

  // Pending Approval filters
  const [authRegister, setAuthRegister] = useState("all");
  const [authDateRange, setAuthDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [authCalOpen, setAuthCalOpen] = useState(false);

  // Review dialog
  const [reviewTab, setReviewTab] = useState<
    "approved" | "disapproved" | "invalid"
  >("approved");
  const [reviewComment, setReviewComment] = useState("");

  // Rejection flow
  const [rejectedBatch, setRejectedBatch] = useState<{
    ref: string;
    comment: string;
  } | null>(null);
  const [pendingBatchDismissed, setPendingBatchDismissed] = useState(false);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "reject";
    section: "ops" | "icu";
  } | null>(null);
  const [modalComment, setModalComment] = useState("");

  const closeModal = () => {
    setApprovalModal(null);
    setModalComment("");
  };

  const handleApprove = () => {
    toast.success("Batch approved and forwarded to ICU.");
    setReviewingBatch(null);
    setReviewComment("");
    closeModal();
  };

  const handleReject = () => {
    setRejectedBatch({ ref: reviewingBatch!, comment: modalComment });
    setPendingBatchDismissed(true);
    toast.error("Batch rejected.");
    setReviewingBatch(null);
    setReviewComment("");
    closeModal();
  };

  const handleIcuApprove = () => {
    if (icuReviewingBatch)
      setIcuSubmissionStatuses((prev) => ({
        ...prev,
        [icuReviewingBatch]: "approved",
      }));
    toast.success("ICU approved. Submission cleared for lodgment.");
    setIcuReviewingBatch(null);
    setIcuComment("");
    closeModal();
  };

  const handleIcuReturn = () => {
    if (icuReviewingBatch)
      setIcuSubmissionStatuses((prev) => ({
        ...prev,
        [icuReviewingBatch]: "returned",
      }));
    toast.error("Submission returned to Operations.");
    setIcuReviewingBatch(null);
    setIcuComment("");
    closeModal();
  };

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

      {/* Approval / Rejection modal */}
      <Dialog
        open={approvalModal !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalModal?.section === "ops"
                ? approvalModal.action === "approve"
                  ? "Approve Batch"
                  : "Reject Batch"
                : approvalModal?.action === "approve"
                  ? "ICU Approve Batch"
                  : "Return Batch to Operations"}
            </DialogTitle>
            <DialogDescription>
              {approvalModal?.action === "approve"
                ? "Add an optional comment before forwarding."
                : "Please provide a reason — this will be visible to the submitter."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">
                {approvalModal?.action === "approve"
                  ? "Comment (optional)"
                  : "Reason for rejection *"}
              </label>
              <Textarea
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder={
                  approvalModal?.action === "approve"
                    ? "Add a note…"
                    : "Explain the reason…"
                }
                rows={3}
                className="resize-none text-sm focus-visible:ring-primary rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant={
                  approvalModal?.action === "reject" ? "destructive" : "default"
                }
                className="flex-1"
                onClick={() => {
                  if (approvalModal?.section === "ops") {
                    approvalModal.action === "approve"
                      ? handleApprove()
                      : handleReject();
                  } else {
                    approvalModal?.action === "approve"
                      ? handleIcuApprove()
                      : handleIcuReturn();
                  }
                }}
              >
                Confirm{" "}
                {approvalModal?.action === "approve" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
