// "use server";
//
// Real API layer for the Certificate Management → CSCS Updates pipeline. These call the
// `cscspipeline` backend (base path /api/v1/cscs/batches — the axios baseURL already carries
// /api/v1, so paths here start at /cscs/…). Every endpoint returns the standard ApiResponse
// envelope; these helpers unwrap to `.data.data` (the DTO payload) unless noted.

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

/* ─── Types (mirror cscspipeline DTOs) ──────────────────────────────────── */

export type CscsBatchStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "PROCESSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export interface CscsBatchListItem {
  id: string;
  batchRef: string;
  status: CscsBatchStatus;
  uploadedBy: string | null;
  uploadedAt: string | null;
  processedBy: string | null;
  processedAt: string | null;
  registerCount: number;
  totalKyc: number;
  totalTx: number;
  flaggedCount: number;
}

export interface CscsBatchListResponse {
  data: CscsBatchListItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CscsBatchDetail {
  id: string;
  batchRef: string;
  status: CscsBatchStatus;
  uploadedBy: string | null;
  uploadedAt: string | null;
  processedBy: string | null;
  processedAt: string | null;
  statesCommitted: boolean;
  balancesApplied: boolean;
  registers: { symbol: string; name: string; kycRecords: number; transactions: number }[];
}

export interface CscsRegisterStat {
  symbol: string;
  name: string;
  kycRecords: number;
  missingStates: number;
  transactions: number;
  buys: number;
  sells: number;
  flagged: number;
}

export interface CscsRegistersResponse {
  batchRef: string;
  registers: CscsRegisterStat[];
  totals: {
    kycRecords: number;
    missingStates: number;
    transactions: number;
    buys: number;
    sells: number;
    flagged: number;
  };
}

export type CscsStateSource = "FILE" | "GIS" | "MANUAL";

export interface CscsHolderItem {
  id: string;
  register: string;
  chn: string;
  name: string;
  address: string | null;
  fileState: string | null;
  gisState: string | null;
  resolvedState: string | null;
  stateSource: CscsStateSource | null;
  isConfirmed: boolean;
}

export interface CscsHolderListResponse {
  data: CscsHolderItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    missingCount: number;
    confirmedCount: number;
  };
}

export interface CscsBankChangeItem {
  id: string;
  chn: string;
  holderName: string;
  register: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  kycStatus: string;
  kycRequestId: number | null;
  failureReason: string | null;
}

export interface CscsBankChangeListResponse {
  total: number;
  holderCount: number;
  data: CscsBankChangeItem[];
}

export interface CscsTradeBalanceItem {
  id: string;
  register: string;
  chn: string;
  shareholderName: string;
  originalUnits: number;
  totalBuys: number;
  totalSells: number;
  balanceAfter: number;
  status: "BALANCED" | "FLAGGED" | "MULTI_ACCOUNT";
}

export interface CscsTradeBalanceListResponse {
  summary: { total: number; balanced: number; flagged: number; multiAccount?: number; applied?: boolean };
  data: CscsTradeBalanceItem[];
}

export interface CscsTradeBalanceApplyResponse {
  appliedCount: number;
  flaggedCount: number;
  logEntriesWritten: number;
  multiAccountCount?: number;
}

export interface CscsBatchSummary {
  batchRef: string;
  status: string;
  registersProcessed: number;
  holdersUpdated: number;
  stateUpdates: number;
  balancesApplied: number;
  transactionsLogged: number;
  flaggedForRecon: number;
  bankChangeKycRaised: number;
  multiAccountFlagged?: number;
  reconciliationUrl: string | null;
}

export interface CscsProcessedLogEntry {
  id: string;
  date: string | null;
  batchRef: string;
  chn: string;
  register: string;
  holder: string;
  transferNo: string | null;
  type: "BUY" | "SELL";
  units: number;
  balanceAfter: number;
  processedBy: string | null;
}

