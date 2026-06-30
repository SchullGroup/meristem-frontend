import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEED_RETURN_RECORDS,
  SEED_RETURN_INITIATIONS,
  SEED_WITHHELD_PAYMENTS,
  SEED_REFUND_REQUESTS,
} from "@/components/custom/dividend-return-money/seed-data";
import type {
  DividendReturnRecord,
  ReturnInitiation,
  WithheldPayment,
  RefundRequest,
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
import type { ContentPaginatedResponse } from "@/types";

// TODO: swap these mock queryFns for the real actions when endpoints are ready

function paginate<T>(items: T[], page = 0, size = 20): ContentPaginatedResponse<T> {
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const content = items.slice(page * size, page * size + size);
  return { content, totalElements, totalPages, size, page, last: page >= totalPages - 1 };
}

function delay(ms = 600) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Return Records ────────────────────────────────────────────────────────────

export function useReturnRecords(params?: ReturnRecordsParams) {
  return useQuery({
    queryKey: ["dividend-return-records", params],
    queryFn: async () => {
      await delay();
      let records = [...SEED_RETURN_RECORDS];
      if (params?.registerSymbol)
        records = records.filter((r) => r.registerSymbol === params.registerSymbol);
      if (params?.returnStatus)
        records = records.filter((r) => r.returnStatus === params.returnStatus);
      return paginate(records, params?.page, params?.size);
    },
    refetchOnWindowFocus: false,
  });
}

export function useReturnRecordById(id: number) {
  return useQuery({
    queryKey: ["dividend-return-record", id],
    queryFn: async () => {
      await delay(300);
      return SEED_RETURN_RECORDS.find((r) => r.id === id) ?? null;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// ── Return Initiations ────────────────────────────────────────────────────────

export function useReturnInitiations(params?: ReturnInitiationsParams) {
  return useQuery({
    queryKey: ["dividend-return-initiations", params],
    queryFn: async () => {
      await delay();
      let initiations = [...SEED_RETURN_INITIATIONS];
      if (params?.returnRecordId)
        initiations = initiations.filter((i) => i.returnRecordId === params.returnRecordId);
      if (params?.status)
        initiations = initiations.filter((i) => i.status === params.status);
      return paginate(initiations, params?.page, params?.size);
    },
    refetchOnWindowFocus: false,
  });
}

export function useCreateReturnInitiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReturnInitiationPayload): Promise<ReturnInitiation> => {
      await delay(1000);
      const rec = SEED_RETURN_RECORDS.find((r) => r.id === payload.returnRecordId);
      if (!rec) throw new Error("Record not found");
      return {
        id: Date.now(),
        returnRecordId: payload.returnRecordId,
        paymentNumber: rec.paymentNumber,
        registerSymbol: rec.registerSymbol,
        recipientType: payload.recipientType,
        totalUnclaimed: rec.totalUnclaimed,
        returnAmount: rec.returnAmount,
        withheldAmount: rec.withheldAmount,
        secAmount: payload.secAmount,
        narration: payload.narration,
        initiatedBy: payload.initiatedBy,
        initiatedDate: new Date().toISOString().split("T")[0],
        status: "PENDING_APPROVAL",
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-initiations"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useReviewReturnInitiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewReturnInitiationPayload): Promise<ReturnInitiation> => {
      await delay(800);
      const initiation = SEED_RETURN_INITIATIONS.find((i) => i.id === payload.id);
      if (!initiation) throw new Error("Initiation not found");
      if (payload.action === "reject") {
        return { ...initiation, status: "REJECTED", rejectedBy: "Current User", rejectionComment: payload.comment };
      }
      if (initiation.status === "PENDING_APPROVAL") {
        return { ...initiation, status: "ICU_APPROVED", icuApprovedBy: "Current User", icuApprovedDate: new Date().toISOString().split("T")[0] };
      }
      return { ...initiation, status: "PROCESSED", processedBy: "Current User", processedDate: new Date().toISOString().split("T")[0] };
    },
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
    mutationFn: async (payload: ProcessReturnPayload): Promise<DividendReturnRecord> => {
      await delay(1000);
      const rec = SEED_RETURN_RECORDS.find((r) => r.id === payload.returnRecordId);
      if (!rec) throw new Error("Record not found");
      return { ...rec, returnStatus: "RETURNED", recipientType: payload.recipientType };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

// ── Withheld Payments ─────────────────────────────────────────────────────────

export function useWithheldPayments(params?: WithheldPaymentsParams) {
  return useQuery({
    queryKey: ["dividend-withheld-payments", params],
    queryFn: async () => {
      await delay();
      let payments = [...SEED_WITHHELD_PAYMENTS];
      if (params?.returnRecordId)
        payments = payments.filter((p) => p.returnRecordId === params.returnRecordId);
      if (params?.paymentNumber)
        payments = payments.filter((p) => p.paymentNumber === params.paymentNumber);
      return paginate(payments, params?.page, params?.size);
    },
    refetchOnWindowFocus: false,
  });
}

export function useRecordWithheldPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordWithheldPaymentPayload): Promise<WithheldPayment> => {
      await delay(1000);
      return {
        id: Date.now(),
        returnRecordId: payload.returnRecordId,
        declarationId: 0,
        paymentNumber: "",
        registerSymbol: "",
        shareholderName: payload.shareholderName,
        accountNo: payload.accountNo,
        amount: payload.amount,
        paymentDate: new Date().toISOString().split("T")[0],
        reference: `WHP-${Date.now()}`,
        status: "PENDING",
        narration: payload.narration,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-withheld-payments"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useReviewWithheldPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewWithheldPaymentPayload): Promise<WithheldPayment> => {
      await delay(700);
      const payment = SEED_WITHHELD_PAYMENTS.find((p) => p.id === payload.id);
      if (!payment) throw new Error("Payment not found");
      if (payload.action === "reject") {
        return { ...payment, status: "REJECTED", rejectionComment: payload.comment };
      }
      return { ...payment, status: "APPROVED", approvedBy: "Current User", approvedDate: new Date().toISOString().split("T")[0] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-withheld-payments"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useBulkApproveWithheldPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkApproveWithheldPaymentsPayload): Promise<void> => {
      await delay(1000);
      console.log("Bulk approving withheld payments:", payload.ids);
    },
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
    queryFn: async () => {
      await delay();
      let requests = [...SEED_REFUND_REQUESTS];
      if (params?.returnRecordId)
        requests = requests.filter((r) => r.returnRecordId === params.returnRecordId);
      if (params?.status)
        requests = requests.filter((r) => r.status === params.status);
      return paginate(requests, params?.page, params?.size);
    },
    refetchOnWindowFocus: false,
  });
}

export function useCreateRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRefundRequestPayload): Promise<RefundRequest> => {
      await delay(1000);
      const rec = SEED_RETURN_RECORDS.find((r) => r.id === payload.returnRecordId);
      return {
        id: Date.now(),
        returnRecordId: payload.returnRecordId,
        declarationId: rec?.declarationId ?? 0,
        paymentNumber: rec?.paymentNumber ?? "",
        registerSymbol: rec?.registerSymbol ?? "",
        totalWithheld: rec?.withheldAmount ?? 0,
        totalPaidToShareholders: rec?.totalPaidToShareholders ?? 0,
        remainingBalance: rec?.remainingBalance ?? 0,
        requestedAmount: payload.requestedAmount,
        reason: payload.reason,
        requestDate: new Date().toISOString().split("T")[0],
        initiatedBy: payload.initiatedBy,
        status: "PENDING",
        narration: payload.narration,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
    },
  });
}

export function useApproveRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ApproveRefundRequestPayload): Promise<RefundRequest> => {
      await delay(1000);
      const req = SEED_REFUND_REQUESTS.find((r) => r.id === payload.id);
      if (!req) throw new Error("Request not found");
      if (payload.step === "first") {
        return { ...req, status: "FIRST_APPROVED", firstApprovedBy: "Current User", firstApprovedDate: new Date().toISOString().split("T")[0] };
      }
      return { ...req, status: "APPROVED", approvedBy: "Current User", approvedDate: new Date().toISOString().split("T")[0], narration: payload.comment };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useRejectRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RejectRefundRequestPayload): Promise<RefundRequest> => {
      await delay(800);
      const req = SEED_REFUND_REQUESTS.find((r) => r.id === payload.id);
      if (!req) throw new Error("Request not found");
      return { ...req, status: "REJECTED", rejectedBy: "Current User", rejectionComment: payload.comment };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
    },
  });
}

export function useSetNotificationThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SetNotificationThresholdPayload): Promise<void> => {
      await delay(600);
      console.log("Set threshold", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}
