import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  getAllRightsIssues,
  getRightsIssueById,
  createRightsIssue,
  submitForApproval,
  rejectRightsIssue,
  icuReject,
  icuApprove,
  approveRightsIssue,
  getRightsIssueShareholders,
  computeEntitlements,
  uploadAllotment,
  processAllotment,
  getAllotment,
  getTradedRights,
  createTradedRights,
  deleteTradedRights,
  getStickyLabels,
  getTradedRightsReport,
  exportStateAnalysisReport,
  getRightsEntitlementReport,
  exportRangeAnalysisReport,
  exportNonAcceptanceReport,
  exportAllotmentReport,
  exportAcceptanceSummaryReport,
  lodgeRightsIssueDeclaration,
  emailShareholders,
} from "@/actions/rightsActions";
import {
  CreateRightsIssue,
  RightsIssueParams,
  Shareholder,
  AllotmentParams,
  Allotment,
  RangeAnalysisResponse,
  StateAnalysisResponse,
  TradedRightsResponse,
  RightsEntitlementResponse,
  NonAcceptanceResponse,
  RightsAllotmentResponse,
  RightsAcceptanceSummaryResponse,
  RightsIssue,
} from "@/types/rights";
import { ApiResponse, EntitlementResponse, PaginatedResponse } from "@/types";

export interface RightsIssueShareholders {
  stats?: {
    totalShareholders: number;
    totalUnitsHeld: number;
    totalRightsDue: number;
    totalAmountDue: number;
  };
  content: Shareholder[];
  pagination: {
    total: number;
    totalPages: number;
  };
}

export interface TransformedResponse<T> {
  stats?: {
    declarationId: string;
    totalAllotted: number;
    totalDisapproved: number;
    totalInvalid: number;
    totalReturnAmount: number;
    processedAt: string;
  };
  content: T[];
}

export interface TransformedShareholderProfileResponse<T> {
  content: T[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export const useAllRightsIssues = (params?: RightsIssueParams, options?: Omit<
  UseQueryOptions<
    PaginatedResponse<RightsIssue>,
    Error,
    TransformedResponse<RightsIssue>
  >,
  "queryKey" | "queryFn"
>,) => {
  return useQuery({
    queryKey: ["rightsIssues", params],
    queryFn: () => getAllRightsIssues(params),
    select: (data) => {
      return {
        content: data?.data?.content,
        pagination: {
          total: data?.data?.totalElements,
          page: data?.data?.pageable?.pageNumber,
          totalPages: data?.data?.totalPages,
        },
      };
    },
    refetchOnWindowFocus: false,
    ...options
  });
};

export const useRightsIssueById = (id: string) => {
  return useQuery({
    queryKey: ["rightsIssues", id],
    queryFn: () => getRightsIssueById(id),
    refetchOnWindowFocus: false,
  });
};

export const useCreateRightsIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRightsIssue) => createRightsIssue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useSubmitForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => submitForApproval(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["rightsIssues", id] });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useRejectRightsIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      id: string;
      decision: string;
      comment: string;
      createdBy: string;
    }) => rejectRightsIssue(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useComputeEntitlements = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => computeEntitlements(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["rightsIssues", id] });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useIcuReject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      decision: string;
      comment: string;
      createdBy: string;
    }) => icuReject(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useIcuApprove = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      decision: string;
      comment: string;
      createdBy: string;
    }) => icuApprove(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useApproveRightsIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      decision: string;
      comment: string;
      createdBy: string;
    }) => approveRightsIssue(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
      queryClient.invalidateQueries({ queryKey: ["rightsIssues"] });
    },
  });
};

export const useGetRightsIssueShareholders = ({
  params,
  options,
}: {
  params?: RightsIssueParams;
  options?: Omit<
    UseQueryOptions<EntitlementResponse, Error, RightsIssueShareholders>,
    "queryKey" | "queryFn"
  >;
}) => {
  return useQuery<EntitlementResponse, Error, RightsIssueShareholders>({
    queryKey: ["rightsIssues", params, "shareholders"],
    queryFn: () => getRightsIssueShareholders(params),
    select: (data) => {
      return {
        stats: {
          totalShareholders: data?.data?.totalShareholders,
          totalUnitsHeld: data?.data?.totalUnitsHeld,
          totalRightsDue: data?.data?.totalRightsDue,
          totalAmountDue: data?.data?.totalAmountDue,
        },
        content: data?.data?.entitlements?.content,
        pagination: {
          total: data?.data?.entitlements?.totalElements,
          totalPages: data?.data?.entitlements?.totalPages,
        },
      };
    },
    refetchOnMount: "always",
    ...options,
  });
};

