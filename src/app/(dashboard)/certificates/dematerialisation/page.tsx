"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check,
  FileText,
  Plus,
  UploadCloud,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";

type DematStatus =
  | "DRAFT"
  | "CALLOVER"
  | "AUTHORISATION"
  | "ICU"
  | "APPROVED"
  | "REJECTED";

type DematRecord = {
  id: string;
  date: string;
  cert: string;
  holder: string;
  chn: string;
  broker: string;
  units: number;
  status: DematStatus;
};

const MOCK_RECORDS: DematRecord[] = [
  {
    id: "D1",
    date: "29 Apr 2026",
    cert: "CERT-DANGCEM-00891",
    holder: "Adaeze Okonkwo",
    chn: "CHN-00192834",
    broker: "CSCS PLC",
    units: 5000,
    status: "DRAFT",
  },
  {
    id: "D2",
    date: "28 Apr 2026",
    cert: "CERT-DANGCEM-00745, CERT-DANGCEM-00746",
    holder: "Emeka Nwosu",
    chn: "CHN-00381920",
    broker: "Zenith Securities",
    units: 12500,
    status: "CALLOVER",
  },
  {
    id: "D3",
    date: "27 Apr 2026",
    cert: "CERT-DANGCEM-00612",
    holder: "Fatima Bello",
    chn: "CHN-00274510",
    broker: "Meristem Stockbrokers",
    units: 8000,
    status: "AUTHORISATION",
  },
  {
    id: "D4",
    date: "26 Apr 2026",
    cert: "CERT-DANGCEM-00503",
    holder: "Chukwudi Obi",
    chn: "CHN-00163824",
    broker: "CSCS PLC",
    units: 25000,
    status: "ICU",
  },
];

const STATUS_MAP: Record<DematStatus, { cls: string; label: string }> = {
  DRAFT: { cls: "bg-gray-100 text-gray-600", label: "Draft" },
  CALLOVER: { cls: "bg-blue-100 text-blue-800", label: "Callover" },
  AUTHORISATION: { cls: "bg-amber-100 text-amber-800", label: "Pending Auth" },
  ICU: { cls: "bg-purple-100 text-purple-800", label: "ICU Review" },
  APPROVED: { cls: "bg-green-100 text-green-800", label: "Approved" },
  REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected" },
};

function StatusBadge({ status }: { status: DematStatus }) {
  const s = STATUS_MAP[status];
  return <Badge className={`border-0 text-[13px] ${s.cls}`}>{s.label}</Badge>;
}

const APPROVAL_STEPS: Record<
  string,
  Array<{ label: string; done: boolean; pending: boolean }>
> = {
  CALLOVER: [
    { label: "Captured by Initiator", done: true, pending: false },
    { label: "Callover Officer ⏳", done: false, pending: true },
    { label: "Authoriser — Awaiting", done: false, pending: false },
    { label: "ICU Officer — Awaiting", done: false, pending: false },
  ],
  AUTHORISATION: [
    { label: "Captured by Initiator", done: true, pending: false },
    { label: "Callover Officer ✓", done: true, pending: false },
    { label: "Authoriser ⏳", done: false, pending: true },
    { label: "ICU Officer — Awaiting", done: false, pending: false },
  ],
  ICU: [
    { label: "Captured by Initiator", done: true, pending: false },
    { label: "Callover Officer ✓", done: true, pending: false },
    { label: "Authoriser ✓", done: true, pending: false },
    { label: "ICU Officer ⏳", done: false, pending: true },
  ],
};

function DematTable({
  records,
  onReview,
}: {
  records: DematRecord[];
  onReview: (r: DematRecord) => void;
}) {
  const pg = usePagination(records);
  return (
    <div className="space-y-3">
      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="p-3">DATE</th>
              <th className="p-3">CERT NO(S)</th>
              <th className="p-3">HOLDER</th>
              <th className="p-3">CHN</th>
              <th className="p-3">BROKER</th>
              <th className="p-3 text-right">UNITS</th>
              <th className="p-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {pg.paged.map((row) => (
              <tr key={row.id} className="mrpsl-table-row">
                <td className="p-3 text-muted-foreground">{row.date}</td>
                <td
                  className="p-3 font-mono truncate max-w-[160px]"
                  title={row.cert}
                >
                  {row.cert}
                </td>
                <td className="p-3 font-medium">{row.holder}</td>
                <td className="p-3 font-mono text-muted-foreground">
                  {row.chn}
                </td>
                <td className="p-3">{row.broker}</td>
                <td className="p-3 text-right tabular-nums font-semibold">
                  {row.units.toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" onClick={() => onReview(row)}>
                    Review &amp; Decide
                  </Button>
                </td>
              </tr>
            ))}
            {pg.total === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-12 text-center text-muted-foreground"
                >
                  No records at this stage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <TablePagination
        page={pg.page}
        pageSize={pg.pageSize}
        totalPages={pg.totalPages}
        from={pg.from}
        to={pg.to}
        total={pg.total}
        onPageChange={pg.setPage}
        onPageSizeChange={pg.setPageSize}
      />
    </div>
  );
}

