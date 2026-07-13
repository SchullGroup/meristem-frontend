"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  ShieldCheck,
} from "lucide-react";
import {
  useGetKycChanges,
  useBatchAuthoriseKycChanges,
  useBatchRejectKycChanges,
  useAuthoriseKycChange,
  useRejectKycChange,
} from "@/hooks/useAccountMaintenance";
import { useStore } from "@/lib/store";
import { KycChange } from "@/types/account-maintenance";
import { PaginationBar } from "@/components/custom/pagination-bar";
import StatusBadge from "@/components/custom/status-badge";
import RegisterSelect from "@/components/custom/register-select";
import { formatDate } from "@/lib/utils/format";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DataErrorState } from "@/components/custom/ipo/loaders";
import {
  DocumentViewer,
  parseDocumentUrls,
} from "@/components/custom/document-viewer";
import { useQueryClient } from "@tanstack/react-query";

// ── Priority helper (mocked until backend provides it) ──────────────────────
function getMockPriority(row: KycChange): "High" | "Normal" | "Low" {
  if (row.changeType === "BANK") return "High";
  if (["Email", "Phone"].some((f) => row.fieldChanged?.includes(f)))
    return "Normal";
  return "Low";
}

const PRIORITY_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-0",
  Normal: "bg-amber-100 text-amber-700 border-0",
  Low: "bg-green-100 text-green-700 border-0",
};

// ── Change-type filter options ───────────────────────────────────────────────
const CHANGE_TYPES = ["All", "PERSONAL", "CONTACT", "BANK", "BULK"];

