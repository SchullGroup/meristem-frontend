"use client";

import { useState } from "react";
import {
  Upload, Download, Plus, ClipboardList, Users,
  ArrowLeft, Building2, ChevronRight, Layers,
  CheckCircle2, XCircle, ShieldCheck, ShieldX, ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/* ─── helpers ──────────────────────────────────────────── */

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

/* ─── types ────────────────────────────────────────────── */

type AgentType = "Stockbroker" | "Bank" | "Receiving Agent";
type BatchStatus = "OPEN" | "SUBMITTED" | "ICU_APPROVED" | "ICU_REJECTED";
type OverallApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type EntryMode = "single" | "bulk";

interface Batch {
  id: string;
  receivingAgentName: string;
  receivingAgentType: AgentType;
  batchDate: string;
  status: BatchStatus;
  notes: string;
  icuNotes?: string;
}

interface IcuCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

type EntryDisposition = "ACCEPTED" | "REJECTED";

const SEC_REJECTION_REASONS = [
  "Incomplete KYC documentation",
  "Insufficient fund verification",
  "Signature mismatch",
  "Invalid or unverified CHN",
  "Duplicate submission",
  "Stale or expired form",
  "Invalid BVN / TIN",
  "Amount discrepancy",
  "Unauthorized agent submission",
  "Missing allotment letter",
] as const;

interface AcceptanceRecord {
  id: string;
  batchId: string;
  stockbrokerName: string;
  holderName: string;
  chn: string;
  additionalShares: number;
  amountPaid: number;
  disposition: EntryDisposition;
  rejectionReason: string;
  status: "PENDING";
}

interface BulkStagingRow {
  id: string;
  name: string;
  chn: string;
  units: number;
  accepted: boolean | null;
}

/* ─── seed data ────────────────────────────────────────── */

const MOCK_BATCHES: Batch[] = [
  { id: "BATCH-RA-2024-001", receivingAgentName: "Access Bank PLC", receivingAgentType: "Bank", batchDate: "2024-07-15", status: "OPEN", notes: "" },
  { id: "BATCH-RA-2024-002", receivingAgentName: "First Bank of Nigeria", receivingAgentType: "Bank", batchDate: "2024-07-16", status: "SUBMITTED", notes: "" },
  { id: "BATCH-RA-2024-003", receivingAgentName: "Meristem Stockbrokers Ltd", receivingAgentType: "Stockbroker", batchDate: "2024-07-17", status: "ICU_APPROVED", notes: "", icuNotes: "All checks passed. Verified against agent submission sheet." },
];

const SEED_ACCEPTANCES: AcceptanceRecord[] = [
  { id: "a1", batchId: "BATCH-RA-2024-001", stockbrokerName: "Meristem Stockbrokers Ltd", holderName: "NGOZI CHIDINMA OKAFOR", chn: "C0023456BK", additionalShares: 5000, amountPaid: 92500, disposition: "ACCEPTED", rejectionReason: "", status: "PENDING" },
  { id: "a2", batchId: "BATCH-RA-2024-001", stockbrokerName: "Coronation Securities Ltd", holderName: "AMAKA NGOZI OKONKWO", chn: "C0067890FK", additionalShares: 12000, amountPaid: 222000, disposition: "ACCEPTED", rejectionReason: "", status: "PENDING" },
  { id: "a3", batchId: "BATCH-RA-2024-001", stockbrokerName: "Chapel Hill Denham", holderName: "CHUKWUEMEKA IFEANYI NWOSU", chn: "C0089012GK", additionalShares: 3000, amountPaid: 55500, disposition: "REJECTED", rejectionReason: "Incomplete KYC documentation", status: "PENDING" },
  { id: "a4", batchId: "BATCH-RA-2024-001", stockbrokerName: "CardinalStone Partners", holderName: "ADAEZE OBIORA NNAMDI", chn: "C0112345HK", additionalShares: 8500, amountPaid: 157250, disposition: "ACCEPTED", rejectionReason: "", status: "PENDING" },
];

const BULK_STAGING_SEED: BulkStagingRow[] = [
  { id: "bs1", name: "UCHE OKONKWO JAMES", chn: "C0234567IK", units: 7000, accepted: null },
  { id: "bs2", name: "DAMILOLA ADEKUNLE SEUN", chn: "C0345678JK", units: 3500, accepted: null },
  { id: "bs3", name: "GRACE NWACHUKWU ANAMBRA", chn: "C0456789KK", units: 9000, accepted: null },
];

let _seq = 500;
const nextId = () => String(_seq++);

function computeBatchStats(batchId: string, acceptances: AcceptanceRecord[]) {
  const all = acceptances.filter(r => r.batchId === batchId);
  const accepted = all.filter(r => r.disposition === "ACCEPTED");
  return {
    totalForms: all.length,
    acceptedForms: accepted.length,
    rejectedForms: all.length - accepted.length,
    totalAmount: accepted.reduce((s, r) => s + r.amountPaid, 0),
  };
}

/* ─── eligible agents (from offer setup) ───────────────── */

interface EligibleAgent {
  id: string;
  name: string;
  agentType: AgentType;
}

const MOCK_ELIGIBLE_AGENTS: EligibleAgent[] = [
  { id: "ra1", name: "Meristem Registrars Ltd", agentType: "Receiving Agent" },
  { id: "b1", name: "Access Bank PLC", agentType: "Bank" },
  { id: "b2", name: "GTBank PLC", agentType: "Bank" },
  { id: "b3", name: "Zenith Bank PLC", agentType: "Bank" },
  { id: "b4", name: "First Bank of Nigeria", agentType: "Bank" },
  { id: "b5", name: "UBA PLC", agentType: "Bank" },
  { id: "s1", name: "Meristem Stockbrokers Ltd", agentType: "Stockbroker" },
  { id: "s2", name: "CardinalStone Partners Ltd", agentType: "Stockbroker" },
  { id: "s3", name: "Stanbic IBTC Stockbrokers", agentType: "Stockbroker" },
  { id: "s4", name: "Chapel Hill Denham Securities", agentType: "Stockbroker" },
];

/* ─── create batch dialog ──────────────────────────────── */

const EMPTY_BATCH_FORM = {
  receivingAgentName: "",
  receivingAgentType: "" as "" | AgentType,
  batchDate: "",
  notes: "",
};

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingCount: number;
  eligibleAgents: EligibleAgent[];
  onCreated: (batch: Batch) => void;
}

