"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import {
  REVERSAL_TYPE_SHORT,
  formatDate,
  formatNaira,
  reversalStatusBadgeClass,
  reversalTypeBadgeClass,
} from "./helpers";

// Shared reversal-request table for the Pending and HOP Approval tabs (§5.1/§5.2).
export function ReversalsTable({
  rows,
  isLoading,
  actionLabel,
  onAction,
  emptyLabel,
}: {
  rows: ReversalRequest[];
  isLoading: boolean;
  actionLabel: string;
  onAction: (r: ReversalRequest) => void;
  emptyLabel: string;
}) {
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-4 py-3">HOLDER NAME</th>
              <th className="px-4 py-3">REGISTER</th>
              <th className="px-4 py-3">ACCOUNT NO</th>
              <th className="px-4 py-3">DIVIDEND NO</th>
              <th className="px-4 py-3 text-center">TYPE</th>
              <th className="px-4 py-3 text-right">AMOUNT (₦)</th>
              <th className="px-4 py-3">REQUESTED BY</th>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3 text-center">STATUS</th>
              <th className="px-4 py-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-medium">{r.holderName}</td>
                  <td className="px-4 py-3 font-semibold">{r.registerSymbol}</td>
                  <td className="px-4 py-3 font-mono text-[13px]">
                    {r.accountNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                    {r.dividendNumber}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={`border-0 text-[12px] ${reversalTypeBadgeClass(r.reversalType)}`}
                    >
                      {REVERSAL_TYPE_SHORT[r.reversalType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {formatNaira(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {r.requestedBy}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.dateRequested)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={`border-0 text-[12px] ${reversalStatusBadgeClass(r.status)}`}
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" onClick={() => onAction(r)}>
                      {actionLabel}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
