import { ApiResponse } from ".";

export interface RightsIssue {
  id: string;
  ref: string;
  registerId: string;
  registerName: string;
  registerSymbol: string;
  offerName: string;
  ratio: string;
  issuePrice: number;
  qualificationDate: string;
  closureDate: string;
  allotmentDate: string;
  totalEntitlements: number;
  totalRightsDeclared: number;
  totalAmount: number;
  status: RightsIssueStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  authorizedBy: string;
  authorizedAt: string;
  authorizedReason: string;
  icuApprovedBy: string;
  icuApprovedAt: string;
  icuApprovedByName: string;
  icuReason: string;
  narrative: string;
}

export type RightsIssueStatus =
  | "DRAFT"
  | "PENDING_AUTH"
  | "AUTH_REJECTED"
  | "PENDING_ICU"
  | "ICU_APPROVED"
  | "ICU_REJECTED"
  | "ALLOTTED"
  | "CLOSED";

export interface CreateRightsIssue {
  registerId: string;
  offerName: string;
  ratio: string;
  issuePrice: number;
  qualificationDate: string;
  closureDate: string;
  allotmentDate: string;
  narrative: string;
  createdBy: string;
  declarationId?: string;
}

export interface Shareholder {
  shareholderId: string;
  accountNumber: string;
  name: string;
  chn: string;
  brokerCode: string;
  address: string;
  bankName: string;
  bankAccount: string;
  unitsHeld: number;
  rightsRatio: string;
  rightsDue: number;
  amountPayable: number;
}

export interface RightsIssueParams {
  id?: string;
  registerId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  from?: string;
  to?: string;
}

export interface RightsIssueStat {
  id: string;
  totalShareholders: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountDue: number;
  totalFractionalShares: number;
  computedAt: string;
}

export interface Allotment {
  shareholderName: string;
  chn: string;
  stockbrokerCode: string;
  unitsHeld: number;
  rightsDue: number;
  bankName: string;
  accountNo: string;
  amountToReturn: number;
  issue: {
    id: string;
    ref: string;
    registerId: string;
    registerName: string;
    registerSymbol: string;
    offerName: string;
    ratio: string;
    issuePrice: number;
    qualificationDate: string;
    closureDate: string;
    allotmentDate: string;
    totalEntitlements: number;
    totalAmount: number;
    status: RightsIssueStatus;
    submittedBy: string;
    submittedByName: string;
    submittedAt: string;
    authorizedBy: string;
    authorizedAt: string;
    icuApprovedBy: string;
    icuApprovedAt: string;
    narrative: string;
    authorizedReason: string;
    icuReason: string;
  };
  allotmentType: AllotmentStatus;
  additionalCertificate?: string;
  reason?: string;
}

export type AllotmentStatus = "APPROVED" | "DISAPPROVED" | "INVALID";

export interface AllotmentParams {
  id?: string;
  status?: AllotmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface TradedRights {
  id: string;
  registrarsAccount: string;
  chn: string;
  shareholderName: string;
  volume: number;
  memberCode: string;
  lodgedAt: string;
}

export interface RangeAnalysisRow {
  rangeLabel: string;
  rangeMin: number;
  rangeMax: number;
  shareholders: number;
  unitsHeld: number;
  rightsDue: number;
  amountDue: number;
  percentage: number;
}

export interface RangeAnalysisResponse {
  reportType: "range-analysis";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  qualificationDate: string | null;
  generatedAt: string;
  totalShareholders: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountDue: number;
  rows: RangeAnalysisRow[];
}

export interface StateAnalysisRow {
  state: string;
  shareholders: number;
  unitsHeld: number;
  rightsDue: number;
  amountDue: number;
  percentageShareholders: number;
  percentageUnits: number;
}

export interface StateAnalysisResponse {
  reportType: "state-analysis";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  generatedAt: string;
  totalShareholders: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountDue: number;
  rows: StateAnalysisRow[];
}

export interface TradedRightsRow {
  rowNumber: number;
  registrarsAccount: string;
  shareholderName: string;
  brokerCode: string;
  chn: string;
  volume: number;
  memberCode: string;
  unitsHeld: number | null;
  rightsDue: number | null;
  lodgedAt: string;
}

export interface TradedRightsResponse {
  reportType: "traded-rights-report";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  qualificationDate: string | null;
  closureDate: string | null;
  generatedAt: string;
  totalEntries: number;
  totalVolumeTraded: number;
  rows: TradedRightsRow[];
}

export interface RightsEntitlementRow {
  rowNumber: number;
  accountNumber: string;
  shareholderName: string;
  chn: string;
  brokerCode: string;
  address: string;
  bankName: string;
  bankAccount: string;
  unitsHeld: number;
  rightsRatio: string;
  rightsDue: number;
  amountPayable: number;
}

export interface RightsEntitlementResponse {
  reportType: "rights-entitlement-list";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  ratio: string | null;
  issuePrice: number | null;
  qualificationDate: string | null;
  generatedAt: string;
  totalShareholders: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountDue: number;
  rows: RightsEntitlementRow[];
}

export interface NonAcceptanceRow {
  rowNumber: number;
  accountNumber: string;
  shareholderName: string;
  chn: string;
  brokerCode: string;
  bankName: string;
  bankAccount: string;
  address: string;
  unitsHeld: number;
  rightsDue: number;
  rightsRatio: string;
  amountDue: number;
}

export interface NonAcceptanceResponse {
  reportType: "non-acceptance-list";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  qualificationDate: string | null;
  closureDate: string | null;
  generatedAt: string;
  totalNonAccepted: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountForfeit: number;
  rows: NonAcceptanceRow[];
}

export interface RightsAllotmentRow {
  rowNumber: number;
  shareholderName: string;
  chn: string;
  brokerCode: string;
  unitsHeld: number;
  rightsDue: number;
  certShares: number;
  amountPayable: number;
  status: string;
  bankName: string;     
  accountNo: string;
  reason: string | null;
}

export interface RightsAllotmentResponse {
  reportType: "allotment-report";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  ratio: string | null;
  issuePrice: number | null;
  allotmentDate: string | null;
  generatedAt: string;
  totalAllotted: number;
  totalDisapproved: number;
  totalInvalid: number;
  totalUnitsHeld: number;
  totalRightsAllotted: number;
  totalAmountCollected: number;
  rows: RightsAllotmentRow[];
}

export interface RightsAcceptanceSummaryResponse {
  reportType: "acceptance-summary";
  declarationRef: string;
  offerName: string;
  registerName: string;
  registerSymbol: string;
  qualificationDate: string | null;
  closureDate: string | null;
  generatedAt: string;
  totalEntitled: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountDue: number;
  totalAccepted: number;
  totalUnitsAccepted: number;
  totalRightsAccepted: number;
  totalAmountAccepted: number;
  totalDisapproved: number;
  totalUnitsDisapproved: number;
  totalRightsDisapproved: number;
  totalAmountDisapproved: number;
  totalInvalid: number;
  totalUnitsInvalid: number;
  totalRightsInvalid: number;
  totalAmountInvalid: number;
  totalNotAccepted: number;
  totalUnitsNotAccepted: number;
  totalRightsNotAccepted: number;
  totalAmountNotAccepted: number;
  acceptanceRate: number;
  nonAcceptanceRate: number;
}