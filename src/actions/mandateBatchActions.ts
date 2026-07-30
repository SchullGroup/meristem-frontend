// "use server";
//
// New-Mandate batch payment API — the real endpoints behind the batch-based, multi-level
// approval workflow (/api/v1/dividend/mandate-batches). The backend MandateBatchResponse /
// MandateShareholderResponse / MandateNotificationLogResponse mirror the frontend
// MandateBatch / MandateShareholder / MandateNotificationLogEntry 1:1, so these return the
// domain objects directly. Responses are wrapped in ApiResponse ({isSuccessful, data, …});
// unwrap() tolerates both wrapped and raw shapes. Paths omit /api/v1 (the axios baseURL carries it).

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import type {
  MandateBatch,
  MandateNotificationLogEntry,
  MandateShareholder,
} from "@/types/mandate-payment-flow";

const BASE = "/dividend/mandate-batches";

// Repeat array params as `key=a&key=b` (Spring List binding) rather than `key[]=a`.
const REPEAT = { indexes: null } as const;

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

// ── Queries ──────────────────────────────────────────────────────────────────

export const GET_MANDATE_BATCHES = async (status?: string | string[]) => {
  try {
    const params = status
      ? { status: Array.isArray(status) ? status.join(",") : status }
      : undefined;
    const res = await api.get(BASE, { params });
    return unwrap<MandateBatch[]>(res.data) ?? [];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_MANDATE_BATCH = async (id: string) => {
  try {
    const res = await api.get(`${BASE}/${encodeURIComponent(id)}`);
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_REJECTED_SHAREHOLDERS = async () => {
  try {
    const res = await api.get(`${BASE}/rejected-shareholders`);
    return unwrap<MandateShareholder[]>(res.data) ?? [];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_MANDATE_NOTIFICATIONS = async (batchId?: string) => {
  try {
    const res = await api.get(`${BASE}/notifications`, {
      params: batchId ? { batchId } : undefined,
    });
    return unwrap<MandateNotificationLogEntry[]>(res.data) ?? [];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// Preview the mandate-eligible pool (register scope for batch creation, or free-text
// search for manual add). Each row's id is the underlying warrant id.
export const PREVIEW_ELIGIBLE = async (params: {
  registerSymbols?: string[];
  query?: string;
  count?: number;
}) => {
  try {
    const res = await api.get(`${BASE}/eligible`, {
      params: {
        registerSymbols: params.registerSymbols,
        query: params.query,
        count: params.count,
      },
      paramsSerializer: REPEAT,
    });
    return unwrap<MandateShareholder[]>(res.data) ?? [];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// ── Create / edit batch ────────────────────────────────────────────────────────

export const CREATE_BATCH = async (body: {
  registerSymbols?: string[];
  warrantIds?: string[];
  count?: number;
  initiatedBy?: string;
}) => {
  try {
    const res = await api.post(BASE, body);
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const ADD_SHAREHOLDERS = async (
  id: string,
  body: { warrantIds: string[]; actor?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/add-shareholders`, body);
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// ── Approval chain ───────────────────────────────────────────────────────────

export const SUBMIT_BATCH = async (id: string, actor?: string) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/submit`, { actor });
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const DECIDE_BATCH = async (
  id: string,
  body: {
    stage: "APPROVAL" | "HOP" | "ICU_1" | "ICU_2";
    decision: "APPROVE" | "REJECT";
    actor?: string;
    comment?: string;
  },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/decide`, body);
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const FORWARD_SECOND_ICU = async (id: string, actor?: string) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/forward-second-icu`, { actor });
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const EXCLUDE_SHAREHOLDERS = async (
  id: string,
  body: { shareholderIds: string[]; actor?: string; reason?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/exclude`, body);
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const MD_DECISION = async (
  id: string,
  body: { decision: "PAY" | "MANUAL"; gateway?: "NIBSS" | "REMITA"; actor?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/md-decision`, body);
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const REQUEUE_FAILED = async (id: string, actor?: string) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/requeue-failed`, { actor });
    return unwrap<MandateBatch>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// ── Notifications ────────────────────────────────────────────────────────────

export const SEND_MANDATE_NOTIFICATION = async (
  id: string,
  body: { subject: string; sentBy?: string; recipientIds?: string[] },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/notifications`, body);
    return unwrap<MandateNotificationLogEntry>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
