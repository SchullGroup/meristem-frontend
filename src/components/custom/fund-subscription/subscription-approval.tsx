"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  UserCheck,
  Pencil,
  Check,
  X,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PaginationBar } from "@/components/custom/pagination-bar";
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
  amountPaid: number | null;
  submittedBy: string;
  submittedAt: Date;
  nextOfKin?: string;
  documents?: string[];
}

const MOCK_PENDING: PendingSubscription[] = [
  {
    id: "s1",
    ref: "SUB-2024-000001",
    fundName: "Stanbic IBTC Dollar Fund",
    register: "STANBIC-DOLLAR",
    subscriberType: "New",
    holderName: "Kolade Adeyemi",
    accountNo: "(new)",
    email: "kolade@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsSubscribed: 10_000,
    amountPaid: 500_000,
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-09-10T09:15:00"),
    nextOfKin: "Adebayo Oluwafemi",
    documents: ["Application_Form_Kolade.pdf", "National_ID_Kolade.jpg"],
  },
  {
    id: "s2",
    ref: "SUB-2024-000002",
    fundName: "ARM Discovery Balanced Fund",
    register: "ARM-DISCOVERY",
    subscriberType: "Existing",
    holderName: "Chinwe Okafor-Nwosu",
    accountNo: "FND-00234567",
    email: "chinwe@email.com",
    fundManagerEmail: "fm@armgroup.net",
    unitsSubscribed: 5_000,
    amountPaid: 125_000,
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-09-10T10:30:00"),
  },
  {
    id: "s3",
    ref: "SUB-2024-000003",
    fundName: "Coronation Money Market Fund",
    register: "CORONATION-MM",
    subscriberType: "New",
    holderName: "Blessing Amaechi",
    accountNo: "(new)",
    email: "blessing@email.com",
    fundManagerEmail: "fm@coronationam.com",
    unitsSubscribed: 50_000,
    amountPaid: 2_500_000,
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-09-10T11:00:00"),
    nextOfKin: "Chukwuemeka Amaechi",
    documents: [
      "Application_Form_Blessing.pdf",
      "Drivers_License_Blessing.jpg",
      "Utility_Bill.pdf",
    ],
  },
  {
    id: "s4",
    ref: "SUB-2024-000004",
    fundName: "Vetiva Griffin Fund",
    register: "VETIVA-EQUITY",
    subscriberType: "Existing",
    holderName: "Emeka Nwachukwu",
    accountNo: "FND-00345678",
    email: "emeka@email.com",
    fundManagerEmail: "fm@vetiva.com",
    unitsSubscribed: 20_000,
    amountPaid: null,
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-09-11T08:45:00"),
  },
  {
    id: "s5",
    ref: "SUB-2024-000005",
    fundName: "Stanbic IBTC Dollar Fund",
    register: "STANBIC-DOLLAR",
    subscriberType: "New",
    holderName: "Fatima Garba Abubakar",
    accountNo: "(new)",
    email: "fatima@email.com",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsSubscribed: 100_000,
    amountPaid: 5_000_000,
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-09-11T09:00:00"),
  },
  {
    id: "s6",
    ref: "SUB-2024-000006",
    fundName: "ARM Discovery Balanced Fund",
    register: "ARM-DISCOVERY",
    subscriberType: "New",
    holderName: "Adaeze Okonkwo",
    accountNo: "(new)",
    email: "adaeze@email.com",
    fundManagerEmail: "fm@armgroup.net",
    unitsSubscribed: 8_000,
    amountPaid: 200_000,
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-09-11T10:00:00"),
    documents: ["Application_Form_Adaeze.pdf"],
  },
  {
    id: "s7",
    ref: "SUB-2024-000007",
    fundName: "Coronation Money Market Fund",
    register: "CORONATION-MM",
    subscriberType: "Existing",
    holderName: "Ibrahim Usman Hassan",
    accountNo: "FND-00567890",
    email: "ibrahim@email.com",
    fundManagerEmail: "fm@coronationam.com",
    unitsSubscribed: 75_000,
    amountPaid: null,
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-09-12T14:20:00"),
  },
  {
    id: "s8",
    ref: "SUB-2024-000008",
    fundName: "Vetiva Griffin Fund",
    register: "VETIVA-EQUITY",
    subscriberType: "New",
    holderName: "Oluwakemi Oladipo",
    accountNo: "(new)",
    email: "kemi@email.com",
    fundManagerEmail: "fm@vetiva.com",
    unitsSubscribed: 15_000,
    amountPaid: 750_000,
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-09-12T15:00:00"),
  },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionApproval() {
  const [pending, setPending] = useState<PendingSubscription[]>(MOCK_PENDING);
  const [reviewing, setReviewing] = useState<PendingSubscription | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Editable fund manager email
  const [editingEmail, setEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const totalPages = Math.max(1, Math.ceil(pending.length / pageSize));
  const paginated = pending.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  const handleReview = (sub: PendingSubscription) => {
    setReviewing(sub);
    setEditingEmail(false);
    setEditedEmail("");
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    setApproving(true);
    await new Promise((r) => setTimeout(r, 800));
    setPending((prev) => prev.filter((s) => s.id !== reviewing.id));
    setApproving(false);
    setReviewing(null);
    toast.success(
      `Subscription ${reviewing.ref} approved. Email sent to ${reviewing.fundManagerEmail}.`,
    );
  };

  const handleReject = () => {
    if (!reviewing || !rejectRemark.trim()) return;
    setPending((prev) => prev.filter((s) => s.id !== reviewing.id));
    setRejectOpen(false);
    setRejectRemark("");
    toast.info(`Subscription ${reviewing.ref} rejected. Submitter notified.`);
    setReviewing(null);
  };

  const handleSaveEmail = async () => {
    if (!reviewing || !editedEmail.trim()) return;
    setSavingEmail(true);
    await new Promise((r) => setTimeout(r, 600));
    const updated = { ...reviewing, fundManagerEmail: editedEmail.trim() };
    setReviewing(updated);
    setPending((prev) =>
      prev.map((s) => (s.id === reviewing.id ? updated : s)),
    );
    setSavingEmail(false);
    setEditingEmail(false);
    toast.success("Fund manager email updated.");
  };

  /* ── Review panel ─────────────────────────────────────────────── */
  if (reviewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setReviewing(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </button>

        <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Awaiting CSCS Liaison and Recon Team Lead Approval
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Review the subscription details below. On approval, an automatic
                e-mail will be sent to the Fund Manager confirming completion.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Subscription Details — {reviewing.ref}
            </p>
            <Badge
              className={
                reviewing.subscriberType === "New"
                  ? "bg-blue-100 text-blue-800 border-0"
                  : "bg-violet-100 text-violet-800 border-0"
              }
            >
              {reviewing.subscriberType}{" "}
              {reviewing.subscriberType === "New"
                ? "Subscriber"
                : "Unit Holder"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="mrpsl-label">Fund Register</p>
              <p className="font-medium mt-0.5">{reviewing.fundName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Holder Name</p>
              <p className="font-medium mt-0.5">{reviewing.holderName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Account No.</p>
              <p className="font-medium mt-0.5 font-mono">
                {reviewing.accountNo}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Email</p>
              <p className="font-medium mt-0.5 break-all">{reviewing.email}</p>
            </div>

            {/* Editable Fund Manager Email */}
            <div>
              <p className="mrpsl-label">Fund Manager Email</p>
              {editingEmail ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    className="mrpsl-input h-8 text-sm w-56"
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEmail();
                      if (e.key === "Escape") setEditingEmail(false);
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2.5"
                    onClick={handleSaveEmail}
                    disabled={savingEmail || !editedEmail.trim()}
                  >
                    {savingEmail ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5"
                    onClick={() => setEditingEmail(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-medium break-all">
                    {reviewing.fundManagerEmail}
                  </p>
                  <button
                    type="button"
                    title="Edit fund manager email"
                    onClick={() => {
                      setEditedEmail(reviewing.fundManagerEmail);
                      setEditingEmail(true);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="mrpsl-label">Submitted By</p>
              <p className="font-medium mt-0.5">{reviewing.submittedBy}</p>
            </div>
            <div>
              <p className="mrpsl-label">Date Submitted</p>
              <p className="font-medium mt-0.5">
                {formatDate(reviewing.submittedAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="mrpsl-label">Units Subscribed</p>
              <p className="font-mono font-bold text-xl mt-0.5">
                {reviewing.unitsSubscribed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Amount Paid</p>
              <p className="font-mono font-bold text-xl mt-0.5">
                {reviewing.amountPaid != null ? (
                  `₦${reviewing.amountPaid.toLocaleString()}`
                ) : (
                  <span className="text-muted-foreground text-base font-normal">
                    Not provided
                  </span>
                )}
              </p>
            </div>
          </div>

          {reviewing.nextOfKin && (
            <div className="pt-2 border-t border-border text-sm">
              <p className="mrpsl-label mb-0.5">Next of Kin</p>
              <p className="font-medium">{reviewing.nextOfKin}</p>
            </div>
          )}

          {reviewing.documents && reviewing.documents.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="mrpsl-label">
                Supporting Documents ({reviewing.documents.length})
              </p>
              <div className="space-y-1.5">
                {reviewing.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 text-[13px]"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono truncate">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Notify Fund
                Manager
              </>
            )}
          </Button>
        </div>

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

  /* ── Queue table ──────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              CSCS Liaison and Recon Team Lead — Subscription Approval Queue
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {pending.length} subscription{pending.length !== 1 ? "s" : ""}{" "}
              pending your approval. E-mail notification fires automatically to
              the Fund Manager on each approval.
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
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">SUB NO.</th>
                  <th className="px-4 py-3 whitespace-nowrap">SHAREHOLDER</th>
                  <th className="px-4 py-3 whitespace-nowrap">TYPE</th>
                  <th className="px-4 py-3 whitespace-nowrap">FUND REGISTER</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    UNITS
                  </th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    AMOUNT PAID
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">DATE</th>
                  <th className="px-4 py-3 whitespace-nowrap">SUBMITTED BY</th>
                  <th className="px-4 py-3 whitespace-nowrap">STATUS</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((sub) => (
                  <tr
                    key={sub.id}
                    className="mrpsl-table-row hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground whitespace-nowrap">
                      {sub.ref}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {sub.holderName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          sub.subscriberType === "New"
                            ? "bg-blue-100 text-blue-800 border-0 whitespace-nowrap"
                            : "bg-violet-100 text-violet-800 border-0 whitespace-nowrap"
                        }
                      >
                        {sub.subscriberType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {sub.fundName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {sub.unitsSubscribed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {sub.amountPaid != null ? (
                        `₦${sub.amountPaid.toLocaleString()}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(sub.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {sub.submittedBy}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-amber-100 text-amber-800 border-0 whitespace-nowrap">
                        Pending
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" onClick={() => handleReview(sub)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            total={pending.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(0);
            }}
          />
        </Card>
      )}
    </div>
  );
}
