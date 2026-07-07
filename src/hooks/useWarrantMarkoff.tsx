import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  approveWarrantMarkoff,
  batchApproveWarrantMarkoff,
  batchRejectWarrantMarkoff,
  BatchRequest,
  BatchResponse,
  BulkWarrantMarkoffRequest,
  downloadBulkMarkoffTemplate,
  EnblocWarrantMarkoffRequest,
  getMarkOffHistory,
  getPendingMarkOffApprovals,
  getUnpaidWarrantMarkoff,
  getWarrantSearch,
  ManualMarkoffRequest,
  rejectWarrantMarkoff,
  submitBulkWarrantMarkoff,
  submitEnblocWarrantMarkoff,
  submitManualWarrantMarkoff,
  uploadBulkMarkoffFile,
  WarrantMarkOff,
  WarrantMarkOffParams,
  WarrantStatusResponse,
} from "@/actions/warrantMarkoffActions";
import { ApiResponse, PaginatedResponse } from "@/types";

// Load unpaid warrants for en-bloc mark-off
export const useGetUnpaidWarrantMarkoff = (
  params: WarrantMarkOffParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<WarrantMarkOff>,
      Error,
      PaginatedResponse<WarrantMarkOff>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["unpaid-warrant-markoff", params],
    queryFn: () => getUnpaidWarrantMarkoff(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Search warrant for mark-off
export const useGetWarrantSearch = (
  params: { q: string; registerId?: string },
  options?: Omit<
    UseQueryOptions<
      ApiResponse<WarrantMarkOff>,
      Error,
      ApiResponse<WarrantMarkOff>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["warrant-search", params],
    queryFn: () => getWarrantSearch(params),
    refetchOnWindowFocus: false,
    enabled: !!params.q,
    ...options,
  });
};

// List pending mark-off approvals
export const useGetPendingMarkOffApprovals = (
  params?: { page?: number; size?: number },
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<WarrantStatusResponse>,
      Error,
      PaginatedResponse<WarrantStatusResponse>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["pending-markoff-approvals", params],
    queryFn: () => getPendingMarkOffApprovals(params ?? {}),
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Mark-off history
export const useGetMarkOffHistory = (
  params: Partial<WarrantMarkOffParams>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<WarrantStatusResponse>,
      Error,
      PaginatedResponse<WarrantStatusResponse>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["markoff-history", params],
    queryFn: () => getMarkOffHistory(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Submit manual mark-off
export const useSubmitManualWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<WarrantStatusResponse>,
      Error,
      ManualMarkoffRequest
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManualMarkoffRequest) =>
      submitManualWarrantMarkoff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-markoff-approvals"],
      });
      queryClient.invalidateQueries({ queryKey: ["markoff-history"] });
    },
    ...options,
  });
};

// Submit en-bloc (bulk) mark-off
export const useSubmitEnBlocWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<WarrantStatusResponse>,
      Error,
      EnblocWarrantMarkoffRequest
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EnblocWarrantMarkoffRequest) =>
      submitEnblocWarrantMarkoff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unpaid-warrant-markoff"] });
      queryClient.invalidateQueries({
        queryKey: ["pending-markoff-approvals"],
      });
    },
    ...options,
  });
};

// Approve mark-off (single)
export const useApproveWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<WarrantStatusResponse>,
      Error,
      { id: number; data: { comment: string; authorisedBy: string } }
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { comment: string; authorisedBy: string };
    }) => approveWarrantMarkoff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-markoff-approvals"],
      });
      queryClient.invalidateQueries({ queryKey: ["markoff-history"] });
    },
    ...options,
  });
};

// Reject mark-off (single)
export const useRejectWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<WarrantStatusResponse>,
      Error,
      { id: number; data: { comment: string; authorisedBy: string } }
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { comment: string; authorisedBy: string };
    }) => rejectWarrantMarkoff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-markoff-approvals"],
      });
      queryClient.invalidateQueries({ queryKey: ["markoff-history"] });
    },
    ...options,
  });
};

// Batch approve mark-offs
export const useBatchApproveWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<ApiResponse<BatchResponse>, Error, BatchRequest>,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchRequest) => batchApproveWarrantMarkoff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-markoff-approvals"],
      });
      queryClient.invalidateQueries({ queryKey: ["markoff-history"] });
    },
    ...options,
  });
};

// Batch reject mark-offs
export const useBatchRejectWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<ApiResponse<BatchResponse>, Error, BatchRequest>,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchRequest) => batchRejectWarrantMarkoff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-markoff-approvals"],
      });
      queryClient.invalidateQueries({ queryKey: ["markoff-history"] });
    },
    ...options,
  });
};

export const useSubmitBulkWarrantMarkoff = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<{
        submitted: number;
        skipped: number;
        total: number;
        approvalRef: string;
        errors: string[];
      }>,
      Error,
      BulkWarrantMarkoffRequest
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkWarrantMarkoffRequest) =>
      submitBulkWarrantMarkoff(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bulk-warrant-markoff"],
      });
    },

    ...options,
  });
};

export const useUploadBulkMarkoffFile = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<{
        totalRows: number;
        matched: number;
        unmatched: number;
        rows: {
          rowNumber: number;
          register: string;
          dividendNumber: string;
          accountNumber: string;
          holderName: string;
          netAmount: number;
          status: string;
          reason: string;
        }[];
      }>,
      Error,
      FormData
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: (data: FormData) =>
      uploadBulkMarkoffFile(data),

    ...options,
  });
};

export const useDownloadBulkMarkoffTemplate = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<string>,
      Error,
      void
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: () => downloadBulkMarkoffTemplate(),

    ...options,
  });
};