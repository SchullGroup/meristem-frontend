"use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const LOGIN = async (data: unknown) => {
  try {
    const res = await api.post(`/api/v1/auth/login`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;

    throw {
      status: "error",
      message: returnErrorMessage(err),
    };
  }
};
