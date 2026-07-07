"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { EditableField } from "@/components/custom/account-maintenance/editable-field";
import { ShareholderAccount, KycChange } from "@/types/account-maintenance";
import { Agent } from "@/actions/agentAction";

interface KycBankDetailsTabProps {
  selectedShareholder: ShareholderAccount;
  pendingChanges: KycChange[];
  isSubmitting: boolean;
  bankList: Agent[];
  onFieldSubmit: (
    accountNumber: string,
    changeType: string,
    field: string,
    newValue: string,
    reason: string,
  ) => void;
}

export function KycBankDetailsTab({
  selectedShareholder,
  pendingChanges,
  isSubmitting,
  bankList,
  onFieldSubmit,
}: KycBankDetailsTabProps) {
  const submit = (field: string, newValue: string, reason: string) =>
    onFieldSubmit(
      selectedShareholder.accountNumber,
      "BANK",
      field,
      newValue,
      reason,
    );

  return (
    <>
      <div className="border border-amber-300 bg-amber-50 rounded-xl p-4 flex gap-3 mb-6">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            High-Risk Change — Bank Details
          </p>
          <p className="text-[13px] text-amber-700 mt-0.5">
            Updating bank details will automatically queue all outstanding
            dividend warrants for this account in New Mandate Payment
            Processing. Please verify all details carefully before submitting.
          </p>
        </div>
      </div>

      <Card className="mrpsl-card p-6 space-y-1">
        <div className="grid grid-cols-[200px_1fr_1fr] gap-6 font-semibold text-sm border-b pb-2 mb-2">
          <div className="text-muted-foreground uppercase text-[13px]">
            Field
          </div>
          <div className="text-muted-foreground uppercase text-[13px]">
            Current Value
          </div>
          <div className="text-primary uppercase text-[13px]">New Value</div>
        </div>

        <EditableField
          label="Bank Name"
          currentValue={selectedShareholder?.bankName || "—"}
          fieldKey="bankName"
          inputType="select"
          selectOptions={bankList.map((b) => ({
            value: b.name,
            label: `${b.name} · ${b.code}`,
          }))}
          pendingChange={
            pendingChanges.find((c) => c.fieldChanged === "bankName") ?? null
          }
          onSubmit={(newValue, reason) => submit("bankName", newValue, reason)}
          isSubmitting={isSubmitting}
        />

        <EditableField
          label="Account Number"
          currentValue={selectedShareholder?.bankAccountNumber || "—"}
          fieldKey="bankAccountNumber"
          pendingChange={
            pendingChanges.find(
              (c) => c.fieldChanged === "bankAccountNumber",
            ) ?? null
          }
          onSubmit={(newValue, reason) =>
            submit("bankAccountNumber", newValue, reason)
          }
          isSubmitting={isSubmitting}
        />

        <EditableField
          label="BVN"
          currentValue={
            selectedShareholder?.bvn
              ? `***${selectedShareholder.bvn.slice(-4)}`
              : "—"
          }
          fieldKey="bvn"
          pendingChange={
            pendingChanges.find((c) => c.fieldChanged === "bvn") ?? null
          }
          onSubmit={(newValue, reason) => submit("bvn", newValue, reason)}
          isSubmitting={isSubmitting}
        />
      </Card>
    </>
  );
}
