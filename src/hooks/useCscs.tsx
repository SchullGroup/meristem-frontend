import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  GET_CSCS_FLAGGED_TRANSACTIONS,
  GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY,
  GET_CSCS_PROCESSED_LOGS,
  GET_CSCS_PROCESSING_QUEUE,
  RESOLVE_CSCS_FLAGGED_TRANSACTION,
  UPLOAD_CSCS_FILE,
  INJECT_CSCS_ZIP_FILE,
  GET_HOLDERS,
  UPDATE_HOLDER_STATES,
  GET_CSCS_RECONCILIATION_FLAGGED_TRANSACTIONS,
  GET_CSCS_RECONCILIATIONS,
  GET_CSCS_TRANSACTION_LOG_BATCHES,
} from "@/actions/cscsActions";
import {
  ProcessedLogsResponse,
  FlaggedTransaction,
  ProcessingQueueResponse,
  Holder,
  ReconciliationFlaggedTransaction,
  ReconciliationResponse,
  TransactionBatch,
} from "@/types/cscs";
import { ContentPaginatedResponse, PaginatedResponse } from "@/types";

export const useGetCscsProcessedLogs = (
  params?: {
    search?: string;
    register?: string;
    type?: "BUY" | "SELL";
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<ProcessedLogsResponse, Error, ProcessedLogsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["cscs-processed-logs", params],
    queryFn: () => GET_CSCS_PROCESSED_LOGS(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetCscsTransactionBatchLogs = (
  params?: {
    batchRef?: string;
    register?: string;
    status?: "COMPLETE" | "PARTIAL";
    dateFilter?: "TODAY" | "THIS_WEEK" | "THIS_MONTH";
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TransactionBatch>, Error, PaginatedResponse<TransactionBatch>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["cscs-transaction-batch-logs", params],
    queryFn: () => GET_CSCS_TRANSACTION_LOG_BATCHES(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetCscsProcessingQueue = (
  params?: {
    search?: string;
    register?: string;
    status?: "PARTIAL" | "COMPLETE";
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<ProcessingQueueResponse, Error, ProcessingQueueResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["cscs-processing-queue", params],
    queryFn: () => GET_CSCS_PROCESSING_QUEUE(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUploadCscsFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => UPLOAD_CSCS_FILE(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cscs-processed-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cscs-processing-queue"] });
    },
  });
};

export const useResolveCscsFlaggedTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      data: { resolvedBy: string; resolutionNote: string };
    }) => RESOLVE_CSCS_FLAGGED_TRANSACTION(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cscs-processed-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cscs-processing-queue"] });
    },
  });
};

export const useGetCscsFlaggedTransactions = (
  params?: {
    search?: string;
    register?: string;
    status?: "PENDING" | "RESOLVED";
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<FlaggedTransaction>,
      Error,
      PaginatedResponse<FlaggedTransaction>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["cscs-flagged-transactions", params],
    queryFn: () => GET_CSCS_FLAGGED_TRANSACTIONS(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetCscsFlaggedTransactionHistory = (
  chn: string,
  options?: Omit<
    UseQueryOptions<FlaggedTransaction[], Error, FlaggedTransaction[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["cscs-flagged-transactions-history", chn],
    queryFn: () => GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY(chn),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useInjectCscsFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => INJECT_CSCS_ZIP_FILE(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cscs-processed-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cscs-processing-queue"] });
    },
  });
};

export const useGetHolders = (
  params?: {
    name?: string;
    email?: string;
    chn?: string;
    registerId?: string;
    page?: number;
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<
      ContentPaginatedResponse<Holder>,
      Error,
      ContentPaginatedResponse<Holder>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["holders", params],
    queryFn: () => GET_HOLDERS(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateHolderStates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { updates: { id: string; state: string }[] }) =>
      UPDATE_HOLDER_STATES(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holders"] });
    },
  });
};

export const useGetReconciliations = (
  params: {
    register: string;
    from?: string;
    to?: string;
    chn?: string;
    page?: number; // 0 indexed
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<ReconciliationResponse, Error, ReconciliationResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["reconciliations", params],
    queryFn: () => GET_CSCS_RECONCILIATIONS(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useReconciliationFlaggedTransactions = (
  params?: {
    search?: string;
    register?: string;
    startDate?: string;
    endDate?: string;
    status?: "PENDING" | "RESOLVED";
    page?: number; // 0 indexed
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<ReconciliationFlaggedTransaction>,
      Error,
      PaginatedResponse<ReconciliationFlaggedTransaction>["data"]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["reconciliation-flagged-transactions", params],
    queryFn: () => GET_CSCS_RECONCILIATION_FLAGGED_TRANSACTIONS(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
