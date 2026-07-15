import {
  authoriseAdmon,
  authoriseAdmonReversal,
  authoriseConsolidation,
  authoriseKycChange,
  batchAuthoriseAdmons,
  batchAuthoriseAdmonReversals,
  batchAuthoriseConsolidations,
  batchAuthoriseKycChanges,
  batchRejectAdmons,
  batchRejectAdmonReversals,
  batchReturnAdmons,
  batchRejectConsolidations,
  batchRejectKycChanges,
  createAdmon,
  createAdmonReversal,
  createConsolidation,
  createKycChange,
  getAccount,
  getAccountKycHistory,
  getAccounts,
  getAdmon,
  getAdmonReversals,
  getAdmons,
  getConsolidation,
  getConsolidations,
  getConsolidationUploadJob,
  getKycChanges,
  getKycChangesUploadJob,
  rejectAdmon,
  rejectAdmonReversal,
  cancelKycChange,
  rejectConsolidation,
  rejectKycChange,
  reverseConsolidation,
  uploadConsolidations,
  uploadKycChanges,
  uploadHolderSignature,
  uploadHolderKycDocuments,
  getHolderKycDocuments,
  verifyHolderKycDocument,
  rejectHolderKycDocument,
  getHolderSignature,
  getHolderSignatureArchive,
} from "@/actions/accountMaintenanceActions";
import { ApiResponse } from "@/types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  AccountFilters,
  AccountListResponse,
  AccountKycHistoryFilters,
  Admon,
  AdmonFilters,
  AdmonReversal,
  AdmonReversalFilters,
  BatchConsolidationRequest,
  BatchConsolidationResponse,
  BatchKycActionRequest,
  BatchKycActionResponse,
  Consolidation,
  ConsolidationDecisionRequest,
  ConsolidationFilters,
  ConsolidationListResponse,
  ConsolidationUploadJob,
  CreateConsolidationRequest,
  CreateKycChangeRequest,
  CreateAdmonRequest,
  CreateAdmonReversalRequest,
  KycChange,
  KycChangeFilters,
  KycChangeListResponse,
  KycDecisionRequest,
  KycCancelRequest,
  KycUploadJob,
  ShareholderAccount,
  AdmonListResponse,
  AdmonDecisionRequest,
  BatchAdmonRequest,
  BatchAdmonResponse,
  BatchAdmonReversalRequest,
  BatchAdmonReversalResponse,
  AdmonReversalListResponse,
  HolderKycDocRequest,
  HolderSignatureRequest,
  HolderKycDocument,
} from "@/types/account-maintenance";

export const useGetConsolidations = (
  params?: ConsolidationFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<ConsolidationListResponse>>,
    "queryKey" | "queryFn" | "select"
  >,
) =>
  useQuery({
    queryKey: ["consolidations", params],
    queryFn: () => getConsolidations(params),
    refetchOnWindowFocus: false,
    select: (data) => {
      return {
        content: data?.data?.data || [],
        pagination: {
          currentPage: data?.data?.page || 0,
          pageSize: data?.data?.pageSize || 0,
          total: data?.data?.total || 0,
          totalPages: data?.data?.totalPages || 1,
        },
      };
    },
    ...options,
  });

export const useGetConsolidation = (
  id: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<Consolidation>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["consolidation", id],
    queryFn: () => getConsolidation(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateConsolidation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<Consolidation>,
      Error,
      CreateConsolidationRequest
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: createConsolidation,
    ...options,
  });

export const useAuthoriseConsolidation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<Consolidation>,
      Error,
      {
        id: number;
        data: ConsolidationDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, data }) => authoriseConsolidation(id, data),
    ...options,
  });

export const useRejectConsolidation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<Consolidation>,
      Error,
      {
        id: number;
        data: ConsolidationDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, data }) => rejectConsolidation(id, data),
    ...options,
  });

export const useReverseConsolidation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<Consolidation>,
      Error,
      { id: number; data: ConsolidationDecisionRequest }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, data }) => reverseConsolidation(id, data),
    ...options,
  });

export const useBatchAuthoriseConsolidations = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchConsolidationResponse>,
      Error,
      BatchConsolidationRequest
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: batchAuthoriseConsolidations,
    ...options,
  });

