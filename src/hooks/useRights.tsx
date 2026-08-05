import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  getAllRightsIssues,
  icuReject,
  icuApprove,
  getRightsIssueShareholders,
  computeEntitlements,
  getAllotment,
  getTradedRightsReport,
  exportStateAnalysisReport,
  getRightsEntitlementReport,
  exportRangeAnalysisReport,
  exportNonAcceptanceReport,
  exportAllotmentReport,
  exportAcceptanceSummaryReport,
  emailShareholders,
  getOrCreateRightsDeclaration,
  createRightsReturnBatch,
  listRightsReturnBatches,
  listRightsBatchRecords,
  submitRightsReturn,
  bulkUploadRightsReturns,
  listRightsReturns,
  deleteRightsReturn,
  forwardRightsBatchToHod,
  hodActionRightsBatch,
  getRightsAllotmentRules,
  saveRightsAllotmentRules,
  getRightsAllotmentSummary,
  runRightsAllotment,
  getRightsRefundSubscribers,
  queueRightsRefunds,
  uploadRightsReversal,
  initiateRightsReversal,
  dispatchTestRights,
  type CreateReturnBatchPayload,
  type AllotmentBand,
} from "@/actions/rightsActions";
import {
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
  pagination: {
    total: number;
  };
}

export const useAllRightsIssues = (params?: RightsIssueParams, options?: Omit<
  UseQueryOptions<
    PaginatedResponse<RightsIssue>,
    Error,
    {
      content: RightsIssue[];
      pagination: {
        total: number;
        page: number;
        totalPages: number;
      };
    }
  >,
  "queryKey" | "queryFn" | "select"
>) => {
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
    ...options,
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
      pagination: {
        total: data?.data?.content?.length ?? 0,
      },
    }),
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

// ── Offer→declaration bridge + returns batches ───────────────────────────────

export const useGetOrCreateRightsDeclaration = () =>
  useMutation({
    mutationFn: ({ offerId, createdBy }: { offerId: string | number; createdBy?: string }) =>
      getOrCreateRightsDeclaration(offerId, createdBy),
  });

export const useCreateRightsReturnBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: CreateReturnBatchPayload }) =>
      createRightsReturnBatch(id, data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["rights", "return-batches", String(v.id)] }),
  });
};

export const useListRightsReturnBatches = (id?: string | number) =>
  useQuery({
    queryKey: ["rights", "return-batches", String(id ?? "")],
    queryFn: () => listRightsReturnBatches(id!),
    enabled: !!id,
  });

export const useListRightsBatchRecords = (
  id?: string | number,
  batchId?: string | number,
  params?: { page?: number; size?: number },
) =>
  useQuery({
    queryKey: ["rights", "batch-records", String(id ?? ""), String(batchId ?? ""), params ?? {}],
    queryFn: () => listRightsBatchRecords(id!, batchId!, params),
    enabled: !!id && !!batchId,
  });

export const useSubmitRightsReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) =>
      submitRightsReturn(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rights", "batch-records"] }),
  });
};

export const useBulkUploadRightsReturns = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, txType, file, batchId }: { id: string | number; txType: string; file: File; batchId?: string | number }) =>
      bulkUploadRightsReturns(id, txType, file, batchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rights", "batch-records"] }),
  });
};

export const useListRightsReturns = (
  id?: string | number,
  params?: { page?: number; size?: number; status?: string; txType?: string },
) =>
  useQuery({
    queryKey: ["rights", "returns", String(id ?? ""), params ?? {}],
    queryFn: () => listRightsReturns(id!, params),
    enabled: !!id,
  });

export const useDeleteRightsReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, returnId }: { id: string | number; returnId: string | number }) =>
      deleteRightsReturn(id, returnId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rights", "returns"] }),
  });
};

export const useForwardRightsBatchToHod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, batchId, submittedBy }: { id: string | number; batchId: string | number; submittedBy?: string }) =>
      forwardRightsBatchToHod(id, batchId, submittedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rights", "return-batches"] });
      qc.invalidateQueries({ queryKey: ["rights", "returns"] });
    },
  });
};

export const useHodActionRightsBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, batchId, approve, actor, comment }: { id: string | number; batchId: string | number; approve: boolean; actor?: string; comment?: string }) =>
      hodActionRightsBatch(id, batchId, approve, actor, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rights", "return-batches"] }),
  });
};

// ── Allotment rule engine ─────────────────────────────────────────────────────

export const useRightsAllotmentRules = (id?: string | number) =>
  useQuery({
    queryKey: ["rights", "allotment-rules", String(id ?? "")],
    queryFn: () => getRightsAllotmentRules(id!),
    enabled: !!id,
  });

export const useRightsAllotmentSummary = (id?: string | number) =>
  useQuery({
    queryKey: ["rights", "allotment-summary", String(id ?? "")],
    queryFn: () => getRightsAllotmentSummary(id!),
    enabled: !!id,
  });

export const useSaveRightsAllotmentRules = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bands }: { id: string | number; bands: AllotmentBand[] }) =>
      saveRightsAllotmentRules(id, bands),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["rights", "allotment-rules", String(v.id)] });
      qc.invalidateQueries({ queryKey: ["rights", "allotment-summary", String(v.id)] });
    },
  });
};

export const useRunRightsAllotment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string | number }) => runRightsAllotment(id),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["rights", "allotment-summary", String(v.id)] }),
  });
};

// ── Return monies ─────────────────────────────────────────────────────────────

export const useRightsRefundSubscribers = (
  id?: string | number,
  params?: { reason?: string; status?: string; page?: number; size?: number },
) =>
  useQuery({
    queryKey: ["rights", "refunds", String(id ?? ""), params ?? {}],
    queryFn: () => getRightsRefundSubscribers(id!, params),
    enabled: !!id,
  });

export const useQueueRightsRefunds = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, subscriberIds, queuedBy }: { id: string | number; subscriberIds: number[]; queuedBy?: string }) =>
      queueRightsRefunds(id, subscriberIds, queuedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rights", "refunds"] }),
  });
};

// ── CSCS reversal ─────────────────────────────────────────────────────────────

export const useUploadRightsReversal = () =>
  useMutation({
    mutationFn: ({ id, file, uploadedBy }: { id: string | number; file: File; uploadedBy: string }) =>
      uploadRightsReversal(id, file, uploadedBy),
  });

export const useInitiateRightsReversal = () =>
  useMutation({
    mutationFn: ({ id, accountNumbers, resolution, initiatedBy }: { id: string | number; accountNumbers: string[]; resolution: string; initiatedBy?: string }) =>
      initiateRightsReversal(id, accountNumbers, resolution, initiatedBy),
  });

// ── Dispatch & notifications ──────────────────────────────────────────────────

export const useDispatchRightsEmails = () =>
  useMutation({
    mutationFn: ({ id, subject, html }: { id: string; subject?: string; html?: string }) =>
      emailShareholders(id, { subject, html }),
  });

export const useDispatchTestRights = () =>
  useMutation({
    mutationFn: ({ id, subject, html, recipients }: { id: string | number; subject?: string; html?: string; recipients: string[] }) =>
      dispatchTestRights(id, { subject, html, recipients }),
  });
