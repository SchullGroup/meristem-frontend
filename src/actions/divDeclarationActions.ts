// "use server";
import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_DIVIDEND_LIABILITY_PREVIEW = async ({
  queryKey,
}: {
  queryKey: [string, string, string, string];
}) => {
  const registerId = queryKey[1];
  const rate = queryKey[2];
  const page = queryKey[3]; // 0-indexed
  try {
    const res = await api.get(
      `/dividend/declarations/liability-preview?registerId=${registerId}&rate=${rate}&page=${page}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_DIVIDEND_LIABILITY_PREVIEW_FULL = async ({
  registerId,
  rate,
  size,
}: {
  registerId: string;
  rate: string;
  size: number;
}) => {
  try {
    const res = await api.get(
      `/dividend/declarations/liability-preview?registerId=${registerId}&rate=${rate}&page=0&size=${size}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const POST_CREATE_DIVIDEND_DECLARATION = async (data: unknown) => {
  try {
    const res = await api.post(`/dividend/declarations`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_ALL_DIVIDEND_DECLARATIONS = async (params?: {
  size?: number;
  page?: number;
  status?: string;
  registerId?: string;
  dividendType?: string;
  tier?: number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  try {
    const res = await api.get(`/dividend/declarations`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_ALL_DIVIDEND_DECLARATIONS_NUMBERS = async (params?: {
  registerId?: string;
}) => {
  try {
    const res = await api.get(`/dividend/declarations/dividend-numbers`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const SUBMIT_DIVIDEND_DECLARATION = async ({ id }: { id: number }) => {
  try {
    const res = await api.post(`/dividend/declarations/${id}/submit`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const REJECT_DIVIDEND_DECLARATION = async ({
  id,
  payload,
}: {
  id: number;
  payload: unknown;
}) => {
  try {
    const res = await api.post(`/dividend/declarations/${id}/reject`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const APPROVE_DIVIDEND_DECLARATION = async ({
  id,
  payload,
}: {
  id: number;
  payload: unknown;
}) => {
  try {
    const res = await api.post(`/dividend/declarations/${id}/approve`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
