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
