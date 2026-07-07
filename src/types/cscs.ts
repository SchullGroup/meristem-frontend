import { ApiResponse, PaginatedResponse } from ".";
import { Principal } from "./principal";
import { Register } from "./register";

export interface FlaggedTransaction {
  id: string,
  chn: string,
  register: string,
  holderName: string,
  transferNo: string,
  type: string,
  attempted: number,
  holdings: number,
  shortfall: number,
  status: string,
  transactionDate: string,
  buyChn: string
}

export interface ProcessedTransaction {
  id: string;
  transactionDate: string;
  batchRef: string;
  chn: string;
  register: string;
  holderName: string;
  transferNo: string;
  type: string;
  units: number;
  balanceAfter: number;
  processedBy: string;
}
export interface TransactionBatch {
  batchRef: string;
  register: string;
  transactionDate: string;
  total: number;
  buys: number;
  sells: number;
  flagged: number;
  status: string;
}

export interface ProcessingQueue {
  id: string;
  batchRef: string;
  register: string;
  batchDate: string;
  totalTransactions: number;
  buyCount: number;
  sellCount: number;
  flaggedCount: number;
  status: string;
  processedBy: string;
}

export interface ProcessedFile {
  id: string;
  batchRef: string;
  register: string;
  batchDate: string;
  totalTransactions: number;
  buyCount: number;
  sellCount: number;
  flaggedCount: number;
  status: string;
  processedBy: string;
}

