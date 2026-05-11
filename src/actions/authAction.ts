// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const LOGIN = async (data: unknown) => {
  try {
    const res = await api.post(`/auth/login`, data);
    return res.data;
    console.log(res.data);
  } catch (error) {
    const err = error as ErrorLike;

    throw new Error(returnErrorMessage(err));
  }
};

export const VERIFY_OTP = async (data: unknown) => {
  try {
    const res = await api.post(`/otp/verify-otp`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;

    throw new Error(returnErrorMessage(err));
  }
};

export const REQUEST_OTP = async (data: unknown) => {
  try {
    const res = await api.post(`/otp/request-otp`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;

    throw new Error(returnErrorMessage(err));
  }
};
