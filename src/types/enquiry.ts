export interface Shareholder {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  otherNames: string;
  chn: string;
  holdings: number;
  status: string;
  registerId: string;
  registerSymbol: string;
  holderType: string;
}

export interface HolderPersonalInfo {
  dateOfBirth: string;
  gender: string;
  nationality: string;
  state: string;
  nin: string;
  scuml: string;
  tin: string;
}

export interface HolderContactInfo {
  email: string;
  phone: string;
  altPhone: string;
  address: string;
}

export interface HolderFinancialInfo {
  bankName: string;
  bankAccountNumber: string;
  bvn: string;
  cautionReason: string;
  noTax: boolean;
  unpaidDividend: number;
}

export interface HolderProfile extends Shareholder {
  personal: HolderPersonalInfo;
  contact: HolderContactInfo;
  financial: HolderFinancialInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ShareholdersParams {
  registerSymbol?: string;
  status?: "ACTIVE" | "DORMANT" | "CAUTIONED" | "SUSPENDED";
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ShareholderSummary {
  totalShareholders: number;
  activeCount: number;
  dormantCount: number;
  cautionedCount: number;
  suspendedCount: number;
  totalHoldings: number;
}

export interface HolderTransfer {
  date: string;
  transferNo: string;
  fromAccount: string;
  toAccount: string;
  units: number;
  type: string;
  status: string;
}

export interface StatementPeriod {
  from: string;
  to: string;
}

export interface StatementTransaction {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface HolderStatement {
  holderId: string;
  holderName: string;
  accountNumber: string;
  registerSymbol: string;
  statementPeriod: StatementPeriod;
  currentHoldings: number;
  openingBalance: number;
  netMovement: number;
  transactions: StatementTransaction[];
  generatedAt: string;
}

export interface HolderStatementParams {
  dateFrom: string;
  dateTo: string;
}

export interface HolderMerger {
  date: string;
  type: string;
  sourceAccounts: string[];
  destinationAccount: string;
  holdingsMerged: number;
  initiatedBy: string;
  status: string;
}

export interface HolderDividend {
  dividendNo: string;
  declDate: string;
  paymentDate: string;
  rate: number;
  gross: number;
  wht: number;
  net: number;
  status: string;
  method: string;
}

export interface HolderDividendsParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface DividendStatement {
  holderId: string;
  holderName: string;
  accountNumber: string;
  registerSymbol: string;
  totalGross: number;
  totalWht: number;
  totalNet: number;
  unpaidAmount: number;
  dividends: HolderDividend[];
  generatedAt: string;
}

export interface HolderKycChange {
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByRole: string;
  approvedBy: string;
  changedAt: string;
}

export interface Certificate {
  certificateNo: string;
  accountNo: string;
  holderName: string;
  registerId: string;
  registerSymbol: string;
  dateIssued: string;
  units: number;
  status: string;
  transferNo: string;
  stockbrokerCode: string;
  notes: string;
}

export interface CertificatesParams {
  registerSymbol?: string;
  accountNo?: string;
  certificateNo?: string;
  transferNo?: string;
  exactUnits?: number;
  minUnits?: number;
  page?: number;
  size?: number;
}

export interface Certificate {
  certificateNo: string;
  accountNo: string;
  holderName: string;
  registerId: string;
  registerSymbol: string;
  dateIssued: string;
  units: number;
  status: string;
  transferNo: string;
  stockbrokerCode: string;
  notes: string;
}

export interface CertificatesParams {
  registerSymbol?: string;
  accountNo?: string;
  certificateNo?: string;
  transferNo?: string;
  exactUnits?: number;
  minUnits?: number;
  page?: number;
  size?: number;
}

export type WarrantPaymentType =
  | "DIVIDEND_WARRANT"
  | "INTEREST_WARRANT"
  | "APPLICATION_RETURN_MONEY"
  | "RIGHTS_RETURN_MONEY";

export interface Warrant {
  register: string;
  accountName: string;
  accountNo: string;
  warrantNo: string;
  payNumber: string;
  holdings: number;
  datePayable: string;
  ratePaid: number;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  bankName: string;
  bankAccountNo: string;
  paymentMethod: string;
  status: string;
  markedOffAt: string;
  markedOffBy: string;
}

export interface SearchWarrantsParams {
  paymentType: WarrantPaymentType;
  warrantNo?: string;
  accountNo?: string;
  registerSymbol?: string;
  page?: number;
  size?: number;
}

export interface Agent {
  id: string;
  agentName: string;
  agentCode: string;
  agentType: string;
  cscsCode: string;
  primaryAddress: string;
  status: string;
}

export interface AgentDetail extends Agent {
  totalMandates: number;
  activeMandates: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchAgentsParams {
  q: string;
  type?: "BANK" | "STOCKBROKER" | "COLLECTING_AGENT";
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  size?: number;
}

export interface AgentMandate {
  accountNo: string;
  holderName: string;
  registerSymbol: string;
  mandateDate: string;
  status: string;
}

export interface AgentMandatesParams {
  registerSymbol?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  size?: number;
}

export interface RightsSummary {
  rightsIssueName: string;
  qualificationDate: string;
  rightsSize: number;
  issuePrice: number;
}

export interface RightsEntitlement {
  accountNo: string;
  holderName: string;
  holdingsAtQualDate: number;
  totalRightsDue: number;
  fraction: number;
  rightsTaken: number;
  rightsTraded: number;
  rightsRenounced: number;
  allotmentDate: string;
  status: string;
}

export interface RightsSearchResponse {
  summary: RightsSummary;
  content: RightsEntitlement[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface SearchRightsParams {
  registerSymbol: string;
  rightsIssueId?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface RightsBreakdown {
  rightsTaken: number;
  rightsTraded: number;
  rightsRenounced: number;
  rightsLapsed: number;
  rightsPending: number;
}

export interface RightsHolderDetail {
  rightsIssueId: string;
  rightsIssueName: string;
  accountNo: string;
  holderName: string;
  registerId: string;
  registerSymbol: string;
  holdingsAtQualDate: number;
  totalRightsDue: number;
  fraction: number;
  issuePrice: number;
  totalCostIfFullyTaken: number;
  breakdown: RightsBreakdown;
  allotmentDate: string;
  status: string;
}

export interface HolderAdmonRecord {
  id: string;
  type: string;
  reference: string;
  deceasedName: string;
  dateOfDeath: string;
  estateAdministrator: string;
  status: string;
  initiatedAt: string;
}
