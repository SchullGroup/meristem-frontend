"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, User, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { ShareholderSearchInput } from "@/components/custom/shareholder-search-input";
import { ShareholderQueryBuilder } from "@/components/custom/shareholder-query-builder";
import { TablePagination } from "@/components/custom/table-pagination";
import { useSearchShareholders } from "@/hooks/useEnquiry";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useSearchDematStockbrokers } from "@/hooks/useCertDematerialisation";
import type { DematStockbroker } from "@/actions/certDematActions";
import type { ShareholderSearchCriteria, Shareholder } from "@/types/enquiry";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DORMANT: "bg-gray-100 text-gray-600",
  CAUTIONED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-700",
};

type AppliedCriteria = Omit<ShareholderSearchCriteria, "page" | "size" | "sort">;
const EMPTY_CRITERIA: AppliedCriteria = { combinator: "AND", rules: [] };

function displayName(s: {
  firstName?: string;
  lastName?: string;
  otherNames?: string;
  name?: string;
}) {
  const parts = [s.lastName, s.firstName].filter(Boolean).join(", ");
  return [parts, s.otherNames].filter(Boolean).join(" ") || s.name || "—";
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="font-medium text-sm break-words">{value !== undefined && value !== null && value !== "" ? value : "—"}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground/70">
      {icon}
      <p className="text-sm text-center max-w-xs">{text}</p>
    </div>
  );
}

// ── Shareholder panel — same advanced query-builder search as Reconciliation ─
// (fitted to a half-width column; the query builder reflows on narrow widths).
function ShareholderPanel() {
  const [applied, setApplied] = useState<AppliedCriteria>(EMPTY_CRITERIA);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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

  const { data, isFetching, error } = useSearchShareholders(criteria, {
    enabled: searched,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  function applySearch(next: AppliedCriteria) {
    setApplied(next);
    setPage(0);
    setSearched(true);
  }
  function clearSearch() {
    setApplied(EMPTY_CRITERIA);
    setPage(0);
    setSearched(false);
  }
  // Quick-find jumps straight to a single holder's verification card (exact CHN match).
  function onQuickSelect(s: Shareholder) {
    if (!s.chn) {
      toast.error("This shareholder has no CHN on record.");
      return;
    }
    applySearch({ combinator: "AND", rules: [{ field: "chn", operator: "equals", value: s.chn }] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Shareholder Verification</span>
      </div>

      <ShareholderSearchInput
        className="w-full"
        placeholder="Quick find — surname, account no or CHN…"
        onSelect={onQuickSelect}
      />

      <ShareholderQueryBuilder
        registers={registers}
        onSearch={applySearch}
        onClear={clearSearch}
        loading={isFetching}
      />

      {!searched ? (
        <EmptyState icon={<User className="h-8 w-8" />} text="Build a query or use quick find to verify a shareholder" />
      ) : error ? (
        <p className="text-sm text-red-600 py-6 text-center">Failed to load shareholders. Please try again.</p>
      ) : isFetching && rows.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching…
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<User className="h-8 w-8" />} text="No shareholders match the current search" />
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
            {total === 1 ? "holding" : "holdings"} found
          </p>
          {rows.map((s) => (
            <div key={s.id} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm truncate">{displayName(s)}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className={`border-0 text-[10px] ${STATUS_BADGE[s.status] ?? "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </Badge>
                  <Badge className="border-0 text-[11px] bg-gray-100 text-gray-800">{s.registerSymbol || "—"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CHN" value={s.chn} />
                <Field label="CSCS Account" value={s.cscsAccountNo} />
                <Field label="Registrar Account" value={s.accountNumber} />
                <Field label="BVN" value={s.bvn} />
                <Field label="NIN" value={s.nin} />
                <Field label="Units Held" value={formatNumber(s.holdings ?? 0)} />
                <Field label="Address" value={[s.address, s.state].filter(Boolean).join(", ")} />
              </div>
            </div>
          ))}
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
      )}
    </div>
  );
}

// ── Stockbroker panel ──────────────────────────────────────────────────────
function StockbrokerPanel() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const { data, isLoading, isError, error } = useSearchDematStockbrokers(term, term.length >= 2);
  const brokers = useMemo(() => data ?? [], [data]);

  const run = () => {
    if (input.trim().length < 2) { toast.error("Enter at least 2 characters (firm name or CSCS code)."); return; }
    setTerm(input.trim());
  };

  return (
    <Card className="mrpsl-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Stockbroker Verification</span>
      </div>
      <div className="flex gap-2">
        <Input className="mrpsl-input h-10 flex-1" placeholder="Search by firm name or CSCS code…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
        <Button className="h-10 gap-1.5" onClick={run}><Search className="h-4 w-4" /> Search</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
      ) : isError ? (
        <p className="text-sm text-red-600 py-6 text-center">{(error as Error)?.message ?? "Search failed."}</p>
      ) : term.length < 2 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} text="Search for a stockbroker to view their profile" />
      ) : brokers.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} text={`No stockbrokers found matching "${term}"`} />
      ) : (
        <div className="space-y-3">
          {brokers.map((b: DematStockbroker, i) => (
            <div key={`${b.stockbrokerCode}-${i}`} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{b.firmName || "—"}</span>
                {b.stockbrokerCode && <Badge className="border-0 text-[11px] bg-blue-100 text-blue-800 font-mono">{b.stockbrokerCode}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CSCS / Stockbroker Code" value={b.stockbrokerCode} />
                <Field label="Shareholders" value={formatNumber(b.holderCount ?? 0)} />
                <Field label="Total Units Under Broker" value={formatNumber(b.totalUnits ?? 0)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function DematVerification() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <ShareholderPanel />
      <StockbrokerPanel />
    </div>
  );
}
