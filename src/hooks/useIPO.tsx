import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  getIPOICUApprovals,
  getIPOPendingApprovals,
  getIpoRegisters,
  icuReviewIpo,
  opsApproveIpo,
  uploadBatchIpo,
} from "@/actions/ipoActions";

import { ApiResponse, PaginatedResponse } from "@/types";
import { IPO } from "@/types/ipo";

export const ipoKeys = {
  all: ["ipo"] as const,
  registers: () => [...ipoKeys.all, "registers"] as const,
  pending: () => [...ipoKeys.all, "pending"] as const,
  icu: () => [...ipoKeys.all, "icu"] as const,
  detail: (batchRef: string) => [...ipoKeys.all, "detail", batchRef] as const,
};

export interface TransformedIPO {
  content: IPO[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const useGetIpoRegisters = (
  options?: Omit<
    UseQueryOptions<ApiResponse<string[]>, Error, string[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.registers(),
    queryFn: getIpoRegisters,
    select: (data) => data.data,
    ...options,
  });
};

export const useGetIPOPendingApprovals = (
  options?: Omit<
    UseQueryOptions<PaginatedResponse<IPO>, Error, TransformedIPO>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.pending(),
    queryFn: getIPOPendingApprovals,
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

export const useGetIPOICUApprovals = (
  options?: Omit<
    UseQueryOptions<PaginatedResponse<IPO>, Error, TransformedIPO>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.icu(),
    queryFn: getIPOICUApprovals,
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

export const useUploadBatchIpo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => uploadBatchIpo(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ipoKeys.all,
      });
    },
  });
};

export const useOpsApproveIpo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchRef,
      payload,
    }: {
      batchRef: string;
      payload: { approvedBy: string };
    }) => opsApproveIpo(batchRef, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ipoKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ipoKeys.detail(variables.batchRef),
      });
    },
  });
};

export const useIcuReviewIpo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchRef,
      payload,
    }: {
      batchRef: string;
      payload: { approved: boolean; comment: string; reviewedBy: string };
    }) => icuReviewIpo(batchRef, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ipoKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ipoKeys.detail(variables.batchRef),
      });
    },
  });
};
