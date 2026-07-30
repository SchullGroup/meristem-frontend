import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_MANDATE_BATCHES,
  GET_REJECTED_SHAREHOLDERS,
  GET_MANDATE_NOTIFICATIONS,
  PREVIEW_ELIGIBLE,
  CREATE_BATCH,
  ADD_SHAREHOLDERS,
  SUBMIT_BATCH,
  DECIDE_BATCH,
  FORWARD_SECOND_ICU,
  EXCLUDE_SHAREHOLDERS,
  MD_DECISION,
  REQUEUE_FAILED,
  SEND_MANDATE_NOTIFICATION,
} from "@/actions/mandateBatchActions";
import type {
  MandateBatchStatus,
  MandateRejectionStage,
  MandateShareholder,
} from "@/types/mandate-payment-flow";

// Real API-backed implementation of the new-mandate batch payment flow. Hook names,
// signatures and return shapes are unchanged from the previous mock so the 9 tabs bind
// unchanged — the backend MandateBatchResponse mirrors MandateBatch 1:1. Each eligible-
// preview row's id is the underlying warrant id, so create / add echo those ids back as
// warrantIds; persisted-batch shareholder ids are the batch-row ids (used by exclude/notify).

const BATCHES_KEY = "mandate-payment-batches";
const REJECTED_KEY = "mandate-payment-rejected";
const LOG_KEY = "mandate-payment-notification-log";

// ── Queries ──────────────────────────────────────────────────────────────────

export interface MandateBatchFilters {
  status?: MandateBatchStatus | MandateBatchStatus[];
}

export function useMandateBatches(filters?: MandateBatchFilters) {
  return useQuery({
    queryKey: [BATCHES_KEY, filters],
    queryFn: () => GET_MANDATE_BATCHES(filters?.status),
    refetchOnWindowFocus: false,
  });
}

export function useRejectedShareholders() {
  return useQuery({
    queryKey: [REJECTED_KEY],
    queryFn: () => GET_REJECTED_SHAREHOLDERS(),
    refetchOnWindowFocus: false,
  });
}

export function useMandateNotificationLog(batchId?: string) {
  return useQuery({
    queryKey: [LOG_KEY, batchId],
    queryFn: () => GET_MANDATE_NOTIFICATIONS(batchId),
    refetchOnWindowFocus: false,
  });
}

// ── Create batch ─────────────────────────────────────────────────────────────

// Preview the eligible shareholders for a set of registers before creating the batch
// (newly-mandated + approved + outstanding dividends). Each row's id is the warrant id.
export function usePreviewEligibleBatch() {
  return useMutation({
    mutationFn: ({
      registerSymbols,
    }: {
      registerSymbols: string[];
      dividendNumber?: string;
    }) => PREVIEW_ELIGIBLE({ registerSymbols }),
  });
}

export interface CreateBatchPayload {
  shareholders: MandateShareholder[];
  initiatedBy: string;
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBatchPayload) =>
      CREATE_BATCH({
        // Each previewed row's id is its eligible-warrant id — send the exact selection.
        warrantIds: payload.shareholders.map((s) => s.id),
        initiatedBy: payload.initiatedBy,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      qc.invalidateQueries({ queryKey: [REJECTED_KEY] });
    },
  });
}

// ── Send for approval (QUEUED → PENDING_APPROVAL) ────────────────────────────

export function useSendBatchForApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: { id: string; actor: string }) => SUBMIT_BATCH(id, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Stage decisions (Initiator, HOP, ICU 1st, ICU 2nd) ───────────────────────

export type MandateApprovalStage = MandateRejectionStage;

export interface DecideBatchPayload {
  id: string;
  stage: MandateApprovalStage;
  decision: "APPROVE" | "REJECT";
  actor: string;
  comment?: string;
}

export function useDecideBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DecideBatchPayload) =>
      DECIDE_BATCH(payload.id, {
        stage: payload.stage,
        decision: payload.decision,
        actor: payload.actor,
        comment: payload.comment,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Initiator re-review pass-through (PENDING_REREVIEW → PENDING_ICU_2) ───────

export function useForwardToSecondIcu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: { id: string; actor: string }) => FORWARD_SECOND_ICU(id, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── 2nd ICU exclusion (removes shareholders → Review Queue "Rejected") ────────

export function useExcludeShareholders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      shareholderIds,
      actor,
      reason,
    }: {
      id: string;
      shareholderIds: string[];
      actor: string;
      reason?: string;
      // Retained for call-site compatibility; the stage is recorded server-side.
      stage?: string;
    }) => EXCLUDE_SHAREHOLDERS(id, { shareholderIds, actor, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      qc.invalidateQueries({ queryKey: [REJECTED_KEY] });
    },
  });
}

// Manually add specific outstanding-dividend shareholders to a batch (initiator).
export function useAddShareholdersToBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      shareholders,
      actor,
    }: {
      id: string;
      shareholders: MandateShareholder[];
      actor: string;
      stage?: string;
    }) => ADD_SHAREHOLDERS(id, { warrantIds: shareholders.map((s) => s.id), actor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      qc.invalidateQueries({ queryKey: [REJECTED_KEY] });
    },
  });
}

// Search outstanding-dividend shareholders not already in the batch (manual add).
export function useSearchOutstandingShareholders() {
  return useMutation({
    mutationFn: async ({
      query,
      excludeIds = [],
    }: {
      query: string;
      excludeIds?: string[];
    }) => {
      const rows = await PREVIEW_ELIGIBLE({ query });
      const exclude = new Set(excludeIds);
      return rows.filter((s) => !exclude.has(s.id)).slice(0, 25);
    },
  });
}

// ── MD decision (branching: initiate payment OR forward for manual) ──────────

export function useMdDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      actor,
      gateway = "NIBSS",
    }: {
      id: string;
      decision: "PAY" | "MANUAL";
      actor: string;
      gateway?: "NIBSS" | "REMITA";
    }) => MD_DECISION(id, { decision, gateway, actor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      qc.invalidateQueries({ queryKey: [LOG_KEY] });
    },
  });
}

export function useRequeueFailedPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: { id: string; actor: string }) => REQUEUE_FAILED(id, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Notifications & Reporting ────────────────────────────────────────────────

export function useSendMandateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      subject,
      sentBy,
      recipientIds,
    }: {
      batchId: string;
      subject: string;
      sentBy: string;
      recipientIds?: string[];
    }) => SEND_MANDATE_NOTIFICATION(batchId, { subject, sentBy, recipientIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOG_KEY] }),
  });
}
