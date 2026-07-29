import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  APPROVERS,
  MOCK_REGISTERS,
  SEED_DIVIDEND_FLOWS,
  SEED_NOTIFICATION_LOG,
  computeTier,
  generatePrelist,
  processPayment,
  reRollFailedPayments,
} from "@/components/custom/dividend-declaration/seed-data";
import type {
  DividendFlowRecord,
  DividendFlowStatus,
  NotificationLogEntry,
  RejectionStage,
} from "@/types/dividend-declaration-flow";

// Mock data source — mutates the shared seed array in place so the pipeline
// visibly progresses across tabs as the user clicks through it.

function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms));
}

const FLOWS_KEY = "dividend-declaration-flows";
const LOG_KEY = "dividend-declaration-notification-log";

function today() {
  return new Date().toISOString().split("T")[0];
}

function effectiveWhtRate(
  whtRate: number,
  isTaxExempt: boolean,
  exemptionRate?: number,
) {
  return isTaxExempt ? (exemptionRate ?? 0) : whtRate;
}

function findFlow(id: string): DividendFlowRecord {
  const rec = SEED_DIVIDEND_FLOWS.find((f) => f.id === id);
  if (!rec) throw new Error("Dividend declaration not found");
  return rec;
}

function replaceFlow(updated: DividendFlowRecord) {
  const idx = SEED_DIVIDEND_FLOWS.findIndex((f) => f.id === updated.id);
  if (idx === -1) throw new Error("Dividend declaration not found");
  SEED_DIVIDEND_FLOWS[idx] = updated;
  return updated;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export interface DividendFlowFilters {
  status?: DividendFlowStatus | DividendFlowStatus[];
  registerSymbol?: string;
}

export function useDividendFlows(filters?: DividendFlowFilters) {
  return useQuery({
    queryKey: [FLOWS_KEY, filters],
    queryFn: async () => {
      await delay(300);
      let rows = [...SEED_DIVIDEND_FLOWS];
      if (filters?.status) {
        const statuses = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        rows = rows.filter((r) => statuses.includes(r.status));
      }
      if (filters?.registerSymbol) {
        rows = rows.filter((r) => r.registerSymbol === filters.registerSymbol);
      }
      return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

export function useDividendFlow(id?: string) {
  return useQuery({
    queryKey: [FLOWS_KEY, "one", id],
    queryFn: async () => {
      await delay(150);
      return SEED_DIVIDEND_FLOWS.find((f) => f.id === id) ?? null;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// ── Create / Edit & Resend ───────────────────────────────────────────────────

export interface DividendFlowFormValues {
  registerSymbol: string;
  dividendType: "FINAL" | "INTERIM" | "SPECIAL";
  currency: string;
  rate: number;
  fractionalRegister: boolean;
  qualificationDate: string;
  closureDate: string;
  paymentDate: string;
  narrative?: string;
  whtRate: number;
  isTaxExempt: boolean;
  exemptionRate?: number;
  warehouseBank?: string;
  warehouseAccountNo?: string;
  initiatedBy: string;
}

function deriveFinancials(values: DividendFlowFormValues) {
  const register = MOCK_REGISTERS.find(
    (r) => r.symbol === values.registerSymbol,
  );
  if (!register) throw new Error("Register not found");
  const wht = effectiveWhtRate(
    values.whtRate,
    values.isTaxExempt,
    values.exemptionRate,
  );
  const grossLiability = register.currentStockInIssue * values.rate;
  const whtAmount = grossLiability * (wht / 100);
  const netLiability = grossLiability - whtAmount;
  return {
    register,
    effectiveWht: wht,
    grossLiability,
    whtAmount,
    netLiability,
    tier: computeTier(grossLiability),
  };
}

export function useCreateDividendFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: DividendFlowFormValues) => {
      await delay(700);
      const { register, grossLiability, whtAmount, netLiability, tier } =
        deriveFinancials(values);
      const paymentNumber = `DIV-${new Date().getFullYear()}/${100 + SEED_DIVIDEND_FLOWS.length + 1}`;
      const record: DividendFlowRecord = {
        id: paymentNumber,
        paymentNumber,
        registerSymbol: register.symbol,
        registerName: register.registerName,
        dividendType: values.dividendType,
        rate: values.rate,
        currency: values.currency,
        qualificationDate: values.qualificationDate,
        closureDate: values.closureDate,
        paymentDate: values.paymentDate,
        fractionalRegister: values.fractionalRegister,
        narrative: values.narrative,
        whtRate: values.whtRate,
        isTaxExempt: values.isTaxExempt,
        exemptionRate: values.exemptionRate,
        warehouseBank: values.warehouseBank,
        warehouseAccountNo: values.warehouseAccountNo,
        tier,
        grossLiability,
        whtAmount,
        netLiability,
        totalShareholders: register.currentShareholdersSize,
        status: "DRAFT",
        initiatedBy: values.initiatedBy,
        createdAt: today(),
        prelist: [],
        approvalTrail: [
          {
            stage: "Initiation",
            actor: values.initiatedBy,
            action: "CREATED",
            date: today(),
          },
        ],
      };
      SEED_DIVIDEND_FLOWS.push(record);
      return record;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

const RESEND_STATUS: Record<RejectionStage, DividendFlowStatus> = {
  ICU_1: "PENDING_ICU_1",
  HOP: "PENDING_HOP",
  ICU_2: "PENDING_ICU_2",
};

export function useEditAndResendDividendFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: DividendFlowFormValues;
    }) => {
      await delay(700);
      const existing = findFlow(id);
      if (existing.status !== "REJECTED") {
        throw new Error("Only rejected declarations can be edited and resent.");
      }
      const { register, grossLiability, whtAmount, netLiability, tier } =
        deriveFinancials(values);
      const prelist = generatePrelist(
        register,
        values.rate,
        effectiveWhtRate(
          values.whtRate,
          values.isTaxExempt,
          values.exemptionRate,
        ),
      );
      const nextStatus = existing.rejectedAt
        ? RESEND_STATUS[existing.rejectedAt]
        : "PENDING_ICU_1";
      const updated: DividendFlowRecord = {
        ...existing,
        registerSymbol: register.symbol,
        registerName: register.registerName,
        dividendType: values.dividendType,
        rate: values.rate,
        currency: values.currency,
        qualificationDate: values.qualificationDate,
        closureDate: values.closureDate,
        paymentDate: values.paymentDate,
        fractionalRegister: values.fractionalRegister,
        narrative: values.narrative,
        whtRate: values.whtRate,
        isTaxExempt: values.isTaxExempt,
        exemptionRate: values.exemptionRate,
        warehouseBank: values.warehouseBank,
        warehouseAccountNo: values.warehouseAccountNo,
        tier,
        grossLiability,
        whtAmount,
        netLiability,
        totalShareholders: prelist.length,
        status: nextStatus,
        rejectedAt: undefined,
        rejectionComment: undefined,
        prelist,
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "Edit & Resend",
            actor: values.initiatedBy,
            action: "SUBMITTED",
            date: today(),
          },
        ],
      };
      return replaceFlow(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── Prelist ──────────────────────────────────────────────────────────────────

export function useGeneratePrelist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await delay(900);
      const existing = findFlow(id);
      const register = MOCK_REGISTERS.find(
        (r) => r.symbol === existing.registerSymbol,
      );
      if (!register) throw new Error("Register not found");
      const wht = effectiveWhtRate(
        existing.whtRate,
        existing.isTaxExempt,
        existing.exemptionRate,
      );
      const prelist = generatePrelist(register, existing.rate, wht);
      const grossLiability = prelist.reduce((s, r) => s + r.grossAmount, 0);
      const whtAmount = prelist.reduce((s, r) => s + r.whtAmount, 0);
      const netLiability = prelist.reduce((s, r) => s + r.netAmount, 0);
      const updated: DividendFlowRecord = {
        ...existing,
        prelist,
        grossLiability,
        whtAmount,
        netLiability,
        tier: computeTier(grossLiability),
        totalShareholders: prelist.length,
        status: "PRELIST_GENERATED",
      };
      return replaceFlow(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useForwardToIcu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actor }: { id: string; actor: string }) => {
      await delay(500);
      const existing = findFlow(id);
      const updated: DividendFlowRecord = {
        ...existing,
        status: "PENDING_ICU_1",
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "ICU 1st Approval",
            actor,
            action: "SUBMITTED",
            date: today(),
          },
        ],
      };
      return replaceFlow(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── Approval decisions (ICU 1st, HOP, ICU 2nd) ──────────────────────────────

export type FlowApprovalStage = "ICU_1" | "HOP" | "ICU_2";

const STAGE_LABEL: Record<FlowApprovalStage, string> = {
  ICU_1: "ICU 1st Approval",
  HOP: "HOP Approval",
  ICU_2: "ICU 2nd Approval",
};

const NEXT_STATUS: Record<FlowApprovalStage, DividendFlowStatus> = {
  ICU_1: "PENDING_HOP",
  HOP: "PENDING_ICU_2",
  ICU_2: "PENDING_MD",
};

export interface DecideStagePayload {
  id: string;
  stage: FlowApprovalStage;
  decision: "APPROVE" | "REJECT";
  actor: string;
  comment?: string;
}

export function useDecideStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DecideStagePayload) => {
      await delay(700);
      const existing = findFlow(payload.id);
      const updated: DividendFlowRecord = {
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
      };
      return replaceFlow(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── ICU 2nd: exclude / re-include rows from the batch ────────────────────────

export function useSetRowsExcluded() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      rowIds,
      excluded,
      actor,
    }: {
      id: string;
      rowIds: string[];
      excluded: boolean;
      actor: string;
    }) => {
      await delay(400);
      const existing = findFlow(id);
      const ids = new Set(rowIds);
      const updated: DividendFlowRecord = {
        ...existing,
        prelist: existing.prelist.map((r) =>
          ids.has(r.id) ? { ...r, excluded } : r,
        ),
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "ICU 2nd Approval",
            actor,
            action: "EXCLUDED",
            comment: `${excluded ? "Excluded" : "Re-included"} ${rowIds.length} record(s)`,
            date: today(),
          },
        ],
      };
      return replaceFlow(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── MD Approval: initiate payment run (NIBSS) or forward for manual processing

export function useMdDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      actor,
    }: {
      id: string;
      decision: "APPROVE_AND_PAY" | "MANUAL";
      actor: string;
    }) => {
      await delay(decision === "APPROVE_AND_PAY" ? 1400 : 600);
      const existing = findFlow(id);

      if (decision === "MANUAL") {
        const updated: DividendFlowRecord = {
          ...existing,
          status: "MANUAL_PROCESSING",
          approvalTrail: [
            ...existing.approvalTrail,
            {
              stage: "MD Approval",
              actor,
              action: "FORWARDED_MANUAL",
              comment: "Forwarded for manual processing",
              date: today(),
            },
          ],
        };
        return replaceFlow(updated);
      }

      const prelist = processPayment(existing.prelist);
      const payable = prelist.filter((r) => !r.excluded);
      const anyFailed = payable.some((r) => r.paymentStatus === "FAILED");
      const updated: DividendFlowRecord = {
        ...existing,
        prelist,
        gateway: "NIBSS",
        paymentRunRef: `PAY-DIV-${Math.floor(90000 + Math.random() * 9999)}`,
        paymentInitiatedAt: today(),
        status: anyFailed ? "PARTIALLY_PAID" : "PAID",
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "MD Approval",
            actor,
            action: "PAYMENT_INITIATED",
            comment: "Approved & payment run initiated via NIBSS",
            date: today(),
          },
        ],
      };
      const saved = replaceFlow(updated);

      // Approvers are notified automatically once the run is initiated.
      SEED_NOTIFICATION_LOG.push({
        id: `NTF-${Date.now()}`,
        declarationId: saved.id,
        paymentNumber: saved.paymentNumber,
        subject: `Payment Run Initiated — ${saved.paymentNumber} (${saved.registerSymbol})`,
        recipients: APPROVERS.map((a) => `${a.name} <${a.email}>`),
        recipientType: "APPROVERS",
        trigger: "AUTOMATIC",
        sentAt: new Date().toISOString(),
        sentBy: "Automated Notification System",
      });

      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLOWS_KEY] });
      qc.invalidateQueries({ queryKey: [LOG_KEY] });
    },
  });
}

