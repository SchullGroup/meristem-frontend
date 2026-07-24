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
  useMandateBatches,
  useRequeueFailedPayments,
} from "@/hooks/useMandatePaymentFlow";
import type { MandateShareholder } from "@/types/mandate-payment-flow";
import { formatNaira } from "./helpers";

export function PaymentResultsTab() {
  const { currentUser } = useStore();
  const { data: batches = [], isLoading } = useMandateBatches({
    status: ["PARTIALLY_PAID", "PAID"],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"success" | "failed">("success");
  const requeueMutation = useRequeueFailedPayments();

  const selected = batches.find((b) => b.id === selectedId) ?? batches[0] ?? null;
  const successRows =
    selected?.shareholders.filter((r) => r.paymentStatus === "SUCCESS") ?? [];
  const failedRows =
    selected?.shareholders.filter((r) => r.paymentStatus === "FAILED") ?? [];

  function handleRequeue() {
    if (!selected) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    requeueMutation.mutate(
      { id: selected.id, actor: currentUser.email },
      {
        onSuccess: (res) => {
          const stillFailed = res.shareholders.filter(
            (r) => r.paymentStatus === "FAILED",
          ).length;
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
      ["Name", "Register", "Bank", "New Account No", "Amount (NGN)", "Status", "Failure Reason"],
      selected.shareholders.map((r) => [
        r.name,
        r.registerSymbol,
        r.bank,
        r.newAccountNumber,
        r.amount.toFixed(2),
        r.paymentStatus ?? "PENDING",
        r.failureReason ?? "-",
      ]),
      `mandate_payment_report_${selected.batchRef.replace("/", "-")}.csv`,
    );
    toast.success("Payment report downloaded.");
  }

  const rows = subTab === "success" ? successRows : failedRows;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="mrpsl-card p-0 overflow-hidden lg:col-span-1">
        <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          Processed Batches ({batches.length})
        </div>
        <div className="divide-y max-h-[520px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          ) : batches.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payment runs have been processed yet.
            </div>
          ) : (
            batches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedId(b.id);
                  setSubTab("success");
                }}
                className={`w-full text-left p-4 hover:bg-accent/40 transition-colors ${
                  selected?.id === b.id
                    ? "bg-primary/5 border-l-4 border-l-primary"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-[13px]">
                    {b.batchRef}
                  </span>
                  <Badge
                    className={`border-0 text-[11px] ${
                      b.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {b.status === "PAID" ? "All Paid" : "Partially Paid"}
                  </Badge>
                </div>
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {b.shareholders.length} shareholders · via {b.gateway} ·{" "}
                  {b.paymentRunRef}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        {!selected ? (
          <Card className="mrpsl-card p-12 text-center text-muted-foreground">
            Select a processed batch to view payment results.
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
                  {formatNaira(successRows.reduce((s, r) => s + r.amount, 0))}
                </div>
              </Card>
            </div>

            <div className="flex justify-between items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  onClick={() => setSubTab("success")}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    subTab === "success"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Successful ({successRows.length})
                </button>
                <button
                  onClick={() => setSubTab("failed")}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    subTab === "failed"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Failed ({failedRows.length})
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadReport}
                >
                  <Download className="h-4 w-4" /> Download Payment Report
                </Button>
                {failedRows.length > 0 && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleRequeue}
                    disabled={requeueMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4" /> Requeue All Failed
                    {requeueMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <ResultsTable rows={rows} kind={subTab} />
          </>
        )}
      </div>
    </div>
  );
}

function ResultsTable({
  rows,
  kind,
}: {
  rows: MandateShareholder[];
  kind: "success" | "failed";
}) {
  return (
    <Card
      className={`mrpsl-card overflow-hidden ${kind === "failed" ? "border-red-200" : ""}`}
    >
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header sticky top-0">
            <tr>
              <th className="px-3 py-2">NAME</th>
              <th className="px-3 py-2">REGISTER</th>
              <th className="px-3 py-2">BANK</th>
              <th className="px-3 py-2">NEW ACCOUNT NO</th>
              <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
              {kind === "failed" && <th className="px-3 py-2">FAILURE REASON</th>}
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={kind === "failed" ? 6 : 5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No {kind === "failed" ? "failed" : "successful"} payments.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 font-semibold">{r.registerSymbol}</td>
                  <td className="px-3 py-2">{r.bank}</td>
                  <td className="px-3 py-2 font-mono">{r.newAccountNumber}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {r.amount.toLocaleString()}.00
                  </td>
                  {kind === "failed" && (
                    <td className="px-3 py-2 text-red-700">{r.failureReason}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
