"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Upload,
  Download,
  CheckCircle,
  ArrowLeft,
  Loader2,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { IPO } from "@/types/ipo";
import { useGetRegisters } from "@/hooks/useRegisters";
import { DateRangePicker } from "../date-range-picker";
import {
  useGetIpoBatchesLodgment,
  useGetIpoBatchLodgment,
  useDownloadIpoBatchLodgment,
  useApproveBatchLodgment,
} from "@/hooks/useIPO";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { DataErrorState, BatchDetailSkeleton } from "./loaders";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { PaginationBar } from "../pagination-bar";

export default function ICULodgment({ tab }: { tab: string }) {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  // Lodgment drill-down
  const [lodgmentReviewing, setLodgmentReviewing] = useState<IPO | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  // Pending Approval filters
  const [authRegister, setAuthRegister] = useState<string>("");
  const [authDateRange, setAuthDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [downloadFormat, setDownloadFormat] = useState<
    "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS"
  >("RIN_AT_CSCS");

  // Queries
  const {
    data: lodgmentBatchesData,
    isLoading: isLodgmentsLoading,
    isError: isLodgmentsError,
    error: lodgmentsError,
    refetch: refetchLodgments,
  } = useGetIpoBatchesLodgment(
    {
      register: authRegister === "" ? undefined : authRegister,
      from: authDateRange?.from
        ? format(authDateRange.from, "yyyy-MM-dd")
        : undefined,
      to: authDateRange?.to
        ? format(authDateRange.to, "yyyy-MM-dd")
        : undefined,
      page: currentPage,
      size: pageSize,
    },
    {
      enabled: lodgmentReviewing === null && tab === "lodgment",
    },
  );

  const {
    data: lodgmentDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useGetIpoBatchLodgment(
    {
      batchRef: lodgmentReviewing?.batchReference || "",
      limit: 10,
    },
    {
      enabled:
        !!lodgmentReviewing?.batchReference &&
        lodgmentReviewing?.batchReference.length > 0,
    },
  );

  // Mutations
  const downloadMutation = useDownloadIpoBatchLodgment();

  const resetFilters = () => {
    setAuthRegister("");
    setAuthDateRange(undefined);
    setCurrentPage(0);
  };

  const handleDownload = () => {
    if (!lodgmentReviewing?.batchReference) return;

    downloadMutation.mutate(
      {
        batchRef: lodgmentReviewing.batchReference,
        format: downloadFormat,
      },
      {
        onSuccess: (data) => {
          const blob = new Blob([data], {
            // type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            type: "text/plain;charset=utf-8",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          // a.download = `lodgment_${lodgmentReviewing.batchReference}.xlsx`;
          a.download = `lodgment_${lodgmentReviewing.batchReference}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success("Lodgment file downloaded successfully.");
        },
        onError: (err) => {
          const errorMessage = new Error(returnErrorMessage(err as ErrorLike));
          toast.error(
            errorMessage?.message || "Failed to download lodgment file",
          );
        },
      },
    );
  };

  if (isLodgmentsError) {
    return (
      <div className="space-y-6">
        <Card className="mrpsl-card p-5">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Lodgment Queue</h2>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </Card>
        <DataErrorState
          message={returnErrorMessage(lodgmentsError as ErrorLike)}
          onRetry={refetchLodgments}
        />
      </div>
    );
  }

  if (lodgmentReviewing === null) {
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

        {/* Queue table */}
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20">
            <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
              ICU Approved — Ready for Lodgment
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">BATCH DATE</th>
                  <th className="px-4 py-3 text-right">APPROVED ALLOTTEES</th>
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3">ICU APPROVER</th>
                  <th className="px-4 py-3">ICU APPROVAL DATE</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLodgmentsLoading ? (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <div className="flex flex-col gap-px">
                        {[...Array(5)].map((_, i) => (
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
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : lodgmentBatchesData?.content &&
                  lodgmentBatchesData.content.length > 0 ? (
                  lodgmentBatchesData.content.map((row) => (
                    <tr
                      key={row.batchReference}
                      className="mrpsl-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                        {row.batchReference}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {row.register}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[13px]">
                        {row.batchDate
                          ? format(new Date(row.batchDate), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                        {row.approvedCount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        ₦{row.totalAmount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {row.icuApprovedBy || "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {row.icuApprovedAt
                          ? format(
                            new Date(row.icuApprovedAt),
                            "dd MMM yyyy, HH:mm",
                          )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.status !== "ICU_APPROVED" ? (
                          <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                            Lodged
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                            Pending Lodgment
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          onClick={() => setLodgmentReviewing(row)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No ready batches found for lodgment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={lodgmentBatchesData?.pagination?.totalPages || 0}
            total={lodgmentBatchesData?.pagination?.total || 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>
    );
  }

  if (isDetailError) {
    return (
      <div className="py-12 space-y-4">
        <DataErrorState
          message={returnErrorMessage(detailError as ErrorLike)}
          onRetry={refetchDetail}
        />
        <Button
          variant="ghost"
          className="mt-4 gap-2 text-muted-foreground mx-auto flex"
          onClick={() => setLodgmentReviewing(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
      </div>
    );
  }

  if (isDetailLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2"
            onClick={() => setLodgmentReviewing(null)}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Lodgment Queue
          </Button>
        </div>
        <BatchDetailSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => setLodgmentReviewing(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lodgment Queue
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {lodgmentReviewing?.batchReference}
        </span>
        <span className="text-muted-foreground text-sm">
          · {lodgmentReviewing?.register} ·{" "}
          {lodgmentReviewing?.batchDate
            ? format(new Date(lodgmentReviewing.batchDate), "dd MMM yyyy")
            : "—"}
        </span>
        {lodgmentReviewing?.status !== "ICU_APPROVED" ? (
          <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
            Lodged
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
            Pending Lodgment
          </Badge>
        )}
        <div className="flex-1" />
        {lodgmentReviewing?.status === "ICU_APPROVED" && (
          <Button
            size="sm"
            onClick={() => setIsApproveDialogOpen(true)}
            className="gap-1.5"
          >
            <CheckCircle className="h-4 w-4" /> Approve Lodgment
          </Button>
        )}
      </div>

      {/* ICU approval record */}
      <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
        <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          ICU Approval Record
        </p>
        <div className="flex items-center gap-8 text-sm flex-wrap">
          <div>
            <div className="mrpsl-section-title">ICU Approver</div>
            <div className="font-semibold mt-0.5">
              {lodgmentReviewing?.icuApprovedBy || "—"}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Approval Date &amp; Time</div>
            <div className="font-mono mt-0.5">
              {lodgmentReviewing?.icuApprovedAt
                ? format(
                  new Date(lodgmentReviewing.icuApprovedAt),
                  "dd MMM yyyy, HH:mm",
                )
                : "—"}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Approved Allottees</div>
            <div className="font-mono font-semibold mt-0.5 text-green-700">
              {lodgmentReviewing?.approvedCount?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Total Amount</div>
            <div className="font-mono font-semibold mt-0.5">
              ₦{lodgmentReviewing?.totalAmount?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mrpsl-card">
        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <label className="mrpsl-label">Lodgment File Format</label>
            <RadioGroup
              value={downloadFormat}
              onValueChange={(val) =>
                setDownloadFormat(val as "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS")
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="RIN_AT_CSCS" id="r1" />
                <label htmlFor="r1" className="text-sm cursor-pointer">
                  RIN at CSCS
                </label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="RIN_NOT_AT_CSCS" id="r2" />
                <label htmlFor="r2" className="text-sm cursor-pointer">
                  RIN NOT at CSCS
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="bg-muted/40 p-2 border-b text-[13px] tabular font-bold text-muted-foreground">
              PREVIEW (LODGMENT ROWS)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] tabular">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="p-2 text-left">STOCKBROKER CODE</th>
                    <th className="p-2 text-left">CHN</th>
                    <th className="p-2 text-left">SHAREHOLDER NAME</th>
                    <th className="p-2 text-left">CERT NO</th>
                    <th className="p-2 text-left">CSCS ACCOUNT NO</th>
                    <th className="p-2 text-left">SYMBOL</th>
                    <th className="p-2 text-right">UNITS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lodgmentDetail?.previewRows &&
                    lodgmentDetail.previewRows.length > 0 ? (
                    lodgmentDetail.previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-2 font-mono">
                          {row.stockbrokerCode || "—"}
                        </td>
                        <td className="p-2 font-mono">{row.chn || "—"}</td>
                        <td className="p-2 font-medium">
                          {row.shareholderName || "—"}
                        </td>
                        <td className="p-2 font-mono">{row.certNo || "—"}</td>
                        <td className="p-2 font-mono">
                          {row.cscsAccountNo || "—"}
                        </td>
                        <td className="p-2 font-mono">{row.symbol || "—"}</td>
                        <td className="p-2 font-mono text-right font-semibold">
                          {row.units?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No lodgment preview rows available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="flex-1"
              disabled={downloadMutation.isPending}
              onClick={handleDownload}
            >
              {downloadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Lodgment File
                  (.txt)
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                toast.success("Pushed to CSCS API successfully.");
              }}
            >
              <Upload className="mr-2 h-4 w-4" /> Push via CSCS API
            </Button>
          </div>
        </div>
      </Card>

      <ApproveLodgmentDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        batchReference={lodgmentReviewing?.batchReference || ""}
        onSuccess={() => setLodgmentReviewing(null)}
      />
    </div>
  );
}

interface ApproveLodgmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchReference: string;
  onSuccess?: () => void;
}

export function ApproveLodgmentDialog({
  open,
  onOpenChange,
  batchReference,
  onSuccess,
}: ApproveLodgmentDialogProps) {
  const { currentUser } = useStore();
  const [comment, setComment] = useState("");
  const approveMutation = useApproveBatchLodgment();

  const handleApprove = () => {
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    if (!comment || comment.trim() === "") {
      toast.error("Please enter a comment.");
      return;
    }

    approveMutation.mutate(
      {
        batchRef: batchReference,
        payload: {
          comment: comment,
          lodgedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Lodgment batch approved successfully.");
          setComment("");
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          const errorMessage = new Error(returnErrorMessage(err as ErrorLike));
          toast.error(errorMessage?.message || "Failed to approve lodgment.");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setComment("");
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Lodgment Batch</DialogTitle>
          <DialogDescription>
            Confirm the lodgment of batch{" "}
            <span className="font-mono font-bold text-foreground">
              {batchReference}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="mrpsl-label">Comment *</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment or note about the lodgment…"
              rows={3}
              className="resize-none text-sm focus-visible:ring-primary rounded-xl"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={approveMutation.isPending}
              onClick={() => {
                setComment("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              disabled={approveMutation.isPending}
              onClick={handleApprove}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Confirm Approval"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
