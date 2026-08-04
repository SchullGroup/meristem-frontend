"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ArrowLeft,
  Search,
  Layers,
  X,
  Crown,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";
import { useGetAccounts } from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import {
  submitConsolidationRequest,
  CertConsolidationSuggestion,
} from "@/actions/certConsolidation";
import type { CertificateConsolidation } from "@/types/cscs";
import type { ShareholderAccount } from "@/types/account-maintenance";
import { useStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "sonner";

const MAX_SOURCES = 10;

// One account involved in a consolidation. The surviving (destination) account is one of these.
interface PickedAccount {
  holderId: string;
  accountNumber: string;
  name: string;
  chn: string;
  units: number;
  registerSymbol: string;
  status: string;
}

interface Props {
  requests: CertificateConsolidation[];
  loading?: boolean;
  onRefetch: () => void;
  /** A system suggestion to load straight into the create form (no re-search). */
  prefill?: CertConsolidationSuggestion | null;
  onPrefillConsumed?: () => void;
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function holderToPicked(h: ShareholderAccount): PickedAccount {
  return {
    holderId: h.id,
    accountNumber: h.accountNumber ?? "",
    name: `${h.firstName ?? ""} ${h.lastName ?? ""}`.trim(),
    chn: h.chn ?? "",
    units: h.holdings ?? 0,
    registerSymbol: h.registerSymbol ?? "",
    status: h.status ?? "",
  };
}

// Keep a valid surviving account: the current one if still present, else the largest holding.
function pickDestination(list: PickedAccount[], current: string): string {
  if (list.some((a) => a.holderId === current)) return current;
  if (list.length === 0) return "";
  return list.reduce((best, a) => (a.units > best.units ? a : best), list[0])
    .holderId;
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "APPROVED")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
        Approved
      </Badge>
    );
  if (s === "REJECTED")
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300">
        Rejected
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
      Pending Teamlead Review
    </Badge>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function ConsolidationRequests({
  requests,
  loading,
  onRefetch,
  prefill,
  onPrefillConsumed,
}: Props) {
  const currentUser = useStore((s) => s.currentUser);
  const [view, setView] = useState<"list" | "new">("list");

  // ── list state ──────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [detail, setDetail] = useState<CertificateConsolidation | null>(null);

  // ── form state ──────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<PickedAccount[]>([]);
  const [destinationId, setDestinationId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  // ── account search ──────────────────────────────────────────────────────
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(search, 500);
  const { data: results, isFetching: searching } = useGetAccounts(
    { q: debounced.trim(), pageSize: 20 },
    { enabled: debounced.trim().length > 2 },
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Prefill from a system suggestion ──────────────────────────────────────
  const appliedRef = useRef<CertConsolidationSuggestion | null>(null);
  useEffect(() => {
    if (!prefill || appliedRef.current === prefill) return;
    appliedRef.current = prefill;

    const accts = prefill.accounts ?? [];
    if (accts.length === 0) {
      onPrefillConsumed?.();
      return;
    }
    // Default surviving account = the largest certificate holding.
    const survivor = accts.reduce(
      (best, a) => ((a.totalUnits ?? 0) > (best.totalUnits ?? 0) ? a : best),
      accts[0],
    );

    let chosen = accts;
    let note = `Loaded ${accts.length} account${accts.length === 1 ? "" : "s"} from a system suggestion — the largest holding is the surviving account. Use the “Surviving” toggle on any row to change it.`;
    if (chosen.length > MAX_SOURCES) {
      const others = accts
        .filter((a) => a.holderId !== survivor.holderId)
        .slice(0, MAX_SOURCES - 1);
      chosen = [survivor, ...others];
      note = `Loaded ${MAX_SOURCES} of ${accts.length} accounts (the maximum per request). Consolidate the remaining ${accts.length - MAX_SOURCES} in a follow-up request.`;
    }

    // One-time prop→state hydration when a suggestion is chosen. The appliedRef guard above
    // ensures this runs once per distinct prefill, so it does not cascade renders.
    /* eslint-disable react-hooks/set-state-in-effect */
    setAccounts(
      chosen.map((a) => ({
        holderId: a.holderId,
        accountNumber: a.accountNo,
        name: a.name ?? prefill.holderName,
        chn: a.chn,
        units: a.totalUnits ?? 0,
        registerSymbol: prefill.register,
        status: "",
      })),
    );
    setDestinationId(survivor.holderId);
    setReason("");
    setPrefillNote(note);
    setView("new");
    /* eslint-enable react-hooks/set-state-in-effect */
    onPrefillConsumed?.();
  }, [prefill, onPrefillConsumed]);

  // ── form helpers ──────────────────────────────────────────────────────────
  function resetForm() {
    setAccounts([]);
    setDestinationId("");
    setReason("");
    setPrefillNote(null);
    setSearch("");
    setOpen(false);
  }

  function addAccount(h: ShareholderAccount) {
    if (accounts.some((a) => a.holderId === h.id)) {
      toast.info("Account already added.");
      return;
    }
    if (accounts.length >= MAX_SOURCES) {
      toast.error(`Maximum ${MAX_SOURCES} accounts allowed per request.`);
      return;
    }
    const next = [...accounts, holderToPicked(h)];
    setAccounts(next);
    setDestinationId((d) => pickDestination(next, d));
    setSearch("");
    setOpen(false);
  }

  function removeAccount(holderId: string) {
    const next = accounts.filter((a) => a.holderId !== holderId);
    setAccounts(next);
    setDestinationId((d) => pickDestination(next, d));
  }

  const submitMut = useMutation({
    mutationFn: () =>
      submitConsolidationRequest({
        registerId:
          accounts.find((a) => a.holderId === destinationId)?.registerSymbol ||
          undefined,
        sourceAccountIds: accounts.map((a) => a.holderId),
        destinationAccountId: destinationId,
        comment: reason.trim(),
        initiatedBy: currentUser?.email,
      }),
    onSuccess: () => {
      toast.success("Consolidation request submitted for Teamlead approval.");
      resetForm();
      setView("list");
      onRefetch();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to submit consolidation request."),
  });

  // ── derived ────────────────────────────────────────────────────────────────
  const filteredRequests = requests.filter((r) =>
    filterStatus === "ALL" ? true : r.status?.toUpperCase() === filterStatus,
  );
  const totalUnits = accounts.reduce((s, a) => s + a.units, 0);
  const sourceRegisters = [...new Set(accounts.map((a) => a.registerSymbol))];
  const mixedRegisters = sourceRegisters.length > 1;
  const canSubmit =
    accounts.length >= 2 && !!destinationId && reason.trim().length > 0;

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Consolidation Requests</h3>
            <Badge variant="secondary">{requests.length}</Badge>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setView("new");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Consolidation Request
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => setFilterStatus(status)}
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </Button>
            ),
          )}
        </div>

        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">SUBMITTED</th>
                  <th className="p-3">HOLDER</th>
                  <th className="p-3">REGISTER</th>
                  <th className="p-3">CERTS #</th>
                  <th className="p-3">TOTAL UNITS</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className={`mrpsl-table-row${req.status?.toUpperCase() === "REJECTED" ? " bg-red-50/30 dark:bg-red-950/10" : ""}`}
                  >
                    <td className="p-3 font-mono text-xs" title={req.id}>
                      {req.id?.slice(0, 8)}
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {fmtDate(req.submittedAt)}
                    </td>
                    <td className="p-3 font-medium">{req.holderName}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-950 dark:text-blue-300">
                        {req.registerSymbol}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums">{req.certCount}</td>
                    <td className="p-3 tabular-nums font-semibold">
                      {formatNumber(req.totalUnits)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetail(req)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        {loading ? (
                          <>
                            <Loader2 className="h-8 w-8 animate-spin opacity-40" />
                            <span>Loading consolidation requests…</span>
                          </>
                        ) : (
                          <>
                            <Layers className="h-10 w-10 opacity-30" />
                            <span>No consolidation requests found.</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail dialog */}
        {detail && (
          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  Consolidation Request
                  <span className="font-mono text-xs text-muted-foreground">
                    {detail.id?.slice(0, 8)}
                  </span>
                  <StatusBadge status={detail.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Holder
                    </p>
                    <p className="font-medium">{detail.holderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Destination Account
                    </p>
                    <p className="font-mono text-xs">
                      {detail.accountNumber} · {detail.registerSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      New Cert No
                    </p>
                    <p className="font-mono text-xs">
                      {detail.newCertNumber ?? "— (minted on approval)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Total Units
                    </p>
                    <p className="font-semibold tabular-nums">
                      {formatNumber(detail.totalUnits)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Reason
                    </p>
                    <p>{detail.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Submitted By
                    </p>
                    <p>{detail.submittedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Submitted At
                    </p>
                    <p>{fmtDate(detail.submittedAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    Certificates ({detail.certCount})
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left font-medium">CERT NO</th>
                          <th className="p-2 text-right font-medium">UNITS</th>
                          <th className="p-2 text-left font-medium">
                            ISSUE DATE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detail.certificates?.map((cert, i) => (
                          <tr key={`${cert.certNumber}-${i}`}>
                            <td className="p-2 font-mono">{cert.certNumber}</td>
                            <td className="p-2 text-right tabular-nums">
                              {formatNumber(cert.units)}
                            </td>
                            <td className="p-2">{cert.issueDate}</td>
                          </tr>
                        ))}
                        {(!detail.certificates ||
                          detail.certificates.length === 0) && (
                          <tr>
                            <td
                              colSpan={3}
                              className="p-3 text-center text-muted-foreground"
                            >
                              No certificate breakdown available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {detail.authoriserComment && (
                  <div
                    className={`rounded-lg border p-3 ${detail.status?.toUpperCase() === "REJECTED" ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" : "border-muted bg-muted/40"}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                          {detail.status?.toUpperCase() === "REJECTED"
                            ? "Rejection Reason"
                            : "Authoriser Comment"}
                        </p>
                        <p className="text-amber-700 dark:text-amber-400">
                          {detail.authoriserComment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setDetail(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ── CREATE FORM VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetForm();
            setView("list");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h3 className="text-lg font-semibold">New Consolidation Request</h3>
      </div>

      {prefillNote && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-300">
          <Crown className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{prefillNote}</span>
          <button
            type="button"
            onClick={() => setPrefillNote(null)}
            className="ml-auto shrink-0 text-blue-800/70 hover:text-blue-800 dark:text-blue-300/70 dark:hover:text-blue-300 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1 — accounts */}
      <Card className="mrpsl-card p-4 space-y-4 overflow-visible">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Accounts to consolidate{" "}
            <span className="font-normal normal-case">
              (2–10 accounts on the same register — every ACTIVE certificate is
              merged into the surviving account)
            </span>
          </p>
          <span className="text-xs text-muted-foreground">
            {accounts.length}/{MAX_SOURCES}
          </span>
        </div>

        {/* search */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, account number or CHN…"
              className="pl-9 pr-8 mrpsl-input"
              value={search}
              disabled={accounts.length >= MAX_SOURCES}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {open && debounced.trim().length > 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg bg-background z-20 overflow-hidden">
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              ) : (results?.data?.data?.length ?? 0) === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No accounts found.
                </div>
              ) : (
                <div className="divide-y max-h-64 overflow-y-auto">
                  {results?.data?.data?.map((holder) => {
                    const added = accounts.some((a) => a.holderId === holder.id);
                    return (
                      <button
                        key={holder.id}
                        type="button"
                        disabled={added}
                        onClick={() => addAccount(holder)}
                        className={`w-full text-left px-4 py-3 transition-colors ${added ? "opacity-50 cursor-default bg-muted/30" : "hover:bg-muted/40 cursor-pointer"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {holder.firstName} {holder.lastName}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="font-mono text-xs text-muted-foreground">
                                {holder.accountNumber}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {holder.chn}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-xs text-muted-foreground">
                              {(holder.holdings ?? 0).toLocaleString()} units
                            </span>
                            <span className="text-primary font-mono text-xs font-semibold">
                              {holder.registerSymbol}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* picked accounts */}
        {accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isDest = acc.holderId === destinationId;
              return (
                <div
                  key={acc.holderId}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${isDest ? "border-primary/40 bg-primary/5" : "bg-muted/10"}`}
                >
                  <div className="flex-1 min-w-0 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-0.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {acc.accountNumber}
                    </span>
                    <span className="font-medium truncate">
                      {acc.name}
                      {isDest && (
                        <span className="ml-2 text-[11px] font-semibold text-primary">
                          SURVIVING
                        </span>
                      )}
                    </span>
                    <span className="text-primary font-mono text-xs font-semibold">
                      {acc.registerSymbol}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground col-start-1">
                      {acc.chn}
                    </span>
                    <span className="font-mono text-xs">
                      {acc.units.toLocaleString()} units
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDestinationId(acc.holderId)}
                    title="Set as the surviving (destination) account"
                    disabled={isDest}
                    className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${isDest ? "border-primary/40 text-primary cursor-default" : "text-muted-foreground hover:text-primary hover:border-primary/50 cursor-pointer"}`}
                  >
                    <Crown className="h-3 w-3" />
                    {isDest ? "Surviving" : "Set as surviving"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAccount(acc.holderId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs">
                {accounts.length < 2 && (
                  <span className="text-amber-600 font-medium">
                    ⚠ Add at least 2 accounts to consolidate
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold">
                Total:{" "}
                <span className="font-mono text-primary">
                  {formatNumber(totalUnits)}
                </span>{" "}
                units
              </div>
            </div>

            {mixedRegisters && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Accounts span multiple registers ({sourceRegisters.join(", ")}
                  ). Certificate consolidation merges holdings within a single
                  register — confirm before submitting.
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            Search and add the accounts to consolidate, or load a set from the
            System Suggestions tab.
          </p>
        )}
      </Card>

      {/* Step 2 — reason + submit */}
      <Card className="mrpsl-card p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Reason <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="Reason for consolidation…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          className="w-full"
          disabled={!canSubmit || submitMut.isPending}
          onClick={() => submitMut.mutate()}
        >
          {submitMut.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Create Consolidation Request
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