function CreateBatchDialog({ open, onOpenChange, existingCount, eligibleAgents, onCreated }: CreateBatchDialogProps) {
  const [form, setForm] = useState(EMPTY_BATCH_FORM);
  const [saving, setSaving] = useState(false);

  const setField = (k: keyof typeof EMPTY_BATCH_FORM, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSelectAgent = (agentId: string | null) => {
    if (!agentId) return;
    const agent = eligibleAgents.find(a => a.id === agentId);
    if (!agent) return;

    setForm(p => ({ ...p, receivingAgentName: agent.name, receivingAgentType: agent.agentType }));
  };

  const selectedAgentId = eligibleAgents.find(a => a.name === form.receivingAgentName)?.id ?? "";

  const handleCreate = async () => {
    if (!form.receivingAgentName || !form.receivingAgentType || !form.batchDate) {
      toast.error("Receiving agent and batch date are required.");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    const year = new Date().getFullYear();
    const seq = String(existingCount + 1).padStart(3, "0");
    const batch: Batch = {
      id: `BATCH-RA-${year}-${seq}`,
      receivingAgentName: form.receivingAgentName,
      receivingAgentType: form.receivingAgentType as AgentType,
      batchDate: form.batchDate,
      status: "OPEN",
      notes: form.notes.trim(),
    };
    onCreated(batch);
    setForm(EMPTY_BATCH_FORM);
    onOpenChange(false);
    toast.success(`Batch ${batch.id} created.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Register the receiving agent bringing forms. Individual forms are captured under this batch.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-1 pb-2">
          <div className="space-y-1.5">
            <FieldLabel>Receiving Agent *</FieldLabel>
            <Select value={selectedAgentId} onValueChange={handleSelectAgent}>
              <SelectTrigger className="mrpsl-input w-full">
                <SelectValue placeholder="Select agent from offer setup…" />
              </SelectTrigger>
              <SelectContent>
                {eligibleAgents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <span className="flex items-center gap-2">
                      {agent.name}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${AGENT_TYPE_COLOR[agent.agentType]}`}>
                        {agent.agentType}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.receivingAgentType && (
            <div className="flex items-center gap-2 -mt-1">
              <span className="text-xs text-muted-foreground">Agent type:</span>
              <Badge className={`border-0 text-[11px] ${AGENT_TYPE_COLOR[form.receivingAgentType as AgentType]}`}>
                {form.receivingAgentType}
              </Badge>
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel>Batch Date *</FieldLabel>
            <Input type="date" className="mrpsl-input" value={form.batchDate} onChange={e => setField("batchDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Notes (optional)</FieldLabel>
            <Input className="mrpsl-input" placeholder="Any notes about this batch…" value={form.notes} onChange={e => setField("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Creating…
              </span>
            ) : (
              <><Plus className="h-4 w-4 mr-1.5" />Create Batch</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── batch context chip ───────────────────────────────── */

const AGENT_TYPE_COLOR: Record<AgentType, string> = {
  Bank: "bg-blue-100 text-blue-800",
  Stockbroker: "bg-purple-100 text-purple-800",
  "Receiving Agent": "bg-amber-100 text-amber-800",
};

function BatchContextChip({ batch }: { batch: Batch }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40 border border-border">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Receiving Agent</p>
        <p className="text-sm font-semibold truncate">{batch.receivingAgentName}</p>
      </div>
      <Badge className={`border-0 text-[10px] shrink-0 ${AGENT_TYPE_COLOR[batch.receivingAgentType]}`}>
        {batch.receivingAgentType}
      </Badge>
      <span className="text-xs font-mono text-muted-foreground shrink-0 hidden sm:block">{batch.id}</span>
    </div>
  );
}

/* ─── ICU review dialog ────────────────────────────────── */

const DEFAULT_ICU_CHECKS: IcuCheckItem[] = [
  { id: "c1", label: "Form count matches receiving agent's submission sheet", checked: true },
  { id: "c2", label: "Total subscription amount reconciled with agent's records", checked: true },
  { id: "c3", label: "Receiving agent identity and accreditation verified", checked: true },
  { id: "c4", label: "All CHN numbers present and in valid format", checked: true },
  { id: "c5", label: "Batch date falls within the offer subscription period", checked: true },
  { id: "c6", label: "No duplicate CHN entries detected within this batch", checked: true },
];

interface IcuReviewDialogProps {
  batch: Batch | null;
  acceptances: AcceptanceRecord[];
  onApprove: (batchId: string, notes: string) => void;
  onReject: (batchId: string, reason: string) => void;
  onOpenChange: (v: boolean) => void;
}

function IcuReviewDialog({ batch, acceptances, onApprove, onReject, onOpenChange }: IcuReviewDialogProps) {
  const [checks, setChecks] = useState<IcuCheckItem[]>(DEFAULT_ICU_CHECKS.map(c => ({ ...c })));
  const [notes, setNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!batch) return null;

  const batchAcceptances = acceptances.filter(r => r.batchId === batch.id);
  const acceptedEntries = batchAcceptances.filter(r => r.disposition === "ACCEPTED");
  const rejectedEntries = batchAcceptances.filter(r => r.disposition === "REJECTED");
  const totalForms = batchAcceptances.length;
  const totalAmount = acceptedEntries.reduce((s, r) => s + r.amountPaid, 0);
  const allChecked = checks.every(c => c.checked);

  const toggleCheck = (id: string) =>
    setChecks(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));

  const handleApprove = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 700));
    setProcessing(false);
    onApprove(batch.id, notes);
    onOpenChange(false);
    toast.success(`Batch ${batch.id} ICU approved.`);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please state a rejection reason.");
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 700));
    setProcessing(false);
    onReject(batch.id, rejectionReason);
    onOpenChange(false);
    toast.error(`Batch ${batch.id} rejected by ICU.`);
  };

  return (
    <Dialog open={!!batch} onOpenChange={v => { if (!v) onOpenChange(false); }}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>ICU Batch Review</DialogTitle>
          <DialogDescription>
            Checks and balances for <span className="font-mono font-semibold">{batch.id}</span> — {batch.receivingAgentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-1">
          {/* Summary strip */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Receiving Agent</span>
              <span className="font-semibold">{batch.receivingAgentName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Agent Type</span>
              <Badge className={`border-0 text-[10px] ${AGENT_TYPE_COLOR[batch.receivingAgentType]}`}>{batch.receivingAgentType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Batch Date</span>
              <span>{batch.batchDate}</span>
            </div>
            <div className="border-t border-border pt-2 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Total Forms", value: totalForms, color: "" },
                { label: "Accepted", value: acceptedEntries.length, color: "text-green-700" },
                { label: "Rejected", value: rejectedEntries.length, color: rejectedEntries.length > 0 ? "text-red-600" : "text-muted-foreground" },
              ].map(s => (
                <div key={s.label}>
                  <p className={`text-xl font-bold font-mono tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Amount</span>
              <span className="font-mono font-bold">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ICU Checks</p>
            <div className="space-y-0.5">
              {checks.map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(item.id)}
                    className="h-4 w-4 rounded accent-primary shrink-0"
                  />
                  <span className={`text-sm flex-1 ${item.checked ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                  {item.checked
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  }
                </label>
              ))}
            </div>
            {!allChecked && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                Unresolved checks will be logged with this review.
              </p>
            )}
          </div>

          {/* Rejected entries */}
          {rejectedEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Rejected Entries ({rejectedEntries.length})
              </p>
              <div className="rounded-lg border border-red-200 bg-red-50/40 overflow-hidden">
                {rejectedEntries.map((r, i) => (
                  <div key={r.id} className={`px-3 py-2.5 ${i < rejectedEntries.length - 1 ? "border-b border-red-100" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{r.holderName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{r.chn}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800 border-0 text-[10px] shrink-0">REJECTED</Badge>
                    </div>
                    {r.rejectionReason && (
                      <p className="text-xs text-red-700 mt-1">{r.rejectionReason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer notes */}
          <div className="space-y-1.5">
            <FieldLabel>Reviewer Notes</FieldLabel>
            <textarea
              rows={2}
              className="mrpsl-input w-full resize-none text-sm px-3 py-2 rounded-lg"
              placeholder="Optional notes from ICU reviewer…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Rejection reason */}
          {rejecting && (
            <div className="space-y-1.5 p-3 rounded-lg border border-red-200 bg-red-50">
              <FieldLabel>Rejection Reason *</FieldLabel>
              <textarea
                rows={3}
                autoFocus
                className="w-full resize-none text-sm px-3 py-2 rounded-lg border border-red-200 bg-white"
                placeholder="State clearly why this batch is being rejected…"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-5 pt-2">
          {rejecting ? (
            <div className="flex w-full gap-3">
              <Button variant="outline" onClick={() => setRejecting(false)} className="flex-1 h-11 rounded-xl">Back</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing} className="flex-1 h-11 rounded-xl">
                {processing
                  ? <span className="h-3.5 w-3.5 rounded-full border-2 border-destructive-foreground border-t-transparent animate-spin" />
                  : "Confirm Reject"
                }
              </Button>
            </div>
          ) : (
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1 h-11 rounded-xl border text-red-700 border-red-300 hover:bg-red-50" onClick={() => setRejecting(true)}>
                Reject Batch
              </Button>
              <Button onClick={handleApprove} disabled={processing} className="flex-1 h-11 rounded-xl">
                {processing
                  ? <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  : "Approve Batch"
                }
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── bulk upload panel (reused across sub-tabs) ─────────── */

function BulkUploadPanel({ batch }: { batch: Batch }) {
  const [bulkStaging, setBulkStaging] = useState<BulkStagingRow[]>([]);
  const [bulkLoaded, setBulkLoaded] = useState(false);

  const handleLoad = () => {
    setBulkStaging(BULK_STAGING_SEED.map(r => ({ ...r, accepted: null })));
    setBulkLoaded(true);
    toast.success("3 records loaded from file.");
  };

  return (
    <Card className="mrpsl-card p-5 space-y-4">
      <BatchContextChip batch={batch} />
      <div
        className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => toast.info("File picker not wired in mock.")}
      >
        <Upload className="h-8 w-8 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">Drop CSV / Excel file here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        </div>
        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); toast.info("Template downloaded."); }}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Download CSV Template
        </Button>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleLoad}><Upload className="h-4 w-4 mr-1.5" />Load File</Button>
      </div>
      {bulkLoaded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                <th className="text-center px-4 py-2.5 font-medium">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {bulkStaging.map(row => (
                <tr key={row.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium">{row.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{row.chn}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{row.units.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    {row.accepted === null ? (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => setBulkStaging(p => p.map(r => r.id === row.id ? { ...r, accepted: true } : r))}>Accept</Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => setBulkStaging(p => p.map(r => r.id === row.id ? { ...r, accepted: false } : r))}>Reject</Button>
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
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-TAB 1: FULL ACCEPTANCE
   ═══════════════════════════════════════════════════════ */

const EMPTY_ACCEPTANCE = {
  stockbrokerName: "",
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
  disposition: "ACCEPTED" as EntryDisposition,
  rejectionReason: "",
};

interface FullAcceptanceTabProps {
  batch: Batch;
  records: AcceptanceRecord[];
  onAdd: (r: AcceptanceRecord) => void;
  onUpdate: (id: string, disposition: EntryDisposition, rejectionReason: string) => void;
}

function FullAcceptanceTab({ batch, records, onAdd, onUpdate }: FullAcceptanceTabProps) {
  const [mode, setMode] = useState<EntryMode>("single");
  const [form, setForm] = useState(EMPTY_ACCEPTANCE);
  const batchRecords = records.filter(r => r.batchId === batch.id);

  const setField = (k: keyof typeof EMPTY_ACCEPTANCE, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.holderName.trim() || !form.chn.trim()) {
      toast.error("Holder name and CHN are required.");
      return;
    }
    if (form.disposition === "REJECTED" && !form.rejectionReason) {
      toast.error("Select a rejection reason.");
      return;
    }
    onAdd({
      id: nextId(),
      batchId: batch.id,
      stockbrokerName: form.stockbrokerName.trim() || "—",
      holderName: form.holderName.toUpperCase().trim(),
      chn: form.chn.trim(),
      additionalShares: Number(form.additionalSharesApplied) || 0,
      amountPaid: Number(form.totalAmountPaid) || 0,
      disposition: form.disposition,
      rejectionReason: form.rejectionReason,
      status: "PENDING",
    });
    setForm(EMPTY_ACCEPTANCE);
    toast.success(
      form.disposition === "REJECTED"
        ? "Form captured as REJECTED under batch."
        : "Acceptance form captured under batch."
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(["single", "bulk"] as EntryMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {m === "single" ? <ClipboardList className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {m === "single" ? "Single Entry" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <Card className="mrpsl-card p-5 space-y-6">
          <BatchContextChip batch={batch} />

          <div className="space-y-3">
            <SectionHeading>Submission Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 space-y-1.5">
                <FieldLabel>Stockbroker (Shareholder's Broker)</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. Meristem Stockbrokers Ltd" value={form.stockbrokerName} onChange={e => setField("stockbrokerName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CHN Number *</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. C0023456BK" value={form.chn} onChange={e => setField("chn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>CSCS Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. CSCS-000234561" value={form.cscsNumber} onChange={e => setField("cscsNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Registrar Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. REG-00123456" value={form.registrarAccountNo} onChange={e => setField("registrarAccountNo", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-3">
            <SectionHeading>Full Acceptance / Additional Shares</SectionHeading>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Additional Shares Applied For</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0" value={form.additionalSharesApplied} onChange={e => setField("additionalSharesApplied", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Additional Amount Paid (₦)</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="0.00" value={form.additionalAmountPaid} onChange={e => setField("additionalAmountPaid", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Total Amount Paid (₦)</FieldLabel>
                <Input type="number" min="0" className="mrpsl-input" placeholder="Rights + additional" value={form.totalAmountPaid} onChange={e => setField("totalAmountPaid", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-3">
            <SectionHeading>Holder Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Full Name *</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. NGOZI CHIDINMA OKAFOR" value={form.holderName} onChange={e => setField("holderName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Next of Kin</FieldLabel>
                <Input className="mrpsl-input" placeholder="Full name" value={form.nextOfKin} onChange={e => setField("nextOfKin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Phone Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. 08023456789" value={form.phone} onChange={e => setField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email Address</FieldLabel>
                <Input type="email" className="mrpsl-input" placeholder="e.g. name@email.com" value={form.email} onChange={e => setField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Date of Birth</FieldLabel>
                <Input type="date" className="mrpsl-input" value={form.dateOfBirth} onChange={e => setField("dateOfBirth", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-3">
            <SectionHeading>Bank Details</SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Bank Name</FieldLabel>
                <Input className="mrpsl-input" placeholder="e.g. First Bank of Nigeria" value={form.bankName} onChange={e => setField("bankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Account Number</FieldLabel>
                <Input className="mrpsl-input" placeholder="10-digit account number" value={form.accountNumber} onChange={e => setField("accountNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>BVN</FieldLabel>
                <Input className="mrpsl-input" placeholder="11-digit BVN" value={form.bvn} onChange={e => setField("bvn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>TIN</FieldLabel>
                <Input className="mrpsl-input" placeholder="Tax identification number" value={form.tin} onChange={e => setField("tin", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-3">
            <SectionHeading>Form Disposition</SectionHeading>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, disposition: "ACCEPTED", rejectionReason: "" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.disposition === "ACCEPTED" ? "bg-green-100 text-green-800 border-green-300" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
              >
                <CheckCircle2 className="h-4 w-4" />Accept
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, disposition: "REJECTED" }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.disposition === "REJECTED" ? "bg-red-100 text-red-800 border-red-300" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
              >
                <XCircle className="h-4 w-4" />Reject
              </button>
            </div>
            {form.disposition === "REJECTED" && (
              <div className="space-y-1.5">
                <FieldLabel>Rejection Reason (SEC Regulation) *</FieldLabel>
                <Select value={form.rejectionReason} onValueChange={v => { if (v) setField("rejectionReason", v); }}>
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="Select SEC regulation reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEC_REJECTION_REASONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSubmit}
              variant={form.disposition === "REJECTED" ? "destructive" : "default"}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {form.disposition === "REJECTED" ? "Capture as Rejected" : "Capture Form"}
            </Button>
          </div>
        </Card>
      )}

      {mode === "bulk" && <BulkUploadPanel batch={batch} />}

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Captured Forms — {batch.id}</p>
          <Badge className="bg-muted text-muted-foreground border-0 text-[11px]">{batchRecords.length} total</Badge>
          {batchRecords.filter(r => r.disposition === "ACCEPTED").length > 0 && (
            <Badge className="bg-green-100 text-green-800 border-0 text-[11px]">{batchRecords.filter(r => r.disposition === "ACCEPTED").length} accepted</Badge>
          )}
          {batchRecords.filter(r => r.disposition === "REJECTED").length > 0 && (
            <Badge className="bg-red-100 text-red-800 border-0 text-[11px]">{batchRecords.filter(r => r.disposition === "REJECTED").length} rejected</Badge>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">HOLDER / CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">STOCKBROKER</th>
                <th className="text-right px-4 py-2.5 font-medium">ADD. SHARES</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">DISPOSITION / REASON</th>
              </tr>
            </thead>
            <tbody>
              {batchRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No forms captured yet.</td></tr>
              ) : batchRecords.map(r => (
                <tr key={r.id} className={`mrpsl-table-row align-top ${r.disposition === "REJECTED" ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{r.holderName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.chn}</p>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.stockbrokerName}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.additionalShares.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {r.disposition === "ACCEPTED" ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 border-0 text-[11px]">Accepted</Badge>
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => onUpdate(r.id, "REJECTED", "")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800 border-0 text-[11px]">Rejected</Badge>
                          <button
                            className="text-xs text-green-700 hover:underline"
                            onClick={() => onUpdate(r.id, "ACCEPTED", "")}
                          >
                            Restore
                          </button>
                        </div>
                        <Select
                          value={r.rejectionReason || ""}
                          onValueChange={v => { if (v) onUpdate(r.id, "REJECTED", v); }}
                        >
                          <SelectTrigger className="h-7 text-xs px-2 w-full max-w-xs">
                            <SelectValue placeholder="Set rejection reason…" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEC_REJECTION_REASONS.map(reason => (
                              <SelectItem key={reason} value={reason} className="text-xs">{reason}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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
   BATCH WORKSPACE
   ═══════════════════════════════════════════════════════ */

const STATUS_COLOR: Record<BatchStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  SUBMITTED: "bg-amber-100 text-amber-800",
  ICU_APPROVED: "bg-green-100 text-green-800",
  ICU_REJECTED: "bg-red-100 text-red-800",
};

interface BatchWorkspaceProps {
  batch: Batch;
  onBack: () => void;
  onStatusChange: (batchId: string, status: BatchStatus) => void;
  acceptances: AcceptanceRecord[];
  onAddAcceptance: (r: AcceptanceRecord) => void;
  onUpdateAcceptance: (id: string, disposition: EntryDisposition, rejectionReason: string) => void;
}

function BatchWorkspace({
  batch, onBack, onStatusChange,
  acceptances, onAddAcceptance, onUpdateAcceptance,
}: BatchWorkspaceProps) {
  const [submitting, setSubmitting] = useState(false);

  const totalForms = acceptances.filter(r => r.batchId === batch.id).length;

  const handleSubmitBatch = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    onStatusChange(batch.id, "SUBMITTED");
    toast.success(`Batch ${batch.id} submitted (${totalForms} forms).`);
  };

  return (
    <div className="space-y-4">
      {/* Workspace header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />Batches
        </Button>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-mono font-bold">{batch.id}</span>
            <Badge className={`border-0 text-[11px] ${STATUS_COLOR[batch.status]}`}>{batch.status}</Badge>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground hidden sm:inline">{batch.receivingAgentName}</span>
            <Badge className={`border-0 text-[10px] hidden sm:inline-flex ${AGENT_TYPE_COLOR[batch.receivingAgentType]}`}>{batch.receivingAgentType}</Badge>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground hidden sm:inline">{batch.batchDate}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{totalForms} form{totalForms !== 1 ? "s" : ""}</span>
          </div>
          {batch.notes && <p className="text-xs text-muted-foreground mt-0.5">{batch.notes}</p>}
        </div>
        {batch.status === "OPEN" && (
          <Button size="sm" variant="outline" onClick={handleSubmitBatch} disabled={submitting} className="shrink-0">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Submitting…
              </span>
            ) : "Submit Batch"}
          </Button>
        )}
        {batch.status === "SUBMITTED" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 shrink-0">
            <ShieldAlert className="h-3.5 w-3.5" />Awaiting ICU Review
          </div>
        )}
        {batch.status === "ICU_APPROVED" && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />ICU Approved
          </div>
        )}
        {batch.status === "ICU_REJECTED" && (
          <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50 shrink-0" onClick={handleSubmitBatch} disabled={submitting}>
            <ShieldX className="h-3.5 w-3.5 mr-1.5" />Resubmit for ICU
          </Button>
        )}
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="acceptance" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl gap-0.5">
          <TabsTrigger value="acceptance" className="rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap">Full Acceptance</TabsTrigger>
        </TabsList>
        <div className="mt-5">
          <TabsContent value="acceptance">
            <FullAcceptanceTab batch={batch} records={acceptances} onAdd={onAddAcceptance} onUpdate={onUpdateAcceptance} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BATCH LIST VIEW
   ═══════════════════════════════════════════════════════ */

interface BatchListViewProps {
  batches: Batch[];
  acceptances: AcceptanceRecord[];
  overallStatus: OverallApprovalStatus;
  onSelectBatch: (b: Batch) => void;
  onIcuReview: (b: Batch) => void;
  onNewBatch: () => void;
  onOverallApproval: () => void;
}

function BatchListView({ batches, acceptances, overallStatus, onSelectBatch, onIcuReview, onNewBatch, onOverallApproval }: BatchListViewProps) {
  const [search, setSearch] = useState("");

  const filtered = batches.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.receivingAgentName.toLowerCase().includes(search.toLowerCase())
  );

  const submittedCount = batches.filter(b => b.status === "SUBMITTED").length;
  const icuApprovedCount = batches.filter(b => b.status === "ICU_APPROVED").length;
  const openCount = batches.filter(b => b.status === "OPEN").length;
  const allApproved = batches.length > 0 && batches.every(b => b.status === "ICU_APPROVED");

  return (
    <div className="space-y-4">
      {/* Stage 2 overall approval banner */}
      {(icuApprovedCount > 0 || overallStatus !== "PENDING") && (
        <Card className={`mrpsl-card p-4 flex items-center gap-4 ${overallStatus === "APPROVED" ? "border-green-200 bg-green-50/40" : overallStatus === "REJECTED" ? "border-red-200 bg-red-50/40" : "border-amber-200 bg-amber-50/40"}`}>
          <div className="shrink-0">
            {overallStatus === "APPROVED"
              ? <ShieldCheck className="h-8 w-8 text-green-600" />
              : overallStatus === "REJECTED"
              ? <ShieldX className="h-8 w-8 text-red-500" />
              : <ShieldAlert className="h-8 w-8 text-amber-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {overallStatus === "APPROVED"
                ? "Overall Returns Approved"
                : overallStatus === "REJECTED"
                ? "Overall Returns Rejected"
                : allApproved
                ? "All batches ICU approved — ready for overall approval"
                : `${icuApprovedCount} of ${batches.length} batches ICU approved${submittedCount > 0 ? `, ${submittedCount} pending ICU review` : ""}${openCount > 0 ? `, ${openCount} still open` : ""}`
              }
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Stage 2: Overall approval after all batches are ICU approved.</p>
          </div>
          {overallStatus === "PENDING" && (
            <Button
              size="xl"
              onClick={onOverallApproval}
              disabled={!allApproved}
              variant={allApproved ? "default" : "outline"}
              className="shrink-0 px-5"
            >
              Overall Approval
            </Button>
          )}
          {overallStatus !== "PENDING" && (
            <Button size="sm" variant="outline" onClick={onOverallApproval} className="shrink-0">
              View Details
            </Button>
          )}
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by batch ID or agent name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
        <div className="flex-1" />
        <Button onClick={onNewBatch}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Batch
        </Button>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Return Batches</p>
          <Badge className="bg-muted text-muted-foreground border-0 text-[11px]">{batches.length} batches</Badge>
          {submittedCount > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">{submittedCount} pending ICU</Badge>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">BATCH ID</th>
                <th className="text-left px-4 py-2.5 font-medium">RECEIVING AGENT</th>
                <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                <th className="text-left px-4 py-2.5 font-medium">DATE</th>
                <th className="text-right px-4 py-2.5 font-medium">FORMS</th>
                <th className="text-right px-4 py-2.5 font-medium">TOTAL (₦)</th>
                <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
                <th className="text-center px-4 py-2.5 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {search ? "No batches match your search." : "No batches yet. Create the first one."}
                  </td>
                </tr>
              ) : filtered.map(batch => {
                const stats = computeBatchStats(batch.id, acceptances);
                return (
                  <tr
                    key={batch.id}
                    className="mrpsl-table-row cursor-pointer"
                    onClick={() => onSelectBatch(batch)}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{batch.id}</td>
                    <td className="px-4 py-2.5 font-medium">{batch.receivingAgentName}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`border-0 text-[10px] ${AGENT_TYPE_COLOR[batch.receivingAgentType]}`}>{batch.receivingAgentType}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{batch.batchDate}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{stats.totalForms}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{stats.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={`border-0 text-[11px] ${STATUS_COLOR[batch.status]}`}>{batch.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {batch.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={e => { e.stopPropagation(); onIcuReview(batch); }}
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />ICU Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={e => { e.stopPropagation(); onSelectBatch(batch); }}
                        >
                          Open <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OVERALL APPROVAL PANEL
   ═══════════════════════════════════════════════════════ */

interface OverallApprovalPanelProps {
  batches: Batch[];
  acceptances: AcceptanceRecord[];
  overallStatus: OverallApprovalStatus;
  onBack: () => void;
  onApprove: (notes: string) => void;
  onReject: (reason: string) => void;
}

function OverallApprovalPanel({ batches, acceptances, overallStatus, onBack, onApprove, onReject }: OverallApprovalPanelProps) {
  const [notes, setNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const allStats = batches.map(b => ({
    batch: b,
    ...computeBatchStats(b.id, acceptances),
  }));
  const grandForms = allStats.reduce((s, r) => s + r.totalForms, 0);
  const grandAmount = allStats.reduce((s, r) => s + r.totalAmount, 0);
  const allApproved = batches.every(b => b.status === "ICU_APPROVED");

  const handleApprove = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    setProcessing(false);
    onApprove(notes);
    toast.success("Returns overall approval granted.");
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please state a rejection reason.");
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    setProcessing(false);
    onReject(rejectionReason);
    toast.error("Returns overall approval rejected.");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />Batches
        </Button>
        <div className="flex-1 pt-0.5">
          <p className="font-bold text-base">Overall Returns Approval</p>
          <p className="text-xs text-muted-foreground mt-0.5">Stage 2 — Final approval after all batches have been ICU reviewed</p>
        </div>
        {overallStatus !== "PENDING" && (
          <Badge className={`shrink-0 border-0 ${overallStatus === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {overallStatus}
          </Badge>
        )}
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Batches", value: batches.length, mono: false },
          { label: "Total Forms", value: grandForms.toLocaleString(), mono: true },
          { label: "Total Amount (₦)", value: grandAmount.toLocaleString(), mono: true },
        ].map(s => (
          <Card key={s.label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{s.label}</p>
            <p className={`font-semibold text-lg mt-1 ${s.mono ? "font-mono" : ""}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Batch summary table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Batch Summary</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">BATCH ID</th>
                <th className="text-left px-4 py-2.5 font-medium">RECEIVING AGENT</th>
                <th className="text-right px-4 py-2.5 font-medium">FORMS</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT (₦)</th>
                <th className="text-center px-4 py-2.5 font-medium">ICU STATUS</th>
                <th className="text-left px-4 py-2.5 font-medium">ICU NOTES</th>
              </tr>
            </thead>
            <tbody>
              {allStats.map(({ batch, totalForms, totalAmount }) => (
                <tr key={batch.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold">{batch.id}</td>
                  <td className="px-4 py-2.5 font-medium">{batch.receivingAgentName}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{totalForms}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className={`border-0 text-[11px] ${STATUS_COLOR[batch.status]}`}>{batch.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground italic">{batch.icuNotes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!allApproved && overallStatus === "PENDING" && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          All batches must be ICU approved before overall approval can be granted.
        </div>
      )}

      {overallStatus === "PENDING" && (
        <Card className="mrpsl-card p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Approval Decision</p>

          <div className="space-y-1.5">
            <FieldLabel>Approval Notes</FieldLabel>
            <textarea
              rows={3}
              className="mrpsl-input w-full resize-none text-sm px-3 py-2 rounded-lg"
              placeholder="Notes or conditions attached to this overall approval…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {rejecting && (
            <div className="space-y-1.5 p-3 rounded-lg border border-red-200 bg-red-50">
              <FieldLabel>Rejection Reason *</FieldLabel>
              <textarea
                rows={3}
                autoFocus
                className="w-full resize-none text-sm px-3 py-2 rounded-lg border border-red-200 bg-white"
                placeholder="State clearly why these returns are being rejected…"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {rejecting ? (
              <>
                <Button variant="outline" onClick={() => setRejecting(false)}>Back</Button>
                <Button variant="destructive" onClick={handleReject} disabled={processing}>
                  {processing
                    ? <span className="h-3.5 w-3.5 rounded-full border-2 border-destructive-foreground border-t-transparent animate-spin" />
                    : <><ShieldX className="h-4 w-4 mr-1.5" />Confirm Rejection</>
                  }
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => setRejecting(true)}>
                  <ShieldX className="h-4 w-4 mr-1.5" />Reject Returns
                </Button>
                <Button onClick={handleApprove} disabled={processing || !allApproved}>
                  {processing
                    ? <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    : <><ShieldCheck className="h-4 w-4 mr-1.5" />Approve Returns</>
                  }
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {overallStatus !== "PENDING" && (
        <Card className={`mrpsl-card p-4 ${overallStatus === "APPROVED" ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
          <div className="flex items-center gap-3">
            {overallStatus === "APPROVED"
              ? <ShieldCheck className="h-6 w-6 text-green-600" />
              : <ShieldX className="h-6 w-6 text-red-500" />
            }
            <div>
              <p className="font-semibold text-sm">
                {overallStatus === "APPROVED" ? "Returns Approved" : "Returns Rejected"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">This decision has been recorded.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════ */

export function ReturnsCapture() {
  const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES);
  const [acceptances, setAcceptances] = useState<AcceptanceRecord[]>(SEED_ACCEPTANCES);

  const handleUpdateAcceptance = (id: string, disposition: EntryDisposition, rejectionReason: string) => {
    setAcceptances(prev => prev.map(r => r.id === id ? { ...r, disposition, rejectionReason } : r));
  };
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [icuReviewBatch, setIcuReviewBatch] = useState<Batch | null>(null);
  const [showOverallApproval, setShowOverallApproval] = useState(false);
  const [overallStatus, setOverallStatus] = useState<OverallApprovalStatus>("PENDING");

  const handleBatchCreated = (batch: Batch) => {
    setBatches(prev => [batch, ...prev]);
    setSelectedBatch(batch);
  };

  const handleStatusChange = (batchId: string, status: BatchStatus) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status } : b));
    if (selectedBatch?.id === batchId) {
      setSelectedBatch(prev => prev ? { ...prev, status } : prev);
    }
  };

  const handleIcuApprove = (batchId: string, notes: string) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "ICU_APPROVED", icuNotes: notes || undefined } : b));
    setIcuReviewBatch(null);
  };

  const handleIcuReject = (batchId: string, reason: string) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "ICU_REJECTED", icuNotes: reason } : b));
    setIcuReviewBatch(null);
  };

  const currentView = showOverallApproval ? "overall" : selectedBatch ? "workspace" : "list";

  return (
    <div className="space-y-5">
      <CreateBatchDialog
        open={showCreateBatch}
        onOpenChange={setShowCreateBatch}
        existingCount={batches.length}
        eligibleAgents={MOCK_ELIGIBLE_AGENTS}
        onCreated={handleBatchCreated}
      />

      <IcuReviewDialog
        key={icuReviewBatch?.id ?? "none"}
        batch={icuReviewBatch}
        acceptances={acceptances}
        onApprove={handleIcuApprove}
        onReject={handleIcuReject}
        onOpenChange={v => { if (!v) setIcuReviewBatch(null); }}
      />

      {currentView === "overall" && (
        <OverallApprovalPanel
          batches={batches}
          acceptances={acceptances}
          overallStatus={overallStatus}
          onBack={() => setShowOverallApproval(false)}
          onApprove={notes => { setOverallStatus("APPROVED"); setShowOverallApproval(false); }}
          onReject={reason => { setOverallStatus("REJECTED"); setShowOverallApproval(false); }}
        />
      )}

      {currentView === "workspace" && selectedBatch && (
        <BatchWorkspace
          batch={selectedBatch}
          onBack={() => setSelectedBatch(null)}
          onStatusChange={handleStatusChange}
          acceptances={acceptances}
          onAddAcceptance={r => setAcceptances(prev => [r, ...prev])}
          onUpdateAcceptance={handleUpdateAcceptance}
        />
      )}

      {currentView === "list" && (
        <BatchListView
          batches={batches}
          acceptances={acceptances}
          overallStatus={overallStatus}
          onSelectBatch={b => { setSelectedBatch(b); setShowOverallApproval(false); }}
          onIcuReview={setIcuReviewBatch}
          onNewBatch={() => setShowCreateBatch(true)}
          onOverallApproval={() => setShowOverallApproval(true)}
        />
      )}
    </div>
  );
}
