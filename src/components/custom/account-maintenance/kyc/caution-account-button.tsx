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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useGetAllCautionReasons } from "@/hooks/useCautionReasons";
import { ShareholderAccount } from "@/types/account-maintenance";
import {
  InlineEvidenceDropper,
  DoneEvidence,
} from "@/components/custom/account-maintenance/inline-evidence-dropper";
import { fullName } from "@/lib/utils/shareholder";
import { Textarea } from "@/components/ui/textarea";

interface CautionAccountButtonProps {
  selectedShareholder: ShareholderAccount;
  onFieldSubmit: (
    accountNumber: string,
    changeType: string,
    field: string,
    newValue: string,
    reason: string,
    evidence: { name: string; url: string }[],
  ) => Promise<void>;
}

export function CautionAccountButton({
  selectedShareholder,
  onFieldSubmit,
}: CautionAccountButtonProps) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState<DoneEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { data: cautionReasons, isLoading: reasonsLoading } =
    useGetAllCautionReasons({ enabled: open });
  const activeReasons = (cautionReasons ?? []).filter(
    (r) => r.status === "Active",
  );
  const selectedReason =
    activeReasons.find((r) => r.code === reasonCode) ?? null;

  function resetAndClose() {
    setOpen(false);
    setReasonCode("");
    setNotes("");
    setEvidence([]);
    setShowHint(false);
  }

  async function handleSubmit() {
    if (!selectedReason || !notes.trim() || evidence.length === 0) {
      setShowHint(true);
      return;
    }
    setSubmitting(true);
    try {
      await onFieldSubmit(
        selectedShareholder.accountNumber,
        "CAUTION",
        "cautionReason",
        selectedReason.reason,
        notes.trim(),
        evidence,
      );
      resetAndClose();
    } catch {
      // error toast already handled by the parent's onFieldSubmit
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Caution Account
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}
      >
        <DialogContent className="max-w-md px-4">
          <DialogHeader>
            <DialogTitle>Caution This Account?</DialogTitle>
            <DialogDescription>
              {fullName(selectedShareholder)} ·{" "}
              {selectedShareholder.accountNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-1">
            <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px] text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                This flags the account as cautioned pending approval. Like any
                other KYC change, it goes to the approvals queue before taking
                effect.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Caution Reason</label>
              <Select
                value={reasonCode}
                onValueChange={(v) => {
                  setReasonCode(v || "");
                  setShowHint(false);
                }}
              >
                <SelectTrigger className="mrpsl-input">
                  <SelectValue
                    placeholder={
                      reasonsLoading ? "Loading reasons…" : "Select a reason"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {activeReasons.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.reason}
                      {r.severity && (
                        <span className="text-muted-foreground text-[11px] ml-1.5">
                          · {r.severity}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Additional Notes</label>
              <Textarea
                className="mrpsl-input text-sm"
                placeholder="e.g. Suspicious transfer request flagged by compliance…"
                value={notes}
                rows={4}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setShowHint(false);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Supporting Document</label>
              <InlineEvidenceDropper
                doneEvidence={evidence}
                onDoneEvidenceChange={(ev) => {
                  setEvidence(ev);
                  if (ev.length > 0) setShowHint(false);
                }}
              />
            </div>

            {showHint && (
              <p className="text-[12px] text-amber-600">
                Select a reason, add notes, and attach a supporting document
                before submitting.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && (
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
