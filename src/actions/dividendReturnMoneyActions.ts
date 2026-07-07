import api from "@/services/api";
import { PaginatedResponse } from "@/types";
import { returnErrorMessage } from "@/utils/errorManager";
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

const BASE = "/dividend/return-money";

export async function getReturnRecords(
  params?: ReturnRecordsParams,
): Promise<PaginatedResponse<DividendReturnRecord>> {
  try {
    const res = await api.get<PaginatedResponse<DividendReturnRecord>>(BASE, {
      params,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function getReturnRecordById(
  id: number,
): Promise<DividendReturnRecord> {
  try {
    const res = await api.get<DividendReturnRecord>(`${BASE}/${id}`);
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function processReturn(
  payload: ProcessReturnPayload,
): Promise<DividendReturnRecord> {
  try {
    const res = await api.post<DividendReturnRecord>(
      `${BASE}/${payload.returnRecordId}/process-return`,
      payload,
    );
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function getWithheldPayments(
  params?: WithheldPaymentsParams,
): Promise<PaginatedResponse<WithheldPayment>> {
  try {
    const res = await api.get<PaginatedResponse<WithheldPayment>>(
      `${BASE}/withheld-payments`,
      { params },
    );
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function recordWithheldPayment(
  payload: RecordWithheldPaymentPayload,
): Promise<WithheldPayment> {
  try {
    const res = await api.post<WithheldPayment>(
      `${BASE}/withheld-payments`,
      payload,
    );
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function getRefundRequests(
  params?: RefundRequestsParams,
): Promise<PaginatedResponse<RefundRequest>> {
  try {
    const res = await api.get<PaginatedResponse<RefundRequest>>(
      `${BASE}/refund-requests`,
      { params },
    );
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function createRefundRequest(
  payload: CreateRefundRequestPayload,
): Promise<RefundRequest> {
  try {
    const res = await api.post<RefundRequest>(
      `${BASE}/refund-requests`,
      payload,
    );
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}

export async function approveRefundRequest(
  id: number,
  comment?: string,
): Promise<RefundRequest> {
  try {
    const res = await api.post<RefundRequest>(
      `${BASE}/refund-requests/${id}/approve`,
      { comment },
    );
    return res.data;
  } catch (err: any) {
    throw new Error(returnErrorMessage(err));
  }
}
