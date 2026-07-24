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

/**
 * Shared approve/reject action dialog for the drill-in review screens.
 * A single "Take Action" button on the detail screen opens this; reject
 * requires a comment, approve does not.
 */
export function DecisionDialog({
  open,
  onOpenChange,
  title,
  description,
  approveLabel,
  onApprove,
  onReject,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  approveLabel: string;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  isPending: boolean;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState(false);

  // Reset when the dialog opens — adjusted during render, not in an effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setComment("");
    setError(false);
  }
  if (!open && wasOpen) setWasOpen(false);

  function reject() {
    if (!comment.trim()) {
      setError(true);
      return;
    }
    onReject(comment.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <label className="mrpsl-label">
            Comment <span className="font-normal text-muted-foreground">(required to reject)</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            placeholder="Add a note for the approval trail…"
            className={`resize-none ${error ? "border-red-500" : ""}`}
            rows={4}
          />
          {error && <p className="text-[12px] text-red-600">A comment is required to reject.</p>}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border/60">
          <Button
            variant="destructive"
            className="flex-1 gap-1.5"
            onClick={reject}
            disabled={isPending}
          >
            <X className="h-4 w-4" /> Reject
          </Button>
          <Button
            className="flex-1 gap-1.5"
            onClick={() => onApprove(comment.trim())}
            disabled={isPending}
          >
            <Check className="h-4 w-4" /> {approveLabel}
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
