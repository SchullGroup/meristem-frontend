"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ClipboardCheck,
  ShieldX,
  Eye,
  Pencil,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Check,
  FileText,
  Image,
  Download,
  ExternalLink,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ApprovalItem } from "@/lib/types";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

export default function ApprovalsPage() {
  const { pendingApprovals, currentUser, updateApprovalItem, logAudit } =
    useStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Review dialog (approver)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<ApprovalItem | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");

  // Edit & Resubmit dialog (initiator)
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<ApprovalItem | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [resubmitNote, setResubmitNote] = useState("");

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBatchApprove() {
    if (!currentUser) return;
    [...selectedIds].forEach((id) => {
      const item = pendingApprovals.find((a) => a.id === id);
      if (!item) return;
      const updatedSteps = item.approvalSteps.map((s) =>
        s.roles[0] === currentUser.roles?.[0] && !s.decision
          ? {
              ...s,
              decision: "APPROVED" as const,
              comment: batchComment,
              decidedAt: new Date().toISOString(),
              approverName: `${currentUser.firstName} ${currentUser.lastName}`,
              approverId: currentUser.id,
            }
          : s,
      );
      const allApproved = updatedSteps.every((s) => s.decision === "APPROVED");
      updateApprovalItem(id, {
        approvalSteps: updatedSteps,
        status: allApproved ? "APPROVED" : "PENDING",
      });
    });
    toast.success(
      `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} approved.`,
    );
    setSelectedIds(new Set());
  }

  function handleBatchReject() {
    if (!currentUser) return;
    if (!batchComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    [...selectedIds].forEach((id) => {
      const item = pendingApprovals.find((a) => a.id === id);
      if (!item) return;
      const updatedSteps = item.approvalSteps.map((s) =>
        s.roles[0] === currentUser.roles?.[0] && !s.decision
          ? {
              ...s,
              decision: "REJECTED" as const,
              comment: batchComment,
              decidedAt: new Date().toISOString(),
              approverName: `${currentUser.firstName} ${currentUser.lastName}`,
              approverId: currentUser.id,
            }
          : s,
      );
      updateApprovalItem(id, {
        approvalSteps: updatedSteps,
        status: "REJECTED",
      });
    });
    toast.error(
      `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} rejected.`,
    );
    setSelectedIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
  }

  const filtered = pendingApprovals.filter((a) => {
    const matchesSearch =
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "All" || a.module === moduleFilter;
    const matchesTier =
      tierFilter === "All" || a.tier?.toString() === tierFilter;
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesModule && matchesTier && matchesStatus;
  });
  const pg = usePagination(filtered);

  const myPendingCount = pendingApprovals.filter(
    (a) =>
      a.status === "PENDING" &&
      a.approvalSteps.some(
        (s) => s.roles?.[0] === currentUser?.roles?.[0] && !s.decision,
      ),
  ).length;
  const overdueCount = pendingApprovals.filter(
    (a) =>
      a.status === "PENDING" &&
      new Date().getTime() - new Date(a.submittedAt).getTime() > 14400000,
  ).length;
  const allPendingCount = pendingApprovals.filter(
    (a) => a.status === "PENDING",
  ).length;
  const approvedTodayCount = pendingApprovals.filter(
    (a) =>
      a.status === "APPROVED" &&
      new Date(a.submittedAt).toDateString() === new Date().toDateString(),
  ).length;
  const myRejectedItems = pendingApprovals.filter(
    (a) => a.status === "REJECTED" && a.initiatorId === currentUser?.id,
  );

  const handleReview = (item: ApprovalItem) => {
    setReviewItem(item);
    setReviewComment("");
    setReviewOpen(true);
  };

  const handleApprove = () => {
    if (!reviewItem || !currentUser) return;
    const updatedSteps = reviewItem.approvalSteps.map((s) =>
      s.roles[0] === currentUser.roles?.[0] && !s.decision
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
      role: currentUser.roles?.[0],
      action: "APPROVE",
      entityType: "APPROVAL",
      entityId: reviewItem.id,
      before: { status: reviewItem.status },
      after: { status: allApproved ? "APPROVED" : "PENDING" },
    });
    toast.success("Transaction approved and committed.");
    setReviewOpen(false);
  };

  const handleReject = () => {
    if (!reviewItem || !currentUser) return;
    if (!reviewComment.trim()) {
      toast.error("A rejection comment is required.");
      return;
    }
    const updatedSteps = reviewItem.approvalSteps.map((s) =>
      s.roles[0] === currentUser.roles?.[0] && !s.decision
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
      role: currentUser.roles?.[0],
      action: "REJECT",
      entityType: "APPROVAL",
      entityId: reviewItem.id,
      before: { status: "PENDING" },
      after: { status: "REJECTED", comment: reviewComment },
    });
    toast.error("Transaction rejected and returned to initiator.");
    setReviewOpen(false);
  };

  const handleEditResubmit = (item: ApprovalItem) => {
    setEditItem(item);
    setEditDescription(item.description);
    setEditAmount(item.amount != null ? item.amount.toLocaleString() : "");
    setResubmitNote("");
    setEditOpen(true);
  };

  const handleResubmit = () => {
    if (!editItem || !currentUser) return;
    if (!resubmitNote.trim()) {
      toast.error("Please describe the changes you made before resubmitting.");
      return;
    }
    const resetSteps = editItem.approvalSteps.map((s) => ({ roles: s.roles }));
    const parsedAmount = editAmount.replace(/,/g, "").trim();
    updateApprovalItem(editItem.id, {
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      description: editDescription.trim() || editItem.description,
      ...(parsedAmount !== "" ? { amount: parseFloat(parsedAmount) } : {}),
      approvalSteps: resetSteps,
    });
    logAudit({
      actor: `${currentUser.firstName} ${currentUser.lastName}`,
      actorId: currentUser.id,
      role: currentUser.roles?.[0],
      action: "RESUBMIT",
      entityType: "APPROVAL",
      entityId: editItem.id,
      before: { status: "REJECTED" },
      after: { status: "PENDING", resubmitNote },
    });
    toast.success(`${editItem.transactionType} resubmitted for approval.`);
    setEditOpen(false);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
  };

  const getAging = (submittedAt: string) => {
    const ms = new Date().getTime() - new Date(submittedAt).getTime();
    const hrs = ms / 3600000;
    const pct = Math.min((hrs / 4) * 100, 100);
    return {
      pct,
      text: hrs < 1 ? "Just now" : `${Math.floor(hrs)}h ago`,
      overdue: hrs > 4,
    };
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
      {myRejectedItems.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            {myRejectedItems.length} of your submission
            {myRejectedItems.length !== 1 ? "s have" : " has"} been rejected
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
          className={`p-4 cursor-pointer transition-colors ${myRejectedItems.length > 0 ? "bg-red-50 border-red-200 hover:bg-red-100" : "mrpsl-card"}`}
          onClick={() =>
            myRejectedItems.length > 0 && setStatusFilter("REJECTED")
          }
        >
          <div className="mrpsl-section-title">My Rejected</div>
          <div
            className={`text-2xl font-mono mt-1 font-bold ${myRejectedItems.length > 0 ? "text-red-600" : ""}`}
          >
            {myRejectedItems.length}
          </div>
          {myRejectedItems.length > 0 && (
            <div className="text-[12px] text-red-500 mt-0.5">
              Click to review
            </div>
          )}
        </Card>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search ref or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 mrpsl-input"
        />
        <Select
          value={moduleFilter}
          onValueChange={(v) => setModuleFilter(v || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Modules</SelectItem>
            <SelectItem value="DIVIDENDS">Dividends</SelectItem>
            <SelectItem value="CERTIFICATES">Certificates</SelectItem>
            <SelectItem value="ACCOUNT MAINTENANCE">
              Account Maintenance
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={tierFilter}
          onValueChange={(v) => setTierFilter(v || "")}
        >
          <SelectTrigger className="w-32 mrpsl-input">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Tiers</SelectItem>
            <SelectItem value="1">Tier 1</SelectItem>
            <SelectItem value="2">Tier 2</SelectItem>
            <SelectItem value="3">Tier 3</SelectItem>
            <SelectItem value="4">Tier 4</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v || "")}
        >
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setBatchRejectOpen(true)}
            >
              Reject Selected
            </Button>
            <Button size="sm" onClick={handleBatchApprove}>
              Approve Selected
            </Button>
          </div>
        </div>
      )}

      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="p-3 w-10"></th>
              <th className="p-3">REFERENCE</th>
              <th className="p-3">MODULE</th>
              <th className="p-3">TYPE</th>
              <th className="p-3">DESCRIPTION</th>
              <th className="p-3 text-right">AMOUNT</th>
              <th className="p-3">TIER</th>
              <th className="p-3">SUBMITTED BY</th>
              <th className="p-3">AGING</th>
              <th className="p-3">STATUS</th>
              <th className="p-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {pg.paged.map((a) => {
              const aging = getAging(a.submittedAt);
              const isMine = a.initiatorId === currentUser.id;
              const canAction =
                a.status === "PENDING" &&
                a.approvalSteps.some(
                  (s) => s.roles?.[0] === currentUser.roles?.[0] && !s.decision,
                );

              return (
                <tr
                  key={a.id}
                  className={`hover:bg-accent/5 ${a.status === "REJECTED" && isMine ? "bg-red-50/40" : ""}`}
                >
                  <td className="p-3">
                    {canAction ? (
                      <Checkbox
                        checked={selectedIds.has(a.id)}
                        onCheckedChange={() => toggleSelect(a.id)}
                      />
                    ) : (
                      <span className="w-4 inline-block" />
                    )}
                  </td>
                  <td className="p-3 font-mono text-[13px] text-muted-foreground">
                    {a.id}
                  </td>
                  <td className="p-3">
                    <Badge className="bg-gray-100 text-gray-800 border-0 text-[13px]">
                      {a.module
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="p-3 font-medium text-sm">
                    {a.transactionType}
                  </td>
                  <td
                    className="p-3 truncate max-w-[200px]"
                    title={a.description}
                  >
                    {a.description}
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    {a.amount ? `₦${a.amount.toLocaleString()}` : "—"}
                  </td>
                  <td className="p-3">
                    {a.tier ? (
                      <Badge
                        className={`border-0 text-[13px] ${a.tier === 1 ? "bg-green-100 text-green-800" : a.tier === 2 ? "bg-blue-100 text-blue-800" : a.tier === 3 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}
                      >
                        T{a.tier}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[13px] font-bold text-primary">
                          {getInitials(a.initiatorName)}
                        </span>
                      </div>
                      <span>{a.initiatorName}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 w-24">
                      <Progress value={aging.pct} className="h-1.5" />
                      <span
                        className={`text-[13px] whitespace-nowrap ${aging.overdue ? "text-red-600 font-bold" : "text-muted-foreground"}`}
                      >
                        {aging.text}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge
                      className={`border-0 text-[13px] ${a.status === "PENDING" ? "bg-amber-100 text-amber-800" : a.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                    >
                      {a.status
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {a.status === "PENDING" ? (
                      canAction ? (
                        <Button size="sm" onClick={() => handleReview(a)}>
                          Review
                        </Button>
                      ) : isMine ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => toast.success("Recalled successfully")}
                        >
                          Recall
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-[13px]">
                          Locked
                        </span>
                      )
                    ) : a.status === "REJECTED" && isMine ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                        onClick={() => handleEditResubmit(a)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit &amp; Resubmit
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReview(a)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {pg.paged.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="p-12 text-center text-muted-foreground"
                >
                  No approvals match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <TablePagination
        page={pg.page}
        pageSize={pg.pageSize}
        totalPages={pg.totalPages}
        from={pg.from}
        to={pg.to}
        total={pg.total}
        onPageChange={pg.setPage}
        onPageSizeChange={pg.setPageSize}
      />

      {/* ── Review Dialog (Approver / View) ──────────────────────────── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {reviewItem && (
            <>
              <DialogHeader>
                <DialogTitle>{reviewItem.transactionType} Review</DialogTitle>
                <div className="font-mono text-sm text-muted-foreground">
                  {reviewItem.id}
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-2">
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

                {reviewItem?.attachments &&
                  reviewItem?.attachments.length > 0 && (
                    <div className="p-4 border rounded-xl">
                      <h4 className="text-sm font-bold border-b pb-2 mb-3">
                        Supporting Documents
                      </h4>
                      <div className="space-y-2">
                        {reviewItem.attachments?.map((doc, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border"
                          >
                            {doc.fileType === "IMAGE" ? (
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
                    {reviewItem.approvalSteps.map((s, idx) => (
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
                            {s.roles[0].replace(/_/g, " ")}
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
                  currentUser.id !== reviewItem.initiatorId && (
                    <>
                      <div className="space-y-2">
                        <label className="mrpsl-label">Comment</label>
                        <Textarea
                          placeholder="Required for rejection, optional for approval"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
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

      {/* ── Batch Reject Dialog ──────────────────────────────────────── */}
      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedIds.size} Record
              {selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              This comment will be applied to all selected records and sent to
              the initiator.
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">
                Rejection Comment <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                placeholder="State reason for rejection..."
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit & Resubmit Dialog (Initiator) ───────────────────────── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditOpen(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
            <DialogTitle className="text-[15px] font-bold tracking-tight">
              Edit &amp; Resubmit
            </DialogTitle>
            {editItem && (
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {editItem.transactionType} &mdash;{" "}
                <span className="font-mono">{editItem.id}</span>
              </p>
            )}
          </DialogHeader>

          {editItem &&
            (() => {
              const rejectedStep = editItem.approvalSteps.find(
                (s) => s.decision === "REJECTED",
              );
              return (
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Rejection reason */}
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span className="text-[13px] font-semibold">
                        Rejected by{" "}
                        {rejectedStep?.approverName ??
                          rejectedStep?.roles[0].replace(/_/g, " ") ??
                          "Approver"}
                        {rejectedStep?.decidedAt && (
                          <span className="font-normal text-red-600">
                            {" "}
                            ·{" "}
                            {format(
                              new Date(rejectedStep.decidedAt),
                              "d MMM yyyy, HH:mm",
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                    {rejectedStep?.comment ? (
                      <p className="text-[13px] text-red-800 leading-relaxed pl-6">
                        &ldquo;{rejectedStep.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[13px] text-red-600 pl-6 italic">
                        No comment provided.
                      </p>
                    )}
                  </div>

                  {/* Original transaction info (read-only) */}
                  <div>
                    <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Transaction Details
                    </h4>
                    <div className="grid grid-cols-3 gap-3 p-4 bg-muted/20 border rounded-xl text-[13px]">
                      <div>
                        <div className="text-muted-foreground mb-1">Module</div>
                        <Badge className="bg-gray-100 text-gray-800 border-0">
                          {editItem.module}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Type</div>
                        <span className="font-medium">
                          {editItem.transactionType}
                        </span>
                      </div>
                      {editItem.tier && (
                        <div>
                          <div className="text-muted-foreground mb-1">Tier</div>
                          <Badge
                            className={`border-0 ${editItem.tier === 1 ? "bg-green-100 text-green-800" : editItem.tier === 2 ? "bg-blue-100 text-blue-800" : editItem.tier === 3 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}
                          >
                            Tier {editItem.tier}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Editable fields */}
                  <div className="space-y-4">
                    <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Edit Before Resubmitting
                    </h4>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Description</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="text-[13px] resize-none"
                      />
                    </div>

                    {editItem.amount != null && (
                      <div className="space-y-1.5">
                        <label className="mrpsl-label">Amount (₦)</label>
                        <Input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="mrpsl-input font-mono"
                          placeholder="e.g. 387,500"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Resubmit note (required) */}
                  <div className="space-y-1.5">
                    <label className="mrpsl-label">
                      Summary of Changes <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[13px] text-muted-foreground">
                      Briefly describe what you corrected or updated. This is
                      visible to the approver.
                    </p>
                    <Textarea
                      value={resubmitNote}
                      onChange={(e) => setResubmitNote(e.target.value)}
                      placeholder="e.g. Corrected the unit count to match the executed transfer deed. Verified figures with the principal's transfer register."
                      rows={3}
                      className="text-[13px] resize-none"
                    />
                  </div>
                </div>
              );
            })()}

          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResubmit} disabled={!resubmitNote.trim()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Resubmit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
