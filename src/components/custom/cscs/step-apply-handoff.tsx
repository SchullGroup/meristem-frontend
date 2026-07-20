"use client";

import { CheckCircle2, ArrowRight, FileText, AlertTriangle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MultiAccountGroup } from "./step-compute-trades";
import { formatNumber } from "@/lib/utils/format";

interface StepApplyHandoffProps {
  batchRef: string;
  onViewLog: () => void;
  multiAccountGroups?: MultiAccountGroup[];
}

export function StepApplyHandoff({
  batchRef,
  onViewLog,
  multiAccountGroups = [],
}: StepApplyHandoffProps) {
  const router = useRouter();

  const BALANCED_COUNT = 8;
  const FLAGGED_COUNT  = 4;
  const REGISTER_COUNT = 4;
  const REGISTERS      = "DANGCEM · MTNN · SEPLAT · UBA";
  const excludedCount  = multiAccountGroups.length;

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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <p className="font-semibold text-sm">Batch Applied Successfully</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Batch <span className="font-mono">{batchRef}</span> has been processed and applied.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Applied (Balanced)</p>
            <p className="font-mono font-bold text-green-700 text-2xl">{BALANCED_COUNT}</p>
            <p className="text-xs text-muted-foreground mt-1">Shareholders updated</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Flagged (Shortfall)</p>
            <p className="font-mono font-bold text-amber-700 text-2xl">{FLAGGED_COUNT}</p>
            <p className="text-xs text-muted-foreground mt-1">Sent to Reconciliation</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registers</p>
            <p className="font-mono font-bold text-foreground text-2xl">{REGISTER_COUNT}</p>
            <p className="text-xs text-muted-foreground mt-1">{REGISTERS}</p>
          </div>
          {excludedCount > 0 ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Multi-Account Excluded</p>
              <p className="font-mono font-bold text-amber-700 text-2xl">{excludedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending consolidation</p>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Batch Status</p>
              <p className="font-mono font-bold text-blue-700 text-2xl">Done</p>
              <p className="text-xs text-muted-foreground mt-1">Marked COMPLETED</p>
            </div>
          )}
        </div>

        {FLAGGED_COUNT > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>{FLAGGED_COUNT} transactions did not balance out.</strong> These are shortfall
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
                  const totalBuys  = group.rows.reduce((s, r) => s + r.totalBuys, 0);
                  const totalSells = group.rows.reduce((s, r) => s + r.totalSells, 0);
                  return (
                    <tr key={i} className="mrpsl-table-row bg-amber-50/30">
                      <td className="px-4 py-3 font-medium">{group.shareholderName}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 bg-gray-100 text-gray-800 text-[12px]">
                          {group.register}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {group.rows.map((r) => (
                            <span
                              key={r.id}
                              className="font-mono text-[12px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                            >
                              {r.chn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-green-600">
                        +{formatNumber(totalBuys)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-red-600">
                        −{formatNumber(totalSells)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[12px] border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() =>
                              toast.info(
                                `Consolidation workflow for ${group.shareholderName} — coming soon.`,
                              )
                            }
                          >
                            Consolidate Accounts
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[12px]"
                            onClick={() =>
                              toast.info(
                                `Certificate transfer for ${group.shareholderName} — coming soon.`,
                              )
                            }
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
                Resolve {FLAGGED_COUNT} shortfall SELLs in the CSCS Update Reconciliation tab.
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(
                  `/certificates/reconciliation?tab=cscs&batch=${encodeURIComponent(batchRef)}`,
                )
              }
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
