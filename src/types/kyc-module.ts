// Revised KYC Update module — shared mock types (Phase 1).

export type KycChannel = "STANDARD" | "NIBSS" | "CSCS" | "MERICONNECT";

export type KycRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "HOD_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED"
  | "PUSHED";

export interface KycFieldChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
  // CSCS/Mericonnect review: officer can accept only selected changed fields.
  accepted?: boolean;
}

export interface KycDoc {
  name: string;
  url: string;
  type: string;
}

export type ValResult = "PASS" | "WARN" | "FAIL";

export interface MandateValidation {
  nuban: ValResult;
  nameEnquiry: ValResult;
  bvnMatch: ValResult;
  nameEnquiryResult?: string;
}

export interface KycRequest {
  id: string;
  requestId: string;
  channel: KycChannel;
  accountNumber: string;
  chn: string;
  holderName: string;
  registerSymbol: string;
  registerName: string;
  submittedBy: string;
  submittedDate: string;
  status: KycRequestStatus;
  ageingDays: number;
  changes: KycFieldChange[];
  documents: KycDoc[];
  reason?: string;
  rejectionReason?: string;
  batchRef?: string;
  validation?: MandateValidation;
  hasUnpaidDividend?: boolean;
  // CSCS / Mericonnect inbox metadata
  externalRef?: string;
  requestType?: string;
  receivedDate?: string;
  docsRequested?: boolean;
}

export interface SyncLogEntry {
  id: string;
  ranAt: string;
  recordsPulled: number;
  errors: number;
  ranBy: string;
}

export type NibssRowValidation = "VALID" | "WARNING" | "FAILED";
export type NibssRowStatus = "VALID" | "NEEDS_FIX" | "REMOVED";

export interface NibssBatchRow {
  rowNo: number;
  chn: string;
  accountNumber: string;
  holderName: string;
  currentBank: string;
  currentAccountNo: string;
  newBank: string;
  newAccountNo: string;
  bvn: string;
  reason: string;
  validationStatus: NibssRowValidation;
  nameEnquiryResult: string;
  documentAttached: boolean;
  rowStatus: NibssRowStatus;
  documents: KycDoc[];
}

export interface NibssBatch {
  batchRef: string;
  uploadedBy: string;
  uploadedDate: string;
  status: KycRequestStatus;
  registerSymbol: string;
  rows: NibssBatchRow[];
}

// Landing → Mandating Queue stand-in (dividend module §8). Phase-1 mock only.
export interface MandatingQueueEntry {
  id: string;
  accountNumber: string;
  holderName: string;
  registerSymbol: string;
  newBank: string;
  newAccountNo: string;
  source: "KYC Module";
  status: "Mandated (Verified)";
  pushedBy: string;
  pushedDate: string;
}

export const MANDATE_REASONS = [
  "Account closed",
  "Bank migration/merger",
  "Change of bank",
  "Wrong account on record",
  "Name mismatch correction",
  "Dormant account",
  "Other",
] as const;

export const CHANNEL_LABEL: Record<KycChannel, string> = {
  STANDARD: "Standard KYC",
  NIBSS: "NIBSS Live Mandate",
  CSCS: "CSCS Mandate",
  MERICONNECT: "KYC Portal (Mericonnect)",
};

// Editable bank-mandate fields for NIBSS single (everything else locked).
export interface MandateFields {
  bankName: string;
  bankCode: string;
  nuban: string;
  accountName: string;
  bvn: string;
  accountType: string;
}
