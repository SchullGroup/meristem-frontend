import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { BatchConsolidationRequestPayload, CertificateConsolidation, ConsolidationRequestParams, SubmitConsolidationRequest } from "@/types/cscs";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// A system-suggested certificate-consolidation candidate (mirrors the backend
// CertConsolidationSuggestionDTO): one shareholder (by CHN) with 2+ accounts in a register,
// each account carrying the PII an officer needs to confirm identity before consolidating.
export interface CertConsolidationSuggestion {
  id: string; // the CHN — groups the shareholder's accounts
  holderName: string;
  bvn: string | null;
  register: string; // register symbol
  registerName: string;
  accounts: {
    holderId: string; // Holder UUID — used as the source/destination account id on submit
    accountNo: string;
    chn: string;
    name?: string | null;
    address?: string | null;
    bvn?: string | null;
    nin?: string | null;
    phone?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
    certCount: number;
    totalUnits: number;
  }[];
  combinedUnits: number;
}


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


// System-suggested certificate-consolidation candidates for a register (read-only discovery):
// shareholders holding 2+ accounts in the register, with per-account certificate counts + units.
export const getCertConsolidationSuggestions = async (
    registerId: string,
    page = 0,
    size = 50,
) => {
    try {
        const res = await api.get<ApiResponse<CertConsolidationSuggestion[]>>(
            `/certificates/consolidate/suggestions`,
            { params: { registerId, page, size } },
        );
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};
