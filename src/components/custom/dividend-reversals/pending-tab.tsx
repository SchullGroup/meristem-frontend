"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { useReversalRequests } from "@/hooks/useDividendReversalFlow";
import { ReversalsTable } from "./reversals-table";
import { ReversalDetailModal } from "./reversal-detail-modal";
import { downloadReversalsCsv } from "./csv";

export function PendingTab() {
  const { data: rows = [], isLoading } = useReversalRequests({
    status: "PENDING",
  });
  const [selected, setSelected] = useState<ReversalRequest | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} reversal request{rows.length !== 1 ? "s" : ""} awaiting
          HOP decision
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadReversalsCsv(rows, "dividend_reversals_pending.csv");
            toast.success("Pending reversals exported as CSV.");
          }}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <ReversalsTable
        rows={rows}
        isLoading={isLoading}
        actionLabel="View"
        onAction={(r) => {
          setSelected(r);
          setOpen(true);
        }}
        emptyLabel="No pending reversal requests."
      />

      <ReversalDetailModal
        request={selected}
        open={open}
        onOpenChange={setOpen}
        title="Reversal Request"
      />
    </div>
  );
}