export function useRequeueFailedPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actor }: { id: string; actor: string }) => {
      await delay(1000);
      const existing = findFlow(id);
      const prelist = reRollFailedPayments(existing.prelist);
      const anyFailed = prelist.some((r) => r.paymentStatus === "FAILED");
      const updated: DividendFlowRecord = {
        ...existing,
        prelist,
        status: anyFailed ? "PARTIALLY_PAID" : "PAID",
        approvalTrail: [
          ...existing.approvalTrail,
          {
            stage: "Payment Processing",
            actor,
            action: "PAYMENT_REQUEUED",
            date: today(),
          },
        ],
      };
      return replaceFlow(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── Notifications & Dispatch ─────────────────────────────────────────────────

export function useNotificationLog(declarationId?: string) {
  return useQuery({
    queryKey: [LOG_KEY, declarationId],
    queryFn: async () => {
      await delay(200);
      let rows = [...SEED_NOTIFICATION_LOG];
      if (declarationId) {
        rows = rows.filter((r) => r.declarationId === declarationId);
      }
      return rows.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

export function useSendBatchEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      declarationId,
      subject,
      sentBy,
      rowIds,
    }: {
      declarationId: string;
      subject: string;
      sentBy: string;
      // Omit to email every shareholder in the batch.
      rowIds?: string[];
    }) => {
      await delay(900);
      const record = findFlow(declarationId);
      const target = rowIds ? new Set(rowIds) : null;
      const recipients: string[] = [];

      const prelist = record.prelist.map((r) => {
        if (target && !target.has(r.id)) return r;
        recipients.push(`${r.holderName} <${r.email}>`);
        // ~92% delivered, ~8% bounced.
        return {
          ...r,
          emailStatus: "SENT" as const,
          deliveryStatus: (Math.random() < 0.92 ? "DELIVERED" : "BOUNCED") as
            | "DELIVERED"
            | "BOUNCED",
        };
      });

      replaceFlow({ ...record, prelist });

      const entry: NotificationLogEntry = {
        id: `NTF-${Date.now()}`,
        declarationId,
        paymentNumber: record.paymentNumber,
        subject,
        recipients,
        recipientType: "SHAREHOLDERS",
        trigger: "MANUAL",
        sentAt: new Date().toISOString(),
        sentBy,
      };
      SEED_NOTIFICATION_LOG.push(entry);
      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LOG_KEY] });
      qc.invalidateQueries({ queryKey: [FLOWS_KEY] });
    },
  });
}
