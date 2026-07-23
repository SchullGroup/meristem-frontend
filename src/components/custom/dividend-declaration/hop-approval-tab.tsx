"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDividendFlows } from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatNaira, getTierBadge } from "./helpers";
import { HopReviewDialog } from "./hop-review-dialog";

export function HopApprovalTab() {
  const { data: flows = [], isLoading } = useDividendFlows({ status: "PENDING_HOP" });
  const [selected, setSelected] = useState<DividendFlowRecord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {flows.length} declaration{flows.length !== 1 ? "s" : ""} pending Head of Payments (HOP) approval
      </p>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">PAYMENT NO</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3 text-center">GROSS LIABILITY</th>
                <th className="px-4 py-3 text-center">NET PAYOUT</th>
                <th className="px-4 py-3 text-center">SHAREHOLDERS</th>
                <th className="px-4 py-3 text-center">TIER</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No declarations pending HOP approval.
                  </td>
                </tr>
              ) : (
                flows.map((d) => (
                  <tr key={d.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                      {d.paymentNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold">{d.registerSymbol}</td>
                    <td className="px-4 py-3">{d.dividendType}</td>
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
                      <Badge className={`${getTierBadge(d.tier)} text-[13px]`}>Tier {d.tier}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelected(d);
                          setReviewOpen(true);
                        }}
                      >
                        Review &amp; Decide
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <HopReviewDialog record={selected} open={reviewOpen} onOpenChange={setReviewOpen} />
    </div>
  );
}
