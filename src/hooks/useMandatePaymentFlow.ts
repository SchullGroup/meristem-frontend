import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  APPROVERS,
  MOCK_REGISTERS,
  SEED_BATCHES,
  SEED_NOTIFICATION_LOG,
  SEED_REJECTED_SHAREHOLDERS,
  makeShareholders,
  nextBatchRef,
  processBatchPayments,
  reRollFailedPayments,
} from "@/components/custom/new-mandate/seed-data";
import type {
  MandateBatch,
  MandateBatchStatus,
  MandateNotificationLogEntry,
  MandateRejectionStage,
} from "@/types/mandate-payment-flow";

// Mock data source — mutates the shared seed arrays in place so a batch visibly
// progresses across tabs as the user clicks through the approval chain.

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms));
}

const BATCHES_KEY = "mandate-payment-batches";
const REJECTED_KEY = "mandate-payment-rejected";
const LOG_KEY = "mandate-payment-notification-log";

function today() {
  return new Date().toISOString().split("T")[0];
}

function findBatch(id: string): MandateBatch {
  const rec = SEED_BATCHES.find((b) => b.id === id);
  if (!rec) throw new Error("Batch not found");
  return rec;
}

function replaceBatch(updated: MandateBatch) {
  const idx = SEED_BATCHES.findIndex((b) => b.id === updated.id);
  if (idx === -1) throw new Error("Batch not found");
  SEED_BATCHES[idx] = updated;
  return updated;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export interface MandateBatchFilters {
  status?: MandateBatchStatus | MandateBatchStatus[];
}

export function useMandateBatches(filters?: MandateBatchFilters) {
  return useQuery({
    queryKey: [BATCHES_KEY, filters],
    queryFn: async () => {
      await delay(250);
      let rows = [...SEED_BATCHES];
      if (filters?.status) {
        const statuses = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        rows = rows.filter((r) => statuses.includes(r.status));
      }
      return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

export function useRejectedShareholders() {
  return useQuery({
    queryKey: [REJECTED_KEY],
    queryFn: async () => {
      await delay(200);
      return [...SEED_REJECTED_SHAREHOLDERS];
    },
    refetchOnWindowFocus: false,
  });
}

export function useMandateNotificationLog(batchId?: string) {
  return useQuery({
    queryKey: [LOG_KEY, batchId],
    queryFn: async () => {
      await delay(200);
      let rows = [...SEED_NOTIFICATION_LOG];
      if (batchId) rows = rows.filter((r) => r.batchId === batchId);
      return rows.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

// ── Create batch ─────────────────────────────────────────────────────────────

export interface CreateBatchPayload {
  registerSymbols: string[];
  count: number;
  initiatedBy: string;
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBatchPayload) => {
      await delay(700);
      const symbols =
        payload.registerSymbols.length > 0
          ? payload.registerSymbols
          : MOCK_REGISTERS.slice(0, 3).map((r) => r.symbol);
      const batchRef = nextBatchRef();
      const batch: MandateBatch = {
        id: batchRef,
        batchRef,
        createdAt: today(),
        status: "QUEUED",
        initiatedBy: payload.initiatedBy,
        shareholders: makeShareholders(payload.count, symbols),
        excluded: [],
        approvalTrail: [
          {
            stage: "Batch Creation",
            actor: payload.initiatedBy,
            action: "CREATED",
            date: today(),
          },
        ],
      };
      SEED_BATCHES.push(batch);
      return batch;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Send for approval (QUEUED → PENDING_APPROVAL) ────────────────────────────

export function useSendBatchForApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actor }: { id: string; actor: string }) => {
      await delay(500);
      const existing = findBatch(id);
      return replaceBatch({
        ...existing,
        status: "PENDING_APPROVAL",
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "Pending Approval",
            actor,
            action: "SUBMITTED",
            date: today(),
          },
        ],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Stage decisions (Initiator, HOP, ICU 1st, ICU 2nd) ───────────────────────

export type MandateApprovalStage = MandateRejectionStage;

const STAGE_LABEL: Record<MandateApprovalStage, string> = {
  APPROVAL: "Pending Approval",
  HOP: "HOP Approval",
  ICU_1: "ICU Approval (1st)",
  ICU_2: "2nd ICU Approval",
};

const NEXT_STATUS: Record<MandateApprovalStage, MandateBatchStatus> = {
  APPROVAL: "PENDING_HOP",
  HOP: "PENDING_ICU_1",
  ICU_1: "PENDING_REREVIEW", // 1st ICU approval returns the batch to the Initiator
  ICU_2: "PENDING_MD",
};

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
    mutationFn: async (payload: DecideBatchPayload) => {
      await delay(650);
      const existing = findBatch(payload.id);
      return replaceBatch({
        ...existing,
        status:
          payload.decision === "APPROVE"
            ? NEXT_STATUS[payload.stage]
            : "REJECTED",
        rejectedAt: payload.decision === "REJECT" ? payload.stage : undefined,
        rejectionComment:
          payload.decision === "REJECT" ? payload.comment : undefined,
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: STAGE_LABEL[payload.stage],
            actor: payload.actor,
            action: payload.decision === "APPROVE" ? "APPROVED" : "REJECTED",
            comment: payload.comment,
            date: today(),
          },
        ],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Initiator re-review pass-through (PENDING_REREVIEW → PENDING_ICU_2) ───────

export function useForwardToSecondIcu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actor }: { id: string; actor: string }) => {
      await delay(500);
      const existing = findBatch(id);
      return replaceBatch({
        ...existing,
        status: "PENDING_ICU_2",
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "Initiator Re-Review",
            actor,
            action: "SUBMITTED",
            comment: "Confirmed 1st ICU approval; forwarded to 2nd ICU.",
            date: today(),
          },
        ],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── 2nd ICU exclusion (removes shareholders → Review Queue "Rejected") ────────

export function useExcludeShareholders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      shareholderIds,
      actor,
      reason,
    }: {
      id: string;
      shareholderIds: string[];
      actor: string;
      reason?: string;
    }) => {
      await delay(500);
      const existing = findBatch(id);
      const removed = existing.shareholders.filter((s) =>
        shareholderIds.includes(s.id),
      );
      const remaining = existing.shareholders.filter(
        (s) => !shareholderIds.includes(s.id),
      );
      const stamped = removed.map((s) => ({
        ...s,
        excludedReason: reason || "Excluded during 2nd ICU review.",
        excludedFromBatchRef: existing.batchRef,
      }));
      // Excluded shareholders return to the Review Queue's Rejected view.
      SEED_REJECTED_SHAREHOLDERS.unshift(...stamped);
      return replaceBatch({
        ...existing,
        shareholders: remaining,
        excluded: [...existing.excluded, ...stamped],
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "2nd ICU Approval",
            actor,
            action: "EXCLUDED",
            comment: `${removed.length} shareholder(s) excluded${reason ? ` — ${reason}` : ""}`,
            date: today(),
          },
        ],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      qc.invalidateQueries({ queryKey: [REJECTED_KEY] });
    },
  });
}

// ── MD decision (branching: initiate payment OR forward for manual) ──────────

export function useMdDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      actor,
      gateway = "NIBSS",
    }: {
      id: string;
      decision: "PAY" | "MANUAL";
      actor: string;
      gateway?: "NIBSS" | "REMITA";
    }) => {
      await delay(1200);
      const existing = findBatch(id);

      if (decision === "MANUAL") {
        return replaceBatch({
          ...existing,
          status: "MANUAL_PROCESSING",
          approvalTrail: [
            ...existing.approvalTrail,
            {
              stage: "MD Approval",
              actor,
              action: "FORWARDED_MANUAL",
              comment: "Approved & forwarded for manual NIBSS processing.",
              date: today(),
            },
          ],
        });
      }

      const shareholders = processBatchPayments(existing.shareholders);
      const anyFailed = shareholders.some((r) => r.paymentStatus === "FAILED");
      const saved = replaceBatch({
        ...existing,
        shareholders,
        status: anyFailed ? "PARTIALLY_PAID" : "PAID",
        gateway,
        paymentRunRef: `PAY-NMB-${randInt(90000, 99999)}`,
        paymentInitiatedAt: today(),
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "MD Approval",
            actor,
            action: "PAYMENT_INITIATED",
            comment: `Approved & initiated payment via ${gateway}.`,
            date: today(),
          },
        ],
      });

      // Stakeholders are notified automatically once a payment run starts.
      SEED_NOTIFICATION_LOG.push({
        id: `NTF-${Date.now()}`,
        batchId: saved.id,
        batchRef: saved.batchRef,
        subject: `Mandate Payment Run Initiated — ${saved.batchRef}`,
        recipients: APPROVERS.map((a) => `${a.name} <${a.email}>`),
        recipientType: "STAKEHOLDERS",
        trigger: "AUTOMATIC",
        sentAt: new Date().toISOString(),
        sentBy: "Automated Notification System",
      });

      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      qc.invalidateQueries({ queryKey: [LOG_KEY] });
    },
  });
}

