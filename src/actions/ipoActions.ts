// "use server"

import api from "@/services/api";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import {
  ApplicationOfferResponse,
  ApplicationOfferSummaryResponse,
  BatchSummaryResponse,
  FullSubscriptionListResponse,
  IPO,
  IPOBatchType,
  IpoRefundSubscriber,
  IPOSubscriber,
  LodgementResponse,
  PendingApprovalParams,
  RangeAnalysisResponse,
  RefundBatchReviewResponse,
  RefundEligibleParams,
  RefundReviewRequest,
  StateSummaryResponse,
  IpoReversalUploadResponse,
  IpoEmailPreview,
  IpoEmailLog,
  IpoEmailSummary,
} from "@/types/ipo";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// GET PENDING APPROVALS
export const getIPOPendingApprovals = async (
  params?: PendingApprovalParams,
) => {
  try {
    // drafts backend: list is /ipo/batches filtered by status, wrapped in ApiResponse envelope.
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPO>>>(
      `/ipo/batches`,
      { params: { ...params, status: "OPS_PENDING" } },
    );

    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ICU APPROVALS
export const getIPOICUApprovals = async (params?: PendingApprovalParams) => {
  try {
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPO>>>(
      `/ipo/batches`,
      { params: { ...params, status: "OPS_APPROVED" } },
    );

    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPLOAD BATCH
export const uploadBatchIpo = async (payload: FormData) => {
  try {
    const response = await api.post<ApiResponse<IPO>>("/ipo/batches/upload", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // drafts backend wraps the batch in the ApiResponse envelope — unwrap to the batch.
    return response.data.data;
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

// REJECTED IPO BATCH
export const getRejectedOpsBatches = async (params?: PendingApprovalParams) => {
  try {
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPO>>>(
      `/ipo/batches`,
      { params: { ...params, status: "OPS_REJECTED" } },
    );

    return response.data.data;
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
    const response = await api.get<ApiResponse<IPO>>(`/ipo/batches/${batchRef}`);
    return response.data.data;
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
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPOSubscriber>>>(
      `/ipo/batches/${batchRef}/subscribers`,
      { params: rest },
    );
    return response.data.data;
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

export const getIpoBatchLogdement = async (params: {
  batchRef: string;
  limit?: number;
}) => {
  try {
    const response = await api.get<ApiResponse<LodgementResponse>>(
      `/ipo/batches/${params?.batchRef}/lodgement`,
      {
        params: { limit: params?.limit },
      },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadIpoBatchLogdement = async (params: {
  batchRef: string;
  format: "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";
}) => {
  try {
    const response = await api.get<string>(
      `/ipo/batches/${params?.batchRef}/lodgement/download`,
      {
        params: { format: params?.format },
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ALL IPO BATCHES LODGMENT
export const getIpoBatchesLodgment = async (params?: PendingApprovalParams) => {
  try {
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPO>>>(
      `/ipo/batches`,
      { params: { ...params, status: "ICU_APPROVED" } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// APPROVE LODGEMENT
export const approveLodgment = async (
  batchRef: string,
  payload: {
    comment: string;
    lodgedBy: string;
  },
) => {
  try {
    const response = await api.patch<ApiResponse<IPO>>(
      `/ipo/batches/${batchRef}/icu-lodged`,
      payload,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// reports endpoints

export const getBatchSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<ApiResponse<BatchSummaryResponse>>(
      `/ipo/reports/batch-summary`,
      { params: { register } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportBatchSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/batch-summary/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getStateSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<ApiResponse<StateSummaryResponse>>(
      `/ipo/reports/state-summary`,
      { params: { register } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportStateSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/state-summary/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRangeAnalysisReport = async (register?: string) => {
  try {
    const response = await api.get<ApiResponse<RangeAnalysisResponse>>(
      `/ipo/reports/range-analysis`,
      { params: { register } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportRangeAnalysisReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/range-analysis/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getFullSubscriptionListReport = async (params: {
  register?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const response = await api.get<ApiResponse<FullSubscriptionListResponse>>(
      `/ipo/reports/full-subscription-list`,
      { params },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportFullSubscriptionListReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/full-subscription-list/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getApplicationOfferReport = async (params: {
  register?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const response = await api.get<ApiResponse<ApplicationOfferResponse>>(
      `/ipo/reports/application-offer`,
      { params },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportApplicationOfferReport = async (register?: string) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/application-offer/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getApplicationOfferSummaryReport = async (register?: string) => {
  try {
    const response = await api.get<ApiResponse<ApplicationOfferSummaryResponse>>(
      `/ipo/reports/application-offer-summary`,
      { params: { register } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportApplicationOfferSummaryReport = async (
  register?: string,
) => {
  try {
    const response = await api.get<string>(
      `/ipo/reports/application-offer-summary/export`,
      { params: { register } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};


export const opsReviewRefundSubscriber = async (
  subscriberId: string,
  payload: RefundReviewRequest,
) => {
  try {
    const response = await api.patch<
      ApiResponse<IpoRefundSubscriber>
    >(
      `/ipo/subscribers/${subscriberId}/refund/ops-review`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const icuReviewRefundSubscriber = async (
  subscriberId: string,
  payload: RefundReviewRequest,
) => {
  try {
    const response = await api.patch<
      ApiResponse<IpoRefundSubscriber>
    >(
      `/ipo/subscribers/${subscriberId}/refund/icu-review`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const opsReviewRefundBatch = async (
  batchRef: string,
  payload: RefundReviewRequest,
) => {
  try {
    const response = await api.patch<
      ApiResponse<RefundBatchReviewResponse>
    >(
      `/ipo/batches/${batchRef}/refund/ops-review`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const icuReviewRefundBatch = async (
  batchRef: string,
  payload: RefundReviewRequest,
) => {
  try {
    const response = await api.patch<
      ApiResponse<RefundBatchReviewResponse>
    >(
      `/ipo/batches/${batchRef}/refund/icu-review`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRefundEligibleSubscribers = async (
  batchRef: string,
  params?: RefundEligibleParams,
) => {
  try {
    const response = await api.get<
      ApiResponse<
        ContentPaginatedResponse<IpoRefundSubscriber>
      >
    >(
      `/ipo/batches/${batchRef}/refund-eligible`,
      {
        params,
      },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
// ============================================================================
// IPO backend integration (drafts) — allotment, vetting, SEC reports, file
// ============================================================================
export interface IpoAllotmentRule {
  id?: number;
  offerId?: string;
  minUnits: number;
  maxUnits: number;
  flatAllotment: number | null;
  proRataPercent: number | null;
}
// ── IPO Allotment Rules ──────────────────────────────────────────────────

export const saveIpoAllotmentRules = async (
  offerId: string,
  bands: { minUnits: number; maxUnits: number; flatAllotment: number; proRataPercent: number }[],
) => {
  try {
    const response = await api.post<ApiResponse<IpoAllotmentRule[]>>(
      `/offers/ipo/${offerId}/allotment/rules`,
      { bands },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoAllotmentRules = async (offerId: string) => {
  try {
    const response = await api.get<ApiResponse<IpoAllotmentRule[]>>(
      `/offers/ipo/${offerId}/allotment/rules`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export interface IpoAllotmentSummary {
  totalUnitsOffered: number;
  totalUnitsApplied: number;
  totalApplicants: number;
  respondedApplicants: number;
  offerPrice: number;
  executed: boolean;
  totalUnitsAllotted: number;
  totalRefundUnits: number;
  totalRefundValue: number;
  refundApplicants: number;
}

export const getIpoAllotmentSummary = async (offerId: string) => {
  try {
    const response = await api.get<ApiResponse<IpoAllotmentSummary>>(
      `/offers/ipo/${offerId}/allotment/summary`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const executeIpoAllotment = async (offerId: string) => {
  try {
    const response = await api.post<ApiResponse<unknown>>(
      `/offers/ipo/${offerId}/allotment/execute`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Generic batch list by status — for reversal/dispatch batch pickers.
export const listIpoBatchesByStatus = async (status: string) => {
  try {
    // drafts backend wraps the page in the ApiResponse envelope — unwrap to the page.
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPO>>>(
      `/ipo/batches`,
      { params: { status, size: 200 } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Data Vetting & Duplicates (real, per-batch) ──────────────────────────────

export interface IpoVettingSummary {
  batchReference: string;
  totalProcessed: number;
  validCount: number;
  rejectedCount: number;
  duplicateCount: number;
  duplicateGroupCount: number;
}

export interface IpoDuplicateGroup {
  matchType: string;
  duplicateKey: string;
  applications: IPOSubscriber[];
}

// List all batches for an offer (batch selector on the vetting dashboard).
export const listIpoBatchesByOffer = async (offerId: string) => {
  try {
    // /ipo/batches wraps the page in the ApiResponse envelope — unwrap to the Page.
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPO>>>(
      `/ipo/batches`,
      { params: { offerId, size: 200 } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoVettingSummary = async (batchRef: string) => {
  try {
    const response = await api.get<ApiResponse<IpoVettingSummary>>(
      `/ipo/batches/${batchRef}/vetting/summary`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoVettingApplications = async (params: {
  batchRef: string;
  bucket: "VALID" | "REJECTED";
  search?: string;
  page?: number;
  size?: number;
}) => {
  const { batchRef, ...rest } = params;
  try {
    // Wrapped in the ApiResponse envelope — unwrap to the Page so callers read .content.
    const response = await api.get<ApiResponse<ContentPaginatedResponse<IPOSubscriber>>>(
      `/ipo/batches/${batchRef}/vetting/applications`,
      { params: rest },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoDuplicateGroups = async (batchRef: string) => {
  try {
    const response = await api.get<ApiResponse<IpoDuplicateGroup[]>>(
      `/ipo/batches/${batchRef}/vetting/duplicates`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const resolveIpoDuplicate = async (params: {
  batchRef: string;
  subscriberId: string;
  action: "KEEP" | "MARK_DISTINCT" | "REJECT";
  resolvedBy: string;
}) => {
  const { batchRef, subscriberId, action, resolvedBy } = params;
  try {
    const response = await api.post<ApiResponse<IPOSubscriber>>(
      `/ipo/batches/${batchRef}/vetting/duplicates/${subscriberId}/resolve`,
      { action, resolvedBy },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── SEC Clearance Reports (real, computed from the batch records) ────────────

export interface IpoSecReport {
  reportId: string;
  batchReference: string;
  rowCount: number;
  rows: Record<string, string | number>[];
}

export const generateIpoSecReport = async (batchRef: string, reportId: string) => {
  try {
    const response = await api.get<ApiResponse<IpoSecReport>>(
      `/ipo/batches/${batchRef}/sec-reports/${reportId}`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportIpoSecReport = async (batchRef: string, reportId: string) => {
  try {
    const response = await api.get<Blob>(
      `/ipo/batches/${batchRef}/sec-reports/${reportId}/export`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Download the raw uploaded subscription file stored for a batch.
export const downloadIpoBatchFile = async (batchRef: string) => {
  try {
    const response = await api.get<Blob>(`/ipo/batches/${batchRef}/file`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Allotment dry-run preview (per-band, from real approved subscribers) ─────

export interface IpoAllotmentPreviewBand {
  minUnits: number;
  maxUnits: number;
  flatAllotment: number | null;
  proRataPercent: number | null;
  applicants: number;
  unitsApplied: number;
  unitsAllotted: number;
  refundUnits: number;
  refundValue: number;
}

export interface IpoAllotmentPreview {
  bands: IpoAllotmentPreviewBand[];
  totalApplicants: number;
  totalUnitsApplied: number;
  totalUnitsAllotted: number;
  totalRefundUnits: number;
  totalRefundValue: number;
}

export const previewIpoAllotment = async (
  offerId: string,
  bands: { minUnits: number; maxUnits: number; flatAllotment: number; proRataPercent: number }[],
) => {
  try {
    const response = await api.post<ApiResponse<IpoAllotmentPreview>>(
      `/offers/ipo/${offerId}/allotment/preview`,
      { bands },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── IPO CSCS Reversals + Dispatch (drafts) ───────────────────────────────
export const uploadIpoReversalFile = async (
  batchRef: string,
  file: File,
  uploadedBy: string,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<IpoReversalUploadResponse>>(
      `/ipo/batches/${batchRef}/cscs-reversals/upload`,
      formData,
      { params: { uploadedBy }, headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const initiateIpoReversal = async (
  batchRef: string,
  accountNumbers: string[],
  initiatedBy: string,
) => {
  try {
    const response = await api.post<ApiResponse<{ updated: number }>>(
      `/ipo/batches/${batchRef}/cscs-reversals/initiate`,
      { accountNumbers, initiatedBy },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadIpoReversalErrorList = async (batchRef: string) => {
  try {
    const response = await api.get<Blob>(
      `/ipo/batches/${batchRef}/cscs-reversals/error-list/download`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── IPO Dispatch ─────────────────────────────────────────────────────────

export const emailIpoShareholders = async (
  batchRef: string,
  data: { subject?: string; sentBy: string },
) => {
  try {
    const response = await api.post<ApiResponse<{ sent: number }>>(
      `/ipo/batches/${batchRef}/email-shareholders`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadIpoStickyLabels = async (batchRef: string) => {
  try {
    const response = await api.get<Blob>(
      `/ipo/batches/${batchRef}/sticky-labels`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── IPO Notification Emails ──────────────────────────────────────────────────

export const getIpoEmailPreview = async (batchRef: string) => {
  try {
    const response = await api.get<ApiResponse<IpoEmailPreview>>(
      `/ipo/batches/${batchRef}/email/preview`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const sendIpoEmails = async (
  batchRef: string,
  data: { subject?: string; html: string; sentBy: string },
) => {
  try {
    const response = await api.post<ApiResponse<{ queued: number; skipped: number }>>(
      `/ipo/batches/${batchRef}/email/send`,
      data,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const sendIpoTestEmail = async (
  batchRef: string,
  data: { subject?: string; html: string; recipients: string[]; sentBy: string },
) => {
  try {
    const response = await api.post<ApiResponse<{ queued: number }>>(
      `/ipo/batches/${batchRef}/email/test`,
      data,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoEmailLogs = async (
  batchRef: string,
  params?: { status?: string; test?: boolean },
) => {
  try {
    const response = await api.get<ApiResponse<IpoEmailLog[]>>(
      `/ipo/batches/${batchRef}/email/logs`,
      { params },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getIpoEmailSummary = async (batchRef: string) => {
  try {
    const response = await api.get<ApiResponse<IpoEmailSummary>>(
      `/ipo/batches/${batchRef}/email/summary`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
