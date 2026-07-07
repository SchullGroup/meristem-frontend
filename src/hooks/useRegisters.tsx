import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  createRegister,
  deleteRegister,
  getRegisterById,
  getRegisters,
  getRegistersByPrincipal,
  getRegistersByStatus,
  getRegistersByType,
  getRegisterStats,
  updateRegister,
  updateRegisterStatus,
} from "@/actions/registersActions";

import {
  Register,
  RegisterStats,
  CreateRegisterPayload,
  GetRegistersParams,
  UpdateRegisterPayload,
  UpdateRegisterStatusPayload,
} from "@/types/register";
import { ApiResponse, PaginatedResponse } from "@/types";

export const registerKeys = {
  all: ["registers"] as const,

  lists: () => [...registerKeys.all, "list"] as const,

  list: (params?: GetRegistersParams) =>
    [...registerKeys.lists(), params] as const,

  detail: (registerId: string) =>
    [...registerKeys.all, "detail", registerId] as const,

  status: (status: string) => [...registerKeys.all, "status", status] as const,

  type: (registerType: string) =>
    [...registerKeys.all, "type", registerType] as const,

  principal: (principalId: string) =>
    [...registerKeys.all, "principal", principalId] as const,

  stats: () => [...registerKeys.all, "stats"] as const,
};

export interface TransformedRegisters {
  content: Register[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const useGetRegisters = (
  params?: GetRegistersParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Register>, Error, TransformedRegisters>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: registerKeys.list(params),
    queryFn: () => getRegisters(params),
    select: (data) => {
      return {
        content: data.data.content,
        pagination: {
          total: data.data.totalElements,
          page: data.data.number,
          totalPages: data.data.totalPages,
        },
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    ...options,
  });
};

export const useGetRegisterById = (registerId: string) => {
  return useQuery({
    queryKey: registerKeys.detail(registerId),
    queryFn: () => getRegisterById(registerId),
    enabled: !!registerId,
  });
};

export const useGetRegistersByStatus = (status: string) => {
  return useQuery({
    queryKey: registerKeys.status(status),
    queryFn: () => getRegistersByStatus(status),
    enabled: !!status,
  });
};

export const useGetRegistersByType = (
  registerType: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<Register[]>, Error, Register[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: registerKeys.type(registerType),
    queryFn: () => getRegistersByType(registerType),
    enabled: !!registerType,
    select: (data) => data.data,
    ...options,
  });
};

export const useGetRegistersByPrincipal = (
  principalId: string,
  options?: UseQueryOptions,
) => {
  return useQuery({
    queryKey: registerKeys.principal(principalId),

    queryFn: () => getRegistersByPrincipal(principalId),

    enabled: !!principalId,
    ...options,
  });
};

export const useGetRegisterStats = (
  options?: Omit<
    UseQueryOptions<ApiResponse<RegisterStats>, Error, RegisterStats>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: registerKeys.stats(),
    queryFn: getRegisterStats,
    select: (data) => data.data,
    ...options,
  });
};

export const useCreateRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegisterPayload) => createRegister(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registerKeys.all,
      });
    },
  });
};

export const useUpdateRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registerId,
      payload,
    }: {
      registerId: string;
      payload: UpdateRegisterPayload;
    }) =>
      updateRegister({
        registerId,
        payload,
      }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: registerKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: registerKeys.detail(variables.registerId),
      });
    },
  });
};

export const useDeleteRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registerId: string) => deleteRegister(registerId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: registerKeys.all,
      });
    },
  });
};

export const useUpdateRegisterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registerId,
      payload,
    }: {
      registerId: string;
      payload: UpdateRegisterStatusPayload;
    }) =>
      updateRegisterStatus({
        registerId,
        payload,
      }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: registerKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: registerKeys.detail(variables.registerId),
      });
    },
  });
};
