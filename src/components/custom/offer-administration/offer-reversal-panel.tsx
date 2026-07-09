"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, Loader2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface OfferReversalPanelProps {
  offerType: "ipo" | "rights" | "bonus";
  offerName: string;
  totalUnitsAllotted: number;
  totalRefundValue?: number;
}

export function OfferReversalPanel({
  offerType,
  offerName,
  totalUnitsAllotted,
  totalRefundValue,
}: OfferReversalPanelProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [reversed, setReversed] = useState(false);

  const reasonValid = reason.trim().length >= 20;
  const canReverse = reasonValid && confirmed;

  const refundDestination =
    offerType === "ipo"
      ? "Return Money queue"
      : offerType === "rights"
      ? "Rights Refund Processing queue"
      : null;

  const bonusNote =
    "This will reverse all bonus share credits. No refund is triggered — bonus shares are issued at no cost.";

  const modalWarning =
    offerType === "bonus"
      ? bonusNote
      : `This will reverse ${totalUnitsAllotted.toLocaleString()} confirmed allotments${
          totalRefundValue != null
            ? ` and route ₦${totalRefundValue.toLocaleString()} to the ${refundDestination}`
            : ""
        }. This cannot be undone without a fresh offer.`;

  const handleReverse = async () => {
    setReversing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setReversing(false);
    setReversed(true);
    setOpen(false);
    toast.success(
      offerType === "bonus"
        ? `Batch reversal complete. ${totalUnitsAllotted.toLocaleString()} bonus share credits zeroed out. ICU and Head of Operations notified.`
        : `Batch reversal complete. ${totalUnitsAllotted.toLocaleString()} allotments reversed.${
            refundDestination ? ` Refund value routed to ${refundDestination}.` : ""
          } ICU and Head of Operations notified.`,
    );
  };

  if (reversed) {
    return (
      <Card className="mrpsl-card p-8 flex flex-col items-center gap-4 text-center border-l-4 border-l-destructive">
        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <RotateCcw className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-lg text-destructive">Batch Reversed</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {offerName} has been fully reversed. All allotment results have been zeroed out.
            {refundDestination && ` Refund value is now visible in the ${refundDestination}.`}
          </p>
        </div>
        <Badge className="bg-destructive/10 text-destructive border-0 text-sm px-4 py-1.5">
          REVERSED
        </Badge>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Permission warning */}
        <Card className="mrpsl-card p-4 border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">Elevated Permission Required</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action reverses an entire approved batch. It requires the{" "}
                <span className="font-mono">
                  offer_administration.{offerType}_reversal.approve
                </span>{" "}
                permission and is only available to ICU and Head of Operations roles.
              </p>
            </div>
          </div>
        </Card>

        {/* Offer summary */}
        <Card className="mrpsl-card p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Offer Summary
          </p>
          <div className={`grid gap-4 text-sm ${totalRefundValue != null ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <p className="mrpsl-label">Offer</p>
              <p className="font-semibold mt-0.5">{offerName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Total Units {offerType === "bonus" ? "Credited" : "Allotted"}</p>
              <p className="font-mono font-bold text-lg mt-0.5">{totalUnitsAllotted.toLocaleString()}</p>
            </div>
            {totalRefundValue != null && (
              <div>
                <p className="mrpsl-label">Refund Value (if reversed)</p>
                <p className="font-mono font-bold text-lg mt-0.5 text-destructive">
                  ₦{totalRefundValue.toLocaleString()}
                </p>
              </div>
            )}
          </div>
          {offerType !== "bonus" && refundDestination && (
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              On reversal, the full refund value routes to the{" "}
              <span className="font-semibold">{refundDestination}</span>, tagged as{" "}
              <span className="font-mono">batch_reversal</span>.
            </p>
          )}
          {offerType === "bonus" && (
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              Bonus shares are issued at no cost — reversal zeroes out credits and corrects the
              register's stock-in-issue. No refund is triggered.
            </p>
          )}
        </Card>

        {/* Reverse button */}
        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reverse This Batch
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Batch Reversal
            </DialogTitle>
            <DialogDescription>
              This action is irreversible without restarting the full offer lifecycle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
              {modalWarning}
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">
                Reason for reversal * (minimum 20 characters)
              </label>
              <Textarea
                className="mrpsl-input resize-none"
                rows={3}
                placeholder="State the full reason for reversing this batch…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {reason.length > 0 && !reasonValid && (
                <p className="text-xs text-destructive">
                  {20 - reason.trim().length} more characters required.
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-muted-foreground">
                I understand this will reverse{" "}
                <span className="font-semibold text-foreground">
                  {totalUnitsAllotted.toLocaleString()}
                </span>{" "}
                confirmed{" "}
                {offerType === "bonus" ? "bonus share credits" : "allotments"} and cannot be
                undone without a fresh offer.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={reversing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!canReverse || reversing}
                onClick={handleReverse}
              >
                {reversing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reversing…</>
                ) : (
                  <><RotateCcw className="h-4 w-4 mr-2" /> Confirm Reversal</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
