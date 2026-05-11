// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_USERS = async () => {
  try {
    const res = await api.get(`/users`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_USER_STATS = async () => {
  try {
    const res = await api.get(`/users/stats`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const CREATE_USER = async (userData: unknown) => {
  try {
    const res = await api.post(`/auth/create-user`, userData);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
