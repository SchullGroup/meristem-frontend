import api from "@/services/api";
import { ApiResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export interface ConsolidationAccount {
    accountNumber: string;
    holderName: string;
    holdings: number;
}

export interface DestinationAccount {
    accountNumber: string;
    holderName: string;
}

export interface Consolidation {
    id: number;
    registerId: string;
    sourceAccounts: ConsolidationAccount[];
    destinationAccount: DestinationAccount;
    totalHoldings: number;
    comment: string;
    status: string;
    initiatorId: string;
    initiatorName: string;
    authorisedBy: string;
    rejectionComment: string;
    createdAt: string;
    decidedAt: string;
}

export interface CreateConsolidationRequest {
    registerId: string;
    sourceAccountIds: string[];
    destinationAccountId: string;
    comment: string;
    initiatedBy: string;
}

export interface ConsolidationDecisionRequest {
    comment: string;
    authorisedBy: string;
}

export interface BatchConsolidationRequest {
    ids: string[];
    comment: string;
    authorisedBy: string;
}

export interface BatchConsolidationResponse {
    authorised: number;
    rejected: number;
    skipped: number;
    details: Consolidation[];
}

export interface ConsolidationFilters {
    status?: string;
    registerId?: string;
    initiatorId?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    pageSize?: number;
}

export interface ConsolidationListResponse {
    data: Consolidation[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface BulkUploadError {
    row: number;
    accountNumber: string;
    field: string;
    message: string;
}

export interface ConsolidationUploadJob {
    jobId: string;
    status: string;
    totalRows: number;
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
    errors: BulkUploadError[];
    createdAt: string;
    completedAt: string;
}

export const createConsolidation = async (
    data: CreateConsolidationRequest,
) => {
    try {
        const res = await api.post<ApiResponse<Consolidation>>(
            "/consolidations",
            data,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const getConsolidations = async (
    params?: ConsolidationFilters,
) => {
    try {
        const res = await api.get<
            ApiResponse<ConsolidationListResponse>
        >("/consolidations", {
            params,
        });

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const getConsolidation = async (
    id: number,
) => {
    try {
        const res = await api.get<ApiResponse<Consolidation>>(
            `/consolidations/${id}`,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const authoriseConsolidation = async (
    id: number,
    data: ConsolidationDecisionRequest,
) => {
    try {
        const res = await api.put<ApiResponse<Consolidation>>(
            `/consolidations/${id}/authorise`,
            data,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const rejectConsolidation = async (
    id: number,
    data: ConsolidationDecisionRequest,
) => {
    try {
        const res = await api.put<ApiResponse<Consolidation>>(
            `/consolidations/${id}/reject`,
            data,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const batchAuthoriseConsolidations = async (
    data: BatchConsolidationRequest,
) => {
    try {
        const res = await api.post<
            ApiResponse<BatchConsolidationResponse>
        >(
            "/consolidations/batch-authorise",
            data,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const batchRejectConsolidations = async (
    data: BatchConsolidationRequest,
) => {
    try {
        const res = await api.post<
            ApiResponse<BatchConsolidationResponse>
        >(
            "/consolidations/batch-reject",
            data,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const uploadConsolidations = async (
    registerId: string,
    file: File,
) => {
    try {
        const formData = new FormData();

        formData.append("file", file);

        const res = await api.post<
            ApiResponse<ConsolidationUploadJob>
        >(
            `/consolidations/bulk-upload?registerId=${registerId}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const getConsolidationUploadJob = async (
    jobId: string,
) => {
    try {
        const res = await api.get<
            ApiResponse<ConsolidationUploadJob>
        >(
            `/consolidations/bulk-upload/${jobId}`,
        );

        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};