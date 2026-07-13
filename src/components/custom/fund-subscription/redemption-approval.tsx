"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PendingRedemption {
  id: string;
  ref: string;
  fundName: string;
  holderName: string;
  accountNo: string;
  fundManagerEmail: string;
  unitsRequested: number;
  redemptionPrice: number;
  totalAmount: number;
  redemptionAccount: string;
  redemptionDate: Date;
  datePayable: Date;
  submittedBy: string;
  submittedAt: Date;
}

const MOCK_PENDING: PendingRedemption[] = [
  {
    id: "rd1",
    ref: "REDM-2024-000001",
    fundName: "Stanbic IBTC Dollar Fund",
    holderName: "Adebayo Oluwaseun",
    accountNo: "FND-00123456",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsRequested: 5_000,
    redemptionPrice: 125.5,
    totalAmount: 627_500,
    redemptionAccount: "0123456789 (Access Bank)",
    redemptionDate: new Date("2024-09-12"),
    datePayable: new Date("2024-09-15"),
    submittedBy: "Ngozi Eze (Ops)",
    submittedAt: new Date("2024-09-11T09:00:00"),
  },
  {
    id: "rd2",
    ref: "REDM-2024-000002",
    fundName: "Coronation Money Market Fund",
    holderName: "Fatima Garba Abubakar",
    accountNo: "FND-00456789",
    fundManagerEmail: "fm@coronationam.com",
    unitsRequested: 30_000,
    redemptionPrice: 1.02,
    totalAmount: 30_600,
    redemptionAccount: "0456789012 (Zenith Bank)",
    redemptionDate: new Date("2024-09-12"),
    datePayable: new Date("2024-09-14"),
    submittedBy: "Tunde Bakare (Ops)",
    submittedAt: new Date("2024-09-11T10:45:00"),
  },
];

export function RedemptionApproval() {
  const [pending, setPending] = useState<PendingRedemption[]>(MOCK_PENDING);
  const [reviewing, setReviewing] = useState<PendingRedemption | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");

  const handleApprove = async () => {
    if (!reviewing) return;
    setApproving(true);
    await new Promise((r) => setTimeout(r, 900));
    setPending((prev) => prev.filter((r) => r.id !== reviewing.id));
    setApproving(false);
    toast.success(
      `Redemption ${reviewing.ref} approved. ${reviewing.unitsRequested.toLocaleString()} units deducted from ${reviewing.holderName}'s balance. ₦${reviewing.totalAmount.toLocaleString()} scheduled for payment. E-notification sent to ${reviewing.fundManagerEmail}.`,
    );
    setReviewing(null);
  };

  const handleReject = () => {
    if (!reviewing || !rejectRemark.trim()) return;
    setPending((prev) => prev.filter((r) => r.id !== reviewing.id));
    toast.info(`Redemption ${reviewing.ref} rejected. Submitter notified.`);
    setRejectOpen(false);
    setRejectRemark("");
    setReviewing(null);
  };

  if (reviewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setReviewing(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </button>

        {/* Approval banner */}
        <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Awaiting Approval — Redemption {reviewing.ref}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                On approval: units are deducted from the holder&apos;s balance,
                the redemption amount is scheduled for payment, and an
                e-notification fires immediately to the Fund Manager.
              </p>
            </div>
          </div>
        </Card>

        {/* Detail card */}
        <Card className="mrpsl-card p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Redemption Details
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { label: "Fund Register", value: reviewing.fundName },
              { label: "Unit Holder", value: reviewing.holderName },
              { label: "Account No.", value: reviewing.accountNo },
              {
                label: "Fund Manager Email",
                value: reviewing.fundManagerEmail,
              },
              {
                label: "Redemption Account",
                value: reviewing.redemptionAccount,
              },
              { label: "Submitted By", value: reviewing.submittedBy },
              {
                label: "Redemption Date",
                value: format(reviewing.redemptionDate, "dd MMM yyyy"),
              },
              {
                label: "Date Payable",
                value: format(reviewing.datePayable, "dd MMM yyyy"),
              },
              {
                label: "Submitted At",
                value: format(reviewing.submittedAt, "dd MMM yyyy, HH:mm"),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="mrpsl-label">{label}</p>
                <p className="font-medium mt-0.5 break-all">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
            <div>
              <p className="mrpsl-label">Units to Redeem</p>
              <p className="font-mono font-bold text-xl mt-0.5 text-destructive">
                {reviewing.unitsRequested.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Price per Unit</p>
              <p className="font-mono font-bold text-xl mt-0.5">
                ₦{reviewing.redemptionPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Total Redemption Amount</p>
              <p className="font-mono font-bold text-xl mt-0.5 text-primary">
                ₦{reviewing.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="destructive" onClick={() => setRejectOpen(true)}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={approving}>
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Redemption
              </>
            )}
          </Button>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Redemption</DialogTitle>
              <DialogDescription>
                Provide a reason for rejection. The initiator will be notified.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              className="mrpsl-input resize-none"
              rows={3}
              placeholder="Reason for rejection…"
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectRemark.trim()}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Approval banner — list view */}
      <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Redemption Approval Queue
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {pending.length} redemption{pending.length !== 1 ? "s" : ""}{" "}
              pending approval. Approval triggers immediate unit deduction and
              Fund Manager e-notification.
            </p>
          </div>
        </div>
      </Card>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm text-foreground">All caught up</p>
          <p className="text-xs mt-1">No redemptions pending approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((red) => (
            <Card key={red.id} className="mrpsl-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {red.holderName}
                    </span>
                    <Badge className="bg-amber-100 text-amber-800 border-0">
                      Pending Approval
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {red.ref}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {red.fundName} · {red.unitsRequested.toLocaleString()} units
                    · ₦{red.totalAmount.toLocaleString()} · Payable{" "}
                    {format(red.datePayable, "dd MMM yyyy")} · Submitted by{" "}
                    {red.submittedBy}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setReviewing(red)}
                  className="shrink-0"
                >
                  Review
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
