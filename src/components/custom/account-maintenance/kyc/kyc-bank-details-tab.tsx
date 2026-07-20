"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableField } from "@/components/custom/account-maintenance/editable-field";
import { ShareholderAccount, KycChange } from "@/types/account-maintenance";
import { Agent } from "@/actions/agentAction";

// ── Types ───────────────────────────────────────────────────────────────────
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
    evidence: { name: string; url: string }[],
  ) => Promise<void>;
}

type ValStatus = "idle" | "valid" | "error";

// ── Component ───────────────────────────────────────────────────────────────
export function KycBankDetailsTab({
  selectedShareholder,
  pendingChanges,
  isSubmitting,
  bankList,
  onFieldSubmit,
}: KycBankDetailsTabProps) {
  const submit =
    (field: string) =>
    (
      newValue: string,
      reason: string,
      evidence: { name: string; url: string }[],
    ) =>
      onFieldSubmit(
        selectedShareholder.accountNumber,
        "BANK",
        field,
        newValue,
        reason,
        evidence,
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
            Processing. Verify all details carefully before submitting.
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
          onSubmit={submit("bankName")}
          isSubmitting={isSubmitting}
        />

        <AcctValidationField
          fieldKey="bankAccountNumber"
          label="Account Number"
          currentValue={selectedShareholder?.bankAccountNumber || "—"}
          pendingChange={
            pendingChanges.find(
              (c) => c.fieldChanged === "bankAccountNumber",
            ) ?? null
          }
          maxDigits={10}
          submit={submit("bankAccountNumber")}
          isSubmitting={isSubmitting}
        />

        <AcctValidationField
          fieldKey="bvn"
          label="BVN"
          currentValue={
            selectedShareholder?.bvn
              ? `***${selectedShareholder.bvn.slice(-4)}`
              : "—"
          }
          pendingChange={
            pendingChanges.find((c) => c.fieldChanged === "bvn") ?? null
          }
          maxDigits={11}
          submit={submit("bvn")}
          isSubmitting={isSubmitting}
        />
      </Card>
    </>
  );
}

// ── Sub-component: wraps EditableField with local digit-count validation ────
function AcctValidationField({
  fieldKey,
  label,
  currentValue,
  pendingChange,
  maxDigits,
  submit,
  isSubmitting,
}: {
  fieldKey: string;
  label: string;
  currentValue: string;
  pendingChange: KycChange | null;
  maxDigits: number;
  submit: (
    nv: string,
    r: string,
    ev: { name: string; url: string }[],
  ) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [status, setStatus] = useState<ValStatus>("idle");

  const wrappedSubmit = useCallback(
    (nv: string, r: string, ev: { name: string; url: string }[]) => {
      const digits = nv.replace(/\D/g, "");
      if (!digits) setStatus("idle");
      else if (digits.length > maxDigits) setStatus("error");
      else if (digits.length === maxDigits) setStatus("valid");
      else setStatus("idle");
      return submit(nv, r, ev);
    },
    [submit, maxDigits],
  );

  return (
    <EditableField
      label={label}
      currentValue={currentValue}
      fieldKey={fieldKey}
      pendingChange={pendingChange}
      onSubmit={wrappedSubmit}
      isSubmitting={isSubmitting}
    >
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px]",
            status === "valid" ? "text-green-700" : "text-destructive",
          )}
        >
          {status === "valid" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Valid format
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" /> Too many digits
            </>
          )}
        </div>
      )}
    </EditableField>
  );
}
