import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  getIpoBatch,
  getIpoBatchSubscribers,
  getIPOICUApprovals,
  getIPOPendingApprovals,
  icuReviewIpo,
  opsApproveIpo,
  opsRejectIpo,
  uploadBatchIpo,
} from "@/actions/ipoActions";

import { ContentPaginatedResponse } from "@/types";
import {
  IPO,
  IPOBatchType,
  IPOSubscriber,
  PendingApprovalParams,
} from "@/types/ipo";

export const ipoKeys = {
  all: ["ipo"] as const,
  registers: () => [...ipoKeys.all, "registers"] as const,
  pending: (params?: PendingApprovalParams) =>
    [...ipoKeys.all, "pending", params] as const,
  icu: (params?: PendingApprovalParams) =>
    [...ipoKeys.all, "icu", params] as const,
  detail: (batchRef?: string) => [...ipoKeys.all, "detail", batchRef] as const,
  subscribers: (type?: IPOBatchType) =>
    [...ipoKeys.all, "subscribers", type] as const,
};

export interface TransformedIPO {
  content: IPO[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}
export interface TransformedSubscribers {
  content: IPOSubscriber[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const useGetPendingApprovals = (
  params?: PendingApprovalParams,
  options?: Omit<
    UseQueryOptions<ContentPaginatedResponse<IPO>, Error, TransformedIPO>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.pending(params),
    queryFn: () => getIPOPendingApprovals(params),
    select: (data) => {
      return {
        content: data?.content,
        pagination: {
          total: data?.totalElements,
          page: data?.page,
          totalPages: data?.totalPages,
        },
      };
    },
    ...options,
  });
};

export const useGetIcuApprovals = (
  params?: PendingApprovalParams,

  options?: Omit<
    UseQueryOptions<ContentPaginatedResponse<IPO>, Error, TransformedIPO>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.icu(params),
    queryFn: () => getIPOICUApprovals(params),
    select: (data) => {
      return {
        content: data?.content,
        pagination: {
          total: data?.totalElements,
          page: data?.page,
          totalPages: data?.totalPages,
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
      payload: { comment?: string; approvedBy: string };
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

export const useOpsRejectIpo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchRef,
      payload,
    }: {
      batchRef: string;
      payload: {
        comment: string;
        rejectedBy: string;
      };
    }) => opsRejectIpo(batchRef, payload),

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

export const useGetIpoBatch = (
  batchRef?: string,
  options?: Omit<UseQueryOptions<IPO, Error, IPO>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ipoKeys.detail(batchRef),
    queryFn: () => getIpoBatch(batchRef),
    enabled: !!batchRef,
    ...options,
  });
};

export const useGetIpoBatchSubscribers = (
  params: {
    batchRef: string;
    type?: IPOBatchType;
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<
      ContentPaginatedResponse<IPOSubscriber>,
      Error,
      TransformedSubscribers
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.subscribers(params.type),
    queryFn: () => getIpoBatchSubscribers(params),
    select: (data) => {
      return {
        content: data?.content,
        pagination: {
          total: data?.totalElements,
          page: data?.page,
          totalPages: data?.totalPages,
        },
      };
    },
    ...options,
  });
};
