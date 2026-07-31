"use client";

import { useMemo } from "react";
import { CheckCircle2, ArrowRight, FileText, AlertTriangle, Users, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import {
  useCscsBatchSummary,
  useCscsTradeBalances,
  useFinalizeCscsBatch,
} from "@/hooks/useCscsPipeline";
import type { CscsTradeBalanceItem } from "@/actions/cscsPipelineActions";

interface StepApplyHandoffProps {
  batchRef: string;
  onViewLog: () => void;
}

export function StepApplyHandoff({ batchRef, onViewLog }: StepApplyHandoffProps) {
  const router = useRouter();

  const { data: summary, isLoading } = useCscsBatchSummary(batchRef);
  const { data: tradeBalances } = useCscsTradeBalances(batchRef, { status: "MULTI_ACCOUNT" });
  const finalize = useFinalizeCscsBatch();

  const multiAccountRows = useMemo(
    () => tradeBalances?.data?.filter((r) => r.status === "MULTI_ACCOUNT") ?? [],
    [tradeBalances],
  );

  // Group excluded rows by shareholder within a register.
  const multiAccountGroups = useMemo(() => {
    const map = new Map<string, CscsTradeBalanceItem[]>();
    for (const r of multiAccountRows) {
      const key = `${r.register}|${r.shareholderName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([key, rows]) => {
      const [register, ...nameParts] = key.split("|");
      return { shareholderName: nameParts.join("|"), register, rows };
    });
  }, [multiAccountRows]);

  const balancedCount = summary?.balancesApplied ?? 0;
  const flaggedCount = summary?.flaggedForRecon ?? 0;
  const registerCount = summary?.registersProcessed ?? 0;
  const excludedCount = summary?.multiAccountFlagged ?? multiAccountGroups.length;
  const isCompleted = summary?.status === "COMPLETED";

  const handleFinalize = () => {
    finalize.mutate(
      { batchRef },
      {
        onSuccess: () => toast.success(`Batch ${batchRef} finalized and marked COMPLETED.`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading batch summary…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Apply &amp; Hand-off</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Balanced trade transactions have been applied to live balances and written to the
          Processed Log. Flagged transactions have been sent to CSCS Update Reconciliation.
          {excludedCount > 0 && (
            <> Shareholders with multiple accounts were excluded and must be reconciled separately.</>
          )}
        </p>
      </div>

      {/* Outcome summary card */}
      <Card className="mrpsl-card p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? "bg-green-100" : "bg-blue-100"}`}>
              <CheckCircle2 className={`h-5 w-5 ${isCompleted ? "text-green-700" : "text-blue-700"}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {isCompleted ? "Batch Finalized" : "Ready to Finalize"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Batch <span className="font-mono">{batchRef}</span>
                {isCompleted ? " has been processed and marked COMPLETED." : " — review the summary, then finalize."}
              </p>
            </div>
          </div>
          {!isCompleted && (
            <Button onClick={handleFinalize} disabled={finalize.isPending}>
              {finalize.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Finalize Batch
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Applied (Balanced)</p>
            <p className="font-mono font-bold text-green-700 text-2xl">{formatNumber(balancedCount)}</p>
            <p className="text-xs text-muted-foreground mt-1">Shareholders updated</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Flagged (Shortfall)</p>
            <p className="font-mono font-bold text-amber-700 text-2xl">{formatNumber(flaggedCount)}</p>
            <p className="text-xs text-muted-foreground mt-1">Sent to Reconciliation</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registers</p>
            <p className="font-mono font-bold text-foreground text-2xl">{formatNumber(registerCount)}</p>
            <p className="text-xs text-muted-foreground mt-1">Processed</p>
          </div>
          {excludedCount > 0 ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Multi-Account Excluded</p>
              <p className="font-mono font-bold text-amber-700 text-2xl">{formatNumber(excludedCount)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending consolidation</p>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transactions Logged</p>
              <p className="font-mono font-bold text-blue-700 text-2xl">{formatNumber(summary?.transactionsLogged ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Written to processed log</p>
            </div>
          )}
        </div>

        {flaggedCount > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>{flaggedCount} transaction{flaggedCount !== 1 ? "s" : ""} did not balance out.</strong> These are shortfall
              SELLs — the shareholder appeared to sell more units than they held in that register. They
              have been routed to CSCS Update Reconciliation to identify the missing earlier purchase.
              {excludedCount > 0 && (
                <> Additionally, <strong>{excludedCount} shareholder{excludedCount !== 1 ? "s" : ""}</strong>{" "}
                with multiple accounts were excluded and are listed below.</>
              )}
            </p>
          </div>
        )}
      </Card>

      {/* Multi-account consolidation section */}
      {multiAccountGroups.length > 0 && (
        <Card className="mrpsl-card overflow-hidden border-amber-200">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50/60 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Shareholders Requiring Account Consolidation
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                These shareholders have multiple CHNs in the same register. Their trades are excluded
                from this batch until accounts are consolidated or certificates transferred.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">SHAREHOLDER</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">CHNs</th>
                  <th className="px-4 py-3 text-right">TOTAL BUYS</th>
                  <th className="px-4 py-3 text-right">TOTAL SELLS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {multiAccountGroups.map((group, i) => {
                  const totalBuys = group.rows.reduce((s, r) => s + r.totalBuys, 0);
                  const totalSells = group.rows.reduce((s, r) => s + r.totalSells, 0);
                  return (
                    <tr key={i} className="mrpsl-table-row bg-amber-50/30">
                      <td className="px-4 py-3 font-medium">{group.shareholderName}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 bg-gray-100 text-gray-800 text-[12px]">{group.register}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {group.rows.map((r) => (
                            <span key={r.id} className="font-mono text-[12px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {r.chn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-green-600">+{formatNumber(totalBuys)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-red-600">−{formatNumber(totalSells)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[12px] border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => router.push("/certificates/consolidation")}
                          >
                            Consolidate Accounts
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[12px]"
                            onClick={() => router.push(`/certificates/transfer?src=${encodeURIComponent(group.rows[0]?.chn ?? "")}`)}
                          >
                            Transfer Certificate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Next steps */}
      <Card className="mrpsl-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Next Steps</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="font-medium text-sm">Reconcile Flagged Transactions</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Resolve {flaggedCount} shortfall SELL{flaggedCount !== 1 ? "s" : ""} in the CSCS Update Reconciliation tab.
              </p>
            </div>
            <Button
              onClick={() => router.push(`/certificates/reconciliation?tab=cscs&batch=${encodeURIComponent(batchRef)}`)}
            >
              Proceed to Reconciliation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="font-medium text-sm">Review Processed Log</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                View every successfully applied transaction from this batch.
              </p>
            </div>
            <Button variant="outline" onClick={onViewLog}>
              <FileText className="h-4 w-4 mr-2" />
              View Processed Log
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
