import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReturnRecords,
  getReturnRecordById,
  processReturn,
  setNotificationThreshold,
  getReturnInitiations,
  createReturnInitiation,
  reviewReturnInitiation,
  getWithheldPayments,
  recordWithheldPayment,
  reviewWithheldPayment,
  bulkApproveWithheldPayments,
  getRefundRequests,
  createRefundRequest,
  approveRefundRequest,
  rejectRefundRequest,
  markRefundReceived,
} from "@/actions/dividendReturnMoneyActions";
import type {
  ReturnRecordsParams,
  ReturnInitiationsParams,
  WithheldPaymentsParams,
  RefundRequestsParams,
  CreateReturnInitiationPayload,
  ReviewReturnInitiationPayload,
  ProcessReturnPayload,
  RecordWithheldPaymentPayload,
  ReviewWithheldPaymentPayload,
  BulkApproveWithheldPaymentsPayload,
  CreateRefundRequestPayload,
  ApproveRefundRequestPayload,
  RejectRefundRequestPayload,
  SetNotificationThresholdPayload,
} from "@/types/dividend-return-money";

// Real API-backed implementation of the Dividend Return of Money flow. Hook names, signatures
// and return shapes are unchanged from the previous mock so the return-money tabs bind unchanged
// — the backend response DTOs mirror the domain types 1:1, and list results are normalised to the
// same ContentPaginatedResponse shape. initiatedBy / actor fields are derived server-side.

// ── Return Records ────────────────────────────────────────────────────────────

export function useReturnRecords(params?: ReturnRecordsParams) {
  return useQuery({
    queryKey: ["dividend-return-records", params],
    queryFn: () => getReturnRecords(params),
    refetchOnWindowFocus: false,
  });
}

export function useReturnRecordById(id: number) {
  return useQuery({
    queryKey: ["dividend-return-record", id],
    queryFn: () => getReturnRecordById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// ── Return Initiations ────────────────────────────────────────────────────────

export function useReturnInitiations(params?: ReturnInitiationsParams) {
  return useQuery({
    queryKey: ["dividend-return-initiations", params],
    queryFn: () => getReturnInitiations(params),
    refetchOnWindowFocus: false,
  });
}

export function useCreateReturnInitiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnInitiationPayload) => createReturnInitiation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-initiations"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useReviewReturnInitiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewReturnInitiationPayload) => reviewReturnInitiation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-initiations"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

// Legacy — kept for backward compat
export function useProcessReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessReturnPayload) => processReturn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

// ── Withheld Payments ─────────────────────────────────────────────────────────

export function useWithheldPayments(params?: WithheldPaymentsParams) {
  return useQuery({
    queryKey: ["dividend-withheld-payments", params],
    queryFn: () => getWithheldPayments(params),
    refetchOnWindowFocus: false,
  });
}

export function useRecordWithheldPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordWithheldPaymentPayload) => recordWithheldPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-withheld-payments"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useReviewWithheldPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewWithheldPaymentPayload) => reviewWithheldPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-withheld-payments"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useBulkApproveWithheldPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkApproveWithheldPaymentsPayload) =>
      bulkApproveWithheldPayments(payload.ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-withheld-payments"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

// ── Refund Requests ───────────────────────────────────────────────────────────

export function useRefundRequests(params?: RefundRequestsParams) {
  return useQuery({
    queryKey: ["dividend-refund-requests", params],
    queryFn: () => getRefundRequests(params),
    refetchOnWindowFocus: false,
  });
}

export function useCreateRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRefundRequestPayload) => createRefundRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
    },
  });
}

export function useApproveRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveRefundRequestPayload) => approveRefundRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useRejectRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectRefundRequestPayload) => rejectRefundRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
    },
  });
}

export function useMarkRefundReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markRefundReceived(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useSetNotificationThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetNotificationThresholdPayload) => setNotificationThreshold(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}
