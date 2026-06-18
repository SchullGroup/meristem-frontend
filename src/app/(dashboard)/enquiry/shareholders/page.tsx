"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, TrendingDown, X, Loader2 } from "lucide-react";
import { TablePagination } from "@/components/custom/table-pagination";
import { ShareholderSearchInput } from "@/components/custom/shareholder-search-input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  getShareholders,
  getShareholderSummary,
} from "@/actions/enquiryActions";
import { useGetRegisters } from "@/hooks/useRegisters";

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

const STATUS_ROW_BG: Record<string, string> = {
  ACTIVE: "",
  DORMANT: "",
  CAUTIONED: "bg-amber-50/40",
  SUSPENDED: "bg-red-50/30",
};

export default function ShareholderRegisterPage() {
  const router = useRouter();

  const [registerFilter, setRegisterFilter] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const { data: registersData, isLoading: isRegisterLoading } = useGetRegisters(
    {
      size: 100,
    },
  );
  const registerlist = registersData?.content;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "shareholders",
      page,
      pageSize,
      debouncedSearch,
      registerFilter,
      statusFilter,
    ],
    queryFn: () =>
      getShareholders({
        page,
        size: pageSize,
        q: debouncedSearch || undefined,
        registerSymbol: registerFilter || undefined,
        status: (statusFilter as any) || undefined,
      }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["shareholderSummary", registerFilter],
    queryFn: () => getShareholderSummary(registerFilter || undefined),
  });

  const shareholdersData = data?.content || [];

  const registerMap = useMemo(
    () => new Map((registerlist ?? []).map((r) => [r.registerId, r])),
    [registerlist],
  );

  const summary = summaryData?.data;
  const totalShareholdersCount = summary?.totalShareholders ?? 0;
  const activeCount = summary?.activeCount ?? 0;
  const dormantCount = summary?.dormantCount ?? 0;
  const cautionedCount = summary?.cautionedCount ?? 0;
  const totalHoldings = useMemo(() => {
    const activeFilters =
      registerFilter !== "" || search.trim() !== "" || statusFilter !== "";
    if (activeFilters) {
      return shareholdersData.reduce((sum, s) => sum + (s.holdings || 0), 0);
    }
    return summary?.totalHoldings ?? 0;
  }, [registerFilter, search, statusFilter, shareholdersData, summary]);

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  function clearFilters() {
    setRegisterFilter("");
    setSearch("");
    setStatusFilter("");
    setPage(0);
  }

  const hasFilters =
    registerFilter !== "" || search.trim() !== "" || statusFilter !== "";

  function goToHolder(s: { id: string }) {
    router.push(`/enquiry/holder?id=${s.id}`);
  }

  return (
    <div className="space-y-5">
      {/* ── Page header + summary stats ── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Shareholder Register
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View, search and inspect all shareholders across registers
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {[
            {
              label: "Total",
              value: totalShareholdersCount,
              icon: Users,
              color: "",
            },
            {
              label: "Active",
              value: activeCount,
              icon: TrendingUp,
              color: "text-green-600",
            },
            {
              label: "Inactive",
              value: dormantCount,
              icon: TrendingDown,
              color: "text-gray-500",
            },
            {
              label: "Cautioned",
              value: cautionedCount,
              icon: null,
              color: "text-amber-600",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card
              key={label}
              className="px-4 py-2.5 flex items-center gap-3 min-w-[90px]"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className={`text-lg font-bold tabular-nums mt-0.5 ${color}`}>
                  {value.toLocaleString()}
                </p>
              </div>
              {Icon && (
                <Icon className={`h-5 w-5 ml-auto opacity-30 ${color}`} />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ── Search bar ── */}
      <ShareholderSearchInput
        registerSymbol={registerFilter}
        className="w-full"
        placeholder="Search shareholders — type a surname, account no or CHN to see suggestions…"
        onSelect={goToHolder}
        onQueryChange={setSearch}
        value={search}
      />

      {/* ── Filter bar ── */}
      <div className="flex gap-2.5 items-center flex-wrap">
        <Select
          value={registerFilter}
          onValueChange={(v) => {
            setRegisterFilter(v || "");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px] mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            {isRegisterLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <SelectItem value="">All Registers</SelectItem>
                {registerlist
                  ?.filter((r) => r?.status === "ACTIVE")
                  .map((r) => (
                    <SelectItem key={r.registerId} value={r?.symbol}>
                      {r?.registerName} - {r?.symbol}
                    </SelectItem>
                  ))}
              </>
            )}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v || "");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[150px] mrpsl-input">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DORMANT">Inactive</SelectItem>
            <SelectItem value="CAUTIONED">Cautioned</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground gap-1"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}

        <div className="ml-auto text-[12px] text-muted-foreground self-center">
          {totalHoldings > 0 && (
            <span>
              {hasFilters ? "Total filtered holdings" : "Total Holdings"}:{" "}
              <span className="font-mono font-semibold text-foreground">
                {totalHoldings.toLocaleString()}
              </span>{" "}
              units
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-3 py-2.5 w-10">#</th>
              <th className="px-3 py-2.5">ACCOUNT NO</th>
              <th className="px-3 py-2.5">HOLDER NAME</th>
              <th className="px-3 py-2.5">CHN</th>
              <th className="px-3 py-2.5 text-right">HOLDINGS</th>
              <th className="px-3 py-2.5">STATUS</th>
              <th className="px-3 py-2.5">REGISTER</th>
              <th className="px-3 py-2.5">TYPE</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="px-3 py-3">
                    <div className="h-4 w-5 bg-muted rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-24 bg-muted rounded font-mono" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-40 bg-muted rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-24 bg-muted rounded font-mono" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-20 bg-muted rounded ml-auto" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-12 bg-muted rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-20 bg-muted rounded" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-14 text-center text-red-500 text-sm font-medium"
                >
                  Failed to load shareholders. Please try again.
                </td>
              </tr>
            ) : shareholdersData.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-14 text-center text-muted-foreground text-sm"
                >
                  No shareholders match the current filters.
                </td>
              </tr>
            ) : (
              shareholdersData.map((s, idx) => {
                const reg = registerMap.get(s.registerId);
                return (
                  <tr
                    key={s.id}
                    onClick={() => goToHolder(s)}
                    className={[
                      "cursor-pointer transition-colors text-[13px] cursor-pointer",
                      STATUS_ROW_BG[s.status] || "",
                      "hover:bg-muted/30",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                      {from + idx}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-medium">
                      {s.accountNumber}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {s.lastName}, {s.firstName}
                      {s.otherNames ? ` ${s.otherNames}` : ""}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">
                      {s.chn}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {s.holdings.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        className={`${STATUS_BADGE[s.status] || "bg-gray-100 text-gray-800"} border-0 text-[11px] font-semibold`}
                      >
                        {STATUS_LABEL[s.status] || s.status || "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {s.registerSymbol || reg?.symbol || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {s.holderType}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t">
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
        </div>
      </Card>
    </div>
  );
}
