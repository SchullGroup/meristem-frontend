"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, Loader2, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useGetRegistersByType } from "@/hooks/useRegisters";
import {
  useGetPendingApprovals,
  useGetIpoBatch,
  useGetIpoBatchSubscribers,
  useOpsRejectIpo,
  useOpsApproveIpo,
} from "@/hooks/useIPO";
import { Pagination } from "@/components/custom/pagination";
import { IPOBatchType } from "@/types/ipo";
import { exportIpoBatch } from "@/actions/ipoActions";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { BatchDetailSkeleton, DataErrorState } from "./loaders";

const PAGE_SIZE = 10;

export default function PendingApprovalIPO({ tab }: { tab: string }) {
  const { currentUser, addRejectedBatch } = useStore();
  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [reviewTab, setReviewTab] = useState<IPOBatchType>("APPROVED");
  const [reviewComment, setReviewComment] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(0);
  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "reject";
  } | null>(null);

  // Pending Approval filters
  const [authRegister, setAuthRegister] = useState<string>("");
  const [authDateRange, setAuthDateRange] = useState<DateRange | undefined>(
    undefined,
  );

  // Queries
  const { data: ordinaryRegisters } = useGetRegistersByType("ORDINARY", {
    enabled: tab === "auth",
  });

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    error: pendingErrorData,
    refetch: refetchPending,
  } = useGetPendingApprovals(
    {
      register: authRegister === "all" ? undefined : authRegister,
      from: authDateRange?.from
        ? format(authDateRange.from, "yyyy-MM-dd")
        : undefined,
      to: authDateRange?.to
        ? format(authDateRange.to, "yyyy-MM-dd")
        : undefined,
      page: currentPage,
      size: PAGE_SIZE,
    },
    { enabled: tab === "auth" && !reviewingBatch },
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
  const approveMutation = useOpsApproveIpo();
  const rejectMutation = useOpsRejectIpo();

  // Handlers
  const handleApprove = () => {
    if (!reviewingBatch) return;

    approveMutation.mutate(
      {
        batchRef: reviewingBatch,
        payload: {
          comment: reviewComment,
          approvedBy: currentUser?.id || "ADMIN",
        },
      },
      {
        onSuccess: () => {
          toast.success("Batch approved and forwarded to ICU.");
          setReviewingBatch(null);
          setReviewComment("");
          setApprovalModal(null);
        },
        onError: (err) => {
          const errorMessage = new Error(returnErrorMessage(err as ErrorLike));
          toast.error(errorMessage?.message || "Failed to forward to ICU");
        },
      },
    );
  };

  const handleReject = () => {
    if (!reviewingBatch) return;
    if (!reviewComment.trim()) {
      toast.error(
        "Please provide a reason for rejection in the comment field.",
      );
      return;
    }

    rejectMutation.mutate(
      {
        batchRef: reviewingBatch,
        payload: {
          comment: reviewComment,
          rejectedBy:
            currentUser?.username ||
            `${currentUser?.firstName} ${currentUser?.lastName}` ||
            currentUser?.email ||
            "ADMIN",
        },
      },
      {
        onSuccess: () => {
          toast.success("Batch rejected.");
          addRejectedBatch({
            ref: reviewingBatch,
            comment: reviewComment,
            type: "ipo",
          });
          setReviewingBatch(null);
          setReviewComment("");
          setApprovalModal(null);
        },
        onError: (err) => {
          const errorMessage = new Error(returnErrorMessage(err as ErrorLike));
          toast.error(errorMessage?.message || "Failed to reject Batch");
        },
      },
    );
  };

  const handleExport = async () => {
    if (!reviewingBatch) return;
    try {
      const type = reviewTab.toLowerCase() as IPOBatchType;
      const csvData = await exportIpoBatch(reviewingBatch, type);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reviewingBatch}_${reviewTab.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful");
    } catch (error) {
      const errorMessge = new Error(returnErrorMessage(error as ErrorLike));
      toast.error(errorMessge?.message || "Failed to export data");
    }
  };

  const resetFilters = () => {
    setAuthRegister("");
    setAuthDateRange(undefined);
    setCurrentPage(0);
  };

  // ── Render Logic ──

  if (!reviewingBatch) {
    if (pendingError) {
      return (
        <div className="space-y-6">
          <Card className="mrpsl-card p-5">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Pending Approvals</h2>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </Card>
          <DataErrorState
            message={returnErrorMessage(pendingErrorData as ErrorLike)}
            onRetry={refetchPending}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Filters */}
        <Card className="mrpsl-card p-5">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Register</label>
                <Select
                  value={authRegister}
                  onValueChange={(value) => setAuthRegister(value || "")}
                >
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="All Registers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registers</SelectItem>
                    {ordinaryRegisters?.map((r) => (
                      <SelectItem key={r.registerId} value={r.registerId}>
                        {r.registerName} · {r.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">Date Range</label>
                <DateRangePicker
                  date={authDateRange}
                  setDate={setAuthDateRange}
                />
              </div>
            </div>
            <Button variant="ghost" onClick={resetFilters} className="text-xs">
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
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pendingLoading ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <div className="flex flex-col gap-px">
                        {[...Array(PAGE_SIZE)].map((_, i) => (
                          <div
                            key={i}
                            className="flex gap-4 px-4 py-3.5 items-center bg-background"
                          >
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-20" />
                            <div className="flex-1" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : pendingData?.content && pendingData.content.length > 0 ? (
                  pendingData.content.map((batch) => (
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
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
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
                          Review &amp; Approve
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No pending batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pendingData?.pagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={pendingData.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
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
          <ArrowLeft className="h-4 w-4" /> Back to Pending Approval
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
        <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
          {batchDetails?.status || "Pending"}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="destructive"
          size="sm"
          disabled={rejectMutation.isPending || approveMutation.isPending}
          onClick={() => setApprovalModal({ action: "reject" })}
        >
          {rejectMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Reject Batch"
          )}
        </Button>
        <Button
          size="sm"
          disabled={rejectMutation.isPending || approveMutation.isPending}
          onClick={() => setApprovalModal({ action: "approve" })}
        >
          {approveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Approve &amp; Forward to ICU
            </>
          )}
        </Button>
      </div>

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
            className="my-1.5 mr-1 capitalize"
            onClick={handleExport}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export {reviewTab}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px] relative">
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
        {subscribersData?.pagination && (
          <Pagination
            currentPage={subscribersPage}
            totalPages={subscribersData.pagination.totalPages}
            onPageChange={setSubscribersPage}
          />
        )}
      </Card>

      {/* Approval / Rejection modal */}
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
                ? "Approve Batch"
                : "Reject Batch"}
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
                  approvalModal?.action === "reject" ? "destructive" : "default"
                }
                className="flex-1"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => {
                  if (approvalModal?.action === "approve") {
                    handleApprove();
                  } else {
                    handleReject();
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
