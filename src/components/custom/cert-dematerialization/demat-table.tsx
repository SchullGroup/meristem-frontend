import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Demat, DematStatus } from "@/actions/certDematActions";
import { formatDate } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";

export function DematTable({
  records,
  onReview,
  onBatchApprove,
  onBatchReject,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  approveLabel = "Approve Selected",
  onBatchDownload,
  extraBatchActions,
  type,
}: {
  records: Demat[];
  onReview?: (r: Demat) => void;
  onBatchApprove?: (ids: string[]) => void;
  onBatchReject?: (ids: string[], comment: string) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  approveLabel?: string;
  onBatchDownload?: (ids: string[]) => void;
  extraBatchActions?: React.ReactNode;
  type: DematStatus;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [rejectingUnchecked, setRejectingUnchecked] = useState(false);

  useEffect(() => {
    //eslint-disable-next-line
    setSelectedIds(new Set());
  }, [records]);

  const visibleIds = records.map((r) => r.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const uncheckedIds = records
    .filter((r) => !selectedIds.has(r.id))
    .map((r) => r.id);

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

  function handleBatchApprove() {
    if (onBatchApprove) {
      onBatchApprove([...selectedIds]);
    }
    setSelectedIds(new Set());
  }

  function handleBatchReject() {
    if (!batchComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    if (rejectingUnchecked) {
      if (onBatchApprove) onBatchApprove([...selectedIds]);
      if (onBatchReject) onBatchReject(uncheckedIds, batchComment);
    } else {
      if (onBatchReject) onBatchReject([...selectedIds], batchComment);
    }
    setSelectedIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
    setRejectingUnchecked(false);
  }

  function getDematDate(row: Demat) {
    switch (type) {
      case "CALLOVER":
        return formatDate(row.calloverAt);
      case "AUTHORISED":
        return formatDate(row.authorisedAt);
      case "ICU_APPROVED":
        return formatDate(row.icuApprovedAt);
      default:
        return formatDate(row.createdAt);
    }
  }

  return (
    <div className="space-y-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            {onBatchReject && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => {
                  setRejectingUnchecked(false);
                  setBatchRejectOpen(true);
                }}
              >
                Reject Selected
              </Button>
            )}
            {onBatchReject && uncheckedIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  setRejectingUnchecked(true);
                  setBatchRejectOpen(true);
                }}
              >
                Approve ✓ / Reject ✗ Unchecked
              </Button>
            )}
            {onBatchDownload && (
              <Button
                size="sm"
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/5"
                onClick={() => {
                  onBatchDownload([...selectedIds]);
                  setSelectedIds(new Set());
                }}
              >
                Download (.txt)
              </Button>
            )}
            {extraBatchActions}
            {onBatchApprove && (
              <Button size="sm" onClick={handleBatchApprove}>
                {approveLabel}
              </Button>
            )}
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
                  onCheckedChange={() => toggleSelectAll(visibleIds)}
                />
              </th>
              <th className="p-3">DATE</th>
              <th className="p-3">CERT NO(S)</th>
              <th className="p-3">HOLDER</th>
              <th className="p-3">CHN</th>
              <th className="p-3">BROKER</th>
              <th className="p-3">UNITS</th>
              <th className="p-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {records.map((row) => (
              <tr key={row.id} className="mrpsl-table-row">
                <td className="p-3">
                  <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={() => toggleSelect(row.id)}
                  />
                </td>
                <td className="p-3 text-muted-foreground">
                  {getDematDate(row)}
                </td>
                <td
                  className="p-3 font-mono truncate max-w-40"
                  title={row.certificates?.map((c) => c.certNumber).join(", ")}
                >
                  {row.certificates?.map((c) => c.certNumber).join(", ") || "-"}
                </td>
                <td className="p-3 font-medium">{row.holderName}</td>
                <td className="p-3 font-mono text-muted-foreground">
                  {row.chn}
                </td>
                <td className="p-3">{row.broker}</td>
                <td className="p-3 text-right tabular-nums font-semibold">
                  {row.totalUnits?.toLocaleString() || 0}
                </td>
                {onReview && (
                  <td className="p-3 text-right">
                    <Button size="sm" onClick={() => onReview(row)}>
                      Review &amp; Decide
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-12 text-center text-muted-foreground"
                >
                  No records at this stage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <PaginationBar
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <Dialog
        open={batchRejectOpen}
        onOpenChange={(open) => {
          setBatchRejectOpen(open);
          if (!open) setRejectingUnchecked(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectingUnchecked
                ? `Approve ${selectedIds.size} & Reject ${uncheckedIds.length} Unchecked`
                : `Reject ${selectedIds.size} Record${selectedIds.size !== 1 ? "s" : ""}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              {rejectingUnchecked
                ? "Checked records will be approved. This comment will be applied to all unchecked (rejected) records."
                : "This comment will be applied to all selected records and sent to the initiator."}
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Rejection Comment <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
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
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
