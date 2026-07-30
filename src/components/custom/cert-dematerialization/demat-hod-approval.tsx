"use client";

import { DematStageWorkspace } from "./demat-shared";
import {
  useAuthorizeDematRequest,
  useBulkAuthorizeDematRequest,
  useRejectDematRequest,
} from "@/hooks/useCertDematerialisation";

/** HOD Approval = the authorise stage (CALLOVER → AUTHORISED). */
export function DematHodApproval() {
  const authorise = useAuthorizeDematRequest();
  const bulkAuthorise = useBulkAuthorizeDematRequest();
  const reject = useRejectDematRequest();
  return (
    <DematStageWorkspace
      description="Records called over and awaiting HOD authorisation. High-value records (units > 10M) route to CEO approval next; the rest go straight to ICU."
      params={{ status: "CALLOVER" }}
      actionLabel="Authorise"
      showHighValue
      onApprove={(id) => authorise.mutateAsync(id)}
      onBulkApprove={(ids) => bulkAuthorise.mutateAsync(ids)}
      onReject={(id, reason) => reject.mutateAsync({ id, data: { reason } })}
      busy={authorise.isPending || bulkAuthorise.isPending || reject.isPending}
    />
  );
}
