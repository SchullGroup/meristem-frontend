// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import {
  FlaggedTransaction,
  Holder,
  ProcessedFile,
  ProcessedLogsResponse,
  ProcessingQueueResponse,
  ReconciliationFlaggedTransaction,
  ReconciliationResponse,
  ProcessedTransaction,
  TransactionBatch
} from "@/types/cscs";
import { ContentPaginatedResponse, PaginatedResponse } from "@/types";

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
    const res = await api.get<ProcessedLogsResponse>(`/cscs/processed-log`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const INJECT_CSCS_ZIP_FILE = async (data: FormData) => {
  try {
    const res = await api.post<string>(`/cscs-ingestion/upload`, data, {
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

export const RESOLVE_CSCS_FLAGGED_TRANSACTION = async (
  id: string,
  data: {
    resolvedBy: string;
    resolutionNote: string;
  },
) => {
  try {
    const res = await api.patch<FlaggedTransaction>(
      `/cscs/flagged-transactions/${id}/resolve`,
      data,
    );
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
    const res = await api.get<ProcessingQueueResponse>(
      `/cscs/processing-queue`,
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_CSCS_TRANSACTION_LOG_BATCHES = async (params?: {
  batchRef?: string;
  register?: string;
  status?: "COMPLETE" | "PARTIAL";
  dateFilter?: "TODAY" | "THIS_WEEK" | "THIS_MONTH";
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<PaginatedResponse<TransactionBatch>>(
      `/cscs/trans-log-batches`,
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_CSCS_FLAGGED_TRANSACTIONS = async (params?: {
  search?: string;
  register?: string;
  status?: "PENDING" | "RESOLVED";
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<PaginatedResponse<FlaggedTransaction>>(
      `/cscs/filter-search-flagged-transactions`,
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_CSCS_FLAGGED_TRANSACTIONS_HISTORY = async (chn: string) => {
  try {
    const res = await api.get<FlaggedTransaction[]>(
      `/cscs/flagged-transactions/history/${chn}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const UPDATE_CSCS_TRANSACTION = async (
  id: string,
  data: Omit<ProcessedTransaction, "id">,
) => {
  try {
    const res = await api.patch<ProcessedTransaction>(`/cscs/${id}`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_HOLDERS = async (params?: {
  name?: string;
  email?: string;
  chn?: string;
  registerId?: string;
  page?: number; // 0 indexed
  size?: number;
}) => {
  try {
    const res = await api.get<ContentPaginatedResponse<Holder>>(`/holders`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const UPDATE_HOLDER_STATES = async (data: {
  updates: {
    id: string;
    state: string;
  }[];
}) => {
  try {
    const res = await api.patch<unknown>(`/holders/states`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const LOOKUP_HOLDER_STATES = async (
  data: Array<{
    chn: string;
    address: string;
  }>,
) => {
  try {
    const res = await api.post<
      Array<{
        chn: string;
        address: string;
      }>
    >(`/holders/lookup-states`, data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// reconciliation

export const GET_CSCS_RECONCILIATIONS = async (params: {
  register: string;
  from?: string;
  to?: string;
  chn?: string;
  page?: number; // 0 indexed
  size?: number;
}) => {
  try {
    const res = await api.get<ReconciliationResponse>(`/cscs-reconciliation`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_CSCS_RECONCILIATION_FLAGGED_TRANSACTIONS = async (params?: {
  search?: string;
  register?: string;
  startDate?: string;
  endDate?: string;
  status?: "PENDING" | "RESOLVED";
  page?: number; // 0 indexed
  size?: number;
}) => {
  try {
    const res = await api.get<
      PaginatedResponse<ReconciliationFlaggedTransaction>
    >(`/cscs-reconciliation/reconcile-flagged-transactions`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
