"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Mail, Loader2, UserCheck } from "lucide-react";
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

interface PendingSubscription {
  id: string;
  ref: string;
  fundName: string;
  register: string;
  subscriberType: "New" | "Existing";
  holderName: string;
  accountNo: string;
  email: string;
  fundManagerEmail: string;
  unitsSubscribed: number;
  amountPaid: number;
  submittedBy: string;
  submittedAt: Date;
}

const MOCK_PENDING: PendingSubscription[] = [
  {
    id: "s1", ref: "SUB-2024-000001",
    fundName: "Stanbic IBTC Dollar Fund", register: "STANBIC-DOLLAR",
    subscriberType: "New", holderName: "Kolade Adeyemi", accountNo: "(new)",
    email: "kolade@email.com", fundManagerEmail: "fm@stanbicastset.com",
    unitsSubscribed: 10_000, amountPaid: 500_000,
    submittedBy: "Ngozi Eze (Ops)", submittedAt: new Date("2024-09-10T09:15:00"),
  },
  {
    id: "s2", ref: "SUB-2024-000002",
    fundName: "ARM Discovery Balanced Fund", register: "ARM-DISCOVERY",
    subscriberType: "Existing", holderName: "Chinwe Okafor-Nwosu", accountNo: "FND-00234567",
    email: "chinwe@email.com", fundManagerEmail: "fm@armgroup.net",
    unitsSubscribed: 5_000, amountPaid: 125_000,
    submittedBy: "Tunde Bakare (Ops)", submittedAt: new Date("2024-09-10T10:30:00"),
  },
  {
    id: "s3", ref: "SUB-2024-000003",
    fundName: "Coronation Money Market Fund", register: "CORONATION-MM",
    subscriberType: "New", holderName: "Blessing Amaechi", accountNo: "(new)",
    email: "blessing@email.com", fundManagerEmail: "fm@coronationam.com",
    unitsSubscribed: 50_000, amountPaid: 2_500_000,
    submittedBy: "Halima Mohammed (Ops)", submittedAt: new Date("2024-09-10T11:00:00"),
  },
];

export function SubscriptionApproval() {
  const [pending, setPending] = useState<PendingSubscription[]>(MOCK_PENDING);
  const [reviewing, setReviewing] = useState<PendingSubscription | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");

  const handleApprove = async () => {
    if (!reviewing) return;
    setApproving(true);
    await new Promise((r) => setTimeout(r, 800));
    setPending((prev) => prev.filter((s) => s.id !== reviewing.id));
    setApproving(false);
    setReviewing(null);
    toast.success(`Subscription ${reviewing.ref} approved. E-mail notification sent to ${reviewing.fundManagerEmail}.`);
  };

  const handleReject = () => {
    if (!reviewing || !rejectRemark.trim()) return;
    setPending((prev) => prev.filter((s) => s.id !== reviewing.id));
    setRejectOpen(false);
    setRejectRemark("");
    toast.info(`Subscription ${reviewing.ref} rejected. Submitter notified.`);
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
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Awaiting CSCS Liaison and Recon Team Lead Approval</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Review the subscription details below. On approval, an automatic e-mail will be sent to the Fund Manager confirming completion.
              </p>
            </div>
          </div>
        </Card>

        {/* Detail card */}
        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscription Details — {reviewing.ref}</p>
            <Badge className={reviewing.subscriberType === "New" ? "bg-blue-100 text-blue-800 border-0" : "bg-violet-100 text-violet-800 border-0"}>
              {reviewing.subscriberType} {reviewing.subscriberType === "New" ? "Subscriber" : "Unit Holder"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { label: "Fund Register", value: reviewing.fundName },
              { label: "Holder Name", value: reviewing.holderName },
              { label: "Account No.", value: reviewing.accountNo },
              { label: "Email", value: reviewing.email },
              { label: "Fund Manager Email", value: reviewing.fundManagerEmail },
              { label: "Submitted By", value: reviewing.submittedBy },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="mrpsl-label">{label}</p>
                <p className="font-medium mt-0.5 break-all">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="mrpsl-label">Units Subscribed</p>
              <p className="font-mono font-bold text-xl mt-0.5">{reviewing.unitsSubscribed.toLocaleString()}</p>
            </div>
            <div>
              <p className="mrpsl-label">Amount Paid</p>
              <p className="font-mono font-bold text-xl mt-0.5">₦{reviewing.amountPaid.toLocaleString()}</p>
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
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Notify Fund Manager</>
            )}
          </Button>
        </div>

        {/* Reject dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Subscription</DialogTitle>
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
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={!rejectRemark.trim()} onClick={handleReject}>
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
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">CSCS Liaison and Recon Team Lead — Subscription Approval Queue</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {pending.length} subscription{pending.length !== 1 ? "s" : ""} pending your approval.
              E-mail notification fires automatically to the Fund Manager on each approval.
            </p>
          </div>
        </div>
      </Card>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm text-foreground">All caught up</p>
          <p className="text-xs mt-1">No subscriptions pending approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => (
            <Card key={sub.id} className="mrpsl-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{sub.holderName}</span>
                    <Badge className={sub.subscriberType === "New" ? "bg-blue-100 text-blue-800 border-0" : "bg-violet-100 text-violet-800 border-0"}>
                      {sub.subscriberType}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">{sub.ref}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sub.fundName} · {sub.unitsSubscribed.toLocaleString()} units · ₦{sub.amountPaid.toLocaleString()} · Submitted by {sub.submittedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {sub.fundManagerEmail}
                  </div>
                  <Button size="sm" onClick={() => setReviewing(sub)}>
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
