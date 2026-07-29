"use client";

import type { MandateBatch } from "@/types/mandate-payment-flow";
import {
  batchDividendNumbers,
  batchRegisters,
  batchSourceLabel,
  batchTotalAmount,
  formatBatchStatus,
  formatDate,
  formatNaira,
} from "./helpers";

// Batch summary card metrics (spec §7). `showExcluded` adds the 2nd-ICU-only
// "excluded so far" metric.
export function BatchSummaryCards({
  batch,
  showExcluded = false,
}: {
  batch: MandateBatch;
  showExcluded?: boolean;
}) {
  const items: { label: string; value: string; tone?: string }[] = [
    { label: "Shareholders", value: batch.shareholders.length.toLocaleString() },
    {
      label: "Total Payout",
      value: formatNaira(batchTotalAmount(batch)),
      tone: "text-green-700",
    },
    { label: "Registers", value: String(batchRegisters(batch).length) },
    {
      label: "Dividend Numbers",
      value: String(batchDividendNumbers(batch).length),
    },
    { label: "Batch Ref", value: batch.batchRef },
    { label: "Date Created", value: formatDate(batch.createdAt) },
    {
      label: "Status",
      value: formatBatchStatus(batch.status, batch.rejectedAt),
    },
    { label: "Initiated By", value: batch.initiatedBy },
    { label: "Source", value: batchSourceLabel(batch) },
  ];

  if (showExcluded) {
    items.push({
      label: "Excluded So Far",
      value: batch.excluded.length.toLocaleString(),
      tone: batch.excluded.length > 0 ? "text-red-600" : undefined,
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-muted/30 rounded-xl p-4 border border-border/60">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mrpsl-section-title">{it.label}</div>
          <div
            className={`font-bold mt-0.5 break-words ${it.tone ?? ""}`}
            title={it.value}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
