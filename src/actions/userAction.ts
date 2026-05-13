// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import { User } from "@/lib/types";

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

export const UPDATE_USER = async ({
  id,
  userData,
}: {
  id: string;
  userData: unknown;
}) => {
  try {
    const res = await api.put(`/users/edit/${id}`, userData);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
