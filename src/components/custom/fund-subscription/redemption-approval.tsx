"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserCheck,
  Loader2,
  FileText,
  Pencil,
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

interface PendingRedemption {
  id: string;
  ref: string;
  fundName: string;
  holderName: string;
  accountNo: string;
  fundManagerEmail: string;
  unitsRequested: number;
  redemptionDate: Date;
  datePayable: Date;
  submittedBy: string;
  submittedAt: Date;
  narration?: string;
  documents?: string[];
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
    redemptionDate: new Date("2024-09-12"),
    datePayable: new Date("2024-09-15"),
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-09-11T09:00:00"),
    narration: "Partial redemption as instructed by unit holder.",
    documents: ["Redemption_Form_Adebayo.pdf", "ID_Adebayo.jpg"],
  },
  {
    id: "rd2",
    ref: "REDM-2024-000002",
    fundName: "Coronation Money Market Fund",
    holderName: "Fatima Garba Abubakar",
    accountNo: "FND-00456789",
    fundManagerEmail: "fm@coronationam.com",
    unitsRequested: 30_000,
    redemptionDate: new Date("2024-09-12"),
    datePayable: new Date("2024-09-14"),
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-09-11T10:45:00"),
  },
  {
    id: "rd3",
    ref: "REDM-2024-000003",
    fundName: "ARM Discovery Balanced Fund",
    holderName: "Chinwe Okafor-Nwosu",
    accountNo: "FND-00234567",
    fundManagerEmail: "fm@armgroup.net",
    unitsRequested: 8_500,
    redemptionDate: new Date("2024-09-13"),
    datePayable: new Date("2024-09-16"),
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-09-12T08:30:00"),
    narration: "Full redemption — unit holder closing account.",
    documents: ["Redemption_Form_Chinwe.pdf"],
  },
  {
    id: "rd4",
    ref: "REDM-2024-000004",
    fundName: "Stanbic IBTC Dollar Fund",
    holderName: "Emeka Nwachukwu",
    accountNo: "FND-00345678",
    fundManagerEmail: "fm@stanbicastset.com",
    unitsRequested: 12_000,
    redemptionDate: new Date("2024-09-14"),
    datePayable: new Date("2024-09-17"),
    submittedBy: "Ngozi Eze",
    submittedAt: new Date("2024-09-13T11:00:00"),
  },
  {
    id: "rd5",
    ref: "REDM-2024-000005",
    fundName: "Vetiva Griffin Fund",
    holderName: "Ibrahim Usman Hassan",
    accountNo: "FND-00567890",
    fundManagerEmail: "fm@vetiva.com",
    unitsRequested: 20_000,
    redemptionDate: new Date("2024-09-15"),
    datePayable: new Date("2024-09-18"),
    submittedBy: "Tunde Bakare",
    submittedAt: new Date("2024-09-14T14:30:00"),
  },
  {
    id: "rd6",
    ref: "REDM-2024-000006",
    fundName: "Coronation Money Market Fund",
    holderName: "Blessing Chisom Amaechi",
    accountNo: "FND-00678901",
    fundManagerEmail: "fm@coronationam.com",
    unitsRequested: 4_200,
    redemptionDate: new Date("2024-09-16"),
    datePayable: new Date("2024-09-19"),
    submittedBy: "Halima Mohammed",
    submittedAt: new Date("2024-09-15T09:15:00"),
    documents: ["Redemption_Form_Blessing.pdf", "Mandate_Blessing.jpg"],
  },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RedemptionApproval() {
  const [pending, setPending] = useState<PendingRedemption[]>(MOCK_PENDING);
  const [reviewing, setReviewing] = useState<PendingRedemption | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(pending.length / pageSize));
  const paginated = pending.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  const handleApprove = async () => {
    if (!reviewing) return;
    setApproving(true);
    await new Promise((r) => setTimeout(r, 900));
    setPending((prev) => prev.filter((r) => r.id !== reviewing.id));
    setApproving(false);
    toast.success(
      `Redemption ${reviewing.ref} approved. ${reviewing.unitsRequested.toLocaleString()} units deducted from ${reviewing.holderName}'s balance.`,
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

  /* ── Review panel ─────────────────────────────────────────────── */
  if (reviewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setReviewing(null);
            setEditingEmail(false);
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </button>

        <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Awaiting Approval — {reviewing.ref}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                On approval: units are deducted from the holder&apos;s balance
                and an e-notification fires immediately to the Fund Manager.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Redemption Details — {reviewing.ref}
            </p>
            <Badge className="bg-amber-100 text-amber-800 border-0">
              Pending
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="mrpsl-label">Fund Register</p>
              <p className="font-medium mt-0.5">{reviewing.fundName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Unit Holder</p>
              <p className="font-medium mt-0.5">{reviewing.holderName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Account No.</p>
              <p className="font-medium mt-0.5 font-mono">
                {reviewing.accountNo}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Fund Manager Email</p>
              {editingEmail ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Input
                    autoFocus
                    className="mrpsl-input h-8 text-sm w-56"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setPending((prev) =>
                        prev.map((r) =>
                          r.id === reviewing.id
                            ? { ...r, fundManagerEmail: draftEmail }
                            : r,
                        ),
                      );
                      setReviewing({
                        ...reviewing,
                        fundManagerEmail: draftEmail,
                      });
                      setEditingEmail(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setEditingEmail(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="font-medium break-all text-sm">
                    {reviewing.fundManagerEmail}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftEmail(reviewing.fundManagerEmail);
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
              <p className="mrpsl-label">Submitted At</p>
              <p className="font-medium mt-0.5">
                {formatDate(reviewing.submittedAt)}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Redemption Date</p>
              <p className="font-medium mt-0.5">
                {formatDate(reviewing.redemptionDate)}
              </p>
            </div>
            <div>
              <p className="mrpsl-label">Date Payable</p>
              <p className="font-medium mt-0.5">
                {formatDate(reviewing.datePayable)}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="mrpsl-label">Units to Redeem</p>
            <p className="font-mono font-bold text-2xl mt-0.5 text-destructive">
              {reviewing.unitsRequested.toLocaleString()}
            </p>
          </div>

          {reviewing.narration && (
            <div className="pt-2 border-t border-border text-sm">
              <p className="mrpsl-label mb-0.5">Narration</p>
              <p className="text-muted-foreground">{reviewing.narration}</p>
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

  /* ── Approval queue table ─────────────────────────────────────── */
  return (
    <div className="space-y-4">
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
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">
                    REDEMPTION NO.
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">SHAREHOLDER</th>
                  <th className="px-4 py-3 whitespace-nowrap">FUND REGISTER</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    UNITS
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
                {paginated.map((red) => (
                  <tr
                    key={red.id}
                    className="mrpsl-table-row hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground whitespace-nowrap">
                      {red.ref}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {red.holderName}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {red.fundName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {red.unitsRequested.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(red.redemptionDate)}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      {red.submittedBy}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-amber-100 text-amber-800 border-0 whitespace-nowrap">
                        Pending
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" onClick={() => setReviewing(red)}>
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
