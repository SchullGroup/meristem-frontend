// "use server";
//
// Dividend Reversals API — the real endpoints behind the reversals screen
// (/api/v1/dividend/reversals). The backend DividendReversalResponse mirrors the frontend
// ReversalRequest 1:1, so these return the records directly. Responses are wrapped in
// ApiResponse ({isSuccessful, data, …}); unwrap() tolerates both wrapped and raw shapes.
// The reversal id is the reversalRef (e.g. "REV-2026/0007") — encode it in the path.

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";

const BASE = "/dividend/reversals";

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

export const GET_REVERSALS = async (status?: string | string[]) => {
  try {
    // The backend takes a single status; multi-status filtering is applied client-side by the
    // hook (History requests APPROVED+REJECTED), so send a status only when exactly one is given.
    const single = Array.isArray(status)
      ? status.length === 1
        ? status[0]
        : undefined
      : status;
    const res = await api.get(BASE, { params: single ? { status: single } : undefined });
    return unwrap<ReversalRequest[]>(res.data) ?? [];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export interface CreateReversalBody {
  holderName: string;
  registerSymbol: string;
  accountNumber: string;
  dividendNumber: string;
  amount: number;
  reversalType: "TYPE_A" | "TYPE_B";
  reason: string;
  supportingDocName?: string;
  sourceHolderId?: string;
}

export const CREATE_REVERSAL = async (body: CreateReversalBody) => {
  try {
    const res = await api.post(BASE, body);
    return unwrap<ReversalRequest>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const DECIDE_REVERSAL = async (
  id: string,
  body: { decision: "APPROVED" | "REJECTED"; comment?: string },
) => {
  try {
    const res = await api.post(`${BASE}/${encodeURIComponent(id)}/decide`, body);
    return unwrap<ReversalRequest>(res.data);
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
