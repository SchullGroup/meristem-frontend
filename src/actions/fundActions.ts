// "use server";
//
// Fund Administration — Subscription & Redemption API layer (/api/v1/funds).
// Units-primary maker-checker (PENDING → APPROVED/REJECTED); no NAV/price. All endpoints wrap the
// standard ApiResponse envelope, so helpers unwrap to res.data.data. Paths drop the /api/v1 prefix
// (the axios baseURL already carries it).

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface FundUnitHolder {
  id: string;
  accountNo: string;
  name: string;
  chn: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bvn: string | null;
  nextOfKin: string | null;
  // Populated only when searching within a specific fund register (redemption typeahead):
  fundRegisterId?: string | null;
  fundName?: string | null;
  fundManagerEmail?: string | null;
  availableUnits?: number | null;
}

export interface FundSubscription {
  id: string;
  ref: string;
  fundRegisterId: string;
  fundName: string | null;
  fundManagerEmail: string | null;
  subscriberType: "NEW" | "EXISTING";
  holderName: string | null;
  holderAccountNo: string | null;
  holderId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bvn: string | null;
  nextOfKin: string | null;
  targetFundRegisterId: string | null;
  unitsSubscribed: number;
  amountPaid: number | null;
  subscriptionDate: string | null;
  narration: string | null;
  documentUrls: string[] | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionRemark: string | null;
  bulk: boolean;
  createdAt: string | null;
}

export interface FundRedemption {
  id: string;
  ref: string;
  fundRegisterId: string;
  fundName: string | null;
  fundManagerEmail: string | null;
  holderName: string | null;
  holderAccountNo: string | null;
  holderId: string | null;
  unitsRequested: number;
  availableUnitsAtRequest: number | null;
  redemptionDate: string | null;
  datePayable: string | null;
  narration: string | null;
  documentUrls: string[] | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionRemark: string | null;
  bulk: boolean;
  createdAt: string | null;
}

export interface FundPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FundBulkResult {
  totalRows: number;
  created: number;
  failed: number;
  errors: { row: number; reason: string }[];
}

export interface SubmitSubscriptionPayload {
  fundRegisterId: string;
  subscriberType: "NEW" | "EXISTING";
  subscriptionDate: string; // yyyy-MM-dd
  holderName?: string;
  email?: string;
  phone?: string;
  address?: string;
  bvn?: string;
  nextOfKin?: string;
  holderId?: string;
  targetFundRegisterId?: string;
  unitsSubscribed: number;
  amountPaid?: number;
  narration: string;
  documentUrls?: string[];
  createdBy?: string;
}

export interface SubmitRedemptionPayload {
  fundRegisterId: string;
  holderId: string;
  unitsRequested: number;
  redemptionDate: string;
  datePayable: string;
  narration?: string;
  documentUrls?: string[];
  createdBy?: string;
}

interface ListParams {
  search?: string;
  fundRegisterId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

/* ─── Shared holder typeahead ──────────────────────────────────────────────── */

export const SEARCH_FUND_HOLDERS = async (q: string, fundRegisterId?: string) => {
  try {
    const res = await api.get(`/funds/holders`, { params: { q, fundRegisterId } });
    return (res.data.data ?? []) as FundUnitHolder[];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Subscriptions ────────────────────────────────────────────────────────── */

export const SUBMIT_SUBSCRIPTION = async (payload: SubmitSubscriptionPayload) => {
  try {
    const res = await api.post(`/funds/subscriptions`, payload);
    return res.data.data as FundSubscription;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const BULK_SUBSCRIPTION = async (
  file: File,
  meta: { fundRegisterId: string; subscriberType: "NEW" | "EXISTING"; createdBy?: string },
) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/funds/subscriptions/bulk`, form, {
      params: meta,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data as FundBulkResult;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_PENDING_SUBSCRIPTIONS = async (params?: ListParams) => {
  try {
    const res = await api.get(`/funds/subscriptions/pending`, { params });
    return res.data.data as FundPage<FundSubscription>;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_APPROVED_SUBSCRIPTIONS = async (params?: ListParams) => {
  try {
    const res = await api.get(`/funds/subscriptions/approved`, { params });
    return res.data.data as FundPage<FundSubscription>;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const APPROVE_SUBSCRIPTION = async (id: string, approvedBy?: string) => {
  try {
    const res = await api.post(`/funds/subscriptions/${id}/approve`, { approvedBy });
    return res.data.data as FundSubscription;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const REJECT_SUBSCRIPTION = async (id: string, rejectionRemark: string, rejectedBy?: string) => {
  try {
    const res = await api.post(`/funds/subscriptions/${id}/reject`, { rejectionRemark, rejectedBy });
    return res.data.data as FundSubscription;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const UPDATE_SUBSCRIPTION_FM_EMAIL = async (id: string, fundManagerEmail: string, updatedBy?: string) => {
  try {
    const res = await api.patch(`/funds/subscriptions/${id}/fund-manager-email`, { fundManagerEmail, updatedBy });
    return res.data.data as FundSubscription;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

/* ─── Redemptions ──────────────────────────────────────────────────────────── */

export const SUBMIT_REDEMPTION = async (payload: SubmitRedemptionPayload) => {
  try {
    const res = await api.post(`/funds/redemptions`, payload);
    return res.data.data as FundRedemption;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const BULK_REDEMPTION = async (file: File, meta: { fundRegisterId: string; createdBy?: string }) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/funds/redemptions/bulk`, form, {
      params: meta,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data as FundBulkResult;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_PENDING_REDEMPTIONS = async (params?: ListParams) => {
  try {
    const res = await api.get(`/funds/redemptions/pending`, { params });
    return res.data.data as FundPage<FundRedemption>;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const GET_APPROVED_REDEMPTIONS = async (params?: ListParams) => {
  try {
    const res = await api.get(`/funds/redemptions/approved`, { params });
    return res.data.data as FundPage<FundRedemption>;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const APPROVE_REDEMPTION = async (id: string, approvedBy?: string) => {
  try {
    const res = await api.post(`/funds/redemptions/${id}/approve`, { approvedBy });
    return res.data.data as FundRedemption;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const REJECT_REDEMPTION = async (id: string, rejectionRemark: string, rejectedBy?: string) => {
  try {
    const res = await api.post(`/funds/redemptions/${id}/reject`, { rejectionRemark, rejectedBy });
    return res.data.data as FundRedemption;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

export const UPDATE_REDEMPTION_FM_EMAIL = async (id: string, fundManagerEmail: string, updatedBy?: string) => {
  try {
    const res = await api.patch(`/funds/redemptions/${id}/fund-manager-email`, { fundManagerEmail, updatedBy });
    return res.data.data as FundRedemption;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
