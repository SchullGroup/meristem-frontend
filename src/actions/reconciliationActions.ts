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

/* ─── Holder certificate ledger (left panel) — grouped by account ──────────── */

export interface HolderCertificate {
  id: string;
  certNumber: string | null;
  type: "BUY" | "SELL";
  units: number; // signed (+/−) ledger units
  status: string | null;
  issueDate: string | null;
  transferNo: string | null;
  notes: string | null;
}

export interface HolderAccountPanel {
  accountNo: string;
  chn: string | null;
  holderName: string | null;
  holderId: string | null;
  totalUnits: number;
  primary: boolean;
  certificates: HolderCertificate[];
}

export interface HolderCertificatesResponse {
  register: string;
  accounts: HolderAccountPanel[];
}

export interface ReconCertEntry {
  accountNo: string;
  chn?: string;
  type: string; // BUY | SELL | RIGHTS | BONUS | IPO (only the sign is used server-side)
  units: number;
  transferNo?: string;
  date?: string; // yyyy-MM-dd
}

export const GET_HOLDER_CERTIFICATES = async (chn: string, register: string) => {
  try {
    const res = await api.get(`/reconciliation/cscs/holder-certificates`, { params: { chn, register } });
    return res.data.data as HolderCertificatesResponse;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const SAVE_RECONCILIATION_CERTIFICATES = async (payload: {
  register: string;
  flaggedItemId?: string;
  note?: string;
  entries: ReconCertEntry[];
}) => {
  try {
    const res = await api.post(`/reconciliation/cscs/certificates`, payload);
    return res.data.data as {
      certificatesWritten: number;
      accountsRecomputed: string[];
      flaggedResolved: boolean;
    };
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
