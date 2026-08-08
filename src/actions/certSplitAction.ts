// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const SUBMIT_CERTIFICATE_SPLIT_FOR_APPROVAL = async ({
  payload,
}: {
  payload: unknown;
}) => {
  try {
    const res = await api.post(`/certificates/split`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_PENDING_SPLIT_REQUESTS = async () => {
  try {
    const res = await api.get(`/certificates/split`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Read-only legacy (pre-migration) split history — sliced (Previous/Next), no total count.
export const GET_LEGACY_SPLIT_HISTORY = async (params: {
  registerId?: number;
  accountNo?: string;
  page?: number; // 1-indexed
  pageSize?: number;
}) => {
  try {
    const res = await api.get(`/certificates/split/legacy-history`, { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const APPROVE_CERTIFICATE_SPLIT = async ({
  payload,
  splitId,
}: {
  payload: unknown;
  splitId: string;
}) => {
  try {
    const res = await api.post(
      `/certificates/split/${splitId}/approve`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const REJECT_CERTIFICATE_SPLIT = async ({
  payload,
  splitId,
}: {
  payload: unknown;
  splitId: string;
}) => {
  try {
    const res = await api.post(
      `/certificates/split/${splitId}/reject`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const BATCH_CERTIFICATE_SPLIT_DECISION = async ({
  payload,
}: {
  payload: unknown;
}) => {
  try {
    const res = await api.post(`/certificates/split/batch-decision`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const DISABLE_CERTIFICATE = async ({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}) => {
  try {
    const res = await api.patch(`/certificates/${id}/disable`, {
      reason: reason || "Certificate split",
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
