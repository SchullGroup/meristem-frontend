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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useGetIcuApprovals,
  useGetIpoBatch,
  useGetIpoBatchSubscribers,
  useIcuReviewIpo,
} from "@/hooks/useIPO";
import { IPOBatchType } from "@/types/ipo";
import { exportIpoBatch } from "@/actions/ipoActions";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import {
  BatchDetailSkeleton,
  DataErrorState,
  PendingListSkeleton,
} from "./loaders";
import { PaginationBar } from "../pagination-bar";

const PAGE_SIZE = 10;

export default function IcuApprovalIPO({ tab }: { tab: string }) {
  const { currentUser } = useStore();
  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [reviewTab, setReviewTab] = useState<IPOBatchType>("APPROVED");
  const [reviewComment, setReviewComment] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(0);
  const [subscribersPageSize, setSubscribersPageSize] = useState(PAGE_SIZE);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "return";
  } | null>(null);

  // Filters
  const [icuRegister, setIcuRegister] = useState<string>("");
  const [icuDateRange, setIcuDateRange] = useState<DateRange | undefined>(
    undefined,
  );

  // Queries
  const { data: activeRegisters } = useGetRegisters(
    {
      size: 100,
      status: "ACTIVE",
    },
    {
      enabled: tab === "icu",
    },
  );

  const {
    data: icuData,
    isLoading: icuLoading,
    isError: icuError,
    error: icuErrorData,
    refetch: refetchIcu,
  } = useGetIcuApprovals(
    {
      register: icuRegister === "all" ? "" : icuRegister,
      from: icuDateRange?.from
        ? format(icuDateRange.from, "yyyy-MM-dd")
        : undefined,
      to: icuDateRange?.to ? format(icuDateRange.to, "yyyy-MM-dd") : undefined,
      page: currentPage,
      size: pageSize,
    },
    { enabled: tab === "icu" && !reviewingBatch },
  );

  const {
    data: batchDetails,
    isLoading: batchLoading,
    isError: batchError,
    error: batchErrorData,
    refetch: refetchBatch,
  } = useGetIpoBatch(reviewingBatch || undefined, {
    enabled: !!reviewingBatch,
  });

  const {
    data: subscribersData,
    isLoading: subscribersLoading,
    isError: subscribersError,
    error: subscribersErrorData,
    refetch: refetchSubscribers,
  } = useGetIpoBatchSubscribers(
    {
      batchRef: reviewingBatch || "",
      type: reviewTab,
      page: subscribersPage,
      size: PAGE_SIZE,
    },
    { enabled: !!reviewingBatch },
  );

  // Mutations
  const icuReviewMutation = useIcuReviewIpo();

  // Handlers
  const handleFinalReview = () => {
    if (!reviewingBatch) return;

    if (approvalModal?.action === "return" && !reviewComment.trim()) {
      toast.error(
        "Please provide a reason for returning the batch to Operations.",
      );
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    const approved = approvalModal?.action === "approve";

    icuReviewMutation.mutate(
      {
        batchRef: reviewingBatch,
        payload: {
          approved,
          comment: reviewComment,
          reviewedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            approved
              ? "ICU approved. Batch cleared for lodgment."
              : "Batch returned to Operations.",
          );
          setReviewingBatch(null);
          setReviewComment("");
          setApprovalModal(null);
        },
        onError: (err) => {
          toast.error(returnErrorMessage(err as ErrorLike));
        },
      },
    );
  };

  const handleExport = async () => {
    if (!reviewingBatch) return;
    try {
      const csvData = await exportIpoBatch(reviewingBatch, reviewTab);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ICU_${reviewingBatch}_${reviewTab.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful");
    } catch (error) {
      toast.error(
        returnErrorMessage(error as ErrorLike) || "Failed to export data",
      );
    }
  };

  const resetFilters = () => {
    setIcuRegister("");
    setIcuDateRange(undefined);
    setCurrentPage(0);
  };

  // ── Helper Components ──

  // ── Render Logic ──

  if (!reviewingBatch) {
    if (icuError) {
      return (
        <div className="space-y-6">
          <Card className="mrpsl-card p-5">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">ICU Approval Queue</h2>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </Card>
          <DataErrorState
            message={returnErrorMessage(icuErrorData as ErrorLike)}
            onRetry={refetchIcu}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Filters */}
        <Card className="mrpsl-card p-5">
          <div className="flex-1 flex gap-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Register</label>
              <Select
                value={icuRegister}
                onValueChange={(value) => setIcuRegister(value || "")}
              >
                <SelectTrigger className="mrpsl-input w-full">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registers</SelectItem>
                  {activeRegisters?.content?.map((r) => (
                    <SelectItem key={r.registerId} value={r.registerId}>
                      {r.registerName} · {r.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Date Range</label>
              <DateRangePicker date={icuDateRange} setDate={setIcuDateRange} />
            </div>
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="self-center"
            >
              Reset
            </Button>
          </div>
        </Card>

        {/* Batch list */}
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr className="mrpsl-table-row">
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">BATCH DATE</th>
                  <th className="px-4 py-3 text-right">APPROVED</th>
                  <th className="px-4 py-3 text-right">DISAPPROVED</th>
                  <th className="px-4 py-3 text-right">INVALID</th>
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3">OPS APPROVAL</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {icuLoading ? (
                  <tr>
                    <td colSpan={10} className="p-0">
                      <PendingListSkeleton />
                    </td>
                  </tr>
                ) : icuData?.content && icuData.content.length > 0 ? (
                  icuData.content.map((batch) => (
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
                        {batch.approvedCount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-amber-600 font-semibold">
                        {batch.disapprovedCount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                        {batch.invalidCount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-right">
                        ₦{batch.totalAmount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">
                          {batch.opsApprovedBy || "—"}
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
            totalPages={icuData?.pagination?.totalPages || 0}
            total={icuData?.pagination?.total || 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>
    );
  }

  // Review View
  if (batchLoading) return <BatchDetailSkeleton />;

  if (batchError) {
    return (
      <div className="py-12">
        <DataErrorState
          message={returnErrorMessage(batchErrorData as ErrorLike)}
          onRetry={refetchBatch}
        />
        <Button
          variant="ghost"
          className="mt-4 gap-2 text-muted-foreground mx-auto flex"
          onClick={() => setReviewingBatch(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
      </div>
    );
  }

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
          {batchDetails?.status || "Awaiting ICU"}
        </Badge>
        <div className="flex-1" />

        <Button
          variant="destructive"
          size="sm"
          disabled={icuReviewMutation.isPending}
          onClick={() => setApprovalModal({ action: "return" })}
        >
          {icuReviewMutation.isPending &&
            !icuReviewMutation.variables?.payload.approved ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Return to Ops"
          )}
        </Button>
        <Button
          size="sm"
          disabled={icuReviewMutation.isPending}
          onClick={() => setApprovalModal({ action: "approve" })}
        >
          {icuReviewMutation.isPending &&
            icuReviewMutation.variables?.payload.approved ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              ICU Approve &amp; Clear
            </>
          )}
        </Button>
      </div>

      {/* Audit Record */}
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
                {batchDetails?.opsApprovedBy || "System Authorizer"}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total Amount",
            value: `₦${batchDetails?.totalAmount?.toLocaleString() || 0}`,
            color: "text-foreground",
          },
          {
            label: "Approved",
            value: batchDetails?.approvedCount?.toLocaleString() || 0,
            color: "text-green-700",
            tab: "APPROVED" as const,
          },
          {
            label: "Disapproved",
            value: batchDetails?.disapprovedCount?.toLocaleString() || 0,
            color: "text-amber-600",
            tab: "DISAPPROVED" as const,
          },
          {
            label: "Invalid",
            value: batchDetails?.invalidCount?.toLocaleString() || 0,
            color: "text-red-600",
            tab: "INVALID" as const,
          },
          {
            label: "Total Count",
            value: (
              (batchDetails?.approvedCount || 0) +
              (batchDetails?.disapprovedCount || 0) +
              (batchDetails?.invalidCount || 0)
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
          {(["APPROVED", "DISAPPROVED", "INVALID"] as const).map((t) => (
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
                    : t === "DISAPPROVED"
                      ? "border-amber-500 text-amber-700"
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
                    : t === "DISAPPROVED"
                      ? batchDetails.disapprovedCount
                      : batchDetails.invalidCount}
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
        <div className="overflow-x-auto min-h-75 relative">
          {subscribersError ? (
            <div className="p-8">
              <DataErrorState
                message={returnErrorMessage(subscribersErrorData as ErrorLike)}
                onRetry={refetchSubscribers}
              />
            </div>
          ) : (
            <>
              {subscribersLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Updating list...
                    </p>
                  </div>
                </div>
              )}
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
                  {subscribersData?.content &&
                    subscribersData.content.length > 0 ? (
                    subscribersData.content.map((r, i) => (
                      <tr key={i} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {i + 1}
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
                          {r.units?.toLocaleString() || 0}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2.5 text-right font-mono font-semibold",
                            reviewTab === "APPROVED"
                              ? "text-green-700"
                              : reviewTab === "DISAPPROVED"
                                ? "text-amber-700"
                                : "text-red-700",
                          )}
                        >
                          {r.amount?.toLocaleString() || 0}
                        </td>
                        {reviewTab !== "APPROVED" && (
                          <td className="px-4 py-2.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-normal border-border"
                            >
                              {r.remark || "No reason provided"}
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
                        {!subscribersLoading &&
                          "No subscribers found for this category."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
        <PaginationBar
          page={currentPage}
          pageSize={subscribersPageSize}
          totalPages={subscribersData?.pagination?.totalPages || 0}
          total={subscribersData?.pagination?.total || 0}
          onPageChange={setCurrentPage}
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
                disabled={icuReviewMutation.isPending}
                onClick={() => {
                  handleFinalReview();
                }}
              >
                {icuReviewMutation.isPending && (
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
