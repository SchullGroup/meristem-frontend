"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { WarrantStatusResponse } from "@/actions/warrantMarkoffActions";
import { toast } from "sonner";

interface ReviewDecideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: WarrantStatusResponse | null;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function getTierNumber(tier: string | number | undefined): 1 | 2 | 3 {
  if (!tier) return 1;
  const str = String(tier).toUpperCase();
  if (
    str.includes("3") ||
    str.includes("THREE") ||
    str.includes("MANAGEMENT") ||
    str.includes("FINAL")
  )
    return 3;
  if (
    str.includes("2") ||
    str.includes("TWO") ||
    str.includes("ICU") ||
    str.includes("SECOND")
  )
    return 2;
  return 1;
}

function approveButtonText(tier: string | number | undefined) {
  const num = getTierNumber(tier);
  return num === 1
    ? "Approve & Forward to ICU"
    : num === 2
      ? "ICU Approve & Forward to Management"
      : "Final Management Approval";
}

function modalTitle(tier: string | number | undefined) {
  const num = getTierNumber(tier);
  return num === 1
    ? "1st Approval Review"
    : num === 2
      ? "ICU Review"
      : "Management Sign-Off";
}

type ApprovalChainStep = { label: string; done: boolean; pending: boolean };

function buildApprovalChain(
  submittedBy: string,
  tier: string | number | undefined,
): ApprovalChainStep[] {
  const num = getTierNumber(tier);
  return [
    { label: `Submitted by ${submittedBy}`, done: true, pending: false },
    { label: "1st Approval", done: num > 1, pending: num === 1 },
    { label: "ICU Approval", done: num > 2, pending: num === 2 },
    { label: "Management Approval", done: false, pending: num === 3 },
  ];
}

export function ReviewDecideDialog({
  open,
  onOpenChange,
  selected,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ReviewDecideDialogProps) {
  const [comment, setComment] = useState("");

  const handleRejectClick = () => {
    if (!comment.trim()) {
      toast.error("Comment is required for rejection.");
      return;
    }
    onReject(comment);
  };

  const handleApproveClick = () => {
    onApprove(comment);
  };

  if (!selected) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{modalTitle(selected?.currentTier)}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Approving will permanently mark this warrant as{" "}
              <strong>PAID</strong>. This action cannot be undone.
            </span>
          </div>

          <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mrpsl-section-title">Warrant No</div>
                <div className="font-mono font-bold mt-0.5">
                  {selected?.warrantNumber}
                </div>
              </div>
              <div>
                <div className="mrpsl-section-title">Dividend</div>
                <div className="font-mono text-sm mt-0.5">
                  {selected?.dividendNumber}
                </div>
              </div>
              <div>
                <div className="mrpsl-section-title">Account</div>
                <div className="font-mono text-sm mt-0.5">
                  {selected?.accountNumber}
                </div>
              </div>
              <div>
                <div className="mrpsl-section-title">Holder</div>
                <div className="font-semibold text-sm mt-0.5">
                  {selected?.holderName}
                </div>
              </div>
              <div className="col-span-2">
                <div className="mrpsl-section-title">Amount</div>
                <div className="text-2xl tabular-nums font-bold mt-0.5 text-primary">
                  ₦{selected?.amount.toLocaleString()}.00
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border/60 rounded-xl p-4">
            <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
              Approval Chain
            </h4>
            <div className="space-y-4">
              {buildApprovalChain(
                selected.submittedBy,
                selected?.currentTier,
              ).map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                      step.done
                        ? "bg-green-100"
                        : step.pending
                          ? "bg-amber-200 animate-pulse"
                          : "bg-muted"
                    }`}
                  >
                    {step.done && <Check className="h-3 w-3 text-green-600" />}
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
              disabled={isApproving || isRejecting}
              onClick={handleRejectClick}
            >
              {isRejecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject
            </Button>
            <Button
              className="flex-1"
              disabled={isApproving || isRejecting}
              onClick={handleApproveClick}
            >
              {isApproving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {approveButtonText(selected?.currentTier)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BatchRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (comment: string) => void;
  isConfirming: boolean;
}

export function BatchRejectDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isConfirming,
}: BatchRejectDialogProps) {
  const [comment, setComment] = useState("");

  const handleConfirm = () => {
    if (!comment.trim()) {
      toast.error("Comment is required for rejection.");
      return;
    }
    onConfirm(comment);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Selected Warrants</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-8 pb-8">
          <p className="text-sm text-muted-foreground">
            {selectedCount} warrant{selectedCount !== 1 ? "s" : ""} will be
            rejected and returned to the submitter.
          </p>
          <div className="space-y-2">
            <label className="mrpsl-label">Rejection Comment *</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment is required for rejection..."
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isConfirming}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isConfirming}
              onClick={handleConfirm}
            >
              {isConfirming && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirm Rejection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EnBlocConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectionTotal: number;
  onConfirm: (reason: string) => void;
  isConfirming: boolean;
}

export function EnBlocConfirmDialog({
  open,
  onOpenChange,
  selectedCount,
  selectionTotal,
  onConfirm,
  isConfirming,
}: EnBlocConfirmDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("Reason is required for submitting.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit En Bloc Mark-Off</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-8 pb-8">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              You are about to submit <strong>{selectedCount}</strong> warrants
              for 1st level approval. Total:{" "}
              <strong>₦{selectionTotal.toLocaleString()}.00</strong>.
            </span>
          </div>
          <div className="space-y-2">
            <label className="mrpsl-label">Reason / Comment *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason is required..."
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isConfirming}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={isConfirming}
              onClick={handleConfirm}
            >
              {isConfirming && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Submit Mark-Off
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
