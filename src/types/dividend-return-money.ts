export type ReturnStatus =
  | "PENDING_RETURN"
  | "RETURNED"
  | "PARTIALLY_CLAIMED"
  | "EXHAUSTED";

export type RefundRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "RECEIVED"
  | "REJECTED";

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
  remainingBalance: number;
  returnStatus: ReturnStatus;
  returnDate?: string;
  returnRef?: string;
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
  approvedBy: string;
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
  status: RefundRequestStatus;
  approvedBy?: string;
  approvedDate?: string;
  receivedDate?: string;
  narration?: string;
}

// Query params
export interface ReturnRecordsParams {
  registerSymbol?: string;
  paymentNumber?: string;
  returnStatus?: ReturnStatus;
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

// Mutation payloads
export interface ProcessReturnPayload {
  returnRecordId: number;
  returnPercentage: number;
  narration?: string;
}

export interface RecordWithheldPaymentPayload {
  returnRecordId: number;
  shareholderName: string;
  accountNo: string;
  amount: number;
  narration?: string;
}

export interface CreateRefundRequestPayload {
  returnRecordId: number;
  requestedAmount: number;
  reason: string;
  narration?: string;
}
