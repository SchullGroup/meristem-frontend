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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Check, AlertCircle, X, Pencil } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type ConsolCert = { num: string; units: number; issueDate: string };

type PendingConsol = {
  id: string;
  date: string;
  account: string;
  holder: string;
  register: string;
  certCount: number;
  totalUnits: number;
  submittedBy: string;
  certs: ConsolCert[];
};

const PENDING_CONSOLS: PendingConsol[] = [
  {
    id: "CO1",
    date: "28 Apr 2026",
    account: "DANGCEM-10015",
    holder: "Binta Lawal",
    register: "Dangote Cement — DANGCEM",
    certCount: 2,
    totalUnits: 20000,
    submittedBy: "Chidi Okafor",
    certs: [
      { num: "CERT-DANGCEM-10015-01", units: 12000, issueDate: "01 Jan 2024" },
      { num: "CERT-DANGCEM-10015-02", units: 8000, issueDate: "15 Mar 2025" },
    ],
  },
  {
    id: "CO2",
    date: "27 Apr 2026",
    account: "ACCESS-00553",
    holder: "Ngozi Eze",
    register: "Access Bank — ACCESS",
    certCount: 3,
    totalUnits: 35000,
    submittedBy: "Ngozi Eze",
    certs: [
      { num: "CERT-ACCESS-00553-01", units: 10000, issueDate: "12 Feb 2023" },
      { num: "CERT-ACCESS-00553-02", units: 15000, issueDate: "01 Apr 2024" },
      { num: "CERT-ACCESS-00553-03", units: 10000, issueDate: "20 Jan 2026" },
    ],
  },
];

