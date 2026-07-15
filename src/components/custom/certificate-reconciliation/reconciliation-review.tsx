"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Plus,
  Upload,
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

interface LedgerEntry {
  id: string;
  date: string;
  type: "BUY" | "SELL";
  transferNo: string;
  units: number;
  status?: string;
}

interface MissingEntry {
  id: string;
  date: string;
  type: "BUY" | "SELL";
  transferNo: string;
  units: number;
  reason: string;
}

// ── MRPSL seed data (internal register — always present) ───────────────────

interface MrpslLedgerData {
  mrpsl: LedgerEntry[];
}

const SEED_MRPSL: Record<string, MrpslLedgerData> = {
  C0023456BK: {
    mrpsl: [
      {
        id: "m1",
        date: "10 Mar 2026",
        type: "BUY",
        transferNo: "TRF-DANGCEM-HIST-220",
        units: 12000,
      },
      {
        id: "m2",
        date: "07 Jul 2026",
        type: "BUY",
        transferNo: "TRF-DANGCEM-002",
        units: 500,
      },
    ],
  },
  C0045678DK: {
    mrpsl: [
      {
        id: "m1",
        date: "05 Apr 2026",
        type: "BUY",
        transferNo: "TRF-MTNN-HIST-305",
        units: 8000,
      },
    ],
  },
  C0067890FK: {
    mrpsl: [
      {
        id: "m1",
        date: "01 Jun 2026",
        type: "BUY",
        transferNo: "TRF-SEPLAT-HIST-410",
        units: 34500,
      },
      {
        id: "m2",
        date: "07 Jul 2026",
        type: "BUY",
        transferNo: "TRF-SEPLAT-003",
        units: 1200,
      },
    ],
  },
  C0089012HK: {
    mrpsl: [
      {
        id: "m1",
        date: "15 May 2026",
        type: "BUY",
        transferNo: "TRF-UBA-HIST-601",
        units: 45000,
      },
    ],
  },
};

// ── CSV parser ─────────────────────────────────────────────────────────────
// Format: referenceNo,seq,dateWithCUSTODIAN,units,sign+CHN
// e.g.   2604230005572040,1,20260423CUSTODIAN,4382,0-C000174359JI
//   sign: '0-' = SELL, '0+' = BUY

interface CsvRow {
  referenceNo: string;
  seq: number;
  date: string;
  units: number;
  type: "BUY" | "SELL";
  chn: string;
}

function formatRawDate(raw: string): string {
  const cleaned = raw.replace(/[^0-9]/g, "");
  if (cleaned.length < 8) return raw;
  const year = cleaned.slice(0, 4);
  const month = cleaned.slice(4, 6);
  const day = cleaned.slice(6, 8);
  const d = new Date(`${year}-${month}-${day}T00:00:00`);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseCscsHistoryCsv(text: string): CsvRow[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  const rows: CsvRow[] = [];
  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 5) continue;
    const referenceNo = parts[0].trim();
    const seq = parseInt(parts[1].trim(), 10) || 0;
    const date = formatRawDate(parts[2].trim());
    const units = parseInt(parts[3].trim(), 10) || 0;
    const lastCol = parts[4].trim(); // "0-C000174359JI" or "0+C000174363JI"
    if (lastCol.length < 3) continue;
    const sign = lastCol.charAt(1); // '-' or '+'
    const chn = lastCol.slice(2);
    const type: "BUY" | "SELL" = sign === "+" ? "BUY" : "SELL";
    rows.push({ referenceNo, seq, date, units, type, chn });
  }
  return rows;
}

function csvRowsToLedgerEntries(rows: CsvRow[]): LedgerEntry[] {
  return rows.map((r, i) => ({
    id: `csv-${i}`,
    date: r.date,
    type: r.type,
    transferNo: r.seq > 1 ? `${r.referenceNo}-${r.seq}` : r.referenceNo,
    units: r.units,
    status: "CLEARED",
  }));
}

// ── Pull History upload screen ─────────────────────────────────────────────

interface PullHistoryUploadProps {
  item: FlaggedItem;
  onBack: () => void;
  onLoaded: (rows: CsvRow[]) => void;
}

