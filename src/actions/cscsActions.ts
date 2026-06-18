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
  TransactionBatch,
  CscsInjectJob,
  CscsPosition,
  CscsInjectStatus,
} from "@/types/cscs";
import { ApiResponse, ContentPaginatedResponse, PaginatedResponse } from "@/types";

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

export const INJECT_CSCS_ZIP_FILE = async (data: FormData): Promise<CscsInjectJob> => {
  try {
    const res = await api.post<CscsInjectJob>(`/cscs-ingestion/upload`, data, {
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

export const GET_CSCS_INJECT_STATUS = async (batchRef: string): Promise<CscsInjectStatus> => {
  try {
    const res = await api.get<CscsInjectStatus>(`/cscs-ingestion/status/${batchRef}`);
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
  data: Partial<ProcessedTransaction>,
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
  startDate?: string;
  endDate?: string;
  chn?: string;
  page?: number; // 0 indexed
  size?: number;
}) => {
  try {
    const res = await api.get<ReconciliationResponse>(`/cscs-reconciliation`, {
      params,
    });
    return res.data?.data;
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


export const GET_CSCS_SHAREHOLDER_TRANSACTIONS = async (params?: {
  chn?: string;
  register?: string;
}) => {
  try {
    const res = await api.get<
      ApiResponse<unknown>
    >(`/cscs/shareholder-transaction`, {
      params,
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const UPLOAD_CSCS_HISTORY = async (register: string, data: FormData) => {
  try {
    const res = await api.post<ApiResponse<CscsPosition[]>>(`/cscs/cscs-transaction-history`, data, {
      params: {
        register
      },
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
