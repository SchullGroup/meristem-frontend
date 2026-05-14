// "use server"

import api from "@/services/api";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import {
  IPO,
  IPOBatchType,
  IPOSubscriber,
  PendingApprovalParams,
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
