"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import { useMandateBatches } from "@/hooks/useMandatePaymentFlow";
import { batchTotalAmount, formatNaira } from "./helpers";
import { BatchListTable } from "./batch-list-table";
import { IcuSignOffBanner } from "./icu-sign-off-banner";
import { SecondIcuDetailPanel } from "./second-icu-detail-panel";
import { downloadBatchListCsv } from "./csv";

// 2nd ICU Approval (§6.6) — the only stage where batch contents can be edited.
export function SecondIcuApprovalTab() {
  const { data: batches = [], isLoading } = useMandateBatches({
    status: "PENDING_ICU_2",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep the panel bound to the live batch so exclusions reflect instantly.
  const selected: MandateBatch | null =
    batches.find((b) => b.id === selectedId) ?? null;

  const totalExposure = batches.reduce((s, b) => s + batchTotalAmount(b), 0);

  if (selected) {
    return (
      <SecondIcuDetailPanel batch={selected} onBack={() => setSelectedId(null)} />
    );
  }

  return (
    <div className="space-y-4">
      <IcuSignOffBanner ordinal="2nd" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mrpsl-section-title">Batches Pending 2nd ICU</div>
          <div className="text-xl font-bold tabular mt-1">
            {batches.length.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mrpsl-section-title">Total Exposure</div>
          <div className="text-xl font-bold tabular mt-1 text-green-700">
            {formatNaira(totalExposure)}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {batches.length} batch{batches.length !== 1 ? "es" : ""} awaiting
          independent 2nd ICU sign-off. Open a batch to search, bulk-exclude
          shareholders, then approve.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadBatchListCsv(batches, "mandate_second_icu.csv");
            toast.success("Batch list exported as CSV.");
          }}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <BatchListTable
        batches={batches}
        isLoading={isLoading}
        actionLabel="Review & Edit"
        onAction={(b) => setSelectedId(b.id)}
        emptyLabel="No batches awaiting 2nd ICU approval."
      />
    </div>
  );
}