export const useUploadAllotment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      uploadAllotment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id],
      });
    },
  });
};

export const useProcessAllotment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      processAllotment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id, "allotment"],
      });
    },
  });
};

export const useGetAllotment = (
  params: AllotmentParams,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<{
        declarationId: string;
        totalAllotted: number;
        totalDisapproved: number;
        totalInvalid: number;
        totalReturnAmount: number;
        processedAt: string;
        content: Allotment[];
      }>,
      Error,
      TransformedResponse<Allotment>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: [
      "rightsIssues",
      params.id,
      "allotment",
      params.status,
      params.page,
    ],
    queryFn: () => getAllotment(params),
    select: (data) => ({
      stats: {
        declarationId: data?.data?.declarationId,
        totalAllotted: data?.data?.totalAllotted,
        totalDisapproved: data?.data?.totalDisapproved,
        totalInvalid: data?.data?.totalInvalid,
        totalReturnAmount: data?.data?.totalReturnAmount,
        processedAt: data?.data?.processedAt,
      },
      content: data.data?.content,
    }),
    ...options,
  });
};

export const useGetTradedRights = (params: RightsIssueParams) => {
  return useQuery({
    queryKey: ["rightsIssues", params.id, "traded-rights", params],
    queryFn: () => getTradedRights(params),
    enabled: !!params.id,
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
  });
};

export const useCreateTradedRights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        shareholderId: string;
        volume: number;
        memberCode: string;
      };
    }) => createTradedRights({ id, data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id, "traded-rights"],
      });
    },
  });
};

export const useDeleteTradedRights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; entryId: string }) =>
      deleteTradedRights(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id, "traded-rights"],
      });
    },
  });
};

export const useLodgeRightsIssueDeclaration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        lodgmentDate: string;
        lodgmentRef: string;
        notes: string;
        processedBy: string
      }
    }) => lodgeRightsIssueDeclaration(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rightsIssues", variables.id, "traded-rights"],
      });
    },
  });
};

export const useGetStickyLabels = (
  params: RightsIssueParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{
        shareholderId: string;
        shareholderName: string;
        accountNumber: string;
        email: string;
        address: string;
        issueName: string;
      }>,
      Error,
      TransformedShareholderProfileResponse<{
        shareholderId: string;
        shareholderName: string;
        accountNumber: string;
        email: string;
        address: string;
        issueName: string;
      }>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rightsIssues", params.id, "sticky-label", params],
    queryFn: () => getStickyLabels(params),
    select: (data) => {
      return {
        content: data?.data?.content,
        pagination: {
          total: data?.data?.totalElements,
          page: data?.data?.number,
          totalPages: data?.data?.totalPages,
        },
      };
    },
    ...options,
  });
};

export const useEmailShareholders = () => {

  return useMutation({
    mutationFn: (id: string) => emailShareholders(id),
  });
};

export const useGetTradedRightsReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<TradedRightsResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "traded-rights", registerId, format],
    queryFn: () => getTradedRightsReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetStateAnalysisReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<StateAnalysisResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "state-analysis", registerId, format],
    queryFn: () => exportStateAnalysisReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetRightsEntitlementReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<RightsEntitlementResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "rights-entitlement", registerId, format],
    queryFn: () => getRightsEntitlementReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetRangeAnalysisReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<RangeAnalysisResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "range-analysis", registerId, format],
    queryFn: () => exportRangeAnalysisReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetNonAcceptanceReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<NonAcceptanceResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "non-acceptance", registerId, format],
    queryFn: () => exportNonAcceptanceReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetAllotmentReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<RightsAllotmentResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "allotment", registerId, format],
    queryFn: () => exportAllotmentReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetAcceptanceSummaryReport = (
  registerId?: string,
  format?: "json" | "excel",
  options?: Omit<
    UseQueryOptions<ApiResponse<RightsAcceptanceSummaryResponse> | Blob, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rights-report", "acceptance-summary", registerId, format],
    queryFn: () => exportAcceptanceSummaryReport(registerId, format),
    refetchOnWindowFocus: false,
    ...options,
  });
};
