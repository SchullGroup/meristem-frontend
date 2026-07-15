"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Info,
  CheckCircle2,
  XCircle,
  Search,
  AlertTriangle,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

// ── PII-chain shareholder search ───────────────────────────────────────────
// Seeded from the same shareholders used in CSCS Updates Steps 2–4

interface ShareholderResult {
  id: string;
  name: string;
  chn: string;
  bvn: string;
  phone: string;
  email: string;
  bankAccount: string;
  registers: string[];
}

const SEED_SHAREHOLDERS: ShareholderResult[] = [
  {
    id: "1",
    name: "JOHN ADEYEMI BABATUNDE",
    chn: "C0012345AK",
    bvn: "12345001001",
    phone: "08011001001",
    email: "john.babatunde@email.com",
    bankAccount: "0011001001",
    registers: ["DANGCEM"],
  },
  {
    id: "2",
    name: "NGOZI CHIDINMA OKAFOR",
    chn: "C0023456BK",
    bvn: "12345002002",
    phone: "08011002002",
    email: "ngozi.okafor@email.com",
    bankAccount: "0011002002",
    registers: ["DANGCEM"],
  },
  {
    id: "3",
    name: "SAMUEL OLUWASEUN ADELEKE",
    chn: "C0034567CK",
    bvn: "12345003003",
    phone: "08011003003",
    email: "samuel.adeleke@email.com",
    bankAccount: "0011003003",
    registers: ["MTNN"],
  },
  {
    id: "4",
    name: "FATIMA ABUBAKAR MUSA",
    chn: "C0045678DK",
    bvn: "12345004004",
    phone: "08011004004",
    email: "fatima.musa@email.com",
    bankAccount: "0011004004",
    registers: ["MTNN"],
  },
  {
    id: "5",
    name: "EMEKA CHUKWUEMEKA EZE",
    chn: "C0056789EK",
    bvn: "12345005005",
    phone: "08011005005",
    email: "emeka.eze@email.com",
    bankAccount: "0011005005",
    registers: ["SEPLAT"],
  },
  {
    id: "6",
    name: "AMAKA NGOZI OKONKWO",
    chn: "C0067890FK",
    bvn: "12345006006",
    phone: "08011006006",
    email: "amaka.okonkwo@email.com",
    bankAccount: "0011006006",
    registers: ["SEPLAT", "UBA"],
  },
  {
    id: "7",
    name: "IBRAHIM USMAN HASSAN",
    chn: "C0078901GK",
    bvn: "12345007007",
    phone: "08011007007",
    email: "ibrahim.hassan@email.com",
    bankAccount: "0011007007",
    registers: ["UBA"],
  },
  {
    id: "8",
    name: "BLESSING CHISOM NWOSU",
    chn: "C0089012HK",
    bvn: "12345008008",
    phone: "08011008008",
    email: "blessing.nwosu@email.com",
    bankAccount: "0011008008",
    registers: ["UBA"],
  },
  {
    id: "9",
    name: "CHUKWUEMEKA OKAFOR",
    chn: "C0099123IK",
    bvn: "12345009009",
    phone: "08011009009",
    email: "chukwuemeka.okafor@email.com",
    bankAccount: "0011009009",
    registers: ["UBA"],
  },
];

// ── Comparison data per shareholder per register ───────────────────────────
interface ComparisonRow {
  registerName: string;
  accountNumber: string;
  chn: string;
  unitsInApp: number;
  unitsAtCscs: number;
  variance: number;
}

