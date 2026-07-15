"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Admon, AdmonReversal } from "@/types/account-maintenance";
import {
  useAuthoriseAdmon,
  useRejectAdmon,
  useAuthoriseAdmonReversal,
  useRejectAdmonReversal,
} from "@/hooks/useAccountMaintenance";
import { formatDate } from "@/lib/utils/format";
import { DocPreview } from "../../doc-upload-zone";

interface AdmonReversalDialogProps {
  reviewOpen: boolean;
  selected: AdmonReversal | null;
  setReviewOpen: (open: boolean) => void;
  canApprove?: boolean;
  onSuccess?: () => void;
}

interface AdmonReviewDialogProps {
  reviewOpen: boolean;
  selected: Admon | null;
  setReviewOpen: (open: boolean) => void;
  canApprove?: boolean;
  onSuccess?: () => void;
  /** Opens the dedicated Return-to-Initiator dialog on the parent (table) view for this record. */
  onReturn?: () => void;
}

export function AdmonReviewDialog({
  reviewOpen,
  setReviewOpen,
  selected,
  canApprove = false,
  onSuccess,
  onReturn,
}: AdmonReviewDialogProps) {
  const [comment, setComment] = useState("");
  const { currentUser } = useStore();
  const authoriseMutation = useAuthoriseAdmon();
  const rejectMutation = useRejectAdmon();

  const isOwnSubmission =
    !!currentUser?.email &&
    !!selected?.initiatorId &&
    currentUser.id === selected.initiatorId;

  const handleAuthorise = () => {
    if (!selected) return;
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    authoriseMutation.mutate(
      {
        id: selected.id,
        data: {
          comment: comment,
          authorisedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Administration authorised.");
          setReviewOpen(false);
          setComment("");
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to authorise administration");
        },
      },
    );
  };

  const handleReject = () => {
    if (!selected) return;
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a rejection comment");
      return;
    }

    rejectMutation.mutate(
      {
        id: selected.id,
        data: {
          comment: comment,
          authorisedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.error("Administration rejected.");
          setReviewOpen(false);
          setComment("");
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reject administration");
        },
      },
    );
  };

  const isPending = authoriseMutation.isPending || rejectMutation.isPending;

  // ── Document status ──
  // Every administrator/executor must have at least one supporting document.

  const probateDocs = selected?.probateDocs ?? [];
  const hasDocs = selected?.administrators?.length
    ? selected.administrators.every((a) => (a.documents?.length ?? 0) > 0)
    : false;

  return (
    <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {canApprove
              ? "Review Estate Administration"
              : "Estate Administration Details"}
          </DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-6 px-8 pb-8 overflow-y-auto max-h-[70vh]">
            {/* ── 1. Deceased Account Details ── */}
            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                Deceased Account Details
              </h4>
              {selected.deceasedAccounts &&
              selected.deceasedAccounts.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] text-muted-foreground border-b">
                      <th className="py-1.5 pr-2 font-medium">ACCT NO</th>
                      <th className="py-1.5 pr-2 font-medium">HOLDER</th>
                      <th className="py-1.5 pr-2 font-medium">REGISTER</th>
                      <th className="py-1.5 pr-2 font-medium">CHN</th>
                      <th className="py-1.5 text-right font-medium">
                        HOLDINGS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selected.deceasedAccounts.map((acc, i) => (
                      <tr key={i} className="text-[13px] font-mono">
                        <td className="py-1.5 pr-2">{acc.accountNumber}</td>
                        <td className="py-1.5 pr-2 font-sans font-medium text-destructive">
                          {acc.holderName}
                        </td>
                        <td className="py-1.5 pr-2">{acc.registerSymbol}</td>
                        <td className="py-1.5 pr-2">{acc.chn || "-"}</td>
                        <td className="py-1.5 text-right">
                          {acc.holdings?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-[13px]">
                  <span className="font-mono font-bold">
                    {selected.deceasedAccountNumbers?.join(", ") || "-"}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    — {selected.deceasedHolderName}
                  </span>
                </div>
              )}
            </div>

            {/* ── 2. Probate Details ── */}
            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                Probate Details
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Probate Court
                  </span>
                  <span className="font-medium">
                    {selected.probateCourt || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Probate Date
                  </span>
                  <span className="font-medium">
                    {formatDate(selected.probateDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Probate Number
                  </span>
                  <span className="font-mono">{selected.probateNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Probate Page
                  </span>
                  <span className="font-mono">
                    {selected.probatePage || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Lodgement Date
                  </span>
                  <span className="font-medium">
                    {formatDate(selected.lodgementDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Type
                  </span>
                  <Badge variant="outline" className="text-[11px]">
                    {selected.admonType || "ADMINISTRATOR"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* ── 3. Administrator(s) ── */}
            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                Administrator
                {selected.administrators && selected.administrators.length !== 1
                  ? "s"
                  : ""}{" "}
                ({selected.administrators?.length ?? 1})
              </h4>
              {selected.administrators && selected.administrators.length > 0 ? (
                <div className="space-y-3">
                  {selected.administrators.map((admin, idx) => (
                    <AdminCard key={idx} admin={admin} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="text-[13px] text-muted-foreground">
                  <span className="font-medium">{selected.adminName}</span>
                  {" — "}
                  {selected.admonType === "EXECUTOR"
                    ? "Executor"
                    : "Administrator"}
                </div>
              )}
            </div>

            {/* ── 3b. Case Memo ── */}
            {selected.memo && (
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                  Memo
                </h4>
                <p className="text-[13px] text-muted-foreground italic">
                  {selected.memo}
                </p>
              </div>
            )}

            {/* ── 4. Estate Name Change ── */}
            {selected.changeNameToEstate && selected.estateNamePreview && (
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                  Name Change → Estate
                </h4>
                <div className="bg-background border rounded-lg p-3 text-sm text-center font-mono">
                  <span className="text-muted-foreground line-through mr-2">
                    {selected.deceasedHolderName}
                  </span>
                  {" → "}
                  <span className="font-bold text-primary">
                    {selected.estateNamePreview}
                  </span>
                </div>
              </div>
            )}

            {/* ── 5. Letters of Administration ── */}
            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                Letters of Administration
              </h4>
              {probateDocs.length > 0 ? (
                <div className="space-y-1.5">
                  {probateDocs.map((doc, i) => (
                    <DocPreview key={i} url={doc.url} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <FileText className="h-6 w-6 text-muted-foreground/40 mb-1" />
                  <p className="text-[12px] text-muted-foreground">
                    No probate documents uploaded yet.
                  </p>
                </div>
              )}
            </div>

            {/* ── 6. Approval Chain ── */}
            <ApprovalChainSection
              selected={selected}
              canApprove={canApprove}
              isOwnSubmission={isOwnSubmission}
            />

            {/* Comment + Actions — only for approvers who are not the submitter */}
            {canApprove && !isOwnSubmission ? (
              <>
                <div className="space-y-2">
                  <label className="mrpsl-label">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comment for this action..."
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-border/60">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (!comment.trim()) {
                        toast.error("A rejection reason is required.");
                        return;
                      }
                      handleReject();
                    }}
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                  </Button>
                  {onReturn && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      disabled={isPending}
                      onClick={() => {
                        setReviewOpen(false);
                        onReturn();
                      }}
                    >
                      Return to Initiator
                    </Button>
                  )}
                  <div className="flex-1" />
                  {!hasDocs ? (
                    <div className="relative group">
                      <Button size="sm" disabled>
                        Approve
                      </Button>
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 w-64 px-2.5 py-1.5 bg-foreground text-background text-xs rounded-md shadow-md text-center">
                        Every administrator/executor must have at least one
                        supporting document before this request can be approved.
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={handleAuthorise}
                    >
                      {authoriseMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                  )}
                </div>
              </>
            ) : isOwnSubmission ? (
              <div className="flex gap-3 pt-4 border-t border-border/60">
                <div className="flex-1 relative group">
                  <Button className="w-full" disabled>
                    Authorise Administration
                  </Button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 px-2.5 py-1.5 bg-foreground text-background text-xs rounded-md shadow-md text-center">
                    You cannot approve your own submission.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Stage-aware 3-step chain: Submitted → OPS Authoriser → ICU Approver. */
/** Shared shape between Admon and AdmonReversal — enough to render the chain. */
interface ApprovalChainRecord {
  initiatorName: string;
  status: string;
  authorisedBy?: string;
  icuApprovedBy?: string;
  returnedReason?: string;
  returnedBy?: string;
  returnedAt?: string;
  rejectionComment?: string;
  rejectedBy?: string;
}

function ApprovalChainSection({
  selected,
  canApprove,
  isOwnSubmission,
}: {
  selected: ApprovalChainRecord;
  canApprove: boolean;
  isOwnSubmission: boolean;
}) {
  const opsDone = !!selected.authorisedBy;
  const icuDone = !!selected.icuApprovedBy;
  const opsCurrent =
    selected.status === "PENDING_AUTH" && canApprove && !isOwnSubmission;
  const icuCurrent =
    selected.status === "PENDING_ICU" && canApprove && !isOwnSubmission;

  const steps = [
    {
      label: `Submitted by ${selected.initiatorName}`,
      done: true,
      pending: false,
    },
    {
      label: opsDone
        ? `OPS Authoriser — Authorised by ${selected.authorisedBy}`
        : isOwnSubmission && selected.status === "PENDING_AUTH"
          ? "OPS Authoriser — You cannot approve your own submission"
          : opsCurrent
            ? "OPS Authoriser — Pending your action"
            : "OPS Authoriser — Pending",
      done: opsDone,
      pending: opsCurrent,
    },
    {
      label: icuDone
        ? `ICU Approver — Approved by ${selected.icuApprovedBy}`
        : isOwnSubmission && selected.status === "PENDING_ICU"
          ? "ICU Approver — You cannot approve your own submission"
          : icuCurrent
            ? "ICU Approver — Pending your action"
            : "ICU Approver — Pending",
      done: icuDone,
      pending: icuCurrent,
    },
  ];

  return (
    <div className="border border-border/60 rounded-xl p-4">
      <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
        Approval Chain
      </h4>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : step.pending ? "bg-amber-200 animate-pulse" : "bg-muted"}`}
            >
              {step.done && <Check className="h-3 w-3 text-green-600" />}
            </div>
            <div className="text-sm">{step.label}</div>
          </div>
        ))}
      </div>

      {selected.status === "RETURNED" && selected.returnedReason && (
        <div className="mt-4 pt-3 border-t border-border/60 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <strong>Returned to initiator</strong>
          {selected.returnedBy ? ` by ${selected.returnedBy}` : ""}
          {selected.returnedAt ? ` on ${formatDate(selected.returnedAt)}` : ""}:{" "}
          {selected.returnedReason}
        </div>
      )}

      {selected.status === "REJECTED" && selected.rejectionComment && (
        <div className="mt-4 pt-3 border-t border-border/60 text-[12px] text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
          <strong>Rejected</strong>
          {selected.rejectedBy ? ` by ${selected.rejectedBy}` : ""}:{" "}
          {selected.rejectionComment}
        </div>
      )}
    </div>
  );
}

/** Inline collapsible card for an individual administrator's full details. */
export function AdminCard({
  admin,
  index,
}: {
  admin: NonNullable<Admon["administrators"]>[number];
  index: number;
}) {
  const [open, setOpen] = useState(true);
  const docCount = admin.documents?.length ?? 0;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-semibold text-sm">
            {index + 1}. {admin.adminName}
          </span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {admin.isExecutor ? "Executor" : "Administrator"}
          </Badge>
          {docCount > 0 ? (
            <Badge className="text-[10px] bg-green-100 text-green-700 border-green-300 shrink-0">
              {docCount} doc{docCount !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 shrink-0">
              No docs
            </Badge>
          )}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] pt-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Email
              </span>
              <span className="font-mono text-[12px]">{admin.email}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Phone
              </span>
              <span className="font-mono text-[12px]">{admin.phone}</span>
            </div>
            {admin.altPhone && (
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Alt Phone
                </span>
                <span className="font-mono text-[12px]">{admin.altPhone}</span>
              </div>
            )}
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Relationship
              </span>
              <span>{admin.relationship || "-"}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                BVN
              </span>
              <span className="font-mono text-[12px]">{admin.bvn}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                NIN
              </span>
              <span className="font-mono text-[12px]">{admin.nin}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                ID Type
              </span>
              <span>{admin.idType}</span>
            </div>
          </div>
          <div className="text-[13px]">
            <span className="text-[11px] text-muted-foreground block">
              Address
            </span>
            <span>
              {admin.adminAddress}, {admin.adminCity}, {admin.adminState}
            </span>
          </div>
          {admin.memo && (
            <div className="text-[13px]">
              <span className="text-[11px] text-muted-foreground block">
                Memo
              </span>
              <span className="text-muted-foreground italic">{admin.memo}</span>
            </div>
          )}

          {/* Per-administrator supporting documents */}
          <div className="border-t pt-2 mt-2">
            <span className="text-[11px] text-muted-foreground block mb-1.5">
              Supporting Documents
            </span>
            {docCount > 0 ? (
              <div className="space-y-1.5">
                {admin.documents!.map((doc, di) => (
                  <DocPreview key={di} url={doc.url} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground italic">
                No documents uploaded for this administrator.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function AdmonReversalDialog({
  reviewOpen,
  setReviewOpen,
  selected,
  canApprove = false,
  onSuccess,
}: AdmonReversalDialogProps) {
  const [comment, setComment] = useState("");
  const { currentUser } = useStore();
  const authoriseMutation = useAuthoriseAdmonReversal();
  const rejectMutation = useRejectAdmonReversal();

  const isOwnSubmission =
    !!currentUser?.email &&
    !!selected?.initiatorId &&
    currentUser.email === selected.initiatorId;

  const handleAuthorise = () => {
    if (!selected) return;
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    authoriseMutation.mutate(
      {
        reversalId: selected.id,
        data: {
          comment: comment,
          authorisedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Administration reversal authorised.");
          setReviewOpen(false);
          setComment("");
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to authorise reversal");
        },
      },
    );
  };

  const handleReject = () => {
    if (!selected) return;
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a rejection comment");
      return;
    }

    rejectMutation.mutate(
      {
        reversalId: selected.id,
        data: {
          comment: comment,
          authorisedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.error("Reversal rejected.");
          setReviewOpen(false);
          setComment("");
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reject reversal");
        },
      },
    );
  };

  const isPending = authoriseMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Administration Reversal</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-6 px-8 pb-8">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Authorising this reversal will cancel the existing administration
              and restore the account to its original holder state.
            </div>

            <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mrpsl-section-title">Account</div>
                  <div className="font-mono font-bold mt-0.5">
                    {selected.accountNumber}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Reason for Reversal</div>
                  <div className="text-sm mt-0.5">{selected.reason}</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Original Deceased</div>
                  <div className="font-semibold text-sm mt-0.5 text-destructive">
                    {selected.deceasedHolderName}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">
                    Current Administrator
                  </div>
                  <div className="text-sm mt-0.5">
                    {selected.currentAdminName}
                  </div>
                </div>
              </div>
            </div>

            <ApprovalChainSection
              selected={selected}
              canApprove={canApprove}
              isOwnSubmission={isOwnSubmission}
            />

            {canApprove && !isOwnSubmission ? (
              <>
                <div className="space-y-2">
                  <label className="mrpsl-label">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Required for rejection..."
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/60">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isPending}
                    onClick={handleReject}
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isPending}
                    onClick={handleAuthorise}
                  >
                    {authoriseMutation.isPending
                      ? "Authorising..."
                      : "Authorise Reversal"}
                  </Button>
                </div>
              </>
            ) : isOwnSubmission ? (
              <div className="flex gap-3 pt-4 border-t border-border/60">
                <div className="flex-1 relative group">
                  <Button className="w-full" disabled>
                    Authorise Reversal
                  </Button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 px-2.5 py-1.5 bg-foreground text-background text-xs rounded-md shadow-md text-center">
                    You cannot approve your own submission.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
