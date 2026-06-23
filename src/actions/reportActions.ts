import api from "@/services/api";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export interface ReportFilters {
    [key: string]: string | number | boolean | null;
}

export interface RunReportRequest {
    reportCode: string;
    filters: ReportFilters;
    format: string;
    page?: number;
    size?: number;
}

export type RunReportAsyncResponse = ApiResponse<{
    escalatedToAsync: boolean;
    jobId: string;
    reportCode: string;
    estimatedCompletionSeconds: number;
    message: string;
    statusUrl: string;
}>

export type ReportJobStatus = ApiResponse<{
    jobId: string;
    reportCode: string;
    status: string;
    progress: number;
    totalRecords: number;
    processedRecords: number;
    startedAt: string;
    estimatedCompletionAt: string;
    completedAt: string;
    downloadUrl: string;
    errorMessage: string;
}>;

export interface ReportHistoryItem {
    id: string;
    reportCode: string;
    reportName: string;
    generatedAt: string;
    generatedBy: string;
    filters: ReportFilters;
    totalRecords: number;
    format: string;
    downloadUrl: string;
}



export type ReportHistoryResponse = ApiResponse<ContentPaginatedResponse<ReportHistoryItem>>

export interface ReportFilterSchemaField {
    field: string;
    label: string;
    type: string;
    required: boolean;
    optionsUrl?: string;
    options?: string[];
}

export interface ReportColumn {
    key: string;
    label: string;
    type: string;
    align: string;
    sortable: boolean;
    width: number;
}

export interface ReportDefinition {
    code: string;
    name: string;
    description: string;
    category: string;
    availableFormats: string[];
    requiresRegister: boolean;
    sensitiveAccess: boolean;
    filterSchema: ReportFilterSchemaField[];
    columns: ReportColumn[];
}

export interface ReportCategory {
    code: string;
    label: string;
    reports: ReportDefinition[];
}

export type ReportCatalogueResponse = ApiResponse<{ categories: ReportCategory[] }>

export type ReportMetadataResponse = ApiResponse<ReportDefinition>

export type RunReportResponse = ApiResponse<{
    reportCode: string,
    reportName: string,
    generatedAt: string,
    generatedBy: string,
    filters: Record<string, any>,
    totalRecords: number,
    columns: ReportColumn[],
    rows: Record<string, unknown>[],
    summary: Record<string, any>,
    page: number,
    size: number,
    totalPages: number
}>

// Run report (sync)
export const runReport = async (
    payload: RunReportRequest,
) => {
    try {
        const response = await api.post<RunReportResponse>(
            "/reports/run",
            payload,
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//  Run report (async)
export const runReportAsync = async (
    payload: RunReportRequest,
) => {
    try {
        const response = await api.post<
            RunReportAsyncResponse
        >("/reports/run/async", payload);

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Job status
export const getReportJobStatus = async (
    jobId: string,
) => {
    try {
        const response = await api.get<ReportJobStatus>(
            `/reports/jobs/${jobId}`,
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Download job output
export const downloadReportJob = async (
    jobId: string,
) => {
    try {
        const response = await api.get(
            `/reports/jobs/${jobId}/download`,
            {
                responseType: "blob",
            }
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Report history
export const getReportHistory = async (
    params?: { page?: number; size?: number },
) => {
    try {
        const response = await api.get<
            ReportHistoryResponse
        >("/reports/history", {
            params,
        });

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Download from history
export const downloadReportHistory = async (
    historyRef: string,
) => {
    try {
        const response = await api.get(
            `/reports/history/${historyRef}/download`,
            {
                responseType: "blob",
            }
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Get catalogue
export const getReportCatalogue = async () => {
    try {
        const response = await api.get<
            ReportCatalogueResponse
        >("/reports/catalogue");

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Get report metadata
export const getReportMetadata = async (
    reportCode: string,
) => {
    try {
        const response = await api.get<
            ReportMetadataResponse
        >(`/reports/catalogue/${reportCode}`);

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Delete history
export const deleteReportHistory = async (
    historyRef: string,
) => {
    try {
        const response = await api.delete(
            `/reports/history/${historyRef}`,
        );

        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};