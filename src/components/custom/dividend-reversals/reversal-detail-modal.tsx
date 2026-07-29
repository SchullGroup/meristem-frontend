"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { ReversalDetailBody } from "./reversal-detail-body";

// Read-only reversal detail (Pending "View" and History "View").
export function ReversalDetailModal({
  request,
  open,
  onOpenChange,
  title = "Reversal Request",
}: {
  request: ReversalRequest | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {title} — {request?.id}
          </DialogTitle>
        </DialogHeader>
        {request && <ReversalDetailBody request={request} showDecision />}
      </DialogContent>
    </Dialog>
  );
}
