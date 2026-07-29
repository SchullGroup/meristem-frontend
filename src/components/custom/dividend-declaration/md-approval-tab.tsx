"use client";

import { useState } from "react";
import { Loader2, FileSpreadsheet, Banknote, Hand } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import {
  useDividendFlows,
  useDividendFlow,
  useMdDecision,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatNaira } from "./helpers";
import { BatchList, MetricCard } from "./batch-list";
import { DetailHeader } from "./detail-header";
import { ShareholderTable, prelistCsvRows } from "./shareholder-table";
import type { ShareholderColumn } from "./shareholder-table";

const MD_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "category",
  "bvn",
  "bankName",
  "bankAccountNumber",
  "units",
  "netAmount",
];

export function MdApprovalTab() {
  const { data: flows = [], isLoading } = useDividendFlows({ status: "PENDING_MD" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <MdDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  // Summary by register across all batches awaiting MD sign-off.
  const byRegister = flows.reduce<Record<string, { count: number; net: number }>>((acc, f) => {
    const key = f.registerSymbol;
    acc[key] = acc[key] || { count: 0, net: 0 };
    acc[key].count += 1;
    acc[key].net += f.netLiability;
    return acc;
  }, {});
  const totalNet = flows.reduce((s, f) => s + f.netLiability, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard label="Batches Awaiting MD" value={flows.length.toLocaleString()} />
        <MetricCard label="Registers" value={Object.keys(byRegister).length.toLocaleString()} />
        <MetricCard label="Total Net Payout" value={formatNaira(totalNet)} tone="text-green-700" />
      </div>

      {Object.keys(byRegister).length > 0 && (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Summary by Register
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-2">REGISTER</th>
                  <th className="px-4 py-2 text-center">BATCHES</th>
                  <th className="px-4 py-2 text-right">NET PAYOUT</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {Object.entries(byRegister).map(([reg, v]) => (
                  <tr key={reg}>
                    <td className="px-4 py-2 font-semibold">{reg}</td>
                    <td className="px-4 py-2 text-center">{v.count}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatNaira(v.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        {flows.length} batch{flows.length !== 1 ? "es" : ""} awaiting MD final sign-off
      </p>
      <BatchList
        flows={flows}
        isLoading={isLoading}
        actionLabel="Review & Decide"
        onOpen={(d) => setSelectedId(d.id)}
        emptyMessage="No batches awaiting MD approval."
      />
    </div>
  );
}

function MdDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useDividendFlow(id);
  const mdMutation = useMdDecision();
  const [action, setAction] = useState<"APPROVE_AND_PAY" | "MANUAL" | null>(null);

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to MD Approval" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const payable = record.prelist.filter((r) => !r.excluded);
  const excluded = record.prelist.length - payable.length;
  const gross = payable.reduce((s, r) => s + r.grossAmount, 0);
  const wht = payable.reduce((s, r) => s + r.whtAmount, 0);
  const net = payable.reduce((s, r) => s + r.netAmount, 0);

  function handleCsv() {
    const { headers, body } = prelistCsvRows(record!.prelist);
    downloadCsvData(headers, body, `md_review_${record!.paymentNumber.replace("/", "-")}.csv`);
    toast.success("Payment breakdown exported as CSV.");
  }

  function decide(decision: "APPROVE_AND_PAY" | "MANUAL") {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    setAction(decision);
    mdMutation.mutate(
      { id: record!.id, decision, actor: currentUser.email },
      {
        onSuccess: (res: DividendFlowRecord) => {
          if (decision === "MANUAL") {
            toast.success("Forwarded for manual processing.");
          } else {
            toast.success(
              res.status === "PAID"
                ? "Approved — all payments succeeded."
                : "Approved — run initiated; some payments failed (see Payment Results).",
            );
          }
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
        onSettled: () => setAction(null),
      },
    );
  }

  const busy = mdMutation.isPending;

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to MD Approval"
        onBack={onBack}
        title={`MD Final Approval — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol})`}
        actions={
          <Button variant="outline" className="gap-1.5" onClick={handleCsv}>
            <FileSpreadsheet className="h-4 w-4" /> Download CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Payable Accounts" value={payable.length.toLocaleString()} />
        <MetricCard label="Excluded" value={excluded.toLocaleString()} tone="text-red-600" />
        <MetricCard label="Gross" value={formatNaira(gross)} />
        <MetricCard label="WHT" value={formatNaira(wht)} tone="text-amber-600" />
        <MetricCard label="Net to Pay" value={formatNaira(net)} tone="text-green-700" />
      </div>

      <Card className="mrpsl-card p-4">
        <div className="mrpsl-section-title mb-2">Payment Summary — {record.registerSymbol}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-[13px]">Register</div>
            <div className="font-medium">{record.registerName}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[13px]">Dividend Type / Rate</div>
            <div className="font-medium">
              {record.dividendType} · ₦{record.rate.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[13px]">Payment Date</div>
            <div className="font-medium">{record.paymentDate}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[13px]">Net Payout</div>
            <div className="font-mono font-bold text-green-700">{formatNaira(net)}</div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => decide("MANUAL")}
          disabled={busy}
        >
          <Hand className="h-4 w-4" /> Forward for Manual Processing
          {busy && action === "MANUAL" && <Loader2 className="h-4 w-4 animate-spin" />}
        </Button>
        <Button className="flex-1 gap-1.5" onClick={() => decide("APPROVE_AND_PAY")} disabled={busy}>
          <Banknote className="h-4 w-4" /> Approve &amp; Initiate Payment Run (NIBSS)
          {busy && action === "APPROVE_AND_PAY" && <Loader2 className="h-4 w-4 animate-spin" />}
        </Button>
      </div>

      <ShareholderTable rows={payable} columns={MD_COLUMNS} bankFilter categoryFilter />
    </div>
  );
}
