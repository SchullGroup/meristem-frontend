"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Search, Loader2, FileSpreadsheet } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useGetPendingApprovals,
  useGetIpoBatch,
  useGetIpoBatchSubscribers,
} from "@/hooks/useIPO";
import { IPOBatchType } from "@/types/ipo";
import { exportIpoBatch } from "@/actions/ipoActions";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { BatchDetailSkeleton, DataErrorState } from "../loaders";
import { PaginationBar } from "../../pagination-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE = 10;

interface IPOBatchSubscribersTabProps {
  /** The subscriber type to display */
  type: "DISAPPROVED" | "INVALID";
  /** Label used in empty states and headings */
  label: string;
  /** Color scheme for amounts and badges */
  colorScheme: {
    amount: string;
    badge: string;
    badgeText: string;
    border: string;
  };
}

export function IPOBatchSubscribersTab({
  type,
  label,
  colorScheme,
}: IPOBatchSubscribersTabProps) {
  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Filters
  const [filterRegister, setFilterRegister] = useState<string>("");
  const [filterDateRange, setFilterDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Registers
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

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
        filterRegister && filterRegister !== "all"
          ? filterRegister
          : undefined,
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

  // Subscribers of the selected type
  const {
    data: subscribersData,
    isLoading: subscribersLoading,
    isError: subscribersError,
    error: subscribersErrorData,
    refetch: refetchSubscribers,
  } = useGetIpoBatchSubscribers(
    {
      batchRef: reviewingBatch || "",
      type,
      page: subscribersPage,
      size: pageSize,
    },
    { enabled: !!reviewingBatch },
  );

  const totalPages = subscribersData?.pagination?.totalPages || 1;
  const total = subscribersData?.pagination?.total || 0;

  // Export handler
  const handleExport = async () => {
    if (!reviewingBatch) return;
    try {
      const csvData = await exportIpoBatch(
        reviewingBatch,
        type.toLowerCase() as IPOBatchType,
      );
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reviewingBatch}_${type.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful");
    } catch (error) {
      const errorMessage = new Error(returnErrorMessage(error as ErrorLike));
      toast.error(errorMessage?.message || "Failed to export data");
    }
  };

  const resetFilters = () => {
    setFilterRegister("");
    setFilterDateRange(undefined);
    setSearchQuery("");
    setCurrentPage(0);
  };

  const countKey =
    type === "DISAPPROVED" ? "disapprovedCount" : "invalidCount";

  // Filter batches that actually have items of this type
  const filteredBatches = batchesData?.content?.filter((batch) => {
    const count = batch[countKey] || 0;
    if (count === 0) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      batch.batchReference.toLowerCase().includes(q) ||
      batch.register.toLowerCase().includes(q)
    );
  });


  // ── Reimbursement Confirmation Modal state ──
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("");


  // ── List view ──
  if (!reviewingBatch) {
    if (batchesError) {
      return (
        <div className="space-y-6">
          <Card className="mrpsl-card p-5">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{label}</h2>
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

            <div className="space-y-1.5">
              <label className="mrpsl-label">Register</label>
              <Select
                value={filterRegister}
                onValueChange={(value) => setFilterRegister(value || "")}
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
                    {type === "DISAPPROVED"
                      ? "DISAPPROVED"
                      : "INVALID"}{" "}
                    COUNT
                  </th>
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {batchesLoading ? (
                  <tr>
                    <td colSpan={8} className="p-0">
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
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : filteredBatches && filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => {
                    return (
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
                        <td
                          className={cn(
                            "px-4 py-3 font-mono text-right font-semibold",
                            colorScheme.amount,
                          )}
                        >
                          {(batch[countKey] || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          ₦{batch.totalAmount?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cn(
                              "border-0 text-xs",
                              colorScheme.badge,
                              colorScheme.badgeText,
                            )}
                          >
                            {batch.status}
                          </Badge>
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
                      No batches with {label.toLowerCase()} found.
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
          {batchDetails?.batchDate
            ? format(new Date(batchDetails.batchDate), "dd MMM yyyy")
            : "—"}
        </span>
        <Badge
          className={cn(
            "border-0 text-xs",
            colorScheme.badge,
            colorScheme.badgeText,
          )}
        >
          {batchDetails?.status || "—"}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="capitalize"
          onClick={handleExport}
        >
          <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export{" "}
          {type.toLowerCase()}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="mrpsl-card p-3">
          <div className="mrpsl-section-title">Total Amount</div>
          <div className="text-xl font-mono font-bold mt-1">
            ₦{batchDetails?.totalAmount?.toLocaleString() || 0}
          </div>
        </Card>
        <Card
          className={cn(
            "mrpsl-card p-3 border-primary ring-1 ring-primary/20 bg-primary/5",
          )}
        >
          <div className="mrpsl-section-title">{label}</div>
          <div
            className={cn("text-xl font-mono font-bold mt-1", colorScheme.amount)}
          >
            {(batchDetails?.[countKey] || 0).toLocaleString()}
          </div>
        </Card>
        <Card className="mrpsl-card p-3">
          <div className="mrpsl-section-title">Total Subscribers</div>
          <div className="text-xl font-mono font-bold mt-1">
            {(
              (batchDetails?.approvedCount || 0) +
              (batchDetails?.disapprovedCount || 0) +
              (batchDetails?.invalidCount || 0)
            ).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Subscribers table */}
      <Card className="mrpsl-card overflow-hidden">
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
                      Loading {label.toLowerCase()}...
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
                    <th className="px-4 py-2.5">REMARK / REASON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {subscribersData?.content &&
                    subscribersData.content.length > 0 ? (
                    subscribersData.content.map((r, i) => (
                      <tr key={i} className="mrpsl-table-row">
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
                          className={cn(
                            "px-4 py-2.5 text-right font-mono font-semibold",
                            colorScheme.amount,
                          )}
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        {!subscribersLoading &&
                          `No ${label.toLowerCase()} found for this batch.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
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

      {/* Process Refund for this batch — opens gateway confirmation modal */}
      <Button
        size="lg"
        className="h-12 text-base font-semibold w-full"
        onClick={() => {
          setSelectedGateway("");
          setIsConfirmOpen(true);
        }}
      >
        Process Reimbursment
      </Button>

      {/* Confirmation Modal (shared) */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Approve Reimbursement</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              You are about to process a refund reimbursement for the following IPO subscribers.
            </DialogDescription>
          </DialogHeader>

          <div className="m-4 space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50 text-[13px]">
            {batchDetails && (
              <div className="my-4 space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-sm">Declaration Reference</span>
                  <span className="font-mono font-semibold text-sm">{batchDetails?.batchReference}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-sm">Current Stage</span>
                  <Badge variant="outline" className="text-xs font-bold border-0 bg-blue-100 text-blue-800">
                    {batchDetails?.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Total Amount</span>
                  <span className="font-mono font-bold text-destructive text-base">
                    ₦{batchDetails?.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-foreground">
                Select Payment Gateway <span className="text-red-500">*</span>
              </label>
              <Select value={selectedGateway} onValueChange={(value) => setSelectedGateway(value as string)}>
                <SelectTrigger className="w-full mrpsl-input">
                  <SelectValue placeholder="Select Payment Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nibss">NIBSS</SelectItem>
                  <SelectItem value="remita">Remita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              className="text-xs font-bold"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="text-xs font-bold px-6"
              disabled={!selectedGateway}
              onClick={() => {
                setIsConfirmOpen(false);
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
