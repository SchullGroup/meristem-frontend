"use client";

import { useState } from "react";
import { DividendSplit } from "@/actions/dividendSplitActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import {
  useApproveSplitRequest,
  useRejectSplitRequest,
} from "@/hooks/useDividendSplit";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export function SplitReviewDialog({
  open,
  selected,
  setOpen,
}: {
  open: boolean;
  selected: DividendSplit | null;
  setOpen: (open: boolean) => void;
}) {
  const [comment, setComment] = useState("");

  const { currentUser } = useStore();
  const approveMutation = useApproveSplitRequest();
  const rejectMutation = useRejectSplitRequest();

  function handleApprove() {
    if (!selected) return;

    if (!comment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }

    approveMutation.mutate(
      {
        id: selected?.splitId,
        data: {
          comment,
          authorisedBy:
            currentUser?.email ||
            `${currentUser?.firstName} ${currentUser?.lastName}` ||
            currentUser?.username ||
            "ADMIN",
        },
      },
      {
        onSuccess: () => {
          toast.success("Split approved successfully.");
          setOpen(false);
        },
        onError: (err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to approve split.",
          );
        },
      },
    );
  }

  function handleReject() {
    if (!selected) return;

    if (!comment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }

    rejectMutation.mutate(
      {
        id: selected?.splitId,
        data: {
          comment,
          authorisedBy:
            currentUser?.email ||
            `${currentUser?.firstName} ${currentUser?.lastName}` ||
            currentUser?.username ||
            "ADMIN",
        },
      },
      {
        onSuccess: () => {
          toast.success("Split approved successfully.");
          setOpen(false);
        },
        onError: (err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to approve split.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Review Dividend Split</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
            <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mrpsl-section-title">Warrant No</div>
                  <div className="font-mono font-bold mt-0.5">
                    {selected?.warrantNumber}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Account</div>
                  <div className="font-mono text-sm mt-0.5">
                    {selected?.sourceAccount}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Holder</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {selected?.holderName}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Total Amount</div>
                  <div className="text-xl tabular-nums font-bold mt-0.5 text-primary">
                    ₦{selected.totalAmount.toLocaleString()}.00
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <Check className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
              <span>
                Dividend {selected.warrantNumber} is{" "}
                <strong>{selected?.status}</strong> and eligible for split.
              </span>
            </div>

            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                Split Breakdown ({selected.parts} parts)
              </h4>
              <div className="space-y-2">
                {selected?.partDetails.map((part, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0"
                  >
                    <span className="text-sm font-mono text-muted-foreground">
                      {part.destinationAccountNumber}
                    </span>
                    <span className="text-sm font-mono font-semibold">
                      ₦{part.amount.toLocaleString()}.00
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-sm">
                  <span>Total</span>
                  <span className="font-mono text-primary">
                    ₦{selected.totalAmount.toLocaleString()}.00
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                Approval Chain
              </h4>
              <div className="space-y-4">
                {[
                  {
                    label: `Submitted by ${selected.submittedBy}`,
                    done: true,
                    pending: false,
                  },
                  {
                    label: "Authoriser — Pending your action",
                    done: false,
                    pending: true,
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : "bg-amber-200 animate-pulse"}`}
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

            <div className="space-y-2">
              <label className="mrpsl-label">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Required for rejection..."
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
                Approve Split
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
