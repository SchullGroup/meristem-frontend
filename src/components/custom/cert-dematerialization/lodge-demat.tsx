"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DematTable } from "./demat-table";
import {
  useGetAllCertificateDemat,
  useLodgetDematRequest,
} from "@/hooks/useCertDematerialisation";
import {
  PendingListSkeleton,
  DataErrorState,
} from "@/components/custom/ipo/loaders";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function LodgeDemat({ tab }: { tab: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rinType, setRinType] = useState<"RIN_AT_CSCS" | "RIN_NOT_AT_CSCS">(
    "RIN_AT_CSCS",
  );

  const { data, isLoading, isError, refetch } = useGetAllCertificateDemat(
    {
      status: "ICU_APPROVED",
      page: page,
      size: pageSize,
    },
    {
      enabled: tab === "lodgment",
    },
  );

  const { mutate: lodgetDemat } = useLodgetDematRequest();

  if (isLoading) return <PendingListSkeleton />;

  const records = data?.content || [];

  const handleBatchPush = (ids: string[]) => {
    ids.forEach((id) => {
      lodgetDemat(
        {
          id,
          data: {
            reason: {
              rinStatus: rinType,
              method: "PUSH",
            },
          },
        },
        {
          onSuccess: () => toast.success("Record pushed to CSCS."),
          onError: (err) => toast.error(`Failed: ${err.message}`),
        },
      );
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ICU-approved records ready to be lodged at CSCS via text file download
        or direct API push.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-muted-foreground mr-1">
          Lodgment Format:
        </span>
        <RadioGroup
          value={rinType}
          onValueChange={(v) =>
            setRinType(v as "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS")
          }
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="RIN_AT_CSCS" id="rin-yes" />
            <label htmlFor="rin-yes" className="text-sm cursor-pointer">
              RIN at CSCS
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="RIN_NOT_AT_CSCS" id="rin-no" />
            <label htmlFor="rin-no" className="text-sm cursor-pointer">
              RIN NOT at CSCS
            </label>
          </div>
        </RadioGroup>
      </div>

      {isError ? (
        <DataErrorState
          message="Failed to load ICU-approved records."
          onRetry={() => refetch()}
        />
      ) : (
        <DematTable
          records={records}
          type="ICU_APPROVED"
          onReview={() => {
            toast.info("Lodgment review disabled. Please use batch actions.");
          }}
          onBatchApprove={handleBatchPush}
          page={page}
          pageSize={pageSize}
          total={data?.totalElements || 0}
          totalPages={data?.totalPages || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          approveLabel="Push to CSCS"
        />
      )}
    </div>
  );
}
