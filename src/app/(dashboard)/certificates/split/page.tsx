"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Scissors, AlertCircle, X, Pencil } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type PendingSplit = {
  id: string;
  date: string;
  origCert: string;
  holder: string;
  account: string;
  register: string;
  totalUnits: number;
  parts: number;
  partUnits: number[];
  submittedBy: string;
};

const PENDING_SPLITS: PendingSplit[] = [
  {
    id: "SP1",
    date: "28 Apr 2026",
    origCert: "CERT-DANGCEM-20015",
    holder: "Binta Lawal",
    account: "DANGCEM-10015",
    register: "Dangote Cement — DANGCEM",
    totalUnits: 15000,
    parts: 2,
    partUnits: [10000, 5000],
    submittedBy: "Chidi Okafor",
  },
  {
    id: "SP2",
    date: "27 Apr 2026",
    origCert: "CERT-ACCESS-00443",
    holder: "Kolade Adeyemi",
    account: "ACCESS-00443",
    register: "Access Bank — ACCESS",
    totalUnits: 8500,
    parts: 3,
    partUnits: [3000, 3000, 2500],
    submittedBy: "Ngozi Eze",
  },
];

export default function SplitPage() {
  const [activeTab, setActiveTab] = useState("split");
  const [certFound, setCertFound] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<PendingSplit | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [lastRejComment, setLastRejComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [editingRejected, setEditingRejected] = useState<PendingSplit | null>(
    null,
  );
  const [numParts, setNumParts] = useState("2");
  const [partUnits, setPartUnits] = useState(["", ""]);
  const [splitReason, setSplitReason] = useState("");
  const [approvedSplitCerts, setApprovedSplitCerts] = useState<string[]>([]);

  function openReview(row: PendingSplit) {
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

  const pendingSplits = PENDING_SPLITS.filter(
    (row) => !rejectedIds.has(row.id),
  );
  const splitPg = usePagination(pendingSplits);
  const visibleSplitIds = splitPg.paged.map((r) => r.id);
  const splitAllSelected =
    visibleSplitIds.length > 0 &&
    visibleSplitIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Split
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Split a single certificate into multiple smaller denominations
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "split")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="split"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Split
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="split" className="space-y-4">
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
                      const item = PENDING_SPLITS.find((s) =>
                        rejectedIds.has(s.id),
                      );
                      if (item) {
                        setEditingRejected(item);
                        setCertFound(true);
                        setNumParts(String(item.parts));
                        setPartUnits(item.partUnits.map(String));
                        setSplitReason("");
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
                  Editing rejected request for{" "}
                  <span className="font-semibold">
                    {editingRejected.origCert}
                  </span>{" "}
                  — make your changes below and resubmit.
                </p>
                <button
                  onClick={() => {
                    setEditingRejected(null);
                    setCertFound(false);
                  }}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Find Certificate
                </h3>
                <Card className="mrpsl-card p-4 space-y-4">
                  <Input
                    placeholder="Cert No, Account No, or CHN"
                    className="mrpsl-input"
                  />
                  <Button className="w-full" onClick={() => setCertFound(true)}>
                    Search
                  </Button>
                  {certFound && (
                    <div className="mt-4 pt-4 border-t animate-in fade-in">
                      {approvedSplitCerts.includes("CERT-DANGCEM-20015") ? (
                        <div className="space-y-3 opacity-50">
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-lg font-bold line-through text-muted-foreground">
                              CERT-DANGCEM-20015
                            </div>
                            <Badge className="bg-red-100 text-red-700 border-0 text-[12px]">
                              INACTIVE
                            </Badge>
                          </div>
                          <div className="text-[12px] font-semibold text-muted-foreground px-2 py-0.5 rounded inline-block bg-muted">
                            Dangote Cement — DANGCEM
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Original 15,000 units — split
                          </div>
                          <div className="border-t pt-3 space-y-1.5">
                            <div className="text-[13px] font-semibold text-green-700">
                              New certificates issued:
                            </div>
                            <div className="font-mono text-[13px] bg-green-50 border border-green-200 rounded px-3 py-1.5">
                              CERT-DANGCEM-20015-A · 10,000 units
                            </div>
                            <div className="font-mono text-[13px] bg-green-50 border border-green-200 rounded px-3 py-1.5">
                              CERT-DANGCEM-20015-B · 5,000 units
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-lg font-bold">
                              CERT-DANGCEM-20015
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-0 text-[12px]">
                              ACTIVE
                            </Badge>
                          </div>
                          <div className="text-[12px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block">
                            Dangote Cement — DANGCEM
                          </div>
                          <div className="text-sm">
                            Holder:{" "}
                            <span className="font-medium">Binta Lawal</span>
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            DANGCEM-10015
                          </div>
                          <div className="text-3xl tabular-nums font-bold mt-2">
                            15,000
                          </div>
                          <div className="text-[13px] text-muted-foreground">
                            units
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              <div className="col-span-3 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Configure Split
                </h3>
                {certFound ? (
                  <Card className="mrpsl-card p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">Number of Parts</label>
                        <Select
                          value={numParts}
                          onValueChange={(v) => {
                            const n = v ?? "2";
                            setNumParts(n);
                            setPartUnits(Array(Number(n)).fill(""));
                          }}
                        >
                          <SelectTrigger className="mrpsl-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Parts</SelectItem>
                            <SelectItem value="3">3 Parts</SelectItem>
                            <SelectItem value="4">4 Parts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: Number(numParts) }, (_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-16">
                            Part {i + 1}
                          </span>
                          <Input
                            type="number"
                            value={partUnits[i] ?? ""}
                            onChange={(e) =>
                              setPartUnits((prev) => {
                                const next = [...prev];
                                next[i] = e.target.value;
                                return next;
                              })
                            }
                            className="mrpsl-input font-mono w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            units
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-mono text-center">
                      Sum:{" "}
                      {partUnits
                        .reduce((s, v) => s + (Number(v) || 0), 0)
                        .toLocaleString()}{" "}
                      /{" "}
                      {editingRejected
                        ? editingRejected.totalUnits.toLocaleString()
                        : "—"}{" "}
                      units{" "}
                      {partUnits.reduce((s, v) => s + (Number(v) || 0), 0) ===
                        (editingRejected?.totalUnits ?? 0) && editingRejected
                        ? "✓"
                        : ""}
                    </div>
                    <Textarea
                      value={splitReason}
                      onChange={(e) => setSplitReason(e.target.value)}
                      placeholder="Reason for split..."
                      className="focus-visible:ring-primary"
                    />
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        toast.success("Split request submitted for approval.");
                        setEditingRejected(null);
                        setCertFound(false);
                        setPartUnits(["", ""]);
                        setNumParts("2");
                        setSplitReason("");
                      }}
                    >
                      {editingRejected
                        ? "Resubmit for Approval"
                        : "Submit for Approval"}
                    </Button>
                  </Card>
                ) : (
                  <Card className="mrpsl-card p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Scissors className="h-8 w-8 mb-4 opacity-20" />
                    Search for a certificate first to configure a split.
                  </Card>
                )}
              </div>
            </div>
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
                        checked={splitAllSelected}
                        onCheckedChange={() => toggleSelectAll(visibleSplitIds)}
                      />
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ORIGINAL CERT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">TOTAL UNITS</th>
                    <th className="p-3">PARTS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {splitPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.origCert}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.account}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                          {row.parts} parts
                        </Badge>
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
                  {splitPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No pending split approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={splitPg.page}
              pageSize={splitPg.pageSize}
              totalPages={splitPg.totalPages}
              from={splitPg.from}
              to={splitPg.to}
              total={splitPg.total}
              onPageChange={splitPg.setPage}
              onPageSizeChange={splitPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Certificate Split</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 px-6 pb-6 overflow-y-auto max-h-[75vh]">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="mrpsl-section-title mb-0.5">
                      Original Certificate
                    </div>
                    <div className="font-mono font-bold text-sm">
                      {selected.origCert}
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
                    <div className="mrpsl-section-title">Account</div>
                    <div className="font-mono text-[13px] text-muted-foreground mt-0.5">
                      {selected.account}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Total Units</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.totalUnits.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Parts</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.parts}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  Split Distribution
                </div>
                <table className="w-full text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2 text-left">PART</th>
                      <th className="px-4 py-2">UNITS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selected.partUnits.map((u, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">Part {i + 1}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold">
                          {u.toLocaleString()}
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
                    toast.error("Split rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setApprovedSplitCerts((prev) => [
                      ...prev,
                      selected!.origCert,
                    ]);
                    toast.success("Split approved and processed.");
                    setReviewOpen(false);
                  }}
                >
                  Approve Split
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
