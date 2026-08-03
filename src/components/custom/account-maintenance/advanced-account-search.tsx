"use client";

import { useMemo, useState } from "react";
import { Loader2, Check, UserCheck, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareholderQueryBuilder } from "@/components/custom/shareholder-query-builder";
import { TablePagination } from "@/components/custom/table-pagination";
import { useSearchShareholders } from "@/hooks/useEnquiry";
import { useGetRegisters } from "@/hooks/useRegisters";
import type {
  ShareholderSearchCriteria,
  ShareholderSearchResult,
} from "@/types/enquiry";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DORMANT: "bg-gray-100 text-gray-600",
  CAUTIONED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-700",
};

type AppliedCriteria = Omit<ShareholderSearchCriteria, "page" | "size" | "sort">;
const EMPTY: AppliedCriteria = { combinator: "AND", rules: [] };

function displayName(s: ShareholderSearchResult) {
  const parts = [s.lastName, s.firstName].filter(Boolean).join(", ");
  return [parts, s.otherNames].filter(Boolean).join(" ") || s.name || "—";
}

export function AdvancedAccountSearch({
  open,
  onOpenChange,
  mode,
  onPick,
  disabledIds = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "source" | "destination";
  onPick: (result: ShareholderSearchResult) => void;
  disabledIds?: string[];
}) {
  const [applied, setApplied] = useState<AppliedCriteria>(EMPTY);
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

  const { data, isFetching } = useSearchShareholders(criteria, { enabled: searched });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const disabled = useMemo(() => new Set(disabledIds), [disabledIds]);

  function applySearch(next: AppliedCriteria) {
    setApplied(next);
    setPage(0);
    setSearched(true);
  }
  function clearSearch() {
    setApplied(EMPTY);
    setPage(0);
    setSearched(false);
  }

  function handlePick(r: ShareholderSearchResult) {
    if (disabled.has(r.id)) return;
    onPick(r);
    if (mode === "destination") onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            Advanced Account Search —{" "}
            {mode === "source" ? "add source accounts" : "select destination"}
          </DialogTitle>
          <DialogDescription>
            Search by name, BVN, NIN, address, CHN, registrar/CSCS account, state, phone or email.
            {mode === "source"
              ? " Click a result to add it as a source account."
              : " Click a result to set it as the destination account."}
          </DialogDescription>
        </DialogHeader>

        <ShareholderQueryBuilder
          registers={registers}
          onSearch={applySearch}
          onClear={clearSearch}
          loading={isFetching}
        />

        <div className="mt-4">
          {!searched ? (
            <Card className="mrpsl-card p-10 text-center text-sm text-muted-foreground">
              Build a query above and press Search to find accounts.
            </Card>
          ) : isFetching && rows.length === 0 ? (
            <Card className="mrpsl-card p-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </Card>
          ) : rows.length === 0 ? (
            <Card className="mrpsl-card p-10 text-center text-sm text-muted-foreground">
              No accounts match the current search.
            </Card>
          ) : (
            <Card className="mrpsl-card overflow-hidden divide-y">
              {rows.map((s) => {
                const isDisabled = disabled.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handlePick(s)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isDisabled
                        ? "opacity-50 cursor-default bg-muted/30"
                        : "hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[13px] truncate">
                            {displayName(s)}
                          </span>
                          <Badge
                            className={`border-0 text-[10px] shrink-0 ${STATUS_BADGE[s.status] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {s.status}
                          </Badge>
                          {isDisabled && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-green-700">
                              <Check className="h-3 w-3" /> selected
                            </span>
                          )}
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
                            {s.registerSymbol}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {(s.holdings ?? 0).toLocaleString()} units
                          </div>
                        </div>
                        {!isDisabled && (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                            {mode === "source" ? (
                              <>
                                <Plus className="h-3.5 w-3.5" /> Add
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" /> Select
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </Card>
          )}

          {searched && rows.length > 0 && (
            <div className="mt-2">
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
      </DialogContent>
    </Dialog>
  );
}
