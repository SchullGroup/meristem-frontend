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
import { Check } from "lucide-react";
import { TransferRequest } from "@/types/cscs";
import {
  useApproveTransferRequest,
  useBatchApproveOrRejectTransferRequest,
  useRejectTransferRequest,
} from "@/hooks/useCertTransfer";
import { useStore } from "@/lib/store";

export const ReviewTranser = ({
  reviewOpen,
  setReviewOpen,
  selected,
  onSuccess,
}: {
  reviewOpen: boolean;
  setReviewOpen: (open: boolean) => void;
  selected: TransferRequest | null;
  onSuccess?: () => void;
}) => {
  const [comment, setComment] = useState("");
  const rejectMutation = useRejectTransferRequest();
  const approveMutation = useApproveTransferRequest();

  const currentUser = useStore((state) => state.currentUser);
  const addRejectedTransfer = useStore((state) => state.addRejectedTransfer);

  const handleReject = () => {
    if (comment === "") {
      toast.error("");
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
          if (selected) {
            addRejectedTransfer({
              ...selected,
              authoriserComment: comment,
            });
          }
          toast.success("Transfer rejected.");
          setComment("");
          setReviewOpen(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(error.message || "Transfer rejection failed.");
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
          toast.success("Transfer approved.");
          setComment("");
          setReviewOpen(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(error.message || "Transfer approval failed.");
        },
      },
    );
  };

  return (
    <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Certificate Transfer</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-6 px-8 pb-8">
            <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
              <div className="mrpsl-section-title">Certificate</div>
              <div className="font-mono font-bold">
                {selected.sourceCertNumber}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div>
                  <div className="mrpsl-section-title">From (Transferor)</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {selected.fromHolder}
                  </div>
                  <div className="font-mono text-[13px] text-muted-foreground">
                    {selected.fromAccount}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">To (Transferee)</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {selected.toHolder}
                  </div>
                  <div className="font-mono text-[13px] text-muted-foreground">
                    {selected.toAccount}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Units Transferred</div>
                  <div className="text-xl tabular-nums font-bold mt-0.5">
                    {selected.units.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Stamp Duty</div>
                  <div className="text-xl tabular-nums font-bold mt-0.5">
                    ₦{selected.stampDuty.toLocaleString()}
                  </div>
                </div>
              </div>
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
                    time: selected.submittedAt + ", 09:14",
                  },
                  // {
                  //     label: "Authorised by Ngozi Adeyemi (Operations Manager)",
                  //     done: true,
                  //     // time: selected.date + ", 11:30",
                  //     time: "12-06-2026" + ", 11:30",
                  // },
                  // {
                  //     label: "ICU Final Review — Approved",
                  //     done: true,
                  //     time: "12-06-2026" + ", 14:00",
                  // },
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
              >
                Reject
              </Button>
              <Button className="flex-1" onClick={handleApprove}>
                Approve Transfer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const RejectTransfer = ({
  selectedIds,
  selectedTransfers,
  batchRejectOpen,
  setBatchRejectOpen,
  onSuccess,
}: {
  selectedIds: string[];
  selectedTransfers: TransferRequest[];
  batchRejectOpen: boolean;
  setBatchRejectOpen: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const currentUser = useStore((state) => state.currentUser);
  const addRejectedTransfer = useStore((state) => state.addRejectedTransfer);

  const [batchComment, setBatchComment] = useState("");

  const batchRejectMutation = useBatchApproveOrRejectTransferRequest();

  const handleBatchReject = () => {
    if (batchComment.trim() === "") {
      toast.error("Please enter a rejection comment");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select at least one transfer");
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
          selectedTransfers.forEach((t) => {
            addRejectedTransfer({
              ...t,
              authoriserComment: batchComment,
            });
          });
          onSuccess();
          setBatchRejectOpen(false);
          setBatchComment("");
          toast.success("Transfers rejected successfully");
        },
        onError: (error) => {
          toast.error(error?.message || "Failed to reject transfers");
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
  );
};
