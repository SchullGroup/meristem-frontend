import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions
} from "@tanstack/react-query";


import { GET_CSCS_FLAGGED_TRANSACTIONS, GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY, GET_CSCS_PROCESSED_LOGS, GET_CSCS_PROCESSING_QUEUE, RESOLVE_CSCS_FLAGGED_TRANSACTION, UPLOAD_CSCS_FILE } from "@/actions/cscsActions";
import { ProcessedLogsResponse, FlaggedTransaction, FlaggedTransactionsResponse, ProcessingQueueResponse } from "@/types/cscs";


export const useGetCscsProcessedLogs = (params?: {
    search?: string;
    register?: string;
    type?: "BUY" | "SELL";
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}, options?: Omit<UseQueryOptions<ProcessedLogsResponse, any, ProcessedLogsResponse>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["cscs-processed-logs", params],
        queryFn: () => GET_CSCS_PROCESSED_LOGS(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetCscsProcessingQueue = (params?: {
    search?: string;
    register?: string;
    status?: 'PARTIAL' | 'COMPLETE';
    page?: number;
    size?: number;
}, options?: Omit<UseQueryOptions<ProcessingQueueResponse, any, ProcessingQueueResponse>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ["cscs-processing-queue"],
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
        mutationFn: (data: { id: string, data: { resolvedBy: string, resolutionNote: string } }) => RESOLVE_CSCS_FLAGGED_TRANSACTION(data.id, data.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cscs-processed-logs"] });
            queryClient.invalidateQueries({ queryKey: ["cscs-processing-queue"] });
        },
    });
};

export const useGetCscsFlaggedTransactions = (params?: {
    search?: string;
    register?: string;
    type?: "BUY" | "SELL";
    status?: "PENDING" | "RESOLVED" | "FORCE_COMMITTED";
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}, options?: Omit<UseQueryOptions<FlaggedTransactionsResponse, any, FlaggedTransactionsResponse>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ["cscs-flagged-transactions"],
        queryFn: () => GET_CSCS_FLAGGED_TRANSACTIONS(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useGetCscsFlaggedTransactionHistory = (chn: string, options?: Omit<UseQueryOptions<FlaggedTransaction[], any, FlaggedTransaction[]>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ["cscs-flagged-transactions-history", chn],
        queryFn: () => GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY(chn),
        refetchOnWindowFocus: false,
        ...options,
    });
};