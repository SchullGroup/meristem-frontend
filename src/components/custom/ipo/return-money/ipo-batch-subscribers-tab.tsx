"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import {
  useGetPendingApprovals,
  useGetIpoBatch,
  useGetRefundEligibleSubscribers,
} from "@/hooks/useIPO";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { BatchDetailSkeleton, DataErrorState, PendingListSkeleton } from "../loaders";
import { PaginationBar } from "../../pagination-bar";
import RegisterSelect from "../../register-select";
import { formatDate } from "@/lib/utils/format";
import { Checkbox } from "@/components/ui/checkbox";
import { RefundApprovalModal } from "./refund-approval-dialog";

const PAGE_SIZE = 10;

export function IPOBatchSubscribersTab() {
  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Filters
  const [filterRegister, setFilterRegister] = useState<string>("");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Tabs
  const [activeRefundStatus, setActiveRefundStatus] = useState<
    "PENDING_OPS_REVIEW" | "PENDING_ICU_REVIEW" | "OPS_REJECTED" | "ICU_REJECTED" | "ELIGIBLE_FOR_REFUND"
  >("PENDING_OPS_REVIEW");

  // Modal state
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalTargetIds, setApprovalTargetIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  // Batches list
  const {
    data: batchesData,
    isLoading: batchesLoading,
    isError: batchesError,
    error: batchesErrorData,
    refetch: refetchBatches,
  } = useGetPendingApprovals(
    {
      register:
        filterRegister && filterRegister !== "all" ? filterRegister : undefined,
      from: filterDateRange?.from
        ? format(filterDateRange.from, "yyyy-MM-dd")
        : undefined,
      to: filterDateRange?.to
        ? format(filterDateRange.to, "yyyy-MM-dd")
        : undefined,
      page: currentPage,
      size: pageSize,
    },
    { enabled: !reviewingBatch },
  );

  // Batch detail
  const {
    data: batchDetails,
    isLoading: batchLoading,
    isError: batchError,
    error: batchErrorData,
    refetch: refetchBatch,
  } = useGetIpoBatch(reviewingBatch || undefined, {
    enabled: !!reviewingBatch,
  });

  // Eligible Subscribers of the selected batch
  const {
    data: subscribersData,
    isLoading: subscribersLoading,
    isError: subscribersError,
    error: subscribersErrorData,
    refetch: refetchSubscribers,
  } = useGetRefundEligibleSubscribers(
    reviewingBatch!,
    {
      page: subscribersPage,
      size: pageSize,
      refundStatus: activeRefundStatus
    },
    { enabled: !!reviewingBatch }
  );

  const eligibleBatches = batchesData?.content?.filter(
    (batch) => (batch.disapprovedCount || 0) + (batch.invalidCount || 0) > 0
  );

  const filteredBatches = eligibleBatches?.filter((batch) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      batch.batchReference.toLowerCase().includes(q) ||
      batch.register.toLowerCase().includes(q)
    );
  });


  const subscribers = subscribersData?.content || [];
  const totalPages = subscribersData?.pagination?.totalPages || 1;
  const total = subscribersData?.pagination?.total || 0;

  const resetFilters = () => {
    setFilterRegister("");
    setFilterDateRange(undefined);
    setSearchQuery("");
    setCurrentPage(0);
  };

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  const visibleIds = subscribers.map((r) => r.id);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));


  // ── List view ──
  if (!reviewingBatch) {
    if (batchesError) {
      return (
        <div className="space-y-6">
          <Card className="mrpsl-card p-5">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </Card>
          <DataErrorState
            message={returnErrorMessage(batchesErrorData as ErrorLike)}
            onRetry={refetchBatches}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Filters */}
        <Card className="mrpsl-card p-5">
          <div className="flex-1 flex gap-4 items-end">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batch ref or register..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 mrpsl-input"
              />
            </div>

            <RegisterSelect value={filterRegister} onChange={(val) => setFilterRegister(val)} label="Register" />

            <div className="space-y-1.5">
              <label className="mrpsl-label">Date Range</label>
              <DateRangePicker
                date={filterDateRange}
                setDate={setFilterDateRange}
              />
            </div>

            <Button variant="ghost" onClick={resetFilters}>
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
                  <th className="px-4 py-3 text-right">
                    ELIGIBLE
                  </th>

                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {batchesLoading ? (
                  <tr >
                    <td colSpan={8}>
                      <PendingListSkeleton cols={8} />
                    </td>
                  </tr>
                ) : filteredBatches && filteredBatches.length > 0 ? (
                  filteredBatches?.map((batch) => {
                    return (
                      <tr key={batch?.batchReference} className="mrpsl-table-row">

                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {batch?.batchReference}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {batch?.register}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(batch?.batchDate)}
                        </td>
                        <td className="px-4 py-3 font-mono text-right font-semibold">
                          {((batch?.disapprovedCount || 0) + (batch?.invalidCount || 0)).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          ₦{batch.totalAmount?.toLocaleString() || 0}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingBatch(batch.batchReference);
                              setSubscribersPage(0);
                            }}
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No batches with refund‑eligible subscribers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={batchesData?.pagination?.totalPages || 1}
            total={batchesData?.pagination?.total || 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>
    );
  }

  // ── Detail view ──


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
          onClick={() => {
            setReviewingBatch(null);
          }}
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
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {reviewingBatch}
        </span>
        <span className="text-muted-foreground text-sm">
          · {batchDetails?.register} ·{" "}
          {formatDate(batchDetails?.batchDate)}
        </span>
        <div className="flex-1" />

      </div>

      {/* Summary stats */}
      {/* Summary stats: batch-level, not dependent on refund status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="mrpsl-card p-3">
          <div className="mrpsl-section-title">Disapproved</div>
          <div className="text-xl font-mono font-bold mt-1 text-amber-600">
            {batchDetails?.disapprovedCount?.toLocaleString() || 0}
          </div>
        </Card>
        <Card className="mrpsl-card p-3">
          <div className="mrpsl-section-title">Invalid</div>
          <div className="text-xl font-mono font-bold mt-1 text-red-600">
            {batchDetails?.invalidCount?.toLocaleString() || 0}
          </div>
        </Card>
        <Card className="mrpsl-card p-3">
          <div className="mrpsl-section-title">Total Eligible</div>
          <div className="text-xl font-mono font-bold mt-1">
            {(
              (batchDetails?.disapprovedCount || 0) +
              (batchDetails?.invalidCount || 0)
            ).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Approve Selected button (only for reviewable tabs) */}
      {["PENDING_OPS_REVIEW", "PENDING_ICU_REVIEW"].includes(activeRefundStatus) && (
        <div className="flex justify-between items-center">
          <Button
            disabled={selectedIds.size === 0}
            onClick={() => {
              setApprovalTargetIds(Array.from(selectedIds));
              setIsApprovalOpen(true);
            }}
          >
            Approve Selected ({selectedIds.size})
          </Button>
        </div>
      )}


      {/* Subscribers table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="flex items-center gap-1 border-b px-4 bg-muted/10 overflow-x-auto no-scrollbar">
          {([
            "PENDING_OPS_REVIEW",
            "PENDING_ICU_REVIEW",
            "OPS_REJECTED",
            "ICU_REJECTED",
            "ELIGIBLE_FOR_REFUND",
          ] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveRefundStatus(status);
                setSubscribersPage(0);
                setSelectedIds(new Set());
              }}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                activeRefundStatus === status
                  ? status === "PENDING_OPS_REVIEW"
                    ? "border-yellow-500 text-yellow-700"
                    : status === "PENDING_ICU_REVIEW"
                      ? "border-blue-500 text-blue-700"
                      : "border-red-500 text-red-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
          {/* <div className="flex-1" /> */}

        </div>

        {/* Subscribers table */}
        <div className="overflow-x-auto min-h-75 relative">
          <table className="w-full text-left text-xs">

            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleSelectAll(visibleIds)}
                  />
                </th>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">NAME</th>
                <th className="px-4 py-2.5">CHN</th>
                <th className="px-4 py-2.5">ACCOUNT NO</th>
                <th className="px-4 py-2.5 text-right">UNITS</th>
                <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                <th className="px-4 py-2.5">REMARK / REASON</th>
                {["PENDING_OPS_REVIEW", "PENDING_ICU_REVIEW"].includes(activeRefundStatus) && (
                  <th className="px-4 py-2.5">ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {subscribersLoading ? (
                <tr >
                  <td colSpan={8}>
                    <PendingListSkeleton cols={8} />
                  </td>
                </tr>
              ) :

                subscribersError ? (
                  <tr >
                    <td colSpan={8}>
                      <DataErrorState
                        message={returnErrorMessage(subscribersErrorData as ErrorLike)}
                        onRetry={refetchSubscribers}
                      />
                    </td>
                  </tr>
                ) : subscribersData?.content &&
                  subscribersData.content.length > 0 ? (
                  subscribersData.content.map((r, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(r.id)}
                          onCheckedChange={() => toggleSelect(r.id)}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {subscribersPage * pageSize + i + 1}
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
                        className="px-4 py-2.5 text-right font-mono font-semibold"
                      >
                        {r.amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal border-border"
                        >
                          {r.remark || "No reason provided"}
                        </Badge>
                      </td>
                      {["PENDING_OPS_REVIEW", "PENDING_ICU_REVIEW"].includes(activeRefundStatus) && (
                        <td className="px-4 py-2.5">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setApprovalTargetIds([r.id]);
                              setIsApprovalOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={["PENDING_OPS_REVIEW", "PENDING_ICU_REVIEW"].includes(activeRefundStatus) ? 9 : 8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No batches with refund‑eligible subscribers found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={subscribersPage}
          pageSize={pageSize}
          totalPages={totalPages}
          total={total}
          onPageChange={setSubscribersPage}
          onPageSizeChange={setPageSize}
        />
      </Card>


      {/* Refund Approval Modal */}
      <RefundApprovalModal
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        targetIds={approvalTargetIds}
        batchRef={reviewingBatch!}
        activeStatus={activeRefundStatus}
        onSuccess={() => {
          setSelectedIds(new Set());
          refetchSubscribers();
        }}
      />

    </div>
  );
}
