"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { useStore } from "@/lib/store";
import { PaginationBar } from "../../pagination-bar";
import { EntitlementTableSkeleton } from "../../rights-issue/loaders";
import { type AdmonReversal } from "@/types/account-maintenance";
import { DataErrorState } from "../../ipo/loaders";
import { AdmonReversalDialog } from "./admon-review";
import {
  useGetAdmonReversals,
  useBatchAuthoriseAdmonReversals,
  useBatchRejectAdmonReversals,
} from "@/hooks/useAccountMaintenance";
import { useRolePermission } from "@/hooks/usePermission";
import { formatDate } from "@/lib/utils/format";

// ── Demo mock rows for backend demonstration ──
// Remove once the backend has real reversal traffic to show.

const MOCK_DEMO_REVERSALS: AdmonReversal[] = [
  {
    id: -1,
    admonId: -1,
    accountNumber: "MR00001234",
    deceasedHolderName: "John Adeyemi Okafor",
    currentAdminName: "Folake Okafor",
    reason:
      "Administrator submitted incorrect probate documents — estate transfer must be reversed and resubmitted with corrected filings.",
    status: "PENDING_AUTH",
    initiatorId: "ops004@email.com",
    initiatorName: "Ngozi Adeyemi",
    submittedAt: "2026-07-11T08:30:00",
    authorisedBy: "",
    authorisedAt: "",
    icuApprovedBy: "",
    icuApprovedAt: "",
    rejectionComment: "",
    createdAt: "2026-07-11T08:30:00",
    decidedAt: "",
  },
  {
    id: -2,
    admonId: -2,
    accountNumber: "MRP0000456",
    deceasedHolderName: "Grace Nwosu",
    currentAdminName: "Charles Nwosu",
    reason:
      "Court subsequently voided the grant of probate — administration must be recalled and the account restored.",
    status: "PENDING_ICU",
    initiatorId: "ops005@email.com",
    initiatorName: "Tobi Fashola",
    submittedAt: "2026-07-09T13:10:00",
    authorisedBy: "chioma.okafor@email.com",
    authorisedAt: "2026-07-10T09:00:00",
    icuApprovedBy: "",
    icuApprovedAt: "",
    rejectionComment: "",
    createdAt: "2026-07-09T13:10:00",
    decidedAt: "",
  },
];

export default function AdmonReversal({ tab }: { tab: string }) {
  const { currentUser } = useStore();
  const canApprove = useRolePermission(
    "account_maintenance.admon_reversal_approve.approve",
  );
  const canIcu = useRolePermission(
    "account_maintenance.admon_reversal_icu.approve",
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [stage, setStage] = useState("PENDING_AUTH"); // PENDING_AUTH | PENDING_ICU

  const [selected, setSelected] = useState<AdmonReversal | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rejectComment, setRejectComment] = useState("");
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);

  function openReview(row: AdmonReversal) {
    setSelected(row);
    setReviewOpen(true);
  }

  const { data, isLoading, error, isError, refetch } = useGetAdmonReversals(
    {
      page: currentPage,
      pageSize: pageSize,
      status: stage,
    },
    {
      enabled: tab === "reversal",
    },
  );

  const authoriseMutation = useBatchAuthoriseAdmonReversals();
  const rejectMutation = useBatchRejectAdmonReversals();

  const fetchedReversals = data?.data?.data || [];
  const reversedAdmons =
    fetchedReversals.length === 0 ? MOCK_DEMO_REVERSALS : fetchedReversals;
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;

  // An OPS Authoriser may only act on PENDING_AUTH reversals; ICU may only
  // act on PENDING_ICU reversals — mirrors the same rule on the main ADMOR
  // pending queue.
  function canActOn(row: AdmonReversal): boolean {
    if (row.status === "PENDING_AUTH") return canApprove;
    if (row.status === "PENDING_ICU") return canIcu;
    return false;
  }
  const hasAnyApprovalRole = canApprove || canIcu;

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
          toast.success(`Reversal authorised successfully.`);
          setSelectedIds(new Set());
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to approve reversal");
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
          toast.success("Reversal rejected successfully.");
          setBatchRejectOpen(false);
          setSelectedIds(new Set());
          setRejectComment("");
          refetch();
        },

        onError: (err: any) => {
          toast.error(err?.message || "Failed to reject reversal");
        },
      },
    );
  };

  const visibleIds = reversedAdmons
    .filter((r) => r.id > 0 && canActOn(r))
    .map((r) => r.id);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function stageBadge(s: string) {
    if (s === "PENDING_ICU")
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
        >
          ICU
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
      >
        Auth
      </Badge>
    );
  }

  if (isLoading) {
    return <EntitlementTableSkeleton />;
  }

  return (
    <>
      <Select value={stage} onValueChange={(v) => setStage(v || "PENDING_AUTH")}>
        <SelectTrigger className="w-48 mrpsl-input">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING_AUTH">Pending Authorisation</SelectItem>
          <SelectItem value="PENDING_ICU">Pending ICU</SelectItem>
        </SelectContent>
      </Select>

      {hasAnyApprovalRole && selectedIds.size > 0 && (
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
              disabled={authoriseMutation.isPending}
              onClick={handleBatchApprove}
            >
              {authoriseMutation.isPending
                ? "Approving..."
                : "Approve Selected"}
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        Reversals cancel a previously approved administration and restore the
        original account state.
      </div>
      <Card className="mrpsl-card overflow-hidden">
        {isError ? (
          <DataErrorState
            message={error?.message || "Failed to load reversed ADMORs."}
            onRetry={refetch}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                {hasAnyApprovalRole && (
                  <th className="p-3 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectAll(visibleIds)}
                    />
                  </th>
                )}
                <th className="p-3">STAGE</th>
                <th className="p-3">DATE</th>
                <th className="p-3">ACCOUNT</th>
                <th className="p-3">ORIGINAL DECEASED</th>
                <th className="p-3">CURRENT ADMINISTRATOR</th>
                <th className="p-3">REASON FOR REVERSAL</th>
                <th className="p-3">SUBMITTED BY</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {reversedAdmons?.length > 0 ? (
                reversedAdmons?.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    {hasAnyApprovalRole && (
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          disabled={row.id <= 0 || !canActOn(row)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                    )}
                    <td className="p-3">{stageBadge(row.status)}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="p-3 font-mono">{row.accountNumber}</td>
                    <td className="p-3 font-medium">
                      {row.deceasedHolderName}
                    </td>
                    <td className="p-3">{row.currentAdminName}</td>
                    <td className="p-3 text-muted-foreground">{row.reason}</td>
                    <td className="p-3 text-muted-foreground">
                      {row.initiatorName}
                    </td>
                    <td className="p-3 text-right">
                      {canActOn(row) ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReview(row)}
                        >
                          Review &amp; Authorise
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReview(row)}
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={hasAnyApprovalRole ? 9 : 8}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No reversed ADMORs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
      <PaginationBar
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <AdmonReversalDialog
        reviewOpen={reviewOpen}
        setReviewOpen={setReviewOpen}
        selected={selected}
        canApprove={selected ? canActOn(selected) : false}
        onSuccess={refetch}
      />

      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Selected Administration Reversals</DialogTitle>
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
