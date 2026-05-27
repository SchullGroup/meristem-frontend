import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { SubmitTransferRequest, TransferRequest, TransferRequestParams } from "@/types/cscs";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";


//List transfer requests
export const getAllTransferRequests = async (params?: TransferRequestParams) => {
    try {
        const response = await api.get<PaginatedResponse<TransferRequest>>(
            `/certificates/transfer`,
            { params },
        );
        return response.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Submit transfer request 
export const submitTransferRequest = async (data: SubmitTransferRequest) => {
    try {
        const res = await api.post<ApiResponse<TransferRequest>>(`/certificates/transfer`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Reject transfer request
export const rejectTransferRequest = async (approvalId: string, data: {
    comment: string,
    authorisedBy: string
}) => {
    try {
        const res = await api.post<ApiResponse<TransferRequest>>(`/certificates/transfer/${approvalId}/reject`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Approve transfer request 
export const approveTransferRequest = async (approvalId: string, data: {
    comment: string,
    authorisedBy: string
}) => {
    try {
        const res = await api.post<ApiResponse<TransferRequest>>(`/certificates/transfer/${approvalId}/reject`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Batch approve / reject transfer requests
export const batchApproveOrRejectTransferRequest = async (data: {
    approveIds: string[],
    rejectIds: string[],
    rejectComment: string,
    authorisedBy: string
}) => {
    try {
        const res = await api.post<ApiResponse<{
            approved: number,
            rejected: number,
            errors: string[]
        }>>(`/certificates/transfer/batch-decision`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


