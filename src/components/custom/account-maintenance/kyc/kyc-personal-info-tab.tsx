"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EditableField } from "@/components/custom/account-maintenance/editable-field";
import { ShareholderAccount, KycChange } from "@/types/account-maintenance";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { fullName } from "@/lib/utils/shareholder";

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
    evidence?: { name: string; url: string }[],
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
      evidence?: { name: string; url: string }[],
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
  const [taxSubmitting, setTaxSubmitting] = useState(false);

  const handleTaxToggle = async (checked: boolean) => {
    if (!taxReason.trim()) return;
    setTaxSubmitting(true);
    try {
      await onFieldSubmit(
        selectedShareholder.accountNumber,
        "PERSONAL",
        "noTax",
        String(checked),
        `Tax exempt ${checked ? "enabled" : "disabled"}: ${taxReason.trim()}`,
      );
      setTaxReason("");
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
        <div className="flex items-center gap-3 pt-1">
          <Switch
            checked={selectedShareholder?.noTax ?? false}
            onCheckedChange={(checked) => {
              if (!taxReason.trim()) return;
              handleTaxToggle(checked);
            }}
          />
          <span className="text-sm">
            {selectedShareholder?.noTax ? "Yes" : "No"}
          </span>
        </div>
        <div className="space-y-2">
          <Input
            className="mrpsl-input text-sm"
            placeholder="Reason for tax status change (required)"
            value={taxReason}
            onChange={(e) => setTaxReason(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => handleTaxToggle(!selectedShareholder?.noTax)}
            disabled={!taxReason.trim() || taxSubmitting}
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
