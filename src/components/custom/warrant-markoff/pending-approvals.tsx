"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import {
  useGetPendingMarkOffApprovals,
  useApproveWarrantMarkoff,
  useRejectWarrantMarkoff,
  useBatchApproveWarrantMarkoff,
  useBatchRejectWarrantMarkoff,
} from "@/hooks/useWarrantMarkoff";
import { WarrantStatusResponse } from "@/actions/warrantMarkoffActions";
import { TablePagination } from "@/components/custom/table-pagination";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { ReviewDecideDialog, BatchRejectDialog } from "./dialogs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PendingApprovalsProps {
  onReject: (id: string, comment: string) => void;
}

function getTierNumber(tier: string | number | undefined): 1 | 2 | 3 {
  if (!tier) return 1;
  const str = String(tier).toUpperCase();
  if (
    str.includes("3") ||
    str.includes("THREE") ||
    str.includes("MANAGEMENT") ||
    str.includes("FINAL")
  )
    return 3;
  if (
    str.includes("2") ||
    str.includes("TWO") ||
    str.includes("ICU") ||
    str.includes("SECOND")
  )
    return 2;
  return 1;
}

function tierLabel(tier: string | number | undefined) {
  const num = getTierNumber(tier);
  return num === 1 ? "1st Approval" : num === 2 ? "ICU" : "Management";
}

function tierBadgeClass(tier: string | number | undefined) {
  const num = getTierNumber(tier);
  return num === 1
    ? "bg-blue-100 text-blue-800"
    : num === 2
      ? "bg-purple-100 text-purple-800"
      : "bg-orange-100 text-orange-800";
}

