// "use server";
//
// Real API layer for the Certificate Reconciliation submodule (both the CSCS Update and General
// tabs). Left panel = a shareholder's unified transaction history (CSCS trades + bonus + rights +
// IPO, all carried in cscs_transactions). Save Records persists added rows and updates the live
// holder balance. Paths are relative to the /api/v1 baseURL.

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface ReconFlaggedItem {
  id: string;
  batchRef: string;
  chn: string;
  holderName: string | null;
  registerSymbol: string;
  transactionDate: string | null;
  attemptedSell: number | null;
  holdingsAtFlag: number | null;
  shortfall: number | null;
  status: "PENDING" | "RESOLVED";
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface ReconFlaggedListResponse {
  data: ReconFlaggedItem[];
  meta: { page: number; total: number; pendingCount: number; resolvedCount: number };
}

/** One row of a shareholder's unified transaction history (cscs_transactions). */
export interface ShareholderTxn {
  id: string;
  batchRef: string | null;
  transactionDate: string | null;
  chn: string;
  register: string;
  holderName: string | null;
  transferNo: string | null;
  type: string | null; // BUY | SELL
  transStatus: string | null;
  entryMode: string | null; // BONUS | RIGHTS | IPO | MANUAL | CSCS
  units: number | null;
  balanceAfter: number | null;
  processedBy: string | null;
  status: string | null;
}

export interface ReconSaveEntry {
  date: string; // yyyy-MM-dd
  type: string; // BUY | SELL | RIGHTS | BONUS | IPO
  transferNo?: string;
  units: number;
}

/* ─── CSCS Update tab — flagged shortfalls ─────────────────────────────────── */

export const GET_RECON_FLAGGED = async (params?: {
  batchRef?: string;
  register?: string;
  status?: "PENDING" | "RESOLVED";
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const res = await api.get(`/reconciliation/cscs/flagged`, { params });
    return res.data.data as ReconFlaggedListResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const RESOLVE_RECON_FLAGGED = async (id: string, note?: string) => {
  try {
    const res = await api.patch(`/reconciliation/cscs/flagged/${encodeURIComponent(id)}/resolve`, { note });
    return res.data.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Shared — a shareholder's unified transaction history (left panel) ─────── */

export const GET_SHAREHOLDER_TX_HISTORY = async (chn: string, register: string) => {
  try {
    const res = await api.get(`/cscs/shareholder-transaction-history`, { params: { chn, register } });
    return (res.data.data ?? []) as ShareholderTxn[];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Save Records — persist added rows + update holder balance ────────────── */

export const SAVE_RECONCILIATION = async (payload: {
  chn: string;
  register: string;
  flaggedItemId?: string;
  transactions: ReconSaveEntry[];
}) => {
  try {
    const res = await api.post(`/cscs/reconciliation/save`, payload);
    return res.data.data as { chn: string; register: string; savedCount: number; newBalance: number };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
