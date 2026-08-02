import api from "@/services/api";
import {
  Agent,
  AgentDetail,
  AgentMandate,
  AgentMandatesParams,
  Certificate,
  CertificatesParams,
  DividendStatement,
  HolderAdmonRecord,
  HolderDividend,
  HolderDividendsParams,
  HolderKycChange,
  HolderMerger,
  HolderProfile,
  HolderStatement,
  HolderStatementParams,
  HolderTransfer,
  RightsHolderDetail,
  RightsSearchResponse,
  SearchAgentsParams,
  SearchRightsParams,
  SearchWarrantsParams,
  Shareholder,
  ShareholdersParams,
  ShareholderSummary,
  ShareholderSearchCriteria,
  ShareholderSearchResult,
  Warrant,
} from "@/types/enquiry";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export const getWarrants = async (params: SearchWarrantsParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<Warrant>>(
      "/enquiry/warrants",
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

export const getWarrantDetail = async (warrantNo: string) => {
  try {
    const response = await api.get<ApiResponse<Warrant>>(
      `/enquiry/warrants/${warrantNo}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAgents = async (params: SearchAgentsParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<Agent>>(
      "/enquiry/agents",
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

export const getAgentDetail = async (id: string) => {
  try {
    const response = await api.get<ApiResponse<AgentDetail>>(
      `/enquiry/agents/${id}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAgentMandates = async (
  id: string,
  params?: AgentMandatesParams,
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<AgentMandate>>(
      `/enquiry/agents/${id}/mandates`,
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

export const getRightsEntitlements = async (params: SearchRightsParams) => {
  try {
    const response = await api.get<RightsSearchResponse>("/enquiry/rights", {
      params,
    });

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getRightsHolderDetail = async (
  rightsIssueId: string,
  accountNo: string,
) => {
  try {
    const response = await api.get<ApiResponse<RightsHolderDetail>>(
      `/enquiry/rights/${rightsIssueId}/holders/${accountNo}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getShareholders = async (params?: ShareholdersParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<Shareholder>>(
      "/enquiry/shareholders",
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

// Query-builder search — POST because the criteria payload is structured (rules + combinator).
// The endpoint wraps the page in ApiResponse, so unwrap to the inner ContentPaginatedResponse.
export const searchShareholders = async (
  criteria: ShareholderSearchCriteria,
): Promise<ContentPaginatedResponse<ShareholderSearchResult>> => {
  try {
    const response = await api.post<
      ApiResponse<ContentPaginatedResponse<ShareholderSearchResult>>
    >("/enquiry/shareholders/search", criteria);
    return response.data.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getShareholderSummary = async (registerSymbol?: string) => {
  try {
    const response = await api.get<ApiResponse<ShareholderSummary>>(
      "/enquiry/shareholders/summary",
      {
        params: { registerSymbol },
      },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderProfile = async (id: string) => {
  try {
    const response = await api.get<ApiResponse<HolderProfile>>(
      `/enquiry/holders/${id}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderTransfers = async (
  id: string,
  params?: {
    page?: number;
    size?: number;
  },
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<HolderTransfer>>(
      `/enquiry/holders/${id}/transfers`,
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

export const getHolderDividends = async (
  id: string,
  params?: HolderDividendsParams,
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<HolderDividend>>(
      `/enquiry/holders/${id}/dividends`,
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

export const getHolderCertificate = async (
  id: string,
  params?: {
    page?: number;
    size?: number;
  },
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<Certificate>>(
      `/enquiry/holders/${id}/certificates`,
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

export const getDividendStatement = async (
  id: string,
  params: HolderStatementParams,
) => {
  try {
    const response = await api.get<ApiResponse<DividendStatement>>(
      `/enquiry/holders/${id}/dividend-statement`,
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

export const getHolderStatement = async (
  id: string,
  params: HolderStatementParams,
) => {
  try {
    const response = await api.get<ApiResponse<HolderStatement>>(
      `/enquiry/holders/${id}/statement`,
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

export const getHolderMergers = async (
  id: string,
  params?: {
    page?: number;
    size?: number;
  },
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<HolderMerger>>(
      `/enquiry/holders/${id}/mergers`,
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

export const getHolderKycChanges = async (
  id: string,
  params?: {
    page?: number;
    size?: number;
  },
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<HolderKycChange>>(
      `/enquiry/holders/${id}/changes`,
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

export const getCertificates = async (params?: CertificatesParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<Certificate>>(
      "/enquiry/certificates",
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

export const getCertificateDetail = async (certificateNo: string) => {
  try {
    const response = await api.get<ApiResponse<Certificate>>(
      `/enquiry/certificates/${certificateNo}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderAdmonRecords = async (
  id: string,
  params?: {
    page?: number;
    size?: number;
  },
) => {
  try {
    const response = await api.get<ContentPaginatedResponse<HolderAdmonRecord>>(
      `/enquiry/holders/${id}/admon`,
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

export const downloadMandateTemplate = async (
  format: "csv" | "xlsx" = "csv",
) => {
  try {
    const res = await api.get<Blob>("/enquiry/agents/mandate/template", {
      params: { format },
      responseType: "blob",
    });

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const uploadAgentMandate = async (data: unknown) => {
  try {
    const res = await api.post<unknown>("/enquiry/agents/mandate", data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const bulkAgentMandateUpload = async (data: FormData, id?: string) => {
  try {
    const res = await api.post<unknown>(
      `/enquiry/agents/${id}/mandate/bulk-upload`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Documents/signatures are looked up by holder id (chn is unreliable/NULL post-migration).
export const getHolderKycDocuments = async (holderId: string) => {
  try {
    const res = await api.get(
      `/holders/kyc-documents?holderId=${encodeURIComponent(holderId)}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderSignature = async (holderId: string) => {
  try {
    const res = await api.get(
      `/holders/signature?holderId=${encodeURIComponent(holderId)}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