function PullHistoryUpload({ item, onBack, onLoaded }: PullHistoryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoad = () => {
    if (!file) {
      toast.error("Select a file first.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const rows = parseCscsHistoryCsv(text);
      setLoading(false);
      if (rows.length === 0) {
        toast.error("No valid records found in the uploaded file.");
        return;
      }
      toast.success(
        `Loaded ${rows.length} record${rows.length !== 1 ? "s" : ""} from CSCS history file.`,
      );
      onLoaded(rows);
    };
    reader.onerror = () => {
      setLoading(false);
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">
      {/* Back nav */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Pending List
        </Button>
      </div>

      {/* Centred upload card */}
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-2xl mrpsl-card overflow-hidden">
          {/* Card header */}
          <div className="px-6 pt-6 pb-5 border-b border-border text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Pull History</h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              CHN: <span className="font-mono text-foreground">{item.chn}</span>
              {" · "}
              <span className="font-medium text-foreground">
                {item.register}
              </span>
            </p>
          </div>

          {/* Card body */}
          <div className="px-6 py-5 space-y-4">
            {/* Shortfall banner */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-800 space-y-0.5">
                <p className="font-semibold">
                  Flagged Shortfall: {formatNumber(item.shortfall)} units
                </p>
                <p className="text-amber-700">
                  Attempted sell of {formatNumber(item.attemptedSell)} units on{" "}
                  {item.transactionDate}
                </p>
              </div>
            </div>

            {/* File input */}
            <div className="space-y-1.5">
              <label className="mrpsl-label">
                Upload Historical CSCS Ledger Document
              </label>
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <span className="text-muted-foreground text-xs font-medium shrink-0">
                  Choose File
                </span>
                <span className="text-sm truncate flex-1 text-muted-foreground">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Card footer */}
          <div className="px-6 pb-6">
            <Button
              className="w-full"
              onClick={handleLoad}
              disabled={!file || loading}
            >
              {loading ? "Loading…" : "Load Ledger"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Insert Missing Transaction modal ──────────────────────────────────────

interface InsertModalProps {
  open: boolean;
  onClose: () => void;
  prefill: MissingEntry | null;
  chn: string;
  register: string;
  onInserted: () => void;
}

function InsertModal({
  open,
  onClose,
  prefill,
  chn,
  register,
  onInserted,
}: InsertModalProps) {
  const [units, setUnits] = useState(String(prefill?.units ?? ""));
  const [txDate, setTxDate] = useState(prefill?.date ?? "");
  const [txNo, setTxNo] = useState(prefill?.transferNo ?? "");
  const [type, setType] = useState<"BUY" | "SELL" | "">(prefill?.type ?? "");

  const handleSubmit = () => {
    if (!units || Number(units) <= 0) {
      toast.error("Enter a valid unit count.");
      return;
    }
    if (!type) {
      toast.error("Select a transaction type.");
      return;
    }
    toast.success(
      `Missing transaction inserted — ${type} of ${formatNumber(Number(units))} units for ${chn} (${register}).`,
    );
    onInserted();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold leading-tight">
            Insert Missing Transaction
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            CHN <span className="font-mono text-foreground">{chn}</span> ·{" "}
            {register}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {prefill && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-800 leading-relaxed">
                Pre-filled from CSCS record — review and confirm before
                submitting.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transaction Date</label>
              <Input
                className="mrpsl-input"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                placeholder="e.g. 15 Jan 2026"
              />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transfer Number</label>
              <Input
                className="mrpsl-input font-mono"
                value={txNo}
                onChange={(e) => setTxNo(e.target.value)}
                placeholder="e.g. TRF-DANGCEM-001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Units</label>
              <Input
                className="mrpsl-input font-mono"
                type="number"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transaction Type</label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "BUY" | "SELL")}
              >
                <SelectTrigger className="mrpsl-input">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="mrpsl-label">Symbol / Register</label>
              <Input
                className="mrpsl-input bg-muted/40 text-muted-foreground"
                value={register}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Resolution Workspace ──────────────────────────────────────────────

interface ResolutionWorkspaceProps {
  item: FlaggedItem;
  onBack: () => void;
  onResolved: () => void;
  skipPullHistory?: boolean;
  onHistoryLoaded?: (id: string) => void;
}

export function ResolutionWorkspace({
  item,
  onBack,
  onResolved,
  skipPullHistory = false,
  onHistoryLoaded,
}: ResolutionWorkspaceProps) {
  const [pullHistoryLoaded, setPullHistoryLoaded] = useState(skipPullHistory);
  const [uploadedRows, setUploadedRows] = useState<CsvRow[]>([]);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertPrefill, setInsertPrefill] = useState<MissingEntry | null>(null);
  const [resolved, setResolved] = useState(false);

  const mrpslData = SEED_MRPSL[item.chn] ?? { mrpsl: [] };

  // Derive CSCS entries from uploaded file.
  // Filter to matching CHN first; if none match (different CHN set in file), show all rows.
  const filteredRows = uploadedRows.filter((r) => r.chn === item.chn);
  const cscsEntries: LedgerEntry[] = csvRowsToLedgerEntries(
    filteredRows.length > 0 ? filteredRows : uploadedRows,
  );

  // Derive missing: CSCS rows whose transfer number isn't in MRPSL
  const mrpslTransferNos = new Set(mrpslData.mrpsl.map((e) => e.transferNo));
  const missingEntries: MissingEntry[] = cscsEntries
    .filter((e) => !mrpslTransferNos.has(e.transferNo))
    .map((e, i) => ({
      id: `miss-${i}`,
      date: e.date,
      type: e.type,
      transferNo: e.transferNo,
      units: e.units,
      reason:
        "Transaction found in CSCS history but not present in MRPSL register.",
    }));

  const handleInserted = () => setResolved(true);

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

  // ── Step 3: Resolved confirmation ────────────────────────────────────────
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
          <p className="font-semibold text-lg">Transaction Resolved</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            The missing purchase for <strong>{item.holderName}</strong> (
            {item.chn}) has been inserted. The shortfall of{" "}
            <strong>{formatNumber(item.shortfall)} units</strong> now balances
            out.
          </p>
          <Button onClick={onResolved}>Return to Pending List</Button>
        </div>
      </div>
    );
  }

  // ── Step 2: Resolution workspace ─────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">
      {/* Back + title */}
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

      {/* Alert */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Shortfall identified:</strong> {item.holderName} ({item.chn})
          attempted to sell{" "}
          <strong>{formatNumber(item.attemptedSell)} units</strong> in{" "}
          {item.register} on {item.transactionDate}, but the app only showed{" "}
          <strong>{formatNumber(item.holdingsAtFlag)} units</strong> held — a
          shortfall of <strong>{formatNumber(item.shortfall)} units</strong>.
          CSCS history shows {missingEntries.length} record
          {missingEntries.length !== 1 ? "s" : ""} not present in MRPSL.
        </p>
      </div>

      {/* Missing transactions block */}
      {missingEntries.length > 0 && (
        <Card className="border border-red-200 bg-red-50/20 overflow-hidden">
          <div className="px-4 py-2.5 bg-red-100/60 border-b border-red-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-800">
              <HelpCircle className="h-3.5 w-3.5" />
              Missing Transactions from MRPSL ({missingEntries.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-7"
              onClick={() => {
                toast.success(
                  `${missingEntries.length} missing transaction${missingEntries.length !== 1 ? "s" : ""} added to MRPSL register.`,
                );
                handleInserted();
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add All Missing
            </Button>
          </div>
          <div className="divide-y divide-border/40 text-sm">
            {missingEntries.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {m.date} —{" "}
                    <span
                      className={
                        m.type === "BUY" ? "text-green-700" : "text-red-600"
                      }
                    >
                      {m.type}
                    </span>
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 font-mono">
                    {m.transferNo}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 max-w-sm">
                    {m.reason}
                  </p>
                </div>
                <div className="text-right space-y-1.5">
                  <p className="font-mono font-bold text-red-600 text-base">
                    {formatNumber(m.units)} units
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setInsertPrefill(m);
                      setInsertOpen(true);
                    }}
                  >
                    Insert Missing
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {missingEntries.length === 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            All CSCS records are present in MRPSL — no missing transactions
            detected.
          </p>
        </div>
      )}

      {/* Side-by-side ledgers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MRPSL */}
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              MRPSL Register Records
            </span>
            <span className="text-xs font-mono font-bold">
              {mrpslData.mrpsl.length} records
            </span>
          </div>
          <div className="divide-y divide-border/60 text-[13px]">
            {mrpslData.mrpsl.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div>
                  <p className="font-medium">
                    {e.date}{" "}
                    <span
                      className={
                        e.type === "BUY" ? "text-green-700" : "text-red-600"
                      }
                    >
                      ({e.type})
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {e.transferNo}
                  </p>
                </div>
                <span className="font-mono font-bold">
                  {formatNumber(e.units)}
                </span>
              </div>
            ))}
            {mrpslData.mrpsl.length === 0 && (
              <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">
                No records.
              </p>
            )}
          </div>
        </Card>

        {/* CSCS Cleared (from uploaded file) */}
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              CSCS Cleared Records
            </span>
            <span className="text-xs font-mono font-bold">
              {cscsEntries.length} records
            </span>
          </div>
          <div className="divide-y divide-border/60 text-[13px]">
            {cscsEntries.map((e) => {
              const isMissing = !mrpslTransferNos.has(e.transferNo);
              return (
                <div
                  key={e.id}
                  className={`flex items-center justify-between px-4 py-2.5 ${isMissing ? "bg-red-50/60" : ""}`}
                >
                  <div>
                    <p className="font-medium flex items-center gap-1.5">
                      {e.date}{" "}
                      <span
                        className={
                          e.type === "BUY" ? "text-green-700" : "text-red-600"
                        }
                      >
                        ({e.type})
                      </span>
                      {isMissing && (
                        <Badge className="border-0 text-[10px] bg-red-100 text-red-700 py-0">
                          Not in MRPSL
                        </Badge>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {e.transferNo} · {e.status}
                    </p>
                  </div>
                  <span className="font-mono font-bold">
                    {formatNumber(e.units)}
                  </span>
                </div>
              );
            })}
            {cscsEntries.length === 0 && (
              <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">
                No records in file.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Manual insert button */}
      <Button
        className="w-full gap-2"
        variant="outline"
        onClick={() => {
          setInsertPrefill(null);
          setInsertOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        Insert Missing Transaction Manually
      </Button>

      <InsertModal
        key={insertPrefill?.id ?? "manual"}
        open={insertOpen}
        onClose={() => setInsertOpen(false)}
        prefill={insertPrefill}
        chn={item.chn}
        register={item.register}
        onInserted={handleInserted}
      />
    </div>
  );
}
