import api from "@/services/api";
import { ContentPaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { useStore } from "@/lib/store";

const getXUserHeader = () => {
  const currentUser = useStore.getState().currentUser;
  return {
    "X-User": currentUser?.username || `${currentUser?.email}` || "ADMIN",
  };
};

export interface DematParams {
  certNo?: string;
  register?: string;
  chn?: string;
  holderName?: string;
  status?:
    | "DRAFT"
    | "CALLOVER"
    | "AUTHORISED"
    | "ICU_APPROVED"
    | "LODGED"
    | "REJECTED";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface Certificate {
  id: string; // uuid
  dematRecord: string;
  certNo: string;
  units: number;
  certDate: string; // date (ISO format YYYY-MM-DD)
}

export interface Demat {
  id: string; // uuid
  createdAt: string; // date-time
  updatedAt: string; // date-time
  register: string;
  chn: string;
  holderName: string;
  broker: string;
  certificates: Certificate[];
  shareholderIdRef: string;
  dematFormRef: string;
  scannedCertsRef: string;
  status:
    | "DRAFT"
    | "CALLOVER"
    | "AUTHORISED"
    | "ICU_APPROVED"
    | "LODGED"
    | "REJECTED";
  capturedBy: string;
  capturedAt: string; // date-time
  calloverBy: string;
  calloverAt: string; // date-time
  authorisedBy: string;
  authorisedAt: string; // date-time
  icuApprovedBy: string;
  icuApprovedAt: string; // date-time
  lodgedBy: string;
  lodgedAt: string; // date-time
  rinStatus: "RIN_AT_CSCS" | string;
  lodgmentMethod: "DOWNLOAD" | string;
  rejectedBy: string;
  rejectedAt: string; // date-time
  rejectionReason: string;
  rejectionStage: string;
  totalUnits: number;
}

export interface CaptureDematRequest {
  register: string;
  chn: string;
  holderName: string;
  broker: string;
  certificates: Array<{
    certNo: string;
    units: number;
    certDate: string;
  }>;
  shareholderIdRef: string;
  dematFormRef: string;
  scannedCertsRef: string;
}

//List demat records
export const getAllCertificateDemat = async (params?: DematParams) => {
  try {
    const response = await api.get<ContentPaginatedResponse<Demat>>(`/demat`, {
      params,
    });
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//Capture demat request and saves the status as DRAFT
export const captureDematRequest = async (data: CaptureDematRequest) => {
  try {
    const res = await api.post<Demat>(`/demat`, data, {
      headers: getXUserHeader(),
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//Reject demat request
//Rejects from any stage except LODGED/REJECTED.
export const rejectDematRequest = async (
  id: string,
  data: { reason: string },
) => {
  try {
    const res = await api.patch<Demat>(`/demat/${id}/reject`, data, {
      headers: getXUserHeader(),
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//Lodge demat record
// ICU_APPROVED → LODGED. Caller specifies RIN status and lodgment method (DOWNLOAD or PUSH)
export const lodgetDematRequest = async (
  id: string,
  data: {
    reason: {
      rinStatus: "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";
      method: "DOWNLOAD" | "PUSH";
    };
  },
) => {
  try {
    const res = await api.patch<Demat>(`/demat/${id}/lodge`, data, {
      headers: getXUserHeader(),
    });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//Approve at ICU stage
//AUTHORISED → ICU_APPROVED
export const icuApproveDematRequest = async (id: string) => {
  try {
    const res = await api.patch<Demat>(
      `/demat/${id}/icu-approve`,
      {},
      { headers: getXUserHeader() },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//Submit for callover
//DRAFT → CALLOVER
export const submitForCalloverDematRequest = async (id: string) => {
  try {
    const res = await api.patch<Demat>(
      `/demat/${id}/callover`,
      {},
      { headers: getXUserHeader() },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

//Authorize demat request
//CALLOVER → AUTHORISED
export const authorizeDematRequest = async (id: string) => {
  try {
    const res = await api.patch<Demat>(
      `/demat/${id}/authorise`,
      {},
      { headers: getXUserHeader() },
    );
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Bulk reject
export const bulkRejectDematRequest = async (ids: string[]) => {
  try {
    const res = await api.patch<{
      succeeded: string[];
      failed: Record<string, string | number | null>;
    }>(`/demat/bulk/reject`, ids, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Bulk ICU approve
export const bulkIcuApproveDematRequest = async (ids: string[]) => {
  try {
    const res = await api.patch<{
      succeeded: string[];
      failed: Record<string, string | number | null>;
    }>(`/demat/bulk/icu-approve`, ids, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Bulk authorise
export const bulkAuthorizeDematRequest = async (ids: string[]) => {
  try {
    const res = await api.patch<{
      succeeded: string[];
      failed: Record<string, string | number | null>;
    }>(`/demat/bulk/authorise`, ids, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Get demat record by ID
export const getDematRecordById = async (id: string) => {
  try {
    const res = await api.get<Demat>(`/demat/${id}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// Get workflow stage counts
export const getWorkflowStageCounts = async () => {
  try {
    const res = await api.get<{ [key: string]: number }>(`/demat/stage-counts`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
