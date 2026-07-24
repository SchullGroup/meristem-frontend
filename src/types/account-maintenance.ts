export interface ConsolidationAccount {
  accountNumber: string;
  holderName: string;
  holdings: number;
  registerName?: string;
  registerSymbol?: string;
  status?: string;
}

export interface DestinationAccount {
  accountNumber: string;
  holderName: string;
  registerName?: string;
  registerSymbol?: string;
  status?: string;
}

export interface Consolidation {
  id: number;
  registerId: string;
  registerNames?: string[];
  sourceAccounts: ConsolidationAccount[];
  destinationAccount: DestinationAccount;
  totalHoldings: number;
  comment: string;
  reason?: string;
  status: string;
  initiatorId: string;
  initiatorName: string;
  submittedBy?: string;
  authorisedBy: string | null;
  rejectedBy?: string | null;
  rejectionComment: string | null;
  rejectionReason?: string | null;
  reversalComment?: string | null;
  reversedAt?: string | null;
  createdAt: string;
  decidedAt: string | null;
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
  rgAccountNumber?: string;

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

  // Added for the cross-account KYC Change History view — not yet returned by
  // GET /accounts/kyc-changes (see backend_changes.md). Falls back to "—".
  registerSymbol?: string;
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

export interface KycCancelRequest {
  cancelledBy: string;
}

// ICU (2nd-level) approval that applies the change — see api-docs.json
// POST /accounts/kyc-changes/{changeId}/icu-approve.
export interface IcuApproveRequest {
  approvedBy: string;
  comment?: string;
}

// ── Account-scoped KYC: search, caution, documents & signatures ──────────────
// (see api-docs.json — /accounts/search, /accounts/{accountNumber}/caution,
//  /accounts/{accountNumber}/documents[/signature|/signatures])

export interface AccountSearchResult {
  accountId: string;
  accountNumber: string;
  fullName: string;
  registerId: string;
  registerName: string;
  holdings: number;
  status: string;
  chn: string;
}

export interface AccountSearchParams {
  q: string;
  excludeIds?: string[];
  limit?: number;
}

export interface CautionAccountRequest {
  cautionReasonCode: string;
  additionalNotes?: string;
  supportingDocumentUrl?: string;
  supportingDocumentName?: string;
  initiatedBy?: string;
}

export interface RemoveCautionParams {
  reason: string;
  initiatedBy?: string;
}

export interface KycDocumentEntry {
  documentType: string;
  documentUrl: string;
  refNumber?: string;
  fileName?: string;
}

export interface SubmitKycDocumentsRequest {
  documents: KycDocumentEntry[];
  reason: string;
  initiatedBy?: string;
}

export interface AccountKycDocument {
  id: string;
  accountNumber: string;
  chn: string;
  holderName: string;
  documentType: string;
  documentTypeName: string;
  documentName: string;
  documentRef: string;
  documentRefNumber: string;
  documentUrl: string;
  status: string;
  verifiedBy: string;
  verifiedAt: string;
  rejectionReason: string;
  kycChangeId: number;
  uploadedAt: string;
  createdAt: string;
}

export interface SubmitSignatureRequest {
  signatureUrl: string;
  reason: string;
  initiatedBy?: string;
}

export interface AccountSignature {
  id: string;
  accountNumber: string;
  chn: string;
  holderName: string;
  signatureUrl: string;
  status: string;
  active: boolean;
  reason: string;
  submittedBy: string;
  kycChangeId: number;
  capturedAt: string;
  createdAt: string;
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
  // Cross-field search: account number, holder name, BVN, NIN, CHN — see
  // backend_changes.md for the requested endpoint contract. Not yet
  // implemented server-side.
  q?: string;
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

// ── KYC bulk upload: preview + submit (full-record template) ──

export type BulkRowStatus = "valid" | "warning" | "error";

export interface KycBulkPreviewRow {
  row: number;
  accountNumber: string;
  shareholderName: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  nin: string;
  bvn: string;
  status: BulkRowStatus;
  errors: string[];
}

export interface KycBulkPreviewResponse {
  rows: KycBulkPreviewRow[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
}

export interface KycRowPayload {
  accountNumber: string;
  shareholderName: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  nin: string;
  bvn: string;
  supportingDocuments?: { name: string; url: string }[];
}

export interface KycBulkSubmitRequest {
  rows: KycRowPayload[];
  initiatedBy: string;
  registerId?: string;
}

export interface KycBulkSubmitResponse {
  batchId: string;
  totalRows: number;
  status: string;
}

// ── KYC bulk upload: per-row review state (frontend-only) ──

export type KycReviewDecision = "unreviewed" | "accepted" | "rejected";

export interface KycReviewRow extends KycBulkPreviewRow {
  decision: KycReviewDecision;
  documents: { name: string; url: string }[];
}

// ── NIBSS BVN mandate bulk upload: preview + submit ──

export interface NibssMandatePreviewRow {
  row: number;
  subscriberName: string;
  broker: string;
  chn: string;
  accountNumber: string;
  bankSortCode: string;
  stockbrokerCode: string;
  symbol: string;
  units: string;
  amount: string;
  remark: string;
  bvn: string;
  nin: string;
  tin: string;
  nextKin: string;
  gender: string;
  type: string;
  bankAccountNumber: string;
  phone: string;
  email: string;
  status: BulkRowStatus;
  errors: string[];
}

export interface NibssMandatePreviewResponse {
  rows: NibssMandatePreviewRow[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
}

export interface NibssMandateSubmitRequest {
  rows: (Omit<NibssMandatePreviewRow, "row" | "status" | "errors"> & {
    supportingDocuments?: { name: string; url: string }[];
  })[];
  initiatedBy: string;
}

export interface NibssMandateSubmitResponse {
  batchId: string;
  totalRows: number;
  status: string;
}

// ── NIBSS bulk upload: per-row review state (frontend-only) ──

export interface NibssReviewRow extends NibssMandatePreviewRow {
  decision: KycReviewDecision;
  documents: { name: string; url: string }[];
}

//////////// estate admor //////////////

export interface Admon {
  id: number;
  registerId: string;

