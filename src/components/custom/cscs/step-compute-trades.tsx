"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Loader2, Lock } from "lucide-react";
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
import { TablePagination } from "@/components/custom/table-pagination";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import {
  useCscsTradeBalances,
  useCscsBatchRegisters,
  useApplyCscsTradeBalances,
} from "@/hooks/useCscsPipeline";

interface StepComputeTradesProps {
  batchRef: string;
  onProceed: () => void;
  initialRegister?: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "BALANCED", label: "Balanced" },
  { value: "FLAGGED", label: "Flagged (shortfall)" },
  { value: "MULTI_ACCOUNT", label: "Multiple accounts" },
];

export function StepComputeTrades({ batchRef, onProceed, initialRegister }: StepComputeTradesProps) {
  const router = useRouter();
  const [registerFilter, setRegisterFilter] = useState(initialRegister ?? "All");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: registersData } = useCscsBatchRegisters(batchRef);
  const registerOptions = registersData?.registers.map((r) => r.symbol) ?? [];

  const { data, isLoading, isError, error } = useCscsTradeBalances(
    batchRef,
    {
      register: registerFilter === "All" ? undefined : registerFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      pageSize,
    },
    // Poll while a background apply is running; stop once applied.
    (query) => {
      const s = query.state.data?.summary;
      return s?.applying && !s?.applied ? 2500 : false;
    },
  );

  const rows = data?.data ?? [];
  const summary = data?.summary;
  const meta = data?.meta;

  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Once balances are applied, the screen is display-only — no re-apply.
  const applied = summary?.applied ?? false;
  const applying = summary?.applying ?? false;

  const apply = useApplyCscsTradeBalances();
  const handleUpdateBalances = () => {
    apply.mutate(
      { batchRef },
      {
        onSuccess: () => {
          toast.success("Applying balances… this runs in the background and may take a little while.");
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Trade Balances</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Precomputed at ingestion — one row per resolved shareholder per register. BUYs are processed
          before SELLs; the opening balance is each shareholder&apos;s <em>dematerialised</em> (CSCS-lodged)
          units, since paper certificates cannot be sold at CSCS. Rows that do not balance are flagged
          and routed to Reconciliation — never force-processed. Shareholders with multiple accounts in
          the same register are excluded until consolidated.
        </p>
      </div>

      {/* Summary cards (whole batch / register scope, all statuses) */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shareholders</p>
          <p className="font-mono font-bold text-lg">{formatNumber(summary?.total ?? 0)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-green-50">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Balanced</p>
          <p className="font-mono font-bold text-lg text-green-700">{formatNumber(summary?.balanced ?? 0)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-red-50">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Flagged (Shortfall)</p>
          <p className="font-mono font-bold text-lg text-red-700">{formatNumber(summary?.flagged ?? 0)}</p>
        </Card>
        <Card className="mrpsl-card p-4 bg-amber-50">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Multiple Accounts</p>
          <p className="font-mono font-bold text-lg text-amber-700">{formatNumber(summary?.multiAccount ?? 0)}</p>
        </Card>
      </div>

      {/* Anti-ghost-seller notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Anti-Ghost Seller Protocol Active</strong> — BUYs are processed before SELLs within each
          shareholder&apos;s batch. Shortfall SELLs are flagged and sent to Reconciliation — never force-processed.
        </p>
      </div>

      {/* PII-chain note */}
      <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">
          Each CHN is resolved to a shareholder via a PII chain (BVN → phone → bank account → name),
          because the same person can hold different CHNs across registers. Balances are totalled per
          shareholder <em>per register</em>.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={registerFilter}
          onValueChange={(v) => { setRegisterFilter(v ?? "All"); setPage(1); }}
        >
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

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(1); }}
        >
          <SelectTrigger className="w-52 mrpsl-input">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trade balances table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">SHAREHOLDER NAME</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3 text-right">OPENING (DEMAT)</th>
                <th className="px-4 py-3 text-right">TOTAL BUYS</th>
                <th className="px-4 py-3 text-right">TOTAL SELLS</th>
                <th className="px-4 py-3 text-right">BALANCE AFTER TRADE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading trade balances…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-red-600 text-sm">
                    {(error as Error)?.message ?? "Failed to load trade balances."}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No trade balances for this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isFlagged = row.status === "FLAGGED";
                  const isMulti = row.status === "MULTI_ACCOUNT";
                  return (
                    <tr key={row.id} className={`mrpsl-table-row ${isFlagged ? "bg-red-50/40 dark:bg-red-950/10" : isMulti ? "bg-amber-50/40" : ""}`}>
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
                        ) : isMulti ? (
                          <Badge className="bg-amber-100 text-amber-800 border-0 text-[12px]">Multiple accounts</Badge>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-700 text-[13px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isFlagged ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[13px] border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() =>
                              router.push(`/certificates/reconciliation?tab=cscs&batch=${encodeURIComponent(batchRef)}`)
                            }
                          >
                            Reconcile Trade
                          </Button>
                        ) : isMulti ? (
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
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && total > 0 && (
          <div className="px-4 py-2 border-t">
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              from={from}
              to={to}
              total={total}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            />
          </div>
        )}
      </Card>

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
      ) : applying ? (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900">
          <Loader2 className="h-4 w-4 animate-spin text-blue-700 shrink-0" />
          <span>
            <strong>Applying balances…</strong> This runs in the background — you can leave this page and come
            back; the screen updates automatically when it&apos;s done.
          </span>
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
