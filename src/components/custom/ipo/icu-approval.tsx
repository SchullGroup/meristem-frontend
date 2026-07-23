"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Loader2,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationBar } from "../pagination-bar";

const PAGE_SIZE = 20;

interface MockIcuBatch {
  batchReference: string;
  register: string;
  batchDate: string;
  approvedCount: number;
  rejectedCount: number;
  totalAmount: number;
  opsApprovedBy: string;
  opsApprovedAt: string;
  status: string;
}

interface MockSubscriber {
  subscriberName: string;
  chn: string;
  accountNumber: string;
  units: number;
  amount: number;
  remark?: string;
}

const MOCK_BATCHES: MockIcuBatch[] = [
  {
    batchReference: "BATCH-ACH-2024-003",
    register: "Access Holdings Ord. Shares",
    batchDate: "2024-10-01",
    approvedCount: 15000,
    rejectedCount: 1035,
    totalAmount: 450_000_000,
    opsApprovedBy: "ops.review@meristem.com",
    opsApprovedAt: "2024-10-02T14:30:00",
    status: "PENDING_ICU",
  },
  {
    batchReference: "BATCH-TCP-2024-002",
    register: "Transcorp Power Ord. Shares",
    batchDate: "2024-10-03",
    approvedCount: 9800,
    rejectedCount: 608,
    totalAmount: 275_500_000,
    opsApprovedBy: "ops.review@meristem.com",
    opsApprovedAt: "2024-10-04T10:15:00",
    status: "PENDING_ICU",
  },
];

const MOCK_APPROVED_SUBS: MockSubscriber[] = [
  { subscriberName: "Adebayo Oluwaseun Peters", chn: "C0012345678", accountNumber: "0012345678", units: 10_000, amount: 225_000 },
  { subscriberName: "Chinwe Okafor-Nwosu", chn: "C0023456789", accountNumber: "0023456789", units: 5_000, amount: 112_500 },
  { subscriberName: "Emeka Nwachukwu", chn: "C0034567890", accountNumber: "0034567890", units: 20_000, amount: 450_000 },
  { subscriberName: "Fatima Garba Abubakar", chn: "C0045678901", accountNumber: "0045678901", units: 50_000, amount: 1_125_000 },
  { subscriberName: "Ibrahim Usman Hassan", chn: "C0056789012", accountNumber: "0056789012", units: 8_000, amount: 180_000 },
];

const MOCK_REJECTED_SUBS: MockSubscriber[] = [
  { subscriberName: "Olusegun Badmus", chn: "C0067890123", accountNumber: "0067890123", units: 3_000, amount: 67_500, remark: "Duplicate CHN" },
  { subscriberName: "Ngozi Chidinma Okafor", chn: "C0078901234", accountNumber: "0078901234", units: 1_500, amount: 33_750, remark: "Incomplete KYC" },
  { subscriberName: "UNKNOWN SUBSCRIBER", chn: "", accountNumber: "9999999999", units: 500, amount: 11_250, remark: "Invalid CHN format" },
];

type ReviewTabType = "APPROVED" | "REJECTED";

