// "use server";
//
// Dividend Declaration "flow" API — the real endpoints behind the declaration screen
// (/api/v1/dividend/declarations). The backend DividendFlowResponse mirrors the frontend
// DividendFlowRecord 1:1, so these return the records/log entries directly. Response wrapping is
// inconsistent across the controller (some endpoints wrap in ApiResponse, some return the DTO
// raw, and collections may arrive as a Spring Page), so unwrap()/unwrapList() tolerate all of
// them. Paths omit /api/v1 (the axios baseURL already carries it).

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import type {
  DividendFlowRecord,
  NotificationLogEntry,
} from "@/types/dividend-declaration-flow";

const BASE = "/dividend/declarations";

// Some endpoints wrap in ApiResponse ({isSuccessful, data, …}); others return the DTO/array raw.
function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && !Array.isArray(body) && "isSuccessful" in body && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// Collections come back three ways across this controller: a raw array, a Spring Page
// ({content, totalElements, …}), or either of those wrapped in ApiResponse. Always hand callers
// a plain array — the tabs bind straight to .map/.filter.
function unwrapList<T>(body: unknown): T[] {
  const payload = unwrap<unknown>(body);
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const page = payload as { content?: unknown };
    if (Array.isArray(page.content)) return page.content as T[];
  }
  return [];
}

// List DTOs are summaries and may omit the nested collections, but every tab reads
// record.prelist / record.approvalTrail unguarded — default them here rather than at 15 call sites.
function normalizeRecord(record: DividendFlowRecord): DividendFlowRecord {
  if (!record) return record;
  return {
    ...record,
    prelist: Array.isArray(record.prelist) ? record.prelist : [],
    approvalTrail: Array.isArray(record.approvalTrail) ? record.approvalTrail : [],
  };
}

function unwrapRecord(body: unknown): DividendFlowRecord {
  return normalizeRecord(unwrap<DividendFlowRecord>(body));
}

export interface CreateDividendFlowBody {
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
  initiatedBy?: string;
}

export const GET_DIVIDEND_FLOWS = async (params?: {
  status?: string | string[];
  registerSymbol?: string;
}) => {
  try {
    // Spring binds List params as `status=A,B`; axios' default array serializer emits
    // `status[]=A&status[]=B`, which the controller ignores. Join, as mandate-batches does.
    const res = await api.get(`${BASE}/flows`, {
      params: {
        ...params,
        status: Array.isArray(params?.status) ? params.status.join(",") : params?.status,
      },
    });
    return unwrapList<DividendFlowRecord>(res.data).map(normalizeRecord);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_DIVIDEND_FLOW = async (id: string) => {
  try {
    const res = await api.get(`${BASE}/flows/${encodeURIComponent(id)}`);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const CREATE_DIVIDEND_FLOW = async (body: CreateDividendFlowBody) => {
  try {
    const res = await api.post(BASE, body);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const EDIT_RESEND_DIVIDEND_FLOW = async (id: string, body: CreateDividendFlowBody) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/edit-resend`, body);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GENERATE_PRELIST = async (id: string) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/prelist`);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const FORWARD_TO_ICU = async (id: string, actor?: string) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/submit`, { actor });
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const DECIDE_STAGE = async (
  id: string,
  body: { stage: "ICU_1" | "HOP" | "ICU_2"; decision: "APPROVE" | "REJECT"; actor?: string; comment?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/decide`, body);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const SET_ROWS_EXCLUDED = async (
  id: string,
  body: { rowIds: string[]; excluded: boolean; actor?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/exclude-rows`, body);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const MD_DECISION = async (
  id: string,
  body: { decision: "APPROVE_AND_PAY" | "MANUAL"; gateway?: "NIBSS" | "REMITA"; actor?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/md-decision`, body);
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const REQUEUE_FAILED = async (id: string, actor?: string) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/requeue-failed`, { actor });
    return unwrapRecord(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_DIVIDEND_NOTIFICATIONS = async (id: string) => {
  try {
    const res = await api.get(`${BASE}/${encodeURIComponent(id)}/notifications`);
    return unwrapList<NotificationLogEntry>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const SEND_BATCH_EMAILS = async (
  id: string,
  body: { subject: string; sentBy?: string; rowIds?: string[] },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/notifications`, body);
    return unwrap<NotificationLogEntry>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
