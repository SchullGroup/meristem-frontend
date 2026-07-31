// "use server";
//
// Dividend Return of Money API — the real endpoints behind the return-money screen
// (/api/v1/dividend/return-money): unclaimed dividends returned to the issuer/SEC, withheld
// payments to late claimants, and refund requests once the withheld pool is exhausted. The
// backend response DTOs mirror the frontend domain types 1:1. List endpoints return
// ApiResponse<Page<T>>; toContentPage() unwraps the envelope + Spring Page into the
// ContentPaginatedResponse shape the hooks expose. Paths omit /api/v1 (axios baseURL carries it).

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "@/utils/errorManager";
import type { ContentPaginatedResponse } from "@/types";
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
  CreateRefundRequestPayload,
  ApproveRefundRequestPayload,
  RejectRefundRequestPayload,
  SetNotificationThresholdPayload,
} from "@/types/dividend-return-money";

const BASE = "/dividend/return-money";

function unwrap<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "isSuccessful" in body &&
    "data" in body
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}

interface SpringPage<T> {
  content?: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

// Envelope + Spring Page → the ContentPaginatedResponse the hooks return (page = Page.number).
function toContentPage<T>(body: unknown, fallbackSize = 20): ContentPaginatedResponse<T> {
  const p = unwrap<SpringPage<T>>(body) ?? {};
  return {
    content: p.content ?? [],
    last: p.last ?? true,
    page: p.number ?? 0,
    size: p.size ?? fallbackSize,
    totalElements: p.totalElements ?? 0,
    totalPages: p.totalPages ?? 0,
  };
}

// ── Return Records ────────────────────────────────────────────────────────────

export const getReturnRecords = async (params?: ReturnRecordsParams) => {
  try {
    const res = await api.get(BASE, { params });
    return toContentPage<DividendReturnRecord>(res.data, params?.size);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const getReturnRecordById = async (id: number) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap<DividendReturnRecord>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const processReturn = async (payload: ProcessReturnPayload) => {
  try {
    const res = await api.post(`${BASE}/${payload.returnRecordId}/process-return`, {
      recipientType: payload.recipientType,
      returnPercentage: payload.returnPercentage,
      secAmount: payload.secAmount,
      narration: payload.narration,
    });
    return unwrap<DividendReturnRecord>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const setNotificationThreshold = async (payload: SetNotificationThresholdPayload) => {
  try {
    const res = await api.post(`${BASE}/${payload.returnRecordId}/notification-threshold`, {
      thresholdAmount: payload.thresholdAmount,
    });
    return unwrap<DividendReturnRecord>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

// ── Return Initiations (submit → ICU approve → processed) ──────────────────────

export const getReturnInitiations = async (params?: ReturnInitiationsParams) => {
  try {
    const res = await api.get(`${BASE}/initiations`, { params });
    return toContentPage<ReturnInitiation>(res.data, params?.size);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const createReturnInitiation = async (payload: CreateReturnInitiationPayload) => {
  try {
    const res = await api.post(`${BASE}/initiations`, {
      returnRecordId: payload.returnRecordId,
      recipientType: payload.recipientType,
      returnPercentage: payload.returnPercentage,
      secAmount: payload.secAmount,
      narration: payload.narration,
    });
    return unwrap<ReturnInitiation>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const reviewReturnInitiation = async (payload: ReviewReturnInitiationPayload) => {
  try {
    const res = await api.post(`${BASE}/initiations/${payload.id}/review`, {
      action: payload.action,
      comment: payload.comment,
    });
    return unwrap<ReturnInitiation>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

// ── Withheld Payments ──────────────────────────────────────────────────────────

export const getWithheldPayments = async (params?: WithheldPaymentsParams) => {
  try {
    const res = await api.get(`${BASE}/withheld-payments`, { params });
    return toContentPage<WithheldPayment>(res.data, params?.size);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const recordWithheldPayment = async (payload: RecordWithheldPaymentPayload) => {
  try {
    const res = await api.post(`${BASE}/withheld-payments`, payload);
    return unwrap<WithheldPayment>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const reviewWithheldPayment = async (payload: ReviewWithheldPaymentPayload) => {
  try {
    const res = await api.post(`${BASE}/withheld-payments/${payload.id}/review`, {
      action: payload.action,
      comment: payload.comment,
    });
    return unwrap<WithheldPayment>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const bulkApproveWithheldPayments = async (ids: number[]) => {
  try {
    const res = await api.post(`${BASE}/withheld-payments/bulk-approve`, { ids });
    return unwrap<{ processed: number; succeeded: number; failed: number }>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

// ── Refund Requests ────────────────────────────────────────────────────────────

export const getRefundRequests = async (params?: RefundRequestsParams) => {
  try {
    const res = await api.get(`${BASE}/refund-requests`, { params });
    return toContentPage<RefundRequest>(res.data, params?.size);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const createRefundRequest = async (payload: CreateRefundRequestPayload) => {
  try {
    const res = await api.post(`${BASE}/refund-requests`, {
      returnRecordId: payload.returnRecordId,
      requestedAmount: payload.requestedAmount,
      reason: payload.reason,
      narration: payload.narration,
    });
    return unwrap<RefundRequest>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const approveRefundRequest = async (payload: ApproveRefundRequestPayload) => {
  try {
    const res = await api.post(`${BASE}/refund-requests/${payload.id}/approve`, {
      step: payload.step,
      comment: payload.comment,
    });
    return unwrap<RefundRequest>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const rejectRefundRequest = async (payload: RejectRefundRequestPayload) => {
  try {
    const res = await api.post(`${BASE}/refund-requests/${payload.id}/reject`, {
      comment: payload.comment,
    });
    return unwrap<RefundRequest>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};

export const markRefundReceived = async (id: number) => {
  try {
    const res = await api.post(`${BASE}/refund-requests/${id}/mark-received`);
    return unwrap<RefundRequest>(res.data);
  } catch (err) {
    throw new Error(returnErrorMessage(err as ErrorLike));
  }
};
