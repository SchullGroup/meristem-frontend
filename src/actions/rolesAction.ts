// "use server";

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

export const CREATE_ROLE = async (data: {
  name: string;
  description: string;
  permissionNames: string[];
}) => {
  try {
    const res = await api.post(`/roles`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const EDIT_ROLE = async ({
  roleId,
  name,
  description,
}: {
  roleId: string;
  name: string;
  description: string;
}) => {
  try {
    const res = await api.patch(`/roles/edit/${roleId}`, { name, description });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const UPDATE_PERMISSIONS = async (
  payload: { permissionNames: string[] },
  roleId: string,
) => {
  try {
    const res = await api.put(`/roles/${roleId}/permissions`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const DELETE_ROLE = async (roleId: string) => {
  try {
    const res = await api.delete(`/roles/${roleId}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