const SEED_COMPARISON: Record<string, ComparisonRow[]> = {
  C0012345AK: [
    {
      registerName: "DANGCEM",
      accountNumber: "0011001001",
      chn: "C0012345AK",
      unitsInApp: 51300,
      unitsAtCscs: 51300,
      variance: 0,
    },
  ],
  C0023456BK: [
    {
      registerName: "DANGCEM",
      accountNumber: "0011002002",
      chn: "C0023456BK",
      unitsInApp: 12500,
      unitsAtCscs: 13500,
      variance: -1000,
    },
  ],
  C0034567CK: [
    {
      registerName: "MTNN",
      accountNumber: "0011003003",
      chn: "C0034567CK",
      unitsInApp: 80000,
      unitsAtCscs: 80000,
      variance: 0,
    },
  ],
  C0045678DK: [
    {
      registerName: "MTNN",
      accountNumber: "0011004004",
      chn: "C0045678DK",
      unitsInApp: 8000,
      unitsAtCscs: 9500,
      variance: -1500,
    },
  ],
  C0056789EK: [
    {
      registerName: "SEPLAT",
      accountNumber: "0011005005",
      chn: "C0056789EK",
      unitsInApp: 123000,
      unitsAtCscs: 123000,
      variance: 0,
    },
  ],
  C0067890FK: [
    {
      registerName: "SEPLAT",
      accountNumber: "0011006006",
      chn: "C0067890FK",
      unitsInApp: 35700,
      unitsAtCscs: 36000,
      variance: -300,
    },
    {
      registerName: "UBA",
      accountNumber: "0011006006",
      chn: "C0067890FK",
      unitsInApp: 22000,
      unitsAtCscs: 22000,
      variance: 0,
    },
  ],
  C0078901GK: [
    {
      registerName: "UBA",
      accountNumber: "0011007007",
      chn: "C0078901GK",
      unitsInApp: 67500,
      unitsAtCscs: 67500,
      variance: 0,
    },
  ],
  C0089012HK: [
    {
      registerName: "UBA",
      accountNumber: "0011008008",
      chn: "C0089012HK",
      unitsInApp: 45000,
      unitsAtCscs: 48000,
      variance: -3000,
    },
  ],
  C0099123IK: [
    {
      registerName: "UBA",
      accountNumber: "0011009009",
      chn: "C0099123IK",
      unitsInApp: 23500,
      unitsAtCscs: 23500,
      variance: 0,
    },
  ],
};

// Build ALL-CHN comparison for a register
function getRegisterComparison(register: string): ComparisonRow[] {
  return Object.values(SEED_COMPARISON)
    .flat()
    .filter((r) => r.registerName === register);
}

const REGISTERS = ["DANGCEM", "MTNN", "SEPLAT", "UBA"];

// ── PII search helper ─────────────────────────────────────────────────────
function piiSearch(query: string): ShareholderResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEED_SHAREHOLDERS.filter(
    (s) =>
      s.chn.toLowerCase().includes(q) ||
      s.bvn.includes(q) ||
      s.phone.includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.bankAccount.includes(q) ||
      s.name.toLowerCase().includes(q),
  );
}

