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
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export const createRegister = async (payload: CreateRegisterPayload) => {
  try {
    const response = await api.post<ApiResponse<Register>>("/registers", payload);

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const updateRegister = async ({
  registerId,
  payload,
}: {
  registerId: string;
  payload: UpdateRegisterPayload;
}) => {
  try {
    const response = await api.put<ApiResponse<Register>>(
      `/registers/${registerId}`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const deleteRegister = async (registerId: string) => {
  try {
    const response = await api.delete<ApiResponse<string>>(
      `/registers/${registerId}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRegisters = async (params?: GetRegistersParams) => {
  try {
    const response = await api.get<PaginatedResponse<Register>>("/registers", {
      params,
    });

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRegisterById = async (registerId: string) => {
  try {
    const response = await api.get<ApiResponse<Register>>(
      `/registers/code/${registerId}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRegistersByStatus = async (status: string) => {
  try {
    const response = await api.get<ApiResponse<Register[]>>(
      `/registers/status/${status}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRegistersByType = async (registerType: string) => {
  try {
    const response = await api.get<ApiResponse<Register[]>>(
      `/registers/type/${registerType}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRegistersByPrincipal = async (principalId: string) => {
  try {
    const response = await api.get<ApiResponse<Register[]>>(
      `/registers/principal/${principalId}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const updateRegisterStatus = async ({
  registerId,
  payload,
}: {
  registerId: string;
  payload: UpdateRegisterStatusPayload;
}) => {
  try {
    const response = await api.patch<ApiResponse<Register>>(
      `/registers/${registerId}/status`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRegisterStats = async () => {
  try {
    const response =
      await api.get<ApiResponse<RegisterStats>>(`/registers/stats`);

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
