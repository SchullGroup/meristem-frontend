"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, ChevronRight, Layers, Loader2 } from "lucide-react";
import { getAccountConsolidationSuggestions } from "@/actions/accountMaintenanceActions";
import { useGetRegisters } from "@/hooks/useRegisters";
import { formatNumber } from "@/lib/utils/format";

interface Props {
  /** Optional lead-in copy; defaults to the reconciliation phrasing. */
  description?: string;
}

/**
 * Read-only "fragmentation" discovery: shareholders (one CHN) holding 2+ accounts in a register.
 * Register-scoped; re-runs on register change and Refresh. Reused by the reconciliation tabs and
 * the CSCS transactions area. No mutations — pure discovery of accounts that need consolidation.
 */
export function FragmentationPanel({ description }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [registerId, setRegisterId] = useState<string>("");

  const { data: registers } = useGetRegisters({ size: 500, status: "ACTIVE" });

  const {
    data: rows = [],
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fragmentation-panel", registerId],
    queryFn: () => getAccountConsolidationSuggestions(registerId),
    enabled: !!registerId,
    select: (d) => d.data ?? [],
  });

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description ??
              "Shareholders holding more than one account (same CHN) in the selected register — fragmented accounts that are candidates for consolidation."}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Register</label>
            <select
              value={registerId}
              onChange={(e) => setRegisterId(e.target.value)}
              className="mrpsl-input h-9 min-w-[240px] rounded-md border px-3 text-sm"
            >
              <option value="">Select a register…</option>
              {registers?.content.map((r) => (
                <option key={r.registerId || r.symbol} value={r.symbol || r.registerId}>
                  {r.symbol ? `${r.symbol} — ${r.registerName}` : r.registerName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          disabled={!registerId || isFetching}
          onClick={() => refetch()}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {registerId && !isError && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Users className="h-4 w-4 shrink-0" />
          <span>
            {isFetching ? (
              "Searching…"
            ) : (
              <>
                <span className="font-semibold">{rows.length}</span> shareholder
                {rows.length === 1 ? "" : "s"} with 2 or more accounts in this register.
              </>
            )}
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(error as Error)?.message || "Failed to load fragmented accounts."}
        </div>
      )}

      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="w-8 p-3" />
              <th className="p-3">CHN</th>
              <th className="p-3">SUGGESTED NAME</th>
              <th className="p-3">BVN</th>
              <th className="p-3">REGISTER</th>
              <th className="p-3">ACCOUNTS</th>
              <th className="p-3">COMBINED UNITS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {rows.map((row) => {
              const isExpanded = expandedIds.has(row.chn);
              const combined = row.accounts.reduce((s, a) => s + (a.units ?? 0), 0);
              return (
                <Fragment key={row.chn}>
                  <tr
                    className="mrpsl-table-row cursor-pointer"
                    onClick={() => toggleExpanded(row.chn)}
                  >
                    <td className="p-3">
                      <button
                        type="button"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        className="flex h-5 w-5 items-center justify-center rounded border text-muted-foreground transition-colors hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(row.chn);
                        }}
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    </td>
                    <td className="p-3 font-mono">{row.chn}</td>
                    <td className="p-3 font-medium">{row.suggestedName ?? "—"}</td>
                    <td className="p-3 font-mono text-muted-foreground">{row.bvn ?? "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                          {row.registerId}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
                        {row.accountCount} accounts
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold tabular-nums">{formatNumber(combined)}</td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="bg-muted/30 px-8 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Accounts Detail &mdash; compare the PII below to confirm these accounts belong to the same person
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[900px] text-[12px]">
                            <thead>
                              <tr className="border-b text-muted-foreground">
                                <th className="py-1.5 pr-6 text-left font-medium">Account No</th>
                                <th className="py-1.5 pr-6 text-left font-medium">Name</th>
                                <th className="py-1.5 pr-6 text-left font-medium">Address</th>
                                <th className="py-1.5 pr-6 text-left font-medium">BVN</th>
                                <th className="py-1.5 pr-6 text-left font-medium">NIN</th>
                                <th className="py-1.5 pr-6 text-left font-medium">Phone</th>
                                <th className="py-1.5 pr-6 text-left font-medium">Email</th>
                                <th className="py-1.5 pr-6 text-left font-medium">DOB</th>
                                <th className="py-1.5 pr-6 text-left font-medium">Units</th>
                                <th className="py-1.5 text-left font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {row.accounts.map((acc) => (
                                <tr key={acc.holderId}>
                                  <td className="py-1.5 pr-6 font-mono whitespace-nowrap">{acc.accountNo}</td>
                                  <td className="py-1.5 pr-6">{acc.name ?? "—"}</td>
                                  <td
                                    className="max-w-[220px] truncate py-1.5 pr-6"
                                    title={acc.address ?? ""}
                                  >
                                    {acc.address ?? "—"}
                                  </td>
                                  <td className="py-1.5 pr-6 font-mono">{acc.bvn ?? "—"}</td>
                                  <td className="py-1.5 pr-6 font-mono">{acc.nin ?? "—"}</td>
                                  <td className="py-1.5 pr-6 font-mono whitespace-nowrap">{acc.phone ?? "—"}</td>
                                  <td
                                    className="max-w-[200px] truncate py-1.5 pr-6"
                                    title={acc.email ?? ""}
                                  >
                                    {acc.email ?? "—"}
                                  </td>
                                  <td className="py-1.5 pr-6 whitespace-nowrap">{acc.dateOfBirth ?? "—"}</td>
                                  <td className="py-1.5 pr-6 font-semibold tabular-nums">
                                    {formatNumber(acc.units ?? 0)}
                                  </td>
                                  <td className="py-1.5">
                                    <Badge className="bg-muted text-foreground">
                                      {acc.status ?? "—"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {registerId && !isFetching && rows.length === 0 && !isError && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  No fragmented accounts found for this register.
                </td>
              </tr>
            )}
            {!registerId && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  Select a register to check for fragmented accounts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
