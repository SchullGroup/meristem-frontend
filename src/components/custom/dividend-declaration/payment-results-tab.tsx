"use client";

import { useState } from "react";
import { Loader2, FileSpreadsheet, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import {
  useDividendFlows,
  useDividendFlow,
  useRequeueFailedPayments,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatNaira } from "./helpers";
import { BatchList, MetricCard } from "./batch-list";
import { DetailHeader } from "./detail-header";
import { ShareholderTable } from "./shareholder-table";
import type { ShareholderColumn } from "./shareholder-table";

const SUCCESS_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "bankName",
  "bankAccountNumber",
  "units",
  "netAmount",
];

const FAILED_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "bankName",
  "bankAccountNumber",
  "netAmount",
  "failureReason",
];

export function PaymentResultsTab() {
  const { data: flows = [], isLoading } = useDividendFlows({
    status: ["PARTIALLY_PAID", "PAID"],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <ResultsDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {flows.length} processed payment run{flows.length !== 1 ? "s" : ""}
      </p>
      <BatchList
        flows={flows}
        isLoading={isLoading}
        actionLabel="View Results"
        onOpen={(d) => setSelectedId(d.id)}
        emptyMessage="No payment runs have been processed yet."
      />
    </div>
  );
}

function ResultsDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useDividendFlow(id);
  const requeueMutation = useRequeueFailedPayments();
  const [tab, setTab] = useState<"success" | "failed">("success");

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to Payment Results" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const success = record.prelist.filter((r) => r.paymentStatus === "SUCCESS");
  const failed = record.prelist.filter((r) => r.paymentStatus === "FAILED");
  const paidOut = success.reduce((s, r) => s + r.netAmount, 0);

  function handleReport() {
    const headers = ["Account No", "Holder Name", "Bank Name", "Amount (NGN)", "Status", "Failure Reason"];
    const body = record!.prelist
      .filter((r) => !r.excluded)
      .map((r) => [
        r.accountNumber,
        r.holderName,
        r.bankName,
        r.netAmount.toFixed(2),
        r.paymentStatus ?? "-",
        r.failureReason ?? "-",
      ]);
    downloadCsvData(headers, body, `payment_report_${record!.paymentNumber.replace("/", "-")}.csv`);
    toast.success("Payment report downloaded.");
  }

  function handleRequeue() {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    requeueMutation.mutate(
      { id: record!.id, actor: currentUser.email },
      {
        onSuccess: (res: DividendFlowRecord) => {
          const stillFailed = res.prelist.filter((r) => r.paymentStatus === "FAILED").length;
          toast.success(
            stillFailed === 0
              ? "All requeued payments succeeded."
              : `Requeue complete — ${stillFailed} still failed.`,
          );
        },
        onError: (err) => toast.error(err?.message || "Failed to requeue payments."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to Payment Results"
        onBack={onBack}
        title={`Payment Results — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol}) · via ${record.gateway} · ${record.paymentRunRef}`}
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={handleReport}>
              <FileSpreadsheet className="h-4 w-4" /> Download Payment Report
            </Button>
            {failed.length > 0 && (
              <Button className="gap-1.5" onClick={handleRequeue} disabled={requeueMutation.isPending}>
                <RotateCcw className="h-4 w-4" /> Requeue All Failed
                {requeueMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Successful" value={success.length.toLocaleString()} tone="text-green-600" />
        <MetricCard label="Failed" value={failed.length.toLocaleString()} tone="text-red-600" />
        <MetricCard label="Total Paid Out" value={formatNaira(paidOut)} tone="text-green-700" />
        <MetricCard label="Net Payout" value={formatNaira(record.netLiability)} />
      </div>

      <div className="inline-flex rounded-lg border p-1 bg-muted/30">
        {(
          [
            { key: "success", label: `Successful (${success.length})` },
            { key: "failed", label: `Failed (${failed.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "success" ? (
        <ShareholderTable
          rows={success}
          columns={SUCCESS_COLUMNS}
          bankFilter
          emptyMessage="No successful payments."
        />
      ) : (
        <ShareholderTable
          rows={failed}
          columns={FAILED_COLUMNS}
          bankFilter
          emptyMessage="No failed payments."
        />
      )}
    </div>
  );
}
