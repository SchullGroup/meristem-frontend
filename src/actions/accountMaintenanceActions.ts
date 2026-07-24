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
  KycCancelRequest,
  KycUploadJob,
  KycBulkPreviewResponse,
  KycBulkSubmitRequest,
  KycBulkSubmitResponse,
  NibssMandatePreviewResponse,
  NibssMandateSubmitRequest,
  NibssMandateSubmitResponse,
  ShareholderAccount,
  AdmonListResponse,
  AdmonDecisionRequest,
  BatchAdmonRequest,
  BatchAdmonResponse,
  BatchAdmonReversalRequest,
  BatchAdmonReversalResponse,
  AdmonReversalListResponse,
  HolderKycDocRequest,
  HolderSignatureRequest,
  AccountSearchResult,
  AccountSearchParams,
  CautionAccountRequest,
  RemoveCautionParams,
  SubmitKycDocumentsRequest,
  AccountKycDocument,
  SubmitSignatureRequest,
  AccountSignature,
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

// Account picker search across ALL registers (consolidation).
export const searchAccounts = async (params: AccountSearchParams) => {
  try {
    const res = await api.get<ApiResponse<AccountSearchResult[]>>(
      "/accounts/search",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Submit a Caution Account request for KYC approval.
export const cautionAccount = async (
  accountNumber: string,
  data: CautionAccountRequest,
) => {
  try {
    const res = await api.post<ApiResponse<KycChange>>(
      `/accounts/${accountNumber}/caution`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Submit a Remove Caution request for KYC approval.
export const removeCautionAccount = async (
  accountNumber: string,
  params: RemoveCautionParams,
) => {
  try {
    const res = await api.delete<ApiResponse<KycChange>>(
      `/accounts/${accountNumber}/caution`,
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Review Documents — all KYC documents for an account.
export const getAccountKycDocuments = async (accountNumber: string) => {
  try {
    const res = await api.get<ApiResponse<AccountKycDocument[]>>(
      `/accounts/${accountNumber}/documents`,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Submit KYC identity documents for approval.
export const submitAccountKycDocuments = async (
  accountNumber: string,
  data: SubmitKycDocumentsRequest,
) => {
  try {
    const res = await api.post<ApiResponse<KycChange>>(
      `/accounts/${accountNumber}/documents`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Submit a new signature image for KYC approval.
export const submitAccountSignature = async (
  accountNumber: string,
  data: SubmitSignatureRequest,
) => {
  try {
    const res = await api.post<ApiResponse<KycChange>>(
      `/accounts/${accountNumber}/documents/signature`,
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Signature Archive — all signatures for an account.
export const getAccountSignatures = async (accountNumber: string) => {
  try {
    const res = await api.get<ApiResponse<AccountSignature[]>>(
      `/accounts/${accountNumber}/documents/signatures`,
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

// Per KYC-BE-06: submitter-only withdrawal of a still-pending request.
// See backend_changes.md for the endpoint spec as given by the backend team.
export const cancelKycChange = async (id: number, data: KycCancelRequest) => {
  try {
    const res = await api.patch<ApiResponse<KycChange>>(
      `/kyc-change-requests/${id}/cancel`,
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

// ── KYC bulk upload: preview + submit (see backend_changes.md §6a) ──

export const previewKycBulkUpload = async (
  file: File,
  registerId?: string,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (registerId) formData.append("registerId", registerId);

    const res = await api.post<ApiResponse<KycBulkPreviewResponse>>(
      "/accounts/kyc-changes/bulk-upload/preview",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const submitKycBulkUpload = async (data: KycBulkSubmitRequest) => {
  try {
    const res = await api.post<ApiResponse<KycBulkSubmitResponse>>(
      "/accounts/kyc-changes/bulk-upload/submit",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ── NIBSS BVN mandate bulk upload: preview + submit (see backend_changes.md §6b) ──

export const previewNibssMandateUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<ApiResponse<NibssMandatePreviewResponse>>(
      "/accounts/kyc-changes/nibss-mandates/bulk-upload/preview",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const submitNibssMandateUpload = async (
  data: NibssMandateSubmitRequest,
) => {
  try {
    const res = await api.post<ApiResponse<NibssMandateSubmitResponse>>(
      "/accounts/kyc-changes/nibss-mandates/bulk-upload/submit",
      data,
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

export const batchReturnAdmons = async (data: BatchAdmonRequest) => {
  try {
    const res = await api.post<ApiResponse<BatchAdmonResponse>>(
      "/admon/batch-return",
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

export const batchAuthoriseAdmonReversals = async (
  data: BatchAdmonReversalRequest,
) => {
  try {
    const res = await api.post<ApiResponse<BatchAdmonReversalResponse>>(
      "/admon/reversals/batch-authorise",
      data,
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const batchRejectAdmonReversals = async (
  data: BatchAdmonReversalRequest,
) => {
  try {
    const res = await api.post<ApiResponse<BatchAdmonReversalResponse>>(
      "/admon/reversals/batch-reject",
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
