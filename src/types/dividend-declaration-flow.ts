export type DividendFlowStatus =
  | "DRAFT"
  | "PRELIST_GENERATED"
  | "PENDING_ICU_1"
  | "PENDING_HOP"
  | "PENDING_ICU_2"
  | "PENDING_PAYMENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "REJECTED";

export type RejectionStage = "ICU_1" | "HOP" | "ICU_2";

export type PaymentRowStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PrelistRow {
  id: string;
  accountNumber: string;
  chn: string;
  holderName: string;
  email: string;
  bvn: string;
  nin: string;
  units: number;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  bankName: string;
  bankAccountNumber: string;
  sortCode: string;
  paymentStatus?: PaymentRowStatus;
  failureReason?: string;
}

export interface ApprovalTrailEntry {
  stage: string;
  actor: string;
  action:
    | "CREATED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "PAYMENT_INITIATED"
    | "PAYMENT_REQUEUED";
  comment?: string;
  date: string;
}

export interface DividendFlowRecord {
  id: string;
  paymentNumber: string;
  registerSymbol: string;
  registerName: string;
  dividendType: "FINAL" | "INTERIM" | "SPECIAL";
  rate: number;
  currency: string;
  qualificationDate: string;
  closureDate: string;
  paymentDate: string;
  fractionalRegister: boolean;
  narrative?: string;
  whtRate: number;
  isTaxExempt: boolean;
  exemptionRate?: number;
  stateJurisdiction?: string;
  warehouseBank?: string;
  warehouseAccountNo?: string;
  tier: 1 | 2 | 3 | 4;
  grossLiability: number;
  whtAmount: number;
  netLiability: number;
  totalShareholders: number;
  status: DividendFlowStatus;
  rejectedAt?: RejectionStage;
  rejectionComment?: string;
  initiatedBy: string;
  createdAt: string;
  prelist: PrelistRow[];
  gateway?: "NIBSS" | "REMITA";
  paymentRunRef?: string;
  paymentInitiatedAt?: string;
  approvalTrail: ApprovalTrailEntry[];
}

export interface NotificationLogEntry {
  id: string;
  declarationId: string;
  paymentNumber: string;
  subject: string;
  recipients: string[];
  recipientType: "SHAREHOLDERS" | "APPROVERS";
  trigger: "MANUAL" | "AUTOMATIC";
  sentAt: string;
  sentBy: string;
}
