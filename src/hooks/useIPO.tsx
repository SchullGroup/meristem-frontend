import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  downloadIpoBatchLogdement,
  getIpoBatch,
  getIpoBatchLogdement,
  getIpoBatchSubscribers,
  getIPOICUApprovals,
  getIpoBatchesLodgment,
  getIPOPendingApprovals,
  icuReviewIpo,
  opsApproveIpo,
  opsRejectIpo,
  uploadBatchIpo,
  getBatchSummaryReport,
  exportBatchSummaryReport,
  getStateSummaryReport,
  exportStateSummaryReport,
  getRangeAnalysisReport,
  exportRangeAnalysisReport,
  getFullSubscriptionListReport,
  exportFullSubscriptionListReport,
  getApplicationOfferReport,
  exportApplicationOfferReport,
  getApplicationOfferSummaryReport,
  exportApplicationOfferSummaryReport,
  approveLodgment,
} from "@/actions/ipoActions";

import { ContentPaginatedResponse } from "@/types";
import {
  IPO,
  IPOBatchType,
  IPOSubscriber,
  LodgementResponse,
  PendingApprovalParams,
  BatchSummaryResponse,
  StateSummaryResponse,
  RangeAnalysisResponse,
  FullSubscriptionListResponse,
  ApplicationOfferResponse,
  ApplicationOfferSummaryResponse,
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
  lodgments: (params?: PendingApprovalParams) =>
    [...ipoKeys.all, "lodgments", params] as const,
  reports: {
    all: () => [...ipoKeys.all, "reports"] as const,
    batchSummary: (register?: string) =>
      [...ipoKeys.reports.all(), "batchSummary", register] as const,
    stateSummary: (register?: string) =>
      [...ipoKeys.reports.all(), "stateSummary", register] as const,
    rangeAnalysis: (register?: string) =>
      [...ipoKeys.reports.all(), "rangeAnalysis", register] as const,
    fullSubscription: (params: { register?: string; page?: number; size?: number }) =>
      [...ipoKeys.reports.all(), "fullSubscription", params] as const,
    applicationOffer: (params: { register?: string; page?: number; size?: number }) =>
      [...ipoKeys.reports.all(), "applicationOffer", params] as const,
    applicationOfferSummary: (register?: string) =>
      [...ipoKeys.reports.all(), "applicationOfferSummary", register] as const,
  },
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

export const useGetIpoBatchLodgment = (
  params: {
    batchRef: string;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<LodgementResponse, Error, LodgementResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.detail(params?.batchRef),
    queryFn: () => getIpoBatchLogdement(params),
    enabled: !!params?.batchRef,
    ...options,
  });
};

export const useGetIpoBatchesLodgment = (
  params?: PendingApprovalParams,
  options?: Omit<
    UseQueryOptions<ContentPaginatedResponse<IPO>, Error, TransformedIPO>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ipoKeys.lodgments(params),
    queryFn: () => getIpoBatchesLodgment(params),
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

export const useDownloadIpoBatchLodgment = () => {
  return useMutation({
    mutationFn: (params: {
      batchRef: string;
      format: "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";
    }) => downloadIpoBatchLogdement(params),
  });
};

// --- Reports Hooks ---

export const useGetBatchSummaryReport = (
  register?: string,
  options?: Omit<
    UseQueryOptions<BatchSummaryResponse, Error, BatchSummaryResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ipoKeys.reports.batchSummary(register),
    queryFn: () => getBatchSummaryReport(register),
    ...options,
  });
};

export const useExportBatchSummaryReport = () => {
  return useMutation({
    mutationFn: (register?: string) => exportBatchSummaryReport(register),
  });
};

export const useGetStateSummaryReport = (
  register?: string,
  options?: Omit<
    UseQueryOptions<StateSummaryResponse, Error, StateSummaryResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ipoKeys.reports.stateSummary(register),
    queryFn: () => getStateSummaryReport(register),
    ...options,
  });
};

export const useExportStateSummaryReport = () => {
  return useMutation({
    mutationFn: (register?: string) => exportStateSummaryReport(register),
  });
};

export const useGetRangeAnalysisReport = (
  register?: string,
  options?: Omit<
    UseQueryOptions<RangeAnalysisResponse, Error, RangeAnalysisResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ipoKeys.reports.rangeAnalysis(register),
    queryFn: () => getRangeAnalysisReport(register),
    ...options,
  });
};

export const useExportRangeAnalysisReport = () => {
  return useMutation({
    mutationFn: (register?: string) => exportRangeAnalysisReport(register),
  });
};

export const useGetFullSubscriptionListReport = (
  params: {
    register?: string;
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<
      FullSubscriptionListResponse,
      Error,
      FullSubscriptionListResponse
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ipoKeys.reports.fullSubscription(params),
    queryFn: () => getFullSubscriptionListReport(params),
    ...options,
  });
};

export const useExportFullSubscriptionListReport = () => {
  return useMutation({
    mutationFn: (register?: string) => exportFullSubscriptionListReport(register),
  });
};

export const useGetApplicationOfferReport = (
  params: {
    register?: string;
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<ApplicationOfferResponse, Error, ApplicationOfferResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ipoKeys.reports.applicationOffer(params),
    queryFn: () => getApplicationOfferReport(params),
    ...options,
  });
};

export const useExportApplicationOfferReport = () => {
  return useMutation({
    mutationFn: (register?: string) => exportApplicationOfferReport(register),
  });
};

export const useGetApplicationOfferSummaryReport = (
  register?: string,
  options?: Omit<
    UseQueryOptions<
      ApplicationOfferSummaryResponse,
      Error,
      ApplicationOfferSummaryResponse
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ipoKeys.reports.applicationOfferSummary(register),
    queryFn: () => getApplicationOfferSummaryReport(register),
    ...options,
  });
};

export const useExportApplicationOfferSummaryReport = () => {
  return useMutation({
    mutationFn: (register?: string) => exportApplicationOfferSummaryReport(register),
  });
};

export const useApproveBatchLodgment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchRef,
      payload,
    }: {
      batchRef: string;
      payload: { comment: string; lodgdedBy: string };
    }) => approveLodgment(batchRef, payload),

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
