"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import {
  batchRegisters,
  batchSourceLabel,
  batchTotalAmount,
  formatBatchStatus,
  formatDate,
  formatNaira,
  sourceBadgeClass,
  statusBadgeClass,
  batchSources,
} from "./helpers";

interface BatchListTableProps {
  batches: MandateBatch[];
  isLoading: boolean;
  actionLabel: string;
  onAction: (batch: MandateBatch) => void;
  emptyLabel?: string;
  actionVariant?: "default" | "outline";
}

// The standard batch-list table used on every stage tab (spec §6.0).
export function BatchListTable({
  batches,
  isLoading,
  actionLabel,
  onAction,
  emptyLabel = "No batches at this stage.",
  actionVariant = "default",
}: BatchListTableProps) {
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3">BATCH REF</th>
              <th className="px-4 py-3 text-center">SHAREHOLDERS</th>
              <th className="px-4 py-3 text-right">TOTAL AMOUNT (₦)</th>
              <th className="px-4 py-3 text-center">STATUS</th>
              <th className="px-4 py-3">INITIATED BY</th>
              <th className="px-4 py-3 text-center">SOURCE</th>
              <th className="px-4 py-3 text-center">REGISTERS</th>
              <th className="px-4 py-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : batches.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              batches.map((b) => {
                const registers = batchRegisters(b);
                const sources = batchSources(b);
                return (
                  <tr key={b.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[13px]">
                      {b.batchRef}
                    </td>
                    <td className="px-4 py-3 tabular text-center">
                      {b.shareholders.length.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular text-right font-bold">
                      {formatNaira(batchTotalAmount(b))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={`border-0 text-[12px] ${statusBadgeClass(b.status)}`}
                      >
                        {formatBatchStatus(b.status, b.rejectedAt)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {b.initiatedBy}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={`border-0 text-[12px] ${
                          sources.length > 1
                            ? "bg-gray-100 text-gray-700"
                            : sourceBadgeClass(sources[0])
                        }`}
                      >
                        {batchSourceLabel(b)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular text-center text-muted-foreground">
                      {registers.length} register{registers.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant={actionVariant}
                        onClick={() => onAction(b)}
                      >
                        {actionLabel}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