export default function PendingApprovals({ onReject }: PendingApprovalsProps) {
  const { currentUser } = useStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries & Mutations
  const {
    data: pendingResponse,
    isLoading: isLoadingPending,
    isError: isErrorPending,
    error: pendingError,
    refetch: refetchPending,
  } = useGetPendingMarkOffApprovals({
    page: page - 1,
    size: pageSize,
  });

  const approveMutation = useApproveWarrantMarkoff();
  const rejectMutation = useRejectWarrantMarkoff();
  const batchApproveMutation = useBatchApproveWarrantMarkoff();
  const batchRejectMutation = useBatchRejectWarrantMarkoff();

  // Selection states
  const [authSelIds, setAuthSelIds] = useState<Set<number>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);

  // Single review states
  const [selected, setSelected] = useState<WarrantStatusResponse | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const pendingList = pendingResponse?.data?.content || [];
  const totalElements = pendingResponse?.data?.totalElements || 0;
  const totalPages = pendingResponse?.data?.totalPages || 0;

  // Toggle helpers
  const toggleAuthSel = (id: number) => {
    setAuthSelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAuthAll = () => {
    const allChecked =
      pendingList.length > 0 && pendingList.every((r) => authSelIds.has(r.id));
    if (allChecked) {
      setAuthSelIds((prev) => {
        const next = new Set(prev);
        pendingList.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setAuthSelIds((prev) => {
        const next = new Set(prev);
        pendingList.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const openReview = (row: WarrantStatusResponse) => {
    setSelected(row);
    setReviewOpen(true);
  };

  // Actions
  const handleSingleApprove = (comment: string) => {
    if (!selected) return;

    approveMutation.mutate(
      {
        id: selected.id,
        data: {
          comment: comment.trim(),
          authorisedBy:
            currentUser?.username ||
            `${currentUser?.firstName} ${currentUser?.lastName}` ||
            currentUser?.email ||
            "System",
        },
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.success("Warrant mark-off approved successfully.");
            setReviewOpen(false);
            refetchPending();
          } else {
            toast.error(res?.responseMessage || "Failed to approve warrant.");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to approve warrant.");
        },
      },
    );
  };

  const handleSingleReject = (comment: string) => {
    if (!selected) return;

    rejectMutation.mutate(
      {
        id: selected.id,
        data: {
          comment: comment.trim(),
          authorisedBy:
            currentUser?.username ||
            `${currentUser?.firstName} ${currentUser?.lastName}` ||
            currentUser?.email ||
            "ADMIN",
        },
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            setReviewOpen(false);
            onReject(selected.id.toString(), comment);
            refetchPending();
          } else {
            toast.error(res?.responseMessage || "Failed to reject warrant.");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to reject warrant.");
        },
      },
    );
  };

  const handleBatchApprove = () => {
    if (authSelIds.size === 0) return;

    batchApproveMutation.mutate(
      {
        ids: Array.from(authSelIds).map((id) => id.toString()) as any,
        comment: "Batch approved",
        authorisedBy:
          currentUser?.username ||
          `${currentUser?.firstName} ${currentUser?.lastName}` ||
          currentUser?.email ||
          "System",
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.success(
              `${authSelIds.size} warrant${
                authSelIds.size !== 1 ? "s" : ""
              } approved and advanced.`,
            );
            setAuthSelIds(new Set());
            refetchPending();
          } else {
            toast.error(res?.responseMessage || "Failed to approve warrants.");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to approve warrants.");
        },
      },
    );
  };

  const handleBatchRejectConfirm = (comment: string) => {
    batchRejectMutation.mutate(
      {
        ids: Array.from(authSelIds).map((id) => id.toString()) as any,
        comment: comment.trim(),
        authorisedBy:
          currentUser?.username ||
          `${currentUser?.firstName} ${currentUser?.lastName}` ||
          currentUser?.email ||
          "System",
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.error(
              `${authSelIds.size} warrant${
                authSelIds.size !== 1 ? "s" : ""
              } rejected.`,
            );
            setAuthSelIds(new Set());
            setBatchRejectOpen(false);
            refetchPending();
          } else {
            toast.error(res?.responseMessage || "Failed to reject warrants.");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to reject warrants.");
        },
      },
    );
  };

  const allCheckedOnPage =
    pendingList.length > 0 && pendingList.every((r) => authSelIds.has(r.id));

  return (
    <div className="space-y-4">
      {authSelIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">
            {authSelIds.size} warrant{authSelIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              disabled={
                batchRejectMutation.isPending || batchApproveMutation.isPending
              }
              onClick={() => setBatchRejectOpen(true)}
            >
              Reject Selected
            </Button>
            <Button
              size="sm"
              disabled={
                batchRejectMutation.isPending || batchApproveMutation.isPending
              }
              onClick={handleBatchApprove}
            >
              {batchApproveMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              )}
              Approve Selected
            </Button>
          </div>
        </div>
      )}

      {isLoadingPending && <EntitlementTableSkeleton />}

      {isErrorPending && (
        <DataErrorState
          message={pendingError?.message || "Failed to load pending approvals."}
          onRetry={refetchPending}
        />
      )}

      {!isLoadingPending && !isErrorPending && pendingList.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
          No pending approvals found.
        </div>
      )}

      {!isLoadingPending && !isErrorPending && pendingList.length > 0 && (
        <div className="space-y-4">
          <Card className="mrpsl-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={allCheckedOnPage}
                      onCheckedChange={toggleAuthAll}
                    />
                  </th>
                  <th className="p-3">DATE</th>
                  <th className="p-3">WARRANT NO</th>
                  <th className="p-3">ACCOUNT</th>
                  <th className="p-3">HOLDER</th>
                  <th className="p-3">DIVIDEND</th>
                  <th className="p-3">AMOUNT (₦)</th>
                  <th className="p-3">SUBMITTED BY</th>
                  <th className="p-3">TIER</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {pendingList.map((row) => (
                  <tr
                    key={row.id}
                    className={`mrpsl-table-row ${
                      authSelIds.has(row.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={authSelIds.has(row.id)}
                        onCheckedChange={() => toggleAuthSel(row.id)}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.submittedDate}
                    </td>
                    <td className="p-3 font-mono">{row.warrantNumber}</td>
                    <td className="p-3 font-mono">{row.accountNumber}</td>
                    <td className="p-3 font-medium">{row.holderName}</td>
                    <td className="p-3 text-muted-foreground">
                      {row.dividendNumber}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {row.amount.toLocaleString()}.00
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.submittedBy}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`border-0 text-[12px] ${tierBadgeClass(
                          row.currentTier,
                        )}`}
                      >
                        {tierLabel(row.currentTier)}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" onClick={() => openReview(row)}>
                        Review &amp; Decide
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <TablePagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            from={(page - 1) * pageSize + 1}
            to={Math.min(page * pageSize, totalElements)}
            total={totalElements}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <ReviewDecideDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        selected={selected}
        onApprove={handleSingleApprove}
        onReject={handleSingleReject}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
      />

      <BatchRejectDialog
        open={batchRejectOpen}
        onOpenChange={setBatchRejectOpen}
        selectedCount={authSelIds.size}
        onConfirm={handleBatchRejectConfirm}
        isConfirming={batchRejectMutation.isPending}
      />
    </div>
  );
}
