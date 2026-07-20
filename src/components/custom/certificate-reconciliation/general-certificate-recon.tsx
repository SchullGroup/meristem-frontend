"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink,
  Eye, EyeOff, Plus, RefreshCw, Upload, X, Zap,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

// ── Types ─────────────────────────────────────────────────────────────────

type TxType = "BUY" | "SELL" | "RIGHTS" | "BONUS";

interface LedgerEntry {
  id: string;
  date: string;
  type: TxType;
  transferNo: string;
  units: number;
  status?: string;
}

interface AlignedRow {
  key: string;
  mrpsl: LedgerEntry | null;
  cscs: LedgerEntry | null;
}

interface MissingEntry {
  id: string;
  date: string;
  type: TxType;
  transferNo: string;
  units: number;
  reason: string;
}

interface Shareholder {
  id: string;
  name: string;
  chn: string;
  bvn: string;
  nin: string;
  phone: string;
  email: string;
  registers: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function txColor(type: TxType | string): string {
  if (type === "SELL")   return "text-red-600";
  if (type === "RIGHTS") return "text-blue-600";
  if (type === "BONUS")  return "text-purple-600";
  return "text-green-600";
}

function txBadgeClass(type: TxType | string): string {
  if (type === "SELL")   return "bg-red-100 text-red-800";
  if (type === "RIGHTS") return "bg-blue-100 text-blue-800";
  if (type === "BONUS")  return "bg-purple-100 text-purple-800";
  return "bg-green-100 text-green-800";
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

// ── Seed data ─────────────────────────────────────────────────────────────

const SHAREHOLDERS: Shareholder[] = [
  { id: "1", name: "JOHN ADEYEMI BABATUNDE",   chn: "C0012345AK", bvn: "12345001001", nin: "NIN001001001", phone: "08011001001", email: "john.babatunde@email.com",   registers: ["DANGCEM", "GTCO"] },
  { id: "2", name: "NGOZI CHIDINMA OKAFOR",    chn: "C0023456BK", bvn: "12345002002", nin: "NIN002002002", phone: "08011002002", email: "ngozi.okafor@email.com",      registers: ["DANGCEM"] },
  { id: "3", name: "SAMUEL OLUWASEUN ADELEKE", chn: "C0034567CK", bvn: "12345003003", nin: "NIN003003003", phone: "08011003003", email: "samuel.adeleke@email.com",    registers: ["MTNN", "ZENITH"] },
  { id: "4", name: "FATIMA ABUBAKAR MUSA",     chn: "C0045678DK", bvn: "12345004004", nin: "NIN004004004", phone: "08011004004", email: "fatima.musa@email.com",       registers: ["MTNN"] },
  { id: "5", name: "EMEKA CHUKWUEMEKA EZE",    chn: "C0056789EK", bvn: "12345005005", nin: "NIN005005005", phone: "08011005005", email: "emeka.eze@email.com",         registers: ["SEPLAT"] },
];

// MRPSL records per "CHN|register"
const MRPSL_SEED: Record<string, LedgerEntry[]> = {
  "C0023456BK|DANGCEM": [
    { id: "r1", transferNo: "TRF-DNG-2025-001", date: "01 Mar 2025", type: "BUY",  units: 10000, status: "CLEARED" },
    { id: "r2", transferNo: "TRF-DNG-2025-002", date: "15 Jun 2025", type: "BUY",  units: 5000,  status: "CLEARED" },
    { id: "r3", transferNo: "TRF-DNG-2025-003", date: "20 Sep 2025", type: "SELL", units: 2500,  status: "CLEARED" },
    { id: "r4", transferNo: "TRF-DNG-2025-004", date: "10 Dec 2025", type: "BUY",  units: 3500,  status: "PENDING" },
  ],
  "C0012345AK|DANGCEM": [
    { id: "r5", transferNo: "TRF-DNG-2025-010", date: "15 Jan 2025", type: "BUY",  units: 20000, status: "CLEARED" },
    { id: "r6", transferNo: "TRF-DNG-2025-011", date: "01 Apr 2025", type: "BUY",  units: 12000, status: "CLEARED" },
    { id: "r7", transferNo: "TRF-DNG-2025-012", date: "28 Jul 2025", type: "SELL", units: 800,   status: "CLEARED" },
  ],
  "C0012345AK|GTCO": [
    { id: "r8", transferNo: "TRF-GTCO-2025-001", date: "20 Feb 2025", type: "BUY", units: 8000, status: "CLEARED" },
    { id: "r9", transferNo: "TRF-GTCO-2025-002", date: "10 Jun 2025", type: "BUY", units: 4000, status: "CLEARED" },
  ],
  "C0034567CK|MTNN": [
    { id: "r10", transferNo: "TRF-MTN-2025-001", date: "10 Feb 2025", type: "BUY",  units: 50000, status: "CLEARED" },
    { id: "r11", transferNo: "TRF-MTN-2025-002", date: "05 May 2025", type: "BUY",  units: 30000, status: "CLEARED" },
    { id: "r12", transferNo: "TRF-MTN-2025-003", date: "01 Aug 2025", type: "SELL", units: 10000, status: "CLEARED" },
  ],
};

// CSCS records per "CHN|register" (simulated upload — includes deliberate discrepancies)
const CSCS_SEED: Record<string, LedgerEntry[]> = {
  "C0023456BK|DANGCEM": [
    { id: "c1", transferNo: "TRF-DNG-2025-001", date: "01 Mar 2025", type: "BUY",  units: 10000, status: "CLEARED" },
    { id: "c2", transferNo: "TRF-DNG-2025-002", date: "15 Jun 2025", type: "BUY",  units: 5000,  status: "CLEARED" },
    // TRF-DNG-2025-003 and -004 missing from CSCS
    { id: "c3", transferNo: "TRF-DNG-CSCS-X01", date: "30 Oct 2025", type: "BUY",  units: 1000,  status: "CLEARED" },
  ],
  "C0012345AK|DANGCEM": [
    { id: "c4", transferNo: "TRF-DNG-2025-010", date: "15 Jan 2025", type: "BUY",  units: 20000, status: "CLEARED" },
    { id: "c5", transferNo: "TRF-DNG-2025-011", date: "01 Apr 2025", type: "BUY",  units: 12000, status: "CLEARED" },
    { id: "c6", transferNo: "TRF-DNG-2025-012", date: "28 Jul 2025", type: "SELL", units: 900,   status: "CLEARED" }, // variance
  ],
  "C0012345AK|GTCO": [
    { id: "c7", transferNo: "TRF-GTCO-2025-001", date: "20 Feb 2025", type: "BUY", units: 8000, status: "CLEARED" },
    { id: "c8", transferNo: "TRF-GTCO-2025-002", date: "10 Jun 2025", type: "BUY", units: 4000, status: "CLEARED" },
  ],
  "C0034567CK|MTNN": [
    { id: "c9",  transferNo: "TRF-MTN-2025-001", date: "10 Feb 2025", type: "BUY",  units: 50000, status: "CLEARED" },
    { id: "c10", transferNo: "TRF-MTN-2025-002", date: "05 May 2025", type: "BUY",  units: 30000, status: "CLEARED" },
    // TRF-MTN-2025-003 missing from CSCS
  ],
};

const REGISTERS = ["DANGCEM", "MTNN", "SEPLAT", "UBA", "GTCO", "ZENITH"];

function getHoldersInRegister(reg: string) {
  return SHAREHOLDERS.filter((s) => s.registers.includes(reg)).map((s) => {
    const records = MRPSL_SEED[`${s.chn}|${reg}`] ?? [];
    return { ...s, records };
  });
}

function searchShareholders(fields: {
  chn: string; bvn: string; nin: string; phone: string; email: string;
}): Shareholder[] {
  if (!Object.values(fields).some((v) => v.trim())) return [];
  return SHAREHOLDERS.filter((s) => {
    if (fields.chn   && !s.chn.toLowerCase().includes(fields.chn.toLowerCase()))     return false;
    if (fields.bvn   && !s.bvn.includes(fields.bvn))                                return false;
    if (fields.nin   && !s.nin.toLowerCase().includes(fields.nin.toLowerCase()))     return false;
    if (fields.phone && !s.phone.includes(fields.phone))                             return false;
    if (fields.email && !s.email.toLowerCase().includes(fields.email.toLowerCase())) return false;
    return true;
  });
}

// ── Insert Modal ──────────────────────────────────────────────────────────

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
              <Input className="mrpsl-input" value={txDate} onChange={(e) => setTxDate(e.target.value)} placeholder="e.g. 15 Jan 2025" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transfer Number <span className="text-destructive">*</span></label>
              <Input className="mrpsl-input font-mono" value={txNo} onChange={(e) => setTxNo(e.target.value)} placeholder="e.g. TRF-DNG-2025-001" />
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

// ── Trade Detail modal ─────────────────────────────────────────────────────

function TradeDetailModal({
  open, onClose, entry, source, holder, register,
}: {
  open: boolean;
  onClose: () => void;
  entry: LedgerEntry | null;
  source: "mrpsl" | "cscs";
  holder: Shareholder;
  register: string;
}) {
  const router = useRouter();
  if (!entry) return null;

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
              <div><p className="text-[12px] text-muted-foreground">CHN</p><p className="font-mono font-medium">{holder.chn}</p></div>
              <div><p className="text-[12px] text-muted-foreground">Register</p><p className="font-medium">{register}</p></div>
              <div className="col-span-2"><p className="text-[12px] text-muted-foreground">Holder Name</p><p className="font-medium">{holder.name}</p></div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="gap-1.5" onClick={() => {
            router.push(`/enquiry/shareholders?q=${encodeURIComponent(holder.chn)}`);
            onClose();
          }}>
            View Trade <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

type Phase = "search" | "desk" | "resolved";

export default function GeneralCertificateReconciliation() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase]       = useState<Phase>("search");
  const [scopeMode, setScopeMode] = useState<"all" | "spec">("all");

  // Search inputs
  const [chnInput,   setChnInput]   = useState("");
  const [bvnInput,   setBvnInput]   = useState("");
  const [ninInput,   setNinInput]   = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [searchResults, setSearchResults] = useState<Shareholder[]>([]);
  const [selectedReg, setSelectedReg]     = useState("");

  // Desk state
  const [holder,       setHolder]      = useState<Shareholder | null>(null);
  const [deskReg,      setDeskReg]     = useState("");
  const [mrpslEntries, setMrpslEntries] = useState<LedgerEntry[]>([]);
  const [cscsEntries,  setCscsEntries]  = useState<LedgerEntry[]>([]);
  const [cscsFileName, setCscsFileName] = useState("");
  const [addedMrpsl,   setAddedMrpsl]  = useState<LedgerEntry[]>([]);

  // Controls
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");
  const [hideMatched,     setHideMatched]     = useState(false);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);