export interface CscsProcessedLogResponse {
  totals: { buys: number; sells: number };
  data: CscsProcessedLogEntry[];
  meta: { page: number; pageSize: number; total: number };
}

/* ─── Step 0: batch list / upload / process / detail ────────────────────── */

export const GET_CSCS_BATCHES = async (params?: {
  status?: CscsBatchStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const res = await api.get(`/cscs/batches`, { params });
    return res.data.data as CscsBatchListResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const UPLOAD_CSCS_BATCH = async (file: File) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/cscs/batches/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data as { id: string; batchRef: string; status: CscsBatchStatus };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const PROCESS_CSCS_BATCH = async (batchRef: string) => {
  try {
    const res = await api.post(`/cscs/batches/${encodeURIComponent(batchRef)}/process`);
    return res.data.data as { batchRef: string; status: string; jobId: string | null };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_CSCS_BATCH = async (batchRef: string) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}`);
    return res.data.data as CscsBatchDetail;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Step 1: per-register stats ────────────────────────────────────────── */

export const GET_CSCS_BATCH_REGISTERS = async (batchRef: string) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}/registers`);
    return res.data.data as CscsRegistersResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Step 2: holder state resolution ───────────────────────────────────── */

export const GET_CSCS_BATCH_HOLDERS = async (
  batchRef: string,
  params?: { register?: string; stateFilter?: "ALL" | "MISSING" | "CONFIRMED"; page?: number; pageSize?: number },
) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}/holders`, { params });
    return res.data.data as CscsHolderListResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const UPDATE_CSCS_HOLDER_STATE = async (
  batchRef: string,
  chn: string,
  payload: { register: string; resolvedState: string; source: CscsStateSource },
) => {
  try {
    const res = await api.patch(
      `/cscs/batches/${encodeURIComponent(batchRef)}/holders/${encodeURIComponent(chn)}/state`,
      payload,
    );
    return res.data.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const ACCEPT_CSCS_GIS_STATES = async (batchRef: string) => {
  try {
    const res = await api.post(`/cscs/batches/${encodeURIComponent(batchRef)}/states/accept-gis`);
    return res.data.data as { updatedCount: number };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const COMMIT_CSCS_STATES = async (batchRef: string) => {
  try {
    const res = await api.post(`/cscs/batches/${encodeURIComponent(batchRef)}/states/commit`);
    return res.data.data as { committedCount: number; step: string };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Step 3: bank changes ──────────────────────────────────────────────── */

export const GET_CSCS_BANK_CHANGES = async (batchRef: string) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}/bank-changes`);
    return res.data.data as CscsBankChangeListResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Step 4: trade balances ────────────────────────────────────────────── */

export const GET_CSCS_TRADE_BALANCES = async (
  batchRef: string,
  params?: { register?: string; status?: string },
) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}/trade-balances`, { params });
    return res.data.data as CscsTradeBalanceListResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const APPLY_CSCS_TRADE_BALANCES = async (batchRef: string) => {
  try {
    const res = await api.post(`/cscs/batches/${encodeURIComponent(batchRef)}/trade-balances/apply`);
    return res.data.data as CscsTradeBalanceApplyResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Step 5: finalize / summary / processed log ────────────────────────── */

export const FINALIZE_CSCS_BATCH = async (batchRef: string) => {
  try {
    const res = await api.post(`/cscs/batches/${encodeURIComponent(batchRef)}/apply`);
    return res.data.data as {
      batchRef: string;
      status: string;
      processedBy: string | null;
      processedAt: string | null;
    };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_CSCS_BATCH_SUMMARY = async (batchRef: string) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}/summary`);
    return res.data.data as CscsBatchSummary;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_CSCS_PROCESSED_LOG = async (
  batchRef: string,
  params?: { register?: string; type?: string; q?: string; page?: number; pageSize?: number },
) => {
  try {
    const res = await api.get(`/cscs/batches/${encodeURIComponent(batchRef)}/processed-log`, { params });
    return res.data.data as CscsProcessedLogResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
