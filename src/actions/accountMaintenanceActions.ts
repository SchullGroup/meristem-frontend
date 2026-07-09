import api from "@/services/api";
import { ApiResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import {
  AccountFilters,
  AccountListResponse,
  AccountKycHistoryFilters,
  Admon,
  AdmonFilters,
  AdmonReversal,
  AdmonReversalFilters,
  BatchConsolidationRequest,
  BatchConsolidationResponse,
  BatchKycActionRequest,
  BatchKycActionResponse,
  Consolidation,
  ConsolidationDecisionRequest,
  ConsolidationFilters,
  ConsolidationListResponse,
  ConsolidationUploadJob,
  CreateConsolidationRequest,
  CreateKycChangeRequest,
  CreateAdmonRequest,
  CreateAdmonReversalRequest,
  KycChange,
  KycChangeFilters,
  KycChangeListResponse,
  KycDecisionRequest,
  KycUploadJob,
  ShareholderAccount,
  AdmonListResponse,
  AdmonDecisionRequest,
  BatchAdmonRequest,
  BatchAdmonResponse,
  AdmonReversalListResponse,
  HolderKycDocRequest,
  HolderSignatureRequest,
} from "@/types/account-maintenance";

export const createConsolidation = async (data: CreateConsolidationRequest) => {
  try {
    const res = await api.post<ApiResponse<Consolidation>>(
      "/consolidations",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getConsolidations = async (params?: ConsolidationFilters) => {
  try {
    const res = await api.get<ApiResponse<ConsolidationListResponse>>(
      "/consolidations",
      {
        params,
      },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getConsolidation = async (id: number) => {
  try {
    const res = await api.get<ApiResponse<Consolidation>>(
      `/consolidations/${id}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const authoriseConsolidation = async (
  id: number,
  data: ConsolidationDecisionRequest,
) => {
  try {
    const res = await api.put<ApiResponse<Consolidation>>(
      `/consolidations/${id}/authorise`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const reverseConsolidation = async (
  consolId: number,
  data: ConsolidationDecisionRequest,
) => {
  try {
    const res = await api.patch(`/consolidations/${consolId}/reverse`, data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const rejectConsolidation = async (
  id: number,
  data: ConsolidationDecisionRequest,
) => {
  try {
    const res = await api.put<ApiResponse<Consolidation>>(
      `/consolidations/${id}/reject`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchAuthoriseConsolidations = async (
  data: BatchConsolidationRequest,
) => {
  try {
    const res = await api.post<ApiResponse<BatchConsolidationResponse>>(
      "/consolidations/batch-authorise",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchRejectConsolidations = async (
  data: BatchConsolidationRequest,
) => {
  try {
    const res = await api.post<ApiResponse<BatchConsolidationResponse>>(
      "/consolidations/batch-reject",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const uploadConsolidations = async (registerId: string, file: File) => {
  try {
    const formData = new FormData();

    formData.append("file", file);

    const res = await api.post<ApiResponse<ConsolidationUploadJob>>(
      `/consolidations/bulk-upload?registerId=${registerId}`,
      formData,
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

export const getConsolidationUploadJob = async (jobId: string) => {
  try {
    const res = await api.get<ApiResponse<ConsolidationUploadJob>>(
      `/consolidations/bulk-upload/${jobId}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

////////////// KYC Changes ////////////////////

export const getAccounts = async (params: AccountFilters) => {
  try {
    const res = await api.get<ApiResponse<AccountListResponse>>("/accounts", {
      params,
    });

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAccount = async (accountNumber: string) => {
  try {
    const res = await api.get<ApiResponse<ShareholderAccount>>(
      `/accounts/${accountNumber}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getKycChanges = async (params?: KycChangeFilters) => {
  try {
    const res = await api.get<ApiResponse<KycChangeListResponse>>(
      "/accounts/kyc-changes",
      {
        params,
      },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAccountKycHistory = async (
  accountNumber: string,
  params?: AccountKycHistoryFilters,
) => {
  try {
    const res = await api.get<ApiResponse<KycChangeListResponse>>(
      `/accounts/${accountNumber}/kyc-changes`,
      {
        params,
      },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const createKycChange = async (
  accountNumber: string,
  data: CreateKycChangeRequest,
) => {
  try {
    const res = await api.post<ApiResponse<KycChange>>(
      `/accounts/${accountNumber}/kyc-changes`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const authoriseKycChange = async (
  id: number,
  data: KycDecisionRequest,
) => {
  try {
    const res = await api.put<ApiResponse<KycChange>>(
      `/accounts/kyc-changes/${id}/authorise`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const rejectKycChange = async (id: number, data: KycDecisionRequest) => {
  try {
    const res = await api.put<ApiResponse<KycChange>>(
      `/accounts/kyc-changes/${id}/reject`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchAuthoriseKycChanges = async (data: BatchKycActionRequest) => {
  try {
    const res = await api.post<ApiResponse<BatchKycActionResponse>>(
      "/accounts/kyc-changes/batch-authorise",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchRejectKycChanges = async (data: BatchKycActionRequest) => {
  try {
    const res = await api.post<ApiResponse<BatchKycActionResponse>>(
      "/accounts/kyc-changes/batch-reject",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const uploadKycChanges = async (file: File, registerId?: string) => {
  try {
    const formData = new FormData();

    formData.append("file", file);

    const res = await api.post<ApiResponse<KycUploadJob>>(
      "/accounts/kyc-changes/bulk-upload",
      formData,
      {
        params: {
          registerId,
        },
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

export const getKycUploadJob = async (jobId: string) => {
  try {
    const res = await api.get<ApiResponse<KycUploadJob>>(
      `/accounts/kyc-changes/bulk-upload/${jobId}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const downloadKycTemplate = async (format: "csv" | "xlsx" = "csv") => {
  try {
    const res = await api.get<Blob>(
      "/accounts/kyc-changes/bulk-upload/template",
      {
        params: { format },
        responseType: "blob",
      },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getKycChangesUploadJob = async (jobId: string) => {
  try {
    const res = await api.get<ApiResponse<KycUploadJob>>(
      `/accounts/kyc-changes/bulk-upload/${jobId}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const createAdmon = async (data: CreateAdmonRequest) => {
  try {
    const res = await api.post<ApiResponse<Admon>>("/admon", data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAdmons = async (params?: AdmonFilters) => {
  try {
    const res = await api.get<ApiResponse<AdmonListResponse>>("/admon", {
      params,
    });

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAdmon = async (id: number) => {
  try {
    const res = await api.get<ApiResponse<Admon>>(`/admon/${id}`);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const authoriseAdmon = async (
  id: number,
  data: AdmonDecisionRequest,
) => {
  try {
    const res = await api.put<ApiResponse<Admon>>(
      `/admon/${id}/authorise`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const rejectAdmon = async (id: number, data: AdmonDecisionRequest) => {
  try {
    const res = await api.put<ApiResponse<Admon>>(`/admon/${id}/reject`, data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchAuthoriseAdmons = async (data: BatchAdmonRequest) => {
  try {
    const res = await api.post<ApiResponse<BatchAdmonResponse>>(
      "/admon/batch-authorise",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchRejectAdmons = async (data: BatchAdmonRequest) => {
  try {
    const res = await api.post<ApiResponse<BatchAdmonResponse>>(
      "/admon/batch-reject",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const createAdmonReversal = async (
  admonId: number,
  data: CreateAdmonReversalRequest,
) => {
  try {
    const res = await api.post<ApiResponse<AdmonReversal>>(
      `/admon/${admonId}/reversals`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getAdmonReversals = async (params?: AdmonReversalFilters) => {
  try {
    const res = await api.get<ApiResponse<AdmonReversalListResponse>>(
      "/admon/reversals",
      {
        params,
      },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const authoriseAdmonReversal = async (
  reversalId: number,
  data: AdmonDecisionRequest,
) => {
  try {
    const res = await api.put<ApiResponse<AdmonReversal>>(
      `/admon/reversals/${reversalId}/authorise`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const rejectAdmonReversal = async (
  reversalId: number,
  data: AdmonDecisionRequest,
) => {
  try {
    const res = await api.put<ApiResponse<AdmonReversal>>(
      `/admon/reversals/${reversalId}/reject`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const uploadHolderKycDocuments = async (data: HolderKycDocRequest) => {
  try {
    const res = await api.post("/holders/kyc-documents", data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderKycDocuments = async (
  chn: string,
  registerSymbol: string,
) => {
  try {
    const res = await api.get(
      `/holders/kyc-documents?chn=${chn}&register=${registerSymbol}`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderSignature = async (
  chn: string,
  registerSymbol: string,
) => {
  try {
    const res = await api.get(
      `/holders/signature?chn=${chn}&register=${registerSymbol}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const verifyHolderKycDocument = async (
  data: { id: string; actionBy: string },
  id: string,
) => {
  try {
    const res = await api.patch(`/holders/kyc-documents/${id}/verify`, data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const rejectHolderKycDocument = async (
  data: { id: string; actionBy: string },
  id: string,
) => {
  try {
    const res = await api.patch(`/holders/kyc-documents/${id}/reject`, data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const uploadHolderSignature = async (data: HolderSignatureRequest) => {
  try {
    const res = await api.post("/holders/signature", data);

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getHolderSignatureArchive = async (
  chn: string,
  registerSymbol: string,
) => {
  try {
    const res = await api.get(
      `/holders/signature/archive?chn=${chn}&register=${registerSymbol}`,
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const validateBankDetails = async (data: {
  bankCode: string;
  accountNumber?: string;
  bvn?: string;
}) => {
  try {
    const res = await api.post("/nibss/validate-bank-details", data);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
