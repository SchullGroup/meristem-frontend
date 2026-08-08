"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2,
  Plus, RefreshCw, Upload, X, Zap, Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import {
  useHolderCertificates,
  useSaveReconciliationCertificates,
  useAllowReconTrade,
} from "@/hooks/useReconciliation";
import type { HolderAccountPanel, HolderCertificate, AllowTradeResponse } from "@/actions/reconciliationActions";

// ── Types ──────────────────────────────────────────────────────────────────
type TxType = "BUY" | "SELL" | "RIGHTS" | "BONUS" | "IPO";

interface LedgerEntry {
  id: string;
  displayDate: string;
  isoDate: string; // yyyy-MM-dd (for save)
  type: TxType;
  transferNo: string;
  units: number; // display magnitude (always positive; sign implied by type/colour)
  status?: string;
  accountNo?: string; // which account this entry belongs to / targets
}

export interface ShortfallContext {
  flaggedItemId?: string;
  attemptedSell?: number | null;
  holdingsAtFlag?: number | null;
  shortfall?: number | null;
  transactionDate?: string | null;
}

interface ResolutionDeskProps {
  chn: string;
  register: string;
  holderName: string;
  onBack: () => void;
  backLabel?: string;
  context?: ShortfallContext;
  onSaved?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function txColor(type: TxType | string): string {
  if (type === "SELL") return "text-red-600";
  if (type === "RIGHTS") return "text-blue-600";
  if (type === "BONUS") return "text-purple-600";
  if (type === "IPO") return "text-indigo-600";
  return "text-green-600";
}

function fmtDisplay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function inDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return true;
  if (from && d < new Date(from + "T00:00:00")) return false;
  if (to && d > new Date(to + "T23:59:59")) return false;
  return true;
}

/** Map a certificate ledger row (signed units) to a display ledger entry (positive units + type). */
function certToEntry(c: HolderCertificate, accountNo: string): LedgerEntry {
  const type: TxType = (c.units ?? 0) < 0 ? "SELL" : "BUY";
  return {
    id: c.id,
    displayDate: fmtDisplay(c.issueDate),
    isoDate: c.issueDate ?? "",
    type,
    transferNo: c.transferNo ?? "",
    units: Math.abs(c.units ?? 0),
    status: c.status ?? undefined,
    accountNo,
  };
}

// ── CSCS upload CSV parser (5-col: referenceNo,seq,dateWithLabel,units,signAndCHN) ──
function parseCscsCsv(text: string): LedgerEntry[] {
  const out: LedgerEntry[] = [];
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  lines.forEach((line, i) => {
    const p = line.split(",");
    if (p.length < 5) return;
    const last = p[4].trim();
    if (last.length < 3) return;
    const digits = p[2].replace(/[^0-9]/g, "");
    const iso = digits.length >= 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : "";
    const seq = parseInt(p[1].trim(), 10) || 0;
    const ref = p[0].trim();
    out.push({
      id: `csv-${i}`,
      isoDate: iso,
      displayDate: fmtDisplay(iso),
      type: last.charAt(1) === "+" ? "BUY" : "SELL",
      transferNo: seq > 1 ? `${ref}-${seq}` : ref,
      units: parseInt(p[3].trim(), 10) || 0,
      status: "CLEARED",
    });
  });
  return out;
}

