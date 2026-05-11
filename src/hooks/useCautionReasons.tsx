// ========================================
// hooks/useCautionReasons.ts
// ========================================

import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCautionReason,
  deleteCautionReason,
  getAllCautionReasons,
  getCautionReasonByCode,
  getCautionReasons,
  updateCautionReason,
} from "@/actions/parameterActions";

import {
  CautionReason,
  CreateCautionReasonPayload,
  GetCautionReasonsParams,
  TransformedCautionReasons,
  UpdateCautionReasonPayload,
} from "@/types/parameters";

import { ApiResponse, PaginatedResponse } from "@/types";

// ========================================
// QUERY KEYS
// ========================================

export const cautionReasonKeys = {
  all: ["caution-reasons"] as const,

  lists: () => [...cautionReasonKeys.all, "list"] as const,

  list: (params?: GetCautionReasonsParams) =>
    [...cautionReasonKeys.lists(), params] as const,

  details: () => [...cautionReasonKeys.all, "detail"] as const,

  detail: (code: string) => [...cautionReasonKeys.details(), code] as const,

  allCautionReasons: () => [...cautionReasonKeys.all, "all"] as const,
};

// ========================================
// GET PAGINATED CAUTION REASONS
// ========================================

export const useGetCautionReasons = (
  params?: GetCautionReasonsParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<CautionReason>,
      Error,
      TransformedCautionReasons
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: cautionReasonKeys.list(params),

    queryFn: () => getCautionReasons(params),

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

// ========================================
// GET ALL CAUTION REASONS
// ========================================

export const useGetAllCautionReasons = (
  options?: Omit<
    UseQueryOptions<ApiResponse<CautionReason[]>, Error, CautionReason[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: cautionReasonKeys.allCautionReasons(),

    queryFn: getAllCautionReasons,

    select: (data) => data.data,

    ...options,
  });
};

// ========================================
// GET CAUTION REASON BY CODE
// ========================================

export const useGetCautionReasonByCode = (
  code: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<CautionReason>, Error, CautionReason>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: cautionReasonKeys.detail(code),

    queryFn: () => getCautionReasonByCode(code),

    select: (data) => data.data,

    enabled: !!code,

    ...options,
  });
};

// ========================================
// CREATE CAUTION REASON
// ========================================

export const useCreateCautionReason = (
  options?: UseMutationOptions<
    ApiResponse<CautionReason>,
    Error,
    CreateCautionReasonPayload
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCautionReason,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: cautionReasonKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// UPDATE CAUTION REASON
// ========================================

type UpdateCautionReasonVariables = {
  code: string;
  payload: UpdateCautionReasonPayload;
};

export const useUpdateCautionReason = (
  options?: UseMutationOptions<
    ApiResponse<CautionReason>,
    Error,
    UpdateCautionReasonVariables
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, payload }) => updateCautionReason(code, payload),

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: cautionReasonKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// DELETE CAUTION REASON
// ========================================

export const useDeleteCautionReason = (
  options?: UseMutationOptions<ApiResponse<string>, Error, string>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCautionReason,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: cautionReasonKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};
