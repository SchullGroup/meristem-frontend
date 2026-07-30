"use client";

import { DematStageWorkspace } from "./demat-shared";
import {
  useIcuApproveDematRequest,
  useBulkIcuApproveDematRequest,
  useRejectDematRequest,
} from "@/hooks/useCertDematerialisation";

/** ICU Approval — records ready for ICU (COO_APPROVED, or AUTHORISED and not high-value). */
export function DematIcuApproval() {
  const icu = useIcuApproveDematRequest();
  const bulkIcu = useBulkIcuApproveDematRequest();
  const reject = useRejectDematRequest();
  return (
    <DematStageWorkspace
      description="Records ready for ICU approval. Approving moves them to CSCS lodgement."
      params={{ readyForIcu: true }}
      actionLabel="ICU Approve"
      showHighValue
      onApprove={(id) => icu.mutateAsync(id)}
      onBulkApprove={(ids) => bulkIcu.mutateAsync(ids)}
      onReject={(id, reason) => reject.mutateAsync({ id, data: { reason } })}
      busy={icu.isPending || bulkIcu.isPending || reject.isPending}
    />
  );
}
