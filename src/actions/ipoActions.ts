// "use server"

import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import { IPO } from "@/types/ipo";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// GET ALL DOCUMENT TYPES
export const getIpoRegisters = async () => {
  try {
    const response = await api.get<ApiResponse<string[]>>("/ipo/registers");

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET DOCUMENT TYPE BY CODE
export const getIPOPendingApprovals = async () => {
  try {
    const response = await api.get<PaginatedResponse<IPO>>(
      `/ipo/batches/pending-approval`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//
export const getIPOICUApprovals = async () => {
  try {
    const response = await api.get<PaginatedResponse<IPO>>(
      `/ipo/batches/icu-approval`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// CREATE DOCUMENT TYPE
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

// UPDATE DOCUMENT TYPE
export const opsApproveIpo = async (
  batchRef: string,
  payload: {
    approvedBy: string;
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
