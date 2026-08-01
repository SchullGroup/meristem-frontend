import { GET_USER_BY_ID } from "@/actions/userAction";
// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const LOGIN = async (data: unknown) => {
  try {
    const res = await api.post(`/auth/login`, data);
    return res.data;
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

export const REQUEST_PASSWORD_RESET = async (data: unknown) => {
  try {
    const res = await api.post(`/password/forgot-password`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;

    throw new Error(returnErrorMessage(err));
  }
};

/** Completes a forgot-password flow using the token from the emailed link. */
export const RESET_PASSWORD = async (data: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  try {
    const res = await api.post(`/password/reset-password`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;

    throw new Error(returnErrorMessage(err));
  }
};

export const CHANGE_PASSWORD = async (data: unknown) => {
  try {
    const res = await api.post(`/password/change-password`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;

    throw new Error(returnErrorMessage(err));
  }
};
