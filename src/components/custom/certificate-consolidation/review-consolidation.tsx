"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { CertificateConsolidation } from "@/types/cscs";
import { useStore } from "@/lib/store";
import {
  useApproveConsolidationRequest,
  useBatchApproveOrRejectConsolidationRequest,
  useRejectConsolidationRequest,
} from "@/hooks/useCertConsolidation";

export const ReviewConsolidation = ({
  reviewOpen,
  setReviewOpen,
  selected,
  onSuccess,
}: {
  reviewOpen: boolean;
  setReviewOpen: (open: boolean) => void;
  selected: CertificateConsolidation | null;
  onSuccess?: () => void;
}) => {
  const [comment, setComment] = useState("");
  const currentUser = useStore((state) => state.currentUser);

  const rejectMutation = useRejectConsolidationRequest();
  const approveMutation = useApproveConsolidationRequest();

  const handleReject = () => {
    if (comment === "") {
      toast.error("Please enter a comment");
      return;
    }

    if (!selected) {
      toast.error("No record selected");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    rejectMutation.mutate(
      {
        approvalId: selected.id,
        data: {
          comment: comment,
          authorisedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Consolidation rejected.");
          setComment("");
          setReviewOpen(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(error.message || "Consolidation rejection failed.");
        },
      },
    );
  };

  const handleApprove = () => {
    if (!selected) {
      toast.error("No record selected");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    approveMutation.mutate(
      {
        approvalId: selected.id,
        data: {
          comment: comment,
          authorisedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Consolidation approved.");
          setComment("");
          setReviewOpen(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(error.message || "Consolidation approval failed.");
        },
      },
    );
  };

  return (
    <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Certificate Consolidation</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-5 px-6 pb-6 overflow-y-auto max-h-[75vh]">
            <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="mrpsl-section-title mb-0.5">Account</div>
                  <div className="font-mono font-bold">
                    {selected.accountNumber}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded shrink-0">
                  {selected.registerSymbol}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div>
                  <div className="mrpsl-section-title">Holder</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {selected.holderName}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Submitted By</div>
                  <div className="text-sm mt-0.5">{selected.submittedBy}</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">
                    Certificates to Merge
                  </div>
                  <div className="text-xl tabular-nums font-bold mt-0.5">
                    {selected.certCount}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Total Units</div>
                  <div className="text-xl tabular-nums font-bold mt-0.5">
                    {selected.totalUnits?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                Certificates Being Merged
              </div>
              <table className="w-full text-[13px]">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-2 text-left">CERT NO</th>
                    <th className="px-4 py-2">UNITS</th>
                    <th className="px-4 py-2">ISSUE DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selected.certificates?.map((c, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">
                        {c.certNumber}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold">
                        {c.units?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {c.issueDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/20">
                    <td className="px-4 py-2 text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold">
                      {selected.totalUnits?.toLocaleString() || 0}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                Approval Chain
              </h4>
              <div className="space-y-4">
                {((): Array<{
                  label: string;
                  done: boolean;
                  pending?: boolean;
                  time?: string | null;
                }> => [
                    {
                      label: `Submitted by ${selected.submittedBy}`,
                      done: true,
                      time: selected.submittedAt
                        ? new Date(selected.submittedAt).toLocaleString()
                        : "N/A",
                    },
                    {
                      label: "ICU Final Review — Pending",
                      done: false,
                      pending: true,
                      time: null,
                    },
                  ])().map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-green-500" : step.pending ? "bg-amber-200 animate-pulse" : "border-2 border-muted bg-background"}`}
                      >
                        {step.done && (
                          <Check
                            className="h-3 w-3 text-white"
                            style={{ strokeWidth: 3 }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-sm">{step.label}</div>
                        {step.time && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {step.time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="mrpsl-label">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason..."
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {rejectMutation?.isPending ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                disabled={approveMutation.isPending || rejectMutation.isPending}

                className="flex-1" onClick={handleApprove}>
                {approveMutation?.isPending ? "Approving..." : "Approve Consolidation"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const RejectConsolidation = ({
  selectedIds,
  batchRejectOpen,
  setBatchRejectOpen,
  onSuccess,
}: {
  selectedIds: string[];
  batchRejectOpen: boolean;
  setBatchRejectOpen: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const currentUser = useStore((state) => state.currentUser);
  const [batchComment, setBatchComment] = useState("");

  const batchRejectMutation = useBatchApproveOrRejectConsolidationRequest();

  const handleBatchReject = () => {
    if (batchComment.trim() === "") {
      toast.error("Please enter a rejection comment");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select at least one consolidation");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    batchRejectMutation.mutate(
      {
        approveIds: [],
        rejectIds: selectedIds,
        rejectComment: batchComment,
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: () => {
          onSuccess();
          setBatchRejectOpen(false);
          setBatchComment("");
          toast.success("Consolidations rejected successfully");
        },
        onError: (error) => {
          toast.error(error?.message || "Failed to reject consolidations");
        },
      },
    );
  };

  return (
    <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Reject {selectedIds.length} Record
            {selectedIds.length !== 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            This comment will be applied to all selected records and sent to the
            initiator.
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
              disabled={batchRejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleBatchReject}
              disabled={batchRejectMutation.isPending}
            >
              Confirm Rejection
              {batchRejectMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