// ── Add Transaction modal ────────────────────────────────────────────────
function InsertModal({
  open, onClose, prefill, chn, register, accounts, initialAccountNo, onInserted,
}: {
  open: boolean;
  onClose: () => void;
  prefill: LedgerEntry | null;
  chn: string;
  register: string;
  accounts: HolderAccountPanel[];
  initialAccountNo: string;
  onInserted: (entry: LedgerEntry) => void;
}) {
  const [units, setUnits] = useState(String(prefill?.units ?? ""));
  const [isoDate, setIsoDate] = useState(prefill?.isoDate ?? "");
  const [txNo, setTxNo] = useState(prefill?.transferNo ?? "");
  const [type, setType] = useState<TxType | "">(prefill?.type ?? "");
  const [accountNo, setAccountNo] = useState(initialAccountNo);

  const handleSubmit = () => {
    if (!accountNo) { toast.error("Select the account to post to."); return; }
    if (!units || Number(units) <= 0) { toast.error("Enter a valid unit count."); return; }
    if (!type) { toast.error("Select a transaction type."); return; }
    if (!isoDate) { toast.error("Select a transaction date."); return; }
    onInserted({
      id: `added-${accountNo}-${txNo.trim() || "tx"}-${units}-${isoDate}`,
      isoDate,
      displayDate: fmtDisplay(isoDate),
      type: type as TxType,
      transferNo: txNo.trim(),
      units: Number(units),
      accountNo,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold leading-tight">Add Certificate Movement</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            CHN <span className="font-mono text-foreground">{chn}</span> · {register} — posts a certificate ledger row on save.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {prefill && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-800 leading-relaxed">Pre-filled from CSCS record — review and confirm before saving.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-1.5 col-span-2">
              <label className="mrpsl-label">Post to account</label>
              <Select value={accountNo} onValueChange={(v) => v && setAccountNo(v)}>
                <SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.accountNo} value={a.accountNo}>
                      Acct {a.accountNo}{a.chn ? ` · CHN ${a.chn}` : ""}{a.primary ? " (flagged)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transaction Date</label>
              <Input type="date" className="mrpsl-input" value={isoDate} onChange={(e) => setIsoDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transfer Number</label>
              <Input className="mrpsl-input font-mono" value={txNo} onChange={(e) => setTxNo(e.target.value)} placeholder="e.g. TRF-001" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Units</label>
              <Input className="mrpsl-input font-mono" type="number" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transaction Type</label>
              <Select value={type} onValueChange={(v) => setType(v as TxType)}>
                <SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY (+)</SelectItem>
                  <SelectItem value="SELL">SELL (−)</SelectItem>
                  <SelectItem value="RIGHTS">RIGHTS (+)</SelectItem>
                  <SelectItem value="BONUS">BONUS (+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Movement</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── One account's certificate-ledger panel ──────────────────────────────────
function AccountPanel({
  account, entries, onAdd,
}: {
  account: HolderAccountPanel;
  entries: LedgerEntry[];
  onAdd: () => void;
}) {
  const addedCount = entries.filter((e) => e.id.startsWith("added-")).length;
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Acct {account.accountNo}
          </span>
          {account.chn && (
            <Badge className="border-0 text-[11px] bg-gray-100 text-gray-700 font-mono">CHN {account.chn}</Badge>
          )}
          {account.primary ? (
            <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">Flagged account</Badge>
          ) : (
            <Badge className="border-0 text-[11px] bg-blue-50 text-blue-700">Other account</Badge>
          )}
          {addedCount > 0 && <Badge className="border-0 text-[11px] bg-green-100 text-green-700">+{addedCount} added</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Position</span>
          <span className="font-mono font-bold text-[13px]">{formatNumber(account.totalUnits)}</span>
          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1" onClick={onAdd}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>
      <div className="divide-y divide-border/60 text-[13px]">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="font-medium">{e.displayDate} <span className={txColor(e.type)}>({e.type})</span></p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {e.transferNo || "—"}{e.status ? ` · ${e.status}` : ""}
              </p>
            </div>
            <span className="font-mono font-bold">{formatNumber(e.units)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">
            No certificate movements for this account.
          </p>
        )}
      </div>
    </Card>
  );
}

// ── Main desk ──────────────────────────────────────────────────────────────
export function ResolutionDesk({
  chn, register, holderName, onBack, backLabel = "Back", context, onSaved,
}: ResolutionDeskProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: certData, isLoading, isError, error } = useHolderCertificates(chn, register);
  const save = useSaveReconciliationCertificates();
  const allow = useAllowReconTrade();

  const [cscsEntries, setCscsEntries] = useState<LedgerEntry[]>([]);
  const [cscsFileName, setCscsFileName] = useState("");
  const [addedMrpsl, setAddedMrpsl] = useState<LedgerEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [allowOpen, setAllowOpen] = useState(false);
  const [allowReason, setAllowReason] = useState("");
  const [allowResult, setAllowResult] = useState<AllowTradeResponse | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hideMatched, setHideMatched] = useState(false);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);

  const [insertOpen, setInsertOpen] = useState(false);
  const [insertPrefill, setInsertPrefill] = useState<LedgerEntry | null>(null);
  const [insertAccountNo, setInsertAccountNo] = useState("");

  const accounts = useMemo(() => certData?.accounts ?? [], [certData]);
  const primaryAccountNo = useMemo(
    () => accounts.find((a) => a.primary)?.accountNo ?? accounts[0]?.accountNo ?? "",
    [accounts],
  );

  // Certificate rows from all accounts (union), used for the CSCS comparison.
  const allCertEntries = useMemo(
    () => accounts.flatMap((a) => a.certificates.map((c) => certToEntry(c, a.accountNo))),
    [accounts],
  );
  const effectiveMrpsl = useMemo(() => [...allCertEntries, ...addedMrpsl], [allCertEntries, addedMrpsl]);

  const mrpslTransferNos = new Set(effectiveMrpsl.map((e) => e.transferNo).filter(Boolean));
  const cscsTransferNos = new Set(cscsEntries.map((e) => e.transferNo).filter(Boolean));

  const mrpslMissingCount = cscsEntries.filter((e) => e.transferNo && !mrpslTransferNos.has(e.transferNo)).length;
  const cscsMissingCount = effectiveMrpsl.filter((e) => e.transferNo && !cscsTransferNos.has(e.transferNo)).length;
  const totalDiscrepancies = mrpslMissingCount + cscsMissingCount;
  const isBalanced = cscsEntries.length > 0 && totalDiscrepancies === 0;

  const alignedRows = useMemo(() => {
    if (!showDiscrepancy) return [];
    const mMap = new Map(effectiveMrpsl.map((e) => [e.transferNo, e]));
    const cMap = new Map(cscsEntries.map((e) => [e.transferNo, e]));
    const keys = Array.from(new Set([...mMap.keys(), ...cMap.keys()]));
    return keys
      .map((key) => ({ key, mrpsl: mMap.get(key) ?? null, cscs: cMap.get(key) ?? null }))
      .sort((a, b) => new Date(a.mrpsl?.isoDate ?? a.cscs?.isoDate ?? "").getTime() - new Date(b.mrpsl?.isoDate ?? b.cscs?.isoDate ?? "").getTime());
  }, [showDiscrepancy, effectiveMrpsl, cscsEntries]);

  const displayCscs = cscsEntries.filter((e) => {
    if (!inDateRange(e.isoDate, dateFrom, dateTo)) return false;
    if (hideMatched && mrpslTransferNos.has(e.transferNo)) return false;
    return true;
  });
  const displayAligned = alignedRows.filter((r) => inDateRange(r.mrpsl?.isoDate ?? r.cscs?.isoDate ?? "", dateFrom, dateTo));

  // Per-account display entries (account's certs + added rows targeting it), filtered.
  const accountEntries = (a: HolderAccountPanel): LedgerEntry[] => {
    const base = a.certificates.map((c) => certToEntry(c, a.accountNo));
    const added = addedMrpsl.filter((e) => e.accountNo === a.accountNo);
    return [...base, ...added].filter((e) => {
      if (!inDateRange(e.isoDate, dateFrom, dateTo)) return false;
      if (hideMatched && cscsEntries.length > 0 && cscsTransferNos.has(e.transferNo)) return false;
      return true;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCscsCsv((ev.target?.result as string) ?? "");
      if (rows.length === 0) { toast.error("No valid records found in the uploaded file."); return; }
      setCscsEntries(rows);
      setCscsFileName(file.name);
      setShowDiscrepancy(false);
      toast.success(`CSCS file loaded — ${rows.length} record${rows.length !== 1 ? "s" : ""} found.`);
    };
    reader.onerror = () => toast.error("Failed to read file.");
    reader.readAsText(file);
    e.target.value = "";
  };

  const openAdd = (accountNo: string, prefill: LedgerEntry | null) => {
    setInsertAccountNo(accountNo || primaryAccountNo);
    setInsertPrefill(prefill);
    setInsertOpen(true);
  };

  const addAllMissing = () => {
    const fresh = cscsEntries.filter((e) => e.transferNo && !mrpslTransferNos.has(e.transferNo));
    setAddedMrpsl((prev) => [...prev, ...fresh.map((e) => ({ ...e, id: `added-${primaryAccountNo}-${e.transferNo}`, status: undefined, accountNo: primaryAccountNo }))]);
    toast.success(`${fresh.length} missing transaction${fresh.length !== 1 ? "s" : ""} added to account ${primaryAccountNo}.`);
  };

  const handleSave = async () => {
    if (addedMrpsl.length === 0 && !context?.flaggedItemId) {
      toast.info("No new movements to save.");
      return;
    }
    try {
      await save.mutateAsync({
        register,
        flaggedItemId: context?.flaggedItemId,
        note: undefined,
        entries: addedMrpsl.map((e) => ({
          accountNo: e.accountNo || primaryAccountNo,
          chn,
          type: e.type,
          units: e.units,
          transferNo: e.transferNo || undefined,
          date: e.isoDate || undefined,
        })),
      });
      setSaved(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Officer override — let the flagged trade through on review (backend blocks a true oversell).
  const handleAllow = async () => {
    if (!context?.flaggedItemId) return;
    if (!allowReason.trim()) { toast.error("Enter a reason for allowing this trade."); return; }
    try {
      const res = await allow.mutateAsync({ id: context.flaggedItemId, reason: allowReason.trim() });
      setAllowOpen(false);
      setAllowResult(res);
      toast.success(`Trade allowed — the holder's position is now ${formatNumber(res.projectedUnits)}.`);
      setSaved(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const saving = save.isPending;
  const allowing = allow.isPending;

  // ── Saved confirmation ──
  if (saved) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <p className="font-semibold text-lg">{allowResult ? "Trade Allowed" : "Records Saved"}</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {allowResult
              ? `Trade allowed for ${holderName} (${chn}) — the parked trade was applied and the position recomputed to ${formatNumber(allowResult.projectedUnits)}.`
              : addedMrpsl.length > 0
              ? `${addedMrpsl.length} certificate movement${addedMrpsl.length !== 1 ? "s" : ""} posted for ${holderName} (${chn}) — the affected account positions have been recomputed.`
              : `Reconciliation for ${holderName} (${chn}) has been marked resolved.`}
          </p>
          <Button onClick={() => { onSaved?.(); onBack(); }}>{backLabel}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-base font-bold tracking-tight">Resolution Desk: {holderName} ({chn})</h2>
        <Badge className="ml-auto border-0 bg-gray-100 text-gray-700 shrink-0">{register}</Badge>
        {accounts.length > 1 && (
          <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800 shrink-0">{accounts.length} accounts</Badge>
        )}
        {cscsFileName && (
          <Badge className="border-0 text-[12px] bg-blue-100 text-blue-800 shrink-0">{cscsEntries.length} CSCS records</Badge>
        )}
      </div>

      {/* Shortfall context (CSCS Update tab) */}
      {context?.shortfall != null && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Shortfall identified:</strong> {holderName} ({chn}) attempted to sell{" "}
              <strong>{formatNumber(context.attemptedSell ?? 0)} units</strong> in {register}
              {context.transactionDate ? ` on ${fmtDisplay(context.transactionDate)}` : ""}, but only held{" "}
              <strong>{formatNumber(context.holdingsAtFlag ?? 0)} units</strong> — a shortfall of{" "}
              <strong>{formatNumber(context.shortfall ?? 0)} units</strong>. Review the account ledgers on the left
              (including the shareholder&apos;s other accounts) and add the missing movement(s) to reconcile.
            </p>
          </div>
          {context.flaggedItemId && (
            <div className="flex items-center justify-end gap-2 border-t border-amber-200/70 pt-2.5">
              <span className="text-[12px] text-amber-700 mr-auto">
                Reviewed and satisfied the holder is entitled to sell? Let the trade through.
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => { setAllowReason(""); setAllowOpen(true); }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Allow Trade
              </Button>
            </div>
          )}
        </div>
      )}

      {isBalanced && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">
            MRPSL and CSCS records are fully balanced — all {effectiveMrpsl.length} movements match.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-[12px] text-muted-foreground whitespace-nowrap">From</label>
          <Input type="date" className="h-8 text-[13px] w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[12px] text-muted-foreground whitespace-nowrap">To</label>
          <Input type="date" className="h-8 text-[13px] w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[13px]" onClick={() => setHideMatched((v) => !v)}>
          {hideMatched ? <><Eye className="h-3.5 w-3.5" />Show Matched</> : <><EyeOff className="h-3.5 w-3.5" />Hide Matched</>}
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[13px]" onClick={() => toast.success("Comparison refreshed.")}>
          <RefreshCw className="h-3.5 w-3.5" /> Re-Compare
        </Button>
        {isBalanced ? (
          <span className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-green-200 bg-green-50 text-green-700 text-[13px] font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
          </span>
        ) : showDiscrepancy ? (
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-200 bg-blue-50 text-blue-800 text-[13px] font-medium hover:bg-blue-100 transition-colors" onClick={() => setShowDiscrepancy(false)}>
            <X className="h-3.5 w-3.5 text-blue-600" /> Exit Discrepancy View
          </button>
        ) : (
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-[13px] font-medium hover:bg-amber-100 transition-colors" onClick={() => setShowDiscrepancy(true)}>
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            {cscsEntries.length > 0 ? `${totalDiscrepancies} discrepanc${totalDiscrepancies !== 1 ? "ies" : "y"} — Show Discrepancy` : "Show Discrepancy"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading certificate ledger…
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to load certificate ledger."}</div>
      ) : showDiscrepancy ? (
        /* Discrepancy / aligned view (union of all accounts vs CSCS) */
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Discrepancy View — {displayAligned.length} rows</span>
              {mrpslMissingCount > 0 && <Badge className="border-0 text-[11px] bg-red-100 text-red-700">{mrpslMissingCount} missing from MRPSL</Badge>}
              {cscsMissingCount > 0 && <Badge className="border-0 text-[11px] bg-orange-100 text-orange-700">{cscsMissingCount} missing from CSCS</Badge>}
            </div>
            {mrpslMissingCount > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-[12px] border-red-200 text-red-700 hover:bg-red-50 gap-1" onClick={addAllMissing}>
                <Plus className="h-3 w-3" /> Add All Missing to Acct {primaryAccountNo}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 border-b border-border/60">
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/60">MRPSL Certificate Ledger (all accounts)</div>
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CSCS Cleared Records</div>
          </div>
          <div className="divide-y divide-border/50 text-[13px]">
            {displayAligned.map((row) => (
              <div key={row.key} className="grid grid-cols-2 min-h-13">
                {row.mrpsl === null ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-red-50/50 border-r border-border/60">
                    <span className="text-[13px] italic text-muted-foreground">Missing</span>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-red-200 text-red-600 hover:bg-red-50 shrink-0" title="Add to MRPSL" onClick={() => row.cscs && openAdd(primaryAccountNo, row.cscs)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 border-r border-border/60">
                    <div>
                      <p className="font-medium">{row.mrpsl.displayDate} <span className={txColor(row.mrpsl.type)}>({row.mrpsl.type})</span></p>
                      <p className="text-[11px] text-muted-foreground font-mono">{row.mrpsl.transferNo || "—"}{row.mrpsl.accountNo ? ` · acct ${row.mrpsl.accountNo}` : ""}</p>
                    </div>
                    <span className="font-mono font-bold text-[12px] shrink-0 ml-2">{formatNumber(row.mrpsl.units)}</span>
                  </div>
                )}
                {row.cscs === null ? (
                  <div className="flex items-center px-4 py-3 bg-orange-50/40"><span className="text-[13px] italic text-muted-foreground">Missing</span></div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{row.cscs.displayDate} <span className={txColor(row.cscs.type)}>({row.cscs.type})</span></p>
                      <p className="text-[11px] text-muted-foreground font-mono">{row.cscs.transferNo}{row.cscs.status ? ` · ${row.cscs.status}` : ""}</p>
                    </div>
                    <span className="font-mono font-bold text-[12px] shrink-0 ml-2">{formatNumber(row.cscs.units)}</span>
                  </div>
                )}
              </div>
            ))}
            {displayAligned.length === 0 && (
              <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">
                {cscsEntries.length === 0 ? "Upload a CSCS file to begin comparison." : "No rows match the current filter."}
              </p>
            )}
          </div>
        </Card>
      ) : (
        /* Side-by-side: left = stacked per-account certificate ledgers, right = CSCS upload */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <Card className="mrpsl-card">
                <p className="px-4 py-10 text-center text-muted-foreground text-[13px] italic">
                  No holder account found for this CHN in {register}.
                </p>
              </Card>
            ) : (
              accounts.map((a) => (
                <AccountPanel
                  key={a.accountNo}
                  account={a}
                  entries={accountEntries(a)}
                  onAdd={() => openAdd(a.accountNo, null)}
                />
              ))
            )}
          </div>

          {/* CSCS upload */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CSCS Cleared Records</span>
              {cscsEntries.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold">{displayCscs.length} records</span>
                  <button className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors" onClick={() => fileInputRef.current?.click()}>Replace file</button>
                </div>
              )}
            </div>
            {cscsEntries.length === 0 ? (
              <div className="px-4 py-6 flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><Upload className="h-4 w-4 text-muted-foreground" /></div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Upload CSCS Transaction File</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">For <span className="font-medium text-foreground">{holderName}</span> · {register}</p>
                </div>
                <Button variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Choose File
                </Button>
                <p className="text-[11px] text-muted-foreground">CSV or TXT · Max 10 MB</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-[13px]">
                {displayCscs.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="font-medium">{e.displayDate} <span className={txColor(e.type)}>({e.type})</span></p>
                      <p className="text-[11px] text-muted-foreground font-mono">{e.transferNo}{e.status ? ` · ${e.status}` : ""}</p>
                    </div>
                    <span className="font-mono font-bold">{formatNumber(e.units)}</span>
                  </div>
                ))}
                {displayCscs.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">No records match the current filter.</p>}
              </div>
            )}
          </Card>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

      <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Records
      </Button>

      <InsertModal
        key={`${insertAccountNo}-${insertPrefill?.id ?? "manual"}`}
        open={insertOpen}
        onClose={() => setInsertOpen(false)}
        prefill={insertPrefill}
        chn={chn}
        register={register}
        accounts={accounts}
        initialAccountNo={insertAccountNo || primaryAccountNo}
        onInserted={(entry) => setAddedMrpsl((prev) => [...prev, entry])}
      />

      {/* Officer override — allow the flagged trade through */}
      <Dialog open={allowOpen} onOpenChange={(o) => { if (!o) setAllowOpen(false); }}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-bold leading-tight">Allow Trade (override)</DialogTitle>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Posts the flagged trade to {register} for {holderName} ({chn}) and recomputes the position. It is
              refused if the holder&apos;s true position (across all their certificates) would go negative. A
              reason is required and recorded on the audit trail.
            </p>
            {addedMrpsl.length > 0 && (
              <p className="text-[12px] text-amber-700 mt-2">
                Note: {addedMrpsl.length} unsaved movement{addedMrpsl.length !== 1 ? "s" : ""} in the panels
                below will not be included here — use the Save Records button for those instead.
              </p>
            )}
          </div>
          <div className="px-6 py-5 space-y-2">
            <label className="mrpsl-label" htmlFor="allow-trade-reason">Reason / justification</label>
            <Textarea
              id="allow-trade-reason"
              value={allowReason}
              onChange={(e) => setAllowReason(e.target.value)}
              rows={3}
              placeholder="e.g. Confirmed the holder's 200 units are held on paper (ACTIVE) and cover the sale."
            />
          </div>
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAllowOpen(false)} disabled={allowing}>Cancel</Button>
            <Button onClick={handleAllow} disabled={allowing || !allowReason.trim()}>
              {allowing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Allow Trade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
