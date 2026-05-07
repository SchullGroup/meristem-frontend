export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string[];
  secondaryRole?: string;
  department: string;
  certTransactionLimit: number;
  divTransactionLimit: number;
  status: "ACTIVE" | "INACTIVE";
  twoFAEnabled: boolean;
  lastLogin?: string;
  enabled: boolean;
  lastLoginTime: string;
}

export interface Principal {
  id: string;
  name: string;
  billingCategory: "A" | "B" | "C";
  address: string;
  email: string;
  phone: string;
  tin?: string;
  rcNumber?: string;
  sector: string;
  companySecretary?: string;
  companySecretaryPhone?: string;
  shareholdersAtSetup: number;
  dateListed?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface Register {
  id: string;
  principalId: string;
  name: string;
  registerType: "ORDINARY" | "PREFERENCE" | "BOND" | "FUND";
  symbol: string;
  nominalValue: number;
  stockAtSetup: number;
  stockToday: number;
  shareholdersAtSetup: number;
  shareholdersToday: number;
  allowFraction: boolean;
  decimalPlaces: 0 | 2 | 4;
  closedEnded: boolean;
  status: "ACTIVE" | "INACTIVE" | "TRANSACTION_DISABLED";
  createdAt: string;
}

export interface AgentType {
  id: string;
  code: string; // e.g. "BANK", "STOCKBROKER"
  label: string; // e.g. "Bank", "Stockbroker"
  builtIn: boolean;
  active: boolean;
}

export interface Agent {
  id: string;
  name: string;
  address: string;
  agentType: string;
  agentCode: string;
  cscsMemberCode?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  permissions: string[];
}

export interface Shareholder {
  id: string;
  registerId: string;
  accountNumber: string;
  oldAccountNumber?: string;
  lastName: string;
  firstName: string;
  otherNames?: string;
  gender: "M" | "F" | "CORPORATE";
  holderType: "INDIVIDUAL" | "CORPORATE" | "JOINT";
  email: string;
  phone: string;
  phone2?: string;
  address: string;
  state: string;
  bvn: string;
  nin?: string;
  chn: string;
  bankName: string;
  bankAccountNumber: string;
  holdings: number;
  status: "ACTIVE" | "DORMANT" | "CAUTIONED" | "SUSPENDED";
  cautionReason?: string;
  noTax: boolean;
}

export interface Certificate {
  id: string;
  certNumber: string;
  registerId: string;
  shareholderId: string;
  accountNumber: string;
  units: number;
  issueDate: string;
  status: "ACTIVE" | "DISABLED" | "LODGED" | "SPLIT" | "TRANSFERRED";
  transferNumber?: string;
  notes?: string;
}

export interface DividendDeclaration {
  id: string;
  registerId: string;
  paymentNumber: string;
  dividendType: "FINAL" | "INTERIM" | "SPECIAL";
  rate: number;
  qualificationDate: string;
  closureDate: string;
  paymentDate: string;
  currency: string;
  grossLiability: number;
  whtAmount: number;
  netLiability: number;
  tier: 1 | 2 | 3 | 4;
  status:
    | "DRAFT"
    | "PENDING_TIER2"
    | "PENDING_TIER3"
    | "PENDING_TIER4"
    | "AUTHORIZED"
    | "PAID"
    | "REJECTED";
  initiatorId: string;
  approvals: ApprovalStep[];
  narrative?: string;
  createdAt: string;
}

export interface DividendWarrant {
  id: string;
  declarationId: string;
  shareholderId: string;
  accountNumber: string;
  warrantNumber: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  bankName: string;
  bankAccount: string;
  status: "UNPAID" | "PAID" | "FAILED" | "REJECTED" | "ON_HOLD";
  paymentDate?: string;
}

export interface CSCSBatch {
  id: string;
  registerId: string;
  batchRef: string;
  batchDate: string;
  status: "PROCESSING" | "COMPLETE" | "FAILED";
  totalTransactions: number;
  buys: number;
  sells: number;
  flagged: number;
  initiatorId: string;
}

export interface DematRecord {
  id: string;
  registerId: string;
  shareholderId: string;
  accountNumber: string;
  chn: string;
  brokerName: string;
  certNumbers: string[];
  units: number;
  status:
    | "DRAFT"
    | "PENDING_CALLOVER"
    | "AUTHORIZED"
    | "ICU_APPROVED"
    | "LODGED";
  initiatorId: string;
  createdAt: string;
}

export interface KYCChange {
  id: string;
  shareholderId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changeType: "PERSONAL" | "CONTACT" | "BANK";
  status: "PENDING" | "APPROVED" | "REJECTED";
  initiatorId: string;
  approvedBy?: string;
  createdAt: string;
}

export interface AdmonRecord {
  id: string;
  deceasedAccountIds: string[];
  registerId: string;
  probateCourt: string;
  probateDate: string;
  adminAddress: string;
  adminCity: string;
  adminState: string;
  memo?: string;
  status: "PENDING" | "APPROVED" | "REVERSED";
  initiatorId: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  actorId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  timestamp: string;
}

export interface ApprovalItem {
  id: string;
  module: string;
  transactionType: string;
  description: string;
  amount?: number;
  tier?: 1 | 2 | 3 | 4;
  entityId: string;
  initiatorId: string;
  initiatorName: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvalSteps: ApprovalStep[];
}

export interface ApprovalStep {
  role: string[];
  approverName?: string;
  approverId?: string;
  decision?: "APPROVED" | "REJECTED";
  comment?: string;
  decidedAt?: string;
}
