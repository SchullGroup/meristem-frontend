"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Search, Upload, CheckCircle2, AlertTriangle, ArrowLeft,
  Plus, FileText, Info, Trash2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

// ── Types ─────────────────────────────────────────────────────────────────

type ReconPhase = "search" | "records" | "compare";
type TxType = "BUY" | "SELL";
type TxStatus = "CLEARED" | "PENDING" | "FLAGGED";
type MatchStatus = "MATCHED" | "VARIANCE" | "MISSING_IN_CSCS" | "MISSING_IN_MRPSL";

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

interface MrpslRecord {
  id: string;
  transferNo: string;
  transactionDate: string;
  transactionType: TxType;
  units: number;
  consideration: number;
  balanceAfter: number;
  status: TxStatus;
}

interface CscsRecord {
  transferNo: string;
  transactionDate: string;
  transactionType: string;
  units: number;
  consideration: number;
}

interface CompRow {
  transferNo: string;
  transactionDate: string;
  transactionType: string;
  mrpslUnits: number | null;
  cscsUnits: number | null;
  variance: number;
  matchStatus: MatchStatus;
}

interface MissingTx {
  id: string;
  source: "AUTO" | "MANUAL";
  missingIn: "CSCS" | "MRPSL";
  transferNo: string;
  transactionDate: string;
  transactionType: string;
  units: number;
  consideration: number;
  resolutionStatus: "PENDING" | "RESOLVED";
}

// ── Seed data ─────────────────────────────────────────────────────────────

const SHAREHOLDERS: Shareholder[] = [
  { id: "1", name: "JOHN ADEYEMI BABATUNDE", chn: "C0012345AK", bvn: "12345001001", nin: "NIN001001001", phone: "08011001001", email: "john.babatunde@email.com", registers: ["DANGCEM", "GTCO"] },
  { id: "2", name: "NGOZI CHIDINMA OKAFOR", chn: "C0023456BK", bvn: "12345002002", nin: "NIN002002002", phone: "08011002002", email: "ngozi.okafor@email.com", registers: ["DANGCEM"] },
  { id: "3", name: "SAMUEL OLUWASEUN ADELEKE", chn: "C0034567CK", bvn: "12345003003", nin: "NIN003003003", phone: "08011003003", email: "samuel.adeleke@email.com", registers: ["MTNN", "ZENITH"] },
  { id: "4", name: "FATIMA ABUBAKAR MUSA", chn: "C0045678DK", bvn: "12345004004", nin: "NIN004004004", phone: "08011004004", email: "fatima.musa@email.com", registers: ["MTNN"] },
  { id: "5", name: "EMEKA CHUKWUEMEKA EZE", chn: "C0056789EK", bvn: "12345005005", nin: "NIN005005005", phone: "08011005005", email: "emeka.eze@email.com", registers: ["SEPLAT"] },
];