export default function ConsolidationPage() {
  const { registers } = useStore();
  const [certsLoaded, setCertsLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<PendingConsol | null>(null);
  const [activeTab, setActiveTab] = useState("new");
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [lastRejComment, setLastRejComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [editingRejected, setEditingRejected] = useState<PendingConsol | null>(
    null,
  );
  const [approvedConsolAccounts, setApprovedConsolAccounts] = useState<
    string[]
  >([]);

  function openReview(row: PendingConsol) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

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
    toast.success(
      `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} approved.`,
    );
    setSelectedIds(new Set());
  }
  function handleBatchReject() {
    if (!batchComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    setRejectedIds((prev) => new Set([...prev, ...selectedIds]));
    setLastRejComment(batchComment);
    toast.error(
      `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} rejected.`,
    );
    setSelectedIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
  }

  const pendingConsols = PENDING_CONSOLS.filter(
    (row) => !rejectedIds.has(row.id),
  );
  const consolPg = usePagination(pendingConsols);
  const visibleConsolIds = consolPg.paged.map((r) => r.id);
  const consolAllSelected =
    visibleConsolIds.length > 0 &&
    visibleConsolIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Consolidation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merge multiple certificates for a single account into one
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "new")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Consolidation
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="new" className="space-y-6">
            {rejectedIds.size > 0 && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-sm text-red-800">
                      {rejectedIds.size === 1
                        ? "Request Rejected"
                        : `${rejectedIds.size} Requests Rejected`}
                    </div>
                    <div className="text-[13px] text-red-700">
                      {lastRejComment || "No comment provided."}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRejectedIds(new Set());
                      setLastRejComment("");
                      setEditingRejected(null);
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 pl-8">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                    onClick={() => {
                      const item = PENDING_CONSOLS.find((c) =>
                        rejectedIds.has(c.id),
                      );
                      if (item) {
                        setEditingRejected(item);
                        setCertsLoaded(true);
                      }
                      setRejectedIds(new Set());
                      setLastRejComment("");
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit &amp; Resubmit
                  </Button>
                </div>
              </Card>
            )}
            {editingRejected && (
              <Card className="mrpsl-card p-3 border-l-4 border-l-amber-400 bg-amber-50/60 border-amber-200 flex items-center gap-3">
                <Pencil className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[13px] text-amber-800 font-medium flex-1">
                  Editing rejected consolidation for account{" "}
                  <span className="font-semibold">
                    {editingRejected.account}
                  </span>{" "}
                  — {editingRejected.certCount} certificates,{" "}
                  {editingRejected.totalUnits.toLocaleString()} units.
                </p>
                <button
                  onClick={() => {
                    setEditingRejected(null);
                    setCertsLoaded(false);
                  }}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <Card className="mrpsl-card p-4">
              <div className="flex items-end gap-3">
                <div className="flex flex-col">
                  <label className="mrpsl-label">Register</label>
                  <Select>
                    <SelectTrigger className="w-52 mrpsl-input">
                      <SelectValue placeholder="Select register" />
                    </SelectTrigger>
                    <SelectContent className="w-max">
                      {registers.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.symbol} — {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="mrpsl-label">Account No or CHN</label>
                  <Input
                    placeholder="e.g. DANGCEM-10015 or C00001EL"
                    className="mrpsl-input w-64"
                  />
                </div>
                <Button size="xl" onClick={() => setCertsLoaded(true)}>
                  Load Certificates
                </Button>
              </div>
            </Card>

            {certsLoaded && (
              <div className="space-y-4 animate-in fade-in">
                <Card className="mrpsl-card p-4 bg-green-50/60 border-green-200">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">BL</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-green-900">
                        Binta Lawal
                      </div>
                      <div className="font-mono text-[13px] text-green-700">
                        DANGCEM-10015
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded mb-1">
                        Dangote Cement — DANGCEM
                      </div>
                      <div className="font-mono text-sm font-bold text-green-900">
                        20,000 units
                      </div>
                    </div>
                  </div>
                </Card>

                {approvedConsolAccounts.includes("DANGCEM-10015") ? (
                  <div className="space-y-3">
                    <Card className="mrpsl-card overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="p-3 w-10"></th>
                            <th className="p-3">CERT NO</th>
                            <th className="p-3">UNITS</th>
                            <th className="p-3">ISSUE DATE</th>
                            <th className="p-3">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {["CERT-001", "CERT-002", "CERT-003"].map((c) => (
                            <tr
                              key={c}
                              className="hover:bg-accent/5 opacity-50"
                            >
                              <td className="p-3">
                                <Checkbox disabled />
                              </td>
                              <td className="p-3 font-mono text-[13px] line-through text-muted-foreground">
                                {c}
                              </td>
                              <td className="p-3 font-mono text-right text-muted-foreground">
                                10,000
                              </td>
                              <td className="p-3 text-muted-foreground text-[13px]">
                                01 Jan 2026
                              </td>
                              <td className="p-3">
                                <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                  INACTIVE
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                    <Card className="mrpsl-card p-4 bg-green-50/60 border-green-200">
                      <div className="text-[13px] font-semibold text-green-700 mb-2">
                        Consolidated Certificate Issued:
                      </div>
                      <div className="font-mono text-[13px] bg-green-100 border border-green-200 rounded px-3 py-2 flex items-center justify-between">
                        <span>CERT-DANGCEM-CONSOL-001 · 20,000 units</span>
                        <span className="text-[11px] font-semibold bg-green-600 text-white px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Card className="mrpsl-card">
                    <table className="w-full text-left text-sm">
                      <thead className="mrpsl-table-header">
                        <tr>
                          <th className="p-3 w-10"></th>
                          <th className="p-3">CERT NO</th>
                          <th className="p-3">UNITS</th>
                          <th className="p-3">ISSUE DATE</th>
                          <th className="p-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {["CERT-001", "CERT-002", "CERT-003"].map((c) => (
                          <tr key={c} className="hover:bg-accent/5">
                            <td className="p-3">
                              <Checkbox defaultChecked={c !== "CERT-003"} />
                            </td>
                            <td className="p-3 font-mono text-[13px]">{c}</td>
                            <td className="p-3 font-mono text-right">10,000</td>
                            <td className="p-3 text-muted-foreground text-[13px]">
                              01 Jan 2026
                            </td>
                            <td className="p-3">ACTIVE</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {!approvedConsolAccounts.includes("DANGCEM-10015") && (
                  <div className="sticky bottom-4 z-10">
                    <Card className="mrpsl-card bg-card shadow-lg border-primary/25 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">
                            2
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            2 certificates selected
                          </div>
                          <div className="text-[13px] text-muted-foreground tabular-nums mt-0.5">
                            20,000 total units
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          toast.success(
                            "Consolidation submitted for authorizer review.",
                          )
                        }
                      >
                        Consolidate Selected
                      </Button>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
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
                    onClick={() => setBatchRejectOpen(true)}
                  >
                    Reject Selected
                  </Button>
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
                        checked={consolAllSelected}
                        onCheckedChange={() =>
                          toggleSelectAll(visibleConsolIds)
                        }
                      />
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">CERTIFICATES</th>
                    <th className="p-3">TOTAL UNITS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {consolPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 text-right tabular-nums">
                        {row.certCount} certs
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => openReview(row)}>
                          Review &amp; Decide
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {consolPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No pending consolidation approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={consolPg.page}
              pageSize={consolPg.pageSize}
              totalPages={consolPg.totalPages}
              from={consolPg.from}
              to={consolPg.to}
              total={consolPg.total}
              onPageChange={consolPg.setPage}
              onPageSizeChange={consolPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Certificate Consolidation</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 px-6 pb-6 overflow-y-auto max-h-[75vh]">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="mrpsl-section-title mb-0.5">Account</div>
                    <div className="font-mono font-bold">
                      {selected.account}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded shrink-0">
                    {selected.register}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <div className="mrpsl-section-title">Holder</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.holder}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Submitted By</div>
                    <div className="text-sm mt-0.5">{selected.submittedBy}</div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">
                      Certificates to Merge
                    </div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.certCount}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Total Units</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.totalUnits.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  Certificates Being Merged
                </div>
                <table className="w-full text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2 text-left">CERT NO</th>
                      <th className="px-4 py-2">UNITS</th>
                      <th className="px-4 py-2">ISSUE DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selected.certs.map((c, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">
                          {c.num}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold">
                          {c.units.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {c.issueDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/20">
                      <td className="px-4 py-2 text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
                        Total
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold">
                        {selected.totalUnits.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {((): Array<{
                    label: string;
                    done: boolean;
                    pending?: boolean;
                    time?: string | null;
                  }> => [
                    {
                      label: `Submitted by ${selected.submittedBy}`,
                      done: true,
                      time: selected.date + ", 09:14",
                    },
                    {
                      label: "Authorised by Ngozi Adeyemi (Operations Manager)",
                      done: true,
                      time: selected.date + ", 11:30",
                    },
                    {
                      label: "ICU Final Review — Approved",
                      done: true,
                      time: selected.date + ", 14:00",
                    },
                  ])().map((step, i) => (
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
                    toast.error("Consolidation rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setApprovedConsolAccounts((prev) => [
                      ...prev,
                      selected!.account,
                    ]);
                    toast.success("Consolidation approved and processed.");
                    setReviewOpen(false);
                  }}
                >
                  Approve Consolidation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedIds.size} Record
              {selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              This comment will be applied to all selected records and sent to
              the initiator.
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
