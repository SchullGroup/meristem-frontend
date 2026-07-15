"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useRolePermission } from "@/hooks/usePermission";
import { AlertTriangle, Check, FileText, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { DateRangePicker } from "../date-range-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  useAuthoriseConsolidation,
  useBatchAuthoriseConsolidations,
  useBatchRejectConsolidations,
  useGetConsolidations,
  useRejectConsolidation,
} from "@/hooks/useAccountMaintenance";
import { DataErrorState } from "../ipo/loaders";
import { PaginationBar } from "../pagination-bar";
import { Consolidation } from "@/types/account-maintenance";
import { formatDate } from "@/lib/utils/format";

export default function PendingAuth({ tab }: { tab: string }) {
  const { currentUser } = useStore();
  const canApprove = useRolePermission(
    "account_maintenance.account_consolidation_approve.approve",
  );

  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [register, setRegister] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [selected, setSelected] = useState<Consolidation | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);

  const [rejectComment, setRejectComment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
  } | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetConsolidations(
    {
      status: "PENDING",
      page: currentPage,
      pageSize: pageSize,
      from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      registerId: register !== "" ? register : undefined,
    },
    {
      enabled: tab === "auth",
    },
  );

  const batchApproveMutation = useBatchAuthoriseConsolidations();
  const batchRejectMutation = useBatchRejectConsolidations();
  const approveMutation = useAuthoriseConsolidation();
  const rejectMutation = useRejectConsolidation();

  const consolidations = data?.content || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const total = data?.pagination?.total || 0;

  function openReview(row: Consolidation) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  function toggleSelect(id: number) {
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

  function toggleSelectAll(ids: number[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  function handleBatchApprove() {
    if (selectedIds.size === 0) return;

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    batchApproveMutation.mutate(
      {
        ids: Array.from(selectedIds).map(String),
        comment: "Consolidation authorised",
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: () => {
          toast.success(
            `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} approved.`,
          );
          setSelectedIds(new Set());
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to approve records");
        },
      },
    );
  }

  const handleBatchReject = () => {
    if (rejectComment.trim() === "") {
      toast.error("Please enter a rejection comment");
      return;
    }

    if (selectedIds.size === 0) {
      toast.error("Please select at least one consolidation");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    batchRejectMutation.mutate(
      {
        ids: Array.from(selectedIds).map(String),
        comment: rejectComment,
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: () => {
          refetch();
          setBatchRejectOpen(false);
          setSelectedIds(new Set());
          setRejectComment("");
          toast.success("Consolidations rejected successfully");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to reject consolidations");
        },
      },
    );
  };

  function handleReject() {
    if (!selected) return;

    if (rejectComment.trim() === "") {
      toast.error("Please enter a rejection comment");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    rejectMutation.mutate(
      {
        id: selected?.id,
        data: {
          comment: rejectComment,
          authorisedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Consolidation rejected successfully");
          setReviewOpen(false);
          setSelected(null);
          setRejectComment("");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to reject consolidation");
        },
      },
    );
  }

  function handleApprove() {
    if (!selected) return;

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    approveMutation.mutate(
      {
        id: selected?.id,
        data: {
          comment: "Consolidation Authorised",
          authorisedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Consolidation approved successfully");
          setReviewOpen(false);
          setSelected(null);
          setRejectComment("");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to reject consolidation");
        },
      },
    );
  }

  const visibleIds = consolidations.map((r) => r.id);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  if (isLoading) {
    return <EntitlementTableSkeleton />;
  }

  return (
    <>
      {canApprove && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setBatchRejectOpen(true)}
            >
              Reject Selected
            </Button>
            <Button
              size="sm"
              disabled={batchApproveMutation.isPending}
              onClick={handleBatchApprove}
            >
              {batchApproveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mrpsl-loader" />
                  Approving...
                </>
              ) : (
                "Approve Selected"
              )}
            </Button>
          </div>
        </div>
      )}
      <div className="flex gap-2 items-center flex-wrap py-4">
        <Select value={register} onValueChange={(v) => setRegister(v || "")}>
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Registers</SelectItem>
            {activeRegisters?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                {r.registerName} · {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="space-y-1.5">
          <DateRangePicker
            className="mt-0"
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        {isError ? (
          <DataErrorState
            message={error?.message || "Failed to load consolidations."}
            onRetry={refetch}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                {canApprove && (
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectAll(visibleIds)}
                    />
                  </th>
                )}
                <th className="p-3">DATE</th>
                <th className="p-3">REGISTER</th>
                <th className="p-3">SOURCE ACCOUNTS</th>
                <th className="p-3">DESTINATION</th>
                <th className="p-3 text-right">TOTAL HOLDINGS</th>
                <th className="p-3">REASON</th>
                <th className="p-3 text-center">SUBMITTED BY</th>
                <th className="p-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {consolidations?.length > 0 ? (
                consolidations?.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    {canApprove && (
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                    )}
                    <td className="p-3 text-muted-foreground">
                      {formatDate(row?.createdAt)}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.destinationAccount?.registerSymbol ??
                        row.registerId ??
                        "—"}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {row?.sourceAccounts?.length > 0
                        ? row.sourceAccounts
                            ?.map((account) => account?.accountNumber)
                            .join(", ")
                        : "---"}
                    </td>
                    <td className="p-3 font-medium">
                      {row?.destinationAccount?.accountNumber}(
                      {row?.destinationAccount?.holderName})
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {row?.totalHoldings?.toLocaleString()}
                    </td>
                    <td className="p-3 max-w-45">
                      {(() => {
                        const reason = row.reason ?? row.comment;
                        if (!reason)
                          return (
                            <span className="text-muted-foreground/50">—</span>
                          );
                        if (reason.length > 40)
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-default text-muted-foreground truncate block text-left">
                                  {reason.slice(0, 40)}…
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs whitespace-pre-wrap">
                                  {reason}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        return (
                          <span className="text-muted-foreground">
                            {reason}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-muted-foreground text-center">
                      {row?.initiatorName}
                    </td>
                    <td className="p-3 text-center">
                      {canApprove ? (
                        <Button size="sm" onClick={() => openReview(row)}>
                          Review &amp; Authorise
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReview(row)}
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canApprove ? 9 : 8}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No pending account consolidations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
      <PaginationBar
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {canApprove
                ? "Review Account Consolidation"
                : "Consolidation Details"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 px-8 pb-8">
              {canApprove && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Source accounts will be deactivated.</strong> This
                    action requires authorisation before taking effect.
                  </span>
                </div>
              )}

              {/* Submission metadata */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="mrpsl-section-title mb-0.5">SUBMITTED BY</p>
                  <p className="font-medium">
                    {selected.submittedBy ?? selected.initiatorName}
                  </p>
                </div>
                <div>
                  <p className="mrpsl-section-title mb-0.5">SUBMITTED AT</p>
                  <p className="text-muted-foreground">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="mrpsl-section-title mb-0.5">REGISTER(S)</p>
                  <p className="font-mono text-xs text-muted-foreground leading-5">
                    {selected.registerNames?.join(", ") ??
                      selected.destinationAccount.registerSymbol}
                  </p>
                </div>
              </div>

              {/* Source accounts */}
              <div>
                <p className="mrpsl-section-title mb-2">
                  {selected.sourceAccounts.length} SOURCE ACCOUNT
                  {selected.sourceAccounts.length !== 1 ? "S" : ""} (to be
                  deactivated)
                </p>
                <div className="border border-border/60 rounded-xl divide-y divide-border/60">
                  {selected.sourceAccounts.map((acct, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{acct.holderName}</span>
                        <span className="text-muted-foreground font-mono ml-2 text-xs">
                          {acct.accountNumber}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {acct.registerSymbol}
                      </span>
                      <span className="tabular-nums font-semibold shrink-0">
                        {acct.holdings?.toLocaleString()}
                      </span>
                      {acct.status && (
                        <span
                          className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                            acct.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {acct.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination account */}
              <div>
                <p className="mrpsl-section-title mb-2">DESTINATION ACCOUNT</p>
                <div className="border border-border/60 rounded-xl px-4 py-3 space-y-0.5">
                  <div className="font-semibold">
                    {selected.destinationAccount.holderName}
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {selected.destinationAccount.accountNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-mono">
                      {selected.destinationAccount.registerSymbol}
                    </span>
                    {" · "}
                    {selected.destinationAccount.registerName}
                  </div>
                </div>
              </div>

              {/* Combined holdings */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 rounded-xl border border-border/60">
                <span className="text-sm text-muted-foreground">
                  Combined holdings after merge
                </span>
                <span className="text-xl tabular-nums font-bold text-primary">
                  {selected.totalHoldings?.toLocaleString()}
                </span>
              </div>

              {/* Cross-register warning */}
              {(selected.registerNames?.length ?? 0) > 1 && (
                <div className="flex items-center gap-2 px-3 py-2.5 border border-amber-300 bg-amber-50 rounded-xl text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Cross-register consolidation — unified record will be under{" "}
                    <strong>
                      {selected.destinationAccount.registerSymbol}
                    </strong>
                    .
                  </span>
                </div>
              )}

              {/* Reason */}
              {(selected.reason ?? selected.comment) && (
                <div>
                  <p className="mrpsl-section-title mb-1">REASON</p>
                  <p className="text-sm text-muted-foreground px-1">
                    {selected.reason ?? selected.comment}
                  </p>
                </div>
              )}

              {/* Supporting documents */}
              {selected.supportingDocuments &&
                selected.supportingDocuments.length > 0 && (
                  <div>
                    <p className="mrpsl-section-title mb-2">
                      SUPPORTING DOCUMENTS (
                      {selected.supportingDocuments.length})
                    </p>
                    <div className="space-y-2">
                      {selected.supportingDocuments.map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-2 border border-border/60 rounded-lg"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate flex-1">
                            {doc.name}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 text-primary"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            Preview
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Approval chain */}
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {[
                    {
                      label: `Submitted by ${selected.submittedBy ?? selected.initiatorName}`,
                      done: true,
                    },
                    {
                      label: canApprove
                        ? "Authoriser — Pending your action"
                        : "Authoriser — Pending",
                      done: false,
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          step.done
                            ? "bg-green-100"
                            : "bg-amber-200 animate-pulse"
                        }`}
                      >
                        {step.done && (
                          <Check className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              {canApprove ? (
                <>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Comment</label>
                    <Textarea
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      placeholder="Required for rejection..."
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-border/60">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleReject}
                      disabled={
                        rejectMutation.isPending || rejectComment.trim() === ""
                      }
                    >
                      {rejectMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mrpsl-loader" />
                          Rejecting...
                        </>
                      ) : (
                        "Reject"
                      )}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mrpsl-loader" />
                          Authorising...
                        </>
                      ) : (
                        "Authorise Consolidation"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-border/60">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setReviewOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border/60">
            {previewDoc && (
              <iframe
                src={previewDoc.url}
                title={previewDoc.name}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-lg max-h-175 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Reject {Array.from(selectedIds).length} Record
              {Array.from(selectedIds).length !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              This comment will be applied to all selected records and sent to
              the initiator.
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Rejection Comment <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="State reason for rejection..."
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchReject}
                disabled={batchRejectMutation.isPending}
              >
                {batchRejectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mrpsl-loader" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
