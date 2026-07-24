"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Undo2, X } from "lucide-react";
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
import type { ReversalType } from "@/types/dividend-reversal-flow";
import { useCreateReversalRequest } from "@/hooks/useDividendReversalFlow";
import { formatNaira } from "./helpers";

export interface ReversalContext {
  holderName: string;
  registerSymbol: string;
  accountNumber: string;
  dividendNumber: string;
  amount: number;
  rowStatus: string;
  sourceHolderId?: string;
}

const TYPE_NOTES: Record<ReversalType, string> = {
  TYPE_A:
    "For a dividend already marked Paid that later failed / was returned. It will be flipped back to Unpaid for re-processing.",
  TYPE_B:
    "For a dividend that should not be processed (business decision). It will be excluded from the payment pipeline; it was never paid.",
};

// Reversal Request modal (§2) — launched from the Enquiry Dividend Statement.
export function ReversalRequestModal({
  context,
  open,
  onOpenChange,
}: {
  context: ReversalContext | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currentUser } = useStore();
  const createMutation = useCreateReversalRequest();
  const fileRef = useRef<HTMLInputElement>(null);

  // Default the type from the row status, but keep it editable (§2).
  const defaultType: ReversalType =
    context?.rowStatus?.toUpperCase() === "PAID" ? "TYPE_A" : "TYPE_B";

  const [type, setType] = useState<ReversalType>(defaultType);
  const [reason, setReason] = useState("");
  const [docName, setDocName] = useState<string | undefined>(undefined);
  const [reasonError, setReasonError] = useState(false);

  // Re-seed defaults when the modal opens for a new row.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = open
    ? `${context?.accountNumber ?? ""}-${context?.dividendNumber ?? ""}`
    : null;
  if (open && key !== loadedKey) {
    setLoadedKey(key);
    setType(defaultType);
    setReason("");
    setDocName(undefined);
    setReasonError(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setDocName(file.name);
  }

  function submit() {
    if (!context) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    createMutation.mutate(
      {
        holderName: context.holderName,
        registerSymbol: context.registerSymbol,
        accountNumber: context.accountNumber,
        dividendNumber: context.dividendNumber,
        amount: context.amount,
        reversalType: type,
        reason: reason.trim(),
        supportingDocName: docName,
        requestedBy: currentUser.email,
        sourceHolderId: context.sourceHolderId,
      },
      {
        onSuccess: (req) => {
          toast.success(
            `Reversal request ${req.id} submitted for HOP approval.`,
          );
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to submit reversal request."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-4 w-4" /> Reverse Dividend
          </DialogTitle>
          <DialogDescription>
            Submit a reversal request for HOP approval. Every request is logged
            to the audit history.
          </DialogDescription>
        </DialogHeader>

        {context && (
          <div className="space-y-5">
            {/* Read-only context */}
            <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4 border border-border/60 text-sm">
              <Ctx label="Holder" value={context.holderName} />
              <Ctx label="Register" value={context.registerSymbol} />
              <Ctx label="Account No" value={context.accountNumber} mono />
              <Ctx label="Dividend No" value={context.dividendNumber} mono />
              <Ctx label="Amount" value={formatNaira(context.amount)} />
              <Ctx label="Current Status" value={context.rowStatus} />
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <label className="mrpsl-label">Reversal Type</label>
              <div className="grid gap-2">
                {(["TYPE_A", "TYPE_B"] as ReversalType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      type === t
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                          type === t
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40"
                        }`}
                      />
                      <span className="text-sm font-semibold">
                        {t === "TYPE_A"
                          ? "Type A — Reverse Paid Dividend"
                          : "Type B — Reverse / Exclude Mandate Processing"}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1 pl-6">
                      {TYPE_NOTES[t]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="mrpsl-label">
                Reason for Reversal{" "}
                <span className="font-normal text-muted-foreground">
                  (required)
                </span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setReasonError(false);
                }}
                placeholder="Explain why this dividend is being reversed…"
                className={`resize-none ${reasonError ? "border-red-500" : ""}`}
                rows={3}
              />
              {reasonError && (
                <p className="text-[12px] text-red-600">
                  A reason is required.
                </p>
              )}
            </div>

            {/* Supporting document */}
            <div className="space-y-2">
              <label className="mrpsl-label">
                Supporting Document{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              {docName ? (
                <div className="inline-flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 bg-background">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{docName}</span>
                  <button
                    onClick={() => {
                      setDocName(undefined);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" /> Attach document
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFile}
              />
              <p className="text-[12px] text-muted-foreground">
                e.g. NIBSS confirmation report, bank statement excerpt, or an
                internal memo for a Type B business decision.
              </p>
            </div>

            <div className="flex gap-3 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={submit}
                disabled={createMutation.isPending}
              >
                <Undo2 className="h-4 w-4" /> Submit Reversal Request
                {createMutation.isPending && (
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

function Ctx({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mrpsl-section-title">{label}</div>
      <div className={`font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
