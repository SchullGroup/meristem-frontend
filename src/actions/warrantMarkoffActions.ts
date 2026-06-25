import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export interface WarrantMarkOffParams {
    registerId: string;
    dateFrom: string;
    dateTo: string;
    page?: number; // 0 indexed
    size?: number;
    status?: string;
}

export interface WarrantMarkOff {
    id: number;
    declarationId: number;
    paymentNumber: string;
    registerSymbol: string;
    registerId: string;
    shareholderId: string;
    accountNumber: string;
    holderName: string;
    chn: string;
    unitsHeld: number;
    warrantNumber: string;
    grossAmount: number;
    whtAmount: number;
    netAmount: number;
    bankName: string;
    bankAccount: string;
    sortCode: string;
    status: string;
    paymentDate: string;
    failReason: string;
}

export interface WarrantStatusResponse {
    id: number;
    markOffRef: string;
    submittedDate: string;
    warrantNumber: string;
    accountNumber: string;
    holderName: string;
    dividendNumber: string;
    amount: number;
    submittedBy: string;
    currentTier: string;
    status: string
}

export interface ManualMarkoffRequest {
    warrantNumber: string;
    reason: string;
    submittedBy: string
}

export interface BulkWarrantMarkoffRequest {
    warrantIds: [
        string
    ],
    reason: string;
    submittedBy: string
}

export interface BatchRequest {
    ids: [
        string
    ],
    comment: string;
    authorisedBy: string
}

export interface BatchResponse {
    processed: number;
    succeeded: number;
    failed: number;
    errors: [
        {
            id: string;
            reason: string
        }
    ]
}

//Reject mark-off
export const rejectWarrantMarkoff = async (id: number, data: {
    comment: string;
    authorisedBy: string;
}) => {
    try {
        const res = await api.post<ApiResponse<WarrantStatusResponse>>(`/dividend/warrant-markoff/${id}/reject`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Approve mark-off — advances to next tier

export const approveWarrantMarkoff = async (id: number, data: {
    comment: string;
    authorisedBy: string;
}) => {
    try {
        const res = await api.post<ApiResponse<WarrantStatusResponse>>(`/dividend/warrant-markoff/${id}/approve`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

//Submit manual mark-off
export const submitManualWarrantMarkoff = async (data: ManualMarkoffRequest) => {
    try {
        const res = await api.post<ApiResponse<WarrantStatusResponse>>(`/dividend/warrant-markoff/manual`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Load unpaid warrants for en-bloc mark-off
export const getUnpaidWarrantMarkoff = async (params: WarrantMarkOffParams) => {
    try {
        const res = await api.get<PaginatedResponse<WarrantMarkOff>>(`/dividend/warrant-markoff/en-bloc`, { params });
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Submit en-bloc mark-off
export const submitBulkWarrantMarkoff = async (data: BulkWarrantMarkoffRequest) => {
    try {
        const res = await api.post<ApiResponse<WarrantStatusResponse>>(`/dividend/warrant-markoff/en-bloc`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


// Batch reject mark-offs
export const batchRejectWarrantMarkoff = async (data: BatchRequest) => {
    try {
        const res = await api.post<ApiResponse<BatchResponse>>(`/dividend/warrant-markoff/batch/reject`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


//Batch approve mark-offs
export const batchApproveWarrantMarkoff = async (data: BatchRequest) => {
    try {
        const res = await api.post<ApiResponse<BatchResponse>>(`/dividend/warrant-markoff/batch/approve`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};



// Search warrant for mark-off
export const getWarrantSearch = async (params: {
    q: string;
    registerId?: string;
}) => {
    try {
        const res = await api.get<ApiResponse<WarrantMarkOff>>(`/dividend/warrant-markoff/search`, { params });
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


// List pending mark-off approvals
export const getPendingMarkOffApprovals = async (params: {
    page?: number;
    size?: number;
}) => {
    try {
        const res = await api.get<PaginatedResponse<WarrantStatusResponse>>(`/dividend/warrant-markoff/pending`, { params });
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};


// Mark-off history
export const getMarkOffHistory = async (params: Partial<WarrantMarkOffParams>) => {
    try {
        const res = await api.get<PaginatedResponse<WarrantStatusResponse>>(`/dividend/warrant-markoff/history`, { params });
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};
