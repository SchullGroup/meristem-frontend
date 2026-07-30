import api from "@/services/api";
import { ApiResponse, EntitlementResponse, PaginatedResponse } from "@/types";
import {
  CreateRightsIssue,
  RightsIssue,
  RightsIssueParams,
  RightsIssueStat,
  Allotment,
  TradedRights,
  AllotmentParams,
  AllotmentStatus,
  RangeAnalysisResponse,
  StateAnalysisResponse,
  TradedRightsResponse,
  RightsEntitlementResponse,
  NonAcceptanceResponse,
  RightsAllotmentResponse,
  RightsAcceptanceSummaryResponse,
} from "@/types/rights";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// get all rights issues
export const getAllRightsIssues = async (params?: RightsIssueParams) => {
  try {
    const response = await api.get<PaginatedResponse<RightsIssue>>(
      `/offers/rights-issue/declarations`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// get single rights issue
export const getRightsIssueById = async (id: string) => {
  try {
    const response = await api.get<RightsIssue>(
      `/offers/rights-issue/declarations/${id}`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// create rights issue
export const createRightsIssue = async (data: CreateRightsIssue) => {
  try {
    const response = await api.post<ApiResponse<RightsIssue>>(
      `/offers/rights-issue/declarations`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// submit rights issue for approval
export const submitForApproval = async (id: string) => {
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/submit`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// reject rights issue
export const rejectRightsIssue = async (payload: {
  id: string;
  decision: string;
  comment: string;
  createdBy: string;
}) => {
  const { id, ...data } = payload;

  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/reject`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// approve rights issue
export const approveRightsIssue = async (payload: {
  id: string;
  decision: string;
  comment: string;
  createdBy: string;
}) => {
  const { id, ...data } = payload;
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/approve`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const icuReject = async (payload: {
  id: string;
  decision: string;
  comment: string;
  createdBy: string;
}) => {
  const { id, ...data } = payload;
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/icu-return`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const icuApprove = async (payload: {
  id: string;
  decision: string;
  comment: string;
  createdBy: string;
}) => {
  const { id, ...data } = payload;
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/icu-approve`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// compute
export const computeEntitlements = async (id?: string) => {
  try {
    const response = await api.post<ApiResponse<RightsIssueStat>>(
      `/offers/rights-issue/declarations/${id}/compute`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//get entitlements
export const getRightsIssueShareholders = async (
  params?: RightsIssueParams,
) => {
  const { id, ...rest } = params || {};

  try {
    const response = await api.get<EntitlementResponse>(
      `/offers/rights-issue/declarations/${id}/entitlements`,
      { params: rest },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Generate Report
export const generateRightIssueReport = async (params: {
  id: string;
  reportType: string;
  format?: "json" | "csv" | "pdf";
}) => {
  const { id, reportType } = params;

  try {
    const response = await api.get<ApiResponse<string>>(
      `/offers/rights-issue/declarations/${id}/reports/${reportType}`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Upload Allotment
export const uploadAllotment = async (id: string, data: FormData) => {
  // const { id, ...rest } = data;

  try {
    const response = await api.post<ApiResponse<string>>(
      `/offers/rights-issue/declarations/${id}/allotment/upload`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Process Allotment
export const processAllotment = async (id: string, data: FormData) => {
  // const { id, ...rest } = data;

  try {
    const response = await api.post<ApiResponse<string>>(
      `/offers/rights-issue/declarations/${id}/allotment/process`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Get Allotment
export const getAllotment = async (params: AllotmentParams) => {
  const { id, ...data } = params;
  try {
    const response = await api.get<
      ApiResponse<{
        declarationId: string;
        totalAllotted: number;
        totalDisapproved: number;
        totalInvalid: number;
        totalReturnAmount: number;
        processedAt: string;
        content: Allotment[];
      }>
    >(`/offers/rights-issue/declarations/${id}/allotment`, { params: data });
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Export Allotment to excel
export const exportAllotmentExcel = async (
  id: string,
  allotmentType?: AllotmentStatus,
) => {
  try {
    const response = await api.get<Blob>(
      `/offers/rights-issue/declarations/${id}/allotment/export/excel`,
      {
        params: { allotmentType },
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Get Traded Rights
export const getTradedRights = async (params: RightsIssueParams) => {
  const { id, ...rest } = params;

  try {
    const response = await api.get<PaginatedResponse<TradedRights>>(
      `/offers/rights-issue/declarations/${id}/traded-rights`,
      { params: rest },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Create Traded Rights
export const createTradedRights = async ({
  id,
  data,
}: {
  id: string;
  data: {
    shareholderId: string;
    volume: number;
    memberCode: string;
  };
}) => {
  try {
    const response = await api.post<ApiResponse<TradedRights>>(
      `/offers/rights-issue/declarations/${id}/traded-rights`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const deleteTradedRights = async (params: {
  id: string;
  entryId: string;
}) => {
  const { id, entryId } = params;

  try {
    const response = await api.delete<ApiResponse<string>>(
      `/offers/rights-issue/declarations/${id}/traded-rights/${entryId}`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// lodge rights issue declaration
export const lodgeRightsIssueDeclaration = async (
  id: string,
  data: {
    lodgmentDate: string;
    lodgmentRef: string;
    notes: string;
    processedBy: string
  }
) => {

  try {
    const response = await api.post<ApiResponse<{
      id: string;
      ref: string;
      offerName: string;
      registerName: string;
      registerSymbol: string;
      status: string;
      lodgmentDate: string;
      lodgmentRef: string;
      notes: string;
      lodgedAt: string;
      lodgedBy: string
    }>>(
      `/offers/rights-issue/declarations/${id}/lodge`, data
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// email shareholders their rights issue declaration
export const emailShareholders = async (
  id: string,
) => {

  try {
    const response = await api.post<ApiResponse<string>>(
      `/offers/rights-issue/declarations/${id}/email-shareholders`
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getStickyLabels = async (params: RightsIssueParams) => {
  const { id, ...rest } = params;

  try {
    const response = await api.get<
      PaginatedResponse<{
        shareholderId: string;
        shareholderName: string;
        accountNumber: string;
        email: string;
        address: string;
        issueName: string;
      }>
    >(`/offers/rights-issue/declarations/${id}/sticky-label`, { params: rest });
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// reports endpoints

export const getTradedRightsReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<TradedRightsResponse> | Blob>(
      `/offers/rights-issue/reports/traded-rights-report`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportStateAnalysisReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<StateAnalysisResponse> | Blob>(
      `/offers/rights-issue/reports/state-analysis`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRightsEntitlementReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<RightsEntitlementResponse> | Blob>(
      `/offers/rights-issue/reports/rights-entitlement-list`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportRangeAnalysisReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<RangeAnalysisResponse> | Blob>(
      `/offers/rights-issue/reports/range-analysis`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportNonAcceptanceReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<NonAcceptanceResponse> | Blob>(
      `/offers/rights-issue/reports/non-acceptance-list`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportAllotmentReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<RightsAllotmentResponse> | Blob>(
      `/offers/rights-issue/reports/allotment-report`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const exportAcceptanceSummaryReport = async (registerId?: string, format?: "json" | "excel") => {
  try {
    const response = await api.get<ApiResponse<RightsAcceptanceSummaryResponse> | Blob>(
      `/offers/rights-issue/reports/acceptance-summary`,
      {
        params: { registerId, format },
        ...(format === "excel" ? { responseType: "blob" } : {}),
      },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Offer → declaration bridge ───────────────────────────────────────────────

/** Gets or creates the declaration administering an Offer-Setup rights offer; returns it. */
export const getOrCreateRightsDeclaration = async (
  offerId: string | number,
  createdBy?: string,
) => {
  try {
    const response = await api.post<ApiResponse<RightsIssue>>(
      `/offers/rights-issue/declarations/from-offer/${offerId}`,
      undefined,
      { params: createdBy ? { createdBy } : {} },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Returns-capture batches ──────────────────────────────────────────────────

export interface CreateReturnBatchPayload {
  receivingAgentName: string;
  receivingAgentType?: string;
  batchDate?: string;
  notes?: string;
  createdBy?: string;
}

export const createRightsReturnBatch = async (
  id: string | number,
  data: CreateReturnBatchPayload,
) => {
  try {
    const response = await api.post<ApiResponse<RightsReturnBatch>>(
      `/offers/rights-issue/declarations/${id}/returns/batches`,
      data,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const listRightsReturnBatches = async (id: string | number) => {
  try {
    const response = await api.get<ApiResponse<RightsReturnBatch[]>>(
      `/offers/rights-issue/declarations/${id}/returns/batches`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const listRightsBatchRecords = async (
  id: string | number,
  batchId: string | number,
  params?: { page?: number; size?: number },
) => {
  try {
    const response = await api.get(
      `/offers/rights-issue/declarations/${id}/returns/batches/${batchId}/records`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const submitRightsReturn = async (
  id: string | number,
  data: Record<string, unknown>,
) => {
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/returns`,
      data,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const bulkUploadRightsReturns = async (
  id: string | number,
  txType: string,
  file: File,
  batchId?: string | number,
) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/returns/bulk`,
      form,
      { params: { txType, ...(batchId ? { batchId } : {}) } },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadRightsReturnsTemplate = async (
  id: string | number,
  txType: string,
) => {
  try {
    const response = await api.get<Blob>(
      `/offers/rights-issue/declarations/${id}/returns/template`,
      { params: { txType }, responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Downloads a declaration-scoped report as a file (e.g. the prelist) in the given format. */
export const downloadRightsDeclarationReport = async (
  id: string | number,
  reportType: string,
  format: "excel" | "csv" = "excel",
  extra?: Record<string, string | number>,
) => {
  try {
    const response = await api.get<Blob>(
      `/offers/rights-issue/declarations/${id}/reports/${reportType}`,
      { params: { format, ...(extra ?? {}) }, responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

/** Fetches a declaration-scoped report as JSON (for on-screen preview). */
export const fetchRightsDeclarationReport = async (
  id: string | number,
  reportType: string,
  extra?: Record<string, string | number>,
) => {
  try {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(
      `/offers/rights-issue/declarations/${id}/reports/${reportType}`,
      { params: { format: "json", ...(extra ?? {}) } },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export interface RightsReturnBatch {
  id: number;
  declarationId: number;
  batchReference: string;
  receivingAgentName: string | null;
  receivingAgentType: string | null;
  batchDate: string | null;
  notes: string | null;
  status: string;
  createdBy: string | null;
  returnCount: number;
  createdAt: string | null;
}

// ── Rights Preview + HoD approval ────────────────────────────────────────────

/** Lists captured returns for a declaration (used by the cross-batch Preview). */
export const listRightsReturns = async (
  id: string | number,
  params?: { page?: number; size?: number; status?: string; txType?: string },
) => {
  try {
    const response = await api.get(
      `/offers/rights-issue/declarations/${id}/returns`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const deleteRightsReturn = async (id: string | number, returnId: string | number) => {
  try {
    const response = await api.delete(
      `/offers/rights-issue/declarations/${id}/returns/${returnId}`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const forwardRightsBatchToHod = async (
  id: string | number,
  batchId: string | number,
  submittedBy?: string,
) => {
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/returns/batches/${batchId}/forward`,
      { submittedBy },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const hodActionRightsBatch = async (
  id: string | number,
  batchId: string | number,
  approve: boolean,
  actor?: string,
  comment?: string,
) => {
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/returns/batches/${batchId}/${approve ? "hod-approve" : "hod-reject"}`,
      approve ? { approvedBy: actor, comment } : { rejectedBy: actor, comment },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadRightsBatchExport = async (id: string | number, batchId: string | number) => {
  try {
    const response = await api.get<Blob>(
      `/offers/rights-issue/declarations/${id}/returns/batches/${batchId}/export`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Allotment rule engine (applies to additional shares only) ────────────────

export interface AllotmentBand {
  minUnits: number | null;
  maxUnits: number | null;
  flatAllotment: number | null;
  proRataPercent: number | null;
}

export interface RightsAllotmentSummary {
  rightsIssueId: number;
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
  bandsConfigured: number;
}

export const getRightsAllotmentRules = async (id: string | number) => {
  try {
    const response = await api.get<ApiResponse<AllotmentBand[]>>(
      `/offers/rights-issue/declarations/${id}/allotment/rules`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const saveRightsAllotmentRules = async (id: string | number, bands: AllotmentBand[]) => {
  try {
    const response = await api.post<ApiResponse<AllotmentBand[]>>(
      `/offers/rights-issue/declarations/${id}/allotment/rules`,
      { bands },
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRightsAllotmentSummary = async (id: string | number) => {
  try {
    const response = await api.get<ApiResponse<RightsAllotmentSummary>>(
      `/offers/rights-issue/declarations/${id}/allotment/summary`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const runRightsAllotment = async (id: string | number) => {
  try {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(
      `/offers/rights-issue/declarations/${id}/allotment/execute`,
    );
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── Return monies (un-allotted additional rights) ────────────────────────────

export interface RightsRefundRecord {
  id: number;
  accountNo: string | null;
  holderName: string | null;
  amountApplied: number | null;
  amountAllotted: number | null;
  refundAmount: number | null;
  reason: string | null;
  status: string | null;
}

export const getRightsRefundSubscribers = async (
  id: string | number,
  params?: { reason?: string; status?: string; page?: number; size?: number },
) => {
  try {
    const response = await api.get(
      `/offers/rights-issue/declarations/${id}/refund/subscribers`,
      { params },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const queueRightsRefunds = async (
  id: string | number,
  subscriberIds: number[],
  queuedBy?: string,
) => {
  try {
    const response = await api.post(
      `/offers/rights-issue/declarations/${id}/refund/queue`,
      { subscriberIds, queuedBy },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadRightsRefunds = async (id: string | number) => {
  try {
    const response = await api.get<Blob>(
      `/offers/rights-issue/declarations/${id}/refund/download`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

