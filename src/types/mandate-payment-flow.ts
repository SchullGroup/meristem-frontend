// Domain types for the New Mandate Payment Processing redesign — a batch-based,
// multi-level approval workflow. See the redesign spec (§4–§9) for the full flow.

export type MandateBatchStatus =
  | "QUEUED" // assembled in Review Queue, not yet sent for approval
  | "PENDING_APPROVAL" // Initiator's first review
  | "PENDING_HOP" // Head of Payments review
  | "PENDING_ICU_1" // 1st ICU checkpoint
  | "PENDING_REREVIEW" // returned to Initiator after 1st ICU
  | "PENDING_ICU_2" // 2nd (independent) ICU sign-off
  | "PENDING_MD" // final executive sign-off
  | "PARTIALLY_PAID" // payment run initiated, some failures
  | "PAID" // payment run initiated, all succeeded
  | "MANUAL_PROCESSING" // MD forwarded for manual NIBSS processing (file downloaded)
  | "REJECTED"; // rejected wholesale at some approval stage

// Stages at which a whole batch can be rejected/kicked back.
export type MandateRejectionStage = "APPROVAL" | "HOP" | "ICU_1" | "ICU_2";

export type MandateSource = "NIBSS" | "CSCS" | "KYC" | "MANUAL_PUSH";

export type PaymentRowStatus = "PENDING" | "SUCCESS" | "FAILED";

// A single mandate-eligible shareholder inside a batch. Columns follow §8.
export interface MandateShareholder {
  id: string;
  name: string;
  registerSymbol: string;
  registerName: string;
  oldAccountNumber: string;
  newAccountNumber: string;
  bank: string;
  sortCode: string;
  bvn: string;
  address: string;
  dividendNumber: string;
  amount: number;
  email: string;
  source: MandateSource;
  paymentStatus?: PaymentRowStatus;
  failureReason?: string;
  // Set when the shareholder is excluded from a batch during 2nd ICU review.
  excludedReason?: string;
  excludedFromBatchRef?: string;
}

export interface MandateApprovalEntry {
  stage: string;
  actor: string;
  action:
    | "CREATED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "EXCLUDED"
    | "FORWARDED_MANUAL"
    | "PAYMENT_INITIATED"
    | "PAYMENT_REQUEUED";
  comment?: string;
  date: string;
}

export interface MandateBatch {
  id: string;
  batchRef: string;
  createdAt: string;
  status: MandateBatchStatus;
  initiatedBy: string;
  shareholders: MandateShareholder[];
  // Shareholders removed during 2nd ICU review (kept for audit — §6.6).
  excluded: MandateShareholder[];
  approvalTrail: MandateApprovalEntry[];
  gateway?: "NIBSS" | "REMITA";
  paymentRunRef?: string;
  paymentInitiatedAt?: string;
  rejectedAt?: MandateRejectionStage;
  rejectionComment?: string;
}

export interface MandateNotificationLogEntry {
  id: string;
  batchId: string;
  batchRef: string;
  subject: string;
  recipients: string[];
  recipientType: "SHAREHOLDERS" | "STAKEHOLDERS";
  trigger: "MANUAL" | "AUTOMATIC";
  sentAt: string;
  sentBy: string;
  // Recipient emails that failed delivery (surfaced in the delivery report — §6.9).
  undelivered?: string[];
}
