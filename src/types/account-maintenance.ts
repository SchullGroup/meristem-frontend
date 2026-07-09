export interface ConsolidationAccount {
  accountNumber: string;
  holderName: string;
  holdings: number;
}

export interface DestinationAccount {
  accountNumber: string;
  holderName: string;
}

export interface Consolidation {
  id: number;
  registerId: string;
  sourceAccounts: ConsolidationAccount[];
  destinationAccount: DestinationAccount;
  totalHoldings: number;
  comment: string;
  status: string;
  initiatorId: string;
  initiatorName: string;
  authorisedBy: string;
  rejectionComment: string;
  createdAt: string;
  decidedAt: string;
  supportingDocuments?: { name: string; url: string }[];
}

export interface CreateConsolidationRequest {
  registerId?: string;
  sourceAccountIds: string[];
  destinationAccountId: string;
  comment: string;
  initiatedBy: string;
  supportingDocuments?: { name: string; url: string }[];
}

export interface ConsolidationDecisionRequest {
  comment: string;
  authorisedBy: string;
}

export interface BatchConsolidationRequest {
  ids: string[];
  comment: string;
  authorisedBy: string;
}
export interface HolderKycDocRequest {
  chn: string;
  registerSymbol: string;
  documents: {
    documentType: string;
    documentName: string;
    documentRef: string;
    documentUrl: string;
    uploadedAt: string;
  }[];
}
export interface HolderSignatureRequest {
  chn: string;
  registerSymbol: string;
  signatureUrl: string;
  holderName: string;
}

export interface HolderKycDocument {
  id: string;
  chn: string;
  registerSymbol: string;
  holderName: string;
  documentType: string;
  documentName: string;
  documentRef: string;
  documentUrl: string;
  uploadedAt: string;
  status: string;
  verifiedBy: string;
  verifiedAt: string;
}

export interface BatchConsolidationResponse {
  authorised: number;
  rejected: number;
  skipped: number;
  details: Consolidation[];
}

export interface ConsolidationFilters {
  status?: string;
  registerId?: string;
  initiatorId?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ConsolidationListResponse {
  data: Consolidation[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BulkUploadError {
  row: number;
  accountNumber: string;
  field: string;
  message: string;
}

export interface ConsolidationUploadJob {
  jobId: string;
  status: string;
  totalRows: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: BulkUploadError[];
  createdAt: string;
  completedAt: string;
}

///////// kyc///////////////////

export interface ShareholderAccount {
  id: string;
  registerId: string;
  registerSymbol: string;
  accountNumber: string;

  lastName: string;
  firstName: string;
  otherNames: string;

  gender: string;
  holderType: string;
  dob?: string;
  nationality?: string;

  email: string;
  phone: string;
  phone2: string;

  address: string;
  altAddress?: string;
  state: string;

  bvn: string;
  nin: string;
  chn: string;
  tin?: string;

  bankName: string;
  bankAccountNumber: string;

  holdings: number;

  status: string;
  cautionReason: string;
  noTax: boolean;

  lastKycUpdate?: string;
  updatedAt?: string;
}

export interface AccountListResponse {
  data: ShareholderAccount[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AccountFilters {
  q: string;
  registerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface KycChange {
  id: number;
  shareholderId: string;
  accountNumber: string;
  holderName: string;

  changeType: string;
  fieldChanged: string;

  oldValue: string;
  newValue: string;

  oldBank: string;
  newBank: string;

  changesJson: string;

  status: string;

  initiatorId: string;
  initiatorName: string;

  authorisedBy: string;
  rejectionComment: string;

  supportingDocuments: Array<{
    name: string;
    url: string;
  }>;
  createdAt: string;
  decidedAt: string;

  // Added for KYC Approvals Queue
  priority?: string;
  icuApprovedBy?: string;
  reason?: string;
}

export interface KycFieldChange {
  field: string;
  newValue: string;
}

export interface CreateKycChangeRequest {
  changeType: string;
  changes: KycFieldChange[];
  supportingDocUrl?: string;
  supportingDocuments?: { name: string; url: string }[];
  initiatedBy: string;
  reason?: string;
}

export interface KycDecisionRequest {
  comment: string;
  authorisedBy: string;
}

export interface KycChangeFilters {
  status?: string;
  changeType?: string;
  registerId?: string;
  initiatorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AccountKycHistoryFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface KycChangeListResponse {
  data: KycChange[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BatchKycActionRequest {
  ids: string[];
  comment: string;
  authorisedBy: string;
}

export interface BatchKycActionResponse {
  authorised: number;
  rejected: number;
  skipped: number;
  details: KycChange[];
}

export interface BulkUploadError {
  row: number;
  accountNumber: string;
  field: string;
  message: string;
}

export interface KycUploadJob {
  jobId: string;
  status: string;
  totalRows: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: BulkUploadError[];
  createdAt: string;
  completedAt: string;
}

//////////// estate admor //////////////

export interface Admon {
  id: number;
  registerId: string;

  deceasedAccountIds: string[];
  deceasedAccountNumbers: string[];

  deceasedHolderName: string;

  admonType: string;

  adminName: string;

  probateCourt: string;
  probateNumber: string;
  probateDate: string;
  probatePage: string;

  lodgementDate: string;

  adminAddress: string;
  adminCity: string;
  adminState: string;

  memo: string;

  changeAddressToAdmin: boolean;
  changeNameToEstate: boolean;

  estateNamePreview: string;

  probateDocUrl: string;

  status: string;

  initiatorId: string;
  initiatorName: string;

  authorisedBy: string;
  rejectionComment: string;

  createdAt: string;
  decidedAt: string;
}

export interface AdmonReversal {
  id: number;
  admonId: number;

  accountNumber: string;
  deceasedHolderName: string;
  currentAdminName: string;

  reason: string;

  status: string;

  initiatorId: string;
  initiatorName: string;

  authorisedBy: string;
  rejectionComment: string;

  createdAt: string;
  decidedAt: string;
}

export interface AdmonFilters {
  status?: string;
  registerId?: string;
  initiatorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AdmonReversalFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AdministratorRequest {
  isExecutor: boolean;
  adminName: string;
  email: string;
  phone: string;
  altPhone?: string;
  bvn: string;
  nin: string;
  idType: string;
  idNumber: string;
  relationship?: string;
  adminAddress: string;
  adminCity: string;
  adminState: string;
  memo?: string;
  documents?: { name: string; url: string }[];
}

export interface CreateAdmonRequest {
  registerId: string;
  registerIds?: string[];
  deceasedAccountIds: string[];

  administrators: AdministratorRequest[];

  admonType: string;

  probateCourt: string;
  probateNumber: string;
  probateDate: string;
  probatePage: string;

  lodgementDate: string;

  changeAddressToAdmin?: boolean;
  changeNameToEstate: boolean;

  probateDocUrl?: string;
  probateDocs?: { name: string; url: string }[];

  initiatedBy: string;
}

export interface AdmonDecisionRequest {
  comment: string;
  authorisedBy: string;
}

export interface CreateAdmonReversalRequest {
  reason: string;
  initiatedBy: string;
}

export interface AdmonListResponse {
  data: Admon[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdmonReversalListResponse {
  data: AdmonReversal[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdmonListResponse {
  data: Admon[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdmonReversalListResponse {
  data: AdmonReversal[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BatchAdmonRequest {
  ids: string[];
  comment: string;
  authorisedBy: string;
}

export interface BatchAdmonResponse {
  authorised: number;
  rejected: number;
  skipped: number;
  details: Admon[];
}
