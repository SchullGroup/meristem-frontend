"use client";

import { DematStageWorkspace } from "./demat-shared";
import {
  useCooApproveDematRequest,
  useBulkCooApproveDematRequest,
  useRejectDematRequest,
} from "@/hooks/useCertDematerialisation";

/** CEO Approval = the COO/executive gate for high-value records (units > 10M): AUTHORISED → COO_APPROVED. */
export function DematCooApproval() {
  const coo = useCooApproveDematRequest();
  const bulkCoo = useBulkCooApproveDematRequest();
  const reject = useRejectDematRequest();
  return (
    <DematStageWorkspace
      description="High-value records (units > 10,000,000) awaiting executive (CEO) approval before they proceed to ICU."
      params={{ pendingCooApproval: true }}
      actionLabel="CEO Approve"
      showHighValue
      onApprove={(id) => coo.mutateAsync(id)}
      onBulkApprove={(ids) => bulkCoo.mutateAsync(ids)}
      onReject={(id, reason) => reject.mutateAsync({ id, data: { reason } })}
      busy={coo.isPending || bulkCoo.isPending || reject.isPending}
    />
  );
}
