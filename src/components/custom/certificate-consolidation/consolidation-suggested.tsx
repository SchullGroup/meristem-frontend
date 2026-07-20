"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, ChevronRight, Layers } from "lucide-react";
import { MOCK_SUGGESTIONS, SuggestedConsolidation } from "./consolidation-mock";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  onCreateFromSuggestion: (suggestion: SuggestedConsolidation) => void;
}

export function ConsolidationSuggested({ onCreateFromSuggestion }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-2xl">
          The system automatically identifies shareholders who hold certificates
          in the same register across multiple accounts. These are candidates
          for consolidation.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => toast.info("Suggestion list refreshed.")}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <Users className="h-4 w-4 shrink-0" />
        <span>
          Showing{" "}
          <span className="font-semibold">{MOCK_SUGGESTIONS.length}</span>{" "}
          suggested consolidation candidates &mdash; shareholders with 2 or
          more accounts in the same register.
        </span>
      </div>

      {/* Suggestion Table */}
      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="w-8 p-3" />
              <th className="p-3">HOLDER NAME</th>
              <th className="p-3">BVN</th>
              <th className="p-3">REGISTER</th>
              <th className="p-3">ACCOUNTS</th>
              <th className="p-3">TOTAL CERTS</th>
              <th className="p-3">COMBINED UNITS</th>
              <th className="p-3">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {MOCK_SUGGESTIONS.map((row) => {
              const isExpanded = expandedIds.has(row.id);
              const totalCerts = row.accounts.reduce(
                (sum, acc) => sum + acc.certCount,
                0,
              );

              return (
                <>
                  <tr
                    key={row.id}
                    className="mrpsl-table-row cursor-pointer"
                    onClick={() => toggleExpanded(row.id)}
                  >
                    {/* Expand toggle */}
                    <td className="p-3">
                      <button
                        type="button"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        className="flex h-5 w-5 items-center justify-center rounded border text-muted-foreground transition-colors hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(row.id);
                        }}
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    </td>

                    {/* Holder Name */}
                    <td className="p-3 font-medium">{row.holderName}</td>

                    {/* BVN */}
                    <td className="p-3 font-mono text-muted-foreground">
                      {row.bvn}
                    </td>

                    {/* Register */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                          {row.register}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.registerName}
                      </p>
                    </td>

                    {/* Accounts count */}
                    <td className="p-3">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
                        {row.accounts.length} accounts
                      </Badge>
                    </td>

                    {/* Total Certs */}
                    <td className="p-3 tabular-nums">{totalCerts}</td>

                    {/* Combined Units */}
                    <td className="p-3 font-semibold tabular-nums">
                      {formatNumber(row.combinedUnits)}
                    </td>

                    {/* Action */}
                    <td
                      className="p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        onClick={() => onCreateFromSuggestion(row)}
                      >
                        Create Consolidation Request
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded accounts detail sub-table */}
                  {isExpanded && (
                    <tr key={`${row.id}-detail`}>
                      <td colSpan={8} className="bg-muted/30 px-8 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Accounts Detail &mdash; {row.registerName}
                        </p>
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="py-1.5 pr-6 text-left font-medium">
                                Account No
                              </th>
                              <th className="py-1.5 pr-6 text-left font-medium">
                                CHN
                              </th>
                              <th className="py-1.5 pr-6 text-left font-medium">
                                Certificates
                              </th>
                              <th className="py-1.5 text-left font-medium">
                                Units
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {row.accounts.map((acc) => (
                              <tr key={acc.accountNo}>
                                <td className="py-1.5 pr-6 font-mono">
                                  {acc.accountNo}
                                </td>
                                <td className="py-1.5 pr-6 font-mono text-muted-foreground">
                                  {acc.chn}
                                </td>
                                <td className="py-1.5 pr-6 tabular-nums">
                                  {acc.certCount} cert
                                  {acc.certCount !== 1 ? "s" : ""}
                                </td>
                                <td className="py-1.5 font-semibold tabular-nums">
                                  {formatNumber(acc.totalUnits)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {MOCK_SUGGESTIONS.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-12 text-center text-muted-foreground"
                >
                  No consolidation candidates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
