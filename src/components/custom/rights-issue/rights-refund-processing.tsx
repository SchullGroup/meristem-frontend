"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Loader2, FileDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadStagingCard, type UploadResult } from "@/components/custom/offer-administration/upload-staging-card";
import { toast } from "sonner";

type RefundStatus = "PENDING" | "BATCHED" | "DISPATCHED" | "CONFIRMED" | "FAILED";

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
  PENDING: "bg-amber-100 text-amber-800 border-0",
  BATCHED: "bg-blue-100 text-blue-800 border-0",
  DISPATCHED: "bg-purple-100 text-purple-800 border-0",
  CONFIRMED: "bg-green-100 text-green-800 border-0",
  FAILED: "bg-red-100 text-red-800 border-0",
};

const REASON_LABELS: Record<RefundRecord["reason"], string> = {
  over_subscription: "Over-subscription",
  cscs_reversal: "CSCS Reversal",
  batch_reversal: "Batch Reversal",
};

const MOCK_REFUNDS: RefundRecord[] = [
  { id: "r1", accountNo: "ACC-00123456", holderName: "Adebayo Oluwaseun", amountApplied: 416_250, amountAllotted: 370_000, refundAmount: 46_250, reason: "over_subscription", status: "PENDING" },
  { id: "r2", accountNo: "ACC-00234567", holderName: "Chinwe Okafor-Nwosu", amountApplied: 1_114_625, amountAllotted: 1_000_000, refundAmount: 114_625, reason: "over_subscription", status: "PENDING" },
  { id: "r3", accountNo: "ACC-00345678", holderName: "Emeka Nwachukwu", amountApplied: 80_937, amountAllotted: 80_937, refundAmount: 0, reason: "over_subscription", status: "CONFIRMED" },
  { id: "r4", accountNo: "ACC-00456789", holderName: "Fatima Garba Abubakar", amountApplied: 212_750, amountAllotted: 0, refundAmount: 212_750, reason: "cscs_reversal", status: "PENDING" },
  { id: "r5", accountNo: "ACC-00567890", holderName: "Yemi Olatunde-Bello", amountApplied: 141_710, amountAllotted: 120_000, refundAmount: 21_710, reason: "over_subscription", status: "BATCHED" },
  { id: "r6", accountNo: "ACC-00678901", holderName: "Ngozi Eze", amountApplied: 577_200, amountAllotted: 500_000, refundAmount: 77_200, reason: "over_subscription", status: "DISPATCHED" },
];

