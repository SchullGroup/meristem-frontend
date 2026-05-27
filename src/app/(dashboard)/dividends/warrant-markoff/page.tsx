"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, AlertTriangle, AlertCircle, X } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import { useStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";

type MarkOffApproval = {
  id: string;
  date: string;
  warrantNo: string;
  account: string;
  holder: string;
  dividend: string;
  amount: number;
  submittedBy: string;
  tier: 1 | 2 | 3;
};
type MarkOffHistory = {
  id: string;
  date: string;
  warrantNo: string;
  account: string;
  holder: string;
  amount: number;
  markedBy: string;
  status: string;
  tier: 1 | 2 | 3;
};

const UNPAID_WARRANTS = [
  {
    id: "W1",
    warrantNo: "WRT-10291",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    dividend: "DIV-2025-001",
    amount: 45000,
  },
  {
    id: "W2",
    warrantNo: "WRT-10345",
    account: "ZENITH-9921",
    holder: "Fatima Abdullahi",
    dividend: "DIV-2025-001",
    amount: 128500,
  },
  {
    id: "W3",
    warrantNo: "WRT-10412",
    account: "DANGCEM-10102",
    holder: "Emeka Eze",
    dividend: "DIV-2025-002",
    amount: 62000,
  },
  {
    id: "W4",
    warrantNo: "WRT-10500",
    account: "ACCESS-00220",
    holder: "Ifeoma Okafor",
    dividend: "DIV-2025-001",
    amount: 98000,
  },
];

const INITIAL_PENDING: MarkOffApproval[] = [
  {
    id: "MO1",
    date: "05 May 2026",
    warrantNo: "WRT-10291",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    dividend: "DIV-2025-001",
    amount: 45000,
    submittedBy: "Chidi Okafor",
    tier: 1,
  },
  {
    id: "MO2",
    date: "04 May 2026",
    warrantNo: "WRT-10345",
    account: "ZENITH-9921",
    holder: "Fatima Abdullahi",
    dividend: "DIV-2025-001",
    amount: 128500,
    submittedBy: "Ngozi Eze",
    tier: 2,
  },
  {
    id: "MO3",
    date: "04 May 2026",
    warrantNo: "WRT-10412",
    account: "DANGCEM-10102",
    holder: "Emeka Eze",
    dividend: "DIV-2025-002",
    amount: 62000,
    submittedBy: "Aisha Musa",
    tier: 3,
  },
];

const MARKOFF_HISTORY: MarkOffHistory[] = [
  {
    id: "H1",
    date: "30 Apr 2026",
    warrantNo: "WRT-10100",
    account: "DANGCEM-10001",
    holder: "Ada Nwosu",
    amount: 37500,
    markedBy: "Chidi Okafor",
    status: "APPROVED",
    tier: 3,
  },
  {
    id: "H2",
    date: "29 Apr 2026",
    warrantNo: "WRT-10099",
    account: "ZENITH-8810",
    holder: "Bello Musa",
    amount: 210000,
    markedBy: "Ngozi Eze",
    status: "APPROVED",
    tier: 3,
  },
  {
    id: "H3",
    date: "28 Apr 2026",
    warrantNo: "WRT-10088",
    account: "DANGCEM-10030",
    holder: "Sola Adeyemo",
    amount: 55000,
    markedBy: "Aisha Musa",
    status: "REJECTED",
    tier: 1,
  },
  {
    id: "H4",
    date: "27 Apr 2026",
    warrantNo: "WRT-10075",
    account: "ACCESS-00220",
    holder: "Ifeoma Okafor",
    amount: 98000,
    markedBy: "Chidi Okafor",
    status: "APPROVED",
    tier: 3,
  },
  {
    id: "H5",
    date: "25 Apr 2026",
    warrantNo: "WRT-10060",
    account: "DANGCEM-10055",
    holder: "Tunde Badmus",
    amount: 19500,
    markedBy: "Ngozi Eze",
    status: "APPROVED",
    tier: 3,
  },
];

function tierLabel(tier: 1 | 2 | 3) {
  return tier === 1 ? "1st Approval" : tier === 2 ? "ICU" : "Management";
}
function tierBadgeClass(tier: 1 | 2 | 3) {
  return tier === 1
    ? "bg-blue-100 text-blue-800"
    : tier === 2
      ? "bg-purple-100 text-purple-800"
      : "bg-orange-100 text-orange-800";
}
function approveButtonText(tier: 1 | 2 | 3) {
  return tier === 1
    ? "Approve & Forward to ICU"
    : tier === 2
      ? "ICU Approve & Forward to Management"
      : "Final Management Approval";
}
function modalTitle(tier: 1 | 2 | 3) {
  return tier === 1
    ? "1st Approval Review"
    : tier === 2
      ? "ICU Review"
      : "Management Sign-Off";
}

