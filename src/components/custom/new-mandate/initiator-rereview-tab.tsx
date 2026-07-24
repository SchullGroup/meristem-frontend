"use client";

import { useState } from "react";
import { Download, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import {
  useMandateBatches,
  useForwardToSecondIcu,
} from "@/hooks/useMandatePaymentFlow";
import { downloadBatchListCsv } from "./csv";
import { BatchListTable } from "./batch-list-table";
import { BatchDetailPanel } from "./batch-detail-panel";

// Initiator Re-Review (§6.5) — pass-through only. The initiator confirms a
// batch approved by 1st ICU and forwards it to 2nd ICU. No reject/kick-back.
export function InitiatorReReviewTab() {
  const { currentUser } = useStore();
  const { data: batches = [], isLoading } = useMandateBatches({
    status: "PENDING_REREVIEW",
  });
  const forwardMutation = useForwardToSecondIcu();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: MandateBatch | null =
    batches.find((b) => b.id === selectedId) ?? null;

  function handleForward() {
    if (!selected) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    forwardMutation.mutate(
      { id: selected.id, actor: currentUser.email },
      {
        onSuccess: () => {
          toast.success(`Batch ${selected.batchRef} forwarded to 2nd ICU.`);
          setSelectedId(null);
        },
        onError: (err) => toast.error(err?.message || "Failed to forward batch."),
      },
    );
  }

  if (selected) {
    return (
      <BatchDetailPanel
        batch={selected}
        title="Initiator Re-Review"
        onBack={() => setSelectedId(null)}
        banner={
          <Card className="p-4 bg-indigo-50/60 border-indigo-200">
            <p className="text-[13px] text-indigo-900">
              Approved by 1st ICU. This is a pass-through step — you can only
              forward this batch to 2nd ICU; there is no kick-back here.
            </p>
          </Card>
        }
        footer={
          <Button
            className="flex-1 gap-1.5"
            onClick={handleForward}
            disabled={forwardMutation.isPending}
          >
            Send to 2nd ICU <ArrowRight className="h-4 w-4" />
            {forwardMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-indigo-50/60 border-indigo-200">
        <p className="text-[13px] text-indigo-900">
          These batches were <strong>approved by 1st ICU</strong> and returned to
          you for confirmation. This is a pass-through step — you can only forward
          a batch to 2nd ICU; there is no kick-back at this stage.
        </p>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {batches.length} batch{batches.length !== 1 ? "es" : ""} awaiting your
          confirmation
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadBatchListCsv(batches, "mandate_initiator_rereview.csv");
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
        emptyLabel="No batches awaiting re-review."
      />
    </div>
  );
}