// MRPSL records per (CHN|register)
const MRPSL_DATA: Record<string, MrpslRecord[]> = {
  "C0023456BK|DANGCEM": [
    { id: "r1", transferNo: "TRF-DNG-2025-001", transactionDate: "01 Mar 2025", transactionType: "BUY", units: 10000, consideration: 2850000, balanceAfter: 10000, status: "CLEARED" },
    { id: "r2", transferNo: "TRF-DNG-2025-002", transactionDate: "15 Jun 2025", transactionType: "BUY", units: 5000, consideration: 1555000, balanceAfter: 15000, status: "CLEARED" },
    { id: "r3", transferNo: "TRF-DNG-2025-003", transactionDate: "20 Sep 2025", transactionType: "SELL", units: 2500, consideration: 815000, balanceAfter: 12500, status: "CLEARED" },
    { id: "r4", transferNo: "TRF-DNG-2025-004", transactionDate: "10 Dec 2025", transactionType: "BUY", units: 3500, consideration: 1190000, balanceAfter: 16000, status: "PENDING" },
  ],
  "C0012345AK|DANGCEM": [
    { id: "r5", transferNo: "TRF-DNG-2025-010", transactionDate: "15 Jan 2025", transactionType: "BUY", units: 20000, consideration: 5700000, balanceAfter: 20000, status: "CLEARED" },
    { id: "r6", transferNo: "TRF-DNG-2025-011", transactionDate: "01 Apr 2025", transactionType: "BUY", units: 12000, consideration: 3744000, balanceAfter: 32000, status: "CLEARED" },
    { id: "r7", transferNo: "TRF-DNG-2025-012", transactionDate: "28 Jul 2025", transactionType: "SELL", units: 800, consideration: 264000, balanceAfter: 31200, status: "CLEARED" },
  ],
  "C0012345AK|GTCO": [
    { id: "r8", transferNo: "TRF-GTCO-2025-001", transactionDate: "20 Feb 2025", transactionType: "BUY", units: 8000, consideration: 712000, balanceAfter: 8000, status: "CLEARED" },
    { id: "r9", transferNo: "TRF-GTCO-2025-002", transactionDate: "10 Jun 2025", transactionType: "BUY", units: 4000, consideration: 380000, balanceAfter: 12000, status: "CLEARED" },
  ],
  "C0034567CK|MTNN": [
    { id: "r10", transferNo: "TRF-MTN-2025-001", transactionDate: "10 Feb 2025", transactionType: "BUY", units: 50000, consideration: 10650000, balanceAfter: 50000, status: "CLEARED" },
    { id: "r11", transferNo: "TRF-MTN-2025-002", transactionDate: "05 May 2025", transactionType: "BUY", units: 30000, consideration: 6750000, balanceAfter: 80000, status: "CLEARED" },
    { id: "r12", transferNo: "TRF-MTN-2025-003", transactionDate: "01 Aug 2025", transactionType: "SELL", units: 10000, consideration: 2350000, balanceAfter: 70000, status: "CLEARED" },
  ],
};

// What the "uploaded" CSCS file contains — includes deliberate discrepancies for demo
const CSCS_DATA: Record<string, CscsRecord[]> = {
  "C0023456BK|DANGCEM": [
    { transferNo: "TRF-DNG-2025-001", transactionDate: "01 Mar 2025", transactionType: "BUY", units: 10000, consideration: 2850000 },
    { transferNo: "TRF-DNG-2025-002", transactionDate: "15 Jun 2025", transactionType: "BUY", units: 5000, consideration: 1555000 },
    // TRF-DNG-2025-003 (SELL) and TRF-DNG-2025-004 (BUY) missing from CSCS
    // Extra in CSCS not in MRPSL:
    { transferNo: "TRF-DNG-CSCS-X01", transactionDate: "30 Oct 2025", transactionType: "BUY", units: 1000, consideration: 0 },
  ],
  "C0012345AK|DANGCEM": [
    { transferNo: "TRF-DNG-2025-010", transactionDate: "15 Jan 2025", transactionType: "BUY", units: 20000, consideration: 5700000 },
    { transferNo: "TRF-DNG-2025-011", transactionDate: "01 Apr 2025", transactionType: "BUY", units: 12000, consideration: 3744000 },
    { transferNo: "TRF-DNG-2025-012", transactionDate: "28 Jul 2025", transactionType: "SELL", units: 900, consideration: 297000 }, // variance: MRPSL=800, CSCS=900
  ],
  "C0012345AK|GTCO": [
    { transferNo: "TRF-GTCO-2025-001", transactionDate: "20 Feb 2025", transactionType: "BUY", units: 8000, consideration: 712000 },
    { transferNo: "TRF-GTCO-2025-002", transactionDate: "10 Jun 2025", transactionType: "BUY", units: 4000, consideration: 380000 },
  ],
  "C0034567CK|MTNN": [
    { transferNo: "TRF-MTN-2025-001", transactionDate: "10 Feb 2025", transactionType: "BUY", units: 50000, consideration: 10650000 },
    { transferNo: "TRF-MTN-2025-002", transactionDate: "05 May 2025", transactionType: "BUY", units: 30000, consideration: 6750000 },
    // TRF-MTN-2025-003 (SELL) missing from CSCS
  ],
};

// ── Config ─────────────────────────────────────────────────────────────────

const REGISTERS = ["DANGCEM", "MTNN", "SEPLAT", "UBA", "GTCO", "ZENITH"];

const TX_TYPE_OPTIONS: TxType[] = ["BUY", "SELL"];

