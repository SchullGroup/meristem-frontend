"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ShieldOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useRemoveCautionAccount } from "@/hooks/useAccountMaintenance";
import { ShareholderAccount } from "@/types/account-maintenance";
import { fullName } from "@/lib/utils/shareholder";

interface RemoveCautionButtonProps {
  selectedShareholder: ShareholderAccount;
  // Called after a remove-caution request is submitted (e.g. to refetch).
  onSuccess?: () => void;
}

// Lifts a caution from a cautioned account. Like a caution, the removal goes
// through the KYC approval workflow before it takes effect.
export function RemoveCautionButton({
  selectedShareholder,
  onSuccess,
}: RemoveCautionButtonProps) {
  const currentUser = useStore((s) => s.currentUser);
  const removeMutation = useRemoveCautionAccount();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [showHint, setShowHint] = useState(false);

  function resetAndClose() {
    setOpen(false);
    setReason("");
    setShowHint(false);
  }

  function handleSubmit() {
    if (!reason.trim()) {
      setShowHint(true);
      return;
    }
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    removeMutation.mutate(
      {
        accountNumber: selectedShareholder.accountNumber,
        params: { registerId: selectedShareholder.registerId, reason: reason.trim(), initiatedBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success("Remove-caution request submitted for approval");
          resetAndClose();
          onSuccess?.();
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to submit remove-caution request"),
      },
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
        onClick={() => setOpen(true)}
      >
        <ShieldOff className="h-3.5 w-3.5" />
        Remove Caution
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}
      >
        <DialogContent className="max-w-md px-4">
          <DialogHeader>
            <DialogTitle>Remove Caution from This Account?</DialogTitle>
            <DialogDescription>
              {fullName(selectedShareholder)} ·{" "}
              {selectedShareholder.accountNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-1">
            {/* Why this is being removed / current caution context */}
            <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px] text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                This account is currently <strong>cautioned</strong>. Removing
                the caution lifts the restriction, but — like any KYC change — it
                must be approved before it takes effect.
              </span>
            </div>

            {selectedShareholder.cautionReason && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="mrpsl-section-title">Current Caution Reason</div>
                <p className="text-[13px] mt-0.5">
                  {selectedShareholder.cautionReason}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="mrpsl-label">
                Reason for Removal{" "}
                <span className="font-normal text-muted-foreground">
                  (required)
                </span>
              </label>
              <Textarea
                className="mrpsl-input text-sm"
                placeholder="e.g. Compliance review cleared the account; caution no longer applies…"
                value={reason}
                rows={4}
                onChange={(e) => {
                  setReason(e.target.value);
                  setShowHint(false);
                }}
              />
              {showHint && (
                <p className="text-[12px] text-amber-600">
                  A reason is required to remove the caution.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetAndClose}>
              Keep Caution
            </Button>
            <Button onClick={handleSubmit} disabled={removeMutation.isPending}>
              {removeMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