  deceasedAccountIds: string[];
  deceasedAccountNumbers: string[];

  /** Detailed account info for the review panel (accounts, register, holdings, CHN). */
  deceasedAccounts?: {
    accountNumber: string;
    holderName: string;
    registerSymbol: string;
    chn: string;
    holdings: number;
  }[];

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

  changeNameToEstate: boolean;

  estateNamePreview: string;

  /** The single estate bank account that receives dividends from all deceased accounts after approval. */
  estateAccountNumber?: string;

  probateDocs: { name: string; url: string }[];

  administrators?: {
    adminName: string;
    isExecutor: boolean;
    email: string;
    phone: string;
    altPhone?: string;
    bvn: string;
    nin: string;
    idType: string;
    relationship?: string;
    adminAddress: string;
    adminCity: string;
    adminState: string;
    memo?: string;
    documents?: { name: string; url: string }[];
  }[];

  status: string;

  initiatorId: string;
  initiatorName: string;

  authorisedBy: string;
  authorisedAt: string;
  icuApprovedBy: string;
  icuApprovedAt: string;

  /** Reason provided when the request is returned to initiator for fixes. */
  returnedReason?: string;
  returnedBy?: string;
  returnedAt?: string;

  /** Who rejected this permanently (terminal). */
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionComment?: string;

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
  submittedAt: string;

  authorisedBy: string;
  authorisedAt: string;

  icuApprovedBy: string;
  icuApprovedAt: string;

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
  relationship?: string;
  adminAddress: string;
  adminCity: string;
  adminState: string;
  memo?: string;
  documents?: { name: string; url: string }[];
}

export interface CreateAdmonRequest {
  /** Set when updating an existing draft (PATCH). Omit for new records (POST). */
  id?: number;
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

  changeNameToEstate: boolean;

  probateDocs?: { name: string; url: string }[];

  initiatedBy: string;

  /** "DRAFT" | "SUBMITTED" — defaults to SUBMITTED if omitted */
  status?: string;
}

export interface AdmonDecisionRequest {
  comment: string;
  authorisedBy: string;
  /** "APPROVE" | "RETURN" | "REJECT" */
  action?: string;
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

export interface BatchAdmonReversalRequest {
  ids: string[];
  comment: string;
  authorisedBy: string;
}

export interface BatchAdmonReversalResponse {
  authorised: number;
  rejected: number;
  skipped: number;
  details: AdmonReversal[];
}