const TX_STATUS_CFG: Record<TxStatus, { label: string; cls: string }> = {
  CLEARED: { label: "Cleared", cls: "bg-green-100 text-green-800" },
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
  FLAGGED: { label: "Flagged", cls: "bg-red-100 text-red-800" },
};

const MATCH_CFG: Record<MatchStatus, { label: string; cls: string }> = {
  MATCHED: { label: "Matched", cls: "bg-green-100 text-green-800" },
  VARIANCE: { label: "Variance", cls: "bg-amber-100 text-amber-800" },
  MISSING_IN_CSCS: { label: "Missing in CSCS", cls: "bg-red-100 text-red-800" },
  MISSING_IN_MRPSL: { label: "Missing in MRPSL", cls: "bg-orange-100 text-orange-800" },
};

const isSell = (type: string) => type === "SELL";

// ── Helpers ────────────────────────────────────────────────────────────────

function getHoldersInRegister(reg: string) {
  return SHAREHOLDERS.filter((s) => s.registers.includes(reg)).map((s) => {
    const records = MRPSL_DATA[`${s.chn}|${reg}`] ?? [];
    return { ...s, records, hasFlagged: records.some((r) => r.status !== "CLEARED") };
  });
}

function searchShareholders(
  fields: { chn: string; bvn: string; nin: string; phone: string; email: string },
): Shareholder[] {
  const hasAny = Object.values(fields).some((v) => v.trim());
  if (!hasAny) return [];
  return SHAREHOLDERS.filter((s) => {
    if (fields.chn && !s.chn.toLowerCase().includes(fields.chn.toLowerCase())) return false;
    if (fields.bvn && !s.bvn.includes(fields.bvn)) return false;
    if (fields.nin && !s.nin.toLowerCase().includes(fields.nin.toLowerCase())) return false;
    if (fields.phone && !s.phone.includes(fields.phone)) return false;
    if (fields.email && !s.email.toLowerCase().includes(fields.email.toLowerCase())) return false;
    return true;
  });
}

function deriveComparison(mrpsl: MrpslRecord[], cscs: CscsRecord[]): CompRow[] {
  const mrpslMap = new Map(mrpsl.map((r) => [r.transferNo, r]));
  const cscsMap = new Map(cscs.map((r) => [r.transferNo, r]));
  const allKeys = new Set([...mrpslMap.keys(), ...cscsMap.keys()]);
  const rows: CompRow[] = [];
  for (const key of allKeys) {
    const m = mrpslMap.get(key);
    const c = cscsMap.get(key);
    if (m && c) {
      const variance = c.units - m.units;
      rows.push({ transferNo: key, transactionDate: m.transactionDate, transactionType: m.transactionType, mrpslUnits: m.units, cscsUnits: c.units, variance, matchStatus: variance === 0 ? "MATCHED" : "VARIANCE" });
    } else if (m) {
      rows.push({ transferNo: key, transactionDate: m.transactionDate, transactionType: m.transactionType, mrpslUnits: m.units, cscsUnits: null, variance: 0, matchStatus: "MISSING_IN_CSCS" });
    } else if (c) {
      rows.push({ transferNo: key, transactionDate: c.transactionDate, transactionType: c.transactionType, mrpslUnits: null, cscsUnits: c.units, variance: 0, matchStatus: "MISSING_IN_MRPSL" });
    }
  }
  return rows.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
}

let _nextId = 100;
const nextId = () => String(_nextId++);

// ── Component ──────────────────────────────────────────────────────────────

