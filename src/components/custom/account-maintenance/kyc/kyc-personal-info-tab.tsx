"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EditableField } from "@/components/custom/account-maintenance/editable-field";
import { ShareholderAccount, KycChange } from "@/types/account-maintenance";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { fullName } from "@/lib/utils/shareholder";
import {
  InlineEvidenceDropper,
  DoneEvidence,
} from "@/components/custom/account-maintenance/inline-evidence-dropper";

interface KycPersonalInfoTabProps {
  selectedShareholder: ShareholderAccount;
  pendingChanges: KycChange[];
  isSubmitting: boolean;
  onFieldSubmit: (
    accountNumber: string,
    changeType: string,
    field: string,
    newValue: string,
    reason: string,
    evidence: { name: string; url: string }[],
  ) => Promise<void>;
}

export function KycPersonalInfoTab({
  selectedShareholder,
  pendingChanges,
  isSubmitting,
  onFieldSubmit,
}: KycPersonalInfoTabProps) {
  const submit =
    (field: string) =>
    (
      newValue: string,
      reason: string,
      evidence: { name: string; url: string }[],
    ) =>
      onFieldSubmit(
        selectedShareholder.accountNumber,
        "PERSONAL",
        field,
        newValue,
        reason,
        evidence,
      );

  // ── Tax Exempt toggle ──────────────────────────────────────────────────
  const [taxReason, setTaxReason] = useState("");
  const [taxEvidence, setTaxEvidence] = useState<DoneEvidence[]>([]);
  const [taxSubmitting, setTaxSubmitting] = useState(false);
  const [taxHint, setTaxHint] = useState(false);
  const [taxChecked, setTaxChecked] = useState(
    () => selectedShareholder?.noTax ?? false,
  );

  const handleTaxToggle = (checked: boolean) => {
    setTaxChecked(checked);
    if (!taxReason.trim() || taxEvidence.length === 0) {
      setTaxHint(true);
      return;
    }
    handleTaxSubmit(checked);
  };

  const handleTaxSubmit = async (checked: boolean) => {
    setTaxHint(false);
    setTaxSubmitting(true);
    try {
      await onFieldSubmit(
        selectedShareholder.accountNumber,
        "PERSONAL",
        "noTax",
        String(checked),
        `Tax exempt ${checked ? "enabled" : "disabled"}: ${taxReason.trim()}`,
        taxEvidence,
      );
      setTaxReason("");
      setTaxEvidence([]);
    } catch {
      // error toast by parent
    } finally {
      setTaxSubmitting(false);
    }
  };

  return (
    <Card className="mrpsl-card p-6 space-y-1">
      <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2 mb-2">
        <div className="text-muted-foreground uppercase text-[13px]">Field</div>
        <div className="text-muted-foreground uppercase text-[13px]">
          Current Value
        </div>
        <div className="text-primary uppercase text-[13px]">New Value</div>
      </div>

      <EditableField
        label="Shareholder Name"
        currentValue={fullName(selectedShareholder)}
        fieldKey="holderName"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "holderName") ?? null
        }
        onSubmit={submit("holderName")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Holder Type"
        currentValue={selectedShareholder?.holderType || "—"}
        fieldKey="holderType"
        inputType="select"
        selectOptions={[
          { value: "INDIVIDUAL", label: "INDIVIDUAL" },
          { value: "CORPORATE", label: "CORPORATE" },
          { value: "JOINT", label: "JOINT" },
        ]}
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "holderType") ?? null
        }
        onSubmit={submit("holderType")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Date of Birth"
        currentValue={formatDate(selectedShareholder?.dob)}
        fieldKey="dob"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "dob") ?? null
        }
        onSubmit={submit("dob")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Gender"
        currentValue={selectedShareholder?.gender || "—"}
        fieldKey="gender"
        inputType="select"
        selectOptions={[
          { value: "MALE", label: "Male" },
          { value: "FEMALE", label: "Female" },
        ]}
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "gender") ?? null
        }
        onSubmit={submit("gender")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Nationality"
        currentValue={selectedShareholder?.nationality || "—"}
        fieldKey="nationality"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "nationality") ?? null
        }
        onSubmit={submit("nationality")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="State"
        currentValue={selectedShareholder?.state || "—"}
        fieldKey="state"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "state") ?? null
        }
        onSubmit={submit("state")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label={
          selectedShareholder?.holderType === "CORPORATE" ? "RC Number" : "NIN"
        }
        currentValue={selectedShareholder?.nin || "—"}
        fieldKey="nin"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "nin") ?? null
        }
        onSubmit={submit("nin")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="RG Account Number"
        currentValue={selectedShareholder?.rgAccountNumber || "—"}
        fieldKey="rgAccountNumber"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "rgAccountNumber") ??
          null
        }
        onSubmit={submit("rgAccountNumber")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="TIN"
        currentValue={selectedShareholder?.tin || "—"}
        fieldKey="tin"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "tin") ?? null
        }
        onSubmit={submit("tin")}
        isSubmitting={isSubmitting}
      />

      {/* ── Tax Exempt ── */}
      <div className="grid grid-cols-[200px_1fr_1fr] gap-6 items-start py-3 border-b border-border/20">
        <span className="text-sm font-medium text-muted-foreground pt-1">
          Tax Exempt
        </span>
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-3">
            <Checkbox
              id="tax-exempt-cb"
              checked={taxChecked}
              onCheckedChange={(c) => handleTaxToggle(!!c)}
            />
            <label
              htmlFor="tax-exempt-cb"
              className="text-sm cursor-pointer select-none"
            >
              {taxChecked ? "Yes" : "No"}
            </label>
          </div>
          {taxHint && (
            <p className="text-[12px] text-amber-600 animate-in fade-in">
              Fill in the reason and attach evidence, then click Submit for
              approval.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Input
            className="mrpsl-input text-sm"
            placeholder="e.g. Pension fund exemption, diplomatic status…"
            value={taxReason}
            onChange={(e) => {
              setTaxReason(e.target.value);
              setTaxHint(false);
            }}
          />
          <InlineEvidenceDropper
            doneEvidence={taxEvidence}
            onDoneEvidenceChange={(ev) => {
              setTaxEvidence(ev);
              if (ev.length > 0) setTaxHint(false);
            }}
          />
          <Button
            size="sm"
            onClick={() => handleTaxSubmit(taxChecked)}
            disabled={
              !taxReason.trim() || taxEvidence.length === 0 || taxSubmitting
            }
            className="h-7 text-[12px]"
          >
            {taxSubmitting && (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            )}
            Submit for approval
          </Button>
        </div>
      </div>
    </Card>
  );
}
