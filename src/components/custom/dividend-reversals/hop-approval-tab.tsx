"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { useReversalRequests } from "@/hooks/useDividendReversalFlow";
import { ReversalsTable } from "./reversals-table";
import { ReversalReviewModal } from "./reversal-review-modal";
import { downloadReversalsCsv } from "./csv";

export function HopApprovalTab() {
  const { data: rows = [], isLoading } = useReversalRequests({
    status: "PENDING",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Bind to the live record so it disappears from the modal source after a
  // decision is recorded.
  const selected: ReversalRequest | null =
    rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} request{rows.length !== 1 ? "s" : ""} pending your
          approval. Each decision is logged to History either way.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadReversalsCsv(rows, "dividend_reversals_hop.csv");
            toast.success("Reversals exported as CSV.");
          }}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <ReversalsTable
        rows={rows}
        isLoading={isLoading}
        actionLabel="Review"
        onAction={(r) => {
          setSelectedId(r.id);
          setOpen(true);
        }}
        emptyLabel="No requests awaiting approval."
      />

      <ReversalReviewModal
        request={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
