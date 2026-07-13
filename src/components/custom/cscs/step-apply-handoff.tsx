"use client";

import { CheckCircle2, ArrowRight, FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface StepApplyHandoffProps {
  batchRef: string;
  onViewLog: () => void;
}

export function StepApplyHandoff({ batchRef, onViewLog }: StepApplyHandoffProps) {
  const router = useRouter();

  const BALANCED_COUNT  = 8;
  const FLAGGED_COUNT   = 4;
  const REGISTER_COUNT  = 4;
  const REGISTERS       = "DANGCEM · MTNN · SEPLAT · UBA";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Apply &amp; Hand-off</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Balanced trade transactions have been applied to live balances and written to the
          Processed Log. Flagged transactions have been sent to CSCS Update Reconciliation.
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
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Batch Status</p>
            <p className="font-mono font-bold text-blue-700 text-2xl">Done</p>
            <p className="text-xs text-muted-foreground mt-1">Marked COMPLETED</p>
          </div>
        </div>

        {FLAGGED_COUNT > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>{FLAGGED_COUNT} transactions did not balance out.</strong> These are shortfall
              SELLs — the shareholder appeared to sell more units than they held in that register. They
              have been routed to CSCS Update Reconciliation to identify the missing earlier purchase.
            </p>
          </div>
        )}
      </Card>

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