export default function GeneralCertificateReconciliation() {
  const [piiQuery, setPiiQuery] = useState("");
  const [piiResults, setPiiResults] = useState<ShareholderResult[]>([]);
  const [selectedHolder, setSelectedHolder] =
    useState<ShareholderResult | null>(null);

  const [selectedReg, setSelectedReg] = useState("");
  const [scopeMode, setScopeMode] = useState("all");
  const [specificChn, setSpecificChn] = useState("");
  const [reconciled, setReconciled] = useState(false);
  const [compRows, setCompRows] = useState<ComparisonRow[]>([]);

  // PII search
  const handlePiiSearch = () => {
    const results = piiSearch(piiQuery);
    setPiiResults(results);
    if (results.length === 0)
      toast.error("No shareholders found matching that PII query.");
  };

  const handleSelectHolder = (s: ShareholderResult) => {
    setSelectedHolder(s);
    setSpecificChn(s.chn);
    setScopeMode("spec");
    setPiiResults([]);
    setPiiQuery(s.name);
    toast.success(`Selected: ${s.name} (${s.chn})`);
  };

  const runReconciliation = () => {
    if (!selectedReg) {
      toast.error("Please select a register first.");
      return;
    }
    if (scopeMode === "spec" && !specificChn.trim()) {
      toast.error("Please enter or select a CHN.");
      return;
    }

    let rows: ComparisonRow[];
    if (scopeMode === "spec") {
      rows = SEED_COMPARISON[specificChn] ?? [];
      rows = rows.filter((r) => r.registerName === selectedReg);
    } else {
      rows = getRegisterComparison(selectedReg);
    }
    setCompRows(rows);
    setReconciled(true);
  };

  const hasVariance = compRows.some((r) => r.variance !== 0);
  const varianceCount = compRows.filter((r) => r.variance !== 0).length;

  return (
    <>
      {/* PII chain search */}
      <Card className="mrpsl-card p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Advanced Shareholder Search (PII Chain)
        </p>
        <p className="text-[13px] text-muted-foreground">
          Search by <strong>CHN</strong>, <strong>BVN</strong>,{" "}
          <strong>Phone Number</strong>, <strong>Email Address</strong>, or{" "}
          <strong>Bank Account Number</strong> to identify the responsible
          shareholder. This resolves cross-register CHN duplicates.
        </p>
        <div className="flex gap-2">
          <div className="relative w-1/2">
            <Input
              placeholder="CHN / BVN / Phone / Email / Bank Account…"
              className="pl-9 mrpsl-input"
              value={piiQuery}
              onChange={(e) => setPiiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePiiSearch();
              }}
            />
          </div>
          <Button size="xl" onClick={handlePiiSearch}>
            Search
          </Button>
        </div>

        {piiResults.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-muted/30 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {piiResults.length} record{piiResults.length !== 1 ? "s" : ""}{" "}
              found — click to select
            </div>
            {piiResults.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 border-t border-border/50 text-left text-sm transition-colors"
                onClick={() => handleSelectHolder(s)}
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-[12px] text-muted-foreground">
                    CHN: {s.chn} · BVN: {s.bvn} · {s.phone}
                  </p>
                </div>
                <div className="flex gap-1">
                  {s.registers.map((r) => (
                    <Badge
                      key={r}
                      className="border-0 text-[11px] bg-gray-100 text-gray-700"
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedHolder && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-[13px] text-green-900">
              Selected: <strong>{selectedHolder.name}</strong> · CHN{" "}
              <span className="font-mono">{selectedHolder.chn}</span> ·{" "}
              {selectedHolder.registers.join(", ")}
            </p>
          </div>
        )}
      </Card>

      {/* Controls */}
      <Card className="mrpsl-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <label className="mrpsl-label">SELECT REGISTER</label>
            <Select
              value={selectedReg}
              onValueChange={(v) => {
                setSelectedReg(v ?? "");
                setReconciled(false);
              }}
            >
              <SelectTrigger className="w-48 mrpsl-input">
                <SelectValue placeholder="Pick a register" />
              </SelectTrigger>
              <SelectContent>
                {REGISTERS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <RadioGroup
            value={scopeMode}
            onValueChange={(v) => {
              setScopeMode(v ?? "all");
              setReconciled(false);
            }}
            className="flex gap-5 items-center"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="chk-all" />
              <label htmlFor="chk-all" className="text-sm">
                All CHNs
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="spec" id="chk-spec" />
              <label htmlFor="chk-spec" className="text-sm">
                Specific CHN
              </label>
            </div>
          </RadioGroup>

          {scopeMode === "spec" && (
            <Input
              placeholder="Enter CHN…"
              className="w-44 mrpsl-input font-mono"
              value={specificChn}
              onChange={(e) => {
                setSpecificChn(e.target.value);
                setReconciled(false);
              }}
            />
          )}

          <Button onClick={runReconciliation}>Run Reconciliation</Button>
        </div>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          <strong>Automated reconciliation</strong> runs every first Saturday of
          the month. Discrepancy reports are emailed to{" "}
          <span className="font-medium">
            reconciliation@meristemregistrars.com
          </span>
          .
        </p>
      </div>

      {/* Result summary banner */}
      {reconciled &&
        (hasVariance ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="text-sm font-medium text-red-800">
              Variance found: <strong>{varianceCount}</strong> position
              {varianceCount !== 1 ? "s" : ""} do not match between MRPSL and
              CSCS.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm font-medium text-green-800">
              All positions match perfectly. No discrepancies detected.
            </span>
          </div>
        ))}

      {/* Comparison table */}
      {reconciled && compRows.length > 0 && (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Reconciliation Comparison — {selectedReg}
            </h3>
            <span className="text-xs font-mono font-bold">
              {compRows.length} position{compRows.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">REGISTER NAME</th>
                  <th className="px-4 py-3">ACCOUNT NUMBER</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3 text-right">UNITS IN APP</th>
                  <th className="px-4 py-3 text-right">UNITS AT CSCS</th>
                  <th className="px-4 py-3 text-right">VARIANCE</th>
                  <th className="px-4 py-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {compRows.map((r, i) => {
                  const hasVar = r.variance !== 0;
                  return (
                    <tr
                      key={i}
                      className={`mrpsl-table-row ${hasVar ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">
                          {r.registerName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                        {r.accountNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                        {r.chn}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono">
                        {formatNumber(r.unitsInApp)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono">
                        {formatNumber(r.unitsAtCscs)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-mono font-semibold ${hasVar ? "text-red-600" : "text-green-600"}`}
                      >
                        {r.variance === 0 ? "0" : formatNumber(r.variance)}
                      </td>
                      <td className="px-4 py-3">
                        {hasVar ? (
                          <div className="flex items-center gap-1.5 text-red-600 text-[13px]">
                            <AlertTriangle className="h-3.5 w-3.5" />{" "}
                            Discrepancy
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-700 text-[13px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {reconciled && compRows.length === 0 && (
        <p className="text-center py-10 text-muted-foreground text-sm">
          No positions found for the selected filter combination.
        </p>
      )}
    </>
  );
}