export function RightsRefundProcessing() {
  const [subTab, setSubTab] = useState("queue");
  const [records, setRecords] = useState<RefundRecord[]>(MOCK_REFUNDS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [batchGenerated, setBatchGenerated] = useState(false);
  const [reconUploaded, setReconUploaded] = useState(false);

  const pending = records.filter((r) => r.status === "PENDING" && r.refundAmount > 0);
  const batched = records.filter((r) => r.status === "BATCHED");
  const dispatched = records.filter((r) => r.status === "DISPATCHED");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((r) => r.id)));
    }
  };

  const selectedRecords = pending.filter((r) => selected.has(r.id));
  const totalSelected = selectedRecords.reduce((s, r) => s + r.refundAmount, 0);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRecords((prev) =>
      prev.map((r) => (selected.has(r.id) ? { ...r, status: "BATCHED" as RefundStatus } : r)),
    );
    setBatchGenerated(true);
    setGenerating(false);
    toast.success(`E-refund file generated for ${selected.size} records (₦${totalSelected.toLocaleString()}).`);
    setSelected(new Set());
  };

  const handleDispatch = () => {
    setRecords((prev) =>
      prev.map((r) => (r.status === "BATCHED" ? { ...r, status: "DISPATCHED" as RefundStatus } : r)),
    );
    toast.success("Batch marked as dispatched. Confirmation upload available in Reconciliation.");
  };

  const handleRequeue = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "PENDING" as RefundStatus } : r)),
    );
    toast.info("Record re-queued for next batch.");
  };

  return (
    <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
      <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-5">
        {[
          ["queue", "Refund Queue"],
          ["batch", "Refund Batch Processing"],
          ["reconciliation", "Refund Reconciliation"],
        ].map(([v, label]) => (
          <TabsTrigger
            key={v}
            value={v}
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* ── Refund Queue ── */}
      <TabsContent value="queue" className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          {(["PENDING", "BATCHED", "DISPATCHED", "CONFIRMED", "FAILED"] as RefundStatus[]).map((st) => {
            const count = records.filter((r) => r.status === st).length;
            return (
              <Card key={st} className="mrpsl-card p-3">
                <p className="mrpsl-label">{st}</p>
                <p className="font-mono font-bold text-lg mt-1">{count}</p>
              </Card>
            );
          })}
        </div>

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
                      <Badge className={`text-[11px] ${STATUS_STYLES[r.status]}`}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </TabsContent>

      {/* ── Batch Processing ── */}
      <TabsContent value="batch" className="space-y-4">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-sm text-foreground">No pending refunds</p>
            <p className="text-xs mt-1">All refund records have been batched or reconciled.</p>
          </div>
        ) : (
          <>
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex-1">
                  Pending Refunds — Select to Batch
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="mrpsl-table-header">
                      <th className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.size === pending.length && pending.length > 0}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium">Account No</th>
                      <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                      <th className="text-right px-4 py-2.5 font-medium">Refund Amount</th>
                      <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((r) => (
                      <tr key={r.id} className={`mrpsl-table-row ${selected.has(r.id) ? "bg-primary/5" : ""}`}>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                        <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                          ₦{r.refundAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{REASON_LABELS[r.reason]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {selected.size > 0 && (
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-sm font-medium">
                  {selected.size} record{selected.size !== 1 ? "s" : ""} selected —{" "}
                  <span className="font-mono font-bold">₦{totalSelected.toLocaleString()}</span>
                </p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
                  ) : (
                    <><FileDown className="h-4 w-4 mr-2" /> Generate E-Refund File</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {batched.length > 0 && (
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Batched — Ready to Dispatch ({batched.length})
              </p>
              <Button size="sm" onClick={handleDispatch}>Mark as Dispatched</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">Account No</th>
                    <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                    <th className="text-right px-4 py-2.5 font-medium">Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {batched.map((r) => (
                    <tr key={r.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                      <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                        ₦{r.refundAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </TabsContent>

      {/* ── Reconciliation ── */}
      <TabsContent value="reconciliation" className="space-y-4">
        {!reconUploaded ? (
          <UploadStagingCard
            label="Upload Bank Confirmation File"
            accept=".csv,.xlsx,.txt"
            description="Upload the bank's confirmation of refund payments to match against dispatched batches."
            onUpload={async (_file: File): Promise<UploadResult> => {
              await new Promise((r) => setTimeout(r, 900));
              setReconUploaded(true);
              return { totalRows: dispatched.length };
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Confirmed", value: dispatched.length, style: "text-green-600" },
                { label: "Failed / Unmatched", value: 0, style: "text-destructive" },
                { label: "Total Dispatched", value: dispatched.length, style: "" },
              ].map(({ label, value, style }) => (
                <Card key={label} className="mrpsl-card p-3">
                  <p className="mrpsl-label">{label}</p>
                  <p className={`font-mono font-bold text-lg mt-1 ${style}`}>{value}</p>
                </Card>
              ))}
            </div>
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Confirmed Records
                </p>
              </div>
              {dispatched.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No dispatched records to reconcile yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="mrpsl-table-header">
                        <th className="text-left px-4 py-2.5 font-medium">Account No</th>
                        <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                        <th className="text-right px-4 py-2.5 font-medium">Refund Amount</th>
                        <th className="text-left px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {dispatched.map((r) => (
                        <tr key={r.id} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                          <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                            ₦{r.refundAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge className="bg-green-100 text-green-800 border-0 text-[11px]">Confirmed</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => handleRequeue(r.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Re-queue
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
