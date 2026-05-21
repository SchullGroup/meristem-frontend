"use client";

import { useState, useEffect } from "react";
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
  FileImage,
  Plus,
  UploadCloud,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useStore } from "@/lib/store";
import type { Shareholder } from "@/lib/types";

type DematStatus =
  | "DRAFT"
  | "CALLOVER"
  | "AUTHORISATION"
  | "ICU"
  | "APPROVED"
  | "REJECTED";

type DematDoc = { name: string; fileType: "PDF" | "IMAGE"; url: string };

type DematRecord = {
  id: string;
  date: string;
  cert: string;
  holder: string;
  chn: string;
  broker: string;
  units: number;
  status: DematStatus;
  documents?: DematDoc[];
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
    documents: [
      { name: "Shareholder_ID_Emeka_Nwosu.jpg", fileType: "IMAGE", url: "#" },
      { name: "Demat_Form_D2_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00745.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00746.pdf", fileType: "PDF", url: "#" },
    ],
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
    documents: [
      { name: "Shareholder_ID_Fatima_Bello.jpg", fileType: "IMAGE", url: "#" },
      { name: "Demat_Form_D3_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00612.pdf", fileType: "PDF", url: "#" },
    ],
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
    documents: [
      { name: "Shareholder_ID_Chukwudi_Obi.pdf", fileType: "PDF", url: "#" },
      { name: "Demat_Form_D4_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00503.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D5",
    date: "24 Apr 2026",
    cert: "CERT-DANGCEM-00411",
    holder: "Blessing Okonkwo",
    chn: "CHN-00554321",
    broker: "Meristem Stockbrokers",
    units: 18000,
    status: "APPROVED",
    documents: [
      {
        name: "Shareholder_ID_Blessing_Okonkwo.pdf",
        fileType: "PDF",
        url: "#",
      },
      { name: "Demat_Form_D5_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00411.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D6",
    date: "23 Apr 2026",
    cert: "CERT-DANGCEM-00388",
    holder: "Tunde Adegoke",
    chn: "CHN-00112988",
    broker: "Zenith Securities",
    units: 9500,
    status: "APPROVED",
    documents: [
      { name: "Shareholder_ID_Tunde_Adegoke.jpg", fileType: "IMAGE", url: "#" },
      { name: "Demat_Form_D6_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00388.pdf", fileType: "PDF", url: "#" },
    ],
  },
  {
    id: "D7",
    date: "22 Apr 2026",
    cert: "CERT-DANGCEM-00321, CERT-DANGCEM-00322",
    holder: "Ngozi Eze",
    chn: "CHN-00876543",
    broker: "CSCS PLC",
    units: 32000,
    status: "APPROVED",
    documents: [
      { name: "Shareholder_ID_Ngozi_Eze.pdf", fileType: "PDF", url: "#" },
      { name: "Demat_Form_D7_Signed.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00321.pdf", fileType: "PDF", url: "#" },
      { name: "Scanned_CERT-DANGCEM-00322.pdf", fileType: "PDF", url: "#" },
    ],
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
  Array<{
    label: string;
    done: boolean;
    pending: boolean;
    time?: string | null;
  }>
> = {
  CALLOVER: [
    {
      label: "Captured by Initiator — Chidi Okafor",
      done: true,
      pending: false,
      time: "28 Apr 2026, 08:45",
    },
    {
      label: "Callover Officer — Pending your action",
      done: false,
      pending: true,
      time: null,
    },
    { label: "Authoriser — Awaiting", done: false, pending: false, time: null },
    {
      label: "ICU Officer — Awaiting",
      done: false,
      pending: false,
      time: null,
    },
  ],
  AUTHORISATION: [
    {
      label: "Captured by Initiator — Chidi Okafor",
      done: true,
      pending: false,
      time: "27 Apr 2026, 08:45",
    },
    {
      label: "Callover by Ngozi Adeyemi (Callover Officer)",
      done: true,
      pending: false,
      time: "27 Apr 2026, 10:20",
    },
    {
      label: "Authoriser — Pending your action",
      done: false,
      pending: true,
      time: null,
    },
    {
      label: "ICU Officer — Awaiting",
      done: false,
      pending: false,
      time: null,
    },
  ],
  ICU: [
    {
      label: "Captured by Initiator — Chidi Okafor",
      done: true,
      pending: false,
      time: "26 Apr 2026, 08:45",
    },
    {
      label: "Callover by Ngozi Adeyemi (Callover Officer)",
      done: true,
      pending: false,
      time: "26 Apr 2026, 10:20",
    },
    {
      label: "Authorised by Emeka Eze (Operations Manager)",
      done: true,
      pending: false,
      time: "26 Apr 2026, 12:05",
    },
    {
      label: "ICU Officer — Pending your action",
      done: false,
      pending: true,
      time: null,
    },
  ],
};

function DematTable({
  records,
  onReview,
  onBatchApprove,
  onBatchReject,
}: {
  records: DematRecord[];
  onReview: (r: DematRecord) => void;
  onBatchApprove: (ids: string[]) => void;
  onBatchReject: (ids: string[], comment: string) => void;
}) {
  const pg = usePagination(records);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [rejectingUnchecked, setRejectingUnchecked] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set(pg.paged.map((r) => r.id)));
  }, [pg.paged]);

  const visibleIds = pg.paged.map((r) => r.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const uncheckedIds = records
    .filter((r) => !selectedIds.has(r.id))
    .map((r) => r.id);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }
  function handleBatchApprove() {
    onBatchApprove([...selectedIds]);
    setSelectedIds(new Set());
  }
  function handleBatchReject() {
    if (!batchComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    if (rejectingUnchecked) {
      onBatchApprove([...selectedIds]);
      onBatchReject(uncheckedIds, batchComment);
    } else {
      onBatchReject([...selectedIds], batchComment);
    }
    setSelectedIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
    setRejectingUnchecked(false);
  }

  return (
    <div className="space-y-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => {
                setRejectingUnchecked(false);
                setBatchRejectOpen(true);
              }}
            >
              Reject Selected
            </Button>
            {uncheckedIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  setRejectingUnchecked(true);
                  setBatchRejectOpen(true);
                }}
              >
                Approve ✓ / Reject ✗ Unchecked
              </Button>
            )}
            <Button size="sm" onClick={handleBatchApprove}>
              Approve Selected
            </Button>
          </div>
        </div>
      )}
      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="p-3 w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleSelectAll(visibleIds)}
                />
              </th>
              <th className="p-3">DATE</th>
              <th className="p-3">CERT NO(S)</th>
              <th className="p-3">HOLDER</th>
              <th className="p-3">CHN</th>
              <th className="p-3">BROKER</th>
              <th className="p-3">UNITS</th>
              <th className="p-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {pg.paged.map((row) => (
              <tr key={row.id} className="mrpsl-table-row">
                <td className="p-3">
                  <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={() => toggleSelect(row.id)}
                  />
                </td>
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
                  colSpan={8}
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

      <Dialog
        open={batchRejectOpen}
        onOpenChange={(open) => {
          setBatchRejectOpen(open);
          if (!open) setRejectingUnchecked(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectingUnchecked
                ? `Approve ${selectedIds.size} & Reject ${uncheckedIds.length} Unchecked`
                : `Reject ${selectedIds.size} Record${selectedIds.size !== 1 ? "s" : ""}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              {rejectingUnchecked
                ? "Checked records will be approved. This comment will be applied to all unchecked (rejected) records."
                : "This comment will be applied to all selected records and sent to the initiator."}
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Rejection Comment <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                placeholder="State reason for rejection..."
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  const { shareholders } = useStore();
  const [activeTab, setActiveTab] = useState("capture");
  const [formOpen, setFormOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<DematRecord | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [lastRejComment, setLastRejComment] = useState("");
  const [editingRejectedId, setEditingRejectedId] = useState<string | null>(
    null,
  );
  const [rejectComment, setRejectComment] = useState("");
  const [lodgedIds, setLodgedIds] = useState<Set<string>>(new Set());
  const [rinType, setRinType] = useState<"with_rin" | "no_rin">("with_rin");
  const [lodgmentSelectedIds, setLodgmentSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [holderQuery, setHolderQuery] = useState("");
  const [foundHolder, setFoundHolder] = useState<Shareholder | null>(null);
  const [holderNotFound, setHolderNotFound] = useState(false);

  function handleHolderLookup() {
    const q = holderQuery.trim().toUpperCase();
    if (!q) return;
    const match = shareholders.find(
      (s) => s.accountNumber.toUpperCase() === q || s.chn.toUpperCase() === q,
    );
    if (match) {
      setFoundHolder(match);
      setHolderNotFound(false);
    } else {
      setFoundHolder(null);
      setHolderNotFound(true);
    }
  }

  function resetForm() {
    setHolderQuery("");
    setFoundHolder(null);
    setHolderNotFound(false);
    setEditingRejectedId(null);
  }

  function openReview(rec: DematRecord) {
    setSelected(rec);
    setRejectComment("");
    setReviewOpen(true);
  }

  const draftRecords = MOCK_RECORDS.filter((r) => r.status === "DRAFT");
  const calloverRecords = MOCK_RECORDS.filter(
    (r) => r.status === "CALLOVER" && !rejectedIds.has(r.id),
  );
  const authRecords = MOCK_RECORDS.filter(
    (r) => r.status === "AUTHORISATION" && !rejectedIds.has(r.id),
  );
  const icuRecords = MOCK_RECORDS.filter(
    (r) => r.status === "ICU" && !rejectedIds.has(r.id),
  );
  const lodgmentRecords = MOCK_RECORDS.filter(
    (r) => r.status === "APPROVED" && !lodgedIds.has(r.id),
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
            {rejectedIds.size > 0 && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="font-semibold text-sm text-red-800">
                      {rejectedIds.size === 1
                        ? "Record Rejected"
                        : `${rejectedIds.size} Records Rejected`}
                    </div>
                    <div className="text-[13px] text-red-700">
                      {lastRejComment || "No comment provided."}
                    </div>
                    <div className="space-y-1.5 mt-1">
                      {MOCK_RECORDS.filter((r) => rejectedIds.has(r.id)).map(
                        (rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center gap-3 text-[13px]"
                          >
                            <span className="font-mono text-red-800 truncate max-w-[200px]">
                              {rec.cert}
                            </span>
                            <span className="text-red-700">— {rec.holder}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-auto border-red-300 text-red-700 hover:bg-red-100 gap-1.5 h-7 text-[12px]"
                              onClick={() => {
                                setEditingRejectedId(rec.id);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" /> Edit &amp; Resubmit
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRejectedIds(new Set());
                      setLastRejComment("");
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
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
                    <th className="p-3">UNITS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ACTIONS</th>
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
            <DematTable
              records={calloverRecords}
              onReview={openReview}
              onBatchApprove={(ids) =>
                toast.success(
                  `${ids.length} record${ids.length !== 1 ? "s" : ""} approved.`,
                )
              }
              onBatchReject={(ids, comment) => {
                setRejectedIds((prev) => new Set([...prev, ...ids]));
                setLastRejComment(comment);
                toast.error(
                  `${ids.length} record${ids.length !== 1 ? "s" : ""} rejected.`,
                );
              }}
            />
          </TabsContent>

          {/* ── Authorisation ── */}
          <TabsContent value="auth" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Callover-cleared records awaiting authoriser sign-off before ICU
              review.
            </p>
            <DematTable
              records={authRecords}
              onReview={openReview}
              onBatchApprove={(ids) =>
                toast.success(
                  `${ids.length} record${ids.length !== 1 ? "s" : ""} approved.`,
                )
              }
              onBatchReject={(ids, comment) => {
                setRejectedIds((prev) => new Set([...prev, ...ids]));
                setLastRejComment(comment);
                toast.error(
                  `${ids.length} record${ids.length !== 1 ? "s" : ""} rejected.`,
                );
              }}
            />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Authorised demat batches awaiting final ICU approval before
              lodgment at CSCS.
            </p>
            <DematTable
              records={icuRecords}
              onReview={openReview}
              onBatchApprove={(ids) =>
                toast.success(
                  `${ids.length} record${ids.length !== 1 ? "s" : ""} approved.`,
                )
              }
              onBatchReject={(ids, comment) => {
                setRejectedIds((prev) => new Set([...prev, ...ids]));
                setLastRejComment(comment);
                toast.error(
                  `${ids.length} record${ids.length !== 1 ? "s" : ""} rejected.`,
                );
              }}
            />
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ICU-approved records ready to be lodged at CSCS via text file
              download or direct API push.
            </p>

            {/* RIN type selector + batch actions toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-1">
                  Lodgment Format:
                </span>
                <RadioGroup
                  value={rinType}
                  onValueChange={(v) => setRinType(v as "with_rin" | "no_rin")}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="with_rin" id="rin-yes" />
                    <label htmlFor="rin-yes" className="text-sm cursor-pointer">
                      RIN at CSCS
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no_rin" id="rin-no" />
                    <label htmlFor="rin-no" className="text-sm cursor-pointer">
                      RIN NOT at CSCS
                    </label>
                  </div>
                </RadioGroup>
              </div>
              {lodgmentSelectedIds.size > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-semibold text-primary">
                    {lodgmentSelectedIds.size} selected
                  </span>
                  <div className="flex gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        toast.success(
                          `${lodgmentSelectedIds.size} record(s) downloaded as lodgment file (${rinType === "with_rin" ? "RIN format" : "Non-RIN format"}).`,
                        );
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" /> Download (.txt)
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setLodgedIds(
                          (prev) => new Set([...prev, ...lodgmentSelectedIds]),
                        );
                        setLodgmentSelectedIds(new Set());
                        toast.success(
                          `${lodgmentSelectedIds.size} record(s) pushed to CSCS API. Awaiting confirmation.`,
                        );
                      }}
                    >
                      <UploadCloud className="h-3.5 w-3.5" /> Push to CSCS
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={
                          lodgmentRecords.length > 0 &&
                          lodgmentRecords.every((r) =>
                            lodgmentSelectedIds.has(r.id),
                          )
                        }
                        onCheckedChange={() => {
                          const allSel = lodgmentRecords.every((r) =>
                            lodgmentSelectedIds.has(r.id),
                          );
                          setLodgmentSelectedIds(
                            allSel
                              ? new Set()
                              : new Set(lodgmentRecords.map((r) => r.id)),
                          );
                        }}
                      />
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">CERT NO(S)</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">CHN</th>
                    <th className="p-3">BROKER</th>
                    <th className="p-3">UNITS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {lodgmentRecords.map((row) => (
                    <tr
                      key={row.id}
                      className={`mrpsl-table-row ${lodgmentSelectedIds.has(row.id) ? "bg-primary/5" : ""}`}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={lodgmentSelectedIds.has(row.id)}
                          onCheckedChange={() =>
                            setLodgmentSelectedIds((prev) => {
                              const next = new Set(prev);
                              next.has(row.id)
                                ? next.delete(row.id)
                                : next.add(row.id);
                              return next;
                            })
                          }
                        />
                      </td>
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
                      <td className="p-3 tabular-nums font-semibold text-right">
                        {row.units.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] gap-1"
                            onClick={() =>
                              toast.success(
                                `${row.cert} lodgment file downloaded.`,
                              )
                            }
                          >
                            <FileText className="h-3 w-3" /> Download
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[12px] gap-1"
                            onClick={() => {
                              setLodgedIds(
                                (prev) => new Set([...prev, row.id]),
                              );
                              setLodgmentSelectedIds((prev) => {
                                const next = new Set(prev);
                                next.delete(row.id);
                                return next;
                              });
                              toast.success(`${row.cert} pushed to CSCS API.`);
                            }}
                          >
                            <UploadCloud className="h-3 w-3" /> Push
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {lodgmentRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No records pending lodgment. ICU-approved records will
                        appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            {lodgedIds.size > 0 && (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground px-1">
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                {lodgedIds.size} record{lodgedIds.size !== 1 ? "s" : ""}{" "}
                successfully lodged with CSCS this session.
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Review Dialog ── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
            <DialogTitle>
              {selected?.status === "CALLOVER"
                ? "Callover Review"
                : selected?.status === "AUTHORISATION"
                  ? "Authorisation Review"
                  : "ICU Approval Review"}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="overflow-y-auto flex-1 min-h-0 px-6 py-6 space-y-5">
              {/* Transaction details */}
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

              {/* Submitted documents */}
              {selected.documents && selected.documents.length > 0 && (
                <div className="border border-border/60 rounded-xl p-4">
                  <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                    Submitted Documents
                  </h4>
                  <div className="space-y-2">
                    {selected.documents.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border"
                      >
                        {doc.fileType === "IMAGE" ? (
                          <FileImage className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-red-500  shrink-0" />
                        )}
                        <span className="text-sm flex-1 truncate font-medium">
                          {doc.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono shrink-0"
                        >
                          {doc.fileType}
                        </Badge>
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Open"
                          onClick={() => toast.info(`Opening ${doc.name}…`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Download"
                          onClick={() => toast.info(`Downloading ${doc.name}…`)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval chain */}
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {approvalSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-green-500" : step.pending ? "bg-amber-200 animate-pulse" : "border-2 border-muted bg-background"}`}
                      >
                        {step.done && (
                          <Check
                            className="h-3 w-3 text-white"
                            style={{ strokeWidth: 3 }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-sm">{step.label}</div>
                        {step.time && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {step.time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment + actions */}
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
                    setRejectedIds((prev) => new Set([...prev, selected!.id]));
                    setLastRejComment(rejectComment);
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
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRejectedId
                ? "Edit &amp; Resubmit Demat Record"
                : "New Demat Capture"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full">
            <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {editingRejectedId &&
                (() => {
                  const rec = MOCK_RECORDS.find(
                    (r) => r.id === editingRejectedId,
                  );
                  return rec ? (
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                      <Pencil className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-semibold text-amber-800">
                          Editing rejected record — {rec.cert}
                        </p>
                        <p className="text-[13px] text-amber-700 mt-0.5">
                          Holder: {rec.holder} · {rec.units.toLocaleString()}{" "}
                          units. Correct the information below and resubmit.
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
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
                        value={holderQuery}
                        onChange={(e) => {
                          setHolderQuery(e.target.value);
                          setFoundHolder(null);
                          setHolderNotFound(false);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleHolderLookup()
                        }
                      />
                      <Button
                        variant="outline"
                        className="h-11 px-6 font-bold"
                        onClick={handleHolderLookup}
                      >
                        Lookup
                      </Button>
                    </div>
                    {foundHolder && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50/60 mt-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm font-mono">
                            {foundHolder.firstName[0]}
                            {foundHolder.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-800">
                            {foundHolder.firstName} {foundHolder.lastName}
                          </p>
                          <p className="text-[13px] text-green-700 font-mono">
                            {foundHolder.accountNumber} · {foundHolder.chn}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] text-muted-foreground">
                            {foundHolder.holderType}
                          </p>
                          <p className="text-[13px] font-mono font-semibold">
                            {foundHolder.holdings.toLocaleString()} units
                          </p>
                        </div>
                      </div>
                    )}
                    {holderNotFound && (
                      <p className="text-[13px] text-red-600 mt-1.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        No shareholder found for &quot;{holderQuery}&quot;.
                        Check the CHN or account number.
                      </p>
                    )}
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
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-sm font-bold px-6 h-12 rounded-xl"
              onClick={() => {
                toast.success("Saved as draft.");
                setFormOpen(false);
                resetForm();
              }}
            >
              Save Draft
            </Button>
            <Button
              className="text-sm font-bold px-10 h-12 rounded-xl"
              onClick={() => {
                if (editingRejectedId) {
                  setRejectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(editingRejectedId);
                    return next;
                  });
                  toast.success(
                    "Record corrected and resubmitted for callover.",
                  );
                } else {
                  toast.success("Submitted for callover.");
                }
                setFormOpen(false);
                resetForm();
              }}
            >
              {editingRejectedId ? "Resubmit Record" : "Submit Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
