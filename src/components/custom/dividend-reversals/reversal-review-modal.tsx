"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { useDecideReversal } from "@/hooks/useDividendReversalFlow";
import { ReversalDetailBody } from "./reversal-detail-body";

// HOP Approval review modal (§5.2) — full request detail + comment + decision.
// Comment is required to reject, optional to approve.
export function ReversalReviewModal({
  request,
  open,
  onOpenChange,
}: {
  request: ReversalRequest | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currentUser } = useStore();
  const decideMutation = useDecideReversal();
  const [comment, setComment] = useState("");
  const [error, setError] = useState(false);

  // Reset when the modal opens for a (possibly different) request.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = open ? (request?.id ?? "__none__") : null;
  if (open && key !== loadedKey) {
    setLoadedKey(key);
    setComment("");
    setError(false);
  }

  function decide(decision: "APPROVED" | "REJECTED") {
    if (!request) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (decision === "REJECTED" && !comment.trim()) {
      setError(true);
      return;
    }
    decideMutation.mutate(
      {
        id: request.id,
        decision,
        actor: currentUser.email,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "APPROVED"
              ? `Reversal ${request.id} approved.`
              : `Reversal ${request.id} rejected.`,
          );
          onOpenChange(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>HOP Approval — {request?.id}</DialogTitle>
          <DialogDescription>
            Review the reversal request and record your decision. This action is
            logged to the audit history either way.
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            <ReversalDetailBody request={request} />

            <div className="space-y-2">
              <label className="mrpsl-label">
                Comment{" "}
                <span className="font-normal text-muted-foreground">
                  (required to reject)
                </span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (e.target.value.trim()) setError(false);
                }}
                placeholder="Add a note for the audit trail…"
                className={`resize-none ${error ? "border-red-500" : ""}`}
                rows={4}
              />
              {error && (
                <p className="text-[12px] text-red-600">
                  A comment is required to reject.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/60">
              <Button
                variant="destructive"
                className="flex-1 gap-1.5"
                onClick={() => decide("REJECTED")}
                disabled={decideMutation.isPending}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={() => decide("APPROVED")}
                disabled={decideMutation.isPending}
              >
                <Check className="h-4 w-4" /> Approve
                {decideMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
