// ========================================
// hooks/useCurrencies.ts
// ========================================

import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCurrency,
  deleteCurrency,
  getAllCurrencies,
  getCurrencies,
  getCurrencyById,
  updateCurrency,
} from "@/actions/parameterActions";

import {
  CreateCurrencyPayload,
  Currency,
  GetCurrenciesParams,
  TransformedCurrencies,
  UpdateCurrencyPayload,
} from "@/types/parameters";
import { ApiResponse, PaginatedResponse } from "@/types";

// ========================================
// QUERY KEYS
// ========================================

export const currencyKeys = {
  all: ["currencies"] as const,

  lists: () => [...currencyKeys.all, "list"] as const,

  list: (params?: GetCurrenciesParams) =>
    [...currencyKeys.lists(), params] as const,

  details: () => [...currencyKeys.all, "detail"] as const,

  detail: (id: number) => [...currencyKeys.details(), id] as const,

  allCurrencies: () => [...currencyKeys.all, "all"] as const,
};

// ========================================
// GET PAGINATED CURRENCIES
// ========================================

export const useGetCurrencies = (
  params?: GetCurrenciesParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Currency>, Error, TransformedCurrencies>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: currencyKeys.list(params),

    queryFn: () => getCurrencies(params),

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
// GET ALL CURRENCIES
// ========================================

export const useGetAllCurrencies = (
  options?: Omit<
    UseQueryOptions<ApiResponse<Currency[]>, Error, Currency[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: currencyKeys.allCurrencies(),

    queryFn: getAllCurrencies,

    select: (data) => data.data,

    ...options,
  });
};

// ========================================
// GET CURRENCY BY ID
// ========================================

export const useGetCurrencyById = (
  id: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<Currency>, Error, Currency>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: currencyKeys.detail(id),

    queryFn: () => getCurrencyById(id),

    select: (data) => data.data,

    enabled: !!id,

    ...options,
  });
};

// ========================================
// CREATE CURRENCY
// ========================================

export const useCreateCurrency = (
  options?: UseMutationOptions<
    ApiResponse<Currency>,
    Error,
    CreateCurrencyPayload
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCurrency,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: currencyKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// UPDATE CURRENCY
// ========================================

type UpdateCurrencyVariables = {
  id: number;
  payload: UpdateCurrencyPayload;
};

export const useUpdateCurrency = (
  options?: UseMutationOptions<
    ApiResponse<Currency>,
    Error,
    UpdateCurrencyVariables
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateCurrency(id, payload),

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: currencyKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// DELETE CURRENCY
// ========================================

export const useDeleteCurrency = (
  options?: UseMutationOptions<ApiResponse<string>, Error, number>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCurrency,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: currencyKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};
