"use client";

import { Card } from "@/components/ui/card";
import { EditableField } from "@/components/custom/account-maintenance/editable-field";
import { ShareholderAccount, KycChange } from "@/types/account-maintenance";

interface KycContactInfoTabProps {
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

export function KycContactInfoTab({
  selectedShareholder,
  pendingChanges,
  isSubmitting,
  onFieldSubmit,
}: KycContactInfoTabProps) {
  const submit =
    (field: string) =>
    (
      newValue: string,
      reason: string,
      evidence: { name: string; url: string }[],
    ) =>
      onFieldSubmit(
        selectedShareholder.accountNumber,
        "CONTACT",
        field,
        newValue,
        reason,
        evidence,
      );

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
        label="Email Address"
        currentValue={selectedShareholder?.email || "—"}
        fieldKey="email"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "email") ?? null
        }
        onSubmit={submit("email")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Phone 1"
        currentValue={selectedShareholder?.phone || "—"}
        fieldKey="phone"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "phone") ?? null
        }
        onSubmit={submit("phone")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Phone 2"
        currentValue={selectedShareholder?.phone2 || "—"}
        fieldKey="phone2"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "phone2") ?? null
        }
        onSubmit={submit("phone2")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Residential Address"
        currentValue={selectedShareholder?.address || "—"}
        fieldKey="address"
        inputType="textarea"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "address") ?? null
        }
        onSubmit={submit("address")}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Alternative Address"
        currentValue={selectedShareholder?.altAddress || "—"}
        fieldKey="altAddress"
        inputType="textarea"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "altAddress") ?? null
        }
        onSubmit={submit("altAddress")}
        isSubmitting={isSubmitting}
      />
    </Card>
  );
}
