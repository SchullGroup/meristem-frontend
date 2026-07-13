"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileDown, CheckSquare, Square, CheckCircle2, Lock, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BatchRecord {
  id: string;
  offerType: "IPO" | "Rights Issue";
  offerName: string;
  accountNo: string;
  holderName: string;
  bankName: string;
  nuban: string;
  refundAmount: number;
  reason: string;
  dateQueued: Date;
}

const PENDING_RECORDS: BatchRecord[] = [
  { id: "r01", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", accountNo: "ACC-00123456", holderName: "Adebayo Oluwaseun", bankName: "Access Bank PLC", nuban: "0123456789", refundAmount: 157_500, reason: "Over-subscription", dateQueued: new Date("2024-09-01") },
  { id: "r03", offerType: "Rights Issue", offerName: "Fidelity Bank PLC Rights Issue 2024", accountNo: "ACC-00345678", holderName: "Emeka Nwachukwu", bankName: "Fidelity Bank PLC", nuban: "0234567891", refundAmount: 92_500, reason: "Over-subscription", dateQueued: new Date("2024-09-02") },
  { id: "r06", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", accountNo: "ACC-00678901", holderName: "Ngozi Eze", bankName: "Guaranty Trust Bank", nuban: "0345678901", refundAmount: 185_000, reason: "Over-subscription", dateQueued: new Date("2024-09-02") },
  { id: "r10", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", accountNo: "ACC-01012345", holderName: "Halima Mohammed", bankName: "Zenith Bank PLC", nuban: "0456789012", refundAmount: 36_513, reason: "Over-subscription", dateQueued: new Date("2024-09-02") },
  { id: "r11", offerType: "IPO", offerName: "Access Holdings PLC IPO 2024", accountNo: "ACC-01123456", holderName: "Chukwuemeka Obasi", bankName: "Access Bank PLC", nuban: "0567890123", refundAmount: 150_000, reason: "Rejected — KYC", dateQueued: new Date("2024-09-03") },
];

function generateRef(id: string) {
  return `REFUND-${id.toUpperCase()}-2024`;
}

export function RefundBatchProcessing() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fileGenerated, setFileGenerated] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());

  const pending = PENDING_RECORDS.filter((r) => !lockedIds.has(r.id));
  const allSelected = pending.length > 0 && pending.every((r) => selected.has(r.id));
  const someSelected = pending.some((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((r) => r.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRecords = PENDING_RECORDS.filter((r) => selected.has(r.id));
  const totalSelected = selectedRecords.reduce((s, r) => s + r.refundAmount, 0);

  const handleGenerate = () => {
    if (selected.size === 0) {
      toast.error("Select at least one record before generating the batch file.");
      return;
    }
    setFileGenerated(true);
    toast.success(`E-Refund file generated for ${selected.size} records (₦${totalSelected.toLocaleString()}).`);
  };

  const handleDispatch = () => {
    setLockedIds((prev) => new Set([...prev, ...selected]));
    setDispatched(true);
    toast.success(`${selected.size} records marked as Dispatched and locked from re-selection.`);
    setSelected(new Set());
    setFileGenerated(false);
  };

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
        Select <strong>Pending</strong> records from the queue, generate the e-refund CSV for Receiving Banks, then mark as Dispatched. Dispatched records are locked until reconciliation confirms or fails them.
      </div>

      {/* Selection summary */}
      {someSelected && (
        <Card className="mrpsl-card p-3 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-semibold">{selected.size} record{selected.size !== 1 ? "s" : ""} selected</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono font-semibold text-primary">₦{totalSelected.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">total refund</span>
            </div>
            <div className="flex items-center gap-2">
              {!fileGenerated && (
                <Button size="sm" onClick={handleGenerate}>
                  <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  Generate E-Refund File
                </Button>
              )}
              {fileGenerated && !dispatched && (
                <Button size="sm" onClick={handleDispatch}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Mark as Dispatched
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setSelected(new Set()); setFileGenerated(false); }}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pending records table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Pending Records — {pending.length} available for batching
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="px-4 py-2.5 w-10">
                  <button onClick={toggleAll} className="flex items-center justify-center">
                    {allSelected
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Offer Type</th>
                <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Account No.</th>
                <th className="text-left px-4 py-2.5 font-medium">Bank</th>
                <th className="text-left px-4 py-2.5 font-medium">NUBAN</th>
                <th className="text-right px-4 py-2.5 font-medium">Refund (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                <th className="text-left px-4 py-2.5 font-medium">Date Queued</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr
                  key={r.id}
                  className={`mrpsl-table-row cursor-pointer ${selected.has(r.id) ? "bg-primary/5" : ""}`}
                  onClick={() => toggle(r.id)}
                >
                  <td className="px-4 py-2.5 w-10">
                    {selected.has(r.id)
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground" />
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={r.offerType === "IPO" ? "bg-blue-100 text-blue-800 border-0" : "bg-violet-100 text-violet-800 border-0"}>
                      {r.offerType}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                  <td className="px-4 py-2.5 text-xs">{r.bankName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.nuban}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">₦{r.refundAmount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.reason}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{format(r.dateQueued, "dd MMM yyyy")}</td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No pending records. All eligible records have been dispatched.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generated file preview */}
      {fileGenerated && (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                E-Refund File Preview — {selectedRecords.length} records
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("Download coming soon")}>
              Download CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="mrpsl-table-header">
                  <th className="text-left px-4 py-2.5 font-medium">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">NUBAN Account No.</th>
                  <th className="text-left px-4 py-2.5 font-medium">Bank Name</th>
                  <th className="text-right px-4 py-2.5 font-medium">Refund Amount (₦)</th>
                  <th className="text-left px-4 py-2.5 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {selectedRecords.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.nuban}</td>
                    <td className="px-4 py-2.5 text-xs">{r.bankName}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">₦{r.refundAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{generateRef(r.id)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/20">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-muted-foreground text-right">
                    TOTAL ({selectedRecords.length} records)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    ₦{totalSelected.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Locked (dispatched) records */}
      {lockedIds.size > 0 && (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Dispatched & Locked — awaiting reconciliation ({lockedIds.size})
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="mrpsl-table-header">
                  <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">Account No.</th>
                  <th className="text-left px-4 py-2.5 font-medium">Bank</th>
                  <th className="text-right px-4 py-2.5 font-medium">Refund (₦)</th>
                  <th className="text-center px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {PENDING_RECORDS.filter((r) => lockedIds.has(r.id)).map((r) => (
                  <tr key={r.id} className="mrpsl-table-row opacity-70">
                    <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                    <td className="px-4 py-2.5 text-xs">{r.bankName}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">₦{r.refundAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-purple-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Dispatched
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
