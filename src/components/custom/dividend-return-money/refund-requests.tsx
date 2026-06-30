"use client";

import { useState } from "react";
import {
  Loader2, AlertCircle, PlusCircle, Calculator,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useReturnRecords,
  useRefundRequests,
  useCreateRefundRequest,
  useApproveRefundRequest,
  useRejectRefundRequest,
} from "@/hooks/useDividendReturnMoney";
import { useStore } from "@/lib/store";
import type { RefundRequest, RefundRequestStatus } from "@/types/dividend-return-money";
import { formatNaira } from "@/lib/utils/format";
import { toast } from "sonner";

const STATUS_META: Record<RefundRequestStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  FIRST_APPROVED: { label: "L1 Approved", className: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED: { label: "Fully Approved", className: "bg-green-50 text-green-700 border-green-200" },
  RECEIVED: { label: "Received", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
};

export function RefundRequestsTab() {
  const currentUser = useStore((s) => s.currentUser);

  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // New request dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestPercentage, setRequestPercentage] = useState("");
  const [reason, setReason] = useState("");
  const [narration, setNarration] = useState("");

  // Unified review dialog
  const [reviewTarget, setReviewTarget] = useState<RefundRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const { data: recordsData, isLoading: recordsLoading } = useReturnRecords({ size: 100 });
  const records = recordsData?.content ?? [];
  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  const { data: requestsData, isLoading: requestsLoading } = useRefundRequests({ size: 50 });
  const requests = requestsData?.content ?? [];

  const createRequest = useCreateRefundRequest();
  const approveRequest = useApproveRefundRequest();
  const rejectRequest = useRejectRefundRequest();

  const pct = parseFloat(requestPercentage) || 0;
  const requestedNaira = selectedRecord ? (selectedRecord.returnAmount * pct) / 100 : 0;
  const shortfallNaira = selectedRecord
    ? Math.max(0, selectedRecord.totalPaidToShareholders - selectedRecord.withheldAmount)
    : 0;
  const suggestedPct = selectedRecord && selectedRecord.returnAmount > 0
    ? (shortfallNaira / selectedRecord.returnAmount) * 100
    : 0;

  function resetForm() { setRequestPercentage(""); setReason(""); setNarration(""); }
  function closeReview() { setReviewTarget(null); setReviewAction(null); setReviewComment(""); }

  function handleSubmit() {
    if (!selectedRecordId) return;
    if (pct <= 0 || pct > 90) { toast.error("Enter a percentage between 0 and 90."); return; }
    if (!reason.trim()) { toast.error("Please provide a reason for the refund request."); return; }
    createRequest.mutate(
      { returnRecordId: selectedRecordId, requestedAmount: requestedNaira, reason: reason.trim(), narration: narration.trim() || undefined, initiatedBy: currentUser?.username ?? "Unknown" },
      {
        onSuccess: () => { toast.success("Refund request submitted. Awaiting approval."); setDialogOpen(false); resetForm(); },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleReview() {
    if (!reviewTarget || !reviewAction) return;
    if (reviewAction === "reject" && !reviewComment.trim()) { toast.error("A comment is required when rejecting."); return; }

    if (reviewAction === "reject") {
      rejectRequest.mutate(
        { id: reviewTarget.id, comment: reviewComment.trim() },
        {
          onSuccess: () => { toast.success(`Request for ${reviewTarget.paymentNumber} rejected.`); closeReview(); },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      const step = reviewTarget.status === "PENDING" ? "first" : "final";
      approveRequest.mutate(
        { id: reviewTarget.id, step, comment: reviewComment.trim() || undefined },
        {
          onSuccess: () => {
            const label = step === "first" ? `L1 approval granted for ${reviewTarget.paymentNumber}.` : `Final approval granted for ${reviewTarget.paymentNumber}.`;
            toast.success(label);
            closeReview();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    }
  }

  const reviewStep = reviewTarget?.status === "PENDING" ? "first" : "final";
  const isReviewPending = approveRequest.isPending || rejectRequest.isPending;

  return (
    <div className="space-y-6">
      {/* Explanation card */}
      <Card className="mrpsl-card p-4 bg-blue-50/30 border-blue-200">
        <div className="flex gap-3 items-start">
          <Calculator className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <div className="font-semibold">Reimbursement Requests — Two-Step Approval</div>
            <div className="text-[13px] leading-relaxed">
              When the 10% withheld pool is exhausted, raise a request to recover funds from the company.
              Each request goes through Level 1 then Final approval before funds are released.
              Rejection at either step requires a mandatory comment.
            </div>
          </div>
        </div>
      </Card>

      {/* Declaration picker + new request button */}
      <div className="flex items-end gap-3">
        <div>
          <label className="mrpsl-label">Declaration</label>
          {recordsLoading ? <Skeleton className="h-9 w-64" /> : (
            <Select value={selectedRecordId?.toString() ?? ""} onValueChange={(v) => setSelectedRecordId(Number(v))}>
              <SelectTrigger className="mrpsl-input w-64"><SelectValue placeholder="Select declaration..." /></SelectTrigger>
              <SelectContent>
                {records.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    <span className="font-bold">{r.paymentNumber}</span>{" "}
                    <span className="text-muted-foreground text-sm">— {r.registerSymbol}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {selectedRecord && (
          <Button size="xl" className="gap-2" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            New Refund Request
          </Button>
        )}
      </div>

      {/* Selected record balance snapshot */}
      {selectedRecord && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="mrpsl-card p-3">
            <div className="mrpsl-section-title mb-1 text-green-700">90% Returned</div>
            <div className="text-lg font-bold font-mono text-green-600">{formatNaira(selectedRecord.returnAmount)}</div>
          </Card>
          <Card className="mrpsl-card p-3">
            <div className="mrpsl-section-title mb-1 text-amber-700">10% Withheld</div>
            <div className="text-lg font-bold font-mono text-amber-600">{formatNaira(selectedRecord.withheldAmount)}</div>
          </Card>
          <Card className="mrpsl-card p-3">
            <div className="mrpsl-section-title mb-1 text-blue-700">Paid to SHs</div>
            <div className="text-lg font-bold font-mono text-blue-600">{formatNaira(selectedRecord.totalPaidToShareholders)}</div>
          </Card>
          <Card className={`mrpsl-card p-3 ${selectedRecord.remainingBalance <= 0 ? "border-l-4 border-l-red-500" : ""}`}>
            <div className={`mrpsl-section-title mb-1 ${selectedRecord.remainingBalance <= 0 ? "text-red-700" : "text-green-700"}`}>Remaining</div>
            <div className={`text-lg font-bold font-mono ${selectedRecord.remainingBalance <= 0 ? "text-red-600" : "text-green-600"}`}>
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
                <th className="p-3">INITIATED BY</th>
                <th className="p-3 text-right">REQUESTED</th>
                <th className="p-3">REASON</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[13px]">
              {requestsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="p-3"><Skeleton className="h-4 w-20" /></td>
                  ))}</tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground font-sans">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No refund requests raised yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const meta = STATUS_META[req.status];
                  const canReview = req.status === "PENDING" || req.status === "FIRST_APPROVED";
                  return (
                    <tr key={req.id} className="hover:bg-accent/5">
                      <td className="p-3 text-muted-foreground">{req.requestDate}</td>
                      <td className="p-3 font-bold text-primary">{req.paymentNumber}</td>
                      <td className="p-3 font-sans">{req.registerSymbol}</td>
                      <td className="p-3 font-sans text-[12px]">{req.initiatedBy}</td>
                      <td className="p-3 text-right font-bold text-purple-600">{formatNaira(req.requestedAmount)}</td>
                      <td className="p-3 font-sans text-[12px] text-muted-foreground max-w-40 truncate">{req.reason}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[11px] ${meta.className}`}>{meta.label}</Badge>
                        {req.status === "REJECTED" && req.rejectionComment && (
                          <div className="text-[10px] text-red-600 mt-1 max-w-32 truncate font-sans">{req.rejectionComment}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {canReview && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => setReviewTarget(req)}>
                            Review
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

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              New Reimbursement — {selectedRecord?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              Enter the percentage of the 90% returned to the company that you want reimbursed.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 px-8 py-2">
              <div className="rounded-lg border divide-y text-sm">
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">90% Returned to Company</span>
                  <span className="font-mono font-bold text-green-600">{formatNaira(selectedRecord.returnAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">10% Originally Withheld</span>
                  <span className="font-mono font-bold text-amber-600">{formatNaira(selectedRecord.withheldAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Total Paid to Shareholders</span>
                  <span className="font-mono font-bold text-blue-600">{formatNaira(selectedRecord.totalPaidToShareholders)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30">
                  <span className="font-medium">Withheld Remaining</span>
                  <span className={`font-mono font-bold ${selectedRecord.remainingBalance <= 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatNaira(selectedRecord.remainingBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">% of 90% Return to Request Back *</label>
                <div className="relative">
                  <Input type="number" min="0" max="90" step="0.01" className="mrpsl-input pr-8" placeholder="e.g. 5"
                    value={requestPercentage}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      setRequestPercentage(!isNaN(num) && num > 90 ? "90" : e.target.value);
                    }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">%</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Calculated amount:</span>
                  <span className="font-mono font-bold text-purple-600">{pct > 0 ? formatNaira(requestedNaira) : "—"}</span>
                </div>
                {suggestedPct > 0 && (
                  <button type="button" className="text-xs text-primary underline"
                    onClick={() => setRequestPercentage(suggestedPct.toFixed(2))}>
                    Use shortfall %: {suggestedPct.toFixed(2)}% ({formatNaira(shortfallNaira)})
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">Reason *</label>
                <Input className="mrpsl-input" placeholder="e.g. Withheld pool exhausted — shareholder claims pending"
                  value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">Narration (optional)</label>
                <Textarea className="mrpsl-input resize-none" rows={2} placeholder="Additional context..."
                  value={narration} onChange={(e) => setNarration(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createRequest.isPending}>
              {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(open) => { if (!open) closeReview(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Request — {reviewTarget?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              {reviewStep === "first"
                ? "Grant Level 1 approval or reject this reimbursement request."
                : "Grant Final approval to authorise the company refund, or reject."}
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-4 px-8 py-2">
              <div className="rounded-lg border divide-y text-sm">
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Declaration</span>
                  <span className="font-bold">{reviewTarget.paymentNumber}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Register</span>
                  <span className="font-mono">{reviewTarget.registerSymbol}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Amount to Refund</span>
                  <span className="font-mono font-bold text-purple-600">{formatNaira(reviewTarget.requestedAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Initiated by</span>
                  <span className="font-sans">{reviewTarget.initiatedBy}</span>
                </div>
                <div className="flex justify-between items-start p-3 gap-4">
                  <span className="text-muted-foreground shrink-0">Reason</span>
                  <span className="font-sans text-[12px] text-right">{reviewTarget.reason}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Current step</span>
                  <Badge variant="outline" className={`text-[11px] ${STATUS_META[reviewTarget.status].className}`}>
                    {reviewStep === "first" ? "Awaiting L1 Approval" : "Awaiting Final Approval"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Comment {reviewAction === "reject" ? "*" : "(optional)"}
                </label>
                <Textarea
                  className={`mrpsl-input resize-none ${reviewAction === "reject" ? "border-red-200 focus:border-red-400" : ""}`}
                  rows={2}
                  placeholder={reviewAction === "reject" ? "State the reason for rejection..." : "Add a comment for the audit trail..."}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={isReviewPending || (reviewAction === "reject" && !reviewComment.trim())}
              onClick={() => { setReviewAction("reject"); handleReview(); }}
            >
              {isReviewPending && reviewAction === "reject" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
            <Button
              className={`flex-1 ${reviewStep === "final" ? "bg-green-600 hover:bg-green-700" : ""}`}
              disabled={isReviewPending}
              onClick={() => { setReviewAction("approve"); handleReview(); }}
            >
              {isReviewPending && reviewAction === "approve" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewStep === "first" ? "L1 Approve" : "Final Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
