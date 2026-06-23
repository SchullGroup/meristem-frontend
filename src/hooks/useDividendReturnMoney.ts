import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEED_RETURN_RECORDS,
  SEED_WITHHELD_PAYMENTS,
  SEED_REFUND_REQUESTS,
} from "@/components/custom/dividend-return-money/seed-data";
import type {
  DividendReturnRecord,
  WithheldPayment,
  RefundRequest,
  ReturnRecordsParams,
  WithheldPaymentsParams,
  RefundRequestsParams,
  ProcessReturnPayload,
  RecordWithheldPaymentPayload,
  CreateRefundRequestPayload,
} from "@/types/dividend-return-money";
import type { ContentPaginatedResponse } from "@/types";

// TODO: swap these mock queryFns for the real actions when endpoints are ready:
// import { getReturnRecords, getWithheldPayments, getRefundRequests, ... } from "@/actions/dividendReturnMoneyActions";

function paginate<T>(
  items: T[],
  page = 0,
  size = 20,
): ContentPaginatedResponse<T> {
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const content = items.slice(page * size, page * size + size);
  return { content, totalElements, totalPages, size, page, last: page >= totalPages - 1 };
}

function delay(ms = 600) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useReturnRecords(params?: ReturnRecordsParams) {
  return useQuery({
    queryKey: ["dividend-return-records", params],
    queryFn: async () => {
      await delay();
      let records = [...SEED_RETURN_RECORDS];
      if (params?.registerSymbol)
        records = records.filter(
          (r) => r.registerSymbol === params.registerSymbol,
        );
      if (params?.returnStatus)
        records = records.filter(
          (r) => r.returnStatus === params.returnStatus,
        );
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

export function useProcessReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProcessReturnPayload): Promise<DividendReturnRecord> => {
      await delay(1000);
      const rec = SEED_RETURN_RECORDS.find(
        (r) => r.id === payload.returnRecordId,
      );
      if (!rec) throw new Error("Record not found");
      return { ...rec, returnStatus: "RETURNED" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useWithheldPayments(params?: WithheldPaymentsParams) {
  return useQuery({
    queryKey: ["dividend-withheld-payments", params],
    queryFn: async () => {
      await delay();
      let payments = [...SEED_WITHHELD_PAYMENTS];
      if (params?.returnRecordId)
        payments = payments.filter(
          (p) => p.returnRecordId === params.returnRecordId,
        );
      if (params?.paymentNumber)
        payments = payments.filter(
          (p) => p.paymentNumber === params.paymentNumber,
        );
      return paginate(payments, params?.page, params?.size);
    },
    refetchOnWindowFocus: false,
  });
}

export function useRecordWithheldPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: RecordWithheldPaymentPayload,
    ): Promise<WithheldPayment> => {
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
        approvedBy: "Current User",
        narration: payload.narration,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-withheld-payments"] });
      qc.invalidateQueries({ queryKey: ["dividend-return-records"] });
    },
  });
}

export function useRefundRequests(params?: RefundRequestsParams) {
  return useQuery({
    queryKey: ["dividend-refund-requests", params],
    queryFn: async () => {
      await delay();
      let requests = [...SEED_REFUND_REQUESTS];
      if (params?.returnRecordId)
        requests = requests.filter(
          (r) => r.returnRecordId === params.returnRecordId,
        );
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
    mutationFn: async (
      payload: CreateRefundRequestPayload,
    ): Promise<RefundRequest> => {
      await delay(1000);
      const rec = SEED_RETURN_RECORDS.find(
        (r) => r.id === payload.returnRecordId,
      );
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
    mutationFn: async ({
      id,
      comment,
    }: {
      id: number;
      comment?: string;
    }): Promise<RefundRequest> => {
      await delay(1000);
      const req = SEED_REFUND_REQUESTS.find((r) => r.id === id);
      if (!req) throw new Error("Request not found");
      return {
        ...req,
        status: "APPROVED",
        approvedBy: "Current User",
        approvedDate: new Date().toISOString().split("T")[0],
        narration: comment,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividend-refund-requests"] });
    },
  });
}
