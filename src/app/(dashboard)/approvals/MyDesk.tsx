"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw, Eye, XCircle } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TablePagination } from "@/components/custom/table-pagination";
import { useStore } from "@/lib/store";
import { GET_APPROVALS } from "@/actions/approvalsAction";
import { ApprovalItem } from "@/lib/types";
import { toast } from "sonner";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.split(" ");
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

interface MyDeskProps {
  search: string;
  setSearch: (s: string) => void;
  moduleFilter: string;
  setModuleFilter: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onReview: (item: ApprovalItem, readOnly?: boolean) => void;
}

export function MyDesk({
  search,
  setSearch,
  moduleFilter,
  setModuleFilter,
  statusFilter,
  setStatusFilter,
  onReview,
}: MyDeskProps) {
  const { currentUser, updateApprovalItem, logAudit } = useStore();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [tierFilter, setTierFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<ApprovalItem | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [resubmitNote, setResubmitNote] = useState("");

  const queryKey = [
    "approvals-my-desk",
    search,
    moduleFilter,
    tierFilter,
    statusFilter,
    page,
    pageSize,
  ];

  const { data: response, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      GET_APPROVALS({
        scope: "MY_DESK",
        q: search || undefined,
        module:
          moduleFilter !== "All"
            ? (moduleFilter as
                | "SETUP"
                | "DIVIDENDS"
                | "CERTIFICATES"
                | "ACCOUNT_MAINTENANCE"
                | "OFFERS")
            : undefined,
        tier: tierFilter ? parseInt(tierFilter) : undefined,
        status:
          statusFilter !== "All"
            ? (statusFilter as
                | "PENDING"
                | "APPROVED"
                | "REJECTED"
                | "RECALLED"
                | "RESUBMITTED")
            : undefined,
        page: page - 1,
        size: pageSize,
        performedBy: currentUser?.email,
      }),
    enabled: !!currentUser?.email,
  });

  const items: ApprovalItem[] = response?.data?.content ?? [];
  const totalElements: number = response?.data?.totalElements ?? 0;
  const totalPages: number = response?.data?.totalPages ?? 0;
  const from = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalElements);

  function resetPage() {
    setPage(1);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBatchApprove() {
    if (!currentUser) return;
    [...selectedIds].forEach((id) => {
      updateApprovalItem(id, { status: "APPROVED" });
    });
    queryClient.invalidateQueries({ queryKey: ["approvals-my-desk"] });
    queryClient.invalidateQueries({ queryKey: ["approval-summary"] });
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
      updateApprovalItem(id, { status: "REJECTED" });
    });
    queryClient.invalidateQueries({ queryKey: ["approvals-my-desk"] });
    queryClient.invalidateQueries({ queryKey: ["approval-summary"] });
    toast.error(
      `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} rejected.`,
    );
    setSelectedIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
  }

  function handleEditResubmit(item: ApprovalItem) {
    setEditItem(item);
    setEditDescription(item.description);
    setEditAmount(item.amount != null ? item.amount.toLocaleString() : "");
    setResubmitNote("");
    setEditOpen(true);
  }

  function handleResubmit() {
    if (!editItem || !currentUser) return;
    if (!resubmitNote.trim()) {
      toast.error("Please describe the changes you made before resubmitting.");
      return;
    }
    const parsedAmount = editAmount.replace(/,/g, "").trim();
    updateApprovalItem(editItem.id, {
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      description: editDescription.trim() || editItem.description,
      ...(parsedAmount !== "" ? { amount: parseFloat(parsedAmount) } : {}),
    });
    logAudit({
      actor: `${currentUser.firstName} ${currentUser.lastName}`,
      actorId: currentUser.id,
      role: currentUser.roles?.[0] || "",
      action: "RESUBMIT",
      entityType: "APPROVAL",
      entityId: editItem.id,
      before: { status: "REJECTED" },
      after: { status: "PENDING", resubmitNote },
    });
    queryClient.invalidateQueries({ queryKey: ["approvals-my-desk"] });
    queryClient.invalidateQueries({ queryKey: ["approval-summary"] });
    toast.success(`${editItem.transactionType} resubmitted for approval.`);
    setEditOpen(false);
  }

  if (!currentUser) return null;

  return (
    <>
      <div className="space-y-4 mt-0">
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            placeholder="Search ref or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="w-64 mrpsl-input"
          />
          <Select
            value={moduleFilter}
            onValueChange={(v) => {
              setModuleFilter(!v || v === "All" ? "All" : v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-48 mrpsl-input">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Modules</SelectItem>
              <SelectItem value="SETUP">Setup</SelectItem>
              <SelectItem value="DIVIDENDS">Dividends</SelectItem>
              <SelectItem value="CERTIFICATES">Certificates</SelectItem>
              <SelectItem value="ACCOUNT_MAINTENANCE">
                Account Maintenance
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={tierFilter || "All"}
            onValueChange={(v) => {
              setTierFilter(!v || v === "All" ? "" : v);
              resetPage();
            }}
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
            onValueChange={(v) => {
              setStatusFilter(!v || v === "All" ? "All" : v);
              resetPage();
            }}
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
                <th className="p-3">AMOUNT</th>
                <th className="p-3">TIER</th>
                <th className="p-3">SUBMITTED BY</th>
                <th className="p-3">AGING</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="p-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.map((a) => {
                    const agingPct = Math.min(
                      ((a.agingHours ?? 0) / 4) * 100,
                      100,
                    );
                    const agingText =
                      (a.agingHours ?? 0) < 1
                        ? "Just now"
                        : `${Math.floor(a.agingHours ?? 0)}h ago`;
                    const isMine = a.initiatorId === currentUser.id;
                    const canAction = a.status === "PENDING";
                    return (
                      <tr
                        key={a.id}
                        className={`hover:bg-accent/5 ${
                          a.status === "REJECTED" && isMine
                            ? "bg-red-50/40"
                            : ""
                        }`}
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
                          className="p-3 truncate max-w-50"
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
                              className={`border-0 text-[13px] ${
                                a.tier === 1
                                  ? "bg-green-100 text-green-800"
                                  : a.tier === 2
                                    ? "bg-blue-100 text-blue-800"
                                    : a.tier === 3
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                              }`}
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
                            <Progress value={agingPct} className="h-1.5" />
                            <span
                              className={`text-[13px] whitespace-nowrap ${
                                a.overdue
                                  ? "text-red-600 font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {agingText}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[13px] ${
                              a.status === "PENDING"
                                ? "badge-pending"
                                : a.status === "APPROVED"
                                  ? "badge-approved"
                                  : "badge-rejected"
                            }`}
                          >
                            {String(a.status)
                              .toLowerCase()
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {a.status === "PENDING" ? (
                            canAction ? (
                              <Button
                                size="sm"
                                onClick={() => onReview(a)}
                              >
                                Review
                              </Button>
                            ) : isMine ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() =>
                                  toast.success("Recalled successfully")
                                }
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
                              onClick={() => onReview(a)}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              {!isLoading && items.length === 0 && (
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
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          from={from}
          to={to}
          total={totalElements}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {/* ── Batch Reject Dialog ──────────────────────────────────────── */}
      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedIds.size} Record
              {selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-8 pb-8">
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

      {/* ── Edit & Resubmit Dialog ───────────────────────────────────── */}
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
              const rejectedStep = editItem.approvalSteps?.find(
                (s) => s.decision === "REJECTED",
              );
              return (
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span className="text-[13px] font-semibold">
                        Rejected by{" "}
                        {rejectedStep?.approverName ??
                          rejectedStep?.roles?.[0]?.replace(/_/g, " ") ??
                          "Approver"}
                        {rejectedStep?.decidedAt && (
                          <span className="font-normal text-red-600">
                            {" "}
                            &middot;{" "}
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
                            className={`border-0 ${
                              editItem.tier === 1
                                ? "bg-green-100 text-green-800"
                                : editItem.tier === 2
                                  ? "bg-blue-100 text-blue-800"
                                  : editItem.tier === 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            Tier {editItem.tier}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

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
                      placeholder="e.g. Corrected the unit count to match the executed transfer deed."
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
    </>
  );
}
