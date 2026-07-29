"use client";

import { useState, type ReactNode } from "react";
import { Download, Gavel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type {
  MandateBatch,
  MandateBatchStatus,
} from "@/types/mandate-payment-flow";
import {
  useMandateBatches,
  useDecideBatch,
  type MandateApprovalStage,
} from "@/hooks/useMandatePaymentFlow";
import { batchTotalAmount, formatNaira } from "./helpers";
import { BatchListTable } from "./batch-list-table";
import { BatchDetailPanel } from "./batch-detail-panel";
import { DecisionDialog } from "@/components/custom/dividend-declaration/decision-dialog";
import { downloadBatchListCsv } from "./csv";

interface ApprovalStageTabProps {
  status: MandateBatchStatus;
  stage: MandateApprovalStage;
  description: string;
  reviewTitle: string;
  approveLabel: string;
  emptyLabel: string;
  csvName: string;
  banner?: ReactNode;
}

// Generic straight approve/reject gate — used by Pending Approval (Initiator),
// HOP Approval, and 1st ICU Approval. Each supplies its own labels/banner.
export function ApprovalStageTab({
  status,
  stage,
  description,
  reviewTitle,
  approveLabel,
  emptyLabel,
  csvName,
  banner,
}: ApprovalStageTabProps) {
  const { currentUser } = useStore();
  const { data: batches = [], isLoading } = useMandateBatches({ status });
  const decideMutation = useDecideBatch();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);

  const selected: MandateBatch | null =
    batches.find((b) => b.id === selectedId) ?? null;

  const totals = batches.reduce(
    (acc, b) => {
      acc.shareholders += b.shareholders.length;
      acc.amount += batchTotalAmount(b);
      return acc;
    },
    { shareholders: 0, amount: 0 },
  );

  function backToList() {
    setSelectedId(null);
    setDecisionOpen(false);
  }

  function decide(decision: "APPROVE" | "REJECT", comment: string) {
    if (!selected) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    decideMutation.mutate(
      {
        id: selected.id,
        stage,
        decision,
        actor: currentUser.email,
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "APPROVE"
              ? `Batch ${selected.batchRef} approved.`
              : `Batch ${selected.batchRef} rejected.`,
          );
          backToList();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  if (selected) {
    return (
      <>
        <BatchDetailPanel
          batch={selected}
          title={reviewTitle}
          onBack={backToList}
          banner={banner}
          actions={
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setDecisionOpen(true)}
            >
              <Gavel className="h-4 w-4" /> Review &amp; Decide
            </Button>
          }
        />
        <DecisionDialog
          open={decisionOpen}
          onOpenChange={setDecisionOpen}
          title={`${reviewTitle} — ${selected.batchRef}`}
          description="Approve to advance the batch, or reject with a reason."
          approveLabel={approveLabel}
          onApprove={(c) => decide("APPROVE", c)}
          onReject={(c) => decide("REJECT", c)}
          isPending={decideMutation.isPending}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Batches Pending" value={batches.length.toLocaleString()} />
        <MetricCard
          label="Total Shareholders"
          value={totals.shareholders.toLocaleString()}
        />
        <MetricCard
          label="Total Exposure"
          value={formatNaira(totals.amount)}
          tone="text-green-700"
        />
      </div>

      {banner}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadBatchListCsv(batches, csvName);
            toast.success("Batch list exported as CSV.");
          }}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <BatchListTable
        batches={batches}
        isLoading={isLoading}
        actionLabel="Review"
        onAction={(b) => setSelectedId(b.id)}
        emptyLabel={emptyLabel}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card className="p-4">
      <div className="mrpsl-section-title">{label}</div>
      <div className={`text-xl font-bold tabular mt-1 ${tone ?? ""}`}>
        {value}
      </div>
    </Card>
  );
}