type ApprovalChainStep = { label: string; done: boolean; pending: boolean };

function buildApprovalChain(
  submittedBy: string,
  tier: 1 | 2 | 3,
): ApprovalChainStep[] {
  return [
    { label: `Submitted by ${submittedBy}`, done: true, pending: false },
    { label: "1st Approval", done: tier > 1, pending: tier === 1 },
    { label: "ICU Approval", done: tier > 2, pending: tier === 2 },
    { label: "Management Approval", done: false, pending: tier === 3 },
  ];
}

export default function MarkOffPage() {
  const { registers } = useStore();

  const [activeTab, setActiveTab] = useState("manual");

  const [manualSearch, setManualSearch] = useState("");
  const [markoffFound, setMarkoffFound] = useState(false);
  const [markoffReason, setMarkoffReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const [enBlocRegister, setEnBlocRegister] = useState("");
  const [enBlocFrom, setEnBlocFrom] = useState("");
  const [enBlocTo, setEnBlocTo] = useState("");
  const [enBlocLoaded, setEnBlocLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [pendingMarkoff, setPendingMarkoff] =
    useState<MarkOffApproval[]>(INITIAL_PENDING);
  const [authSelIds, setAuthSelIds] = useState<Set<string>>(new Set());
  const [batchMarkRejectOpen, setBatchMarkRejectOpen] = useState(false);
  const [batchMarkComment, setBatchMarkComment] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<MarkOffApproval | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  function openReview(row: MarkOffApproval) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  const visiblePending = pendingMarkoff.filter((row) => row.id !== rejectedId);
  const markoffPg = usePagination(visiblePending);
  const historyPg = usePagination(MARKOFF_HISTORY);

  const allChecked = UNPAID_WARRANTS.every((w) => selectedIds.has(w.id));
  const selectedWarrants = UNPAID_WARRANTS.filter((w) => selectedIds.has(w.id));
  const selectionTotal = selectedWarrants.reduce((s, w) => s + w.amount, 0);

  function toggleAll() {
    if (allChecked) setSelectedIds(new Set());
    else setSelectedIds(new Set(UNPAID_WARRANTS.map((w) => w.id)));
  }
  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleManualSubmit() {
    if (!markoffReason.trim()) {
      setReasonError(true);
      return;
    }
    toast.success("Mark-off submitted for 1st approval.");
    setMarkoffFound(false);
    setManualSearch("");
    setMarkoffReason("");
    setReasonError(false);
  }

  function handleEnBlocSubmit() {
    const n = selectedIds.size;
    toast.success(
      `${n} warrant${n !== 1 ? "s" : ""} submitted for 1st level approval.`,
    );
    setSelectedIds(new Set());
    setEnBlocLoaded(false);
  }

  function handleApprove() {
    if (!selected) return;
    if (selected.tier === 3) {
      setPendingMarkoff((prev) => prev.filter((r) => r.id !== selected.id));
      toast.success(
        "Final management approval granted. Warrant marked as PAID.",
      );
    } else {
      const nextTier = (selected.tier + 1) as 2 | 3;
      setPendingMarkoff((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, tier: nextTier } : r)),
      );
      toast.success(
        selected.tier === 1
          ? "Approved and forwarded to ICU."
          : "ICU approved and forwarded to Management.",
      );
    }
    setReviewOpen(false);
  }

  function toggleAuthSel(id: string) {
    setAuthSelIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAuthAll(ids: string[]) {
    setAuthSelIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }
  function handleBatchMarkApprove() {
    const ids = authSelIds;
    setPendingMarkoff((prev) =>
      prev
        .map((r) => {
          if (!ids.has(r.id)) return r;
          if (r.tier === 3) return null as unknown as typeof r;
          return { ...r, tier: (r.tier + 1) as 2 | 3 };
        })
        .filter(Boolean),
    );
    setAuthSelIds(new Set());
    toast.success(
      `${ids.size} warrant${ids.size !== 1 ? "s" : ""} approved and advanced.`,
    );
  }
  function handleBatchMarkReject() {
    if (!batchMarkComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    const ids = authSelIds;
    setPendingMarkoff((prev) => prev.filter((r) => !ids.has(r.id)));
    setAuthSelIds(new Set());
    toast.error(`${ids.size} warrant${ids.size !== 1 ? "s" : ""} rejected.`);
    setBatchMarkComment("");
    setBatchMarkRejectOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Warrant Mark-Off
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flag dividend warrants as paid (manual or bulk)
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="manual"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Manual Mark-Off
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            En Bloc Mark-Off
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="manual" className="space-y-6">
            {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Mark-Off Rejected — ID: {rejectedId}
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

            <Card className="mrpsl-card p-6 max-w-xl mx-auto space-y-4 mt-12">
              <h3 className="font-semibold text-lg text-center mb-2">
                Find Warrant
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Warrant No / Account No / CHN"
                  className="mrpsl-input"
                  value={manualSearch}
                  onChange={(e) => {
                    setManualSearch(e.target.value);
                    setMarkoffFound(false);
                  }}
                />
                <Button
                  onClick={() => {
                    if (manualSearch.trim()) setMarkoffFound(true);
                  }}
                >
                  Search
                </Button>
              </div>
            </Card>

            {markoffFound && (
              <div className="max-w-xl mx-auto space-y-4">
                <Card className="mrpsl-card p-5 space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-2">
                    Warrant Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <span className="text-muted-foreground">Warrant No</span>
                      <div className="font-mono font-bold mt-0.5">
                        WRT-10291
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account</span>
                      <div className="font-mono mt-0.5">DANGCEM-10045</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Holder</span>
                      <div className="font-semibold mt-0.5">Lukman Bello</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dividend</span>
                      <div className="font-mono mt-0.5">DIV-2025-001</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Net Amount</span>
                      <div className="font-mono font-bold text-green-600 mt-0.5">
                        ₦45,000.00
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <span className="bg-amber-100 text-amber-800 text-[12px] px-2 py-0.5 rounded">
                          UNPAID
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="mrpsl-card p-5 space-y-4 border-red-200">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      This action permanently marks the warrant as{" "}
                      <strong>PAID</strong>. Three-tier approval required.
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Reason / Comment</label>
                    <Textarea
                      placeholder="Reason is required..."
                      className={`resize-none focus-visible:ring-primary ${reasonError ? "border-red-500" : ""}`}
                      value={markoffReason}
                      onChange={(e) => {
                        setMarkoffReason(e.target.value);
                        if (e.target.value.trim()) setReasonError(false);
                      }}
                    />
                    {reasonError && (
                      <p className="text-[12px] text-red-600">
                        Reason is required.
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full border-2 border-red-500 bg-red-500 hover:bg-red-600 text-white font-semibold"
                    onClick={handleManualSubmit}
                  >
                    Submit Mark-Off for Approval
                  </Button>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card className="mrpsl-card p-4">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Register</label>
                  <Select
                    value={enBlocRegister}
                    onValueChange={(v) => setEnBlocRegister(v || "")}
                  >
                    <SelectTrigger className="mrpsl-input">
                      <SelectValue placeholder="Select register" />
                    </SelectTrigger>
                    <SelectContent>
                      {registers
                        .filter((r) => r.status === "ACTIVE")
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.symbol}
                          </SelectItem>
                        ))}
                      {registers.filter((r) => r.status === "ACTIVE").length ===
                        0 && <SelectItem value="DANGCEM">DANGCEM</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="mrpsl-label">From</label>
                  <Input
                    type="date"
                    className="mrpsl-input"
                    value={enBlocFrom}
                    onChange={(e) => setEnBlocFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="mrpsl-label">To</label>
                  <Input
                    type="date"
                    className="mrpsl-input"
                    value={enBlocTo}
                    onChange={(e) => setEnBlocTo(e.target.value)}
                  />
                </div>
                <Button onClick={() => setEnBlocLoaded(true)}>
                  Load Unpaid Warrants
                </Button>
              </div>
            </Card>

            {enBlocLoaded && (
              <div className="space-y-0">
                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={toggleAll}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="p-3">WARRANT NO</th>
                        <th className="p-3">ACCOUNT</th>
                        <th className="p-3">HOLDER</th>
                        <th className="p-3">DIVIDEND</th>
                        <th className="p-3">AMOUNT (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px]">
                      {UNPAID_WARRANTS.map((w) => (
                        <tr
                          key={w.id}
                          className={`mrpsl-table-row ${selectedIds.has(w.id) ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(w.id)}
                              onChange={() => toggleRow(w.id)}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono">{w.warrantNo}</td>
                          <td className="p-3 font-mono">{w.account}</td>
                          <td className="p-3 font-medium">{w.holder}</td>
                          <td className="p-3 text-muted-foreground">
                            {w.dividend}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">
                            {w.amount.toLocaleString()}.00
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                {selectedIds.size > 0 && (
                  <div className="sticky bottom-0 bg-background border border-border/60 rounded-b-xl px-4 py-3 flex items-center justify-between shadow-md">
                    <span className="text-sm font-medium">
                      {selectedIds.size} warrant
                      {selectedIds.size !== 1 ? "s" : ""} selected — Total:{" "}
                      <span className="font-mono font-bold text-primary">
                        ₦{selectionTotal.toLocaleString()}.00
                      </span>
                    </span>
                    <Button onClick={handleEnBlocSubmit}>
                      Submit Selected for Mark-Off
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auth">
            <div className="space-y-4">
              {authSelIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium text-primary">
                    {authSelIds.size} warrant{authSelIds.size !== 1 ? "s" : ""}{" "}
                    selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setBatchMarkComment("");
                        setBatchMarkRejectOpen(true);
                      }}
                    >
                      Reject Selected
                    </Button>
                    <Button size="sm" onClick={handleBatchMarkApprove}>
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
                          checked={
                            markoffPg.paged.length > 0 &&
                            markoffPg.paged.every((r) => authSelIds.has(r.id))
                          }
                          onCheckedChange={() =>
                            toggleAuthAll(markoffPg.paged.map((r) => r.id))
                          }
                        />
                      </th>
                      <th className="p-3">DATE</th>
                      <th className="p-3">WARRANT NO</th>
                      <th className="p-3">ACCOUNT</th>
                      <th className="p-3">HOLDER</th>
                      <th className="p-3">DIVIDEND</th>
                      <th className="p-3">AMOUNT (₦)</th>
                      <th className="p-3">SUBMITTED BY</th>
                      <th className="p-3">TIER</th>
                      <th className="p-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {markoffPg.paged.map((row) => (
                      <tr
                        key={row.id}
                        className={`mrpsl-table-row ${authSelIds.has(row.id) ? "bg-primary/5" : ""}`}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={authSelIds.has(row.id)}
                            onCheckedChange={() => toggleAuthSel(row.id)}
                          />
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.date}
                        </td>
                        <td className="p-3 font-mono">{row.warrantNo}</td>
                        <td className="p-3 font-mono">{row.account}</td>
                        <td className="p-3 font-medium">{row.holder}</td>
                        <td className="p-3 text-muted-foreground">
                          {row.dividend}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {row.amount.toLocaleString()}.00
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.submittedBy}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`border-0 text-[12px] ${tierBadgeClass(row.tier)}`}
                          >
                            {tierLabel(row.tier)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" onClick={() => openReview(row)}>
                            Review &amp; Decide
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <TablePagination
                page={markoffPg.page}
                pageSize={markoffPg.pageSize}
                totalPages={markoffPg.totalPages}
                from={markoffPg.from}
                to={markoffPg.to}
                total={markoffPg.total}
                onPageChange={markoffPg.setPage}
                onPageSizeChange={markoffPg.setPageSize}
              />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">WARRANT NO</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">AMOUNT (₦)</th>
                    <th className="p-3">MARKED OFF BY</th>
                    <th className="p-3">TIER</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {historyPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.warrantNo}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {row.amount.toLocaleString()}.00
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.markedBy}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`border-0 text-[12px] ${tierBadgeClass(row.tier)}`}
                        >
                          {tierLabel(row.tier)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`border-0 text-[13px] ${row.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                        >
                          {row.status.charAt(0) +
                            row.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={historyPg.page}
              pageSize={historyPg.pageSize}
              totalPages={historyPg.totalPages}
              from={historyPg.from}
              to={historyPg.to}
              total={historyPg.total}
              onPageChange={historyPg.setPage}
              onPageSizeChange={historyPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              {selected ? modalTitle(selected.tier) : "Review"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Approving will permanently mark this warrant as{" "}
                  <strong>PAID</strong>. This action cannot be undone.
                </span>
              </div>

              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mrpsl-section-title">Warrant No</div>
                    <div className="font-mono font-bold mt-0.5">
                      {selected.warrantNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Dividend</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.dividend}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Account</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.account}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Holder</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.holder}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="mrpsl-section-title">Amount</div>
                    <div className="text-2xl tabular-nums font-bold mt-0.5 text-primary">
                      ₦{selected.amount.toLocaleString()}.00
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {buildApprovalChain(selected.submittedBy, selected.tier).map(
                    (step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                            step.done
                              ? "bg-green-100"
                              : step.pending
                                ? "bg-amber-200 animate-pulse"
                                : "bg-muted"
                          }`}
                        >
                          {step.done && (
                            <Check className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm">{step.label}</div>
                      </div>
                    ),
                  )}
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
                    toast.error("Mark-off rejected.");
                    setReviewOpen(false);
                    setActiveTab("manual");
                  }}
                >
                  Reject
                </Button>
                <Button className="flex-1" onClick={handleApprove}>
                  {approveButtonText(selected.tier)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Batch Reject Dialog ── */}
      <Dialog open={batchMarkRejectOpen} onOpenChange={setBatchMarkRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Selected Warrants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-8 pb-8">
            <p className="text-sm text-muted-foreground">
              {authSelIds.size} warrant{authSelIds.size !== 1 ? "s" : ""} will
              be rejected and returned to the submitter.
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">Rejection Comment *</label>
              <Textarea
                value={batchMarkComment}
                onChange={(e) => setBatchMarkComment(e.target.value)}
                placeholder="Comment is required for rejection..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBatchMarkRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchMarkReject}
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
