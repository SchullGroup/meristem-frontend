"use client";

import { DematStageWorkspace } from "./demat-shared";
import {
  useSubmitForCalloverDematRequest,
  useRejectDematRequest,
} from "@/hooks/useCertDematerialisation";

/** Team Lead Approval = the call-over stage (DRAFT → CALLOVER). */
export function DematTeamLeadApproval() {
  const callover = useSubmitForCalloverDematRequest();
  const reject = useRejectDematRequest();
  return (
    <DematStageWorkspace
      description="Captured records awaiting Team Lead call-over. Approving forwards them to HOD authorisation."
      params={{ status: "DRAFT" }}
      actionLabel="Approve"
      onApprove={(id) => callover.mutateAsync(id)}
      onReject={(id, reason) => reject.mutateAsync({ id, data: { reason } })}
      busy={callover.isPending || reject.isPending}
    />
  );
}
