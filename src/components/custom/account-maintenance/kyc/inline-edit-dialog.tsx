"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { MockRow } from "./kyc-bulk-upload";
import {
  DoneEvidence,
  InlineEvidenceDropper,
} from "../inline-evidence-dropper";

// ── Editable field options ──────────────────────────────────────────────────

const EDITABLE_FIELDS = [
  "email",
  "phone",
  "address",
  "bankName",
  "bankAccountNumber",
  "bvn",
  "holderName",
] as const;

const EVIDENCE_REQUIRED_FIELDS: string[] = [
  "bankAccountNumber",
  "bankName",
  "bvn",
];

function isEvidenceRequiredField(field: string): boolean {
  return EVIDENCE_REQUIRED_FIELDS.includes(field);
}

// ── Props ───────────────────────────────────────────────────────────────────

interface InlineEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: MockRow | null;
  onSave: (rowId: number, updated: Partial<MockRow>, reason: string) => void;
  isFieldLocked?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export function InlineEditDialog({
  open,
  onOpenChange,
  row,
  onSave,
  isFieldLocked = false,
}: InlineEditDialogProps) {
  const [editingField, setEditingField] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [editingReason, setEditingReason] = useState("");
  const [editingEvidence, setEditingEvidence] = useState<DoneEvidence[]>([]);

  // Reset form when row changes
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next && row) {
        setEditingField(row.field);
        setEditingValue(row.newValue);
        setEditingReason("");
        setEditingEvidence([]);
      }
      onOpenChange(next);
    },
    [row, onOpenChange],
  );

  const handleSave = () => {
    if (!row || !editingReason.trim()) return;

    onSave(
      row.row,
      {
        field: editingField,
        newValue: editingValue,
      },
      editingReason.trim(),
    );

    onOpenChange(false);
  };

  const fieldRequiresEvidence = isEvidenceRequiredField(editingField);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Row #{row?.row}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {/* Account info (read-only) */}
          {row && (
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Account
                </span>
                <span className="font-mono text-[13px]">
                  {row.accountNumber}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Holder
                </span>
                <span className="font-medium text-[13px]">
                  {row.holderName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Register
                </span>
                <span className="font-mono text-[13px]">
                  {row.registerSymbol}
                </span>
              </div>
            </div>
          )}

          {/* Field selector */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Field</label>
            <Select
              value={editingField}
              onValueChange={(v) => setEditingField(v || "")}
              disabled={isFieldLocked}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITABLE_FIELDS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value input */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">New Value</label>
            <Input
              className="mrpsl-input"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              disabled={isFieldLocked}
              placeholder="Enter corrected value"
            />
          </div>

          {/* Reason (audit trail) */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">
              Reason for Manual Correction{" "}
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              className="resize-none"
              value={editingReason}
              onChange={(e) => setEditingReason(e.target.value)}
              placeholder="e.g. CSV contained typo — corrected from client email"
              rows={2}
            />
          </div>

          {/* Evidence (only for bank-related fields) */}
          {fieldRequiresEvidence && (
            <div className="space-y-1.5">
              <InlineEvidenceDropper
                doneEvidence={editingEvidence}
                onDoneEvidenceChange={setEditingEvidence}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!editingReason.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { EDITABLE_FIELDS, EVIDENCE_REQUIRED_FIELDS, isEvidenceRequiredField };
