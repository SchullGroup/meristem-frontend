"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableField } from "@/components/custom/account-maintenance/editable-field";
import { MultiDocUpload } from "@/components/custom/multi-doc-upload";
import { ShareholderAccount, KycChange } from "@/types/account-maintenance";
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
  ) => void;
  onSupportingDocsChange: (docs: { name: string; url: string }[]) => void;
}

export function KycPersonalInfoTab({
  selectedShareholder,
  pendingChanges,
  isSubmitting,
  onFieldSubmit,
  onSupportingDocsChange,
}: KycPersonalInfoTabProps) {
  const [nameChangeType, setNameChangeType] = useState("");

  const submit = (field: string, newValue: string, reason: string) =>
    onFieldSubmit(
      selectedShareholder.accountNumber,
      "PERSONAL",
      field,
      newValue,
      reason,
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
        label="Shareholder Name"
        currentValue={fullName(selectedShareholder)}
        fieldKey="holderName"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "holderName") ?? null
        }
        extraInput={
          <div className="flex gap-2 mb-2">
            <Select
              value={nameChangeType}
              onValueChange={(v) => setNameChangeType(v || "")}
            >
              <SelectTrigger className="w-32 h-8 text-[13px]">
                <SelectValue placeholder="Change type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spell">Correction</SelectItem>
                <SelectItem value="change">Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        onSubmit={(newValue, reason) =>
          submit(
            "holderName",
            newValue,
            `${nameChangeType || "change"}: ${reason}`,
          )
        }
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
        onSubmit={(newValue, reason) => submit("holderType", newValue, reason)}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Date of Birth"
        currentValue={formatDate(selectedShareholder?.dob)}
        fieldKey="dob"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "dob") ?? null
        }
        onSubmit={(newValue, reason) => submit("dob", newValue, reason)}
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
        onSubmit={(newValue, reason) => submit("gender", newValue, reason)}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="Nationality"
        currentValue={selectedShareholder?.nationality || "—"}
        fieldKey="nationality"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "nationality") ?? null
        }
        onSubmit={(newValue, reason) => submit("nationality", newValue, reason)}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="State"
        currentValue={selectedShareholder?.state || "—"}
        fieldKey="state"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "state") ?? null
        }
        onSubmit={(newValue, reason) => submit("state", newValue, reason)}
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
        onSubmit={(newValue, reason) => submit("nin", newValue, reason)}
        isSubmitting={isSubmitting}
      />

      <EditableField
        label="TIN"
        currentValue={selectedShareholder?.tin || "—"}
        fieldKey="tin"
        pendingChange={
          pendingChanges.find((c) => c.fieldChanged === "tin") ?? null
        }
        onSubmit={(newValue, reason) => submit("tin", newValue, reason)}
        isSubmitting={isSubmitting}
      />

      <div className="mt-6">
        <MultiDocUpload onChange={onSupportingDocsChange} />
      </div>
    </Card>
  );
}
