import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createState,
  deleteState,
  getAllStates,
  getStateById,
  getStateLgas,
  updateState,
} from "@/actions/parameterActions";

import {
  CreateStatePayload,
  LGA,
  State,
  TransformedStates,
  UpdateStatePayload,
} from "@/types/parameters";

import { ApiResponse } from "@/types";

export const stateKeys = {
  all: ["states"] as const,

  lists: () => [...stateKeys.all, "list"] as const,

  list: () => [...stateKeys.lists()] as const,

  details: () => [...stateKeys.all, "detail"] as const,

  detail: (id: number) => [...stateKeys.details(), id] as const,

  lgas: (stateId: number) => [...stateKeys.all, "lgas", stateId] as const,
};

// ========================================
// GET ALL STATES
// ========================================

export const useGetAllStates = (
  options?: Omit<
    UseQueryOptions<ApiResponse<State[]>, Error, TransformedStates>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: stateKeys.list(),

    queryFn: getAllStates,

    select: (data) => {
      return {
        content: data.data,
      };
    },

    ...options,
  });
};

// ========================================
// GET STATE BY ID
// ========================================

export const useGetStateById = (
  id: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<State>, Error, State>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: stateKeys.detail(id),

    queryFn: () => getStateById(id),

    select: (data) => data.data,

    enabled: !!id,

    ...options,
  });
};

// ========================================
// GET STATE LGAS
// ========================================

export const useGetStateLgas = (
  stateId: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<LGA[]>, Error, LGA[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: stateKeys.lgas(stateId),

    queryFn: () => getStateLgas(stateId),

    select: (data) => data.data,

    enabled: !!stateId,

    ...options,
  });
};

// ========================================
// CREATE STATE
// ========================================

export const useCreateState = (
  options?: UseMutationOptions<ApiResponse<State>, Error, CreateStatePayload>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createState,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: stateKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// UPDATE STATE
// ========================================

type UpdateStateVariables = {
  id: number;
  payload: UpdateStatePayload;
};

export const useUpdateState = (
  options?: UseMutationOptions<ApiResponse<State>, Error, UpdateStateVariables>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateState(id, payload),

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: stateKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// DELETE STATE
// ========================================

export const useDeleteState = (
  options?: UseMutationOptions<ApiResponse<string>, Error, number>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteState,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: stateKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};
