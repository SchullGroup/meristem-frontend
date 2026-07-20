"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { FlaggedItem } from "./update-reconciliation";

// ── Types ──────────────────────────────────────────────────────────────────

type TxType = "BUY" | "SELL" | "RIGHTS" | "BONUS";

interface LedgerEntry {
  id: string;
  date: string;
  type: TxType;
  transferNo: string;
  units: number;
  status?: string;
}

interface MissingEntry {
  id: string;
  date: string;
  type: TxType;
  transferNo: string;
  units: number;
  reason: string;
}

interface AlignedRow {
  key: string;
  mrpsl: LedgerEntry | null;
  cscs: LedgerEntry | null;
}

function txColor(type: TxType): string {
  if (type === "BUY")    return "text-green-600";
  if (type === "SELL")   return "text-red-600";
  if (type === "RIGHTS") return "text-blue-600";
  return "text-purple-600";
}

function txBadgeClass(type: TxType): string {
  if (type === "BUY")    return "bg-green-100 text-green-800";
  if (type === "SELL")   return "bg-red-100 text-red-800";
  if (type === "RIGHTS") return "bg-blue-100 text-blue-800";
  return "bg-purple-100 text-purple-800";
}

function deriveAlignedRows(mrpsl: LedgerEntry[], cscs: LedgerEntry[]): AlignedRow[] {
  const mrpslMap = new Map(mrpsl.map((e) => [e.transferNo, e]));
  const cscsMap  = new Map(cscs.map((e) => [e.transferNo, e]));
  const allKeys  = Array.from(new Set([...mrpslMap.keys(), ...cscsMap.keys()]));
  return allKeys
    .map((key) => ({ key, mrpsl: mrpslMap.get(key) ?? null, cscs: cscsMap.get(key) ?? null }))
    .sort((a, b) => {
      const da = new Date(a.mrpsl?.date ?? a.cscs?.date ?? "").getTime();
      const db = new Date(b.mrpsl?.date ?? b.cscs?.date ?? "").getTime();
      return da - db;
    });
}

function inDateRange(entryDate: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = new Date(entryDate);
  if (isNaN(d.getTime())) return true;
  if (from && !isNaN(new Date(from + "T00:00:00").getTime()) && d < new Date(from + "T00:00:00")) return false;
  if (to   && !isNaN(new Date(to   + "T23:59:59").getTime()) && d > new Date(to   + "T23:59:59")) return false;
  return true;
}

// ── Counterparty seed ─────────────────────────────────────────────────────

interface Counterparty { chn: string; name: string; }

const COUNTERPARTY: Record<string, Counterparty> = {
  "TRF-DANGCEM-HIST-220": { chn: "C0034567EK", name: "EMEKA CHUKWU OBI" },
  "TRF-DANGCEM-002":      { chn: "C0045678DK", name: "ADAEZE NWOSU OKAFOR" },
  "TRF-MTNN-HIST-305":    { chn: "C0056789EK", name: "OLUWASEUN ADEYEMI BELLO" },
  "TRF-SEPLAT-HIST-410":  { chn: "C0078912HK", name: "CHUKWUEMEKA IHEJIRIKA" },
  "TRF-SEPLAT-003":       { chn: "C0078901GK", name: "IBRAHIM USMAN HASSAN" },
  "TRF-UBA-HIST-601":     { chn: "C0023456BK", name: "NGOZI CHIDINMA OKAFOR" },
};

// ── MRPSL seed ─────────────────────────────────────────────────────────────

const SEED_MRPSL: Record<string, LedgerEntry[]> = {
  C0023456BK: [
    { id: "m1", date: "10 Mar 2026", type: "BUY",   transferNo: "TRF-DANGCEM-HIST-220", units: 12000 },
    { id: "m2", date: "07 Jul 2026", type: "BONUS", transferNo: "TRF-DANGCEM-002",      units: 500 },
  ],
  C0045678DK: [
    { id: "m1", date: "05 Apr 2026", type: "BUY", transferNo: "TRF-MTNN-HIST-305", units: 8000 },
  ],
  C0067890FK: [
    { id: "m1", date: "01 Jun 2026", type: "BUY", transferNo: "TRF-SEPLAT-HIST-410", units: 34500 },
    { id: "m2", date: "07 Jul 2026", type: "BUY", transferNo: "TRF-SEPLAT-003",      units: 1200 },
  ],
  C0089012HK: [
    { id: "m1", date: "15 May 2026", type: "BUY", transferNo: "TRF-UBA-HIST-601", units: 45000 },
  ],
};

