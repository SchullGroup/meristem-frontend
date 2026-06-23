import { deleteReportHistory, downloadReportHistory, downloadReportJob, getReportCatalogue, getReportHistory, getReportJobStatus, getReportMetadata, ReportCatalogueResponse, ReportHistoryResponse, ReportJobStatus, ReportMetadataResponse, runReport, runReportAsync, RunReportAsyncResponse, RunReportRequest, RunReportResponse } from "@/actions/reportActions";
import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";


//Run report async
export const useRunReportAsync = (
    options?: Omit<
        UseMutationOptions<
            RunReportAsyncResponse,
            Error,
            RunReportRequest
        >,
        "mutationKey" | "mutationFn"
    >,
) => {
    return useMutation({
        mutationFn: runReportAsync,
        ...options,
    });
};

//Run report sync
export const useRunReport = (
    options?: Omit<
        UseMutationOptions<RunReportResponse, Error, RunReportRequest>,
        "mutationKey" | "mutationFn"
    >,
) => {
    return useMutation({
        mutationFn: runReport,
        ...options,
    });
};

//Job status (polling-ready)
export const useGetReportJobStatus = (
    jobId: string,
    options?: Omit<
        UseQueryOptions<
            ReportJobStatus,
            Error,
            ReportJobStatus
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["report-job-status", jobId],
        queryFn: () => getReportJobStatus(jobId),
        enabled: !!jobId,
        refetchInterval: (query) =>
            query.state.data?.data.status === "COMPLETED" ||
                query.state.data?.data.status === "FAILED"
                ? false
                : 3000,
        refetchOnWindowFocus: false,
        ...options,
    });
};

//Report catalogue
export const useGetReportCatalogue = (
    options?: Omit<
        UseQueryOptions<
            ReportCatalogueResponse,
            Error,
            ReportCatalogueResponse
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["report-catalogue"],
        queryFn: getReportCatalogue,
        refetchOnWindowFocus: false,
        ...options,
    });
};

//Report metadata
export const useGetReportMetadata = (
    reportCode: string,
    options?: Omit<
        UseQueryOptions<
            ReportMetadataResponse,
            Error,
            ReportMetadataResponse
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["report-metadata", reportCode],
        queryFn: () => getReportMetadata(reportCode),
        enabled: !!reportCode,
        refetchOnWindowFocus: false,
        ...options,
    });
};

//Report history
export const useGetReportHistory = (
    params?: { page?: number; size?: number },
    options?: Omit<
        UseQueryOptions<
            ReportHistoryResponse,
            Error,
            ReportHistoryResponse
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["report-history", params],
        queryFn: () => getReportHistory(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

//Delete history
export const useDeleteReportHistory = (
    options?: Omit<
        UseMutationOptions<any, Error, string>,
        "mutationKey" | "mutationFn"
    >,
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteReportHistory,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["report-history"],
            });
        },
        ...options,
    });
};

export const useDownloadReportJob = (
    options?: Omit<
        UseMutationOptions<any, Error, string>,
        "mutationKey" | "mutationFn"
    >,
) => {
    return useMutation({
        mutationFn: downloadReportJob,
        ...options,
    });
};
export const useDownloadReportHistory = (
    options?: Omit<
        UseMutationOptions<any, Error, string>,
        "mutationKey" | "mutationFn"
    >,
) => {
    return useMutation({
        mutationFn: downloadReportHistory,
        ...options,
    });
};