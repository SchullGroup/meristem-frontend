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

export const TOGGLE_USER = async (id: string) => {
  try {
    const res = await api.patch(`/users/${id}/toggle-status`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const TOGGLE_USER_2FA = async (id: string) => {
  try {
    const res = await api.patch(`/users/${id}/toggle-2fa`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const REMOVE_USER_ROLE = async ({
  id,
  roleName,
}: {
  id: string;
  roleName: string;
}) => {
  try {
    const res = await api.delete(
      `/users/${id}/roles/${roleName.toLocaleLowerCase()}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const DELETE_USER = async ({ id }: { id: string }) => {
  try {
    const res = await api.delete(`/users/delete/${id}/user`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
