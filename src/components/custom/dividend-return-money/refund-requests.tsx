"use client";

import { useState } from "react";
import { Loader2, AlertCircle, PlusCircle, Calculator, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useReturnRecords,
  useRefundRequests,
  useCreateRefundRequest,
  useApproveRefundRequest,
} from "@/hooks/useDividendReturnMoney";
import type { RefundRequest } from "@/types/dividend-return-money";
import { formatNaira } from "@/lib/utils/format";
import { toast } from "sonner";
import type { RefundRequestStatus } from "@/types/dividend-return-money";

const STATUS_META: Record<
  RefundRequestStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  RECEIVED: {
    label: "Received",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function RefundRequestsTab() {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestPercentage, setRequestPercentage] = useState("");
  const [reason, setReason] = useState("");
  const [narration, setNarration] = useState("");
  const [approveTarget, setApproveTarget] = useState<RefundRequest | null>(null);
  const [approveComment, setApproveComment] = useState("");

  const { data: recordsData, isLoading: recordsLoading } = useReturnRecords({
    size: 100,
  });
  const records = recordsData?.content ?? [];
  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  const { data: requestsData, isLoading: requestsLoading } = useRefundRequests({
    size: 50,
  });
  const requests = requestsData?.content ?? [];

  const createRequest = useCreateRefundRequest();
  const approveRequest = useApproveRefundRequest();

  function handleApprove() {
    if (!approveTarget) return;
    approveRequest.mutate(
      { id: approveTarget.id, comment: approveComment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Refund request for ${approveTarget.paymentNumber} approved.`);
          setApproveTarget(null);
          setApproveComment("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  const pct = parseFloat(requestPercentage) || 0;
  // Naira equivalent: user-entered % of the 90% amount returned to the company
  const requestedNaira = selectedRecord
    ? (selectedRecord.returnAmount * pct) / 100
    : 0;
  // Shortfall as a % of the 90% return amount — used as a hint
  const shortfallNaira = selectedRecord
    ? Math.max(
        0,
        selectedRecord.totalPaidToShareholders - selectedRecord.withheldAmount,
      )
    : 0;
  const suggestedPercentage =
    selectedRecord && selectedRecord.returnAmount > 0
      ? (shortfallNaira / selectedRecord.returnAmount) * 100
      : 0;

  function openDialog(recordId: number) {
    setSelectedRecordId(recordId);
    setDialogOpen(true);
  }

  function resetForm() {
    setRequestPercentage("");
    setReason("");
    setNarration("");
  }

  function handleSubmit() {
    if (!selectedRecordId) return;
    if (pct <= 0 || pct > 90) {
      toast.error("Enter a percentage between 0 and 90.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the refund request.");
      return;
    }

    createRequest.mutate(
      {
        returnRecordId: selectedRecordId,
        requestedAmount: requestedNaira,
        reason: reason.trim(),
        narration: narration.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Refund request submitted successfully.");
          setDialogOpen(false);
          resetForm();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Explanation card */}
      <Card className="mrpsl-card p-4 bg-blue-50/30 border-blue-200">
        <div className="flex gap-3 items-start">
          <Calculator className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <div className="font-semibold">When to raise a Refund Request</div>
            <div className="text-[13px] leading-relaxed">
              When the 10% withheld pool for a declaration has been exhausted by
              shareholder payments, raise a refund request to recover funds from
              the company. Enter the percentage of the 90% already returned that
              you need back. The system calculates the naira equivalent
              automatically.
            </div>
          </div>
        </div>
      </Card>

      {/* New request button + declaration picker */}
      <div className="flex items-end gap-3">
        <div className="">
          <label className="mrpsl-label">Declaration</label>
          {recordsLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            <Select
              value={selectedRecordId?.toString() ?? ""}
              onValueChange={(v) => setSelectedRecordId(Number(v))}
            >
              <SelectTrigger className="mrpsl-input w-64">
                <SelectValue placeholder="Select declaration..." />
              </SelectTrigger>
              <SelectContent>
                {records.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    <span className="font-bold">{r.paymentNumber}</span>{" "}
                    <span className="text-muted-foreground text-sm">
                      — {r.registerSymbol}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedRecord && (
          <Button
            size="xl"
            className="gap-2"
            onClick={() => openDialog(selectedRecord.id)}
          >
            <PlusCircle className="h-4 w-4" />
            New Refund Request
          </Button>
        )}
      </div>

      {/* Selected declaration balance snapshot */}
      {selectedRecord && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="mrpsl-card p-3">
            <div className="mrpsl-section-title mb-1 text-green-700">
              90% Returned
            </div>
            <div className="text-lg font-bold font-mono text-green-600">
              {formatNaira(selectedRecord.returnAmount)}
            </div>
          </Card>
          <Card className="mrpsl-card p-3">
            <div className="mrpsl-section-title mb-1 text-amber-700">
              10% Withheld
            </div>
            <div className="text-lg font-bold font-mono text-amber-600">
              {formatNaira(selectedRecord.withheldAmount)}
            </div>
          </Card>
          <Card className="mrpsl-card p-3">
            <div className="mrpsl-section-title mb-1 text-blue-700">
              Paid to SHs
            </div>
            <div className="text-lg font-bold font-mono text-blue-600">
              {formatNaira(selectedRecord.totalPaidToShareholders)}
            </div>
          </Card>
          <Card
            className={`mrpsl-card p-3 ${selectedRecord.remainingBalance <= 0 ? "border-l-4 border-l-red-500" : ""}`}
          >
            <div
              className={`mrpsl-section-title mb-1 ${selectedRecord.remainingBalance <= 0 ? "text-red-700" : "text-green-700"}`}
            >
              Remaining
            </div>
            <div
              className={`text-lg font-bold font-mono ${selectedRecord.remainingBalance <= 0 ? "text-red-600" : "text-green-600"}`}
            >
              {formatNaira(selectedRecord.remainingBalance)}
            </div>
          </Card>
        </div>
      )}

      {/* Requests table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3">DATE</th>
                <th className="p-3">DECLARATION</th>
                <th className="p-3">REGISTER</th>
                <th className="p-3 text-right">90% RETURNED</th>
                <th className="p-3 text-right">10% WITHHELD</th>
                <th className="p-3 text-right">PAID TO SHs</th>
                <th className="p-3 text-right">REQUESTED</th>
                <th className="p-3">REASON</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[13px]">
              {requestsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center text-muted-foreground font-sans"
                  >
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No refund requests raised yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const meta = STATUS_META[req.status];
                  // derive 90% from the seed (totalWithheld is the 10%, so 90% = totalWithheld * 9)
                  const returnAmount = req.totalWithheld * 9;
                  return (
                    <tr key={req.id} className="hover:bg-accent/5">
                      <td className="p-3 text-muted-foreground">
                        {req.requestDate}
                      </td>
                      <td className="p-3 font-bold text-primary">
                        {req.paymentNumber}
                      </td>
                      <td className="p-3 font-sans">{req.registerSymbol}</td>
                      <td className="p-3 text-right text-green-600">
                        {formatNaira(returnAmount)}
                      </td>
                      <td className="p-3 text-right text-amber-600">
                        {formatNaira(req.totalWithheld)}
                      </td>
                      <td className="p-3 text-right text-blue-600">
                        {formatNaira(req.totalPaidToShareholders)}
                      </td>
                      <td className="p-3 text-right font-bold text-purple-600">
                        {formatNaira(req.requestedAmount)}
                      </td>
                      <td className="p-3 font-sans text-[12px] text-muted-foreground max-w-[180px] truncate">
                        {req.reason}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${meta.className}`}
                        >
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {req.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => setApproveTarget(req)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Refund Request Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              New Refund Request — {selectedRecord?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              Enter the percentage of the 90% returned to the company that you
              want refunded. The naira equivalent is calculated automatically.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 px-8 py-2">
              {/* Breakdown */}
              <div className="rounded-lg border divide-y text-sm">
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">
                    90% Returned to Company
                  </span>
                  <span className="font-mono font-bold text-green-600">
                    {formatNaira(selectedRecord.returnAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">
                    10% Originally Withheld
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatNaira(selectedRecord.withheldAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">
                    Total Paid to Shareholders
                  </span>
                  <span className="font-mono font-bold text-blue-600">
                    {formatNaira(selectedRecord.totalPaidToShareholders)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="font-medium">Withheld Remaining</span>
                  <span
                    className={`font-mono font-bold ${selectedRecord.remainingBalance <= 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {formatNaira(selectedRecord.remainingBalance)}
                  </span>
                </div>
              </div>

              {/* Percentage input with live naira calculation */}
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  % of 90% Return to Request Back *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    step="0.01"
                    className="mrpsl-input pr-8"
                    placeholder="e.g. 5"
                    value={requestPercentage}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num) && num > 90) {
                        setRequestPercentage("90");
                      } else {
                        setRequestPercentage(e.target.value);
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    %
                  </span>
                </div>
                {/* Live naira equivalent */}
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">
                    Calculated amount:
                  </span>
                  <span className="font-mono font-bold text-purple-600">
                    {pct > 0 ? formatNaira(requestedNaira) : "—"}
                  </span>
                </div>
                {/* Suggested percentage hint */}
                {suggestedPercentage > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() =>
                      setRequestPercentage(suggestedPercentage.toFixed(2))
                    }
                  >
                    Use shortfall %: {suggestedPercentage.toFixed(2)}% (
                    {formatNaira(shortfallNaira)})
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">Reason *</label>
                <Input
                  className="mrpsl-input"
                  placeholder="e.g. Withheld pool exhausted — shareholder claims pending"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">Narration (optional)</label>
                <Textarea
                  className="mrpsl-input resize-none"
                  rows={2}
                  placeholder="Additional context..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createRequest.isPending}>
              {createRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Refund Request Dialog */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setApproveTarget(null);
            setApproveComment("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Refund Request — {approveTarget?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              Approving will authorise the company to refund{" "}
              <span className="font-mono font-bold text-purple-600">
                {formatNaira(approveTarget?.requestedAmount ?? 0)}
              </span>{" "}
              back to MRPSL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-8 py-2">
            <div className="rounded-lg border divide-y text-sm">
              <div className="flex justify-between items-center p-3">
                <span className="text-muted-foreground">Declaration</span>
                <span className="font-bold">{approveTarget?.paymentNumber}</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-muted-foreground">Register</span>
                <span className="font-mono">{approveTarget?.registerSymbol}</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-muted-foreground">Amount to Refund</span>
                <span className="font-mono font-bold text-purple-600">
                  {formatNaira(approveTarget?.requestedAmount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-muted-foreground">Reason</span>
                <span className="font-sans text-[12px] text-right max-w-50">
                  {approveTarget?.reason}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="mrpsl-label">Approval Comment (optional)</label>
              <Textarea
                className="mrpsl-input resize-none"
                rows={2}
                placeholder="Add a comment for the audit trail..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveTarget(null);
                setApproveComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={approveRequest.isPending}
            >
              {approveRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
