import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  createPrincipal,
  deletePrincipal,
  getPrincipalById,
  getPrincipals,
  getPrincipalsByStatus,
  getPrincipalStats,
  updatePrincipal,
  updatePrincipalStatus,
} from "@/actions/principalActions";

import {
  CreatePrincipalPayload,
  GetPrincipalsParams,
  Principal,
  PrincipalStats,
  UpdatePrincipalPayload,
  UpdatePrincipalStatusPayload,
} from "@/types/principal";
import { PaginatedResponse } from "@/types";

export const principalKeys = {
  all: ["principals"] as const,

  lists: () => [...principalKeys.all, "list"] as const,

  list: (params?: GetPrincipalsParams) =>
    [...principalKeys.lists(), params] as const,

  detail: (principalId: string) =>
    [...principalKeys.all, "detail", principalId] as const,

  status: (status: string) => [...principalKeys.all, "status", status] as const,

  stats: () => [...principalKeys.all, "stats"] as const,
};

export interface TransformedPrincipals {
  content: Principal[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const useGetPrincipals = (
  params?: GetPrincipalsParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Principal>, Error, TransformedPrincipals>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: principalKeys.list(params),
    queryFn: () => getPrincipals(params),
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
    ...options,
  });
};

export const useGetPrincipalById = (
  principalId: string,
  options?: UseQueryOptions,
) => {
  return useQuery({
    queryKey: principalKeys.detail(principalId),
    queryFn: () => getPrincipalById(principalId),
    enabled: !!principalId,
    ...options,
  });
};

export const useGetPrincipalsByStatus = (
  status: string,
  options?: UseQueryOptions,
) => {
  return useQuery({
    queryKey: principalKeys.status(status),
    queryFn: () => getPrincipalsByStatus(status),
    enabled: !!status,
    ...options,
  });
};

export const useGetPrincipalStats = (
  options?: UseQueryOptions<PrincipalStats>,
) => {
  return useQuery({
    queryKey: principalKeys.stats(),
    queryFn: getPrincipalStats,
    ...options,
  });
};

export const useCreatePrincipal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePrincipalPayload) => createPrincipal(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: principalKeys.all,
      });
    },
  });
};

export const useUpdatePrincipal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      principalId,
      payload,
    }: {
      principalId: string;
      payload: UpdatePrincipalPayload;
    }) =>
      updatePrincipal({
        principalId,
        payload,
      }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: principalKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: principalKeys.detail(variables.principalId),
      });
    },
  });
};

export const useDeletePrincipal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (principalId: string) => deletePrincipal(principalId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: principalKeys.all,
      });
    },
  });
};

export const useUpdatePrincipalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      principalId,
      payload,
    }: {
      principalId: string;
      payload: UpdatePrincipalStatusPayload;
    }) =>
      updatePrincipalStatus({
        principalId,
        payload,
      }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: principalKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: principalKeys.detail(variables.principalId),
      });
    },
  });
};