const STEPS = [
  { step: 1, label: "Capture", tab: "capture" },
  { step: 2, label: "Callover", tab: "callover" },
  { step: 3, label: "Authorisation", tab: "auth" },
  { step: 4, label: "ICU Approval", tab: "icu" },
  { step: 5, label: "Lodgment", tab: "lodgment" },
];

export default function DematPage() {
  const [activeTab, setActiveTab] = useState("capture");
  const [formOpen, setFormOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<DematRecord | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  function openReview(rec: DematRecord) {
    setSelected(rec);
    setRejectComment("");
    setReviewOpen(true);
  }

  const draftRecords = MOCK_RECORDS.filter((r) => r.status === "DRAFT");
  const calloverRecords = MOCK_RECORDS.filter(
    (r) => r.status === "CALLOVER" && r.id !== rejectedId,
  );
  const authRecords = MOCK_RECORDS.filter(
    (r) => r.status === "AUTHORISATION" && r.id !== rejectedId,
  );
  const icuRecords = MOCK_RECORDS.filter(
    (r) => r.status === "ICU" && r.id !== rejectedId,
  );
  const draftPg = usePagination(draftRecords);
  const approvalSteps = selected ? (APPROVAL_STEPS[selected.status] ?? []) : [];

  const approveLabel =
    selected?.status === "CALLOVER"
      ? "Approve & Forward to Auth"
      : selected?.status === "AUTHORISATION"
        ? "Approve & Forward to ICU"
        : "Approve for Lodgment";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Dematerialisation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convert physical certificates to electronic form at CSCS
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Demat Record
        </Button>
      </div>

      {/* Step progress bar */}
      <div className="w-full flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -z-10" />
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="flex flex-col items-center bg-background px-2 cursor-pointer"
            onClick={() => setActiveTab(s.tab)}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${activeTab === s.tab ? "border-primary bg-primary text-white" : "border-border bg-muted text-muted-foreground"}`}
            >
              {s.step}
            </div>
            <span
              className={`text-[13px] mt-2 font-medium ${activeTab === s.tab ? "text-primary" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <div className="mt-2">
          {/* ── Capture ── */}
          <TabsContent value="capture" className="space-y-4">
            {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Record Rejected — ID: {rejectedId}
                  </div>
                  <div className="text-[13px] text-red-700">
                    {rejectedComment || "No comment provided."}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRejectedId(null);
                    setRejectedComment("");
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">CERT NO(S)</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">CHN</th>
                    <th className="p-3">BROKER</th>
                    <th className="p-3 text-right">UNITS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {draftPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td
                        className="p-3 font-mono truncate max-w-[160px]"
                        title={row.cert}
                      >
                        {row.cert}
                      </td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.chn}
                      </td>
                      <td className="p-3">{row.broker}</td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.units.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toast.info("Demat record detail")}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Record
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFormOpen(true)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActiveTab("callover");
                                toast.success("Submitted for callover");
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" /> Submit for
                              Callover
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => toast.success("Draft cancelled")}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Cancel Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={draftPg.page}
              pageSize={draftPg.pageSize}
              totalPages={draftPg.totalPages}
              from={draftPg.from}
              to={draftPg.to}
              total={draftPg.total}
              onPageChange={draftPg.setPage}
              onPageSizeChange={draftPg.setPageSize}
            />
          </TabsContent>

          {/* ── Callover ── */}
          <TabsContent value="callover" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Records submitted from Capture awaiting physical callover
              verification before forwarding to Authorisation.
            </p>
            <DematTable records={calloverRecords} onReview={openReview} />
          </TabsContent>

          {/* ── Authorisation ── */}
          <TabsContent value="auth" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Callover-cleared records awaiting authoriser sign-off before ICU
              review.
            </p>
            <DematTable records={authRecords} onReview={openReview} />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Authorised demat batches awaiting final ICU approval before
              lodgment at CSCS.
            </p>
            <DematTable records={icuRecords} onReview={openReview} />
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-4">
            <Card className="mrpsl-card">
              <div className="p-4 border-b bg-muted/20">
                <Badge className="bg-emerald-100 text-emerald-800 mb-2">
                  ICU Approved Demat Batch
                </Badge>
                <h3 className="font-semibold text-lg">
                  BATCH-DEMAT-20260429-01
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <RadioGroup defaultValue="with_rin" className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with_rin" id="r1" />
                    <label htmlFor="r1">RIN at CSCS</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_rin" id="r2" />
                    <label htmlFor="r2">RIN NOT at CSCS</label>
                  </div>
                </RadioGroup>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      toast.success(
                        "BATCH-DEMAT-20260429-01.txt downloaded successfully.",
                      )
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" /> Download Lodgment File
                    (.txt)
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() =>
                      toast.success(
                        "Batch pushed to CSCS API. Awaiting confirmation response.",
                      )
                    }
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Push to CSCS API
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Review Dialog ── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected?.status === "CALLOVER"
                ? "Callover Review"
                : selected?.status === "AUTHORISATION"
                  ? "Authorisation Review"
                  : "ICU Approval Review"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="mrpsl-section-title mb-1">
                      Certificate(s)
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      {selected.cert}
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <div className="mrpsl-section-title">Holder</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.holder}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">CHN</div>
                    <div className="font-mono text-[13px] text-muted-foreground mt-0.5">
                      {selected.chn}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Broker</div>
                    <div className="text-sm mt-0.5">{selected.broker}</div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Units</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.units.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {approvalSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : step.pending ? "bg-amber-200 animate-pulse" : "border-2 border-muted bg-background"}`}
                      >
                        {step.done && (
                          <Check className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Comment</label>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Required for rejection..."
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setRejectedId(selected!.id);
                    setRejectedComment(rejectComment);
                    toast.error("Record rejected and returned to capture.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success(`${approveLabel}.`);
                    setReviewOpen(false);
                  }}
                >
                  {approveLabel}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── New Demat Form ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Demat Capture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full">
            <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Registration &amp; Identity
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Register *</label>
                    <Select>
                      <SelectTrigger className="mrpsl-input h-11">
                        <SelectValue placeholder="Select Register" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="d">DANGCEM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Stockbroker *</label>
                    <Select>
                      <SelectTrigger className="mrpsl-input h-11">
                        <SelectValue placeholder="Select Stockbroker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s">CSCS PLC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="mrpsl-label">Holder Lookup</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="CHN or Account No"
                        className="mrpsl-input h-11 flex-1"
                      />
                      <Button variant="outline" className="h-11 px-6 font-bold">
                        Lookup
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                    Certificate Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary text-[13px] font-bold"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Certificate
                  </Button>
                </div>
                <div className="space-y-4 rounded-xl border p-6 bg-muted/5">
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-[13px] font-bold uppercase text-muted-foreground">
                        Certificate No *
                      </label>
                      <Input
                        placeholder="00000000"
                        className="mrpsl-input h-11"
                      />
                    </div>
                    <div className="space-y-2 w-48">
                      <label className="text-[13px] font-bold uppercase text-muted-foreground">
                        Units *
                      </label>
                      <Input
                        placeholder="0"
                        type="number"
                        className="mrpsl-input h-11 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-border/40">
                    <span className="text-[13px] font-bold text-muted-foreground">
                      Total Units:{" "}
                      <span className="text-foreground font-mono">0</span>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Supporting Documents
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const id = getDocType("National ID");
                    const form = getDocType("Demat Form");
                    const cert = getDocType("Scanned Certificates");
                    return (
                      <>
                        <DocUploadZone
                          label="Shareholder ID"
                          required
                          fileTypes={id?.fileTypes ?? ["JPG", "PNG", "PDF"]}
                          maxSizeMB={id?.maxSizeMB ?? 5}
                        />
                        <DocUploadZone
                          label="Demat Form"
                          required
                          fileTypes={form?.fileTypes ?? ["PDF"]}
                          maxSizeMB={form?.maxSizeMB ?? 5}
                        />
                        <DocUploadZone
                          label="Scanned Certs"
                          required
                          fileTypes={cert?.fileTypes ?? ["PDF", "JPG", "PNG"]}
                          maxSizeMB={cert?.maxSizeMB ?? 20}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="text-sm font-bold px-6 h-12"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-sm font-bold px-6 h-12 rounded-xl"
              onClick={() => {
                toast.success("Saved as draft.");
                setFormOpen(false);
              }}
            >
              Save Draft
            </Button>
            <Button
              className="text-sm font-bold px-10 h-12 rounded-xl"
              onClick={() => {
                toast.success("Submitted for callover.");
                setFormOpen(false);
              }}
            >
              Submit Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
