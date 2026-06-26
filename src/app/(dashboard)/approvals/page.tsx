"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GET_APPROVAL_SUMMARY } from "@/actions/approvalsAction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Check,
  FileText,
  Image,
  Download,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ApprovalItem } from "@/lib/types";
import { GlobalQueue } from "./GlobalQueue";
import { MyDesk } from "./MyDesk";

function moduleUrl(module: string, transactionType: string): string {
  if (module === "SETUP") {
    if (transactionType.includes("Principal")) return "/setup/principals";
    if (transactionType.includes("User")) return "/setup/users";
    if (transactionType.includes("Register")) return "/setup/registers";
    return "/setup/parameters";
  }
  if (module === "DIVIDENDS") {
    if (transactionType.toLowerCase().includes("declaration"))
      return "/dividends/declaration";
    if (transactionType.toLowerCase().includes("payment"))
      return "/dividends/payment";
    if (
      transactionType.toLowerCase().includes("mark-off") ||
      transactionType.toLowerCase().includes("markoff")
    )
      return "/dividends/warrant-markoff";
    if (transactionType.toLowerCase().includes("split"))
      return "/dividends/split";
    return "/dividends/declaration";
  }
  if (module === "CERTIFICATES") return "/certificates/transfer";
  if (module === "ACCOUNT_MAINTENANCE") {
    if (transactionType.toLowerCase().includes("kyc"))
      return "/account-maintenance/kyc-update";
    if (transactionType.toLowerCase().includes("consolidation"))
      return "/account-maintenance/consolidation";
    if (transactionType.toLowerCase().includes("admon"))
      return "/account-maintenance/admon";
    return "/account-maintenance/kyc-update";
  }
  return "/";
}

