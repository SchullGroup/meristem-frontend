"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useGetPendingSplitApprovals,
  useBatchApproveSplitsRequest,
  useBatchRejectSplitsRequest,
} from "@/hooks/useDividendSplit";
import {
  BatchRejectSplits,
  DividendSplit,
} from "@/actions/dividendSplitActions";
import { SplitReviewDialog } from "./split-review-dialog";
import { PaginationBar } from "../pagination-bar";

export function PendingSplitsTable() {
  const { currentUser } = useStore();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<DividendSplit | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    data: pendingResponse,
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError,
    refetch: refetchPending,
  } = useGetPendingSplitApprovals({
    page: page - 1,
    size: pageSize,
  });

  const batchApproveMutation = useBatchApproveSplitsRequest();
  const batchRejectMutation = useBatchRejectSplitsRequest();

  function openReview(row: DividendSplit) {
    setSelected(row);
    setReviewOpen(true);
  }

  const pendingSplits = pendingResponse?.data?.content || [];
  const totalElements = pendingResponse?.data?.totalElements || 0;
  const totalPages = pendingResponse?.data?.totalPages || 1;
  const visibleIds = pendingSplits.map((r) => String(r.splitId));
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function toggleSel(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }
  function toggleAll(ids: string[]) {
    setSelectedIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }

  function handleBatchApprove() {
    if (selectedIds.size === 0) {
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    batchApproveMutation.mutate(
      {
        ids: Array.from(selectedIds),
        comment: "Batch approved",
        authorisedBy: currentUser?.email,
      } as BatchRejectSplits,
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.success(
              `${selectedIds.size} split${selectedIds.size !== 1 ? "s" : ""
              } approved successfully.`,
            );
            setSelectedIds(new Set());
            refetchPending();
          } else {
            toast.error(res?.responseMessage || "Failed to approve splits.");
          }
        },
        onError: (err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to approve splits.",
          );
        },
      },
    );
  }

  function handleBatchReject() {
    if (selectedIds.size === 0) {
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    batchRejectMutation.mutate(
      {
        ids: Array.from(selectedIds),
        comment: batchComment.trim(),
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.error(
              `${selectedIds.size} split${selectedIds.size !== 1 ? "s" : ""
              } rejected.`,
            );
            setSelectedIds(new Set());
            setBatchComment("");
            setBatchRejectOpen(false);
            refetchPending();
          } else {
            toast.error(res?.responseMessage || "Failed to reject splits.");
          }
        },
        onError: (err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to reject splits.",
          );
        },
      },
    );
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} split{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => {
                setBatchComment("");
                setBatchRejectOpen(true);
              }}
            >
              Reject Selected
            </Button>
            <Button size="sm" onClick={handleBatchApprove}>
              {batchApproveMutation.isPending
                ? "Approving..."
                : "Approve Selected"}
            </Button>
          </div>
        </div>
      )}

      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="p-3 w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleAll(visibleIds)}
                />
              </th>
              <th className="p-3">DATE</th>
              <th className="p-3">WARRANT NO</th>
              <th className="p-3">ACCOUNT</th>
              <th className="p-3">HOLDER</th>
              <th className="p-3">TOTAL AMOUNT (₦)</th>
              <th className="p-3">PARTS</th>
              <th className="p-3">SUBMITTED BY</th>
              <th className="p-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {isPendingLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-8 text-center text-muted-foreground"
                >
                  Loading pending split approvals...
                </td>
              </tr>
            ) : isPendingError ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-red-600">
                  {pendingError instanceof Error
                    ? pendingError.message
                    : "Unable to load pending split approvals."}
                </td>
              </tr>
            ) : pendingSplits.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-8 text-center text-muted-foreground"
                >
                  No pending split approvals.
                </td>
              </tr>
            ) : (
              pendingSplits.map((row) => {
                const rowId = String(row.splitId);
                return (
                  <tr
                    key={rowId}
                    className={`mrpsl-table-row ${selectedIds.has(rowId) ? "bg-primary/5" : ""}`}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(rowId)}
                        onCheckedChange={() => toggleSel(rowId)}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-3 font-mono">{row.warrantNumber}</td>
                    <td className="p-3 font-mono">{row.sourceAccount}</td>
                    <td className="p-3 font-medium">{row.holderName}</td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {row.totalAmount.toLocaleString()}.00
                    </td>
                    <td className="p-3 text-right tabular-nums">{row.parts}</td>
                    <td className="p-3 text-muted-foreground">
                      {row.submittedBy}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" onClick={() => openReview(row)}>
                        Review &amp; Decide
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
      <PaginationBar
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        total={totalElements}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageBase={1}
      />

      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Selected Splits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-8 pb-8">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} split{selectedIds.size !== 1 ? "s" : ""} will
              be rejected and returned to the submitter.
            </p>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Rejection Comment *</label>
              <Textarea
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                placeholder="Comment is required for rejection..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchReject}
              >
                {batchRejectMutation.isPending
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SplitReviewDialog
        open={reviewOpen}
        selected={selected}
        setOpen={(open) => setReviewOpen(open)}
      />
    </>
  );
}