export const useBatchRejectConsolidations = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchConsolidationResponse>,
      Error,
      BatchConsolidationRequest
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: batchRejectConsolidations,
    ...options,
  });

export const useUploadConsolidations = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<ConsolidationUploadJob>,
      Error,
      {
        registerId: string;
        file: File;
      }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ registerId, file }) =>
      uploadConsolidations(registerId, file),
    ...options,
  });

export const useGetBulkConsolidationUpload = (
  jobId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<ConsolidationUploadJob>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["consolidations", jobId],
    queryFn: () => getConsolidationUploadJob(jobId),
    ...options,
  });

///////////////////////// KYC /////////////////////////

export const useGetAccounts = (
  params: AccountFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<AccountListResponse>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["accounts", params],
    queryFn: () => getAccounts(params),
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetAccountKycHistory = (
  accountNumber: string,
  params?: AccountKycHistoryFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<KycChangeListResponse>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["account-kyc-history", accountNumber, params],
    queryFn: () => getAccountKycHistory(accountNumber, params),
    enabled: !!accountNumber,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetAccount = (
  accountNumber: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<ShareholderAccount>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["accounts", accountNumber],
    queryFn: () => getAccount(accountNumber),
    enabled: !!accountNumber,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetKycChanges = (
  params?: KycChangeFilters,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<KycChangeListResponse>,
      Error,
      KycChangeListResponse
    >,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["kyc-changes", params],
    queryFn: () => getKycChanges(params),
    refetchOnWindowFocus: false,
    select: (data) => {
      return data?.data;
    },
    ...options,
  });

export const useCreateKycChange = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<KycChange>,
      Error,
      { accountNumber: string; data: CreateKycChangeRequest }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountNumber,
      data,
    }: {
      accountNumber: string;
      data: CreateKycChangeRequest;
    }) => createKycChange(accountNumber, data),
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
    },
  });
};
export const useAuthoriseKycChange = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<KycChange>,
      Error,
      {
        id: number;
        data: KycDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => authoriseKycChange(id, data),
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
    },
  });
};

export const useRejectKycChange = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<KycChange>,
      Error,
      {
        id: number;
        data: KycDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => rejectKycChange(id, data),
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
    },
  });
};
export const useCancelKycChange = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<KycChange>,
      Error,
      {
        id: number;
        data: KycCancelRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => cancelKycChange(id, data),
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-changes"] });
      queryClient.invalidateQueries({ queryKey: ["account-kyc-history"] });
    },
  });
};

export const useBatchAuthoriseKycChanges = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchKycActionResponse>,
      Error,
      BatchKycActionRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchAuthoriseKycChanges,
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useBatchRejectKycChanges = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchKycActionResponse>,
      Error,
      BatchKycActionRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchRejectKycChanges,
    ...options,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useUploadKycChanges = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<KycUploadJob>,
      Error,
      {
        file: File;
        registerId?: string;
      }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ file, registerId }) => uploadKycChanges(file, registerId),
    ...options,
  });

export const useGetBulkKycChangesUploadJob = (
  jobId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<KycUploadJob>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["kyc-changes-upload", jobId],
    queryFn: () => getKycChangesUploadJob(jobId),
    ...options,
  });

export const useUploadHolderSignature = (
  options?: Omit<
    UseMutationOptions<ApiResponse<any>, Error, HolderSignatureRequest>,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: uploadHolderSignature,
    ...options,
  });

export const useUploadHolderKycDocuments = (
  options?: Omit<
    UseMutationOptions<ApiResponse<any>, Error, HolderKycDocRequest>,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: uploadHolderKycDocuments,
    ...options,
  });

