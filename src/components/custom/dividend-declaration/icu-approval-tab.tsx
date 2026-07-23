"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { downloadCsvData } from "@/lib/utils/csv-template";
import { useDividendFlows, type FlowApprovalStage } from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord, DividendFlowStatus } from "@/types/dividend-declaration-flow";
import { formatNaira, getTierBadge } from "./helpers";
import { IcuReviewDialog } from "./icu-review-dialog";

export function IcuApprovalTab({ stage }: { stage: FlowApprovalStage }) {
  const status: DividendFlowStatus = stage === "ICU_1" ? "PENDING_ICU_1" : "PENDING_ICU_2";
  const { data: flows = [], isLoading } = useDividendFlows({ status });
  const [selected, setSelected] = useState<DividendFlowRecord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const totals = flows.reduce(
    (acc, d) => {
      acc.gross += d.grossLiability;
      acc.net += d.netLiability;
      acc.shareholders += d.totalShareholders;
      return acc;
    },
    { gross: 0, net: 0, shareholders: 0 },
  );

  function handleDownload() {
    if (flows.length === 0) {
      toast.error("No declarations pending review.");
      return;
    }
    downloadCsvData(
      ["Payment No", "Register", "Type", "Rate", "Gross Liability", "WHT", "Net Payout", "Shareholders", "Tier"],
      flows.map((d) => [
        d.paymentNumber,
        d.registerSymbol,
        d.dividendType,
        d.rate.toFixed(4),
        d.grossLiability.toFixed(2),
        d.whtAmount.toFixed(2),
        d.netLiability.toFixed(2),
        String(d.totalShareholders),
        String(d.tier),
      ]),
      `icu_${stage.toLowerCase()}_pending_declarations.csv`,
    );
    toast.success("Pending declarations exported as CSV.");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Pending Review" value={flows.length.toLocaleString()} />
        <MetricCard label="Total Gross Liability" value={formatNaira(totals.gross)} />
        <MetricCard label="Total Shareholders" value={totals.shareholders.toLocaleString()} />
        <MetricCard label="Total Net Payout" value={formatNaira(totals.net)} tone="text-green-700" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {flows.length} declaration{flows.length !== 1 ? "s" : ""} pending{" "}
          {stage === "ICU_1" ? "1st" : "2nd (final)"} ICU sign-off
        </p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

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
                    No declarations pending {stage === "ICU_1" ? "1st" : "2nd"} ICU approval.
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
                    <td className="px-4 py-3 tabular text-center">₦{d.rate.toFixed(4)}</td>
                    <td className="px-4 py-3 tabular text-center font-bold">
                      {formatNaira(d.grossLiability)}
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

      <IcuReviewDialog
        record={selected}
        stage={stage}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="mrpsl-section-title">{label}</div>
      <div className={`text-xl font-bold tabular mt-1 ${tone ?? ""}`}>{value}</div>
    </Card>
  );
}
