"use client";

import { useState } from "react";
import { FileSpreadsheet, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import {
  useDividendFlows,
  useDividendFlow,
  useDecideStage,
} from "@/hooks/useDividendDeclarationFlow";
import { formatNaira } from "./helpers";
import { BatchList, MetricCard } from "./batch-list";
import { DetailHeader } from "./detail-header";
import { DecisionDialog } from "./decision-dialog";
import { ShareholderTable, prelistCsvRows } from "./shareholder-table";
import type { ShareholderColumn } from "./shareholder-table";

// Full payment detail HOP needs to authorise disbursement.
const HOP_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "address",
  "category",
  "bvn",
  "nin",
  "bankName",
  "bankAccountNumber",
  "sortCode",
  "units",
  "netAmount",
];

export function HopApprovalTab() {
  const { data: flows = [], isLoading } = useDividendFlows({ status: "PENDING_HOP" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <HopDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {flows.length} declaration{flows.length !== 1 ? "s" : ""} pending Head of Payments approval
      </p>
      <BatchList
        flows={flows}
        isLoading={isLoading}
        actionLabel="Review Payments"
        onOpen={(d) => setSelectedId(d.id)}
        emptyMessage="No declarations pending HOP approval."
      />
    </div>
  );
}

function HopDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useDividendFlow(id);
  const decideMutation = useDecideStage();
  const [decisionOpen, setDecisionOpen] = useState(false);

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to HOP Approval" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const prelist = record.prelist;
  const mandated = prelist.filter((r) => r.category === "MANDATED");
  const others = prelist.filter((r) => r.category === "OTHERS");

  function handleCsv() {
    const { headers, body } = prelistCsvRows(prelist);
    downloadCsvData(headers, body, `hop_payments_${record!.paymentNumber.replace("/", "-")}.csv`);
    toast.success("Payment list exported as CSV.");
  }

  function decide(decision: "APPROVE" | "REJECT", comment: string) {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    decideMutation.mutate(
      { id: record!.id, stage: "HOP", decision, actor: currentUser.email, comment: comment || undefined },
      {
        onSuccess: () => {
          toast.success(decision === "APPROVE" ? "Approved & forwarded to ICU (2nd)." : "Declaration rejected.");
          setDecisionOpen(false);
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to HOP Approval"
        onBack={onBack}
        title={`HOP Payment Review — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol}) · full payment detail`}
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={handleCsv}>
              <FileSpreadsheet className="h-4 w-4" /> Download CSV
            </Button>
            <Button className="gap-1.5" onClick={() => setDecisionOpen(true)}>
              <Gavel className="h-4 w-4" /> Take Action
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Payees" value={prelist.length.toLocaleString()} />
        <MetricCard label="Mandated" value={mandated.length.toLocaleString()} tone="text-green-700" />
        <MetricCard
          label="Not Yet Mandated"
          value={others.length.toLocaleString()}
          tone="text-amber-600"
        />
        <MetricCard label="Net Payout" value={formatNaira(record.netLiability)} tone="text-green-700" />
      </div>

      {others.length > 0 && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[13px]">
          <strong>{others.length}</strong> account{others.length !== 1 ? "s" : ""} have KYC conflicts and{" "}
          <strong>need mandating</strong> before payment. Filter by category <em>Others</em> to review them.
        </div>
      )}

      <ShareholderTable rows={prelist} columns={HOP_COLUMNS} bankFilter categoryFilter />

      <DecisionDialog
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        title={`HOP Decision — ${record.paymentNumber}`}
        description="Approve to forward to ICU (2nd), or reject to send back."
        approveLabel="Approve & Forward to ICU (2nd)"
        onApprove={(c) => decide("APPROVE", c)}
        onReject={(c) => decide("REJECT", c)}
        isPending={decideMutation.isPending}
      />
    </div>
  );
}