export default function IcuApprovalIPO({ tab }: { tab: string }) {
  const [batches, setBatches] = useState<MockIcuBatch[]>(MOCK_BATCHES);
  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [reviewTab, setReviewTab] = useState<ReviewTabType>("APPROVED");
  const [reviewComment, setReviewComment] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(0);
  const [subscribersPageSize, setSubscribersPageSize] = useState(PAGE_SIZE);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [isApproving, setIsApproving] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "return";
  } | null>(null);

  const batchDetails = batches.find(b => b.batchReference === reviewingBatch) ?? null;

  const subscribersByType: Record<ReviewTabType, MockSubscriber[]> = {
    APPROVED: MOCK_APPROVED_SUBS,
    REJECTED: MOCK_REJECTED_SUBS,
  };
  const currentSubscribers = subscribersByType[reviewTab] ?? [];
  const totalSubscriberPages = Math.max(1, Math.ceil(currentSubscribers.length / subscribersPageSize));
  const totalSubscribers = currentSubscribers.length;
  const paginatedSubscribers = currentSubscribers.slice(
    subscribersPage * subscribersPageSize,
    (subscribersPage + 1) * subscribersPageSize,
  );

  const handleFinalReview = async () => {
    if (!reviewingBatch) return;

    if (approvalModal?.action === "return" && !reviewComment.trim()) {
      toast.error("Please provide a reason for returning the batch to Operations.");
      return;
    }

    const approved = approvalModal?.action === "approve";

    if (approved) {
      setIsApproving(true);
    } else {
      setIsReturning(true);
    }

    await new Promise(r => setTimeout(r, 800));

    setBatches(prev => prev.filter(b => b.batchReference !== reviewingBatch));

    if (approved) {
      setIsApproving(false);
      toast.success("ICU approved. Batch cleared for lodgment.");
    } else {
      setIsReturning(false);
      toast.success("Batch returned to Operations.");
    }

    setReviewingBatch(null);
    setReviewComment("");
    setApprovalModal(null);
  };

  const handleExport = () => {
    toast.info(`Export for ${reviewTab.toLowerCase()} subscribers coming soon.`);
  };

  // ── List View ──

  if (!reviewingBatch) {
    return (
      <div className="space-y-6">
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr className="mrpsl-table-row">
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">BATCH DATE</th>
                  <th className="px-4 py-3 text-right">APPROVED</th>
                  <th className="px-4 py-3 text-right">REJECTED</th>
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3">OPS APPROVAL</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {batches.length > 0 ? (
                  batches.map((batch) => (
                    <tr key={batch.batchReference} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {batch.batchReference}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {batch.register}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {batch.batchDate
                          ? format(new Date(batch.batchDate), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                        {batch.approvedCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                        {batch.rejectedCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-right">
                        ₦{batch.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">
                          {batch.opsApprovedBy}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {batch.opsApprovedAt
                            ? format(
                                new Date(batch.opsApprovedAt),
                                "dd MMM yyyy, HH:mm",
                              )
                            : "Pending"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                          {batch.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewingBatch(batch.batchReference);
                            setReviewTab("APPROVED");
                            setSubscribersPage(0);
                          }}
                        >
                          ICU Review
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No batches awaiting ICU approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={Math.max(1, Math.ceil(batches.length / pageSize))}
            total={batches.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>
    );
  }

  // ── Review View ──

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 hover:bg-transparent"
          onClick={() => {
            setReviewingBatch(null);
            setReviewComment("");
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to ICU Queue
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {reviewingBatch}
        </span>
        <span className="text-muted-foreground text-sm">
          · {batchDetails?.register} ·{" "}
          {batchDetails?.batchDate
            ? format(new Date(batchDetails.batchDate), "dd MMM yyyy")
            : "—"}
        </span>
        <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
          {batchDetails?.status ?? "Awaiting ICU"}
        </Badge>
        <div className="flex-1" />

        <Button
          variant="destructive"
          size="sm"
          disabled={isApproving || isReturning}
          onClick={() => setApprovalModal({ action: "return" })}
        >
          {isReturning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Return to Ops"
          )}
        </Button>
        <Button
          size="sm"
          disabled={isApproving || isReturning}
          onClick={() => setApprovalModal({ action: "approve" })}
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              ICU Approve &amp; Clear
            </>
          )}
        </Button>
      </div>

      {/* Operations Approval Record */}
      <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary flex items-start gap-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <History className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Operations Approval Record
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="mrpsl-section-title">Approved By</div>
              <div className="font-semibold mt-0.5">
                {batchDetails?.opsApprovedBy ?? "System Authorizer"}
              </div>
            </div>
            <div>
              <div className="mrpsl-section-title">
                Approval Date &amp; Time
              </div>
              <div className="font-mono mt-0.5">
                {batchDetails?.opsApprovedAt
                  ? format(
                      new Date(batchDetails.opsApprovedAt),
                      "dd MMM yyyy, HH:mm:ss",
                    )
                  : "—"}
              </div>
            </div>
            <div>
              <div className="mrpsl-section-title">Operations Status</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-green-700 font-medium">
                <Check className="h-3.5 w-3.5" /> Verified & Forwarded
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Amount",
            value: `₦${batchDetails?.totalAmount?.toLocaleString() ?? 0}`,
            color: "text-foreground",
          },
          {
            label: "Approved",
            value: batchDetails?.approvedCount?.toLocaleString() ?? 0,
            color: "text-green-700",
            tab: "APPROVED" as const,
          },
          {
            label: "Rejected",
            value: batchDetails?.rejectedCount?.toLocaleString() ?? 0,
            color: "text-red-600",
            tab: "REJECTED" as const,
          },
          {
            label: "Total Count",
            value: (
              (batchDetails?.approvedCount ?? 0) +
              (batchDetails?.rejectedCount ?? 0)
            ).toLocaleString(),
            color: "text-foreground",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className={cn(
              "mrpsl-card p-3",
              s.tab &&
                "cursor-pointer hover:border-primary/40 transition-colors",
              s.tab === reviewTab &&
                "border-primary ring-1 ring-primary/20 bg-primary/5",
            )}
            onClick={() => {
              if (s.tab) {
                setReviewTab(s.tab);
                setSubscribersPage(0);
              }
            }}
          >
            <div className="mrpsl-section-title">{s.label}</div>
            <div className={cn("text-xl font-mono font-bold mt-1", s.color)}>
              {s.value}
            </div>
            {s.tab && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                click to view list
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Subscriber tabs + table */}
      <Card className="mrpsl-card overflow-hidden">
        {/* Tab strip */}
        <div className="flex items-center gap-1 border-b px-4 bg-muted/10 overflow-x-auto no-scrollbar">
          {(["APPROVED", "REJECTED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setReviewTab(t);
                setSubscribersPage(0);
              }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                reviewTab === t
                  ? t === "APPROVED"
                    ? "border-green-600 text-green-700"
                    : "border-red-500 text-red-700"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
              {batchDetails && (
                <span className="ml-1.5 opacity-60 text-xs">
                  (
                  {t === "APPROVED"
                    ? batchDetails.approvedCount
                    : batchDetails.rejectedCount}
                  )
                </span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="my-1.5 mr-1"
            onClick={handleExport}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export{" "}
            {reviewTab.charAt(0) + reviewTab.slice(1).toLowerCase()}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-75">
          <table className="w-full text-left text-xs">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">NAME</th>
                <th className="px-4 py-2.5">CHN</th>
                <th className="px-4 py-2.5">ACCOUNT NO</th>
                <th className="px-4 py-2.5 text-right">UNITS</th>
                <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                {reviewTab !== "APPROVED" && (
                  <th className="px-4 py-2.5">REMARK / REASON</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedSubscribers.length > 0 ? (
                paginatedSubscribers.map((r, i) => (
                  <tr key={i} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {subscribersPage * subscribersPageSize + i + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      {r.subscriberName}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {r.chn || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {r.accountNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {r.units.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right font-mono font-semibold",
                        reviewTab === "APPROVED"
                          ? "text-green-700"
                          : "text-red-700",
                      )}
                    >
                      {r.amount.toLocaleString()}
                    </td>
                    {reviewTab !== "APPROVED" && (
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal border-border"
                        >
                          {r.remark ?? "No reason provided"}
                        </Badge>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={reviewTab === "APPROVED" ? 6 : 7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No subscribers found for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={subscribersPage}
          pageSize={subscribersPageSize}
          totalPages={totalSubscriberPages}
          total={totalSubscribers}
          onPageChange={setSubscribersPage}
          onPageSizeChange={setSubscribersPageSize}
        />
      </Card>

      {/* ICU Approval / Return Dialog */}
      <Dialog
        open={approvalModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setApprovalModal(null);
            setReviewComment("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalModal?.action === "approve"
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
                  : "Reason for return *"}
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setApprovalModal(null);
                  setReviewComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant={
                  approvalModal?.action === "return" ? "destructive" : "default"
                }
                className="flex-1"
                disabled={isApproving || isReturning}
                onClick={() => {
                  handleFinalReview();
                }}
              >
                {(isApproving || isReturning) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Confirm{" "}
                {approvalModal?.action === "approve" ? "Approval" : "Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
