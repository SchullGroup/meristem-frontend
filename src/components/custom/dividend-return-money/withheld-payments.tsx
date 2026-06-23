"use client";

import { useState } from "react";
import { Loader2, AlertCircle, PlusCircle, ShieldAlert } from "lucide-react";
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
} from "@/hooks/useDividendReturnMoney";
import { formatNaira } from "@/lib/utils/format";
import { toast } from "sonner";

export function WithheldPaymentsTab() {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    shareholderName: "",
    accountNo: "",
    amount: "",
    narration: "",
  });

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

  const recordPayment = useRecordWithheldPayment();

  const remainingBalance = selectedRecord?.remainingBalance ?? 0;
  const isExhausted = remainingBalance <= 0 && !!selectedRecord;

  function resetForm() {
    setForm({ shareholderName: "", accountNo: "", amount: "", narration: "" });
  }

  function handleSubmit() {
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
          toast.success("Payment recorded successfully.");
          setDialogOpen(false);
          resetForm();
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
              onValueChange={(v) => setSelectedRecordId(Number(v))}
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
          <div className="grid grid-cols-3 gap-4">
            <Card className="mrpsl-card p-4 border-l-4 border-l-amber-500">
              <div className="mrpsl-section-title mb-1 text-amber-700">
                10% Originally Withheld
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600">
                {formatNaira(selectedRecord.withheldAmount)}
              </div>
            </Card>
            <Card className="mrpsl-card p-4 border-l-4 border-l-blue-500">
              <div className="mrpsl-section-title mb-1 text-blue-700">
                Paid to Shareholders
              </div>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {formatNaira(selectedRecord.totalPaidToShareholders)}
              </div>
            </Card>
            <Card
              className={`mrpsl-card p-4 border-l-4 ${
                isExhausted ? "border-l-red-500" : "border-l-green-500"
              }`}
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
                  The 10% withheld for{" "}
                  <strong>{selectedRecord.paymentNumber}</strong> has been fully
                  paid out. Use the{" "}
                  <strong>Refund Requests</strong> tab to request additional
                  funds from the company.
                </div>
              </div>
            </Card>
          )}

          {/* Record payment button */}
          <div className="flex justify-end">
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
                    <th className="p-3">DATE</th>
                    <th className="p-3">SHAREHOLDER</th>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3 text-right">AMOUNT</th>
                    <th className="p-3">REFERENCE</th>
                    <th className="p-3">APPROVED BY</th>
                    <th className="p-3">NARRATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[13px]">
                  {paymentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="p-3">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center text-muted-foreground font-sans"
                      >
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No payments from the withheld pool yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/5">
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
                        <td className="p-3 text-muted-foreground">
                          {p.reference}
                        </td>
                        <td className="p-3 font-sans">{p.approvedBy}</td>
                        <td className="p-3 font-sans text-muted-foreground text-[12px]">
                          {p.narration ?? "—"}
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
              Payment from the 10% withheld pool for{" "}
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
              onClick={handleSubmit}
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
    </div>
  );
}
