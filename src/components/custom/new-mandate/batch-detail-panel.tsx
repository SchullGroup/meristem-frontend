"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import { BatchSummaryCards } from "./batch-summary-cards";
import { ShareholderTable } from "./shareholder-table";
import { downloadShareholdersCsv } from "./csv";

interface BatchDetailPanelProps {
  batch: MandateBatch;
  title: string;
  onBack: () => void;
  banner?: ReactNode;
  // Primary actions rendered in the header (e.g. the "Review & Decide" button
  // that opens the decision modal). The comment box lives in that modal, never
  // below the data tables.
  actions?: ReactNode;
}

// In-place batch review sub-screen (replaces the tab's list content with a Back
// button) — the dense summary cards + shareholder table are shown at full width
// rather than in a modal.
export function BatchDetailPanel({
  batch,
  title,
  onBack,
  banner,
  actions,
}: BatchDetailPanelProps) {
  function handleDownload() {
    downloadShareholdersCsv(
      batch.shareholders,
      `mandate_batch_${batch.batchRef.replace("/", "-")}.csv`,
    );
    toast.success("Shareholder list exported as CSV.");
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to list
      </button>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold tracking-tight">
          {title} —{" "}
          <span className="font-mono text-base">{batch.batchRef}</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </Button>
          {actions}
        </div>
      </div>

      {banner}

      <BatchSummaryCards batch={batch} />

      <h4 className="text-sm font-bold">
        Shareholders with Outstanding Dividends ({batch.shareholders.length})
      </h4>
      <ShareholderTable
        shareholders={batch.shareholders}
        maxHeight="max-h-[520px]"
      />
    </div>
  );
}
