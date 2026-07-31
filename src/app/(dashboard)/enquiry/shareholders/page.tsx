"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  TrendingDown,
  LayoutGrid,
  Rows3,
  Loader2,
} from "lucide-react";
import { TablePagination } from "@/components/custom/table-pagination";
import { ShareholderSearchInput } from "@/components/custom/shareholder-search-input";
import { ShareholderQueryBuilder } from "@/components/custom/shareholder-query-builder";
import { ShareholderResultCard } from "@/components/custom/shareholder-result-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getShareholderSummary } from "@/actions/enquiryActions";
import { useSearchShareholders } from "@/hooks/useEnquiry";
import { useGetRegisters } from "@/hooks/useRegisters";
import type { ShareholderSearchCriteria } from "@/types/enquiry";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DORMANT: "bg-gray-100 text-gray-600",
  CAUTIONED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-800",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  DORMANT: "Inactive",
  CAUTIONED: "Cautioned",
  SUSPENDED: "Suspended",
};

type AppliedCriteria = Omit<ShareholderSearchCriteria, "page" | "size" | "sort">;
const EMPTY_CRITERIA: AppliedCriteria = { combinator: "AND", rules: [] };

export default function ShareholderRegisterPage() {
  const router = useRouter();

  const [applied, setApplied] = useState<AppliedCriteria>(EMPTY_CRITERIA);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [view, setView] = useState<"cards" | "table">("cards");

  const { data: registersData } = useGetRegisters({ size: 100 });
  const registers = useMemo(
    () =>
      (registersData?.content ?? [])
        .filter((r) => r?.status === "ACTIVE")
        .map((r) => ({ symbol: r.symbol, registerName: r.registerName })),
    [registersData],
  );

  const criteria: ShareholderSearchCriteria = useMemo(
    () => ({ ...applied, page, size: pageSize, sort: "createdAt,desc" }),
    [applied, page, pageSize],
  );

  const { data, isFetching, error } = useSearchShareholders(criteria);

  // Summary is a wholly independent query — the (server-cached, background-refreshed) aggregates
  // never block the paginated result list from rendering. Scoped to the applied register.
  const { data: summaryData } = useQuery({
    queryKey: ["shareholderSummary", applied.registerSymbol ?? ""],
    queryFn: () => getShareholderSummary(applied.registerSymbol || undefined),
  });

  const rows = data?.content ?? [];
  const summary = summaryData?.data;
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  function goToHolder(s: { id: string }) {
    router.push(`/enquiry/holder?id=${s.id}`);
  }

  function applySearch(next: AppliedCriteria) {
    setApplied(next);
    setPage(0);
  }
  function clearSearch() {
    setApplied(EMPTY_CRITERIA);
    setPage(0);
  }

  const stats = [
    { label: "Total", value: summary?.totalShareholders ?? 0, icon: Users, color: "" },
    { label: "Active", value: summary?.activeCount ?? 0, icon: TrendingUp, color: "text-green-600" },
    { label: "Inactive", value: summary?.dormantCount ?? 0, icon: TrendingDown, color: "text-gray-500" },
    { label: "Cautioned", value: summary?.cautionedCount ?? 0, icon: null, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Header + summary stats */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shareholder Register</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search and inspect shareholders across registers
          </p>
        </div>
        <div className="flex gap-3 shrink-0 flex-wrap">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="px-4 py-2.5 flex items-center gap-3 min-w-22.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className={`text-lg font-bold tabular-nums mt-0.5 ${color}`}>
                  {value.toLocaleString()}
                </p>
              </div>
              {Icon && <Icon className={`h-5 w-5 ml-auto opacity-30 ${color}`} />}
            </Card>
          ))}
        </div>
      </div>

      {/* Quick jump-to-holder typeahead */}
      <ShareholderSearchInput
        registerSymbol={applied.registerSymbol ?? ""}
        className="w-full"
        placeholder="Quick find — type a surname, account no or CHN to jump straight to a holder…"
        onSelect={goToHolder}
      />

      {/* Interactive query builder */}
      <ShareholderQueryBuilder
        registers={registers}
        onSearch={applySearch}
        onClear={clearSearch}
        loading={isFetching}
      />

      {/* Results toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[13px] text-muted-foreground">
          {isFetching ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </span>
          ) : (
            <span>
              <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
              {total === 1 ? "shareholder" : "shareholders"}
              {summary && summary.totalHoldings > 0 && (
                <>
                  {" · "}
                  <span className="font-mono font-semibold text-foreground">
                    {summary.totalHoldings.toLocaleString()}
                  </span>{" "}
                  units in scope
                </>
              )}
            </span>
          )}
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
          <button
            onClick={() => setView("cards")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              view === "cards"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> Cards
          </button>
          <button
            onClick={() => setView("table")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              view === "table"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows3 className="h-4 w-4" /> Table
          </button>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <Card className="mrpsl-card p-14 text-center text-red-500 text-sm font-medium">
          Failed to load shareholders. Please try again.
        </Card>
      ) : !isFetching && rows.length === 0 ? (
        <Card className="mrpsl-card p-14 text-center text-muted-foreground text-sm">
          No shareholders match the current search.
        </Card>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {isFetching && rows.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={`sk-${i}`} className="mrpsl-card p-4 h-52 animate-pulse bg-muted/40" />
              ))
            : rows.map((s) => (
                <ShareholderResultCard key={s.id} shareholder={s} onClick={() => goToHolder(s)} />
              ))}
        </div>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-3 py-2.5">ACCOUNT NO</th>
                  <th className="px-3 py-2.5">HOLDER NAME</th>
                  <th className="px-3 py-2.5">CHN</th>
                  <th className="px-3 py-2.5">BVN</th>
                  <th className="px-3 py-2.5">NIN</th>
                  <th className="px-3 py-2.5 text-right">HOLDINGS</th>
                  <th className="px-3 py-2.5">STATUS</th>
                  <th className="px-3 py-2.5">REGISTER</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => goToHolder(s)}
                    className="transition-colors text-[13px] cursor-pointer hover:bg-muted/30"
                  >
                    <td className="px-3 py-2.5 font-mono font-medium">{s.accountNumber}</td>
                    <td className="px-3 py-2.5 font-medium">
                      {s.lastName}, {s.firstName}
                      {s.otherNames ? ` ${s.otherNames}` : ""}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.chn}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.bvn || "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.nin || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {(s.holdings ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        className={`${STATUS_BADGE[s.status] || "bg-gray-100 text-gray-800"} border-0 text-[11px] font-semibold`}
                      >
                        {STATUS_LABEL[s.status] || s.status || "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.registerSymbol || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {rows.length > 0 && (
        <Card className="mrpsl-card px-4 py-2">
          <TablePagination
            page={page + 1}
            pageSize={pageSize}
            totalPages={totalPages}
            from={from}
            to={to}
            total={total}
            onPageChange={(p) => setPage(p - 1)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(0);
            }}
          />
        </Card>
      )}
    </div>
  );
}
