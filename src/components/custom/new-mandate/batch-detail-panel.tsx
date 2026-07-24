"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  showComment?: boolean;
  comment?: string;
  onCommentChange?: (v: string) => void;
  commentHint?: string;
  footer: ReactNode;
}

// In-place batch review sub-screen (replaces the tab's list content with a Back
// button) — the dense summary cards + shareholder table are better shown at full
// width than in a modal.
export function BatchDetailPanel({
  batch,
  title,
  onBack,
  banner,
  showComment = false,
  comment = "",
  onCommentChange,
  commentHint = "Required when rejecting…",
  footer,
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" /> Download CSV
        </Button>
      </div>

      {banner}

      <BatchSummaryCards batch={batch} />

      <h4 className="text-sm font-bold">
        Shareholders with Outstanding Dividends ({batch.shareholders.length})
      </h4>
      <ShareholderTable shareholders={batch.shareholders} maxHeight="max-h-[520px]" />

      {showComment && (
        <div className="space-y-2">
          <label className="mrpsl-label">Comment</label>
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange?.(e.target.value)}
            placeholder={commentHint}
            className="resize-none"
          />
        </div>
      )}

      <div className="flex gap-3 pt-3 border-t border-border/60">{footer}</div>
    </div>
  );
}