export default function KYCApprovalsPage() {
  const queryClient = useQueryClient();
  const currentUser = useStore((s) => s.currentUser);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [registerFilter, setRegisterFilter] = useState("");
  const [changeTypeFilter, setChangeTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── Review / Reject dialogs ──────────────────────────────────────────────
  const [reviewRow, setReviewRow] = useState<KycChange | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");

  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchRejectComment, setBatchRejectComment] = useState("");

  // ── Document viewer ──────────────────────────────────────────────────────
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerDocs, setDocViewerDocs] = useState<
    ReturnType<typeof parseDocumentUrls>
  >([]);
  const [docViewerUploader, setDocViewerUploader] = useState("");
  const [docViewerDate, setDocViewerDate] = useState("");

  // ── Data ─────────────────────────────────────────────────────────────────

  const { data, isLoading, isError, refetch } = useGetKycChanges({
    status: statusFilter || undefined,
    changeType: changeTypeFilter !== "All" ? changeTypeFilter : undefined,
    registerId: registerFilter || undefined,
    page,
    pageSize,
  });

  // Fetch pending count separately for the summary badge
  const { data: pendingData } = useGetKycChanges({
    status: "PENDING",
    page: 0,
    pageSize: 1,
  });
  const pendingCount = pendingData?.total ?? 0;

  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Client-side search filter (on account number, holder name, field)
  const rows = useMemo(() => {
    const allRows = data?.data || [];

    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(
      (r) =>
        r.accountNumber?.toLowerCase().includes(q) ||
        r.holderName?.toLowerCase().includes(q) ||
        r.fieldChanged?.toLowerCase().includes(q),
    );
  }, [data, search]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const authorizeSingle = useAuthoriseKycChange();
  const rejectSingle = useRejectKycChange();
  const batchAuthorise = useBatchAuthoriseKycChanges();
  const batchReject = useBatchRejectKycChanges();

  // ── Selection helpers ─────────────────────────────────────────────────────
  const visibleIds = rows.map((r) => r.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.size === visibleIds.length ? new Set() : new Set(visibleIds),
    );
  }

  // ── Single actions ────────────────────────────────────────────────────────
  function openReview(row: KycChange) {
    setReviewRow(row);
    setReviewComment("");
    setReviewOpen(true);
  }

  function handleSingleApprove() {
    if (!reviewRow || !currentUser) return;
    authorizeSingle.mutate(
      {
        id: reviewRow.id,
        data: { comment: reviewComment, authorisedBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success("KYC change approved.");
          setReviewOpen(false);
          refetch();
        },
        onError: (e: any) => toast.error(e?.message || "Failed to approve"),
      },
    );
  }

  function handleSingleReject() {
    if (!reviewRow || !currentUser) return;
    if (!reviewComment.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    rejectSingle.mutate(
      {
        id: reviewRow.id,
        data: { comment: reviewComment, authorisedBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success("KYC change rejected.");
          setReviewOpen(false);
          refetch();
        },
        onError: (e: any) => toast.error(e?.message || "Failed to reject"),
      },
    );
  }

  // ── Batch actions ─────────────────────────────────────────────────────────
  function handleBatchApprove() {
    if (!currentUser || selectedIds.size === 0) return;
    batchAuthorise.mutate(
      {
        ids: Array.from(selectedIds).map(String),
        comment: "Batch approved",
        authorisedBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedIds.size} change(s) approved.`);
          setSelectedIds(new Set());
          queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
        },
        onError: (e: any) => toast.error(e?.message || "Batch approve failed"),
      },
    );
  }

  function handleBatchReject() {
    if (!currentUser || selectedIds.size === 0) return;
    if (!batchRejectComment.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    batchReject.mutate(
      {
        ids: Array.from(selectedIds).map(String),
        comment: batchRejectComment,
        authorisedBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedIds.size} change(s) rejected.`);
          setBatchRejectOpen(false);
          setBatchRejectComment("");
          setSelectedIds(new Set());
          queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
        },
        onError: (e: any) => toast.error(e?.message || "Batch reject failed"),
      },
    );
  }

  // ── Open document viewer ──────────────────────────────────────────────────
  function openDocViewer(row: KycChange) {
    const docs = row.supportingDocuments;
    setDocViewerDocs(docs);
    setDocViewerUploader(row.initiatorName || "");
    setDocViewerDate(row.createdAt || "");
    setDocViewerOpen(true);
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">KYC Approvals Queue</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Review and action pending KYC change requests. Changes to bank
            details require extra scrutiny.
          </p>
        </div>
      </div>

      {/* ── Summary stat pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("PENDING");
            setPage(0);
          }}
          className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
            statusFilter === "PENDING"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-muted/50"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span
              className={`ml-1.5 ${
                statusFilter === "PENDING"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              ({pendingCount})
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("APPROVED");
            setPage(0);
          }}
          className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
            statusFilter === "APPROVED"
              ? "bg-green-600 text-white border-green-600"
              : "bg-background text-muted-foreground border-border hover:bg-muted/50"
          }`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(0);
          }}
          className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
            statusFilter === "REJECTED"
              ? "bg-red-600 text-white border-red-600"
              : "bg-background text-muted-foreground border-border hover:bg-muted/50"
          }`}
        >
          Rejected
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("");
            setPage(0);
          }}
          className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
            statusFilter === ""
              ? "bg-muted text-foreground border-border"
              : "bg-background text-muted-foreground border-border hover:bg-muted/50"
          }`}
        >
          All
        </button>
      </div>

      {/* ── Filters ── */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-end gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Input
              className="mrpsl-input pl-9"
              placeholder="Search account, name, field…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Register */}
          <RegisterSelect
            label="Register"
            value={registerFilter}
            onChange={setRegisterFilter}
          />

          {/* Change Type */}

          <div>
            <label htmlFor="change-type" className="mrpsl-label">
              Filter by change type
            </label>
            <Select
              name="change-type"
              value={changeTypeFilter}
              onValueChange={(val) => setChangeTypeFilter(val || "All")}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="Change Type" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "All" ? "Select Change Type" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex justify-end items-center gap-2 mt-4 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm font-semibold text-primary">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 ml-2"
              onClick={() => setBatchRejectOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject Selected
            </Button>
            <Button
              size="sm"
              onClick={handleBatchApprove}
              disabled={batchAuthorise.isPending}
            >
              {batchAuthorise.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Approve Selected
            </Button>
          </div>
        )}
      </Card>

      {/* ── Table ── */}
      {isLoading ? (
        <EntitlementTableSkeleton />
      ) : isError ? (
        <DataErrorState
          message="Failed to load KYC approval queue."
          onRetry={refetch}
        />
      ) : (
        <>
          <Card className="mrpsl-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="p-3">ACCT NO.</th>
                  <th className="p-3">SHAREHOLDER</th>
                  <th className="p-3">CHANGE TYPE</th>
                  <th className="p-3">FIELD</th>
                  <th className="p-3">OLD VALUE</th>
                  <th className="p-3">NEW VALUE</th>
                  <th className="p-3">SUBMITTED BY</th>
                  <th className="p-3">SUBMITTED AT</th>
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="p-12 text-center text-muted-foreground"
                    >
                      <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No items in the queue</p>
                      <p className="text-xs mt-1">
                        All changes have been actioned or no records match your
                        filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const priority = getMockPriority(row);

                    return (
                      <tr
                        key={row.id}
                        className={`mrpsl-table-row ${selectedIds.has(row.id) ? "bg-primary/5" : ""}`}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleSelect(row.id)}
                          />
                        </td>
                        <td className="p-3 font-mono text-[12px] text-muted-foreground">
                          {row.accountNumber}
                        </td>
                        <td className="p-3 font-medium">
                          {row.holderName || "—"}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {row.changeType}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.fieldChanged}
                        </td>
                        <td className="p-3 font-mono text-[12px] text-muted-foreground line-through">
                          {row.oldValue || "—"}
                        </td>
                        <td className="p-3 font-mono text-[12px] text-primary font-semibold">
                          {row.newValue || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.initiatorName}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] ${PRIORITY_BADGE[priority]}`}
                          >
                            {priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {row?.supportingDocuments?.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => openDocViewer(row)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Docs ({row?.supportingDocuments?.length})
                              </Button>
                            )}
                            {row.status === "PENDING" && (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => openReview(row)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Review
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>

          <PaginationBar
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />
        </>
      )}

      {/* ── Single Review Dialog ── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review KYC Change Request</DialogTitle>
          </DialogHeader>
          {reviewRow && (
            <div className="space-y-5 p-4 overflow-y-auto max-h-[70vh]">
              {/* Change summary */}
              <div className="bg-muted/30 border rounded-xl p-4 space-y-3 text-sm">
                <div>
                  <div className="mrpsl-section-title">Account Number</div>
                  <div className="font-mono mt-0.5">
                    {reviewRow.accountNumber}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Shareholder</div>
                  <div className="font-medium mt-0.5">
                    {reviewRow.holderName}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Change</div>
                  <div className="mt-0.5">
                    <span className="font-semibold">
                      {reviewRow.fieldChanged}
                    </span>
                    {" — "}
                    <span className="line-through text-muted-foreground font-mono">
                      {reviewRow.oldValue || "N/A"}
                    </span>
                    {" → "}
                    <span className="text-primary font-mono font-semibold">
                      {reviewRow.newValue}
                    </span>
                  </div>
                </div>
                {reviewRow.reason && (
                  <div>
                    <div className="mrpsl-section-title">Submission Reason</div>
                    <div className="mt-0.5 text-muted-foreground italic">
                      {reviewRow.reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Warning for bank changes */}
              {reviewRow.changeType === "BANK" && (
                <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    This is a <strong>bank detail change</strong>. Verify the
                    new account number and BVN match before approving.
                  </span>
                </div>
              )}

              {/* Approval chain */}
              <div className="border rounded-xl p-4">
                <h4 className="text-sm font-bold mb-3">Approval Chain</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    Submitted by {reviewRow.initiatorName || "Initiator"}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-amber-200 animate-pulse shrink-0" />
                    1st Approver —{" "}
                    <span className="font-medium">
                      {reviewRow?.authorisedBy || "Pending your action"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/40 shrink-0" />
                    ICU Approver —{" "}
                    {reviewRow?.icuApprovedBy || "Awaiting 1st approval"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Comment / Note</label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add a comment (required for rejection)…"
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleSingleReject}
                  disabled={rejectSingle.isPending || authorizeSingle.isPending}
                >
                  {rejectSingle.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSingleApprove}
                  disabled={rejectSingle.isPending || authorizeSingle.isPending}
                >
                  {authorizeSingle.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Batch Reject Dialog ── */}
      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject {selectedIds.size} Change(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4 ">
            <div className="space-y-2">
              <label className="mrpsl-label">Rejection Reason</label>
              <Textarea
                value={batchRejectComment}
                onChange={(e) => setBatchRejectComment(e.target.value)}
                placeholder="Enter the reason for rejecting these changes…"
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBatchReject}
                disabled={batchReject.isPending}
              >
                {batchReject.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Reject Selected
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Document Viewer Drawer ── */}
      <DocumentViewer
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
        documents={docViewerDocs}
        uploaderName={docViewerUploader}
        uploadedAt={docViewerDate}
      />
    </div>
  );
}
