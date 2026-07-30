"use client";

import { useState } from "react";
import { ArrowLeft, Download, FileUp, Loader2, Plus, Send, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DateInput from "@/components/ui/date-input";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useListRightsReturnBatches,
  useCreateRightsReturnBatch,
  useListRightsBatchRecords,
  useSubmitRightsReturn,
  useBulkUploadRightsReturns,
} from "@/hooks/useRights";
import { downloadRightsReturnsTemplate } from "@/actions/rightsActions";
import type { RightsReturnBatch } from "@/actions/rightsActions";

const AGENT_TYPES = ["Stockbroker", "Bank", "Receiving Agent"];
const TX_TYPES = [
  { value: "FULL_ACCEPTANCE", label: "Full Acceptance / Additional" },
  { value: "RENUNCIATION", label: "Renunciation" },
  { value: "TRADING", label: "Traded Rights" },
];

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

export function ReturnsCapture({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const [selectedBatch, setSelectedBatch] = useState<RightsReturnBatch | null>(null);

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to capture returns.
      </Card>
    );
  }

  return selectedBatch ? (
    <BatchWorkspace
      declarationId={declarationId}
      batch={selectedBatch}
      onBack={() => setSelectedBatch(null)}
    />
  ) : (
    <BatchList
      declarationId={declarationId}
      onOpen={setSelectedBatch}
      createdBy={currentUser?.email ?? ""}
    />
  );
}

/* ── Batch list + create ─────────────────────────────────────────────────── */

