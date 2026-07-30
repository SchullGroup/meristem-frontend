"use client";

import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { useCscsProcessedLog, useCscsBatchRegisters } from "@/hooks/useCscsPipeline";

interface ProcessedLogViewProps {
  batchRef?: string;
}

export function ProcessedLogView({ batchRef }: ProcessedLogViewProps) {
  const [search, setSearch] = useState("");
  const [regFilter, setRegFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "BUY" | "SELL">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: registersData } = useCscsBatchRegisters(batchRef);
  const registerOptions = registersData?.registers.map((r) => r.symbol) ?? [];

  const { data, isLoading, isError, error } = useCscsProcessedLog(batchRef, {
    register: regFilter === "All" ? undefined : regFilter,
    type: typeFilter === "All" ? undefined : typeFilter,
    q: search || undefined,
    page,
    pageSize,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const totals = data?.totals ?? { buys: 0, sells: 0 };
  const meta = data?.meta;

  const fmtDate = (v: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : format(d, "dd MMM yyyy");
  };

  return (
    <div className="space-y-4">
      {/* Controls + running totals */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 w-2/3 min-w-80">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search CHN, holder, transfer no…"
              className="pl-9 mrpsl-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <Select value={regFilter} onValueChange={(v) => { setRegFilter(v ?? "All"); setPage(1); }}>
            <SelectTrigger className="w-40 mrpsl-input">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Registers</SelectItem>
              {registerOptions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter((v as "All" | "BUY" | "SELL") ?? "All"); setPage(1); }}>
            <SelectTrigger className="w-32 mrpsl-input">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-4 text-[13px] text-muted-foreground">
          <span className="text-green-600 font-semibold tabular-nums">Buys: +{formatNumber(totals.buys)}</span>
          <span className="text-red-600 font-semibold tabular-nums">Sells: −{formatNumber(totals.sells)}</span>
          <span className="font-medium">{meta?.total ?? 0} record{(meta?.total ?? 0) !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">BATCH REF</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">TRANSFER NO</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3 text-right">UNITS</th>
                <th className="px-4 py-3 text-right">BALANCE AFTER</th>
                <th className="px-4 py-3">PROCESSED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading processed log…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-red-600 text-sm">
                    {(error as Error)?.message ?? "Failed to load processed log."}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && rows.map((row) => (
                <tr key={row.id} className="mrpsl-table-row">
                  <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{fmtDate(row.date)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.batchRef}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.chn}</td>
                  <td className="px-4 py-3">
                    <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.register}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-sm">{row.holder}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.transferNo ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 text-[13px] ${row.type === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                      {row.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatNumber(row.units)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(row.balanceAfter)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.processedBy ?? "—"}</td>
                </tr>
              ))}
              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.total > 0 && (
          <PaginationBar
            page={page - 1}
            total={meta.total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p + 1)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            pageBase={0}
          />
        )}
      </Card>
    </div>
  );
}
