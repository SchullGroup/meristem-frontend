"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/custom/pagination-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KycChange, ShareholderAccount } from "@/types/account-maintenance";
import {
  useBatchAuthoriseKycChanges,
  useBatchRejectKycChanges,
  useCancelKycChange,
  useGetKycChanges,
} from "@/hooks/useAccountMaintenance";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DataErrorState } from "@/components/custom/ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import StatusBadge from "../../status-badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { KYCReviewDialog } from "./kyc-review-modal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

function fieldToTab(field: string): string {
  if (["Bank Account Number", "Bank Name"].some((f) => field.includes(f)))
    return "bank";
  if (["Email", "Phone", "Address"].some((f) => field.includes(f)))
    return "contact";
  return "personal";
}

interface PendingKYCProps {
  tab: string;
  selectedShareholder: ShareholderAccount | null;
  setTab: (tab: string) => void;
}

export default function PendingKYC({
  tab,
  setTab,
  selectedShareholder,
}: PendingKYCProps) {
  const queryClient = useQueryClient();
  const currentUser = useStore((state) => state.currentUser);

  function openReview(row: KycChange) {
    setSelectedChange(row);
    setReviewOpen(true);
  }

  function openCancel(row: KycChange) {
    setCancelTarget(row);
    setCancelOpen(true);
  }

  function handleCancel() {
    if (!cancelTarget) return;
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    cancelMutation.mutate(
      {
        id: cancelTarget.id,
        data: { cancelledBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success("Request cancelled — the field is editable again.");
          setCancelOpen(false);
          setCancelTarget(null);
          refetchPending();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to cancel request");
        },
      },
    );
  }

  // ── Review modal & Batch operations state ──
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<KycChange | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rejectComment, setRejectComment] = useState("");
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);

  // ── Cancel (submitter withdrawing their own pending request) ──
  const [cancelTarget, setCancelTarget] = useState<KycChange | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelMutation = useCancelKycChange();

  // ── Pagination state for pending & history ──
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingPageSize, setPendingPageSize] = useState(20);

  const authoriseMutation = useBatchAuthoriseKycChanges();
  const rejectMutation = useBatchRejectKycChanges();

  // ── Pending KYC changes ──
  const {
    data: pendingKycData,
    isLoading: isPendingLoading,
    isError: isPendingError,
    refetch: refetchPending,
  } = useGetKycChanges(
    {
      status: "PENDING",
      page: pendingPage,
      pageSize: pendingPageSize,
    },
    { enabled: !!selectedShareholder && tab === "pending" },
  );
  const pendingChanges = pendingKycData?.data || [];
  const pendingTotal = pendingKycData?.total || 0;
  const pendingTotalPages = pendingKycData?.totalPages || 1;

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

  function toggleSelectAll(ids: number[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    const ids = Array.from(selectedIds).map(String);

    authoriseMutation.mutate(
      {
        ids: ids,
        comment: "ADMOR reversals authorised",
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: () => {
          toast.success(`Kyc changes authorised successfully.`);
          setSelectedIds(new Set());
          refetchPending();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to approve kyc changes");
        },
      },
    );
  };

  const handleBatchReject = () => {
    if (rejectComment.trim() === "") {
      toast.error("Please enter a rejection comment");
      return;
    }

    if (selectedIds.size === 0) {
      toast.error("Please select at least one record");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    const ids = Array.from(selectedIds).map(String);

    rejectMutation.mutateAsync(
      {
        ids: ids,
        comment: rejectComment,
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: () => {
          toast.success("Kyc changes rejected successfully.");
          setBatchRejectOpen(false);
          setSelectedIds(new Set());
          setRejectComment("");
          refetchPending();
          queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },

        onError: (err: any) => {
          toast.error(err?.message || "Failed to reject kyc changes");
        },
      },
    );
  };

  const visibleIds = pendingChanges.map((r) => r.id);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  if (isPendingLoading) {
    return <EntitlementTableSkeleton />;
  }

  return (
    <>
      {isPendingError ? (
        <DataErrorState
          message="Failed to load pending changes."
          onRetry={refetchPending}
        />
      ) : (
        <>
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
                <Button
                  size="sm"
                  onClick={handleBatchApprove}
                  disabled={authoriseMutation.isPending}
                >
                  {authoriseMutation.isPending
                    ? "Authorising..."
                    : "Approve Selected"}
                </Button>
              </div>
            </div>
          )}

          <Card className="mrpsl-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3">
                    {" "}
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectAll(visibleIds)}
                    />
                  </th>
                  <th className="p-3">DATE</th>
                  <th className="p-3">FIELD CHANGED</th>
                  <th className="p-3">CURRENT VALUE</th>
                  <th className="p-3">PROPOSED VALUE</th>
                  <th className="p-3">SUBMITTED BY</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {pendingChanges.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No pending changes for this account
                    </td>
                  </tr>
                ) : (
                  pendingChanges.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="p-3 font-medium">{row.fieldChanged}</td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {row.oldValue || "—"}
                      </td>
                      <td className="p-3 font-mono text-primary font-semibold">
                        {row.newValue}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.initiatorName}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {row.status === "PENDING" && (
                          <Button size="sm" onClick={() => openReview(row)}>
                            Review
                          </Button>
                        )}
                        {row.status === "PENDING" &&
                          row.initiatorId === currentUser?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => openCancel(row)}
                            >
                              Cancel
                            </Button>
                          )}
                        {row.status === "REJECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-red-700 border-red-300"
                            onClick={() => setTab(fieldToTab(row.fieldChanged))}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <PaginationBar
        page={pendingPage}
        total={pendingTotal}
        totalPages={pendingTotalPages}
        pageSize={pendingPageSize}
        onPageChange={setPendingPage}
        onPageSizeChange={(s) => {
          setPendingPageSize(s);
          setPendingPage(0);
        }}
      />

      <KYCReviewDialog
        reviewOpen={reviewOpen}
        setReviewOpen={(open) => {
          setReviewOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
            queryClient.invalidateQueries({
              queryKey: ["account-kyc-history"],
            });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
          }
        }}
        selected={selectedChange}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel This Request?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 px-2 pb-2">
            <p className="text-[13px] text-muted-foreground">
              This withdraws your pending change to{" "}
              <strong>{cancelTarget?.fieldChanged}</strong>. The field will be
              editable again and this request cannot be un-cancelled.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelOpen(false)}>
                Keep Request
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Selected Kyc Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="mrpsl-label">Rejection Comment</label>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Please enter a reason for rejection..."
                className="resize-none"
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
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Selected"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
