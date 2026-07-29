"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import {
  formatFlowStatus,
  formatNaira,
  getTierBadge,
  statusBadgeClass,
} from "./helpers";

/**
 * Shared batch list table used by every approval/processing tab. Clicking a row
 * (or its Open button) drives the list -> detail drill-in the parent manages.
 */
export function BatchList({
  flows,
  isLoading,
  onOpen,
  actionLabel = "Open",
  emptyMessage = "No dividend batches at this stage.",
}: {
  flows: DividendFlowRecord[];
  isLoading: boolean;
  onOpen: (record: DividendFlowRecord) => void;
  actionLabel?: string;
  emptyMessage?: string;
}) {
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-4 py-3">PAYMENT NO</th>
              <th className="px-4 py-3">REGISTER</th>
              <th className="px-4 py-3">TYPE</th>
              <th className="px-4 py-3 text-center">RATE</th>
              <th className="px-4 py-3 text-center">GROSS LIABILITY</th>
              <th className="px-4 py-3 text-center">NET PAYOUT</th>
              <th className="px-4 py-3 text-center">SHAREHOLDERS</th>
              <th className="px-4 py-3 text-center">TIER</th>
              <th className="px-4 py-3 text-center">STATUS</th>
              <th className="px-4 py-3 text-center">ACTIONS</th>
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
            ) : flows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              flows.map((d) => (
                <tr
                  key={d.id}
                  className="mrpsl-table-row cursor-pointer"
                  onClick={() => onOpen(d)}
                >
                  <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                    {d.paymentNumber}
                  </td>
                  <td className="px-4 py-3 font-semibold">{d.registerSymbol}</td>
                  <td className="px-4 py-3">{d.dividendType}</td>
                  <td className="px-4 py-3 tabular text-center">₦{d.rate.toFixed(4)}</td>
                  <td className="px-4 py-3 tabular text-center font-bold">
                    {formatNaira(d.grossLiability)}
                  </td>
                  <td className="px-4 py-3 tabular text-center text-green-700">
                    {formatNaira(d.netLiability)}
                  </td>
                  <td className="px-4 py-3 tabular text-center">
                    {d.totalShareholders.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={`${getTierBadge(d.tier)} text-[13px]`}>
                      Tier {d.tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={`border-0 text-[13px] ${statusBadgeClass(d.status)}`}>
                      {formatFlowStatus(d.status, d.rejectedAt)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(d);
                      }}
                    >
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

export function MetricCard({
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
      <div className={`text-xl font-bold tabular mt-1 ${tone ?? ""}`}>{value}</div>
    </Card>
  );
}