export default function GeneralCertificateReconciliation() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase
  const [phase, setPhase] = useState<ReconPhase>("search");
  const [scopeMode, setScopeMode] = useState<"all" | "spec">("all");

  // Search inputs
  const [chnInput, setChnInput] = useState("");
  const [bvnInput, setBvnInput] = useState("");
  const [ninInput, setNinInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [searchResults, setSearchResults] = useState<Shareholder[]>([]);

  // Selected holder + register
  const [holder, setHolder] = useState<Shareholder | null>(null);
  const [selectedReg, setSelectedReg] = useState("");

  // Data
  const [mrpslRecords, setMrpslRecords] = useState<MrpslRecord[]>([]);
  const [cscsRecords, setCscsRecords] = useState<CscsRecord[]>([]);
  const [cscsFileName, setCscsFileName] = useState("");
  const [compRows, setCompRows] = useState<CompRow[]>([]);

  // Missing transactions
  const [missingTxs, setMissingTxs] = useState<MissingTx[]>([]);
  const [showInsertModal, setShowInsertModal] = useState(false);

  // Insert modal fields
  const [mTransferNo, setMTransferNo] = useState("");
  const [mDate, setMDate] = useState("");
  const [mType, setMType] = useState<TxType>("BUY");
  const [mUnits, setMUnits] = useState("");
  const [mConsideration, setMConsideration] = useState("");

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = () => {
    const fields = { chn: chnInput, bvn: bvnInput, nin: ninInput, phone: phoneInput, email: emailInput };
    if (!Object.values(fields).some((v) => v.trim())) {
      toast.error("Fill in at least one field to search.");
      return;
    }
    const results = searchShareholders(fields);
    setSearchResults(results);
    if (results.length === 0) toast.error("No shareholders found matching those details.");
  };

  const loadHolder = (s: Shareholder, reg: string) => {
    const key = `${s.chn}|${reg}`;
    setHolder(s);
    setSelectedReg(reg);
    setMrpslRecords(MRPSL_DATA[key] ?? []);
    setCscsRecords([]);
    setCscsFileName("");
    setCompRows([]);
    setMissingTxs([]);
    setPhase("records");
  };

  const handleSelectHolder = (s: Shareholder) => {
    setSearchResults([]);
    const reg = s.registers.includes(selectedReg) ? selectedReg : s.registers[0];
    loadHolder(s, reg);
    toast.success(`Records loaded for ${s.name}`);
  };

  const handleRegisterChange = (reg: string | null) => {
    if (reg && holder) loadHolder(holder, reg);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !holder) return;
    const key = `${holder.chn}|${selectedReg}`;
    const mockCscs = CSCS_DATA[key] ?? [];
    setCscsFileName(file.name);
    setCscsRecords(mockCscs);
    setCompRows(deriveComparison(MRPSL_DATA[key] ?? [], mockCscs));
    setMissingTxs([]);
    setPhase("compare");
    toast.success(`CSCS file parsed — ${mockCscs.length} record${mockCscs.length !== 1 ? "s" : ""} loaded.`);
    e.target.value = "";
  };

  const handleGenerateMissing = () => {
    const discrepant = compRows.filter((r) => r.matchStatus !== "MATCHED");
    if (discrepant.length === 0) { toast.info("No discrepancies to generate from."); return; }
    const existing = new Set(missingTxs.map((t) => t.transferNo));
    const fresh: MissingTx[] = discrepant
      .filter((r) => !existing.has(r.transferNo))
      .map((r) => ({
        id: nextId(),
        source: "AUTO" as const,
        missingIn: "MRPSL" as const,
        transferNo: r.transferNo,
        transactionDate: r.transactionDate,
        transactionType: r.transactionType,
        units: Math.abs(r.mrpslUnits ?? r.cscsUnits ?? 0),
        consideration: 0,
        resolutionStatus: "PENDING" as const,
      }));
    if (fresh.length === 0) { toast.info("All discrepancies already generated."); return; }
    setMissingTxs((prev) => [...prev, ...fresh]);
    toast.success(`${fresh.length} missing transaction${fresh.length !== 1 ? "s" : ""} generated — review and edit before resolving.`);
  };

  const updateField = (id: string, field: keyof MissingTx, value: string | number) => {
    setMissingTxs((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleMarkResolved = (id: string) => {
    setMissingTxs((prev) => prev.map((t) => (t.id === id ? { ...t, resolutionStatus: "RESOLVED" } : t)));
    toast.success("Transaction added to MRPSL register.");
  };

  const handleRemove = (id: string) => setMissingTxs((prev) => prev.filter((t) => t.id !== id));

  const handleInsertManual = () => {
    if (!mTransferNo.trim() || !mDate.trim() || !mUnits.trim()) {
      toast.error("Transfer No., Date, and Units are required.");
      return;
    }
    setMissingTxs((prev) => [
      ...prev,
      { id: nextId(), source: "MANUAL", missingIn: "MRPSL", transferNo: mTransferNo.trim(), transactionDate: mDate.trim(), transactionType: mType, units: Number(mUnits), consideration: Number(mConsideration) || 0, resolutionStatus: "PENDING" },
    ]);
    setMTransferNo(""); setMDate(""); setMType("BUY"); setMUnits(""); setMConsideration("");
    setShowInsertModal(false);
    toast.success("Transaction manually inserted.");
  };

  const handleBack = () => {
    if (phase === "compare") {
      setCscsFileName(""); setCscsRecords([]); setCompRows([]); setMissingTxs([]);
      setPhase("records");
    } else {
      setHolder(null); setSelectedReg(""); setMrpslRecords([]); setSearchResults([]);
      setScopeMode("all");
      setPhase("search");
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const matchedCount = compRows.filter((r) => r.matchStatus === "MATCHED").length;
  const varianceCount = compRows.filter((r) => r.matchStatus === "VARIANCE").length;
  const missingInCscsCount = compRows.filter((r) => r.matchStatus === "MISSING_IN_CSCS").length;
  const missingInMrpslCount = compRows.filter((r) => r.matchStatus === "MISSING_IN_MRPSL").length;
  const discrepancyCount = varianceCount + missingInCscsCount + missingInMrpslCount;
  const pendingCount = missingTxs.filter((t) => t.resolutionStatus === "PENDING").length;
  const resolvedCount = missingTxs.filter((t) => t.resolutionStatus === "RESOLVED").length;

  // ── Render: Holder header (shared across records + compare) ────────────────

  const HolderHeader = () => (
    <div className="flex items-center gap-3 pb-4 border-b border-border">
      <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 shrink-0">
        <ArrowLeft className="h-4 w-4" />
        {phase === "compare" ? "Back to Records" : "Back to Search"}
      </Button>
      <div className="h-4 w-px bg-border" />
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{holder!.name}</p>
        <p className="text-[12px] text-muted-foreground font-mono">
          {holder!.chn} · BVN: {holder!.bvn} · NIN: {holder!.nin}
        </p>
      </div>
      {holder!.registers.length > 1 ? (
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">Register</span>
          <div className="w-36">
            <Select value={selectedReg} onValueChange={handleRegisterChange}>
              <SelectTrigger className="mrpsl-input h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {holder!.registers.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <Badge className="ml-auto border-0 bg-gray-100 text-gray-700 shrink-0">{selectedReg}</Badge>
      )}
      {phase === "compare" && cscsFileName && (
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground shrink-0">
          <FileText className="h-3.5 w-3.5" />
          <span className="font-mono">{cscsFileName}</span>
        </div>
      )}
    </div>
  );

  // ── Phase: search ──────────────────────────────────────────────────────────

  if (phase === "search") {
    const registeredHolders = selectedReg ? getHoldersInRegister(selectedReg) : [];
    const flaggedCount = registeredHolders.filter((h) => h.hasFlagged).length;

    const specFields = [
      { label: "CHN", value: chnInput, onChange: setChnInput, mono: true },
      { label: "BVN", value: bvnInput, onChange: setBvnInput, mono: true },
      { label: "NIN", value: ninInput, onChange: setNinInput, mono: true },
      { label: "Phone Number", value: phoneInput, onChange: setPhoneInput, mono: true },
      { label: "Email Address", value: emailInput, onChange: setEmailInput },
    ];

    return (
      <Card className="mrpsl-card p-5 space-y-5">
        {/* Register */}
        <div className="space-y-1.5">
          <label className="mrpsl-label">Register</label>
          <div className="w-56">
            <Select
              value={selectedReg}
              onValueChange={(v) => {
                setSelectedReg(v ?? "");
                setSearchResults([]);
              }}
            >
              <SelectTrigger className="mrpsl-input h-9 w-full">
                <SelectValue placeholder="Select a register" />
              </SelectTrigger>
              <SelectContent>
                {REGISTERS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scope radio */}
        <div className="space-y-2">
          <label className="mrpsl-label">Search Scope</label>
          <RadioGroup
            value={scopeMode}
            onValueChange={(v) => {
              setScopeMode(v as "all" | "spec");
              setSearchResults([]);
            }}
            className="flex gap-6"
          >
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

        {/* ── All CHNs mode ── */}
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
                {flaggedCount > 0 && (
                  <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {flaggedCount} flagged
                  </Badge>
                )}
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
                  {h.hasFlagged && (
                    <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800 shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Flagged
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )
        )}

        {/* ── Specific CHN mode ── */}
        {scopeMode === "spec" && (
          <>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 pt-1 border-t border-border/60">
              {specFields.map(({ label, value, onChange, mono }) => (
                <div key={label} className="space-y-1.5">
                  <label className="mrpsl-label">{label}</label>
                  <Input
                    className={`mrpsl-input h-9${mono ? " font-mono" : ""}`}
                    placeholder={label}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleSearch}>
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Find Shareholder
            </Button>

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
                      <p className="text-[12px] text-muted-foreground font-mono">
                        CHN: {s.chn} · BVN: {s.bvn} · NIN: {s.nin}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {s.phone} · {s.email}
                      </p>
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

  // ── Phase: records ─────────────────────────────────────────────────────────

  if (phase === "records") {
    return (
      <>
        <HolderHeader />

        {/* MRPSL records */}
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              MRPSL Transaction Records — {selectedReg}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mrpslRecords.length} transaction{mrpslRecords.length !== 1 ? "s" : ""} on record
            </p>
          </div>
          {mrpslRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No MRPSL records found for this register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">TRANSFER NO.</th>
                    <th className="px-4 py-3 text-left">DATE</th>
                    <th className="px-4 py-3 text-left">TYPE</th>
                    <th className="px-4 py-3 text-right">UNITS</th>
                    <th className="px-4 py-3 text-right">CONSIDERATION (₦)</th>
                    <th className="px-4 py-3 text-right">BALANCE AFTER</th>
                    <th className="px-4 py-3 text-left">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {mrpslRecords.map((r) => (
                    <tr key={r.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.transferNo}</td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.transactionDate}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[11px] ${isSell(r.transactionType) ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                          {r.transactionType.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-mono font-semibold ${isSell(r.transactionType) ? "text-red-600" : "text-green-700"}`}>
                        {isSell(r.transactionType) ? "−" : "+"}{formatNumber(r.units)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-muted-foreground">
                        {formatNumber(r.consideration)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono font-semibold">
                        {formatNumber(r.balanceAfter)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[11px] ${TX_STATUS_CFG[r.status].cls}`}>
                          {TX_STATUS_CFG[r.status].label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t border-border">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-muted-foreground">
                      NET POSITION (MRPSL)
                    </td>
                    <td colSpan={4} className="px-4 py-2.5 text-right font-mono font-bold">
                      {formatNumber(mrpslRecords.at(-1)?.balanceAfter ?? 0)} units
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* CSCS file upload */}
        <Card className="mrpsl-card p-5 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Upload CSCS Transaction File
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Upload the CSCS cleared transactions export for <strong>{holder!.name}</strong> in{" "}
              <strong>{selectedReg}</strong> to begin the comparison.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-accent/20 transition-colors cursor-pointer"
          >
            <Upload className="h-8 w-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload CSCS transaction file</p>
              <p className="text-xs text-muted-foreground mt-0.5">CSV, XLSX, XLS or TXT · Max 10 MB</p>
            </div>
          </button>
        </Card>
      </>
    );
  }

  // ── Phase: compare ─────────────────────────────────────────────────────────

  return (
    <>
      <HolderHeader />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Matched", count: matchedCount, numCls: "text-green-700", cardCls: "bg-green-50 border-green-200" },
          { label: "Variance", count: varianceCount, numCls: "text-amber-700", cardCls: "bg-amber-50 border-amber-200" },
          { label: "Missing in CSCS", count: missingInCscsCount, numCls: "text-red-700", cardCls: "bg-red-50 border-red-200" },
          { label: "Missing in MRPSL", count: missingInMrpslCount, numCls: "text-orange-700", cardCls: "bg-orange-50 border-orange-200" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.cardCls}`}>
            <p className={`text-2xl font-bold tabular-nums ${s.numCls}`}>{s.count}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Side-by-side comparison cards */}
      {(() => {
        const compMap = new Map(compRows.map((r) => [r.transferNo, r]));

        const MatchFlag = ({ status }: { status: MatchStatus | undefined }) => {
          if (!status || status === "MATCHED")
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
          if (status === "VARIANCE")
            return (
              <div className="flex items-center gap-1 text-amber-600 text-[12px] font-medium">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Variance
              </div>
            );
          // MISSING_IN_CSCS (shown on MRPSL side) or MISSING_IN_MRPSL (shown on CSCS side)
          return (
            <Badge className="border-0 text-[11px] bg-red-100 text-red-700">
              {status === "MISSING_IN_CSCS" ? "Not in CSCS" : "Not in MRPSL"}
            </Badge>
          );
        };

        return (
          <div className="grid grid-cols-2 gap-4">
            {/* MRPSL Records */}
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  MRPSL Register Records
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mrpslRecords.length} transaction{mrpslRecords.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-3 text-left">TRANSFER NO.</th>
                      <th className="px-3 py-3 text-left">DATE</th>
                      <th className="px-3 py-3 text-left">TYPE</th>
                      <th className="px-3 py-3 text-right">UNITS</th>
                      <th className="px-3 py-3 text-right">BAL. AFTER</th>
                      <th className="px-3 py-3 text-left">CSCS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {mrpslRecords.map((r) => {
                      const comp = compMap.get(r.transferNo);
                      const isIssue = comp && comp.matchStatus !== "MATCHED";
                      return (
                        <tr key={r.id} className={`mrpsl-table-row ${isIssue ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                          <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground max-w-[140px] truncate" title={r.transferNo}>
                            {r.transferNo}
                          </td>
                          <td className="px-3 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{r.transactionDate}</td>
                          <td className="px-3 py-3">
                            <Badge className={`border-0 text-[10px] ${isSell(r.transactionType) ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                              {r.transactionType.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className={`px-3 py-3 text-right tabular-nums font-mono font-semibold text-[12px] ${isSell(r.transactionType) ? "text-red-600" : "text-green-700"}`}>
                            {isSell(r.transactionType) ? "−" : "+"}{formatNumber(r.units)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-mono text-[12px]">
                            {formatNumber(r.balanceAfter)}
                          </td>
                          <td className="px-3 py-3">
                            <MatchFlag status={comp?.matchStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-[11px] font-bold text-muted-foreground">NET POSITION</td>
                      <td colSpan={3} className="px-3 py-2 text-right font-mono font-bold text-[12px]">
                        {formatNumber(mrpslRecords.at(-1)?.balanceAfter ?? 0)} units
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* CSCS Records */}
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  CSCS Cleared Records
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cscsRecords.length} transaction{cscsRecords.length !== 1 ? "s" : ""} · from{" "}
                  <span className="font-mono font-medium">{cscsFileName}</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-3 text-left">TRANSFER NO.</th>
                      <th className="px-3 py-3 text-left">DATE</th>
                      <th className="px-3 py-3 text-left">TYPE</th>
                      <th className="px-3 py-3 text-right">UNITS</th>
                      <th className="px-3 py-3 text-left">MRPSL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {cscsRecords.map((r, i) => {
                      const comp = compMap.get(r.transferNo);
                      const isMissing = comp?.matchStatus === "MISSING_IN_MRPSL";
                      const isVariance = comp?.matchStatus === "VARIANCE";
                      return (
                        <tr
                          key={`${r.transferNo}-${i}`}
                          className={`mrpsl-table-row ${isMissing ? "bg-orange-50/40 dark:bg-orange-950/10" : isVariance ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
                        >
                          <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground max-w-[140px] truncate" title={r.transferNo}>
                            {r.transferNo}
                          </td>
                          <td className="px-3 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{r.transactionDate}</td>
                          <td className="px-3 py-3">
                            <Badge className="border-0 text-[10px] bg-gray-100 text-gray-700">
                              {r.transactionType.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-mono font-semibold text-[12px]">
                            {formatNumber(r.units)}
                          </td>
                          <td className="px-3 py-3">
                            <MatchFlag status={comp?.matchStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-[11px] font-bold text-muted-foreground">NET UNITS</td>
                      <td colSpan={2} className="px-3 py-2 text-right font-mono font-bold text-[12px]">
                        {formatNumber(cscsRecords.reduce((sum, r) => sum + (isSell(r.transactionType) ? -r.units : r.units), 0))} units
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Missing transactions */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Missing Transactions
            </p>
            {missingTxs.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingCount} pending · {resolvedCount} resolved
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {discrepancyCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleGenerateMissing}>
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Generate Missing ({discrepancyCount})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowInsertModal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Insert Manually
            </Button>
          </div>
        </div>

        {missingTxs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2.5 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No missing transactions yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Click <strong>Generate Missing</strong> to auto-populate from the {discrepancyCount} discrepanc{discrepancyCount !== 1 ? "ies" : "y"} above, or use <strong>Insert Manually</strong> to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 text-left">TRANSFER NO.</th>
                  <th className="px-4 py-3 text-left">DATE</th>
                  <th className="px-4 py-3 text-left">TYPE</th>
                  <th className="px-4 py-3 text-right">UNITS</th>
                  <th className="px-4 py-3 text-left">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {missingTxs.map((tx) => {
                  const resolved = tx.resolutionStatus === "RESOLVED";
                  return (
                    <tr key={tx.id} className={`mrpsl-table-row align-top ${resolved ? "opacity-60" : ""}`}>
                      <td className="px-4 py-2.5">
                        <Input
                          className="mrpsl-input h-8 font-mono text-[12px] w-44"
                          value={tx.transferNo}
                          disabled={resolved}
                          onChange={(e) => updateField(tx.id, "transferNo", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          className="mrpsl-input h-8 text-[12px] w-32"
                          value={tx.transactionDate}
                          disabled={resolved}
                          onChange={(e) => updateField(tx.id, "transactionDate", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="w-36">
                          <Select
                            value={tx.transactionType}
                            disabled={resolved}
                            onValueChange={(v) => updateField(tx.id, "transactionType", v ?? tx.transactionType)}
                          >
                            <SelectTrigger className="mrpsl-input h-8 w-full text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TX_TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          type="number"
                          className="mrpsl-input h-8 font-mono text-[12px] w-24 text-right"
                          value={tx.units}
                          disabled={resolved}
                          onChange={(e) => updateField(tx.id, "units", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        {resolved ? (
                          <div className="flex items-center gap-1.5 text-green-700 text-[13px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                          </div>
                        ) : (
                          <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex gap-1.5 justify-end pt-0.5">
                          {!resolved && (
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleMarkResolved(tx.id)}>
                              <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRemove(tx.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Resolved notice */}
      {resolvedCount > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-900">
            <strong>{resolvedCount}</strong> transaction{resolvedCount !== 1 ? "s" : ""} successfully added to the MRPSL register.
          </p>
        </div>
      )}

      {/* Manual insert modal */}
      <Dialog open={showInsertModal} onOpenChange={setShowInsertModal}>
        <DialogContent className="max-w-md">
          <DialogHeader className="px-8 pt-8 pb-4">
            <DialogTitle>Insert Missing Transaction</DialogTitle>
          </DialogHeader>
          <div className="px-8 space-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Transfer No. <span className="text-red-500">*</span></label>
              <Input className="mrpsl-input h-9 font-mono" placeholder="TRF-XXX-YYYY-NNN" value={mTransferNo} onChange={(e) => setMTransferNo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="mrpsl-label">Date <span className="text-red-500">*</span></label>
                <Input className="mrpsl-input h-9" placeholder="DD Mon YYYY" value={mDate} onChange={(e) => setMDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Transaction Type</label>
                <div className="w-full">
                  <Select value={mType} onValueChange={(v) => setMType(v as TxType)}>
                    <SelectTrigger className="mrpsl-input h-9 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TX_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Units <span className="text-red-500">*</span></label>
              <Input type="number" className="mrpsl-input h-9 font-mono" placeholder="0" value={mUnits} onChange={(e) => setMUnits(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800">
                This transaction will be inserted into the <strong>MRPSL register</strong> for {holder!.name} ({selectedReg}).
              </p>
            </div>
          </div>
          <DialogFooter className="px-8 pb-8 pt-6">
            <Button variant="outline" onClick={() => setShowInsertModal(false)}>Cancel</Button>
            <Button onClick={handleInsertManual}>Insert Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
