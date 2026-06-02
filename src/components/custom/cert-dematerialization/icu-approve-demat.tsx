"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DematTable } from "./demat-table";
import { ViewDematRecord } from "./view-demat-record";
import {
  useGetAllCertificateDemat,
  useIcuApproveDematRequest,
  useRejectDematRequest,
} from "@/hooks/useCertDematerialisation";
import {
  PendingListSkeleton,
  DataErrorState,
} from "@/components/custom/ipo/loaders";
import { Demat } from "@/actions/certDematActions";

export default function IcuApproveDemat({ tab }: { tab: string }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<Demat | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, refetch } = useGetAllCertificateDemat(
    {
      status: "AUTHORISED",
      page: page,
      size: pageSize,
    },
    {
      enabled: tab === "icu",
    },
  );

  const { mutate: icuApproveDemat } = useIcuApproveDematRequest();
  const { mutate: rejectDemat } = useRejectDematRequest();

  if (isLoading) return <PendingListSkeleton />;
  if (isError)
    return (
      <DataErrorState
        message="Failed to load authorised records."
        onRetry={() => refetch()}
      />
    );

  const records = data?.content || [];

  const handleBatchApprove = (ids: string[]) => {
    ids.forEach((id) => {
      icuApproveDemat(id, {
        onSuccess: () => toast.success("Record approved by ICU successfully."),
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
        Authorised demat batches awaiting final ICU approval before lodgment at
        CSCS.
      </p>

      <DematTable
        records={records}
        type="AUTHORISED"
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
        approveLabel="Approve for Lodgment"
      />

      <ViewDematRecord
        selected={selected}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        approveLabel="Approve for Lodgment"
        onApprove={(id) => {
          icuApproveDemat(id, {
            onSuccess: () => toast.success("Record approved by ICU."),
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
