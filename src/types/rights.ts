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
