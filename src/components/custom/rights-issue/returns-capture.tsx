"use client";

import { useState } from "react";
import { Upload, Download, Plus, ClipboardList, CheckCircle2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/* ─── shared helpers ─────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs text-muted-foreground">{children}</Label>;
}

/* ─── types ─────────────────────────────────────────── */

type EntryMode = "single" | "bulk";

interface AcceptanceRecord {
  id: string;
  holderName: string;
  agentName: string;
  chn: string;
  additionalShares: number;
  amountPaid: number;
  status: "PENDING";
}

interface RenunciationRecord {
  id: string;
  holderName: string;
  agentName: string;
  chn: string;
  sharesAccepted: number;
  amountPaid: number;
  status: "PENDING";
}

interface TradingRecord {
  id: string;
  holderName: string;
  agentName: string;
  chn: string;
  tradingType: "Sell Rights" | "Buy Rights";
  rightsTraded: number;
  pricePerRight: number;
  totalConsideration: number;
  status: "PENDING";
}

interface BulkStagingRow {
  id: string;
  name: string;
  chn: string;
  units: number;
  accepted: boolean | null;
}

/* ─── seed data ─────────────────────────────────────── */

const SEED_ACCEPTANCES: AcceptanceRecord[] = [
  { id: "a1", holderName: "NGOZI CHIDINMA OKAFOR", agentName: "Meristem Stockbrokers Ltd", chn: "C0023456BK", additionalShares: 5000, amountPaid: 92500, status: "PENDING" },
  { id: "a2", holderName: "AMAKA NGOZI OKONKWO", agentName: "Coronation Registrars", chn: "C0067890FK", additionalShares: 12000, amountPaid: 222000, status: "PENDING" },
  { id: "a3", holderName: "CHUKWUEMEKA IFEANYI NWOSU", agentName: "Meristem Stockbrokers Ltd", chn: "C0089012GK", additionalShares: 3000, amountPaid: 55500, status: "PENDING" },
  { id: "a4", holderName: "ADAEZE OBIORA NNAMDI", agentName: "Stanbic IBTC Nominees Ltd", chn: "C0112345HK", additionalShares: 8500, amountPaid: 157250, status: "PENDING" },
];

const SEED_RENUNCIATIONS: RenunciationRecord[] = [
  { id: "r1", holderName: "FATIMA ABUBAKAR MUSA", agentName: "Access Bank PLC", chn: "C0045678DK", sharesAccepted: 8000, amountPaid: 74000, status: "PENDING" },
  { id: "r2", holderName: "IBRAHIM YUSUF ALIYU", agentName: "GTBank PLC", chn: "C0056789EK", sharesAccepted: 4500, amountPaid: 41625, status: "PENDING" },
  { id: "r3", holderName: "BLESSING OKORO EMENIKE", agentName: "First Bank of Nigeria", chn: "C0078901FK", sharesAccepted: 2000, amountPaid: 18500, status: "PENDING" },
];

const SEED_TRADING: TradingRecord[] = [
  { id: "t1", holderName: "OLUWASEUN ADEBAYO LAGOS", agentName: "Meristem Stockbrokers Ltd", chn: "C0034567CK", tradingType: "Sell Rights", rightsTraded: 10000, pricePerRight: 2.5, totalConsideration: 25000, status: "PENDING" },
  { id: "t2", holderName: "KELECHI NWOSU OWERRI", agentName: "Chapel Hill Denham", chn: "C0056789EK", tradingType: "Buy Rights", rightsTraded: 6000, pricePerRight: 2.8, totalConsideration: 16800, status: "PENDING" },
  { id: "t3", holderName: "ABUBAKAR SADIQ KANO", agentName: "CardinalStone Partners", chn: "C0078901GK", tradingType: "Sell Rights", rightsTraded: 15000, pricePerRight: 2.6, totalConsideration: 39000, status: "PENDING" },
  { id: "t4", holderName: "CHIOMA OBI ENUGU", agentName: "Stanbic IBTC Nominees Ltd", chn: "C0090123HK", tradingType: "Buy Rights", rightsTraded: 8000, pricePerRight: 2.75, totalConsideration: 22000, status: "PENDING" },
];

const BULK_STAGING_ACCEPTANCE: BulkStagingRow[] = [
  { id: "bs1", name: "UCHE OKONKWO JAMES", chn: "C0234567IK", units: 7000, accepted: null },
  { id: "bs2", name: "DAMILOLA ADEKUNLE SEUN", chn: "C0345678JK", units: 3500, accepted: null },
  { id: "bs3", name: "GRACE NWACHUKWU ANAMBRA", chn: "C0456789KK", units: 9000, accepted: null },
];

let _nextId = 200;
const nextId = () => String(_nextId++);

/* ═══════════════════════════════════════════════════════
   SUB-TAB 1: FULL ACCEPTANCE
   ═══════════════════════════════════════════════════════ */

const EMPTY_ACCEPTANCE = {
  agentType: "",
  agentName: "",
  chn: "",
  cscsNumber: "",
  registrarAccountNo: "",
  additionalSharesApplied: "",
  additionalAmountPaid: "",
  totalAmountPaid: "",
  holderName: "",
  nextOfKin: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  bankName: "",
  accountNumber: "",
  bvn: "",
  tin: "",
};

function FullAcceptanceTab() {
  const [mode, setMode] = useState<EntryMode>("single");
  const [form, setForm] = useState(EMPTY_ACCEPTANCE);
  const [records, setRecords] = useState<AcceptanceRecord[]>(SEED_ACCEPTANCES);
  const [bulkStaging, setBulkStaging] = useState<BulkStagingRow[]>([]);
  const [bulkLoaded, setBulkLoaded] = useState(false);

  const setField = (k: keyof typeof EMPTY_ACCEPTANCE, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.holderName.trim() || !form.agentName.trim() || !form.chn.trim()) {
      toast.error("Holder name, agent name, and CHN are required.");
      return;
    }
    setRecords((prev) => [
      {
        id: nextId(),
        holderName: form.holderName.toUpperCase(),
        agentName: form.agentName,
        chn: form.chn,
        additionalShares: Number(form.additionalSharesApplied) || 0,
        amountPaid: Number(form.totalAmountPaid) || 0,
        status: "PENDING",
      },
      ...prev,
    ]);
    setForm(EMPTY_ACCEPTANCE);
    toast.success("Acceptance submitted successfully.");
  };

  const handleBulkLoad = () => {
    setBulkStaging(BULK_STAGING_ACCEPTANCE.map((r) => ({ ...r, accepted: null })));
    setBulkLoaded(true);
    toast.success("3 records loaded from file.");
  };

  const acceptRow = (id: string) =>
    setBulkStaging((p) => p.map((r) => (r.id === id ? { ...r, accepted: true } : r)));
  const rejectRow = (id: string) =>
    setBulkStaging((p) => p.map((r) => (r.id === id ? { ...r, accepted: false } : r)));

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        {(["single", "bulk"] as EntryMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {m === "single" ? <ClipboardList className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {m === "single" ? "Single Entry" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {/* Single entry form */}
      {mode === "single" && (
        <Card className="mrpsl-card p-5 space-y-6">
          {/* Agent Information */}
          <div className="space-y-3">
            <SectionHeading>Agent Information</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Agent Type</FieldLabel>
                <Select value={form.agentType} onValueChange={(v) => setField("agentType", v ?? "")}>
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="Select agent type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stockbroker">Stockbroker</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Collecting Agent">Collecting Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Agent Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. Meristem Stockbrokers Ltd" value={form.agentName} onChange={(e) => setField("agentName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CHN Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. C0023456BK" value={form.chn} onChange={(e) => setField("chn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CSCS Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. CSCS-000234561" value={form.cscsNumber} onChange={(e) => setField("cscsNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Registrar Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. REG-00123456" value={form.registrarAccountNo} onChange={(e) => setField("registrarAccountNo", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Full Acceptance / Additional Shares */}
          <div className="space-y-3">
            <SectionHeading>Full Acceptance / Additional Shares</SectionHeading>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>No. of Additional Ordinary Shares Applied For</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0" value={form.additionalSharesApplied} onChange={(e) => setField("additionalSharesApplied", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Additional Amount Paid (₦)</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0.00" value={form.additionalAmountPaid} onChange={(e) => setField("additionalAmountPaid", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Total Amount Paid (₦)</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="Rights + additional" value={form.totalAmountPaid} onChange={(e) => setField("totalAmountPaid", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Holder Details */}
          <div className="space-y-3">
            <SectionHeading>Holder Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Full Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. NGOZI CHIDINMA OKAFOR" value={form.holderName} onChange={(e) => setField("holderName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Next of Kin</FieldLabel>
                <Input className="mrpsl-input" placeholder="Full name of next of kin" value={form.nextOfKin} onChange={(e) => setField("nextOfKin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Phone Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. 08023456789" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email Address</FieldLabel>
                <Input type="email" className="mrpsl-input" placeholder="e.g. name@email.com" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Date of Birth</FieldLabel>
                <Input type="date" className="mrpsl-input" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Bank Details */}
          <div className="space-y-3">
            <SectionHeading>Bank Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Name of Bank</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. First Bank of Nigeria" value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="10-digit account number" value={form.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>BVN</FieldLabel>
                <Input className="mrpsl-input" placeholder="11-digit BVN" value={form.bvn} onChange={(e) => setField("bvn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>TIN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Tax identification number" value={form.tin} onChange={(e) => setField("tin", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-1.5" />
              Submit Acceptance
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk upload */}
      {mode === "bulk" && (
        <Card className="mrpsl-card p-5 space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">Drop CSV / Excel file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </div>
            <input type="file" accept=".csv,.xlsx" className="hidden" />
            <Button variant="outline" size="sm" onClick={() => toast.info("Template downloaded.")}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download CSV Template
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleBulkLoad}>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload
            </Button>
          </div>
          {bulkLoaded && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                    <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                    <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                    <th className="text-center px-4 py-2.5 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkStaging.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{row.chn}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{row.units.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        {row.accepted === null ? (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => acceptRow(row.id)}>Accept</Button>
                            <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => rejectRow(row.id)}>Reject</Button>
                          </div>
                        ) : (
                          <Badge className={row.accepted ? "bg-green-100 text-green-800 border-0" : "bg-red-100 text-red-800 border-0"}>
                            {row.accepted ? "Accepted" : "Rejected"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Submitted records table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Submitted Acceptances
          </p>
          <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">{records.length} records</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-right px-4 py-2.5 font-medium">ADDITIONAL SHARES</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
                <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium text-sm">{r.holderName}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.agentName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.additionalShares.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">PENDING</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-TAB 2: RENUNCIATION
   ═══════════════════════════════════════════════════════ */

const EMPTY_RENUNCIATION = {
  agentType: "",
  agentName: "",
  chn: "",
  cscsNumber: "",
  registrarAccountNo: "",
  sharesAccepted: "",
  amountPayablePerShare: "",
  sharesRenounced: "",
  totalAmountPaid: "",
  holderName: "",
  nextOfKin: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  bankName: "",
  accountNumber: "",
  bvn: "",
  tin: "",
};

function RenunciationTab() {
  const [mode, setMode] = useState<EntryMode>("single");
  const [form, setForm] = useState(EMPTY_RENUNCIATION);
  const [records, setRecords] = useState<RenunciationRecord[]>(SEED_RENUNCIATIONS);
  const [bulkStaging, setBulkStaging] = useState<BulkStagingRow[]>([]);
  const [bulkLoaded, setBulkLoaded] = useState(false);

  const setField = (k: keyof typeof EMPTY_RENUNCIATION, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.holderName.trim() || !form.agentName.trim() || !form.chn.trim()) {
      toast.error("Holder name, agent name, and CHN are required.");
      return;
    }
    setRecords((prev) => [
      {
        id: nextId(),
        holderName: form.holderName.toUpperCase(),
        agentName: form.agentName,
        chn: form.chn,
        sharesAccepted: Number(form.sharesAccepted) || 0,
        amountPaid: Number(form.totalAmountPaid) || 0,
        status: "PENDING",
      },
      ...prev,
    ]);
    setForm(EMPTY_RENUNCIATION);
    toast.success("Renunciation submitted successfully.");
  };

  const handleBulkLoad = () => {
    setBulkStaging(BULK_STAGING_ACCEPTANCE.map((r) => ({ ...r, accepted: null })));
    setBulkLoaded(true);
    toast.success("3 records loaded from file.");
  };

  const acceptRow = (id: string) =>
    setBulkStaging((p) => p.map((r) => (r.id === id ? { ...r, accepted: true } : r)));
  const rejectRow = (id: string) =>
    setBulkStaging((p) => p.map((r) => (r.id === id ? { ...r, accepted: false } : r)));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(["single", "bulk"] as EntryMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {m === "single" ? <ClipboardList className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {m === "single" ? "Single Entry" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <Card className="mrpsl-card p-5 space-y-6">
          {/* Agent Information */}
          <div className="space-y-3">
            <SectionHeading>Agent Information</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Agent Type</FieldLabel>
                <Select value={form.agentType} onValueChange={(v) => setField("agentType", v ?? "")}>
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="Select agent type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stockbroker">Stockbroker</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Collecting Agent">Collecting Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Agent Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. Access Bank PLC" value={form.agentName} onChange={(e) => setField("agentName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CHN Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. C0045678DK" value={form.chn} onChange={(e) => setField("chn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CSCS Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. CSCS-000456782" value={form.cscsNumber} onChange={(e) => setField("cscsNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Registrar Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. REG-00456789" value={form.registrarAccountNo} onChange={(e) => setField("registrarAccountNo", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Renunciation / Partial Acceptance */}
          <div className="space-y-3">
            <SectionHeading>Renunciation or Partial Acceptance</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Number of Ordinary Shares Accepted</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0" value={form.sharesAccepted} onChange={(e) => setField("sharesAccepted", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Amount Payable per Share (₦) — computed</FieldLabel>
                <Input type="number" min="0" readOnly className="mrpsl-input bg-muted/40 cursor-not-allowed" placeholder="Auto-computed" value={form.amountPayablePerShare} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Number of Ordinary Shares Renounced</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0" value={form.sharesRenounced} onChange={(e) => setField("sharesRenounced", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Total Amount Paid (₦)</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0.00" value={form.totalAmountPaid} onChange={(e) => setField("totalAmountPaid", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Holder Details */}
          <div className="space-y-3">
            <SectionHeading>Holder Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Full Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. FATIMA ABUBAKAR MUSA" value={form.holderName} onChange={(e) => setField("holderName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Next of Kin</FieldLabel>
                <Input className="mrpsl-input" placeholder="Full name of next of kin" value={form.nextOfKin} onChange={(e) => setField("nextOfKin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Phone Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. 07034567890" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email Address</FieldLabel>
                <Input type="email" className="mrpsl-input" placeholder="e.g. name@email.com" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Date of Birth</FieldLabel>
                <Input type="date" className="mrpsl-input" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Bank Details */}
          <div className="space-y-3">
            <SectionHeading>Bank Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Name of Bank</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. Access Bank PLC" value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="10-digit account number" value={form.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>BVN</FieldLabel>
                <Input className="mrpsl-input" placeholder="11-digit BVN" value={form.bvn} onChange={(e) => setField("bvn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>TIN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Tax identification number" value={form.tin} onChange={(e) => setField("tin", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-1.5" />
              Submit Renunciation
            </Button>
          </div>
        </Card>
      )}

      {mode === "bulk" && (
        <Card className="mrpsl-card p-5 space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">Drop CSV / Excel file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("Template downloaded.")}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download CSV Template
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleBulkLoad}>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload
            </Button>
          </div>
          {bulkLoaded && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                    <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                    <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                    <th className="text-center px-4 py-2.5 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkStaging.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{row.chn}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{row.units.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        {row.accepted === null ? (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => acceptRow(row.id)}>Accept</Button>
                            <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => rejectRow(row.id)}>Reject</Button>
                          </div>
                        ) : (
                          <Badge className={row.accepted ? "bg-green-100 text-green-800 border-0" : "bg-red-100 text-red-800 border-0"}>
                            {row.accepted ? "Accepted" : "Rejected"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Submitted renunciation records */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Submitted Renunciations
          </p>
          <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">{records.length} records</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-right px-4 py-2.5 font-medium">SHARES ACCEPTED</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
                <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium text-sm">{r.holderName}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.agentName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.sharesAccepted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">PENDING</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-TAB 3: TRADING IN RIGHTS
   ═══════════════════════════════════════════════════════ */

const EMPTY_TRADING = {
  agentType: "",
  agentName: "",
  chn: "",
  cscsNumber: "",
  registrarAccountNo: "",
  tradingType: "" as "Sell Rights" | "Buy Rights" | "",
  chnBuyer: "",
  rightsTraded: "",
  pricePerRight: "",
  totalConsideration: "",
  ngxReference: "",
  tradeDate: "",
  settlementDate: "",
  sellerName: "",
  sellerChn: "",
  sellerCscs: "",
  sellerRegAcct: "",
  sellerPhone: "",
  sellerEmail: "",
  buyerName: "",
  buyerChn: "",
  buyerCscs: "",
  buyerRegAcct: "",
  buyerPhone: "",
  buyerEmail: "",
  buyerBankName: "",
  buyerAccountNumber: "",
  buyerBvn: "",
  buyerTin: "",
};

function TradingInRightsTab() {
  const [mode, setMode] = useState<EntryMode>("single");
  const [form, setForm] = useState(EMPTY_TRADING);
  const [records, setRecords] = useState<TradingRecord[]>(SEED_TRADING);
  const [bulkStaging, setBulkStaging] = useState<BulkStagingRow[]>([]);
  const [bulkLoaded, setBulkLoaded] = useState(false);

  const setField = (k: keyof typeof EMPTY_TRADING, v: string) =>
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "rightsTraded" || k === "pricePerRight") {
        const r = Number(k === "rightsTraded" ? v : p.rightsTraded) || 0;
        const pr = Number(k === "pricePerRight" ? v : p.pricePerRight) || 0;
        next.totalConsideration = r && pr ? String(r * pr) : "";
      }
      return next;
    });

  const handleSubmit = () => {
    if (!form.sellerName.trim() || !form.tradingType || !form.rightsTraded) {
      toast.error("Seller name, trading type, and rights traded are required.");
      return;
    }
    setRecords((prev) => [
      {
        id: nextId(),
        holderName: form.sellerName.toUpperCase(),
        agentName: form.agentName,
        chn: form.sellerChn || form.chn,
        tradingType: form.tradingType as "Sell Rights" | "Buy Rights",
        rightsTraded: Number(form.rightsTraded) || 0,
        pricePerRight: Number(form.pricePerRight) || 0,
        totalConsideration: Number(form.totalConsideration) || 0,
        status: "PENDING",
      },
      ...prev,
    ]);
    setForm(EMPTY_TRADING);
    toast.success("Trading record submitted successfully.");
  };

  const handleBulkLoad = () => {
    setBulkStaging(BULK_STAGING_ACCEPTANCE.map((r) => ({ ...r, accepted: null })));
    setBulkLoaded(true);
    toast.success("3 records loaded from file.");
  };

  const acceptRow = (id: string) =>
    setBulkStaging((p) => p.map((r) => (r.id === id ? { ...r, accepted: true } : r)));
  const rejectRow = (id: string) =>
    setBulkStaging((p) => p.map((r) => (r.id === id ? { ...r, accepted: false } : r)));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(["single", "bulk"] as EntryMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {m === "single" ? <ClipboardList className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {m === "single" ? "Single Entry" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <Card className="mrpsl-card p-5 space-y-6">
          {/* Agent Information */}
          <div className="space-y-3">
            <SectionHeading>Agent Information</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Agent Type</FieldLabel>
                <Select value={form.agentType} onValueChange={(v) => setField("agentType", v ?? "")}>
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="Select agent type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stockbroker">Stockbroker</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Collecting Agent">Collecting Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Agent Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. Meristem Stockbrokers Ltd" value={form.agentName} onChange={(e) => setField("agentName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CHN Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. C0034567CK" value={form.chn} onChange={(e) => setField("chn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CSCS Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. CSCS-000345671" value={form.cscsNumber} onChange={(e) => setField("cscsNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Registrar Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. REG-00345678" value={form.registrarAccountNo} onChange={(e) => setField("registrarAccountNo", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Trading Details */}
          <div className="space-y-3">
            <SectionHeading>Trading Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Trading Type</FieldLabel>
                <Select value={form.tradingType} onValueChange={(v) => setField("tradingType", v ?? "")}>
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="Select trading type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sell Rights">Sell Rights</SelectItem>
                    <SelectItem value="Buy Rights">Buy Rights</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.tradingType === "Sell Rights" && (
                <div className="space-y-1.5">
                  <FieldLabel>CHN of Rights Buyer</FieldLabel>
                  <Input className="mrpsl-input" placeholder="e.g. C0056789EK" value={form.chnBuyer} onChange={(e) => setField("chnBuyer", e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <FieldLabel>Number of Rights Traded</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0" value={form.rightsTraded} onChange={(e) => setField("rightsTraded", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Price per Right (₦)</FieldLabel>
                <Input type="number" min="0" step="0.01" className="mrpsl-input" placeholder="0.00" value={form.pricePerRight} onChange={(e) => setField("pricePerRight", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Total Consideration (₦) — computed</FieldLabel>
                <Input type="number" readOnly className="mrpsl-input bg-muted/40 cursor-not-allowed" placeholder="Rights × Price" value={form.totalConsideration} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>NGX Trade Reference</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. NGX-2026-0001234" value={form.ngxReference} onChange={(e) => setField("ngxReference", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Trade Date</FieldLabel>
                <Input type="date" className="mrpsl-input" value={form.tradeDate} onChange={(e) => setField("tradeDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Settlement Date</FieldLabel>
                <Input type="date" className="mrpsl-input" value={form.settlementDate} onChange={(e) => setField("settlementDate", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Seller / Transferor Details */}
          <div className="space-y-3">
            <SectionHeading>Seller / Transferor Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Full Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="Seller full name" value={form.sellerName} onChange={(e) => setField("sellerName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CHN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Seller CHN" value={form.sellerChn} onChange={(e) => setField("sellerChn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CSCS Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="Seller CSCS" value={form.sellerCscs} onChange={(e) => setField("sellerCscs", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Registrar Account No</FieldLabel>
                <Input className="mrpsl-input" placeholder="Seller Reg Acct" value={form.sellerRegAcct} onChange={(e) => setField("sellerRegAcct", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Phone</FieldLabel>
                <Input className="mrpsl-input" placeholder="Seller phone" value={form.sellerPhone} onChange={(e) => setField("sellerPhone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email</FieldLabel>
                <Input type="email" className="mrpsl-input" placeholder="Seller email" value={form.sellerEmail} onChange={(e) => setField("sellerEmail", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Buyer / Transferee Details */}
          <div className="space-y-3">
            <SectionHeading>Buyer / Transferee Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Full Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer full name" value={form.buyerName} onChange={(e) => setField("buyerName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CHN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer CHN" value={form.buyerChn} onChange={(e) => setField("buyerChn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CSCS Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer CSCS" value={form.buyerCscs} onChange={(e) => setField("buyerCscs", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Registrar Account No</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer Reg Acct" value={form.buyerRegAcct} onChange={(e) => setField("buyerRegAcct", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Phone</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer phone" value={form.buyerPhone} onChange={(e) => setField("buyerPhone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email</FieldLabel>
                <Input type="email" className="mrpsl-input" placeholder="Buyer email" value={form.buyerEmail} onChange={(e) => setField("buyerEmail", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Bank Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer bank" value={form.buyerBankName} onChange={(e) => setField("buyerBankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer account number" value={form.buyerAccountNumber} onChange={(e) => setField("buyerAccountNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>BVN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer BVN" value={form.buyerBvn} onChange={(e) => setField("buyerBvn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>TIN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Buyer TIN" value={form.buyerTin} onChange={(e) => setField("buyerTin", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-1.5" />
              Submit Trading Record
            </Button>
          </div>
        </Card>
      )}

      {mode === "bulk" && (
        <Card className="mrpsl-card p-5 space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">Drop CSV / Excel file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("Template downloaded.")}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download CSV Template
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleBulkLoad}>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload
            </Button>
          </div>
          {bulkLoaded && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                    <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                    <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                    <th className="text-center px-4 py-2.5 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkStaging.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{row.chn}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{row.units.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        {row.accepted === null ? (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => acceptRow(row.id)}>Accept</Button>
                            <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => rejectRow(row.id)}>Reject</Button>
                          </div>
                        ) : (
                          <Badge className={row.accepted ? "bg-green-100 text-green-800 border-0" : "bg-red-100 text-red-800 border-0"}>
                            {row.accepted ? "Accepted" : "Rejected"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Submitted trading records */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Submitted Trading Records
          </p>
          <Badge className="bg-blue-100 text-blue-800 border-0 text-[11px]">{records.length} records</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">HOLDER / CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                <th className="text-right px-4 py-2.5 font-medium">RIGHTS TRADED</th>
                <th className="text-right px-4 py-2.5 font-medium">PRICE (₦)</th>
                <th className="text-right px-4 py-2.5 font-medium">TOTAL (₦)</th>
                <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-sm">{r.holderName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.chn}</p>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.agentName}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={`border-0 text-[11px] ${r.tradingType === "Sell Rights" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                      {r.tradingType}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.rightsTraded.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.pricePerRight.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.totalConsideration.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">PENDING</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT: RETURNS CAPTURE (3 sub-tabs)
   ═══════════════════════════════════════════════════════ */

export function ReturnsCapture() {
  return (
    <div className="space-y-5">
      <Tabs defaultValue="acceptance" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl gap-0.5">
          <TabsTrigger value="acceptance" className="rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap">
            Full Acceptance
          </TabsTrigger>
          <TabsTrigger value="renunciation" className="rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap">
            Renunciation
          </TabsTrigger>
          <TabsTrigger value="trading" className="rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap">
            Trading in Rights
          </TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="acceptance">
            <FullAcceptanceTab />
          </TabsContent>
          <TabsContent value="renunciation">
            <RenunciationTab />
          </TabsContent>
          <TabsContent value="trading">
            <TradingInRightsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