// ── CSV parser ─────────────────────────────────────────────────────────────

interface CsvRow { referenceNo: string; seq: number; date: string; units: number; type: TxType; chn: string; }

function formatRawDate(raw: string): string {
  const c = raw.replace(/[^0-9]/g, "");
  if (c.length < 8) return raw;
  const d = new Date(`${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}T00:00:00`);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function parseCscsHistoryCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  for (const line of text.trim().split(/\r?\n/).filter((l) => l.trim())) {
    const p = line.split(",");
    if (p.length < 5) continue;
    const last = p[4].trim();
    if (last.length < 3) continue;
    rows.push({
      referenceNo: p[0].trim(),
      seq:         parseInt(p[1].trim(), 10) || 0,
      date:        formatRawDate(p[2].trim()),
      units:       parseInt(p[3].trim(), 10) || 0,
      type:        last.charAt(1) === "+" ? "BUY" : "SELL",
      chn:         last.slice(2),
    });
  }
  return rows;
}

function csvRowsToLedgerEntries(rows: CsvRow[]): LedgerEntry[] {
  return rows.map((r, i) => ({
    id:         `csv-${i}`,
    date:       r.date,
    type:       r.type,
    transferNo: r.seq > 1 ? `${r.referenceNo}-${r.seq}` : r.referenceNo,
    units:      r.units,
    status:     "CLEARED",
  }));
}

// ── Pull History upload screen ─────────────────────────────────────────────

