import api from "@/services/api";
import { ApiResponse, ContentPaginatedResponse, PaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";


export interface SubmitSplit {
    registerId: string,
    sourceAccountNumber: string,
    dividendId: string,
    parts: [
        {
            destinationAccountNumber: string,
            amount: number
        },
        {
            destinationAccountNumber: string,
            amount: 0.01
        }
    ],
    reason: string,
    submittedBy: string
}

export interface DividendSplit {
    splitId: number,
    warrantNumber: string,
    totalAmount: number,
    parts: number,
    status: string,
    submittedBy: string,
    submittedAt: Date,
    sourceAccount: string,
    holderName: string,
    reason: string,
    partDetails: [
        {
            destinationAccountNumber: string,
            holderName: string,
            amount: number
        }
    ],
    approvalChain: [
        {
            role: string,
            approverName: string,
            decision: string,
            decidedAt: Date
        }
    ]
}

export interface BatchRejectSplits {
    ids: string[],
    comment: string,
    authorisedBy: string
}

//Submit dividend split request
export const submitDividendSplitRequest = async (data: SubmitSplit) => {
    try {
        const res = await api.post<ApiResponse<DividendSplit>>(`/dividend/splits `, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};





// Reject split
export const rejectSplitRequest = async (id: string) => {
    try {
        const res = await api.post<ApiResponse<DividendSplit>>(`/dividend/splits/${id}/reject`);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};



// Approve split
export const approveSplitRequest = async (id: string) => {
    try {
        const res = await api.post<ApiResponse<DividendSplit>>(`/dividend/splits/${id}/approve`);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};



// Batch reject splits
export const batchRejectSplitsRequest = async (data: BatchRejectSplits) => {
    try {
        const res = await api.post<ApiResponse<{
            processed: number,
            succeeded: number,
            failed: number,
            errors: [
                {
                    id: string,
                    reason: string
                }
            ]
        }>>(`/dividend/splits/batch/reject`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};



// Batch approve splits
export const batchApproveSplitsRequest = async (data: BatchRejectSplits) => {
    try {
        const res = await api.post<ApiResponse<{
            processed: number,
            succeeded: number,
            failed: number,
            errors: [
                {
                    id: string,
                    reason: string
                }
            ]
        }>>(`/dividend/splits/batch/approve`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};



// Get split details
export const getSplitDetailsRequest = async (id: string) => {
    try {
        const res = await api.get<ApiResponse<DividendSplit>>(`/dividend/splits/${id}`);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};




// List pending split approvals
// List pending split approvals



// GET
//     / api / v1 / dividend / splits / eligible - dividends
// Get eligible dividends for account



// GET
//     / api / v1 / dividend / splits / account - lookup
// Account lookup for split