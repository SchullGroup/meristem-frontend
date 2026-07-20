"use client";

import { useState } from "react";
import { Upload, ClipboardList, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadStagingCard,
  UploadResult,
} from "@/components/custom/offer-administration/upload-staging-card";
import { toast } from "sonner";

type EntryMode = "manual" | "bulk";
type TxType = "acceptance" | "renunciation";
type AgentType = "STOCKBROKER" | "BANK" | "COLLECTING_AGENT";

const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  STOCKBROKER: "Stockbroker",
  BANK: "Bank",
  COLLECTING_AGENT: "Collecting Agent",
};

interface Submission {
  id: string;
  txType: TxType;
  agentType: AgentType;
  agentName: string;
  chn: string;
  cscsNumber: string;
  registrarAccountNo: string;
  additionalSharesApplied: number;
  additionalAmountPaid: number;
  totalAmountPaid: number;
  unitsAccepted: number;
  amountPayable: number;
  holderName: string;
  nextOfKin: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  bankName: string;
  accountNumber: string;
  bvn: string;
  tin: string;
  submittedAt: string;
  status: "PENDING" | "PROCESSED";
}

const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "s1",
    txType: "acceptance",
    agentType: "STOCKBROKER",
    agentName: "Meristem Stockbrokers Ltd",
    chn: "C0023456BK",
    cscsNumber: "CSCS-000234561",
    registrarAccountNo: "REG-00123456",
    additionalSharesApplied: 5000,
    additionalAmountPaid: 46250,
    totalAmountPaid: 92500,
    unitsAccepted: 0,
    amountPayable: 0,
    holderName: "NGOZI CHIDINMA OKAFOR",
    nextOfKin: "Emeka Okafor",
    phone: "08023456789",
    email: "ngozi.okafor@email.com",
    dateOfBirth: "1985-04-20",
    bankName: "First Bank of Nigeria",
    accountNumber: "3012345678",
    bvn: "22098765432",
    tin: "1234567890",
    submittedAt: "07 Jul 2026",
    status: "PENDING",
  },
  {
    id: "s2",
    txType: "renunciation",
    agentType: "BANK",
    agentName: "Access Bank PLC",
    chn: "C0045678DK",
    cscsNumber: "CSCS-000456782",
    registrarAccountNo: "REG-00456789",
    additionalSharesApplied: 0,
    additionalAmountPaid: 0,
    totalAmountPaid: 0,
    unitsAccepted: 8000,
    amountPayable: 74000,
    holderName: "FATIMA ABUBAKAR MUSA",
    nextOfKin: "Ibrahim Musa",
    phone: "07034567890",
    email: "fatima.musa@email.com",
    dateOfBirth: "1990-11-15",
    bankName: "Access Bank PLC",
    accountNumber: "0123456789",
    bvn: "22012345678",
    tin: "0987654321",
    submittedAt: "08 Jul 2026",
    status: "PROCESSED",
  },
  {
    id: "s3",
    txType: "acceptance",
    agentType: "COLLECTING_AGENT",
    agentName: "Coronation Registrars",
    chn: "C0067890FK",
    cscsNumber: "CSCS-000678903",
    registrarAccountNo: "REG-00678901",
    additionalSharesApplied: 12000,
    additionalAmountPaid: 111000,
    totalAmountPaid: 222000,
    unitsAccepted: 0,
    amountPayable: 0,
    holderName: "AMAKA NGOZI OKONKWO",
    nextOfKin: "Chukwuemeka Okonkwo",
    phone: "08167890123",
    email: "amaka.okonkwo@email.com",
    dateOfBirth: "1978-09-03",
    bankName: "Zenith Bank PLC",
    accountNumber: "2012345678",
    bvn: "22056789012",
    tin: "5678901234",
    submittedAt: "09 Jul 2026",
    status: "PENDING",
  },
];

let _nextId = 100;
const nextId = () => String(_nextId++);

