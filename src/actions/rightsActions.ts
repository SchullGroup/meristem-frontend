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

export const getShareholdersProfile = async (params: RightsIssueParams) => {
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