export interface ProcessingQueueResponse {
  content: Array<ProcessingQueue>;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ProcessedLogsResponse {
  transactions: {
    content: Array<ProcessedTransaction>;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
  totalBuyUnits: number;
  totalSellUnits: number;
  totalRecords: number;
}

export interface TransferRequest {
  id: string;
  sourceCertId: string;
  sourceCertNumber: string;
  registerId: string;
  registerSymbol: string;
  fromHolder: string;
  fromAccount: string;
  toHolder: string;
  toAccount: string;
  units: number;
  stampDuty: number;
  instrumentRef: string;
  iotDocumentUrl: string;
  reason: string;
  status: string;
  submittedBy: string;
  submittedAt: string;
  authoriserComment: string;
}

export interface TransferRequestParams {
  page?: number;
  pageSize?: number;
  registerId?: string;
  search?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  fromDate?: string;
  toDate?: string;
}

export interface SubmitTransferRequest {
  sourceCertId: string;
  toShareholderId: string;
  toAccountNumber: string;
  units: number;
  instrumentRef: string;
  stampDuty: number;
  iotDocumentUrl: string;
  reason: string;
  submittedBy: string;
}

export interface CscsShareholder {
  accountNumber: string;
  bankAccountNumber: string;
  bankName: string;
  certNumber: string | null;
  certificateId: string | null;
  chn: string;
  firstName: string;
  holdings: number;
  id: string;
  lastName: string;
  registerId: string;
  registerName: string;
  registerSymbol: string;
  status: string;
}

export interface ConsolidationRequestParams {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  registerId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number; // 1-based index
  pageSize?: number;
}

export interface SubmitConsolidationRequest {
  certIds: string[];
  newCertNumber: string;
  reason: string;
  submittedBy: string;
}

export interface BatchConsolidationRequestPayload {
  approveIds: string[];
  rejectIds: string[];
  rejectComment: string;
  authorisedBy: string;
}

export interface Certificate {
  id: string;
  certNumber: string;
  registerId: string;
  registerName: string;
  registerSymbol: string;
  shareholderId: string;
  shareholderName: string;
  accountNumber: string;
  units: number;
  issueDate: string;
  status: string;
  transferNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateConsolidation {
  id: string;
  registerId: string;
  registerSymbol: string;
  accountNumber: string;
  holderName: string;
  newCertNumber: string;
  certCount: number;
  totalUnits: number;
  certificates: [
    {
      certNumber: string;
      units: number;
      issueDate: string;
    },
  ];
  reason: string;
  status: string;
  submittedBy: string;
  submittedAt: string;
  authoriserComment: string;
}
export type CertificateStatus =
  | "ACTIVE"
  | "DISABLED"
  | "LODGED"
  | "SPLIT"
  | "TRANSFERRED";

export interface CertificateParams {
  page?: number;
  pageSize?: number;
  registerId?: string;
  certNumber?: string;
  shareholderId?: string;
  accountNumber?: string;
  status?: CertificateStatus;
  fromDate?: string;
  toDate?: string;
}

/**
 * Response returned by the CSCS inject endpoint.
 * The batchRef is embedded inside `message` as:
 *   "Processing Zip record with BatchRef: BATCH-CSCS-XXXXXXXX_XXXXXX"
 * and must be extracted with a regex.
 *
 * Example:
 *   { message: "Processing Zip record with BatchRef: BATCH-CSCS-20260610_123038", status: "ACCEPTED" }
 */
export interface CscsInjectJob {
  /** Human-readable message — contains the batchRef */
  message: string;
  /** ACCEPTED = queued for background processing, FAILED = error */
  status: "ACCEPTED" | "FAILED" | string;
  batchRef: string;
}

// Check import job status
export interface CscsInjectStatus {
  message: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  batchRef: string;
  holdersLoaded: number;
  transactionsLoaded: number;
  startedAt: string;
  completedAt: string;
}

export interface Holder {
  id: string;
  name: string;
  email: string;
  chn: string;
  address: string;
  state: string;
  bank: string;
  bvnAccount: string;
  accountNumber: string | null;
  phone: string;
  altPhone: string;
  nextOfKin: string;
  units: number | null;
  dateOfBirth: string | null;
  registers: Array<{
    id: number;
    registerName: string;
    symbol: string;
  }>;
}

export interface ReconciliationTransaction {
  id: string;
  chn: string;
  register: string;
  holderName: string;
  transferNo: string;
  type: string;
  attempted: number;
  holdings: number;
  shortfall: number;
  status: string;
  transactionDate: string;
}

export interface CscsReconciliationRecord {
  id: string;
  batchRef: string;
  transactionDate: string;
  chn: string;
  register: string;
  holderName: string;
  transferNo: string;
  type: string;
  transStatus: string;
  entryMode?: string; // Optional since it only appears in mrpsl blocks
  units: number;
  balanceAfter: number | null; // Can be null on CSCS entries
  processedBy: string | null;
  status?: string; // Optional since it only appears in mrpsl blocks
  createdAt: string;
  updatedAt: string;
}

// Map the data object inside the API envelope
export interface CscsReconciliationData {
  mrpsl: PaginatedResponse<CscsReconciliationRecord>["data"];
  cscs: PaginatedResponse<CscsReconciliationRecord>["data"];
  missingData: CscsReconciliationRecord[];
}

// Complete endpoint response wrapping layout
export type ReconciliationResponse = ApiResponse<CscsReconciliationData>;

export interface MrpslPosition {
  createdAt: string;
  updatedAt: string;
  id: string;
  registers: Array<Register & { holders: string[]; principal: Principal }>;
  chn: string;
  name: string;
  address: string;
  state: string;
  bank: string;
  bvnAccount: string;
  accountNo: string;
  units: number;
  email: string;
  phone: string;
  altPhone: string;
  nextOfKin: string;
  dateOfBirth: string;
  status: string;
}

export interface CscsPosition {
  createdAt: string;
  updatedAt: string;
  id: string;
  batchRef: string;
  transactionDate: string;
  chn: string;
  register: string;
  holderName: string;
  transferNo: string;
  type: string;
  transStatus: string;
  units: number;
  balanceAfter: number;
  processedBy: string;
  status: string;
}

export interface ReconciliationFlaggedTransaction {
  id: string;
  chn: string;
  register: string;
  holderName: string;
  transferNo: string;
  type: string;
  attempted: number;
  holdings: number;
  shortfall: number;
  status: string;
  transactionDate: string;
}