export const useGetHolderSignature = (
  chn: string,
  registerSymbol: string,
  options?: Omit<
    UseQueryOptions<{ data: { signatureUrl: string } | null }>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["holder-signature", chn, registerSymbol],
    queryFn: () => getHolderSignature(chn, registerSymbol),
    enabled: !!chn && !!registerSymbol,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetHolderSignatureArchive = (
  chn: string,
  registerSymbol: string,
  options?: Omit<
    UseQueryOptions<{
      data: {
        id: string;
        signatureUrl: string;
        status: "ACTIVE" | "ARCHIVED";
        uploadedAt: string;
        uploadedBy: string;
        approvedAt?: string;
        approvedBy?: string;
      }[];
    }>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["holder-signature-archive", chn, registerSymbol],
    queryFn: () => getHolderSignatureArchive(chn, registerSymbol),
    enabled: !!chn && !!registerSymbol,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetHolderKycDocuments = (
  chn: string,
  registerSymbol: string,
  options?: Omit<
    UseQueryOptions<{ data: HolderKycDocument[] }>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["holder-kyc-documents", chn, registerSymbol],
    queryFn: () => getHolderKycDocuments(chn, registerSymbol),
    enabled: !!chn && !!registerSymbol,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useVerifyHolderKycDocument = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<any>,
      Error,
      { id: string; actionBy: string }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: (data) => verifyHolderKycDocument(data, data.id),
    ...options,
  });

export const useRejectHolderKycDocument = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<any>,
      Error,
      { id: string; actionBy: string }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: (data) => rejectHolderKycDocument(data, data.id),
    ...options,
  });

export const useGetAdmons = (
  params?: AdmonFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<AdmonListResponse>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["admons", params],
    queryFn: () => getAdmons(params),
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetAdmon = (
  id: number,
  options?: Omit<UseQueryOptions<ApiResponse<Admon>>, "queryKey" | "queryFn">,
) =>
  useQuery({
    queryKey: ["admon", id],
    queryFn: () => getAdmon(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useGetAdmonReversals = (
  params?: AdmonReversalFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<AdmonReversalListResponse>>,
    "queryKey" | "queryFn"
  >,
) =>
  useQuery({
    queryKey: ["admon-reversals", params],
    queryFn: () => getAdmonReversals(params),
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateAdmon = (
  options?: Omit<
    UseMutationOptions<ApiResponse<Admon>, Error, CreateAdmonRequest>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdmon,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: ["admons"],
      });

      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useAuthoriseAdmon = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<Admon>,
      Error,
      {
        id: number;
        data: AdmonDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => authoriseAdmon(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admons"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admon", variables.id],
      });
    },

    ...options,
  });
};

export const useRejectAdmon = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<Admon>,
      Error,
      {
        id: number;
        data: AdmonDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => rejectAdmon(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admons"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admon", variables.id],
      });
    },

    ...options,
  });
};

export const useBatchAuthoriseAdmons = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchAdmonResponse>,
      Error,
      BatchAdmonRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchAuthoriseAdmons,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admons"],
      });
    },

    ...options,
  });
};

export const useBatchRejectAdmons = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchAdmonResponse>,
      Error,
      BatchAdmonRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchRejectAdmons,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admons"],
      });
    },

    ...options,
  });
};

export const useBatchReturnAdmons = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchAdmonResponse>,
      Error,
      BatchAdmonRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchReturnAdmons,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admons"],
      });
    },

    ...options,
  });
};

export const useCreateAdmonReversal = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<AdmonReversal>,
      Error,
      {
        admonId: number;
        data: CreateAdmonReversalRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ admonId, data }) => createAdmonReversal(admonId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admon-reversals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admon", variables.admonId],
      });
    },

    ...options,
  });
};

export const useAuthoriseAdmonReversal = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<AdmonReversal>,
      Error,
      {
        reversalId: number;
        data: AdmonDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reversalId, data }) =>
      authoriseAdmonReversal(reversalId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admon-reversals"],
      });
    },

    ...options,
  });
};

export const useRejectAdmonReversal = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<AdmonReversal>,
      Error,
      {
        reversalId: number;
        data: AdmonDecisionRequest;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reversalId, data }) => rejectAdmonReversal(reversalId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admon-reversals"],
      });
    },

    ...options,
  });
};

export const useBatchAuthoriseAdmonReversals = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchAdmonReversalResponse>,
      Error,
      BatchAdmonReversalRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchAuthoriseAdmonReversals,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admon-reversals"],
      });
    },

    ...options,
  });
};

export const useBatchRejectAdmonReversals = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<BatchAdmonReversalResponse>,
      Error,
      BatchAdmonReversalRequest
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchRejectAdmonReversals,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admon-reversals"],
      });
    },

    ...options,
  });
};
