import api from "@/services/api";
import { ApiResponse, Pageable, PaginatedResponse, Sort } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// Payment run object (from GET /{id} and list responses)
export interface PaymentRun {
  id: number;
  ref: string;
  paymentNumber: string;
  declarationId: number;
  registerSymbol: string;
  gateway: string;
  totalRecords: number;
  totalAmount: number;
  dateRun: string; // "2026-06-04"
  status?: "PENDING_ICU" | "PROCESSING" | "PAID" | "FAILED";
  paidRecords: number;
  failedRecords: number;
}

// Initiate payment run request body
export interface InitiatePaymentRunRequest {
  declarationId: string;
  gateway: string;
  initiatedBy: string;
}

// Approve payment run request body
export interface ApprovePaymentRunRequest {
  comment: string;
  authorisedBy: string;
}

// Response for repush endpoint
export interface RepushResponse {
  queuedRecords: number;
}

// List query parameters
export interface ListPaymentRunsParams {
  registerId?: string;
  status?: "PENDING_ICU" | "PROCESSING" | "PAID" | "FAILED";
  gateway?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface Approval {
  role: string;
  approverName: string;
  approverId: string;
  decision: string; // e.g., 'APPROVED' | 'REJECTED' if you want to use strict literal types
  comment: string;
  decidedAt: string; // ISO Date-time string
}

export interface DividendDeclaration {
  id: number;
  registerId: string;
  registerName: string;
  registerSymbol: string;
  paymentNumber: string;
  dividendType: string;
  rate: number;
  currency: string;
  qualificationDate: string; // ISO Date string (YYYY-MM-DD)
  closureDate: string;       // ISO Date string (YYYY-MM-DD)
  paymentDate: string;       // ISO Date string (YYYY-MM-DD)
  grossLiability: number;
  whtAmount: number;
  netLiability: number;
  tier: number;
  status: string;
  initiatorId: string;
  initiatorName: string;
  narrative: string;
  approvals: Approval[];
  createdAt: string; // ISO Date-time string
}

export interface MandatePayment {
  id: number;
  approvalRef: string;
  submittedDate: string;
  accountNumber: string;
  holderName: string;
  newBank: string;
  newAccountNumber: string;
  sortCode: string;
  dividendNumber: string;
  amount: number;
  submittedBy: string;
  status: string;
  tier: number;
}

export interface RepushQueue {
  id: number;
  declarationId: number;
  paymentNumber: string;
  registerSymbol: string;
  registerId: string;
  shareholderId: string;
  accountNumber: string;
  holderName: string;
  chn: string;
  unitsHeld: number;
  warrantNumber: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  bankName: string;
  bankAccount: string;
  sortCode: string;
  status: string;
  paymentDate: string;
  failReason: string;
}

// Repush queue item (warrant that failed/rejected/unpaid)
export interface RepushQueueItem {
  id: number;
  declarationId: number;
  paymentNumber: string;
  registerSymbol: string;
  registerId: string;
  shareholderId: string;
  accountNumber: string;
  holderName: string;
  chn: string;
  unitsHeld: number;
  warrantNumber: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  bankName: string;
  bankAccount: string;
  sortCode: string;
  status: string; // e.g., "FAILED", "REJECTED", "UNPAID"
  paymentDate: string; // "2026-06-04"
  failReason: string;
}

// Single repush response
export interface SingleRepushResponse {
  id: number;
  status: string;
  gateway: string;
}

// Batch repush request body
export interface BatchRepushRequest {
  ids: string[]; // array of warrant IDs or refs
  comment: string;
  authorisedBy: string;
}

// Batch repush response - individual error details
export interface BatchRepushError {
  id: string;
  reason: string;
}

export interface BatchRepushResponse {
  processed: number;
  succeeded: number;
  failed: number;
  errors: BatchRepushError[];
}

// Query parameters for listing repush queue
export interface ListRepushQueueParams {
  status?: string;
  registerId?: string;
  page?: number;
  size?: number;
}

export interface DeclarationPaymentData {
  totalOnRegister: number;
  totalEligible: number;
  totalPayout: number;
  successful: number;
  failedAttempts: number;
  declarationId: number;
  registerId: string;
  registerSymbol: string;
  paymentNumber: string;
  dividendType: string;
  rows: RowsPagination;
}

// 2. Define the pagination wrapper specifically for the "rows" object
export interface RowsPagination {
  totalElements: number;
  totalPages: number;
  pageable: Pageable;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: PaymentRowContent[];
  number: number;
  sort: Sort;
  empty: boolean;
}

export interface PaymentRowContent {
  serial: number;
  declarationId: number;
  accountNumber: string;
  holderName: string;
  bankSortCode: string;
  bankName: string;
  amount: number;
  narration: string;
  status: string;
  warrantNumber: string;
}

export type DeclarationPaymentResponse = ApiResponse<DeclarationPaymentData>

// GET /api/v1/dividend/payment-runs – List payment runs (paginated)
export const listPaymentRunsRequest = async (params?: ListPaymentRunsParams) => {
  try {
    const res = await api.get<PaginatedResponse<PaymentRun>>(
      "/dividend/payment-runs",
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// POST /api/v1/dividend/payment-runs – Initiate a new payment run
export const initiatePaymentRunRequest = async (
  body: InitiatePaymentRunRequest,
) => {
  try {
    const res = await api.post<ApiResponse<PaymentRun>>(
      "/dividend/payment-runs",
      body,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET /api/v1/dividend/payment-runs/{id} – Get single payment run by ID
export const getPaymentRunByIdRequest = async (id: number) => {
  try {
    const res = await api.get<ApiResponse<PaymentRun>>(
      `/dividend/payment-runs/${id}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// POST /api/v1/dividend/payment-runs/{id}/repush – Re-push failed records
export const repushPaymentRunRequest = async (id: number) => {
  try {
    const res = await api.post<ApiResponse<RepushResponse>>(
      `/dividend/payment-runs/${id}/repush`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// POST /api/v1/dividend/payment-runs/{id}/approve
export const approvePaymentRunRequest = async (
  id: number,
  body: ApprovePaymentRunRequest,
) => {
  try {
    const res = await api.post<ApiResponse<PaymentRun>>(
      `/dividend/payment-runs/${id}/approve`,
      body,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET /api/v1/dividend/payment-runs/{id}/receipt – Download receipt (PDF stub)
export const downloadPaymentRunReceiptRequest = async (id: number) => {
  try {
    // Expects a blob response (application/pdf)
    const res = await api.get<Blob>(`/dividend/payment-runs/${id}/receipt`, {
      responseType: "blob",
    });
    return res.data; // returns a Blob you can use to create a download link
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET /api/v1/dividend/payment-runs/{id}/nibss-file – Download NIBSS settlement file
export const downloadNibssFileRequest = async (id: number) => {
  try {
    // Usually a text/csv or application/octet-stream file
    const res = await api.get<Blob>(`/dividend/payment-runs/${id}/nibss-file`, {
      responseType: "blob",
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET /api/v1/dividend/payment-runs/{id} – Get single payment run by ID
export const getRepushQueue = async (id: number) => {
  try {
    const res = await api.get<ApiResponse<PaymentRun>>(
      `/dividend/payment-runs/${id}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET /api/v1/dividend/repush-queue - List repush queue
export const listRepushQueueRequest = async (params?: ListRepushQueueParams) => {
  try {
    const res = await api.get<PaginatedResponse<RepushQueueItem>>(
      '/dividend/repush-queue',
      { params }
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// POST /api/v1/dividend/repush-queue/{id}/repush - Repush a single failed payment
export const repushSingleRequest = async (id: number) => {
  try {
    const res = await api.post<ApiResponse<SingleRepushResponse>>(
      `/dividend/repush-queue/${id}/repush`
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// POST /api/v1/dividend/repush-queue/batch/repush - Batch repush failed payments
export const batchRepushRequest = async (body: BatchRepushRequest) => {
  try {
    const res = await api.post<ApiResponse<BatchRepushResponse>>(
      '/dividend/repush-queue/batch/repush',
      body
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};


// POST /api/v1/dividend/mandate-queue/{id}/push-to-nibss - Repush a single failed payment
export const pushMandateQueueToNibssRequest = async (id: number) => {
  try {
    const res = await api.post<ApiResponse<SingleRepushResponse>>(
      `/dividend/mandate-payments/${id}/push-to-nibss`
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};


// POST /api/v1/dividend/mandate-payments/batch/push-to-nibss - Batch push mandate payments to NIBSS
export const batchPushMandateQueueToNibssRequest = async (body: { ids: string[] }) => {
  try {
    const res = await api.post<ApiResponse<{
      pushed: number;
      totalAmount: number;
    }>>(
      '/dividend/mandate-payments/batch/push-to-nibss',
      body
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET /api/v1/dividend/payment-runs/declaration-payment Declaration Payment page data


export const declarationPaymentRequest = async (params?: {
  registerId?: string;
  paymentNumber?: string;
  status?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<DeclarationPaymentResponse>(
      '/dividend/payment-runs/declaration-payment',
      { params }
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
