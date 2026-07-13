"use client";

import { ArrowRight, ExternalLink, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface BankChange {
  id: string;
  chn: string;
  holderName: string;
  register: string;
  field: "BANK_NAME" | "ACCOUNT_NUMBER" | "BVN";
  oldValue: string;
  newValue: string;
}

const SEED_BANK_CHANGES: BankChange[] = [
  { id: "1", chn: "C0098765AK", holderName: "MICHAEL OBINNA UKPONG",  register: "MTNN",    field: "BANK_NAME",      oldValue: "First Bank of Nigeria",   newValue: "Access Bank PLC"       },
  { id: "2", chn: "C0098765AK", holderName: "MICHAEL OBINNA UKPONG",  register: "MTNN",    field: "ACCOUNT_NUMBER", oldValue: "0123456789",               newValue: "0987654321"             },
  { id: "3", chn: "C0087654BK", holderName: "AMAKA NGOZI OKONKWO",    register: "UBA",     field: "BANK_NAME",      oldValue: "Guaranty Trust Bank",      newValue: "Zenith Bank PLC"       },
  { id: "4", chn: "C0087654BK", holderName: "AMAKA NGOZI OKONKWO",    register: "UBA",     field: "ACCOUNT_NUMBER", oldValue: "0234567890",               newValue: "0876543210"             },
  { id: "5", chn: "C0076543CK", holderName: "IBRAHIM USMAN HASSAN",   register: "UBA",     field: "BVN",            oldValue: "12345678901",              newValue: "22345678901"            },
  { id: "6", chn: "C0065432DK", holderName: "SEUN ADESANYA FATOUMBI", register: "DANGCEM", field: "BANK_NAME",      oldValue: "Stanbic IBTC Bank",        newValue: "United Bank for Africa" },
  { id: "7", chn: "C0054321EK", holderName: "CHIDINMA GRACE OBIORA",  register: "SEPLAT",  field: "ACCOUNT_NUMBER", oldValue: "0456789012",               newValue: "0654321098"             },
];

const FIELD_LABEL: Record<BankChange["field"], string> = {
  BANK_NAME:      "Bank Name",
  ACCOUNT_NUMBER: "Account Number",
  BVN:            "BVN",
};

const FIELD_COLOR: Record<BankChange["field"], string> = {
  BANK_NAME:      "bg-blue-100 text-blue-800",
  ACCOUNT_NUMBER: "bg-purple-100 text-purple-800",
  BVN:            "bg-red-100 text-red-800",
};

// Group by CHN so per-holder rows stay together
const grouped = SEED_BANK_CHANGES.reduce<Record<string, BankChange[]>>((acc, c) => {
  acc[c.chn] = [...(acc[c.chn] ?? []), c];
  return acc;
}, {});
const GROUPED_ENTRIES = Object.entries(grouped);

interface StepReviewBankChangesProps {
  batchRef: string;
  onProceed: () => void;
}

export function StepReviewBankChanges({ batchRef: _batchRef, onProceed }: StepReviewBankChangesProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Review Bank Changes</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The following records have updates to their bank details (BVN, Bank Name, Account Number).
          To view more details, go to the KYC mandate page.
        </p>
      </div>

      {/* Info banner — read-only notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>This screen is read-only.</strong> Bank mandate changes (BVN, Bank Name, Account Number)
          are <em>never</em> auto-applied from a CSCS batch — they have been raised as KYC update requests
          for the normal maker-checker approval workflow.{" "}
          <strong>The only field this pipeline writes directly is the STATE column (Step 2).</strong>
        </p>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{SEED_BANK_CHANGES.length}</span> bank mandate
        change{SEED_BANK_CHANGES.length !== 1 ? "s" : ""} detected across{" "}
        <span className="font-semibold text-foreground">{GROUPED_ENTRIES.length}</span>{" "}
        shareholder{GROUPED_ENTRIES.length !== 1 ? "s" : ""}.
      </p>

      {/* Changes table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">SHAREHOLDER NAME</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">FIELD CHANGED</th>
                <th className="px-4 py-3">OLD VALUE</th>
                <th className="px-4 py-3">NEW VALUE (FROM CSCS)</th>
                <th className="px-4 py-3">KYC STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {GROUPED_ENTRIES.map(([chn, changes]) =>
                changes.map((c, idx) => (
                  <tr key={c.id} className="mrpsl-table-row">
                    {idx === 0 && (
                      <td className="px-4 py-3 font-medium" rowSpan={changes.length}>
                        {c.holderName}
                      </td>
                    )}
                    {idx === 0 && (
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground" rowSpan={changes.length}>
                        {chn}
                      </td>
                    )}
                    {idx === 0 && (
                      <td className="px-4 py-3" rowSpan={changes.length}>
                        <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{c.register}</Badge>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-[12px] ${FIELD_COLOR[c.field]}`}>
                        {FIELD_LABEL[c.field]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground line-through">
                      {c.oldValue}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold text-amber-700">
                      {c.newValue}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800">KYC Pending</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => router.push("/certificates/kyc")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View KYC Mandate
        </Button>
        <Button onClick={onProceed}>
          Proceed to Batch Transactions
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
