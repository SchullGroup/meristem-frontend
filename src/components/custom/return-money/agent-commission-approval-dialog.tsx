"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type {
  AgentCommissionRecord,
  CommissionStatus,
} from "./agent-commission-types";
import { COMMISSION_STATUS_LABELS } from "./agent-commission-types";

const REVIEWABLE: CommissionStatus[] = [
  "PENDING_OPS_REVIEW",
  "PENDING_ICU_REVIEW",
];

function trailDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy, HH:mm");
  } catch {
    return iso;
  }
}

export function AgentCommissionApprovalDialog({
  open,
  onOpenChange,
  record,
  onDecision,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AgentCommissionRecord | null;
  onDecision: (approved: boolean, remark: string, actor: string) => void;
}) {
  const [remark, setRemark] = useState("");
  const currentUser = useStore((state) => state.currentUser);

  if (!record) return null;

  const canReview = REVIEWABLE.includes(record.status);
  const stageLabel =
    record.status === "PENDING_OPS_REVIEW"
      ? "First Approval"
      : record.status === "PENDING_ICU_REVIEW"
        ? "ICU Approval"
        : COMMISSION_STATUS_LABELS[record.status];

  function close(v: boolean) {
    if (!v) setRemark("");
    onOpenChange(v);
  }

  function handleAction(approved: boolean) {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    // Rejection must be explained — the remark is the audit record.
    if (!approved && !remark.trim()) {
      toast.error("A remark is required when rejecting a commission.");
      return;
    }
    onDecision(approved, remark.trim(), currentUser.email);
    setRemark("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record.agentName}</DialogTitle>
          <DialogDescription>
            Current stage:{" "}
            <span className="font-semibold">{stageLabel}</span>
            {canReview
              ? " — add a remark (required for rejection) and choose an action."
              : " — this commission is not awaiting a decision."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="mrpsl-label">Commission Owed</p>
              <p className="font-mono font-semibold text-primary">
                ₦{record.commissionAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Rate</p>
              <p className="font-mono">{record.commissionRate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="mrpsl-label">Applications</p>
              <p className="font-mono">
                {record.totalApplications.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Value Refunded</p>
              <p className="font-mono">
                ₦{record.totalValueRefunded.toLocaleString()}
              </p>
            </div>
          </div>

          {canReview && (
            <div className="space-y-1.5">
              <label className="mrpsl-label">
                Remark (optional for approval, required for rejection)
              </label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="resize-none text-sm focus-visible:ring-primary rounded-xl"
              />
            </div>
          )}

          {record.approvalTrail.length > 0 && (
            <div className="space-y-1.5">
              <p className="mrpsl-label">Approval Trail</p>
              <div className="border border-border/60 rounded-lg divide-y max-h-44 overflow-y-auto">
                {record.approvalTrail.map((entry, i) => (
                  <div key={i} className="px-3 py-2 text-[13px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {entry.stage} · {entry.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground text-[12px]">
                        {trailDate(entry.date)}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[12px]">
                      {entry.actor}
                      {entry.remark ? ` — ${entry.remark}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {canReview ? (
            <>
              <Button variant="destructive" onClick={() => handleAction(false)}>
                Reject
              </Button>
              <Button onClick={() => handleAction(true)}>Approve</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => close(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
