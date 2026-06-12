"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  RejectConsolidation,
  ReviewConsolidation,
} from "./review-consolidation";
import { PaginationBar } from "../pagination-bar";
import {
  useBatchApproveOrRejectConsolidationRequest,
  useGetAllCertConsolidations,
} from "@/hooks/useCertConsolidation";
import { CertificateConsolidation } from "@/types/cscs";
import { formatDate } from "@/lib/utils/format";
import { useStore } from "@/lib/store";

const PAGE_SIZE = 10;

export default function PendingConsolidationApprovals() {
  const { currentUser } = useStore();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<CertificateConsolidation | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const { data, isLoading, isError, error, refetch } =
    useGetAllCertConsolidations({
      page: page,
      pageSize: pageSize,
      status: "PENDING",
    });

  const batchApproveMutation = useBatchApproveOrRejectConsolidationRequest();

  const openReview = (row: CertificateConsolidation) => {
    setSelected(row);
    setReviewOpen(true);
  };

  function toggleSelect(id: string) {
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

  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  function handleBatchApprove() {
    if (selectedIds.size === 0) return;

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    batchApproveMutation.mutate(
      {
        approveIds: Array.from(selectedIds),
        rejectIds: [],
        rejectComment: "",
        authorisedBy: currentUser?.email,
      },
      {
        onSuccess: () => {
          toast.success(
            `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} approved.`,
          );
          setSelectedIds(new Set());
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to approve records");
        },
      },
    );
  }

  const pendingConsolidations = data?.data?.content || [];
  const visibleConsolIds = pendingConsolidations.map(
    (r: CertificateConsolidation) => r.id,
  );
  const consolAllSelected =
    visibleConsolIds.length > 0 &&
    visibleConsolIds.every((id: string) => selectedIds.has(id));

  if (isLoading) {
    return (
      <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading pending transfer requests...</p>
      </Card>
    );
  }

  return (
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
            <Button size="sm" onClick={handleBatchApprove}>
              Approve Selected
            </Button>
          </div>
        </div>
      )}
      {isError ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-destructive min-h-[400px]">
          <p className="font-semibold text-lg mb-2">Failed to load requests</p>
          <p className="text-sm mb-4">
            {error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </Card>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3 w-10">
                  <Checkbox
                    checked={consolAllSelected}
                    onCheckedChange={() => toggleSelectAll(visibleConsolIds)}
                  />
                </th>
                <th className="p-3">DATE</th>
                <th className="p-3">ACCOUNT</th>
                <th className="p-3">HOLDER</th>
                <th className="p-3">CERTIFICATES</th>
                <th className="p-3">TOTAL UNITS</th>
                <th className="p-3">SUBMITTED BY</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {pendingConsolidations?.map((row) => (
                <tr key={row.id} className="mrpsl-table-row">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={() => toggleSelect(row.id)}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(row.submittedAt)}
                  </td>
                  <td className="p-3 font-mono">{row.accountNumber}</td>
                  <td className="p-3 font-medium">{row.holderName}</td>
                  <td className="p-3 text-left tabular-nums">
                    {row.certCount} certs
                  </td>
                  <td className="p-3 text-left tabular-nums font-semibold">
                    {row.totalUnits.toLocaleString()}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.submittedBy}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" onClick={() => openReview(row)}>
                      Review &amp; Decide
                    </Button>
                  </td>
                </tr>
              ))}
              {pendingConsolidations?.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-12 text-center text-muted-foreground"
                  >
                    No pending consolidation approvals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <PaginationBar
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        total={data?.data?.totalElements || 0}
        pageBase={1}
        totalPages={data?.data.totalPages}
        onPageSizeChange={setPageSize}
      />

      <ReviewConsolidation
        reviewOpen={reviewOpen}
        setReviewOpen={setReviewOpen}
        selected={selected}
        onSuccess={() => refetch()}
      />

      <RejectConsolidation
        selectedIds={Array.from(selectedIds)}
        batchRejectOpen={batchRejectOpen}
        setBatchRejectOpen={setBatchRejectOpen}
        onSuccess={() => {
          setSelectedIds(new Set());
          refetch();
        }}
      />
    </>
  );
}
