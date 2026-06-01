// "use server"

import api from "@/services/api";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import {
  ApplicationOfferResponse,
  ApplicationOfferSummaryResponse,
  BatchSummaryResponse,
  FullSubscriptionListResponse,
  IPO,
  IPOBatchType,
  IPOSubscriber,
  LodgementResponse,
  PendingApprovalParams,
  RangeAnalysisResponse,
  StateSummaryResponse,
} from "@/types/ipo";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// GET PENDING APPROVALS
export const getIPOPendingApprovals = async (
  params?: PendingApprovalParams,
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<IPO>>(
      `/ipo/batches/pending-approval`,
      { params },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ICU APPROVALS
export const getIPOICUApprovals = async (params?: PendingApprovalParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<IPO>>(
      `/ipo/batches/icu-approval`,
      { params },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPLOAD BATCH
export const uploadBatchIpo = async (payload: FormData) => {
  try {
    const response = await api.post<IPO>("/ipo/batches/upload", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// APPROVE IPO BATCH
export const opsApproveIpo = async (
  batchRef: string,
  payload: {
    approvedBy: string;
    comment?: string;
  },
) => {
  try {
    const response = await api.patch<ApiResponse<IPO>>(
      `/ipo/batches/${batchRef}/ops-approve`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// REJECT IPO BATCH
export const opsRejectIpo = async (
  batchRef: string,
  payload: {
    comment: string;
    rejectedBy: string;
  },
) => {
  try {
    const response = await api.patch<ApiResponse<IPO>>(
      `/ipo/batches/${batchRef}/ops-reject`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// REJECTED IPO BATCH
export const getRejectedOpsBatches = async (params?: PendingApprovalParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<IPO>>(
      `/ipo/batches/ops-rejected`,
      { params },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// REVIEW IPO AS ICU
export const icuReviewIpo = async (
  batchRef: string,
  payload: {
    approved: boolean;
    comment: string;
    reviewedBy: string;
  },
) => {
  try {
    const response = await api.patch<ApiResponse<IPO>>(
      `/ipo/batches/${batchRef}/icu-review`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET IPO BATCH
export const getIpoBatch = async (batchRef?: string) => {
  try {
    const response = await api.get<IPO>(`/ipo/batches/${batchRef}`);
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET SUBSCRIBERS BY BATCH
export const getIpoBatchSubscribers = async (params: {
  batchRef: string;
  type?: IPOBatchType;
  page?: number;
  size?: number;
}) => {
  const { batchRef, ...rest } = params;
  try {
    const response = await api.get<ContentPaginatedResponse<IPOSubscriber>>(
      `/ipo/batches/${batchRef}/subscribers`,
      { params: rest },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// EXPORT BATCH TO SHEET
export const exportIpoBatch = async (batchRef: string, type: IPOBatchType) => {
  try {
    const response = await api.get<string>(
      `/ipo/batches/${batchRef}/export/${type}`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoBatchLogdement = async (params: {
  batchRef: string;
  limit?: number;
}) => {
  try {
    const response = await api.get<LodgementResponse>(
      `/ipo/batches/${params?.batchRef}/lodgment`,
      {
        params: { limit: params?.limit },
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadIpoBatchLogdement = async (params: {
  batchRef: string;
  format: "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";
}) => {
  try {
    const response = await api.get<string>(
      `/ipo/batches/${params?.batchRef}/lodgment/download`,
      {
        params: { format: params?.format },
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ALL IPO BATCHES LODGMENT
export const getIpoBatchesLodgment = async (params?: PendingApprovalParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<IPO>>(
      `/ipo/batches/lodgment`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// APPROVE LODGEMENT
export const approveLodgment = async (
  batchRef: string,
  payload: {
    comment: string;
    lodgedBy: string;
  },
) => {
  try {
    const response = await api.patch<ApiResponse<IPO>>(
      `/ipo/batches/${batchRef}/icu-lodged`,
      payload,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// reports endpoints

export const getBatchSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<BatchSummaryResponse>(
      `/ipo/reports/summary-batch-report`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportBatchSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/summary-batch-report/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getStateSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<StateSummaryResponse>(
      `/ipo/reports/state-summary`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportStateSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/state-summary/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRangeAnalysisReport = async (register?: string) => {
  try {
    const response = await api.get<RangeAnalysisResponse>(
      `/ipo/reports/range-analysis`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportRangeAnalysisReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/range-analysis/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getFullSubscriptionListReport = async (params: {
  register?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const response = await api.get<FullSubscriptionListResponse>(
      `/ipo/reports/full-subscription-list`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportFullSubscriptionListReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/full-subscription-list/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getApplicationOfferReport = async (params: {
  register?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const response = await api.get<ApplicationOfferResponse>(
      `/ipo/reports/application-offer`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportApplicationOfferReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/application-offer/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getApplicationOfferSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<ApplicationOfferSummaryResponse>(
      `/ipo/reports/application-offer-summary`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportApplicationOfferSummaryReport = async (
  register?: string,
) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/application-offer-summary/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
