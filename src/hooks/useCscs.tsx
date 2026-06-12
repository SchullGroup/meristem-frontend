import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";

import {
  GET_CSCS_FLAGGED_TRANSACTIONS,
  GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY,
  GET_CSCS_PROCESSED_LOGS,
  GET_CSCS_PROCESSING_QUEUE,
  UPLOAD_CSCS_FILE,
  INJECT_CSCS_ZIP_FILE,
  GET_HOLDERS,
  UPDATE_HOLDER_STATES,
  GET_CSCS_RECONCILIATION_FLAGGED_TRANSACTIONS,
  GET_CSCS_RECONCILIATIONS,
  GET_CSCS_TRANSACTION_LOG_BATCHES,
  GET_CSCS_INJECT_JOB,
  GET_CSCS_SHAREHOLDER_TRANSACTIONS,
  UPLOAD_CSCS_HISTORY,
  UPDATE_CSCS_TRANSACTION,
} from "@/actions/cscsActions";
import {
  ProcessedLogsResponse,
  FlaggedTransaction,
  ProcessingQueueResponse,
  Holder,
  ReconciliationFlaggedTransaction,
  ReconciliationResponse,
  TransactionBatch,
  CscsInjectJob,
  CscsPosition,
  ProcessedTransaction,
} from "@/types/cscs";
import { ApiResponse, ContentPaginatedResponse, PaginatedResponse } from "@/types";

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

/**
 * Poll the CSCS inject background job status.
 * Enable only when a batchRef is available and the job is not yet done.
 * The caller controls polling interval via `refetchInterval` in options.
 */
export const useGetCscsInjectJob = (
  batchRef: string | null,
  options?: Omit<
    UseQueryOptions<CscsInjectJob, Error, CscsInjectJob>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["cscs-inject-job", batchRef],
    queryFn: () => GET_CSCS_INJECT_JOB(batchRef!),
    enabled: !!batchRef,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetHolders = (
  params?: {
    name?: string;
    email?: string;
    chn?: string;
    registerId?: string;
    batchRef?: string;
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
    startDate?: string;
    endDate?: string;
    chn?: string;
    page?: number; // 0 indexed
    size?: number;
  },
  options?: Omit<
    UseQueryOptions<ReconciliationResponse["data"], Error, ReconciliationResponse["data"]>,
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

export const useGetCscsShareholderTransactions = (
  params?: {
    chn?: string;
    register?: string;
  },
  options?: Omit<
    UseQueryOptions<
      ApiResponse<unknown>,
      Error,
      ApiResponse<unknown>["data"]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["shareholder-transactions", params],
    queryFn: () => GET_CSCS_SHAREHOLDER_TRANSACTIONS(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};


export const useUploadCscsHistory = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<CscsPosition[]>,
      Error,
      { register: string, data: FormData }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ register, data }: { register: string, data: FormData }) =>
      UPLOAD_CSCS_HISTORY(register, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-flagged-transactions"], exact: false });
    },
    ...options
  });
};

export const useUpdateCscsTransaction = (
  options?: Omit<
    UseMutationOptions<
      ProcessedTransaction,
      Error,
      { id: string, data: Partial<ProcessedTransaction> }>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<ProcessedTransaction> }) =>
      UPDATE_CSCS_TRANSACTION(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-flagged-transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["reconciliations"], exact: false });
    },
    ...options
  });
};