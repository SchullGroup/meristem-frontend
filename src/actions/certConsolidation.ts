import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { BatchConsolidationRequestPayload, CertificateConsolidation, ConsolidationRequestParams, SubmitConsolidationRequest } from "@/types/cscs";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";


//List consolidation requests
export const getAllConsolidationRequests = async (params?: ConsolidationRequestParams) => {
    try {
        const response = await api.get<PaginatedResponse<CertificateConsolidation>>(
            `/certificates/consolidate`,
            { params },
        );
        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Submit consolidation request
export const submitConsolidationRequest = async (data: SubmitConsolidationRequest) => {
    try {
        const res = await api.post<ApiResponse<CertificateConsolidation>>(`/certificates/consolidate`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Reject consolidation request
export const rejectConsolidationRequest = async (approvalId: string, data: {
    comment: string,
    authorisedBy: string
}) => {
    try {
        const res = await api.post<ApiResponse<CertificateConsolidation>>(`/certificates/consolidate/${approvalId}/reject`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Approve consolidation request (§8.3)
export const approveConsolidationRequest = async (approvalId: string, data: {
    comment: string,
    authorisedBy: string
}) => {
    try {
        const res = await api.post<ApiResponse<CertificateConsolidation>>(`/certificates/consolidate/${approvalId}/approve`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Batch approve / reject consolidation requests
export const batchApproveOrRejectConsolidationRequest = async (data: BatchConsolidationRequestPayload) => {
    try {
        const res = await api.post<ApiResponse<CertificateConsolidation>>(`/certificates/consolidate/batch-decision`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};
