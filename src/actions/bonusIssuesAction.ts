// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_DECLARATIONS = async () => {
  try {
    const res = await api.get(`/offers/bonus-issue/declarations`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_DECLARATION_BY_ID = async (declarationId?: string) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_SHAREHOLDERS_BY_DECLARATION_ID = async (
  declarationId?: string,
) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}/entitlements`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const CREATE_BONUS_ISSUE_DECLARATION = async (bonusData: unknown) => {
  try {
    const res = await api.post(`/offers/bonus-issue/declarations`, bonusData);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const SUBMIT_DECLARATION_FOR_APPROVAL = async ({
  declarationId,
}: {
  declarationId: string | number | null;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/submit`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const APPROVE_DECLARATION = async ({
  declarationId,
  payload,
}: {
  declarationId: string | number | null;
  payload: unknown;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/approve`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
