"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareholderSearchInput } from "@/components/custom/shareholder-search-input";
import { ShareholderQueryBuilder } from "@/components/custom/shareholder-query-builder";
import { TablePagination } from "@/components/custom/table-pagination";
import { ResolutionDesk } from "./resolution-desk";
import { useSearchShareholders } from "@/hooks/useEnquiry";
import { useGetRegisters } from "@/hooks/useRegisters";
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

interface DeskTarget {
  chn: string;
  register: string;
  holderName: string;
}

export default function GeneralCertificateReconciliation() {
  // The (holder, register) pair currently open on the resolution desk.
  const [target, setTarget] = useState<DeskTarget | null>(null);

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

  // Open the reconciliation desk for a specific holding. Reconciliation is keyed on
  // (CHN, register symbol) — each search result is already scoped to one register, so a
  // selection resolves straight to the desk without a separate register-picker step.
  function openDesk(chn: string, register: string, holderName: string) {
    if (!chn) {
      toast.error("This shareholder has no CHN on record — reconciliation is keyed on CHN.");
      return;
    }
    if (!register) {
      toast.error("This holding has no register symbol — pick a register-scoped result to reconcile.");
      return;
    }
    setTarget({ chn, register, holderName });
  }

  function onQuickSelect(s: Shareholder) {
    openDesk(s.chn, s.registerSymbol, displayName(s));
  }

  // ── Desk ──
  if (target) {
    return (
      <ResolutionDesk
        chn={target.chn}
        register={target.register}
        holderName={target.holderName}
        backLabel="Back to Search"
        onBack={() => setTarget(null)}
      />
    );
  }

  // ── Search ──
  return (
    <div className="space-y-5">
      {/* Quick jump-to-holder typeahead */}
      <ShareholderSearchInput
        className="w-full max-w-2xl"
        placeholder="Quick find — type a surname, account no or CHN to reconcile a holding…"
        onSelect={onQuickSelect}
      />

      {/* Interactive query builder — build conditions, restrict to a register or search across all */}
      <ShareholderQueryBuilder
        registers={registers}
        onSearch={applySearch}
        onClear={clearSearch}
        loading={isFetching}
      />

      {/* Results */}
      {!searched ? (
        <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
          Build a query above (or use quick find) and press Search, then select a holding to reconcile.
        </Card>
      ) : error ? (
        <Card className="mrpsl-card p-12 text-center text-red-500 text-sm font-medium">
          Failed to load shareholders. Please try again.
        </Card>
      ) : isFetching && rows.length === 0 ? (
        <Card className="mrpsl-card p-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </Card>
      ) : rows.length === 0 ? (
        <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
          No shareholders match the current search.
        </Card>
      ) : (
        <>
          <div className="text-[13px] text-muted-foreground">
            {isFetching ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
              </span>
            ) : (
              <span>
                <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
                {total === 1 ? "holding" : "holdings"} found — select one to reconcile
              </span>
            )}
          </div>

          <Card className="mrpsl-card overflow-hidden divide-y">
            {rows.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openDesk(s.chn, s.registerSymbol, displayName(s))}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-muted/40 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[13px] truncate">{displayName(s)}</span>
                      <Badge
                        className={`border-0 text-[10px] shrink-0 ${STATUS_BADGE[s.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground font-mono">
                      <span>Acct {s.accountNumber || "—"}</span>
                      <span>CHN {s.chn || "—"}</span>
                      {s.bvn && <span>BVN {s.bvn}</span>}
                      {s.nin && <span>NIN {s.nin}</span>}
                      {(s.address || s.state) && (
                        <span className="not-italic">
                          {[s.address, s.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-primary font-mono text-xs font-semibold">
                        {s.registerSymbol || "—"}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {(s.holdings ?? 0).toLocaleString()} units
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                      Reconcile <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </Card>

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
        </>
      )}
    </div>
  );
}
