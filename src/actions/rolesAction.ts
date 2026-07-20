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

export const GET_PERMISSIONS_BY_ROLE = async (roles: string[]) => {
  try {
    const query = roles
      .map((r) => `roleNames=${encodeURIComponent(r)}`)
      .join("&");
    const res = await api.get(`/roles/permissions?${query}`);
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

// Rename / re-describe only — does not touch permissions (safe for reserved roles)
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

// Full update — name + description + permissions in one call (custom roles only)
export const PATCH_ROLE = async ({
  roleId,
  name,
  description,
  permissionNames,
}: {
  roleId: string;
  name?: string;
  description?: string;
  permissionNames?: string[];
}) => {
  try {
    const res = await api.patch(`/roles/${roleId}`, {
      name,
      description,
      permissionNames,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Inline permissions-only update (uses same PATCH endpoint — other fields are optional)
export const UPDATE_PERMISSIONS = async (
  payload: { permissionNames: string[] },
  roleId: string,
) => {
  try {
    const res = await api.patch(`/roles/${roleId}`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const DELETE_ROLE = async (roleId: string | undefined) => {
  if (!roleId) throw new Error("Role ID is required.");
  try {
    const res = await api.delete(`/roles/${roleId}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
