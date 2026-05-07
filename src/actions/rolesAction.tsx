"use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_ALL_ROLES = async () => {
  try {
    const res = await api.get(`/roles`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
