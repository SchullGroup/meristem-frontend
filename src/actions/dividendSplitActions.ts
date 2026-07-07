import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export interface DividendSplitParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface DividendAccountLookupParams {
  accountNumber: string;
  registerId?: string;
}

export interface EligibleDividendsParams {
  accountNumber: string;
}

export interface SubmitSplit {
  registerId: string;
  sourceAccountNumber: string;
  dividendId: string;
  parts: Array<{
    destinationAccountNumber: string;
    amount: number;
  }>;
  reason: string;
  submittedBy: string;
}

export interface DividendSplit {
  splitId: number;
  warrantNumber: string;
  totalAmount: number;
  parts: number;
  status: string;
  submittedBy: string;
  submittedAt: Date;
  sourceAccount: string;
  holderName: string;
  reason: string;
  partDetails: [
    {
      destinationAccountNumber: string;
      holderName: string;
      amount: number;
    },
  ];
  approvalChain: [
    {
      role: string;
      approverName: string;
      decision: string;
      decidedAt: Date;
    },
  ];
}

export interface BatchRejectSplits {
  ids: string[];
  comment: string;
  authorisedBy: string;
}

export type BatchResponse = ApiResponse<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: [{ id: string; reason: string }];
}>;

export interface EligibleDividend {
  dividendId: number;
  dividendNumber: string;
  warrantNumber: string;
  netAmount: number;
  status: string;
  eligible: boolean;
}

//Submit dividend split request
export const submitDividendSplitRequest = async (data: SubmitSplit) => {
  try {
    const res = await api.post<ApiResponse<DividendSplit>>(
      `/dividend/splits `,
      data,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Reject split
export const rejectSplitRequest = async (
  id: number,
  data: Omit<BatchRejectSplits, "ids">,
) => {
  try {
    const res = await api.post<ApiResponse<DividendSplit>>(
      `/dividend/splits/${id}/reject`,
      data,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Approve split
export const approveSplitRequest = async (
  id: number,
  data: Omit<BatchRejectSplits, "ids">,
) => {
  try {
    const res = await api.post<ApiResponse<DividendSplit>>(
      `/dividend/splits/${id}/approve`,
      data,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Batch reject splits
export const batchRejectSplitsRequest = async (data: BatchRejectSplits) => {
  try {
    const res = await api.post<BatchResponse>(
      `/dividend/splits/batch/reject`,
      data,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Batch approve splits
export const batchApproveSplitsRequest = async (data: BatchRejectSplits) => {
  try {
    const res = await api.post<BatchResponse>(
      `/dividend/splits/batch/approve`,
      data,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Get split details
export const getSplitDetailsRequest = async (id: string) => {
  try {
    const res = await api.get<ApiResponse<DividendSplit>>(
      `/dividend/splits/${id}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// List pending split approvals
export const getPendingSplitApprovals = async (
  params?: DividendSplitParams,
) => {
  try {
    const res = await api.get<PaginatedResponse<DividendSplit>>(
      `/dividend/splits/pending`,
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Get eligible dividends for account
export const getEligibleDividends = async (params: EligibleDividendsParams) => {
  try {
    const res = await api.get<ApiResponse<EligibleDividend[]>>(
      `/dividend/splits/eligible-dividends`,
      {
        params,
      },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Account lookup for split
export const getAccountLookup = async (params: DividendAccountLookupParams) => {
  try {
    const res = await api.get<
      ApiResponse<{
        accountNumber: string;
        holderName: string;
        registerSymbol: string;
        registerId: string;
      }>
    >(`/dividend/splits/account-lookup`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
