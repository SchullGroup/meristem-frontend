export type ReturnStatus =
  | "PENDING_RETURN"
  | "RETURNED"
  | "PARTIALLY_CLAIMED"
  | "EXHAUSTED";

export type RefundRequestStatus =
  | "PENDING"
  | "FIRST_APPROVED"
  | "APPROVED"
  | "RECEIVED"
  | "REJECTED";

export type RecipientType = "COMPANY" | "SEC";

export type ReturnInitiationStatus =
  | "PENDING_APPROVAL"
  | "ICU_APPROVED"
  | "PROCESSED"
  | "REJECTED";

export type WithheldPaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

// Per-declaration unclaimed dividend record with 90/10 split tracking
export interface DividendReturnRecord {
  id: number;
  declarationId: number;
  paymentNumber: string;
  registerSymbol: string;
  registerName: string;
  qualificationDate: string;
  paymentDate: string;
  shareholderCount: number;
  totalUnclaimed: number;
  returnPercentage: number;
  returnAmount: number;
  withheldPercentage: number;
  withheldAmount: number;
  totalPaidToShareholders: number;
  totalReimbursed: number;
  remainingBalance: number;
  returnStatus: ReturnStatus;
  recipientType?: RecipientType;
  returnDate?: string;
  returnRef?: string;
  notificationThreshold?: number;
  /** ID of the active ReturnInitiation in-flight, if any */
  pendingInitiationId?: number;
}

// A return initiation request — submitted for approval before money moves
export interface ReturnInitiation {
  id: number;
  returnRecordId: number;
  paymentNumber: string;
  registerSymbol: string;
  recipientType: RecipientType;
  totalUnclaimed: number;
  returnAmount: number;
  withheldAmount: number;
  secAmount?: number;
  narration?: string;
  initiatedBy: string;
  initiatedDate: string;
  status: ReturnInitiationStatus;
  icuApprovedBy?: string;
  icuApprovedDate?: string;
  processedBy?: string;
  processedDate?: string;
  rejectedBy?: string;
  rejectionComment?: string;
}

// A payment made from the 10% withheld pool to a shareholder
export interface WithheldPayment {
  id: number;
  returnRecordId: number;
  declarationId: number;
  paymentNumber: string;
  registerSymbol: string;
  shareholderName: string;
  accountNo: string;
  amount: number;
  paymentDate: string;
  reference: string;
  status: WithheldPaymentStatus;
  approvedBy?: string;
  approvedDate?: string;
  rejectionComment?: string;
  narration?: string;
}

// A request for the company to return funds when the 10% pool is exhausted
export interface RefundRequest {
  id: number;
  returnRecordId: number;
  declarationId: number;
  paymentNumber: string;
  registerSymbol: string;
  totalWithheld: number;
  totalPaidToShareholders: number;
  remainingBalance: number;
  requestedAmount: number;
  reason: string;
  requestDate: string;
  initiatedBy: string;
  status: RefundRequestStatus;
  firstApprovedBy?: string;
  firstApprovedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  receivedDate?: string;
  rejectedBy?: string;
  rejectionComment?: string;
  narration?: string;
}

// ── Query params ──────────────────────────────────────────────────────────────

export interface ReturnRecordsParams {
  registerSymbol?: string;
  paymentNumber?: string;
  returnStatus?: ReturnStatus;
  page?: number;
  size?: number;
}

export interface ReturnInitiationsParams {
  returnRecordId?: number;
  status?: ReturnInitiationStatus;
  page?: number;
  size?: number;
}

export interface WithheldPaymentsParams {
  returnRecordId?: number;
  paymentNumber?: string;
  page?: number;
  size?: number;
}

export interface RefundRequestsParams {
  returnRecordId?: number;
  status?: RefundRequestStatus;
  page?: number;
  size?: number;
}

// ── Mutation payloads ─────────────────────────────────────────────────────────

export interface CreateReturnInitiationPayload {
  returnRecordId: number;
  recipientType: RecipientType;
  returnPercentage?: number;
  secAmount?: number;
  narration?: string;
  initiatedBy: string;
}

export interface ReviewReturnInitiationPayload {
  id: number;
  action: "approve" | "reject";
  comment?: string;
}

export interface ProcessReturnPayload {
  returnRecordId: number;
  recipientType: RecipientType;
  returnPercentage?: number;
  secAmount?: number;
  narration?: string;
}

export interface RecordWithheldPaymentPayload {
  returnRecordId: number;
  shareholderName: string;
  accountNo: string;
  amount: number;
  narration?: string;
}

export interface ReviewWithheldPaymentPayload {
  id: number;
  action: "approve" | "reject";
  comment?: string;
}

export interface BulkApproveWithheldPaymentsPayload {
  ids: number[];
}

export interface CreateRefundRequestPayload {
  returnRecordId: number;
  requestedAmount: number;
  reason: string;
  narration?: string;
  initiatedBy: string;
}

export interface ApproveRefundRequestPayload {
  id: number;
  step: "first" | "final";
  comment?: string;
}

export interface RejectRefundRequestPayload {
  id: number;
  comment: string;
}

export interface SetNotificationThresholdPayload {
  returnRecordId: number;
  thresholdAmount: number;
}
