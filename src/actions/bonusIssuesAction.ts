// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

export const GET_DECLARATIONS = async (params?: {
  id?: string;
  registerId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  from?: string;
  to?: string;
}) => {
  try {
    const res = await api.get(`/offers/bonus-issue/declarations`, { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_DECLARATION_BY_ID = async (declarationId?: string) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_DELCARED_BONUS_ALLOTMENTS = async (
  declarationId?: string,
  params?: { page?: number; pageSize?: number },
) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}/allotment`,
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const EXPORT_DELCARED_BONUS_ALLOTMENTS = async (
  declarationId?: string,
) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}/allotment/export/excel`,
      { responseType: "blob" },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const PROCESS_BONUS_ISSUE_ALLOTMENT = async ({
  declarationId,
}: {
  declarationId: string | number | null;
}) => {
  if (!declarationId) return;

  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/allotment/process`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_SHAREHOLDERS_BY_DECLARATION_ID = async (
  declarationId?: string,
  params?: { page?: number; pageSize?: number },
) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}/entitlements`,
      { params },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const CREATE_BONUS_ISSUE_DECLARATION = async (bonusData: unknown) => {
  try {
    const res = await api.post(`/offers/bonus-issue/declarations`, bonusData);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Gets or creates the declaration administering an Offer-Setup bonus offer; returns the envelope. */
export const GET_OR_CREATE_BONUS_DECLARATION = async (
  offerId: string | number,
  createdBy?: string,
) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/from-offer/${offerId}`,
      undefined,
      { params: createdBy ? { createdBy } : {} },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Downloads the provisional bonus pre-list (entitlements) as CSV. */
export const DOWNLOAD_BONUS_PRELIST = async (declarationId: string | number) => {
  try {
    const res = await api.get<Blob>(
      `/offers/bonus-issue/declarations/${declarationId}/entitlements/export`,
      { responseType: "blob" },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Bonus notification emails (delivery-tracked) ─────────────────────────────

export interface BonusEmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string | null;
  status: "QUEUED" | "SENT" | "FAILED";
  errorMessage: string | null;
  test: boolean;
  sentBy: string | null;
  createdAt: string | null;
  sentAt: string | null;
}

export const GET_BONUS_EMAIL_PREVIEW = async (declarationId: string | number) => {
  try {
    const res = await api.get(`/offers/bonus-issue/declarations/${declarationId}/email/preview`);
    return res.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const SEND_BONUS_EMAILS = async (
  declarationId: string | number,
  data: { subject?: string; html: string; sentBy?: string },
) => {
  try {
    const res = await api.post(`/offers/bonus-issue/declarations/${declarationId}/email/send`, data);
    return res.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const SEND_BONUS_TEST_EMAIL = async (
  declarationId: string | number,
  data: { subject?: string; html: string; recipients: string[]; sentBy?: string },
) => {
  try {
    const res = await api.post(`/offers/bonus-issue/declarations/${declarationId}/email/test`, data);
    return res.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_BONUS_EMAIL_LOGS = async (
  declarationId: string | number,
  params?: { status?: string; test?: boolean },
) => {
  try {
    const res = await api.get(`/offers/bonus-issue/declarations/${declarationId}/email/logs`, { params });
    return res.data.data as BonusEmailLog[];
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_BONUS_EMAIL_SUMMARY = async (declarationId: string | number) => {
  try {
    const res = await api.get(`/offers/bonus-issue/declarations/${declarationId}/email/summary`);
    return res.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Downloads the bonus CSCS lodgement file (fixed-width) in the given format. */
export const DOWNLOAD_BONUS_LODGEMENT = async (
  declarationId: string | number,
  format: "CSCS_STANDARD" | "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS" = "CSCS_STANDARD",
) => {
  try {
    const res = await api.get<Blob>(
      `/offers/bonus-issue/declarations/${declarationId}/lodgement/download`,
      { params: { format }, responseType: "blob" },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Marks a bonus issue as lodged with CSCS. */
export const LODGE_BONUS = async (
  declarationId: string | number,
  payload: { lodgmentDate?: string; lodgmentRef?: string; notes?: string; processedBy?: string },
) => {
  try {
    const res = await api.post(`/offers/bonus-issue/declarations/${declarationId}/lodge`, payload);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const COMPUTE_BONUS_ISSUE_DECLARATION = async ({
  declarationId,
}: {
  declarationId: string | number | null;
}) => {
  if (!declarationId) return;

  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/compute`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const SUBMIT_DECLARATION_FOR_APPROVAL = async ({
  declarationId,
}: {
  declarationId: string | number | null;
}) => {
  if (!declarationId) return;

  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/submit`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const APPROVE_DECLARATION = async ({
  declarationId,
  payload,
}: {
  declarationId: string | number | null;
  payload: unknown;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/approve`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const APPROVE_DECLARATION_BY_ICU = async ({
  declarationId,
  payload,
}: {
  declarationId: string | number | null;
  payload: unknown;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/icu-approve`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const REJECT_DECLARATION = async ({
  declarationId,
  payload,
}: {
  declarationId: string | number | null;
  payload: unknown;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/reject`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const RETURN_DECLARATION_TO_OPS = async ({
  declarationId,
  payload,
}: {
  declarationId: string | number | null;
  payload: unknown;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/icu-return`,
      payload,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const EMAIL_SHAREHOLDERS = async ({
  declarationId,
}: {
  declarationId: string | number | null;
}) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/email-shareholders`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export interface BonusReversalUploadResult {
  credited: { accountNumber: string; name: string; bonusDue: number }[];
  errors: { accountNumber: string; name: string; chn: string; bonusDue: number; reason: string }[];
  totalCredited: number;
  totalErrors: number;
}

/** Uploads a CSCS response file for a bonus issue; classifies credited vs error rows. */
export const UPLOAD_BONUS_REVERSAL = async (
  declarationId: string | number,
  file: File,
  uploadedBy: string,
) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/cscs-reversals/upload`,
      form,
      { params: { uploadedBy }, headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const INITIATE_BONUS_REVERSAL = async (
  declarationId: string | number,
  accountNumbers: string[],
  resolution: string,
  initiatedBy?: string,
) => {
  try {
    const res = await api.post(
      `/offers/bonus-issue/declarations/${declarationId}/cscs-reversals/initiate`,
      { accountNumbers, resolution, initiatedBy },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const DOWNLOAD_BONUS_REVERSAL_ERRORS = async (declarationId: string | number) => {
  try {
    const res = await api.get<Blob>(
      `/offers/bonus-issue/declarations/${declarationId}/cscs-reversals/error-list/download`,
      { responseType: "blob" },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Declaration-scoped report (e.g. the per-declaration "bonus-report"). */
export const GENERATE_BONUS_DECLARATION_REPORT = async (
  declarationId: string | number,
  reportType: string,
  format: "json" | "excel" = "json",
) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/${declarationId}/reports/${reportType}`,
      { params: { format }, ...(format === "excel" ? { responseType: "blob" as const } : {}) },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GENERATE_BONUS_REPORT = async (
  reportTypePath: string,
  params?: {
    registerId?: string;
    dateFrom?: string;
    dateTo?: string;
    format?: "json" | "excel";
  },
) => {
  try {
    const res = await api.get(
      `/offers/bonus-issue/declarations/reports/${reportTypePath}`,
      {
        params,
        ...(params?.format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GENERATE_BONUS_ENTITLEMENT_REGISTER = async (params?: {
  registerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return GENERATE_BONUS_REPORT("bonus-entitlement-register", params);
};

export const GENERATE_SHAREHOLDER_BONUS_ALLOTMENT_LIST = async (params?: {
  registerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return GENERATE_BONUS_REPORT("shareholder-bonus-allotment-list", params);
};

export const GENERATE_SUMMARY_OF_BONUS_SHARES_ISSUED = async (params?: {
  registerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return GENERATE_BONUS_REPORT("summary-of-bonus-shares-issued", params);
};

export const GENERATE_EXCEPTION_AND_ROUNDING_REPORT = async (params?: {
  registerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return GENERATE_BONUS_REPORT("exception-and-rounding-report", params);
};
