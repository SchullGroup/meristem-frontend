import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_DIVIDEND_FLOWS,
  GET_DIVIDEND_FLOW,
  CREATE_DIVIDEND_FLOW,
  EDIT_RESEND_DIVIDEND_FLOW,
  GENERATE_PRELIST,
  FORWARD_TO_ICU,
  DECIDE_STAGE,
  SET_ROWS_EXCLUDED,
  MD_DECISION,
  REQUEUE_FAILED,
  GET_DIVIDEND_NOTIFICATIONS,
  SEND_BATCH_EMAILS,
} from "@/actions/dividendFlowActions";
import type { DividendFlowStatus } from "@/types/dividend-declaration-flow";

// Real API-backed implementation of the dividend declaration flow. Hook names, signatures and
// return shapes are unchanged from the previous mock so the 7 declaration tabs bind unchanged —
// the backend DividendFlowResponse mirrors DividendFlowRecord 1:1.

const FLOWS_KEY = "dividend-declaration-flows";
const LOG_KEY = "dividend-declaration-notification-log";

// ── Queries ──────────────────────────────────────────────────────────────────

export interface DividendFlowFilters {
  status?: DividendFlowStatus | DividendFlowStatus[];
  registerSymbol?: string;
}

export function useDividendFlows(filters?: DividendFlowFilters) {
  return useQuery({
    queryKey: [FLOWS_KEY, filters ?? {}],
    queryFn: () =>
      GET_DIVIDEND_FLOWS({ status: filters?.status, registerSymbol: filters?.registerSymbol }),
    refetchOnWindowFocus: false,
  });
}

export function useDividendFlow(id?: string) {
  return useQuery({
    queryKey: [FLOWS_KEY, "one", id],
    queryFn: () => GET_DIVIDEND_FLOW(id!),
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

export function useCreateDividendFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DividendFlowFormValues) => CREATE_DIVIDEND_FLOW(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useEditAndResendDividendFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DividendFlowFormValues }) =>
      EDIT_RESEND_DIVIDEND_FLOW(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── Prelist / forward ──────────────────────────────────────────────────────────

export function useGeneratePrelist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => GENERATE_PRELIST(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useForwardToIcu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: { id: string; actor: string }) => FORWARD_TO_ICU(id, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── Approval decisions (ICU 1st, HOP, ICU 2nd) ──────────────────────────────

export type FlowApprovalStage = "ICU_1" | "HOP" | "ICU_2";

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
    mutationFn: (payload: DecideStagePayload) =>
      DECIDE_STAGE(payload.id, {
        stage: payload.stage,
        decision: payload.decision,
        actor: payload.actor,
        comment: payload.comment,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── ICU 2nd: exclude / re-include rows from the batch ────────────────────────

export function useSetRowsExcluded() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rowIds, excluded, actor }: { id: string; rowIds: string[]; excluded: boolean; actor: string }) =>
      SET_ROWS_EXCLUDED(id, { rowIds, excluded, actor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── MD Approval: initiate payment run (NIBSS) or forward for manual processing

export function useMdDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, actor }: { id: string; decision: "APPROVE_AND_PAY" | "MANUAL"; actor: string }) =>
      MD_DECISION(id, { decision, gateway: "NIBSS", actor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FLOWS_KEY] });
      qc.invalidateQueries({ queryKey: [LOG_KEY] });
    },
  });
}

export function useRequeueFailedPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: { id: string; actor: string }) => REQUEUE_FAILED(id, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

// ── Notifications & Dispatch ─────────────────────────────────────────────────

export function useNotificationLog(declarationId?: string) {
  return useQuery({
    queryKey: [LOG_KEY, declarationId],
    queryFn: () => GET_DIVIDEND_NOTIFICATIONS(declarationId!),
    enabled: !!declarationId,
    refetchOnWindowFocus: false,
  });
}

export function useSendBatchEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ declarationId, subject, sentBy, rowIds }: { declarationId: string; subject: string; sentBy: string; rowIds?: string[] }) =>
      SEND_BATCH_EMAILS(declarationId, { subject, sentBy, rowIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LOG_KEY] });
      qc.invalidateQueries({ queryKey: [FLOWS_KEY] });
    },
  });
}
