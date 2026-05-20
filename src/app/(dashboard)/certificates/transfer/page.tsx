"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Check, AlertCircle, X, Pencil } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type PendingTransfer = {
  id: string;
  date: string;
  cert: string;
  from: string;
  fromAcct: string;
  to: string;
  toAcct: string;
  units: number;
  stampDuty: number;
  submittedBy: string;
};

const PENDING_TRANSFERS: PendingTransfer[] = [
  {
    id: "TR1",
    date: "28 Apr 2026",
    cert: "CERT-DANGCEM-00121",
    from: "Binta Lawal",
    fromAcct: "DANGCEM-10015",
    to: "Adeyemi John",
    toAcct: "DANGCEM-10088",
    units: 5000,
    stampDuty: 250,
    submittedBy: "Chidi Okafor",
  },
  {
    id: "TR2",
    date: "27 Apr 2026",
    cert: "CERT-ACCESS-00553",
    from: "Ngozi Eze",
    fromAcct: "ACCESS-00553",
    to: "Ibrahim Musa",
    toAcct: "ACCESS-01122",
    units: 12000,
    stampDuty: 600,
    submittedBy: "Ngozi Eze",
  },
];

export default function TransferPage() {
  const [srcLoaded, setSrcLoaded] = useState(false);
  const [destLoaded, setDestLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<PendingTransfer | null>(null);
  const [activeTab, setActiveTab] = useState("transfer");
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [lastRejComment, setLastRejComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [editingRejected, setEditingRejected] =
    useState<PendingTransfer | null>(null);
  const [units, setUnits] = useState("");
  const [stampDuty, setStampDuty] = useState("");

  function openReview(row: PendingTransfer) {
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

  const pendingTransfers = PENDING_TRANSFERS.filter(
    (row) => !rejectedIds.has(row.id),
  );
  const transferPg = usePagination(pendingTransfers);
  const visibleTransferIds = transferPg.paged.map((r) => r.id);
  const transferAllSelected =
    visibleTransferIds.length > 0 &&
    visibleTransferIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Transfer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer ownership of units between accounts
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "transfer")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="transfer"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Transfer
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="transfer" className="space-y-6">
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
                      const item = PENDING_TRANSFERS.find((t) =>
                        rejectedIds.has(t.id),
                      );
                      if (item) {
                        setEditingRejected(item);
                        setSrcLoaded(true);
                        setDestLoaded(true);
                        setUnits(String(item.units));
                        setStampDuty(String(item.stampDuty));
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
                  Editing rejected transfer of{" "}
                  <span className="font-semibold">
                    {editingRejected.units.toLocaleString()} units
                  </span>{" "}
                  from{" "}
                  <span className="font-semibold">{editingRejected.from}</span>{" "}
                  to <span className="font-semibold">{editingRejected.to}</span>
                  .
                </p>
                <button
                  onClick={() => {
                    setEditingRejected(null);
                    setSrcLoaded(false);
                    setDestLoaded(false);
                    setUnits("");
                    setStampDuty("");
                  }}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-6">
              <Card className="mrpsl-card p-4 space-y-4">
                <div className="font-semibold text-sm border-b pb-2">
                  Transferor (Source)
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Account Search" className="mrpsl-input" />
                  <Button onClick={() => setSrcLoaded(true)}>Search</Button>
                </div>
                {srcLoaded && (
                  <div className="bg-muted/20 p-3 rounded text-sm space-y-1">
                    <div className="font-bold">Binta Lawal</div>
                    <div className="text-muted-foreground font-mono">
                      DANGCEM-10015
                    </div>
                    <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block mt-0.5">
                      Dangote Cement — DANGCEM
                    </div>
                    <div className="font-mono text-lg font-bold mt-2">
                      15,000 units
                    </div>
                  </div>
                )}
              </Card>

              <Card className="mrpsl-card p-4 space-y-4">
                <div className="font-semibold text-sm border-b pb-2">
                  Transferee (Destination)
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Account Search" className="mrpsl-input" />
                  <Button onClick={() => setDestLoaded(true)}>Search</Button>
                </div>
                {destLoaded && (
                  <div className="bg-muted/20 p-3 rounded text-sm space-y-1">
                    <div className="font-bold">Adeyemi John</div>
                    <div className="text-muted-foreground font-mono">
                      DANGCEM-10088
                    </div>
                    <div className="text-[11px] font-semibold text-primary/80 bg-primary/8 px-2 py-0.5 rounded inline-block mt-0.5">
                      Dangote Cement — DANGCEM
                    </div>
                    <div className="font-mono text-lg font-bold mt-2">
                      2,500 units
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {srcLoaded && destLoaded && (
              <Card className="mrpsl-card p-6 space-y-4 animate-in fade-in">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Transfer Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Units to Transfer *</label>
                    <Input
                      type="number"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      placeholder={
                        editingRejected ? String(editingRejected.units) : ""
                      }
                      className="mrpsl-input font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">
                      Instrument of Transfer Ref *
                    </label>
                    <Input className="mrpsl-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Stamp Duty (₦)</label>
                    <Input
                      value={stampDuty}
                      onChange={(e) => setStampDuty(e.target.value)}
                      className="mrpsl-input font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Upload IoT Document</label>
                    <Input type="file" className="mrpsl-input" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Comment</label>
                  <Textarea />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={() => {
                      toast.success("Transfer submitted for approval");
                      setEditingRejected(null);
                      setSrcLoaded(false);
                      setDestLoaded(false);
                      setUnits("");
                      setStampDuty("");
                    }}
                  >
                    {editingRejected ? "Resubmit Transfer" : "Submit Transfer"}
                  </Button>
                </div>
              </Card>
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
                        checked={transferAllSelected}
                        onCheckedChange={() =>
                          toggleSelectAll(visibleTransferIds)
                        }
                      />
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">CERTIFICATE</th>
                    <th className="p-3">FROM</th>
                    <th className="p-3">TO</th>
                    <th className="p-3">UNITS</th>
                    <th className="p-3">STAMP DUTY</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {transferPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.cert}</td>
                      <td className="p-3">
                        <div className="font-medium">{row.from}</div>
                        <div className="font-mono text-muted-foreground text-[13px]">
                          {row.fromAcct}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{row.to}</div>
                        <div className="font-mono text-muted-foreground text-[13px]">
                          {row.toAcct}
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.units.toLocaleString()}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ₦{row.stampDuty.toLocaleString()}
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
                  {transferPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No pending transfer approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={transferPg.page}
              pageSize={transferPg.pageSize}
              totalPages={transferPg.totalPages}
              from={transferPg.from}
              to={transferPg.to}
              total={transferPg.total}
              onPageChange={transferPg.setPage}
              onPageSizeChange={transferPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Certificate Transfer</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="mrpsl-section-title">Certificate</div>
                <div className="font-mono font-bold">{selected.cert}</div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div>
                    <div className="mrpsl-section-title">From (Transferor)</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.from}
                    </div>
                    <div className="font-mono text-[13px] text-muted-foreground">
                      {selected.fromAcct}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">To (Transferee)</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.to}
                    </div>
                    <div className="font-mono text-[13px] text-muted-foreground">
                      {selected.toAcct}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Units Transferred</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.units.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Stamp Duty</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      ₦{selected.stampDuty.toLocaleString()}
                    </div>
                  </div>
                </div>
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
                    toast.error("Transfer rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success("Transfer approved and processed.");
                    setReviewOpen(false);
                  }}
                >
                  Approve Transfer
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
