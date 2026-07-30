import api from "@/services/api";
import { ContentPaginatedResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { useStore } from "@/lib/store";

const getXUserHeader = () => {
  const currentUser = useStore.getState().currentUser;
  return {
    "X-User": currentUser?.email,
  };
};

export type DematStatus =
  | "DRAFT"
  | "CALLOVER"
  | "AUTHORISED"
  | "COO_APPROVED"
  | "ICU_APPROVED"
  | "LODGED"
  | "LODGMENT_FAILED"
  | "REJECTED";

export interface DematParams {
  certNo?: string;
  register?: string;
  chn?: string;
  holderName?: string;
  status?: DematStatus;
  dateFrom?: string;
  dateTo?: string;
  /** High-value records awaiting CEO/COO approval (AUTHORISED + units > 10M). */
  pendingCooApproval?: boolean;
  /** Records ready for ICU approval (COO_APPROVED, or AUTHORISED and not high-value). */
  readyForIcu?: boolean;
  page?: number;
  size?: number;
}

export interface Certificate {
  id: string; // uuid
  dematRecord: string;
  certNo?: string;
  certNumber?: string;
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
  status: DematStatus;
  capturedBy: string;
  capturedAt: string; // date-time
  calloverBy: string;
  calloverAt: string; // date-time
  authorisedBy: string;
  authorisedAt: string; // date-time
  cooApprovedBy: string;
  cooApprovedAt: string; // date-time
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
  lodgmentFailureReason?: string;
  totalUnits: number;
  /** Transient on the backend: totalUnits > 10,000,000. */
  highValue?: boolean;
}

/** A holder row for the Shareholder Verification tab (from GET /holders). */
export interface DematHolder {
  id?: string;
  name?: string;
  chn?: string;
  registerSymbol?: string;
  register?: string;
  broker?: string;
  stockbrokerCode?: string;
  cscsAccountNo?: string;
  accountNo?: string;
  bvn?: string;
  units?: number;
  status?: string;
}

/** A stockbroker (dealing member) row for the Verification tab (from GET /holders/stockbrokers). */
export interface DematStockbroker {
  firmName: string;
  stockbrokerCode: string;
  holderCount: number;
  totalUnits: number;
}

export interface ReversalRowResult {
  certNo: string;
  outcome: string; // SUCCESS | FAILED | UNMATCHED
  reason?: string;
  dematId?: string;
  holderName?: string;
  register?: string;
}

export interface ReversalProcessResult {
  results: ReversalRowResult[];
  total: number;
  successCount: number;
  failedCount: number;
  unmatchedCount: number;
  suggestedSubject?: string;
  suggestedBody?: string;
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

export interface CaptureFromCertificatesRequest {
  chn: string;
  register: string;
  holderName?: string;
  broker?: string;
  shareholderIdRef?: string;
  dematFormRef?: string;
  scannedCertsRef?: string;
  certificateIds: string[];
}

// Capture a demat request by LINKING existing certificates (Certificate Capture is a search)
export const captureDematFromCertificates = async (data: CaptureFromCertificatesRequest) => {
  try {
    const res = await api.post<Demat>(`/demat/from-certificates`, data, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
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
    rinStatus: "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";
    method: "DOWNLOAD" | "PUSH";
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

// CEO/COO approve (high-value only) — AUTHORISED → COO_APPROVED
export const cooApproveDematRequest = async (id: string) => {
  try {
    const res = await api.patch<Demat>(`/demat/${id}/coo-approve`, {}, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// Bulk CEO/COO approve
export const bulkCooApproveDematRequest = async (ids: string[]) => {
  try {
    const res = await api.patch<{ succeeded: string[]; failed: Record<string, string | number | null> }>(
      `/demat/bulk/coo-approve`, ids, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// Reversal — process a CSCS lodgment-response CSV (certNo,outcome,reason)
export const processDematReversal = async (file: File) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<ReversalProcessResult>(`/demat/reversal/process`, form, {
      headers: { ...getXUserHeader(), "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// Reversal — send the operator-edited notification email
export const notifyDematReversal = async (data: { to?: string; subject: string; body: string }) => {
  try {
    const res = await api.post(`/demat/reversal/notify`, data, { headers: getXUserHeader() });
    return res.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// Shareholder Verification — search holders (+ stockbroker info carried on the holder record)
export const searchDematHolders = async (params: {
  name?: string;
  chn?: string;
  registerId?: string;
  page?: number;
  size?: number;
}) => {
  try {
    const res = await api.get<ContentPaginatedResponse<DematHolder>>(`/holders`, { params });
    return res.data;
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};

// Stockbroker Verification — search distinct stockbrokers by firm name or CSCS code
export const searchDematStockbrokers = async (q: string) => {
  try {
    const res = await api.get<DematStockbroker[]>(`/holders/stockbrokers`, { params: { q } });
    return res.data ?? [];
  } catch (error) {
    throw new Error(returnErrorMessage(error as ErrorLike));
  }
};