function BatchList({
  declarationId,
  onOpen,
  createdBy,
}: {
  declarationId: string;
  onOpen: (b: RightsReturnBatch) => void;
  createdBy: string;
}) {
  const { data: batches, isLoading } = useListRightsReturnBatches(declarationId);
  const create = useCreateRightsReturnBatch();
  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("Stockbroker");
  const [batchDate, setBatchDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  function handleCreate() {
    if (!agentName.trim()) {
      toast.error("Receiving agent is required.");
      return;
    }
    const iso = `${batchDate.getFullYear()}-${String(batchDate.getMonth() + 1).padStart(2, "0")}-${String(batchDate.getDate()).padStart(2, "0")}`;
    create.mutate(
      { id: declarationId, data: { receivingAgentName: agentName, receivingAgentType: agentType, batchDate: iso, notes, createdBy } },
      {
        onSuccess: () => {
          toast.success("Returns batch created.");
          setOpen(false);
          setAgentName(""); setNotes("");
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Returns Batches</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">Capture acceptances, renunciations and traded rights in batches by receiving agent.</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Batch
        </Button>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">BATCH</th>
                <th className="text-left px-4 py-2.5 font-medium">RECEIVING AGENT</th>
                <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                <th className="text-left px-4 py-2.5 font-medium">DATE</th>
                <th className="text-right px-4 py-2.5 font-medium">RETURNS</th>
                <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : (batches ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No batches yet. Create one to start capturing returns.</td></tr>
              ) : (
                (batches ?? []).map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => onOpen(b)}>
                    <td className="px-4 py-2.5 font-mono text-xs">{b.batchReference}</td>
                    <td className="px-4 py-2.5">{b.receivingAgentName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{b.receivingAgentType ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(b.batchDate)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{b.returnCount}</td>
                    <td className="px-4 py-2.5"><Badge className="border-0 text-[11px] bg-gray-100 text-gray-700">{b.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Returns Batch</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Receiving Agent *</label>
              <Input className="mrpsl-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Agent / firm name" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Agent Type</label>
              <Select value={agentType} onValueChange={(v) => setAgentType(v ?? "Stockbroker")}>
                <SelectTrigger className="mrpsl-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-56">
              <DateInput date={batchDate} setDate={setBatchDate} label="Batch Date" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Notes</label>
              <Textarea className="mrpsl-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={create.isPending} className="gap-2">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Batch workspace: single + bulk capture ──────────────────────────────── */

const EMPTY = {
  agentName: "", chn: "", cscsNumber: "", registrarAccountNo: "",
  additionalSharesApplied: "", additionalAmountPaid: "", totalAmountPaid: "",
  holderName: "", nextOfKin: "", phone: "", email: "", dateOfBirth: "",
  bankName: "", accountNumber: "", bvn: "", tin: "",
};

function BatchWorkspace({
  declarationId,
  batch,
  onBack,
}: {
  declarationId: string;
  batch: RightsReturnBatch;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [txType, setTxType] = useState("FULL_ACCEPTANCE");
  const [form, setForm] = useState({ ...EMPTY, agentName: batch.receivingAgentName ?? "" });
  const [file, setFile] = useState<File | null>(null);

  const submit = useSubmitRightsReturn();
  const bulk = useBulkUploadRightsReturns();
  const { data: records, isLoading, refetch } = useListRightsBatchRecords(declarationId, batch.id);

  const rows = records?.data?.content ?? [];

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmitSingle() {
    if (!form.chn.trim() || !form.holderName.trim()) {
      toast.error("CHN and Full Name are required.");
      return;
    }
    submit.mutate(
      {
        id: declarationId,
        data: {
          txType, batchId: batch.id, agentType: batch.receivingAgentType,
          agentName: form.agentName || batch.receivingAgentName,
          chn: form.chn, cscsNumber: form.cscsNumber, registrarAccountNo: form.registrarAccountNo,
          holderName: form.holderName, nextOfKin: form.nextOfKin, phone: form.phone,
          email: form.email, dateOfBirth: form.dateOfBirth || null,
          bankName: form.bankName, accountNumber: form.accountNumber, bvn: form.bvn, tin: form.tin,
          additionalSharesApplied: form.additionalSharesApplied ? Number(form.additionalSharesApplied) : null,
          additionalAmountPaid: form.additionalAmountPaid ? Number(form.additionalAmountPaid) : null,
          totalAmountPaid: form.totalAmountPaid ? Number(form.totalAmountPaid) : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Return captured.");
          setForm({ ...EMPTY, agentName: batch.receivingAgentName ?? "" });
          refetch();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  async function handleTemplate() {
    try {
      const blob = await downloadRightsReturnsTemplate(declarationId, txType);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rights_returns_${txType.toLowerCase()}_template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || "Failed to download template.");
    }
  }

  function handleBulk() {
    if (!file) { toast.error("Choose a CSV file first."); return; }
    bulk.mutate(
      { id: declarationId, txType, file, batchId: batch.id },
      {
        onSuccess: (res) => {
          const n = res?.data?.length ?? 0;
          toast.success(`${n} return(s) uploaded to ${batch.batchReference}.`);
          setFile(null);
          refetch();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  const field = (k: keyof typeof EMPTY, label: string, type = "text") => (
    <div className="space-y-1.5">
      <label className="mrpsl-label">{label}</label>
      <Input className="mrpsl-input" type={type} value={form[k]} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Batches
        </Button>
        <span className="font-mono text-sm font-semibold">{batch.batchReference}</span>
        <span className="text-sm text-muted-foreground">{batch.receivingAgentName} · {fmtDate(batch.batchDate)}</span>
        <div className="flex-1" />
        <Select value={txType} onValueChange={(v) => setTxType(v ?? "FULL_ACCEPTANCE")}>
          <SelectTrigger className="mrpsl-input h-9 w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{TX_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button variant={mode === "single" ? "default" : "outline"} size="sm" onClick={() => setMode("single")}>Single Entry</Button>
        <Button variant={mode === "bulk" ? "default" : "outline"} size="sm" onClick={() => setMode("bulk")}>Bulk Upload</Button>
      </div>

      {mode === "single" ? (
        <Card className="mrpsl-card p-5 space-y-5">
          <div>
            <p className="mrpsl-section-title mb-2">Submission</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {field("agentName", "Stockbroker / Agent")}
              {field("chn", "CHN Number *")}
              {field("cscsNumber", "CSCS Number")}
              {field("registrarAccountNo", "Registrar Account No")}
            </div>
          </div>
          {txType === "FULL_ACCEPTANCE" && (
            <div>
              <p className="mrpsl-section-title mb-2">Additional Shares</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {field("additionalSharesApplied", "Additional Shares Applied", "number")}
                {field("additionalAmountPaid", "Additional Amount Paid (₦)", "number")}
                {field("totalAmountPaid", "Total Amount Paid (₦)", "number")}
              </div>
            </div>
          )}
          <div>
            <p className="mrpsl-section-title mb-2">Holder</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {field("holderName", "Full Name *")}
              {field("nextOfKin", "Next of Kin")}
              {field("phone", "Phone Number")}
              {field("email", "Email Address", "email")}
              {field("dateOfBirth", "Date of Birth", "date")}
            </div>
          </div>
          <div>
            <p className="mrpsl-section-title mb-2">Bank</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {field("bankName", "Bank Name")}
              {field("accountNumber", "Account Number")}
              {field("bvn", "BVN")}
              {field("tin", "TIN")}
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleSubmitSingle} disabled={submit.isPending}>
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Capture Return
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-medium">Bulk upload {TX_TYPES.find((t) => t.value === txType)?.label} returns</p>
            <Button variant="link" className="gap-1.5 px-0 text-primary" onClick={handleTemplate}>
              <Download className="h-4 w-4" /> Download CSV Template
            </Button>
          </div>
          <label className="flex flex-col items-center justify-center gap-2 h-36 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
            {file ? <><FileUp className="h-7 w-7 text-primary" /><span className="font-medium">{file.name}</span></>
              : <><Upload className="h-7 w-7 opacity-40" /><span>Drop CSV here or click to browse</span></>}
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleBulk} disabled={bulk.isPending || !file}>
              {bulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload to Batch
            </Button>
          </div>
        </Card>
      )}

      {/* Captured returns in this batch */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="mrpsl-section-title">Captured Returns ({rows.length})</p>
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">HOLDER</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                <th className="text-right px-4 py-2.5 font-medium">ADD. SHARES</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No returns captured in this batch yet.</td></tr>
              ) : (
                rows.map((r: Record<string, unknown>) => (
                  <tr key={String(r.id)} className="border-t border-border">
                    <td className="px-4 py-2.5">{String(r.holderName ?? "—")}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{String(r.chn ?? "—")}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{String(r.txType ?? "—")}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.additionalSharesApplied != null ? Number(r.additionalSharesApplied).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.totalAmountPaid != null ? Number(r.totalAmountPaid).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5"><Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">{String(r.status ?? "PENDING")}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
