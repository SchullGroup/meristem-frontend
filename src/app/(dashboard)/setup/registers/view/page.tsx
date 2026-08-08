"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Coins,
  Layers,
  MapPin,
  Trophy,
  FileSpreadsheet,
  Download,
  Loader2,
  Eye,
  Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetRegisterById } from "@/hooks/useRegisters";
import {
  getShareholders,
  getShareholderSummary,
  getHoldersByState,
  exportRegisterOfMembers,
} from "@/actions/enquiryActions";
import { GET_DIVIDEND_FLOWS } from "@/actions/dividendFlowActions";
import { formatLargeNumber, exportToCSV } from "@/lib/utils";
import type { Shareholder } from "@/types/enquiry";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";

const PAGE_SIZE_DEFAULT = 20;
const TOP_N = 20;

function holderName(s: Shareholder) {
  return [s.firstName, s.otherNames, s.lastName].filter(Boolean).join(" ").trim();
}

function naira(n?: number) {
  if (n == null) return "₦0.00";
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function holderStatusClass(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "DORMANT":
      return "bg-gray-100 text-gray-600";
    case "CAUTIONED":
      return "bg-amber-100 text-amber-800";
    case "SUSPENDED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function flowStatusClass(status?: string) {
  const s = (status || "").toUpperCase();
  if (s === "PAID") return "bg-green-100 text-green-800";
  if (s === "PARTIALLY_PAID") return "bg-emerald-100 text-emerald-700";
  if (s === "REJECTED") return "bg-red-100 text-red-800";
  if (s === "DRAFT" || s === "PRELIST_GENERATED") return "bg-gray-100 text-gray-600";
  return "bg-blue-100 text-blue-800";
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="mrpsl-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-lg font-semibold tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function ViewRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerCode = searchParams.get("id") || "";

  const [activeTab, setActiveTab] = useState("shareholders");

  // Shareholders tab state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const q = useDebounce(searchInput, 400);

  // Reports tab state
  const [exportingMembers, setExportingMembers] = useState(false);

  // ── Register ──────────────────────────────────────────────────────────────
  const { data: registerResp, isLoading: registerLoading } =
    useGetRegisterById(registerCode);
  const register = registerResp?.data;
  const registerSymbol = register?.symbol || "";
  const hasSymbol = !!registerSymbol;

  // ── Summary (header metrics) ────────────────────────────────────────────────
  const { data: summaryResp } = useQuery({
    queryKey: ["reg-view-summary", registerSymbol],
    queryFn: () => getShareholderSummary(registerSymbol),
    enabled: hasSymbol,
    refetchOnWindowFocus: false,
  });
  const summary = summaryResp?.data;

  // ── Shareholders list ───────────────────────────────────────────────────────
  const { data: holdersResp, isLoading: holdersLoading } = useQuery({
    queryKey: ["reg-view-holders", registerSymbol, page, pageSize, q, statusFilter],
    queryFn: () =>
      getShareholders({
        registerSymbol,
        page,
        size: pageSize,
        q: q || undefined,
        status: (statusFilter || undefined) as
          | "ACTIVE"
          | "DORMANT"
          | "CAUTIONED"
          | "SUSPENDED"
          | undefined,
        sort: "name,asc",
      }),
    enabled: hasSymbol && activeTab === "shareholders",
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

  // ── Dividends ────────────────────────────────────────────────────────────────
  const { data: dividends, isLoading: dividendsLoading } = useQuery({
    queryKey: ["reg-view-dividends", registerSymbol],
    queryFn: () => GET_DIVIDEND_FLOWS({ registerSymbol }),
    enabled: hasSymbol && activeTab === "dividends",
    refetchOnWindowFocus: false,
  });

  // ── Reports: holders by state ─────────────────────────────────────────────────
  const { data: byStateResp, isLoading: byStateLoading } = useQuery({
    queryKey: ["reg-view-bystate", registerSymbol],
    queryFn: () => getHoldersByState(registerSymbol),
    enabled: hasSymbol && activeTab === "reports",
    refetchOnWindowFocus: false,
  });
  const byState = byStateResp?.data ?? [];
  const byStateTotalHolders = byState.reduce((sum, r) => sum + r.holderCount, 0);

  // ── Reports: top-N holders ────────────────────────────────────────────────────
  const { data: topResp, isLoading: topLoading } = useQuery({
    queryKey: ["reg-view-top", registerSymbol],
    queryFn: () =>
      getShareholders({
        registerSymbol,
        page: 0,
        size: TOP_N,
        sort: "units,desc",
      }),
    enabled: hasSymbol && activeTab === "reports",
    refetchOnWindowFocus: false,
  });
  const topHolders = topResp?.content ?? [];
  const stockInIssue = register?.currentStockInIssue || 0;

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function openHolder(id: string) {
    if (!id) return;
    router.push(`/enquiry/holder?id=${id}`);
  }

  async function handleExportMembers() {
    if (!registerSymbol) return;
    setExportingMembers(true);
    try {
      const blob = await exportRegisterOfMembers({ registerSymbol });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `register-of-members-${registerSymbol}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Register of members exported.");
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to export register of members.");
    } finally {
      setExportingMembers(false);
    }
  }

  function exportByStateCsv() {
    if (!byState.length) return;
    exportToCSV(
      `holders-by-state-${registerSymbol}.csv`,
      ["State", "Holders", "Total Units", "% of Holders"],
      byState.map((r) => [
        r.state,
        r.holderCount,
        r.totalUnits,
        byStateTotalHolders
          ? `${((r.holderCount / byStateTotalHolders) * 100).toFixed(2)}%`
          : "0%",
      ]),
    );
    toast.success("Holders-by-state exported.");
  }

  function exportTopHoldersCsv() {
    if (!topHolders.length) return;
    exportToCSV(
      `top-${TOP_N}-holders-${registerSymbol}.csv`,
      ["Rank", "Account No", "Name", "CHN", "Holdings", "% of Stock in Issue"],
      topHolders.map((s, i) => [
        i + 1,
        s.accountNumber,
        holderName(s),
        s.chn || "",
        s.holdings,
        stockInIssue ? `${((s.holdings / stockInIssue) * 100).toFixed(4)}%` : "-",
      ]),
    );
    toast.success(`Top ${TOP_N} holders exported.`);
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!registerCode) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No register specified.</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => router.push("/setup/registers")}>
          <ArrowLeft className="h-4 w-4" /> Back to Registers
        </Button>
      </div>
    );
  }

  const holders = holdersResp?.content ?? [];
  const holdersTotal = holdersResp?.totalElements ?? 0;
  const holdersTotalPages = holdersResp?.totalPages ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 px-2 text-muted-foreground"
          onClick={() => router.push("/setup/registers")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Registers
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {registerLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">
                  {register?.registerName || registerCode}
                </h1>
                {register?.symbol && (
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs uppercase">
                    {register.symbol}
                  </span>
                )}
                {register?.status && (
                  <Badge
                    className={`border-0 text-xs capitalize ${
                      register.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : register.status === "INACTIVE"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {register.status === "TRANSACTION_DISABLED"
                      ? "Disabled"
                      : register.status}
                  </Badge>
                )}
              </div>
            )}
            {register && (
              <p className="mt-1 text-sm text-muted-foreground">
                {register.principalName} · {register.registerType}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* No-symbol notice — enquiry read-model is keyed by register symbol. */}
      {!registerLoading && register && !hasSymbol && (
        <Card className="mrpsl-card flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            This register has no ticker symbol on file, so shareholder, dividend
            and report data cannot be scoped to it. Assign a symbol to the
            register to enable this dashboard.
          </p>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Shareholders"
          value={(
            summary?.totalShareholders ??
            register?.currentShareholdersSize ??
            0
          ).toLocaleString()}
          icon={Users}
        />
        <MetricCard
          label="Total Holdings"
          value={formatLargeNumber(summary?.totalHoldings ?? 0)}
          icon={Coins}
        />
        <MetricCard
          label="Stock in Issue"
          value={formatLargeNumber(register?.currentStockInIssue ?? 0)}
          icon={Layers}
        />
        <MetricCard
          label="Active"
          value={(summary?.activeCount ?? 0).toLocaleString()}
          icon={Users}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="shareholders">Shareholders</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ── Shareholders ─────────────────────────────────────────────────── */}
        <TabsContent value="shareholders" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, account no or CHN"
                className="pl-8"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <Select
              value={statusFilter || "ALL"}
              onValueChange={(v) => {
                setStatusFilter(v && v !== "ALL" ? v : "");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DORMANT">Dormant</SelectItem>
                <SelectItem value="CAUTIONED">Cautioned</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">ACCOUNT NO</th>
                    <th className="px-4 py-3">NAME</th>
                    <th className="px-4 py-3">CHN</th>
                    <th className="px-4 py-3 text-right">HOLDINGS</th>
                    <th className="px-4 py-3 text-center">STATUS</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {holdersLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : holders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        {hasSymbol
                          ? "No shareholders found."
                          : "Register has no symbol — cannot list shareholders."}
                      </td>
                    </tr>
                  ) : (
                    holders.map((s) => (
                      <tr
                        key={s.id}
                        className="mrpsl-table-row cursor-pointer"
                        onClick={() => openHolder(s.id)}
                      >
                        <td className="px-4 py-3 font-mono text-[13px]">
                          {s.accountNumber}
                        </td>
                        <td className="px-4 py-3 font-medium">{holderName(s)}</td>
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {s.chn || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.holdings?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`border-0 text-xs ${holderStatusClass(s.status)}`}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHolder(s.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Enquiry
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {holdersTotal > 0 && (
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={holdersTotal}
                totalPages={holdersTotalPages}
                pageBase={0}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(0);
                }}
              />
            )}
          </Card>
        </TabsContent>

        {/* ── Dividends ────────────────────────────────────────────────────── */}
        <TabsContent value="dividends" className="space-y-4">
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">PAYMENT NO</th>
                    <th className="px-4 py-3">TYPE</th>
                    <th className="px-4 py-3 text-right">RATE</th>
                    <th className="px-4 py-3 text-right">GROSS LIABILITY</th>
                    <th className="px-4 py-3 text-right">NET</th>
                    <th className="px-4 py-3 text-right">SHAREHOLDERS</th>
                    <th className="px-4 py-3">PAYMENT DATE</th>
                    <th className="px-4 py-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dividendsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !dividends || dividends.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        No dividends declared for this register.
                      </td>
                    </tr>
                  ) : (
                    dividends.map((d: DividendFlowRecord) => (
                      <tr key={d.id} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-[13px]">
                          {d.paymentNumber}
                        </td>
                        <td className="px-4 py-3">{d.dividendType}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          ₦{d.rate?.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {naira(d.grossLiability)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {naira(d.netLiability)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {d.totalShareholders?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">
                          {d.paymentDate || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`border-0 text-xs ${flowStatusClass(d.status)}`}>
                            {d.status?.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Reports ──────────────────────────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-5">
          {/* Register of members */}
          <Card className="mrpsl-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Register of Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Full shareholder register (account no, name, CHN, holdings,
                    status) as CSV.
                  </p>
                </div>
              </div>
              <Button
                className="gap-1.5"
                disabled={!hasSymbol || exportingMembers}
                onClick={handleExportMembers}
              >
                {exportingMembers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Holders by state */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Holders by State</h3>
                  <p className="text-sm text-muted-foreground">
                    Shareholder distribution across geographical states.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={!byState.length}
                onClick={exportByStateCsv}
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">STATE</th>
                    <th className="px-4 py-3 text-right">HOLDERS</th>
                    <th className="px-4 py-3 text-right">TOTAL UNITS</th>
                    <th className="px-4 py-3 text-right">% OF HOLDERS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {byStateLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : byState.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        No data.
                      </td>
                    </tr>
                  ) : (
                    byState.map((r) => (
                      <tr key={r.state} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-medium">{r.state}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {r.holderCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {r.totalUnits.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {byStateTotalHolders
                            ? `${((r.holderCount / byStateTotalHolders) * 100).toFixed(2)}%`
                            : "0%"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top-N holders */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Top {TOP_N} Holders</h3>
                  <p className="text-sm text-muted-foreground">
                    Largest shareholders by units held, with concentration as a
                    share of stock in issue.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={!topHolders.length}
                onClick={exportTopHoldersCsv}
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3 text-right">#</th>
                    <th className="px-4 py-3">ACCOUNT NO</th>
                    <th className="px-4 py-3">NAME</th>
                    <th className="px-4 py-3 text-right">HOLDINGS</th>
                    <th className="px-4 py-3 text-right">% OF STOCK</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : topHolders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No data.
                      </td>
                    </tr>
                  ) : (
                    topHolders.map((s, i) => (
                      <tr
                        key={s.id}
                        className="mrpsl-table-row cursor-pointer"
                        onClick={() => openHolder(s.id)}
                      >
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px]">
                          {s.accountNumber}
                        </td>
                        <td className="px-4 py-3 font-medium">{holderName(s)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.holdings?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {stockInIssue
                            ? `${((s.holdings / stockInIssue) * 100).toFixed(4)}%`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHolder(s.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Enquiry
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
