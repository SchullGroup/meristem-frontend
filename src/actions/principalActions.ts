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

export const getAllPrincipals = async (params?: GetPrincipalsParams) => {
  const response = await api.get<PaginatedResponse<Principal>>("/principals", {
    params,
  });

  return response.data?.data;
};

export const createPrincipal = async (payload: CreatePrincipalPayload) => {
  const response = await api.post<ApiResponse<Principal>>(
    "/principals",
    payload,
  );

  return response.data?.data;
};

export const updatePrincipal = async ({
  principalId,
  payload,
}: {
  principalId: string;
  payload: UpdatePrincipalPayload;
}) => {
  const response = await api.put<ApiResponse<Principal>>(
    `/principals/${principalId}`,
    payload,
  );

  return response.data?.data;
};

export const deletePrincipal = async (principalId: string) => {
  const response = await api.delete(`/principals/${principalId}`);

  return response.data?.data;
};

export const getPrincipals = async (params?: GetPrincipalsParams) => {
  const response = await api.get<PaginatedResponse<Principal>>("/principals", {
    params,
  });

  return response.data;
};

export const getPrincipalById = async (principalId: string) => {
  const response = await api.get<ApiResponse<Principal>>(
    `/principals/code/${principalId}`,
  );

  return response.data?.data;
};

export const getPrincipalsByStatus = async (status: string) => {
  const response = await api.get<ApiResponse<Principal[]>>(
    `/principals/status/${status}`,
  );

  return response.data?.data;
};

export const updatePrincipalStatus = async ({
  principalId,
  payload,
}: {
  principalId: string;
  payload: UpdatePrincipalStatusPayload;
}) => {
  const response = await api.patch<ApiResponse<Principal>>(
    `/principals/${principalId}/status`,
    payload,
  );

  return response.data?.data;
};

export const getPrincipalStats = async () => {
  const response =
    await api.get<ApiResponse<PrincipalStats>>(`/principals/stats`);

  return response.data?.data;
};
