"use client";

import { ArrowRight, FileText, List, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";
import { useCscsBatchRegisters } from "@/hooks/useCscsPipeline";

interface StepRegistersRecordsProps {
  batchRef: string;
  onProceed: () => void;
  onKycClick: (register: string) => void;
  onTxClick: (register: string) => void;
}

export function StepRegistersRecords({
  batchRef,
  onProceed,
  onKycClick,
  onTxClick,
}: StepRegistersRecordsProps) {
  const { data, isLoading, isError, error } = useCscsBatchRegisters(batchRef);

  const registers = data?.registers ?? [];
  const totals = data?.totals ?? {
    kycRecords: 0,
    missingStates: 0,
    transactions: 0,
    buys: 0,
    sells: 0,
    flagged: 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading register stats…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center text-red-600 text-sm">
        {(error as Error)?.message ?? "Failed to load register stats."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground">{batchRef}</p>
        <h3 className="font-semibold text-base mt-0.5">Registers &amp; Records</h3>
        <p className="text-sm text-muted-foreground mt-1">
          ZIP extracted successfully — {registers.length} register{registers.length !== 1 ? "s" : ""} found.
          Verify record counts before proceeding to state resolution.
        </p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "KYC Records", value: totals.kycRecords, color: "" },
          { label: "Missing States", value: totals.missingStates, color: "text-amber-600" },
          { label: "Transactions", value: totals.transactions, color: "" },
          {
            label: "Flagged",
            value: totals.flagged,
            color: totals.flagged > 0 ? "text-red-600" : "text-muted-foreground",
          },
        ].map(({ label, value, color }) => (
          <Card key={label} className="mrpsl-card p-4 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-mono font-bold text-lg ${color}`}>{formatNumber(value)}</p>
          </Card>
        ))}
      </div>

      {/* Per-register table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">COMPANY NAME</th>
                <th className="px-4 py-3 text-right">KYC RECORDS</th>
                <th className="px-4 py-3 text-right">MISSING STATES</th>
                <th className="px-4 py-3 text-right">TRANSACTIONS</th>
                <th className="px-4 py-3 text-right">BUYS</th>
                <th className="px-4 py-3 text-right">SELLS</th>
                <th className="px-4 py-3 text-right">FLAGGED</th>
                <th className="px-4 py-3 text-right">FILES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {registers.map((reg) => (
                <tr key={reg.symbol} className="mrpsl-table-row">
                  <td className="px-4 py-3">
                    <Badge className="border-0 bg-primary/10 text-primary font-semibold text-sm">{reg.symbol}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium">{reg.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(reg.kycRecords)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">
                    <span className={reg.missingStates > 0 ? "text-amber-600 font-semibold" : ""}>
                      {formatNumber(reg.missingStates)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(reg.transactions)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-green-600">+{formatNumber(reg.buys)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600">−{formatNumber(reg.sells)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">
                    <span className={reg.flagged > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                      {formatNumber(reg.flagged)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[12px]" onClick={() => onKycClick(reg.symbol)}>
                        <FileText className="h-3 w-3 mr-1" /> KYC
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[12px]" onClick={() => onTxClick(reg.symbol)}>
                        <List className="h-3 w-3 mr-1" /> TX
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {registers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No registers found in this batch.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-muted-foreground">BATCH TOTALS</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(totals.kycRecords)}</td>
                <td className="px-4 py-2.5 text-right text-amber-600">{formatNumber(totals.missingStates)}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(totals.transactions)}</td>
                <td className="px-4 py-2.5 text-right text-green-600">+{formatNumber(totals.buys)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">−{formatNumber(totals.sells)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{formatNumber(totals.flagged)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={onProceed}>
          Resolve All KYC Files
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
