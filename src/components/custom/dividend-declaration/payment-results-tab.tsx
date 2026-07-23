"use client";

import { useState } from "react";
import { Download, RotateCcw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import {
  useDividendFlows,
  useRequeueFailedPayments,
} from "@/hooks/useDividendDeclarationFlow";
import { formatNaira } from "./helpers";

export function PaymentResultsTab() {
  const { currentUser } = useStore();
  const { data: flows = [], isLoading } = useDividendFlows({
    status: ["PARTIALLY_PAID", "PAID"],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requeueMutation = useRequeueFailedPayments();

  const selected =
    flows.find((f) => f.id === selectedId) ?? flows[0] ?? null;
  const successRows = selected?.prelist.filter((r) => r.paymentStatus === "SUCCESS") ?? [];
  const failedRows = selected?.prelist.filter((r) => r.paymentStatus === "FAILED") ?? [];

  function handleRequeueAll() {
    if (!selected) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    requeueMutation.mutate(
      { id: selected.id, actor: currentUser.email },
      {
        onSuccess: (res) => {
          const stillFailed = res.prelist.filter((r) => r.paymentStatus === "FAILED").length;
          toast.success(
            stillFailed === 0
              ? "All requeued payments succeeded."
              : `Requeue complete — ${stillFailed} payment(s) still failed.`,
          );
        },
        onError: (err) => toast.error(err?.message || "Failed to requeue payments."),
      },
    );
  }

  function handleDownloadReport() {
    if (!selected) return;
    downloadCsvData(
      ["Account Number", "Holder Name", "Bank Name", "Amount (NGN)", "Status", "Failure Reason"],
      selected.prelist.map((r) => [
        r.accountNumber,
        r.holderName,
        r.bankName,
        r.netAmount.toFixed(2),
        r.paymentStatus ?? "PENDING",
        r.failureReason ?? "-",
      ]),
      `payment_report_${selected.paymentNumber.replace("/", "-")}.csv`,
    );
    toast.success("Payment report downloaded.");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="mrpsl-card p-0 overflow-hidden lg:col-span-1">
        <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          Processed Runs ({flows.length})
        </div>
        <div className="divide-y max-h-[480px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          ) : flows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payment runs have been processed yet.
            </div>
          ) : (
            flows.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`w-full text-left p-4 hover:bg-accent/40 transition-colors ${
                  selected?.id === d.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{d.paymentNumber}</span>
                  <Badge
                    className={`border-0 text-[11px] ${
                      d.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {d.status === "PAID" ? "All Paid" : "Partially Paid"}
                  </Badge>
                </div>
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {d.registerSymbol} · via {d.gateway} · {d.paymentRunRef}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        {!selected ? (
          <Card className="mrpsl-card p-12 text-center text-muted-foreground">
            Select a processed payment run to view results.
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="mrpsl-section-title">Successful</div>
                <div className="text-2xl font-bold tabular mt-1 text-green-600">
                  {successRows.length}
                </div>
              </Card>
              <Card className="p-4">
                <div className="mrpsl-section-title">Failed</div>
                <div className="text-2xl font-bold tabular mt-1 text-red-600">
                  {failedRows.length}
                </div>
              </Card>
              <Card className="p-4">
                <div className="mrpsl-section-title">Total Paid Out</div>
                <div className="text-xl font-bold tabular mt-1">
                  {formatNaira(successRows.reduce((s, r) => s + r.netAmount, 0))}
                </div>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadReport}>
                <Download className="h-4 w-4" /> Download Payment Report
              </Button>
              {failedRows.length > 0 && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleRequeueAll}
                  disabled={requeueMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4" /> Requeue All Failed
                  {requeueMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              )}
            </div>

            {failedRows.length > 0 && (
              <Card className="mrpsl-card overflow-hidden border-red-200">
                <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-[13px] font-bold uppercase tracking-wide text-red-700">
                  Failed Payments ({failedRows.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-3 py-2">ACCOUNT NO</th>
                        <th className="px-3 py-2">HOLDER NAME</th>
                        <th className="px-3 py-2">BANK NAME</th>
                        <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
                        <th className="px-3 py-2">FAILURE REASON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px]">
                      {failedRows.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 font-mono">{r.accountNumber}</td>
                          <td className="px-3 py-2">{r.holderName}</td>
                          <td className="px-3 py-2">{r.bankName}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">
                            {r.netAmount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-red-700">{r.failureReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                Successful Payments ({successRows.length})
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header sticky top-0">
                    <tr>
                      <th className="px-3 py-2">ACCOUNT NO</th>
                      <th className="px-3 py-2">HOLDER NAME</th>
                      <th className="px-3 py-2">BANK NAME</th>
                      <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px] font-mono">
                    {successRows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">{r.accountNumber}</td>
                        <td className="px-3 py-2 font-sans">{r.holderName}</td>
                        <td className="px-3 py-2 font-sans">{r.bankName}</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {r.netAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