function PullHistoryUpload({
  item, onBack, onLoaded,
}: {
  item: FlaggedItem;
  onBack: () => void;
  onLoaded: (rows: CsvRow[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoad = () => {
    if (!file) { toast.error("Select a file first."); return; }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const rows = parseCscsHistoryCsv(text);
      setLoading(false);
      if (rows.length === 0) { toast.error("No valid records found in the uploaded file."); return; }
      toast.success(`Loaded ${rows.length} record${rows.length !== 1 ? "s" : ""} from CSCS history file.`);
      onLoaded(rows);
    };
    reader.onerror = () => { setLoading(false); toast.error("Failed to read file."); };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Pending List
        </Button>
      </div>
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-2xl mrpsl-card overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Pull History</h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              CHN: <span className="font-mono text-foreground">{item.chn}</span>{" · "}
              <span className="font-medium text-foreground">{item.register}</span>
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-800 space-y-0.5">
                <p className="font-semibold">Flagged Shortfall: {formatNumber(item.shortfall)} units</p>
                <p className="text-amber-700">Attempted sell of {formatNumber(item.attemptedSell)} units on {item.transactionDate}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Upload Historical CSCS Ledger Document</label>
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <span className="text-muted-foreground text-xs font-medium shrink-0">Choose File</span>
                <span className="text-sm truncate flex-1 text-muted-foreground">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>
              <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="px-6 pb-6">
            <Button className="w-full" onClick={handleLoad} disabled={!file || loading}>
              {loading ? "Loading…" : "Load Ledger"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Trade Detail modal ─────────────────────────────────────────────────────

function TradeDetailModal({
  open, onClose, entry, source, item,
}: {
  open: boolean;
  onClose: () => void;
  entry: LedgerEntry | null;
  source: "mrpsl" | "cscs";
  item: FlaggedItem;
}) {
  const router = useRouter();
  if (!entry) return null;
  const cp = COUNTERPARTY[entry.transferNo];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold leading-tight">Trade Detail</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">
            {source === "mrpsl" ? "MRPSL Register" : "CSCS Cleared"} ·{" "}
            <span className="font-mono text-foreground">{entry.transferNo}</span>
          </p>
        </div>
        <div className="px-6 py-5 space-y-5 text-[13px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Transaction</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div><p className="text-[12px] text-muted-foreground">Date</p><p className="font-medium">{entry.date}</p></div>
              <div>
                <p className="text-[12px] text-muted-foreground">Type</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${txBadgeClass(entry.type)}`}>{entry.type}</span>
              </div>
              <div><p className="text-[12px] text-muted-foreground">Units</p><p className="font-mono font-bold">{formatNumber(entry.units)}</p></div>
              {entry.status && <div><p className="text-[12px] text-muted-foreground">Status</p><p className="font-medium">{entry.status}</p></div>}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Holder</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div><p className="text-[12px] text-muted-foreground">CHN</p><p className="font-mono font-medium">{item.chn}</p></div>
              <div><p className="text-[12px] text-muted-foreground">Register</p><p className="font-medium">{item.register}</p></div>
              <div className="col-span-2"><p className="text-[12px] text-muted-foreground">Holder Name</p><p className="font-medium">{item.holderName}</p></div>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Traded With</p>
            {cp ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><p className="text-[12px] text-muted-foreground">Counterparty CHN</p><p className="font-mono font-medium">{cp.chn}</p></div>
                <div><p className="text-[12px] text-muted-foreground">Counterparty Name</p><p className="font-medium">{cp.name}</p></div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Counterparty details unavailable.</p>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="gap-1.5" onClick={() => {
            router.push(`/enquiry/shareholders?q=${encodeURIComponent(cp?.chn ?? item.chn)}`);
            onClose();
          }}>
            View Trade <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Insert Missing Transaction modal ─────────────────────────────────────

function InsertModal({
  open, onClose, prefill, chn, register, onInserted,
}: {
  open: boolean;
  onClose: () => void;
  prefill: MissingEntry | null;
  chn: string;
  register: string;
  onInserted: (entry: LedgerEntry) => void;
}) {
  const [units,  setUnits]  = useState(String(prefill?.units ?? ""));
  const [txDate, setTxDate] = useState(prefill?.date ?? "");
  const [txNo,   setTxNo]   = useState(prefill?.transferNo ?? "");
  const [type,   setType]   = useState<TxType | "">(prefill?.type ?? "");

  const handleSubmit = () => {
    if (!units || Number(units) <= 0) { toast.error("Enter a valid unit count."); return; }
    if (!type)                         { toast.error("Select a transaction type."); return; }
    if (!txNo.trim())                  { toast.error("Transfer Number is required."); return; }
    const newEntry: LedgerEntry = {
      id:         `added-${txNo.trim()}-${Date.now()}`,
      date:       txDate || "—",
      type:       type as TxType,
      transferNo: txNo.trim(),
      units:      Number(units),
    };
    toast.success(`Transaction inserted — ${type} of ${formatNumber(Number(units))} units for ${chn} (${register}).`);
    onInserted(newEntry);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold leading-tight">Insert Missing Transaction</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            CHN <span className="font-mono text-foreground">{chn}</span> · {register}
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {prefill && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-800 leading-relaxed">Pre-filled from CSCS record — review and confirm before submitting.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transaction Date</label>
              <Input className="mrpsl-input" value={txDate} onChange={(e) => setTxDate(e.target.value)} placeholder="e.g. 15 Jan 2026" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transfer Number <span className="text-destructive">*</span></label>
              <Input className="mrpsl-input font-mono" value={txNo} onChange={(e) => setTxNo(e.target.value)} placeholder="e.g. TRF-DANGCEM-001" />
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
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                  <SelectItem value="RIGHTS">RIGHTS</SelectItem>
                  <SelectItem value="BONUS">BONUS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="mrpsl-label">Symbol / Register</label>
              <Input className="mrpsl-input bg-muted/40 text-muted-foreground" value={register} disabled />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Resolution Workspace ──────────────────────────────────────────────

export function ResolutionWorkspace({
  item, onBack, onResolved, skipPullHistory = false, onHistoryLoaded,
}: {
  item: FlaggedItem;
  onBack: () => void;
  onResolved: () => void;
  skipPullHistory?: boolean;
  onHistoryLoaded?: (id: string) => void;
}) {
  const [pullHistoryLoaded, setPullHistoryLoaded] = useState(skipPullHistory);
  const [uploadedRows, setUploadedRows]           = useState<CsvRow[]>([]);
  const [addedMrpsl,   setAddedMrpsl]             = useState<LedgerEntry[]>([]);
  const [insertOpen,   setInsertOpen]             = useState(false);
  const [insertPrefill, setInsertPrefill]         = useState<MissingEntry | null>(null);
  const [resolved, setResolved]                   = useState(false);

  // Controls
  const [dateFrom, setDateFrom]                   = useState("");
  const [dateTo, setDateTo]                       = useState("");
  const [hideMatched, setHideMatched]             = useState(false);
  const [showDiscrepancy, setShowDiscrepancy]     = useState(false);

  // Detail modal
  const [detailEntry,  setDetailEntry]  = useState<LedgerEntry | null>(null);
  const [detailSource, setDetailSource] = useState<"mrpsl" | "cscs">("mrpsl");

  // Effective MRPSL = seed + locally added entries
  const seedMrpsl       = SEED_MRPSL[item.chn] ?? [];
  const effectiveMrpsl  = [...seedMrpsl, ...addedMrpsl];

  const filteredRows = uploadedRows.filter((r) => r.chn === item.chn);
  const cscsEntries: LedgerEntry[] = csvRowsToLedgerEntries(
    filteredRows.length > 0 ? filteredRows : uploadedRows,
  );

  const mrpslTransferNos = new Set(effectiveMrpsl.map((e) => e.transferNo));
  const cscsTransferNos  = new Set(cscsEntries.map((e) => e.transferNo));

  const mrpslMissingCount  = cscsEntries.filter((e) => !mrpslTransferNos.has(e.transferNo)).length;
  const cscsMissingCount   = effectiveMrpsl.filter((e) => !cscsTransferNos.has(e.transferNo)).length;
  const totalDiscrepancies = mrpslMissingCount + cscsMissingCount;
  const isBalanced         = cscsEntries.length > 0 && totalDiscrepancies === 0;

  const alignedRows: AlignedRow[] = showDiscrepancy
    ? deriveAlignedRows(effectiveMrpsl, cscsEntries)
    : [];

  const displayMrpsl = effectiveMrpsl.filter((e) => {
    if (!inDateRange(e.date, dateFrom, dateTo)) return false;
    if (hideMatched && cscsEntries.length > 0 && cscsTransferNos.has(e.transferNo)) return false;
    return true;
  });

  const displayCscs = cscsEntries.filter((e) => {
    if (!inDateRange(e.date, dateFrom, dateTo)) return false;
    if (hideMatched && mrpslTransferNos.has(e.transferNo)) return false;
    return true;
  });

  const displayAligned = alignedRows.filter((row) =>
    inDateRange(row.mrpsl?.date ?? row.cscs?.date ?? "", dateFrom, dateTo),
  );

  // Add a single entry to the MRPSL side
  const handleInsertedEntry = (entry: LedgerEntry) => {
    setAddedMrpsl((prev) => [...prev, entry]);
  };

  // Open InsertModal prefilled from a CSCS entry
  const openInsertFromCscs = (cscsEntry: LedgerEntry) => {
    setInsertPrefill({
      id:         `align-${cscsEntry.transferNo}`,
      date:       cscsEntry.date,
      type:       cscsEntry.type,
      transferNo: cscsEntry.transferNo,
      units:      cscsEntry.units,
      reason:     "Present in CSCS but missing from MRPSL.",
    });
    setInsertOpen(true);
  };

  // Add ALL CSCS-only entries to MRPSL at once
  const addAllMissing = () => {
    const newEntries = cscsEntries
      .filter((e) => !mrpslTransferNos.has(e.transferNo))
      .map((e) => ({ ...e, id: `added-${e.transferNo}`, status: undefined }));
    setAddedMrpsl((prev) => [...prev, ...newEntries]);
    toast.success(
      `${newEntries.length} missing transaction${newEntries.length !== 1 ? "s" : ""} added to MRPSL register.`,
    );
  };

  // ── Step 1: Pull History upload ──────────────────────────────────────────
  if (!pullHistoryLoaded) {
    return (
      <PullHistoryUpload
        item={item}
        onBack={onBack}
        onLoaded={(rows) => {
          setUploadedRows(rows);
          setPullHistoryLoaded(true);
          onHistoryLoaded?.(item.id);
        }}
      />
    );
  }

  // ── Resolved confirmation ────────────────────────────────────────────────
  if (resolved) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Pending List
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <p className="font-semibold text-lg">Records Saved</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {addedMrpsl.length > 0
              ? `${addedMrpsl.length} transaction${addedMrpsl.length !== 1 ? "s" : ""} added to the MRPSL register for ${item.holderName} (${item.chn}).`
              : `Reconciliation records for ${item.holderName} (${item.chn}) have been saved.`}
          </p>
          <Button onClick={onResolved}>Return to Pending List</Button>
        </div>
      </div>
    );
  }

  // ── Resolution workspace ─────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Pending List
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-base font-bold tracking-tight">
          Resolution Desk: {item.holderName} ({item.chn})
        </h2>
        <Badge className="ml-auto border-0 text-[12px] bg-blue-100 text-blue-800">
          {uploadedRows.length} records loaded
        </Badge>
      </div>

      {/* Shortfall alert */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Shortfall identified:</strong> {item.holderName} ({item.chn}) attempted to sell{" "}
          <strong>{formatNumber(item.attemptedSell)} units</strong> in {item.register} on{" "}
          {item.transactionDate}, but the app only showed{" "}
          <strong>{formatNumber(item.holdingsAtFlag)} units</strong> held — a shortfall of{" "}
          <strong>{formatNumber(item.shortfall)} units</strong>.
        </p>
      </div>

      {/* Balance indicator */}
      {isBalanced && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">
            MRPSL and CSCS records are fully balanced — all {effectiveMrpsl.length} transactions match.
          </p>
        </div>
      )}

      {/* Controls bar */}
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
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-200 bg-blue-50 text-blue-800 text-[13px] font-medium hover:bg-blue-100 transition-colors"
            onClick={() => setShowDiscrepancy(false)}
          >
            <X className="h-3.5 w-3.5 text-blue-600" /> Exit Discrepancy View
          </button>
        ) : (
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-[13px] font-medium hover:bg-amber-100 transition-colors"
            onClick={() => setShowDiscrepancy(true)}
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            {cscsEntries.length > 0
              ? `${totalDiscrepancies} discrepanc${totalDiscrepancies !== 1 ? "ies" : "y"} — Show Discrepancy`
              : "Show Discrepancy"}
          </button>
        )}
      </div>

      {/* ── Discrepancy / aligned view ─────────────────────────────────── */}
      {showDiscrepancy ? (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Discrepancy View — {displayAligned.length} rows
              </span>
              {mrpslMissingCount > 0 && (
                <Badge className="border-0 text-[11px] bg-red-100 text-red-700">{mrpslMissingCount} missing from MRPSL</Badge>
              )}
              {cscsMissingCount > 0 && (
                <Badge className="border-0 text-[11px] bg-orange-100 text-orange-700">{cscsMissingCount} missing from CSCS</Badge>
              )}
            </div>
            {mrpslMissingCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px] border-red-200 text-red-700 hover:bg-red-50 gap-1"
                onClick={addAllMissing}
              >
                <Plus className="h-3 w-3" /> Add All Missing to MRPSL
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 border-b border-border/60">
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/60">
              MRPSL Register Records
            </div>
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              CSCS Cleared Records
            </div>
          </div>

          <div className="divide-y divide-border/50 text-[13px]">
            {displayAligned.map((row) => (
              <div key={row.key} className="grid grid-cols-2 min-h-[52px]">
                {row.mrpsl === null ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-red-50/50 border-r border-border/60">
                    <span className="text-[13px] italic text-muted-foreground">Missing</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                      title="Add to MRPSL"
                      onClick={() => row.cscs && openInsertFromCscs(row.cscs)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between px-4 py-3 border-r border-border/60 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => { setDetailEntry(row.mrpsl!); setDetailSource("mrpsl"); }}
                  >
                    <div>
                      <p className="font-medium">{row.mrpsl!.date} <span className={txColor(row.mrpsl!.type)}>({row.mrpsl!.type})</span></p>
                      <p className="text-[11px] text-muted-foreground font-mono">{row.mrpsl!.transferNo}</p>
                    </div>
                    <span className="font-mono font-bold text-[12px] shrink-0 ml-2">{formatNumber(row.mrpsl!.units)}</span>
                  </div>
                )}
                {row.cscs === null ? (
                  <div className="flex items-center px-4 py-3 bg-orange-50/40">
                    <span className="text-[13px] italic text-muted-foreground">Missing</span>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => { setDetailEntry(row.cscs!); setDetailSource("cscs"); }}
                  >
                    <div>
                      <p className="font-medium">{row.cscs!.date} <span className={txColor(row.cscs!.type)}>({row.cscs!.type})</span></p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {row.cscs!.transferNo}{row.cscs!.status ? ` · ${row.cscs!.status}` : ""}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[12px] shrink-0 ml-2">{formatNumber(row.cscs!.units)}</span>
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
        /* ── Default side-by-side view ──────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">MRPSL Register Records</span>
                {addedMrpsl.length > 0 && (
                  <Badge className="border-0 text-[11px] bg-blue-100 text-blue-700">+{addedMrpsl.length} added</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold">{displayMrpsl.length} records</span>
                <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1"
                  onClick={() => { setInsertPrefill(null); setInsertOpen(true); }}>
                  <Plus className="h-3 w-3" /> Add Transaction
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border/60 text-[13px]">
              {displayMrpsl.map((e) => (
                <div key={e.id}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => { setDetailEntry(e); setDetailSource("mrpsl"); }}>
                  <div>
                    <p className="font-medium">{e.date} <span className={txColor(e.type)}>({e.type})</span></p>
                    <p className="text-[11px] text-muted-foreground font-mono">{e.transferNo}</p>
                  </div>
                  <span className="font-mono font-bold">{formatNumber(e.units)}</span>
                </div>
              ))}
              {displayMrpsl.length === 0 && (
                <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">
                  {effectiveMrpsl.length === 0 ? "No records." : "No records match the current filter."}
                </p>
              )}
            </div>
          </Card>

          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CSCS Cleared Records</span>
              <span className="text-xs font-mono font-bold">{displayCscs.length} records</span>
            </div>
            <div className="divide-y divide-border/60 text-[13px]">
              {displayCscs.map((e) => (
                <div key={e.id}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => { setDetailEntry(e); setDetailSource("cscs"); }}>
                  <div>
                    <p className="font-medium">{e.date} <span className={txColor(e.type)}>({e.type})</span></p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {e.transferNo}{e.status ? ` · ${e.status}` : ""}
                    </p>
                  </div>
                  <span className="font-mono font-bold">{formatNumber(e.units)}</span>
                </div>
              ))}
              {displayCscs.length === 0 && (
                <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">
                  {cscsEntries.length === 0 ? "No records in file." : "No records match the current filter."}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Save Records button */}
      <Button className="w-full gap-2" onClick={() => setResolved(true)}>
        Save Records
      </Button>

      <InsertModal
        key={insertPrefill?.id ?? "manual"}
        open={insertOpen}
        onClose={() => setInsertOpen(false)}
        prefill={insertPrefill}
        chn={item.chn}
        register={item.register}
        onInserted={handleInsertedEntry}
      />

      <TradeDetailModal
        open={detailEntry !== null}
        onClose={() => setDetailEntry(null)}
        entry={detailEntry}
        source={detailSource}
        item={item}
      />
    </div>
  );
}
