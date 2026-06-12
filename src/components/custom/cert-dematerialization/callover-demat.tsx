"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DematTable } from "./demat-table";
import { ViewDematRecord } from "./view-demat-record";
import {
  useGetAllCertificateDemat,
  useSubmitForCalloverDematRequest,
  useRejectDematRequest,
} from "@/hooks/useCertDematerialisation";
import {
  PendingListSkeleton,
  DataErrorState,
} from "@/components/custom/ipo/loaders";
import { Demat } from "@/actions/certDematActions";

export default function CalloverDemat({ tab }: { tab: string }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<Demat | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, refetch } = useGetAllCertificateDemat(
    {
      status: "DRAFT",
      page: page,
      size: pageSize,
    },
    {
      enabled: tab === "callover",
    },
  );

  const {
    mutate: submitForCallover,
    isSuccess: submitSuccess,
    isPending: submitPending,
  } = useSubmitForCalloverDematRequest();
  const {
    mutate: rejectDemat,
    isSuccess: rejectSuccess,
    isPending: rejectPending,
  } = useRejectDematRequest();

  const isPending = submitPending || rejectPending;
  const success = submitSuccess || rejectSuccess;

  if (isLoading) return <PendingListSkeleton />;
  if (isError)
    return (
      <DataErrorState
        message="Failed to load callover records."
        onRetry={() => refetch()}
      />
    );

  const records = data?.content || [];

  const handleBatchApprove = (ids: string[]) => {
    // Since API doesn't have bulk submit, we map over them.
    ids.forEach((id) => {
      submitForCallover(id, {
        onSuccess: () => toast.success("Record submitted for callover."),
        onError: (err) => toast.error(`Failed: ${err.message}`),
      });
    });
  };

  const handleBatchReject = (ids: string[], comment: string) => {
    ids.forEach((id) => {
      rejectDemat(
        { id, data: { reason: comment } },
        {
          onSuccess: () => toast.success("Record rejected."),
          onError: (err) => toast.error(`Failed: ${err.message}`),
        },
      );
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Records submitted from Capture awaiting physical callover verification
        before forwarding to Authorisation.
      </p>

      <DematTable
        records={records}
        type="DRAFT"
        onReview={(r) => {
          setSelected(r);
          setReviewOpen(true);
        }}
        onBatchApprove={handleBatchApprove}
        onBatchReject={handleBatchReject}
        page={page}
        pageSize={pageSize}
        total={data?.totalElements || 0}
        totalPages={data?.totalPages || 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        approveLabel="Submit for Callover"
      />

      <ViewDematRecord
        isPending={isPending}
        success={success}
        selected={selected}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        approveLabel="Submit for Callover"
        onApprove={(id) => {
          submitForCallover(id, {
            onSuccess: () => toast.success("Record submitted for callover."),
            onError: (err) => toast.error(err.message),
          });
        }}
        onReject={(id, comment) => {
          rejectDemat(
            { id, data: { reason: comment } },
            {
              onSuccess: () => toast.success("Record rejected."),
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      />
    </div>
  );
}
