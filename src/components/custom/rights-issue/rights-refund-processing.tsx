"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RefundStatus = "RETURN_MONIES_QUEUE" | "NO_REFUND_DUE";

interface RefundRecord {
  id: string;
  accountNo: string;
  holderName: string;
  amountApplied: number;
  amountAllotted: number;
  refundAmount: number;
  reason: "over_subscription" | "cscs_reversal" | "batch_reversal";
  status: RefundStatus;
}

const STATUS_STYLES: Record<RefundStatus, string> = {
  RETURN_MONIES_QUEUE: "bg-purple-100 text-purple-800 border-0",
  NO_REFUND_DUE: "bg-gray-100 text-gray-600 border-0",
};

const STATUS_LABELS: Record<RefundStatus, string> = {
  RETURN_MONIES_QUEUE: "Return Monies Queue",
  NO_REFUND_DUE: "No Refund Due",
};

const REASON_LABELS: Record<RefundRecord["reason"], string> = {
  over_subscription: "Over-subscription",
  cscs_reversal: "CSCS Reversal",
  batch_reversal: "Batch Reversal",
};

const MOCK_REFUNDS: RefundRecord[] = [
  { id: "r1", accountNo: "ACC-00123456", holderName: "Adebayo Oluwaseun", amountApplied: 416_250, amountAllotted: 370_000, refundAmount: 46_250, reason: "over_subscription", status: "RETURN_MONIES_QUEUE" },
  { id: "r2", accountNo: "ACC-00234567", holderName: "Chinwe Okafor-Nwosu", amountApplied: 1_114_625, amountAllotted: 1_000_000, refundAmount: 114_625, reason: "over_subscription", status: "RETURN_MONIES_QUEUE" },
  { id: "r3", accountNo: "ACC-00345678", holderName: "Emeka Nwachukwu", amountApplied: 80_937, amountAllotted: 80_937, refundAmount: 0, reason: "over_subscription", status: "NO_REFUND_DUE" },
  { id: "r4", accountNo: "ACC-00456789", holderName: "Fatima Garba Abubakar", amountApplied: 212_750, amountAllotted: 0, refundAmount: 212_750, reason: "cscs_reversal", status: "RETURN_MONIES_QUEUE" },
  { id: "r5", accountNo: "ACC-00567890", holderName: "Yemi Olatunde-Bello", amountApplied: 141_710, amountAllotted: 120_000, refundAmount: 21_710, reason: "over_subscription", status: "RETURN_MONIES_QUEUE" },
  { id: "r6", accountNo: "ACC-00678901", holderName: "Ngozi Eze", amountApplied: 577_200, amountAllotted: 500_000, refundAmount: 77_200, reason: "over_subscription", status: "RETURN_MONIES_QUEUE" },
];

export function RightsRefundProcessing() {
  const [records] = useState<RefundRecord[]>(MOCK_REFUNDS);

  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Rights Issue Refund Queue — Fidelity Bank PLC Rights Issue 2024
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="mrpsl-table-header">
              <th className="text-left px-4 py-2.5 font-medium">Account No</th>
              <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
              <th className="text-right px-4 py-2.5 font-medium">Amount Applied</th>
              <th className="text-right px-4 py-2.5 font-medium">Amount Allotted</th>
              <th className="text-right px-4 py-2.5 font-medium">Refund Amount</th>
              <th className="text-left px-4 py-2.5 font-medium">Reason</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="mrpsl-table-row">
                <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                <td className="px-4 py-2.5 text-right font-mono">₦{r.amountApplied.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right font-mono">₦{r.amountAllotted.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                  {r.refundAmount > 0 ? `₦${r.refundAmount.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{REASON_LABELS[r.reason]}</td>
                <td className="px-4 py-2.5">
                  <Badge className={`text-[11px] ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