export default function ApprovalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const tabParam = searchParams.get("tab");
  const {
    currentUser,
    updateApprovalItem,
    logAudit,
    addPrincipal,
    updatePrincipal,
    addUser,
    updateUser,
  } = useStore();
  const currentUserRole = currentUser?.roles?.[0];
  const [search, setSearch] = useState(refParam ?? "");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [queueTab, setQueueTab] = useState(refParam || tabParam === "global" ? "global" : "my-desk");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<ApprovalItem | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewReadOnly, setReviewReadOnly] = useState(false);

  const { data: summaryData } = useQuery({
    queryKey: ["approval-summary", currentUser?.email],
    queryFn: () =>
      GET_APPROVAL_SUMMARY({ performedBy: currentUser?.email ?? "" }),
    enabled: !!currentUser?.email,
  });

  const myPendingCount = summaryData?.data?.myPendingCount ?? 0;
  const overdueCount = summaryData?.data?.overdueCount ?? 0;
  const allPendingCount = summaryData?.data?.allPendingCount ?? 0;
  const myRejectedCount = summaryData?.data?.myRejectedCount ?? 0;

  const handleReview = (item: ApprovalItem, readOnly = false) => {
    setReviewItem(item);
    setReviewComment("");
    setReviewReadOnly(readOnly);
    setReviewOpen(true);
  };

  const handleApprove = () => {
    if (!reviewItem || !currentUser || !currentUserRole) return;
    if (!reviewItem.approvalSteps?.length) return;
    const updatedSteps = reviewItem.approvalSteps.map((s) =>
      s.roles?.[0] === currentUserRole && !s.decision
        ? {
            ...s,
            decision: "APPROVED" as const,
            comment: reviewComment,
            decidedAt: new Date().toISOString(),
            approverName: `${currentUser.firstName} ${currentUser.lastName}`,
            approverId: currentUser.id,
          }
        : s,
    );
    const allApproved = updatedSteps.every((s) => s.decision === "APPROVED");
    updateApprovalItem(reviewItem.id, {
      approvalSteps: updatedSteps,
      status: allApproved ? "APPROVED" : "PENDING",
    });
    logAudit({
      actor: `${currentUser.firstName} ${currentUser.lastName}`,
      actorId: currentUser.id,
      role: currentUserRole,
      action: "APPROVE",
      entityType: "APPROVAL",
      entityId: reviewItem.id,
      before: { status: reviewItem.status },
      after: { status: allApproved ? "APPROVED" : "PENDING" },
    });

    // Apply SETUP changes to store when fully approved
    if (allApproved && reviewItem.module === "SETUP" && reviewItem.payload) {
      const p = reviewItem.payload;
      const tt = reviewItem.transactionType;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (tt === "Create Principal") addPrincipal(p as any);
      else if (tt === "Update Principal")
        updatePrincipal(p.id as string, p.updates ?? p);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if (tt === "Create User") addUser(p as any);
      else if (tt === "Update User") updateUser(p.id as string, p.updates ?? p);
      toast.success(
        `${reviewItem.transactionType} approved and applied to the system.`,
      );
    } else {
      toast.success("Transaction approved and committed.");
    }
    setReviewOpen(false);
  };

  const handleReject = () => {
    if (!reviewItem || !currentUser || !currentUserRole) return;
    if (!reviewComment.trim()) {
      toast.error("A rejection comment is required.");
      return;
    }
    if (!reviewItem.approvalSteps?.length) return;
    const updatedSteps = reviewItem.approvalSteps.map((s) =>
      s.roles?.[0] === currentUserRole && !s.decision
        ? {
            ...s,
            decision: "REJECTED" as const,
            comment: reviewComment,
            decidedAt: new Date().toISOString(),
            approverName: `${currentUser.firstName} ${currentUser.lastName}`,
            approverId: currentUser.id,
          }
        : s,
    );
    updateApprovalItem(reviewItem.id, {
      approvalSteps: updatedSteps,
      status: "REJECTED",
    });
    logAudit({
      actor: `${currentUser.firstName} ${currentUser.lastName}`,
      actorId: currentUser.id,
      role: currentUserRole,
      action: "REJECT",
      entityType: "APPROVAL",
      entityId: reviewItem.id,
      before: { status: "PENDING" },
      after: { status: "REJECTED", comment: reviewComment },
    });
    toast.error("Transaction rejected and returned to initiator.");
    setReviewOpen(false);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and action all pending transactions requiring authorisation
          </p>
        </div>
      </div>

      {/* My Rejected alert banner */}
      {myRejectedCount > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            {myRejectedCount} of your submission
            {myRejectedCount !== 1 ? "s have" : " has"} been rejected
          </AlertTitle>
          <AlertDescription className="text-amber-700 flex items-center gap-3">
            Review the rejection reason, edit the data, and resubmit for
            approval.
            <button
              className="underline font-semibold text-amber-800 hover:text-amber-900 whitespace-nowrap"
              onClick={() => setStatusFilter("REJECTED")}
            >
              Show rejected items →
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-3">
        <Card
          className={`p-4 ${myPendingCount > 0 ? "bg-amber-50 border-amber-200" : "mrpsl-card"}`}
        >
          <div className="mrpsl-section-title">My Pending</div>
          <div
            className={`text-2xl font-mono mt-1 font-bold ${myPendingCount > 0 ? "text-amber-600" : ""}`}
          >
            {myPendingCount}
          </div>
        </Card>
        <Card
          className={`p-4 ${overdueCount > 0 ? "bg-red-50 border-red-200" : "mrpsl-card"}`}
        >
          <div className="mrpsl-section-title">Overdue (&gt;4hrs)</div>
          <div
            className={`text-2xl font-mono mt-1 font-bold ${overdueCount > 0 ? "text-red-600" : ""}`}
          >
            {overdueCount}
          </div>
        </Card>
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title">All Pending</div>
          <div className="text-2xl font-mono mt-1 font-bold">
            {allPendingCount}
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-colors ${myRejectedCount > 0 ? "bg-red-50 border-red-200 hover:bg-red-100" : "mrpsl-card"}`}
          onClick={() => myRejectedCount > 0 && setStatusFilter("REJECTED")}
        >
          <div className="mrpsl-section-title">My Rejected</div>
          <div
            className={`text-2xl font-mono mt-1 font-bold ${myRejectedCount > 0 ? "text-red-600" : ""}`}
          >
            {myRejectedCount}
          </div>
          {myRejectedCount > 0 && (
            <div className="text-[12px] text-red-500 mt-0.5">
              Click to review
            </div>
          )}
        </Card>
      </div>

      <Tabs value={queueTab} onValueChange={setQueueTab} className="space-y-4">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="my-desk"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            On My Desk
            {myPendingCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 text-[11px] bg-amber-500 text-white border-0">
                {myPendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="global"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Global Queue
            <Badge
              variant="outline"
              className="ml-2 h-5 min-w-5 px-1.5 text-[11px]"
            >
              {allPendingCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── ON MY DESK ────────────────────────────────────────────────── */}
        <TabsContent value="my-desk" className="mt-0">
          <MyDesk
            search={search}
            setSearch={setSearch}
            moduleFilter={moduleFilter}
            setModuleFilter={setModuleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onReview={handleReview}
          />
        </TabsContent>

        <TabsContent value="global" className="mt-0">
          <GlobalQueue
            search={search}
            setSearch={setSearch}
            moduleFilter={moduleFilter}
            setModuleFilter={setModuleFilter}
            onReview={handleReview}
          />
        </TabsContent>
      </Tabs>

      {/* ── Review Dialog (Approver / View) ──────────────────────────── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {reviewItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{reviewItem.transactionType} Review</DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0 -translate-x-10 -translate-y-2"
                    onClick={() => {
                      setReviewOpen(false);
                      router.push(
                        moduleUrl(
                          reviewItem.module,
                          reviewItem.transactionType,
                        ),
                      );
                    }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" /> Open in Module
                  </Button>
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  {reviewItem.id}
                </div>
              </DialogHeader>

              <div className="space-y-5 px-8 pb-8">
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/20 border rounded-xl">
                  <div>
                    <div className="text-[13px] uppercase font-bold text-muted-foreground">
                      Module
                    </div>
                    <div className="font-medium text-sm mt-1">
                      {reviewItem.module}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] uppercase font-bold text-muted-foreground">
                      Type
                    </div>
                    <div className="font-medium text-sm mt-1">
                      {reviewItem.transactionType}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] uppercase font-bold text-muted-foreground">
                      Amount
                    </div>
                    <div className="font-medium text-sm mt-1 font-mono">
                      {reviewItem.amount
                        ? `₦${reviewItem.amount.toLocaleString()}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] uppercase font-bold text-muted-foreground">
                      Tier
                    </div>
                    <div className="font-medium text-sm mt-1">
                      {reviewItem.tier ? `Tier ${reviewItem.tier}` : "—"}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="text-[13px] uppercase font-bold text-muted-foreground mb-1">
                      Description
                    </div>
                    <p className="text-sm">{reviewItem.description}</p>
                  </div>
                </div>

                {/* SETUP payload — show the exact data being approved */}
                {reviewItem.module === "SETUP" && reviewItem.payload && (
                  <div className="p-4 border border-primary/20 rounded-xl bg-primary/5">
                    <h4 className="text-sm font-bold text-primary mb-3 border-b border-primary/20 pb-2">
                      Data to be Applied
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(reviewItem.payload)
                        .filter(
                          ([k]) => !["id", "action", "updates"].includes(k),
                        )
                        .map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="text-sm font-medium mt-0.5 wrap-break-word">
                              {typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : Array.isArray(value)
                                  ? (value as string[]).join(", ") || "—"
                                  : String(value ?? "—")}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {reviewItem.attachments &&
                  reviewItem.attachments.length > 0 && (
                    <div className="p-4 border rounded-xl">
                      <h4 className="text-sm font-bold border-b pb-2 mb-3">
                        Supporting Documents
                      </h4>
                      <div className="space-y-2">
                        {reviewItem.attachments.map((doc, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border"
                          >
                            {doc.fileType === "IMAGE" ? (
                              // eslint-disable-next-line jsx-a11y/alt-text
                              <Image className="h-4 w-4 text-blue-500 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                            <span className="text-sm flex-1 truncate font-medium">
                              {doc.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-mono shrink-0"
                            >
                              {doc.fileType}
                            </Badge>
                            <button
                              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              title="Open"
                              onClick={() => window.open(doc.url, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              title="Download"
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = doc.url;
                                a.download = doc.name;
                                a.click();
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="p-4 border rounded-xl">
                  <h4 className="text-sm font-bold border-b pb-2 mb-3">
                    Approval Chain
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check
                          className="h-2.5 w-2.5 text-white"
                          style={{ strokeWidth: 3 }}
                        />
                      </span>
                      <div className="text-sm">
                        <span className="font-semibold">
                          {reviewItem.initiatorName}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · Submitted
                        </span>
                      </div>
                    </div>
                    {(reviewItem.approvalSteps ?? []).map((s, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {s.decision === "APPROVED" ? (
                          <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Check
                              className="h-2.5 w-2.5 text-white"
                              style={{ strokeWidth: 3 }}
                            />
                          </span>
                        ) : s.decision === "REJECTED" ? (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-amber-400 shrink-0 mt-0.5 animate-pulse" />
                        )}
                        <div className="text-sm">
                          <span className="font-semibold">
                            {s.roles?.[0]?.replace(/_/g, " ") ?? "Unknown Role"}
                          </span>
                          {s.decision ? (
                            <span
                              className={`ml-2 ${s.decision === "APPROVED" ? "text-green-600" : "text-red-600"}`}
                            >
                              {s.decision === "APPROVED"
                                ? "Approved"
                                : "Rejected"}
                            </span>
                          ) : (
                            <span className="ml-2 text-amber-600">
                              Awaiting
                            </span>
                          )}
                          {s.approverName && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {s.approverName}
                            </span>
                          )}
                          {s.comment && (
                            <div className="text-muted-foreground mt-0.5 text-[13px] italic">
                              &quot;{s.comment}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewItem.status === "REJECTED" ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>This transaction was rejected</AlertTitle>
                    <AlertDescription>
                      The initiator must edit and resubmit before further action
                      is possible.
                    </AlertDescription>
                  </Alert>
                ) : reviewItem.status === "APPROVED" ? (
                  <Alert className="border-green-300 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">
                      Transaction fully approved
                    </AlertTitle>
                    <AlertDescription className="text-green-700">
                      This transaction has been approved and committed.
                    </AlertDescription>
                  </Alert>
                ) : currentUser.id === reviewItem.initiatorId ? (
                  <Alert variant="destructive">
                    <ShieldX className="h-4 w-4" />
                    <AlertTitle>Maker-Checker Rule Enforced</AlertTitle>
                    <AlertDescription>
                      You cannot approve a transaction you initiated. Another
                      authorised user must action this item.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {reviewItem.status === "PENDING" &&
                  currentUser.id !== reviewItem.initiatorId &&
                  !reviewReadOnly && (
                    <>
                      <div className="space-y-2">
                        <label className="mrpsl-label">Comment</label>
                        <Textarea
                          placeholder="Required for rejection, optional for approval"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-2 border-t">
                        <Button
                          variant="ghost"
                          className="mr-auto"
                          onClick={() =>
                            toast.success("Delegated to colleague")
                          }
                        >
                          Delegate
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={currentUser.id === reviewItem.initiatorId}
                          onClick={handleReject}
                        >
                          Reject
                        </Button>
                        <Button
                          disabled={currentUser.id === reviewItem.initiatorId}
                          onClick={handleApprove}
                        >
                          Approve
                        </Button>
                      </div>
                    </>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
