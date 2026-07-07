// "use server";

import {
  CreatePrincipalPayload,
  GetPrincipalsParams,
  Principal,
  PrincipalStats,
  UpdatePrincipalPayload,
  UpdatePrincipalStatusPayload,
} from "@/types/principal";
import { ApiResponse, PaginatedResponse } from "@/types";
import api from "@/services/api";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export const getAllPrincipals = async (params?: GetPrincipalsParams) => {
  try {
    const response = await api.get<PaginatedResponse<Principal>>("/principals", {
      params,
    });

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const createPrincipal = async (payload: CreatePrincipalPayload) => {
  try {
    const response = await api.post<ApiResponse<Principal>>(
      "/principals",
      payload,
    );

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const updatePrincipal = async ({
  principalId,
  payload,
}: {
  principalId: string;
  payload: UpdatePrincipalPayload;
}) => {
  try {
    const response = await api.put<ApiResponse<Principal>>(
      `/principals/${principalId}`,
      payload,
    );

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const deletePrincipal = async (principalId: string) => {
  try {
    const response = await api.delete(`/principals/${principalId}`);

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getPrincipals = async (params?: GetPrincipalsParams) => {
  try {
    const response = await api.get<PaginatedResponse<Principal>>("/principals", {
      params,
    });

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getPrincipalById = async (principalId: string) => {
  try {
    const response = await api.get<ApiResponse<Principal>>(
      `/principals/code/${principalId}`,
    );

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getPrincipalsByStatus = async (status: string) => {
  try {
    const response = await api.get<ApiResponse<Principal[]>>(
      `/principals/status/${status}`,
    );

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const updatePrincipalStatus = async ({
  principalId,
  payload,
}: {
  principalId: string;
  payload: UpdatePrincipalStatusPayload;
}) => {
  try {
    const response = await api.patch<ApiResponse<Principal>>(
      `/principals/${principalId}/status`,
      payload,
    );

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getPrincipalStats = async () => {
  try {
    const response =
      await api.get<ApiResponse<PrincipalStats>>(`/principals/stats`);

    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
