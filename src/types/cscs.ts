export interface FlaggedTransaction {
    id: string;
    chn: string;
    register: string;
    holderName: string;
    transferNo: string;
    type: string;
    attemptedUnits: number;
    currentHoldings: number;
    shortfall: number;
    transactionDate: string;
    status: string;
    resolvedBy: string;
    resolvedAt: string;
    resolutionNote: string;
}

export interface ProcessedTransaction {
    id: string;
    transactionDate: string;
    batchRef: string;
    chn: string;
    register: string;
    holderName: string;
    transferNo: string;
    type: string;
    units: number;
    balanceAfter: number;
    processedBy: string;
}

export interface ProcessingQueue {
    id: string;
    batchRef: string;
    register: string;
    batchDate: string;
    totalTransactions: number;
    buyCount: number;
    sellCount: number;
    flaggedCount: number;
    status: string;
    processedBy: string;
}

export interface ProcessedFile {
    id: string;
    batchRef: string;
    register: string;
    batchDate: string;
    totalTransactions: number;
    buyCount: number;
    sellCount: number;
    flaggedCount: number;
    status: string;
    processedBy: string;
}

export interface ProcessingQueueResponse {
    content: Array<ProcessingQueue>;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface ProcessedLogsResponse {
    transactions: {
        content: Array<ProcessedTransaction>;
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        last: boolean;
    };
    totalBuyUnits: number;
    totalSellUnits: number;
    totalRecords: number;
}

export interface FlaggedTransactionsResponse {
    content: Array<FlaggedTransaction>;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface TransferRequest {
    id: string;
    sourceCertId: string;
    sourceCertNumber: string;
    registerId: string;
    registerSymbol: string;
    fromHolder: string;
    fromAccount: string;
    toHolder: string;
    toAccount: string;
    units: number;
    stampDuty: number;
    instrumentRef: string;
    iotDocumentUrl: string;
    reason: string;
    status: string;
    submittedBy: string;
    submittedAt: string;
    authoriserComment: string;
}

export interface TransferRequestParams {
    page?: number;
    pageSize?: number;
    registerId?: string;
    search?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    fromDate?: string;
    toDate?: string;
}

export interface SubmitTransferRequest {
    sourceCertId: string;
    toShareholderId: string;
    toAccountNumber: string;
    units: number;
    instrumentRef: string;
    stampDuty: number;
    iotDocumentUrl: string;
    reason: string;
    submittedBy: string
}

export interface CscsShareholder {
    accountNumber: string;
    bankAccountNumber: string;
    bankName: string;
    certNumber: string | null;
    certificateId: string | null;
    chn: string;
    firstName: string;
    holdings: number;
    id: string;
    lastName: string;
    registerId: string;
    registerName: string;
    registerSymbol: string;
    status: string
}

export interface ConsolidationRequestParams {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    registerId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number; // 1-based index
    pageSize?: number;
}

export interface SubmitConsolidationRequest {
    certIds: string[];
    newCertNumber: string;
    reason: string;
    submittedBy: string;
}

export interface BatchConsolidationRequestPayload {
    approveIds: string[];
    rejectIds: string[];
    rejectComment: string;
    authorisedBy: string
}

export interface Certificate {
    id: string;
    certNumber: string;
    registerId: string;
    registerName: string;
    registerSymbol: string;
    shareholderId: string;
    shareholderName: string;
    accountNumber: string;
    units: number;
    issueDate: string;
    status: string;
    transferNumber: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CertificateConsolidation {
    id: string;
    registerId: string;
    registerSymbol: string;
    accountNumber: string;
    holderName: string;
    newCertNumber: string;
    certCount: number;
    totalUnits: number;
    certificates: [
        {
            certNumber: string;
            units: number;
            issueDate: string
        }
    ];
    reason: string;
    status: string;
    submittedBy: string;
    submittedAt: string;
    authoriserComment: string;
}
export type CertificateStatus = 'ACTIVE' | 'DISABLED' | 'LODGED' | 'SPLIT' | 'TRANSFERRED';

export interface CertificateParams {
    page?: number;
    pageSize?: number;
    registerId?: string;
    certNumber?: string;
    shareholderId?: string;
    accountNumber?: string;
    status?: CertificateStatus;
    fromDate?: string;
    toDate?: string;
}