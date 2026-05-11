// "use server";

import {
  CreateRegisterPayload,
  GetRegistersParams,
  Register,
  RegisterStats,
  UpdateRegisterPayload,
  UpdateRegisterStatusPayload,
} from "@/types/register";

import { ApiResponse, PaginatedResponse } from "@/types";
import api from "@/services/api";

export const createRegister = async (payload: CreateRegisterPayload) => {
  const response = await api.post<ApiResponse<Register>>("/registers", payload);

  return response.data;
};

export const updateRegister = async ({
  registerId,
  payload,
}: {
  registerId: string;
  payload: UpdateRegisterPayload;
}) => {
  const response = await api.put<ApiResponse<Register>>(
    `/registers/${registerId}`,
    payload,
  );

  return response.data;
};

export const deleteRegister = async (registerId: string) => {
  const response = await api.delete<ApiResponse<string>>(
    `/registers/${registerId}`,
  );

  return response.data;
};

export const getRegisters = async (params?: GetRegistersParams) => {
  const response = await api.get<PaginatedResponse<Register>>("/registers", {
    params,
  });

  return response.data;
};

export const getRegisterById = async (registerId: string) => {
  const response = await api.get<ApiResponse<Register>>(
    `/registers/code/${registerId}`,
  );

  return response.data;
};

export const getRegistersByStatus = async (status: string) => {
  const response = await api.get<ApiResponse<Register>>(
    `/registers/status/${status}`,
  );

  return response.data;
};

export const getRegistersByType = async (registerType: string) => {
  const response = await api.get<ApiResponse<Register>>(
    `/registers/type/${registerType}`,
  );

  return response.data;
};

export const getRegistersByPrincipal = async (principalId: string) => {
  const response = await api.get<ApiResponse<Register>>(
    `/registers/principal/${principalId}`,
  );

  return response.data;
};

export const updateRegisterStatus = async ({
  registerId,
  payload,
}: {
  registerId: string;
  payload: UpdateRegisterStatusPayload;
}) => {
  const response = await api.patch<ApiResponse<Register>>(
    `/registers/${registerId}/status`,
    payload,
  );

  return response.data;
};

export const getRegisterStats = async () => {
  const response =
    await api.get<ApiResponse<RegisterStats>>(`/registers/stats`);

  return response.data;
};
