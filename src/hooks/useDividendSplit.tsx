import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  approveSplitRequest,
  batchApproveSplitsRequest,
  BatchRejectSplits,
  batchRejectSplitsRequest,
  BatchResponse,
  DividendAccountLookupParams,
  DividendSplit,
  EligibleDividend,
  EligibleDividendsParams,
  getAccountLookup,
  getEligibleDividends,
  getPendingSplitApprovals,
  getSplitDetailsRequest,
  rejectSplitRequest,
  submitDividendSplitRequest,
  SubmitSplit,
} from "@/actions/dividendSplitActions";
import { PaginatedResponse, ApiResponse } from "@/types";

// Get split details
export const useGetSplitDetailsRequest = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<DividendSplit>,
      Error,
      ApiResponse<DividendSplit>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["split-details", id],
    queryFn: () => getSplitDetailsRequest(id),
    refetchOnWindowFocus: false,
    enabled: !!id,
    ...options,
  });
};

// List pending split approvals
export const useGetPendingSplitApprovals = (
  params?: { page?: number; size?: number },
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<DividendSplit>,
      Error,
      PaginatedResponse<DividendSplit>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["pending-split-approvals", params],
    queryFn: () => getPendingSplitApprovals(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Get eligible dividends for account
export const useGetEligibleDividends = (
  params: EligibleDividendsParams,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<EligibleDividend[]>,
      Error,
      ApiResponse<EligibleDividend[]>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["eligible-dividends", params],
    queryFn: () => getEligibleDividends(params),
    refetchOnWindowFocus: false,
    enabled: !!params.accountNumber,
    ...options,
  });
};

// Account lookup for split
export const useGetAccountLookup = (
  params: DividendAccountLookupParams,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<{
        accountNumber: string;
        holderName: string;
        registerSymbol: string;
        registerId: string;
      }>,
      Error,
      ApiResponse<{
        accountNumber: string;
        holderName: string;
        registerSymbol: string;
        registerId: string;
      }>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["account-lookup", params],
    queryFn: () => getAccountLookup(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Submit dividend split request
export const useSubmitDividendSplitRequest = (
  options?: Omit<
    UseMutationOptions<ApiResponse<DividendSplit>, Error, SubmitSplit>,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitSplit) => submitDividendSplitRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-split-approvals"] });
    },
    ...options,
  });
};

// Reject split
export const useRejectSplitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<BatchRejectSplits, "ids">;
    }) => rejectSplitRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-split-approvals"] });
    },
  });
};

// Approve split
export const useApproveSplitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<BatchRejectSplits, "ids">;
    }) => approveSplitRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-split-approvals"] });
    },
  });
};

// Batch reject splits
export const useBatchRejectSplitsRequest = (
  options?: Omit<
    UseMutationOptions<BatchResponse, Error, BatchRejectSplits>,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchRejectSplits) => batchRejectSplitsRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-split-approvals"] });
    },
    ...options,
  });
};

// Batch approve splits
export const useBatchApproveSplitsRequest = (
  options?: Omit<
    UseMutationOptions<BatchResponse, Error, BatchRejectSplits>,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchRejectSplits) => batchApproveSplitsRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-split-approvals"] });
    },
    ...options,
  });
};
