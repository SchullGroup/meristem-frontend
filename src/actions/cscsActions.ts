// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import { FlaggedTransaction, FlaggedTransactionsResponse, ProcessedFile, ProcessedLogsResponse, ProcessingQueueResponse } from "@/types/cscs";

export const GET_CSCS_PROCESSED_LOGS = async (params?: {
  search?: string;
  register?: string;
  type?: "BUY" | "SELL";
  status?: "PENDING" | "RESOLVED" | "FORCE_COMMITTED";
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<ProcessedLogsResponse>(`/cscs/processed-log`, { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};


export const UPLOAD_CSCS_FILE = async (data: FormData) => {
  try {
    const res = await api.post<ProcessedFile[]>(`/cscs/upload`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};


export const RESOLVE_CSCS_FLAGGED_TRANSACTION = async (id: string, data: {
  resolvedBy: string;
  resolutionNote: string;
}) => {
  try {
    const res = await api.patch<FlaggedTransaction>(`/cscs/flagged-transactions/${id}/resolve`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};


export const GET_CSCS_PROCESSING_QUEUE = async (params?: {
  search?: string;
  register?: string;
  status?: "PARTIAL" | "COMPLETE";
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<ProcessingQueueResponse>(`/cscs/processing-queue`, { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};



export const GET_CSCS_FLAGGED_TRANSACTIONS = async (params?: {
  search?: string;
  register?: string;
  type?: "BUY" | "SELL";
  status?: "PENDING" | "RESOLVED" | "FORCE_COMMITTED";
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<FlaggedTransactionsResponse>(`/cscs/flagged-transactions`, { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};



export const GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY = async (chn: string) => {
  try {
    const res = await api.get<FlaggedTransaction[]>(`/cscs/flagged-transactions/history/${chn}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};