  // Modals
  const [insertOpen,    setInsertOpen]    = useState(false);
  const [insertPrefill, setInsertPrefill] = useState<MissingEntry | null>(null);
  const [detailEntry,   setDetailEntry]   = useState<LedgerEntry | null>(null);
  const [detailSource,  setDetailSource]  = useState<"mrpsl" | "cscs">("mrpsl");

  // ── Derived ────────────────────────────────────────────────────────────────

  const effectiveMrpsl  = [...mrpslEntries, ...addedMrpsl];
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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openDesk = (s: Shareholder, reg: string) => {
    setHolder(s);
    setDeskReg(reg);
    setMrpslEntries(MRPSL_SEED[`${s.chn}|${reg}`] ?? []);
    setCscsEntries([]);
    setCscsFileName("");
    setAddedMrpsl([]);
    setShowDiscrepancy(false);
    setHideMatched(false);
    setDateFrom("");
    setDateTo("");
    setPhase("desk");
  };

  const handleSelectHolder = (s: Shareholder) => {
    setSearchResults([]);
    const reg = s.registers.includes(selectedReg) ? selectedReg : s.registers[0];
    openDesk(s, reg);
    toast.success(`Records loaded for ${s.name}`);
  };

  const handleRegisterChange = (reg: string | null) => {
    if (holder && reg) openDesk(holder, reg);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !holder) return;
    // In demo: use CSCS_SEED keyed by chn|register
    const key = `${holder.chn}|${deskReg}`;
    const mock = CSCS_SEED[key] ?? [];
    setCscsFileName(file.name);
    setCscsEntries(mock);
    setAddedMrpsl([]);
    setShowDiscrepancy(false);
    toast.success(`CSCS file loaded — ${mock.length} record${mock.length !== 1 ? "s" : ""} found.`);
    e.target.value = "";
  };

  const handleSearch = () => {
    const fields = { chn: chnInput, bvn: bvnInput, nin: ninInput, phone: phoneInput, email: emailInput };
    if (!Object.values(fields).some((v) => v.trim())) { toast.error("Fill in at least one field to search."); return; }
    const results = searchShareholders(fields);
    setSearchResults(results);
    if (results.length === 0) toast.error("No shareholders found matching those details.");
  };

  const handleInsertedEntry = (entry: LedgerEntry) => {
    setAddedMrpsl((prev) => [...prev, entry]);
  };

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

  const addAllMissing = () => {
    const newEntries = cscsEntries
      .filter((e) => !mrpslTransferNos.has(e.transferNo))
      .map((e) => ({ ...e, id: `added-${e.transferNo}`, status: undefined }));
    setAddedMrpsl((prev) => [...prev, ...newEntries]);
    toast.success(
      `${newEntries.length} missing transaction${newEntries.length !== 1 ? "s" : ""} added to MRPSL register.`,
    );
  };

  // ── Phase: search ──────────────────────────────────────────────────────────

  if (phase === "search") {
    const registeredHolders = selectedReg ? getHoldersInRegister(selectedReg) : [];

    return (
      <Card className="mrpsl-card p-5 space-y-5">
        {/* Register */}
        <div className="space-y-1.5">
          <label className="mrpsl-label">Register</label>
          <div className="w-56">
            <Select value={selectedReg} onValueChange={(v) => { setSelectedReg(v ?? ""); setSearchResults([]); }}>
              <SelectTrigger className="mrpsl-input h-9 w-full">
                <SelectValue placeholder="Select a register" />
              </SelectTrigger>
              <SelectContent>
                {REGISTERS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scope radio */}
        <div className="space-y-2">
          <label className="mrpsl-label">Search Scope</label>
          <RadioGroup value={scopeMode} onValueChange={(v) => { setScopeMode(v as "all" | "spec"); setSearchResults([]); }} className="flex gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="scope-all" />
              <label htmlFor="scope-all" className="text-sm cursor-pointer">All CHNs in Register</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="spec" id="scope-spec" />
              <label htmlFor="scope-spec" className="text-sm cursor-pointer">Specific CHN</label>
            </div>
          </RadioGroup>
        </div>

        {/* All CHNs mode */}
        {scopeMode === "all" && (
          !selectedReg ? (
            <p className="text-sm text-muted-foreground">Select a register above to view its shareholders.</p>
          ) : registeredHolders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shareholders found in {selectedReg}.</p>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-muted/30 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  {registeredHolders.length} shareholder{registeredHolders.length !== 1 ? "s" : ""} in {selectedReg}
                </span>
              </div>
              {registeredHolders.map((h) => (
                <button
                  key={h.id}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 border-t border-border/50 text-left transition-colors"
                  onClick={() => handleSelectHolder(h)}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{h.name}</p>
                    <p className="text-[12px] text-muted-foreground font-mono">
                      {h.chn} · {h.records.length} transaction{h.records.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* Specific CHN mode */}
        {scopeMode === "spec" && (
          <>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 pt-1 border-t border-border/60">
              {([
                { label: "CHN",          value: chnInput,   onChange: setChnInput   },
                { label: "BVN",          value: bvnInput,   onChange: setBvnInput   },
                { label: "NIN",          value: ninInput,   onChange: setNinInput   },
                { label: "Phone Number", value: phoneInput, onChange: setPhoneInput },
                { label: "Email Address",value: emailInput, onChange: setEmailInput },
              ] as const).map(({ label, value, onChange }) => (
                <div key={label} className="space-y-1.5">
                  <label className="mrpsl-label">{label}</label>
                  <Input
                    className="mrpsl-input h-9 font-mono"
                    placeholder={label}
                    value={value}
                    onChange={(e) => (onChange as (v: string) => void)(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSearch} className="gap-1.5">Find Shareholder</Button>
            {searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-muted/30 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  {searchResults.length} record{searchResults.length !== 1 ? "s" : ""} found — select to continue
                </div>
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    className="w-full flex items-start justify-between px-4 py-3 hover:bg-accent/50 border-t border-border/50 text-left transition-colors"
                    onClick={() => handleSelectHolder(s)}
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-[12px] text-muted-foreground font-mono">CHN: {s.chn} · BVN: {s.bvn} · NIN: {s.nin}</p>
                      <p className="text-[12px] text-muted-foreground">{s.phone} · {s.email}</p>
                    </div>
                    <div className="flex gap-1 mt-0.5 shrink-0">
                      {s.registers.map((r) => (
                        <Badge key={r} className="border-0 text-[11px] bg-gray-100 text-gray-700">{r}</Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    );
  }

  // ── Phase: resolved ────────────────────────────────────────────────────────

  if (phase === "resolved") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => { setHolder(null); setSelectedReg(""); setPhase("search"); }} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <p className="font-semibold text-lg">Records Saved</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {addedMrpsl.length > 0
              ? `${addedMrpsl.length} transaction${addedMrpsl.length !== 1 ? "s" : ""} added to the MRPSL register for ${holder?.name} (${deskReg}).`
              : `Reconciliation records for ${holder?.name} (${deskReg}) have been saved.`}
          </p>
          <Button onClick={() => { setHolder(null); setSelectedReg(""); setPhase("search"); }}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  // ── Phase: desk ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => { setHolder(null); setSelectedReg(""); setPhase("search"); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{holder!.name}</p>
          <p className="text-[12px] text-muted-foreground font-mono">{holder!.chn} · BVN: {holder!.bvn}</p>
        </div>
        {holder!.registers.length > 1 ? (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Register</span>
            <div className="w-36">
              <Select value={deskReg} onValueChange={handleRegisterChange}>
                <SelectTrigger className="mrpsl-input h-8 w-full text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {holder!.registers.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <Badge className="ml-auto border-0 bg-gray-100 text-gray-700 shrink-0">{deskReg}</Badge>
        )}
        {cscsFileName && (
          <Badge className="border-0 text-[12px] bg-blue-100 text-blue-800 shrink-0">{cscsEntries.length} CSCS records</Badge>
        )}
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

      {/* ── Discrepancy / aligned view ──────────────────────────────────── */}
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
              <Button size="sm" variant="outline" className="h-7 text-[12px] border-red-200 text-red-700 hover:bg-red-50 gap-1" onClick={addAllMissing}>
                <Plus className="h-3 w-3" /> Add All Missing to MRPSL
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 border-b border-border/60">
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/60">MRPSL Register Records</div>
            <div className="px-4 py-2 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CSCS Cleared Records</div>
          </div>

          <div className="divide-y divide-border/50 text-[13px]">
            {displayAligned.map((row) => (
              <div key={row.key} className="grid grid-cols-2 min-h-13">
                {row.mrpsl === null ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-red-50/50 border-r border-border/60">
                    <span className="text-[13px] italic text-muted-foreground">Missing</span>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                      title="Add to MRPSL" onClick={() => row.cscs && openInsertFromCscs(row.cscs)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 border-r border-border/60 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => { setDetailEntry(row.mrpsl!); setDetailSource("mrpsl"); }}>
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
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => { setDetailEntry(row.cscs!); setDetailSource("cscs"); }}>
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
        /* ── Default side-by-side view ─────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MRPSL */}
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
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
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
                  {effectiveMrpsl.length === 0 ? "No MRPSL records for this register." : "No records match the current filter."}
                </p>
              )}
            </div>
          </Card>

          {/* CSCS */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CSCS Cleared Records</span>
              {cscsEntries.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold">{displayCscs.length} records</span>
                  <button
                    className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace file
                  </button>
                </div>
              )}
            </div>

            {cscsEntries.length === 0 ? (
              /* Inline upload UI */
              <div className="px-4 py-6 flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Upload CSCS Transaction File</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    For <span className="font-medium text-foreground">{holder!.name}</span> · {deskReg}
                  </p>
                </div>
                <Button variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Choose File
                </Button>
                <p className="text-[11px] text-muted-foreground">CSV, XLSX or TXT · Max 10 MB</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-[13px]">
                {displayCscs.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
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
                  <p className="px-4 py-6 text-center text-muted-foreground text-[13px] italic">No records match the current filter.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={handleFileUpload} />

      {/* Save Records */}
      <Button className="w-full gap-2" onClick={() => setPhase("resolved")}>
        Save Records
      </Button>

      <InsertModal
        key={insertPrefill?.id ?? "manual"}
        open={insertOpen}
        onClose={() => setInsertOpen(false)}
        prefill={insertPrefill}
        chn={holder?.chn ?? ""}
        register={deskReg}
        onInserted={handleInsertedEntry}
      />

      {holder && (
        <TradeDetailModal
          open={detailEntry !== null}
          onClose={() => setDetailEntry(null)}
          entry={detailEntry}
          source={detailSource}
          holder={holder}
          register={deskReg}
        />
      )}
    </div>
  );
}
