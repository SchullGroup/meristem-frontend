"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RefundStatus = "RETURN_MONIES_QUEUE" | "NO_REFUND_DUE";

interface RefundRecord {
  id: string;
  accountNo: string;
  holderName: string;
  unitsPurchasedBasic: number;
  unitsPurchasedAdditional: number;
  unitsAllotted: number;
  refundAmount: number;
  category: "over_subscription" | "cscs_reversal" | "batch_reversal";
  refundNote: string;
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

const CATEGORY_LABELS: Record<RefundRecord["category"], string> = {
  over_subscription: "Over-subscription",
  cscs_reversal: "CSCS Reversal",
  batch_reversal: "Batch Reversal",
};

const MOCK_REFUNDS: RefundRecord[] = [
  {
    id: "r1",
    accountNo: "ACC-00123456",
    holderName: "Adebayo Oluwaseun",
    unitsPurchasedBasic: 40_000,
    unitsPurchasedAdditional: 5_000,
    unitsAllotted: 40_000,
    refundAmount: 46_250,
    category: "over_subscription",
    refundNote: "",
    status: "RETURN_MONIES_QUEUE",
  },
  {
    id: "r2",
    accountNo: "ACC-00234567",
    holderName: "Chinwe Okafor-Nwosu",
    unitsPurchasedBasic: 100_000,
    unitsPurchasedAdditional: 20_000,
    unitsAllotted: 108_000,
    refundAmount: 114_625,
    category: "over_subscription",
    refundNote: "",
    status: "RETURN_MONIES_QUEUE",
  },
  {
    id: "r3",
    accountNo: "ACC-00345678",
    holderName: "Emeka Nwachukwu",
    unitsPurchasedBasic: 8_000,
    unitsPurchasedAdditional: 750,
    unitsAllotted: 8_750,
    refundAmount: 0,
    category: "over_subscription",
    refundNote: "",
    status: "NO_REFUND_DUE",
  },
  {
    id: "r4",
    accountNo: "ACC-00456789",
    holderName: "Fatima Garba Abubakar",
    unitsPurchasedBasic: 20_000,
    unitsPurchasedAdditional: 3_000,
    unitsAllotted: 0,
    refundAmount: 212_750,
    category: "cscs_reversal",
    refundNote: "",
    status: "RETURN_MONIES_QUEUE",
  },
  {
    id: "r5",
    accountNo: "ACC-00567890",
    holderName: "Yemi Olatunde-Bello",
    unitsPurchasedBasic: 13_000,
    unitsPurchasedAdditional: 2_320,
    unitsAllotted: 13_000,
    refundAmount: 21_710,
    category: "over_subscription",
    refundNote: "",
    status: "RETURN_MONIES_QUEUE",
  },
  {
    id: "r6",
    accountNo: "ACC-00678901",
    holderName: "Ngozi Eze",
    unitsPurchasedBasic: 55_000,
    unitsPurchasedAdditional: 7_400,
    unitsAllotted: 55_000,
    refundAmount: 77_200,
    category: "over_subscription",
    refundNote: "",
    status: "RETURN_MONIES_QUEUE",
  },
];

export function RightsRefundProcessing() {
  const [records, setRecords] = useState<RefundRecord[]>(MOCK_REFUNDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const startEdit = (id: string, currentNote: string) => {
    setEditingId(id);
    setDraftNote(currentNote);
  };

  const saveNote = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, refundNote: draftNote } : r));
    setEditingId(null);
    setDraftNote("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftNote("");
  };

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
              <th className="text-right px-4 py-2.5 font-medium">Units Purchased</th>
              <th className="text-right px-4 py-2.5 font-medium">Units Allotted</th>
              <th className="text-right px-4 py-2.5 font-medium">Unallotted Units</th>
              <th className="text-right px-4 py-2.5 font-medium">Refund Amount</th>
              <th className="text-left px-4 py-2.5 font-medium min-w-55">Reason</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const totalPurchased = r.unitsPurchasedBasic + r.unitsPurchasedAdditional;
              const unallotted = totalPurchased - r.unitsAllotted;
              return (
                <tr key={r.id} className="mrpsl-table-row align-top">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                  <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    <span>{totalPurchased.toLocaleString()}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                      {r.unitsPurchasedBasic.toLocaleString()} basic
                      {r.unitsPurchasedAdditional > 0 && ` + ${r.unitsPurchasedAdditional.toLocaleString()} additional`}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.unitsAllotted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {unallotted > 0
                      ? <span className="text-amber-700 font-semibold">{unallotted.toLocaleString()}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                    {r.refundAmount > 0 ? `₦${r.refundAmount.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-muted text-muted-foreground border-0 text-[10px] mb-1.5">
                      {CATEGORY_LABELS[r.category]}
                    </Badge>
                    {editingId === r.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={draftNote}
                          onChange={e => setDraftNote(e.target.value)}
                          placeholder="Add reason note…"
                          className="w-full text-xs bg-transparent border border-border rounded-md px-2 py-1 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => saveNote(r.id)}
                            className="text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-h-6">
                        <span className="text-xs text-foreground">
                          {r.refundNote || <span className="text-muted-foreground/50 italic">No note</span>}
                        </span>
                        <button
                          onClick={() => startEdit(r.id, r.refundNote)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                        >
                          {r.refundNote
                            ? <Pencil className="h-3 w-3" />
                            : <Plus className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={`text-[11px] ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