const EMPTY_FORM = {
  txType: "acceptance" as TxType,
  agentType: "" as AgentType | "",
  agentName: "",
  chn: "",
  cscsNumber: "",
  registrarAccountNo: "",
  additionalSharesApplied: "",
  additionalAmountPaid: "",
  totalAmountPaid: "",
  unitsAccepted: "",
  amountPayable: "",
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

export function RightsTrading() {
  const [mode, setMode] = useState<EntryMode>("manual");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submissions, setSubmissions] = useState<Submission[]>(SEED_SUBMISSIONS);
  const [showForm, setShowForm] = useState(false);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.agentType || !form.agentName.trim() || !form.chn.trim() || !form.holderName.trim()) {
      toast.error("Agent type, agent name, CHN, and holder name are required.");
      return;
    }

    const now = new Date();
    const submittedAt = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newSub: Submission = {
      id: nextId(),
      txType: form.txType,
      agentType: form.agentType as AgentType,
      agentName: form.agentName,
      chn: form.chn,
      cscsNumber: form.cscsNumber,
      registrarAccountNo: form.registrarAccountNo,
      additionalSharesApplied: Number(form.additionalSharesApplied) || 0,
      additionalAmountPaid: Number(form.additionalAmountPaid) || 0,
      totalAmountPaid: Number(form.totalAmountPaid) || 0,
      unitsAccepted: Number(form.unitsAccepted) || 0,
      amountPayable: Number(form.amountPayable) || 0,
      holderName: form.holderName,
      nextOfKin: form.nextOfKin,
      phone: form.phone,
      email: form.email,
      dateOfBirth: form.dateOfBirth,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      bvn: form.bvn,
      tin: form.tin,
      submittedAt,
      status: "PENDING",
    };

    setSubmissions((prev) => [newSub, ...prev]);
    resetForm();
    toast.success("Submission captured successfully.");
  };

  const handleBulkUpload = async (_file: File): Promise<UploadResult> => {
    toast.success("Bulk file processed — records imported.");
    return { totalRows: 12 };
  };

  const pending = submissions.filter((s) => s.status === "PENDING").length;
  const acceptanceCount = submissions.filter((s) => s.txType === "acceptance").length;
  const renunciationCount = submissions.filter((s) => s.txType === "renunciation").length;

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="flex items-center gap-2">
        {(["manual", "bulk"] as EntryMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {m === "manual" ? (
              <ClipboardList className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {m === "manual" ? "Manual Entry" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {/* ── Bulk upload ─────────────────────────────────────────────── */}
      {mode === "bulk" && (
        <UploadStagingCard
          label="Upload Rights Trading / Renunciation File"
          description="Upload a CSV or Excel file containing rights trading and renunciation submissions from agents. Download the template to ensure the correct column format."
          accept=".csv,.xlsx,.xls"
          onUpload={handleBulkUpload}
        />
      )}

      {/* ── Manual entry ────────────────────────────────────────────── */}
      {mode === "manual" && (
        <>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Submission
            </Button>
          ) : (
            <Card className="mrpsl-card p-5 space-y-6">
              {/* Form header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">New Submission</p>
                <button
                  onClick={resetForm}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              {/* Transaction Type */}
              <div className="space-y-2.5">
                <SectionHeading>Transaction Type</SectionHeading>
                <RadioGroup
                  value={form.txType}
                  onValueChange={(v) => setField("txType", v)}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="acceptance" id="tt-acceptance" />
                    <Label
                      htmlFor="tt-acceptance"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Full Acceptance / Additional Shares
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="renunciation" id="tt-renunciation" />
                    <Label
                      htmlFor="tt-renunciation"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Renunciation
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border-t border-border" />

              {/* Agent Information */}
              <div className="space-y-3">
                <SectionHeading>Agent Information</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Agent Type</FieldLabel>
                    <Select
                      value={form.agentType}
                      onValueChange={(v) => setField("agentType", v ?? "")}
                    >
                      <SelectTrigger className="mrpsl-input w-full">
                        <SelectValue placeholder="Select agent type…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCKBROKER">Stockbroker</SelectItem>
                        <SelectItem value="BANK">Bank</SelectItem>
                        <SelectItem value="COLLECTING_AGENT">Collecting Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Agent Name</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. Meristem Stockbrokers Ltd"
                      value={form.agentName}
                      onChange={(e) => setField("agentName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>CHN Number</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. C0023456BK"
                      value={form.chn}
                      onChange={(e) => setField("chn", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>CSCS Number</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. CSCS-000234561"
                      value={form.cscsNumber}
                      onChange={(e) => setField("cscsNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Registrar Account Number</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. REG-00123456"
                      value={form.registrarAccountNo}
                      onChange={(e) => setField("registrarAccountNo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Acceptance or Renunciation details */}
              {form.txType === "acceptance" ? (
                <div className="space-y-3">
                  <SectionHeading>Full Acceptance / Additional Shares</SectionHeading>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    <div className="space-y-1.5">
                      <FieldLabel>No. of Additional Ordinary Shares Applied For</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        className="mrpsl-input"
                        placeholder="0"
                        value={form.additionalSharesApplied}
                        onChange={(e) => setField("additionalSharesApplied", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Additional Amount Paid (₦)</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        className="mrpsl-input"
                        placeholder="0.00"
                        value={form.additionalAmountPaid}
                        onChange={(e) => setField("additionalAmountPaid", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Total Amount Paid (₦)</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        className="mrpsl-input"
                        placeholder="Rights amount + additional"
                        value={form.totalAmountPaid}
                        onChange={(e) => setField("totalAmountPaid", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <SectionHeading>Renunciation</SectionHeading>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1.5">
                      <FieldLabel>Number of Ordinary Units Accepted</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        className="mrpsl-input"
                        placeholder="0"
                        value={form.unitsAccepted}
                        onChange={(e) => setField("unitsAccepted", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Amount Payable (₦)</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        className="mrpsl-input"
                        placeholder="0.00"
                        value={form.amountPayable}
                        onChange={(e) => setField("amountPayable", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border" />

              {/* Holder Details */}
              <div className="space-y-3">
                <SectionHeading>Holder Details</SectionHeading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Full Name</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. NGOZI CHIDINMA OKAFOR"
                      value={form.holderName}
                      onChange={(e) => setField("holderName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Next of Kin</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="Full name of next of kin"
                      value={form.nextOfKin}
                      onChange={(e) => setField("nextOfKin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Phone Number</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. 08023456789"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Email Address</FieldLabel>
                    <Input
                      type="email"
                      className="mrpsl-input"
                      placeholder="e.g. name@email.com"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Date of Birth</FieldLabel>
                    <Input
                      type="date"
                      className="mrpsl-input"
                      value={form.dateOfBirth}
                      onChange={(e) => setField("dateOfBirth", e.target.value)}
                    />
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
                    <Input
                      className="mrpsl-input"
                      placeholder="e.g. First Bank of Nigeria"
                      value={form.bankName}
                      onChange={(e) => setField("bankName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Account Number</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="10-digit account number"
                      value={form.accountNumber}
                      onChange={(e) => setField("accountNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>BVN</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="11-digit BVN"
                      value={form.bvn}
                      onChange={(e) => setField("bvn", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>TIN</FieldLabel>
                    <Input
                      className="mrpsl-input"
                      placeholder="Tax identification number"
                      value={form.tin}
                      onChange={(e) => setField("tin", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Submit Entry
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Summary + Submissions table ──────────────────────────────── */}
      {submissions.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Submissions", value: submissions.length, highlight: "" },
              {
                label: "Full Acceptance / Additional",
                value: acceptanceCount,
                highlight: "text-primary",
              },
              {
                label: "Renunciation",
                value: renunciationCount,
                highlight: "text-amber-700",
              },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className="mrpsl-card p-3">
                <p className="mrpsl-label">{label}</p>
                <p className={`font-mono font-semibold text-lg mt-1 ${highlight}`}>
                  {value}
                </p>
              </Card>
            ))}
          </div>

          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Submissions
                </p>
                {pending > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">
                    {pending} Pending
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Export coming soon.")}
              >
                Export
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">HOLDER / CHN</th>
                    <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                    <th className="text-left px-4 py-2.5 font-medium">CSCS NO.</th>
                    <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                    <th className="text-right px-4 py-2.5 font-medium">UNITS / SHARES</th>
                    <th className="text-right px-4 py-2.5 font-medium">AMOUNT (₦)</th>
                    <th className="text-left px-4 py-2.5 font-medium">BANK</th>
                    <th className="text-left px-4 py-2.5 font-medium">DATE</th>
                    <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => {
                    const isAcceptance = s.txType === "acceptance";
                    const units = isAcceptance
                      ? s.additionalSharesApplied
                      : s.unitsAccepted;
                    const amount = isAcceptance ? s.totalAmountPaid : s.amountPayable;
                    return (
                      <tr key={s.id} className="mrpsl-table-row">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-sm">{s.holderName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{s.chn}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-sm">{s.agentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {AGENT_TYPE_LABELS[s.agentType]}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {s.cscsNumber || "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            className={`border-0 text-[11px] ${
                              isAcceptance
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isAcceptance ? "Acceptance" : "Renunciation"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          {units > 0 ? units.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          {amount > 0 ? amount.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">
                          {s.bankName || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">
                          {s.submittedAt}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge
                            className={`border-0 text-[11px] ${
                              s.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {s.status === "PENDING" ? "Pending" : "Processed"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() =>
                toast.success(
                  "Submissions forwarded to Returns Capture.",
                )
              }
            >
              Forward to Returns Capture
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