export function useRequeueFailedPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actor }: { id: string; actor: string }) => {
      await delay(900);
      const existing = findBatch(id);
      const shareholders = reRollFailedPayments(existing.shareholders);
      const anyFailed = shareholders.some((r) => r.paymentStatus === "FAILED");
      return replaceBatch({
        ...existing,
        shareholders,
        status: anyFailed ? "PARTIALLY_PAID" : "PAID",
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "Payment Results",
            actor,
            action: "PAYMENT_REQUEUED",
            date: today(),
          },
        ],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCHES_KEY] }),
  });
}

// ── Notifications & Reporting ────────────────────────────────────────────────

export function useSendMandateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      subject,
      sentBy,
      recipientIds,
    }: {
      batchId: string;
      subject: string;
      sentBy: string;
      recipientIds?: string[];
    }) => {
      await delay(800);
      const batch = findBatch(batchId);
      const targets =
        recipientIds && recipientIds.length > 0
          ? batch.shareholders.filter((s) => recipientIds.includes(s.id))
          : batch.shareholders;
      // Simulate a small number of non-deliveries for the delivery report.
      const undelivered = targets
        .filter(() => Math.random() < 0.08)
        .map((s) => `${s.name} <${s.email}>`);
      const entry: MandateNotificationLogEntry = {
        id: `NTF-${Date.now()}`,
        batchId,
        batchRef: batch.batchRef,
        subject,
        recipients: targets.map((s) => `${s.name} <${s.email}>`),
        recipientType: "SHAREHOLDERS",
        trigger: "MANUAL",
        sentAt: new Date().toISOString(),
        sentBy,
        undelivered: undelivered.length > 0 ? undelivered : undefined,
      };
      SEED_NOTIFICATION_LOG.push(entry);
      return entry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOG_KEY] }),
  });
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
