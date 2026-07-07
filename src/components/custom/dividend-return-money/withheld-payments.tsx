"use client";

import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  PlusCircle,
  ShieldAlert,
  Bell,
  BellRing,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
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
  useWithheldPayments,
  useRecordWithheldPayment,
  useReviewWithheldPayment,
  useBulkApproveWithheldPayments,
  useSetNotificationThreshold,
} from "@/hooks/useDividendReturnMoney";
import { formatNaira } from "@/lib/utils/format";
import { toast } from "sonner";
import type { WithheldPayment } from "@/types/dividend-return-money";

export function WithheldPaymentsTab() {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // New payment dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    shareholderName: "",
    accountNo: "",
    amount: "",
    narration: "",
  });

  // Review dialog (approve/reject individual)
  const [reviewTarget, setReviewTarget] = useState<WithheldPayment | null>(
    null,
  );
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [reviewComment, setReviewComment] = useState("");

  // Bulk approve
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  // Threshold
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("");

  const { data: recordsData, isLoading: recordsLoading } = useReturnRecords({
    size: 100,
  });
  const records = recordsData?.content ?? [];
  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  const { data: paymentsData, isLoading: paymentsLoading } =
    useWithheldPayments({
      returnRecordId: selectedRecordId ?? undefined,
      size: 50,
    });
  const payments = paymentsData?.content ?? [];
  const pendingPayments = payments.filter((p) => p.status === "PENDING");

  const recordPayment = useRecordWithheldPayment();
  const reviewPayment = useReviewWithheldPayment();
  const bulkApprove = useBulkApproveWithheldPayments();
  const setThresholdMutation = useSetNotificationThreshold();

  const withheldAmount = selectedRecord?.withheldAmount ?? 0;
  const totalReimbursed = selectedRecord?.totalReimbursed ?? 0;
  const effectivePool = withheldAmount + totalReimbursed;
  const remainingBalance = selectedRecord?.remainingBalance ?? 0;
  const isExhausted = remainingBalance <= 0 && !!selectedRecord;
  const threshold = selectedRecord?.notificationThreshold ?? null;

  // Checkbox helpers
  const allPendingSelected =
    pendingPayments.length > 0 &&
    pendingPayments.every((p) => selectedIds.has(p.id));
  function toggleAll() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingPayments.map((p) => p.id)));
    }
  }
  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetForm() {
    setForm({ shareholderName: "", accountNo: "", amount: "", narration: "" });
  }

  function closeReview() {
    setReviewTarget(null);
    setReviewAction(null);
    setReviewComment("");
  }

  function handleSubmitPayment() {
    if (!selectedRecordId) return;
    const amount = parseFloat(form.amount);
    if (!form.shareholderName.trim()) {
      toast.error("Shareholder name is required.");
      return;
    }
    if (!form.accountNo.trim()) {
      toast.error("Account number is required.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (amount > remainingBalance) {
      toast.error(
        `Amount exceeds withheld balance of ${formatNaira(remainingBalance)}.`,
      );
      return;
    }

    recordPayment.mutate(
      {
        returnRecordId: selectedRecordId,
        shareholderName: form.shareholderName.trim(),
        accountNo: form.accountNo.trim(),
        amount,
        narration: form.narration.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded — awaiting approval.");
          setDialogOpen(false);
          resetForm();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleReview() {
    if (!reviewTarget || !reviewAction) return;
    if (reviewAction === "reject" && !reviewComment.trim()) {
      toast.error("A comment is required when rejecting.");
      return;
    }
    reviewPayment.mutate(
      {
        id: reviewTarget.id,
        action: reviewAction,
        comment: reviewComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            reviewAction === "approve"
              ? "Payment approved."
              : "Payment rejected.",
          );
          closeReview();
          setSelectedIds((prev) => {
            const n = new Set(prev);
            n.delete(reviewTarget.id);
            return n;
          });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleBulkApprove() {
    bulkApprove.mutate(
      { ids: Array.from(selectedIds) },
      {
        onSuccess: () => {
          toast.success(`${selectedIds.size} payment(s) approved.`);
          setBulkConfirmOpen(false);
          setSelectedIds(new Set());
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleSetThreshold() {
    if (!selectedRecordId) return;
    const amt = parseFloat(thresholdInput);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid threshold amount.");
      return;
    }
    setThresholdMutation.mutate(
      { returnRecordId: selectedRecordId, thresholdAmount: amt },
      {
        onSuccess: () => {
          toast.success(`Threshold set to ${formatNaira(amt)}.`);
          setThresholdOpen(false);
          setThresholdInput("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Declaration selector */}
      <Card className="mrpsl-card p-4">
        <div className="space-y-1.5">
          <label className="mrpsl-label">Select Declaration</label>
          {recordsLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            <Select
              value={selectedRecordId?.toString() ?? ""}
              onValueChange={(v) => {
                setSelectedRecordId(Number(v));
                setSelectedIds(new Set());
              }}
            >
              <SelectTrigger className="mrpsl-input w-72">
                <SelectValue placeholder="Choose a declaration..." />
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
      </Card>

      {selectedRecord && (
        <>
          {/* Balance summary */}
          <div
            className={`grid gap-4 ${totalReimbursed > 0 ? "grid-cols-4" : "grid-cols-3"}`}
          >
            <Card className="mrpsl-card p-4 border-l-4 border-l-amber-500">
              <div className="mrpsl-section-title mb-1 text-amber-700">
                10% Originally Withheld
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600">
                {formatNaira(withheldAmount)}
              </div>
            </Card>
            {totalReimbursed > 0 && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-purple-500">
                <div className="mrpsl-section-title mb-1 text-purple-700">
                  Reimbursements Received
                </div>
                <div className="text-2xl font-bold font-mono text-purple-600">
                  {formatNaira(totalReimbursed)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Effective pool: {formatNaira(effectivePool)}
                </div>
              </Card>
            )}
            <Card className="mrpsl-card p-4 border-l-4 border-l-blue-500">
              <div className="mrpsl-section-title mb-1 text-blue-700">
                Paid to Shareholders
              </div>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {formatNaira(selectedRecord.totalPaidToShareholders)}
              </div>
              {totalReimbursed > 0 && effectivePool > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {(
                    (selectedRecord.totalPaidToShareholders / effectivePool) *
                    100
                  ).toFixed(1)}
                  % of effective pool
                </div>
              )}
            </Card>
            <Card
              className={`mrpsl-card p-4 border-l-4 ${isExhausted ? "border-l-red-500" : "border-l-green-500"}`}
            >
              <div
                className={`mrpsl-section-title mb-1 ${isExhausted ? "text-red-700" : "text-green-700"}`}
              >
                Remaining Balance
              </div>
              <div
                className={`text-2xl font-bold font-mono ${isExhausted ? "text-red-600" : "text-green-600"}`}
              >
                {formatNaira(remainingBalance)}
              </div>
              {effectivePool > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {((remainingBalance / effectivePool) * 100).toFixed(1)}% of
                  effective pool
                </div>
              )}
            </Card>
          </div>

          {/* Exhausted warning */}
          {isExhausted && (
            <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-red-800">
                  Withheld Pool Exhausted
                </div>
                <div className="text-[13px] text-red-700 mt-0.5">
                  The withheld pool for{" "}
                  <strong>{selectedRecord.paymentNumber}</strong> has been fully
                  paid out. Use the <strong>Reimburse Requests</strong> tab to
                  request additional funds from the company.
                </div>
              </div>
            </Card>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[13px]"
                onClick={() => {
                  setThresholdInput(threshold ? String(threshold) : "");
                  setThresholdOpen(true);
                }}
              >
                {threshold ? (
                  <>
                    <BellRing className="h-4 w-4 text-amber-500" />
                    Threshold: {formatNaira(threshold)}
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Set Notification Threshold
                  </>
                )}
              </Button>

              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  className="gap-2 bg-primary text-[13px]"
                  onClick={() => setBulkConfirmOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Selected ({selectedIds.size})
                </Button>
              )}
            </div>

            <Button
              onClick={() => setDialogOpen(true)}
              disabled={isExhausted}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Record Shareholder Payment
            </Button>
          </div>

          {/* Payments table */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3 w-8">
                      {pendingPayments.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={toggleAll}
                          className="rounded accent-primary"
                          title="Select all pending"
                        />
                      )}
                    </th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">SHAREHOLDER</th>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3 text-right">AMOUNT</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">REFERENCE</th>
                    <th className="p-3">APPROVED BY</th>
                    <th className="p-3">NARRATION</th>
                    <th className="p-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[13px]">
                  {paymentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 10 }).map((__, j) => (
                          <td key={j} className="p-3">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-12 text-center text-muted-foreground font-sans"
                      >
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No payments from the withheld pool yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-accent/5 ${p.status === "PENDING" ? "bg-amber-50/20" : ""}`}
                      >
                        <td className="p-3">
                          {p.status === "PENDING" && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(p.id)}
                              onChange={() => toggleOne(p.id)}
                              className="rounded accent-primary"
                            />
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {p.paymentDate}
                        </td>
                        <td className="p-3 font-sans font-medium">
                          {p.shareholderName}
                        </td>
                        <td className="p-3">{p.accountNo}</td>
                        <td className="p-3 text-right font-bold text-blue-600">
                          {formatNaira(p.amount)}
                        </td>
                        <td className="p-3">
                          {p.status === "PENDING" && (
                            <Badge
                              variant="outline"
                              className="text-[11px] bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Pending
                            </Badge>
                          )}
                          {p.status === "APPROVED" && (
                            <Badge
                              variant="outline"
                              className="text-[11px] bg-green-50 text-green-700 border-green-200"
                            >
                              Approved
                            </Badge>
                          )}
                          {p.status === "REJECTED" && (
                            <div>
                              <Badge
                                variant="outline"
                                className="text-[11px] bg-red-50 text-red-700 border-red-200"
                              >
                                Rejected
                              </Badge>
                              {p.rejectionComment && (
                                <div className="text-[10px] text-red-600 mt-0.5 max-w-28 truncate font-sans">
                                  {p.rejectionComment}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {p.reference}
                        </td>
                        <td className="p-3 font-sans">{p.approvedBy ?? "—"}</td>
                        <td className="p-3 font-sans text-muted-foreground text-[12px]">
                          {p.narration ?? "—"}
                        </td>
                        <td className="p-3">
                          {p.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setReviewTarget(p)}
                            >
                              Review
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Record Payment Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Shareholder Payment</DialogTitle>
            <DialogDescription>
              Payment from the withheld pool for{" "}
              <strong>{selectedRecord?.paymentNumber}</strong>. Available
              balance:{" "}
              <span className="font-mono font-bold text-green-600">
                {formatNaira(remainingBalance)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-8 py-2">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Shareholder Name *</label>
              <Input
                className="mrpsl-input"
                placeholder="e.g. John Doe"
                value={form.shareholderName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shareholderName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Account No *</label>
              <Input
                className="mrpsl-input"
                placeholder="e.g. 10029"
                value={form.accountNo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountNo: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Amount *</label>
              <Input
                type="number"
                className="mrpsl-input"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
              <div className="text-xs text-muted-foreground">
                Max: {formatNaira(remainingBalance)}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Narration (optional)</label>
              <Textarea
                className="mrpsl-input resize-none"
                rows={2}
                placeholder="Reason for payment..."
                value={form.narration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, narration: e.target.value }))
                }
              />
            </div>
          </div>
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
            <Button
              onClick={handleSubmitPayment}
              disabled={recordPayment.isPending}
            >
              {recordPayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Payment Dialog */}
      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) closeReview();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Payment — {reviewTarget?.shareholderName}
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject this pending shareholder payment.
            </DialogDescription>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-4 px-8 py-2">
              <div className="rounded-lg border divide-y text-sm">
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Shareholder</span>
                  <span className="font-sans font-medium">
                    {reviewTarget.shareholderName}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Account No</span>
                  <span className="font-mono">{reviewTarget.accountNo}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-bold text-blue-600">
                    {formatNaira(reviewTarget.amount)}
                  </span>
                </div>
                {reviewTarget.narration && (
                  <div className="flex justify-between items-start p-3 gap-4">
                    <span className="text-muted-foreground shrink-0">
                      Narration
                    </span>
                    <span className="font-sans text-[12px] text-right">
                      {reviewTarget.narration}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Comment {reviewAction === "reject" ? "*" : "(optional)"}
                </label>
                <Textarea
                  className={`mrpsl-input resize-none ${reviewAction === "reject" ? "border-red-200 focus:border-red-400" : ""}`}
                  rows={2}
                  placeholder={
                    reviewAction === "reject"
                      ? "State the reason for rejection..."
                      : "Add a comment for the audit trail..."
                  }
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
              disabled={
                reviewPayment.isPending ||
                (reviewAction === "reject" && !reviewComment.trim())
              }
              onClick={() => {
                setReviewAction("reject");
                handleReview();
              }}
            >
              {reviewPayment.isPending && reviewAction === "reject" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </Button>
            <Button
              className="flex-1 bg-primary"
              disabled={reviewPayment.isPending}
              onClick={() => {
                setReviewAction("approve");
                handleReview();
              }}
            >
              {reviewPayment.isPending && reviewAction === "approve" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Confirmation */}
      <Dialog
        open={bulkConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setBulkConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Approve {selectedIds.size} Payment(s)
            </DialogTitle>
            <DialogDescription>
              This will approve all {selectedIds.size} selected pending
              payment(s) at once. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleBulkApprove}
              disabled={bulkApprove.isPending}
            >
              {bulkApprove.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Threshold Dialog */}
      <Dialog
        open={thresholdOpen}
        onOpenChange={(open) => {
          if (!open) {
            setThresholdOpen(false);
            setThresholdInput("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Notification Threshold
            </DialogTitle>
            <DialogDescription>
              When the withheld pool balance falls below this amount, the system
              sends an email notification to initiate a reimbursement request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-8 py-2">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Threshold Amount *</label>
              <Input
                type="number"
                className="mrpsl-input font-mono"
                placeholder="e.g. 100000"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
              />
              {parseFloat(thresholdInput) > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  Notify when balance drops below{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {formatNaira(parseFloat(thresholdInput))}
                  </span>
                  {effectivePool > 0 && (
                    <>
                      {" "}
                      (
                      {(
                        (parseFloat(thresholdInput) / effectivePool) *
                        100
                      ).toFixed(1)}
                      % of pool)
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setThresholdOpen(false);
                setThresholdInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetThreshold}
              disabled={setThresholdMutation.isPending}
            >
              {setThresholdMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Threshold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
