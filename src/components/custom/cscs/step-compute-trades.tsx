"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Users, Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import {
  useCscsTradeBalances,
  useCscsBatchRegisters,
  useApplyCscsTradeBalances,
} from "@/hooks/useCscsPipeline";
import type { CscsTradeBalanceItem } from "@/actions/cscsPipelineActions";

interface StepComputeTradesProps {
  batchRef: string;
  onProceed: () => void;
  initialRegister?: string;
}

export function StepComputeTrades({ batchRef, onProceed, initialRegister }: StepComputeTradesProps) {
  const router = useRouter();
  const [registerFilter, setRegisterFilter] = useState(initialRegister ?? "All");

  const { data: registersData } = useCscsBatchRegisters(batchRef);
  const registerOptions = registersData?.registers.map((r) => r.symbol) ?? [];

  const { data, isLoading, isError, error } = useCscsTradeBalances(batchRef, {
    register: registerFilter === "All" ? undefined : registerFilter,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const summary = data?.summary;

  const singleAccountRows = rows.filter((r) => r.status !== "MULTI_ACCOUNT");
  const multiAccountRows = rows.filter((r) => r.status === "MULTI_ACCOUNT");

  const balancedCount = summary?.balanced ?? singleAccountRows.filter((r) => r.status === "BALANCED").length;
  const flaggedCount = summary?.flagged ?? singleAccountRows.filter((r) => r.status === "FLAGGED").length;
  const multiAccountCount = summary?.multiAccount ?? 0;
  // Once balances are applied, the screen is display-only — no recompute, no re-apply.
  const applied = summary?.applied ?? false;

  // Group excluded rows by shareholder within a register (for the consolidation hand-off table).
  const multiAccountGroups = useMemo(() => {
    const map = new Map<string, CscsTradeBalanceItem[]>();
    for (const r of multiAccountRows) {
      const key = `${r.register}|${r.shareholderName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([key, groupRows]) => {
      const [register, ...nameParts] = key.split("|");
      return { shareholderName: nameParts.join("|"), register, rows: groupRows };
    });
  }, [multiAccountRows]);

  const apply = useApplyCscsTradeBalances();
  const handleUpdateBalances = () => {
    apply.mutate(
      { batchRef },
      {
        onSuccess: (res) => {
          toast.success(
            `Balances applied for ${res.appliedCount} shareholder${res.appliedCount !== 1 ? "s" : ""}. ` +
              `${res.flaggedCount} flagged transaction${res.flaggedCount !== 1 ? "s" : ""} sent to Reconciliation.` +
              ((res.multiAccountCount ?? 0) > 0
                ? ` ${res.multiAccountCount} shareholder${res.multiAccountCount !== 1 ? "s" : ""} with multiple accounts excluded — review in Apply & Hand-off.`
                : ""),
          );
          onProceed();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Computing trade balances…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center text-red-600 text-sm">
        {(error as Error)?.message ?? "Failed to compute trade balances."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Compute Trade Balances</h3>
        <p className="text-sm text-muted-foreground mt-1">
          One row per resolved shareholder per register. BUY transactions are processed before SELL.
          Rows that do not balance are flagged and routed to Reconciliation — never force-processed.
          Shareholders with multiple accounts in the same register are excluded until consolidated.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shareholders</p>
          <p className="font-mono font-bold text-lg">{formatNumber(singleAccountRows.length)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-green-50">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Balanced</p>
          <p className="font-mono font-bold text-lg text-green-700">{formatNumber(balancedCount)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-red-50">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Flagged (Shortfall)</p>
          <p className="font-mono font-bold text-lg text-red-700">{formatNumber(flaggedCount)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-amber-50">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Multiple Accounts</p>
          <p className="font-mono font-bold text-lg text-amber-700">{formatNumber(multiAccountCount)}</p>
        </Card>
      </div>

      {/* Multi-account banner */}
      {multiAccountGroups.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Users className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>{multiAccountGroups.length} shareholder{multiAccountGroups.length !== 1 ? "s" : ""} have multiple accounts in the same register.</strong>{" "}
            Their trades are excluded from this batch — accounts must be consolidated or certificates
            transferred before their transactions can be applied.
          </p>
        </div>
      )}

      {/* Anti-ghost-seller notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Anti-Ghost Seller Protocol Active</strong> — BUY transactions are processed before SELL
          within each shareholder&apos;s batch. Shortfall SELLs are flagged and sent to Reconciliation — never
          force-processed.
        </p>
      </div>

      {/* PII-chain note */}
      <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">
          Each CHN is resolved to a shareholder via a PII chain:{" "}
          <span className="font-mono">find user WHERE CHN = … OR BVN = … OR PHONE = … OR BANK_ACCOUNT = …</span>{" "}
          — because the same person can hold different CHNs across registers. Balances are totalled
          per shareholder <em>per register</em>.
        </p>
      </div>

      {/* Register filter */}
      <div className="flex items-center gap-2">
        <Select value={registerFilter} onValueChange={(v) => setRegisterFilter(v ?? "All")}>
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Registers</SelectItem>
            {registerOptions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Main trade balances table (single-account holders) ── */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Trade Balances — Single Account Holders
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">SHAREHOLDER NAME</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3 text-right">ORIGINAL UNITS</th>
                <th className="px-4 py-3 text-right">TOTAL BUYS</th>
                <th className="px-4 py-3 text-right">TOTAL SELLS</th>
                <th className="px-4 py-3 text-right">BALANCE AFTER TRADE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {singleAccountRows.map((row) => {
                const isFlagged = row.status === "FLAGGED";
                return (
                  <tr key={row.id} className={`mrpsl-table-row ${isFlagged ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                    <td className="px-4 py-3">
                      <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.register}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.shareholderName}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.chn}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(row.originalUnits)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-green-600">+{formatNumber(row.totalBuys)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600">−{formatNumber(row.totalSells)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-mono font-semibold ${isFlagged ? "text-red-600" : ""}`}>
                      {formatNumber(row.balanceAfter)}
                    </td>
                    <td className="px-4 py-3">
                      {isFlagged ? (
                        <div className="flex items-center gap-1.5 text-red-600 text-[13px]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Flagged
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-700 text-[13px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isFlagged && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[13px] border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() =>
                            router.push(
                              `/certificates/reconciliation?tab=cscs&batch=${encodeURIComponent(batchRef)}`,
                            )
                          }
                        >
                          Reconcile Trade
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {singleAccountRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No single-account trade balances for this filter.
                  </td>
                </tr>
              )}
            </tbody>
            {singleAccountRows.length > 0 && (
              <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-right text-muted-foreground">TOTALS</td>
                  <td className="px-4 py-2.5 text-right">{formatNumber(singleAccountRows.reduce((a, r) => a + r.originalUnits, 0))}</td>
                  <td className="px-4 py-2.5 text-right text-green-600">+{formatNumber(singleAccountRows.reduce((a, r) => a + r.totalBuys, 0))}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">−{formatNumber(singleAccountRows.reduce((a, r) => a + r.totalSells, 0))}</td>
                  <td className="px-4 py-2.5 text-right">{formatNumber(singleAccountRows.reduce((a, r) => a + r.balanceAfter, 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* ── Multi-account exclusion table ── */}
      {multiAccountRows.length > 0 && (
        <Card className="mrpsl-card overflow-hidden border-amber-200">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-50/60 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Excluded — Multiple Accounts in Same Register
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">SHAREHOLDER NAME</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3 text-right">ORIGINAL UNITS</th>
                  <th className="px-4 py-3 text-right">TOTAL BUYS</th>
                  <th className="px-4 py-3 text-right">TOTAL SELLS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {multiAccountRows.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row bg-amber-50/40">
                    <td className="px-4 py-3">
                      <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.register}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.shareholderName}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {row.chn}
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">Multiple</Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(row.originalUnits)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-green-600">+{formatNumber(row.totalBuys)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600">−{formatNumber(row.totalSells)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[12px] border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => router.push("/certificates/consolidation")}
                        >
                          Consolidate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[12px]"
                          onClick={() => router.push(`/certificates/transfer?src=${encodeURIComponent(row.chn)}`)}
                        >
                          Transfer Certs
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {applied ? (
        <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <Lock className="h-4 w-4 text-green-700 shrink-0" />
            <span>
              <strong>Balances applied.</strong> Shareholder units have already been updated for this
              batch — this screen is now read-only.
            </span>
          </div>
          <Button variant="outline" onClick={onProceed}>
            Continue to Apply &amp; Hand-off
            <CheckCircle2 className="h-4 w-4 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="flex justify-end pt-2">
          <Button onClick={handleUpdateBalances} disabled={apply.isPending}>
            {apply.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Update Balances
          </Button>
        </div>
      )}
    </div>
  );
}
