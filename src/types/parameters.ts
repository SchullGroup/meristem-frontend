// ========================================
// types/currency.ts
// ========================================

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  reasonForChange: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyPayload {
  code: string;
  name: string;
  symbol: string;
  reasonForChange: string;
}

export interface UpdateCurrencyPayload {
  code: string;
  name: string;
  symbol: string;
  reasonForChange: string;
}

export interface GetCurrenciesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface TransformedCurrencies {
  content: Currency[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

// ========================================
// types/state.ts
// ========================================

export interface LGA {
  id: number;
  name: string;
  stateId: number;
  stateName: string;
}

export interface State {
  id: number;
  name: string;
  lgas: LGA[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStatePayload {
  name: string;
  lgas: string[];
}

export interface UpdateStatePayload {
  name: string;
  lgas: string[];
}

export interface TransformedStates {
  content: State[];
}

export interface GetStatesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// ========================================
// types/caution-reason.ts
// ========================================

export type CautionReasonSeverity = "High" | "Medium" | "Low";

export type CautionReasonStatus = "Active" | "Inactive";

export interface CautionReason {
  code: string;
  reason: string;
  category: string;
  status: string;
  severity?: CautionReasonSeverity;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCautionReasonPayload {
  reason: string;
  severity: CautionReasonSeverity;
  status: CautionReasonStatus;
  reasonForChange: string;
}

export interface UpdateCautionReasonPayload {
  reason: string;
  severity?: CautionReasonSeverity;
  status: CautionReasonStatus;
  reasonForChange: string;
}

export interface GetCautionReasonsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface TransformedCautionReasons {
  content: CautionReason[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

// ========================================
// types/document-type.ts
// ========================================

export type DocumentTypeStatus = "Active" | "Inactive";

export interface DocumentType {
  code: string;
  name: string;
  requiredFor: string[];
  status: string;
  reasonForChange: string;
}

export interface CreateDocumentTypePayload {
  name: string;
  requiredFor: string[];
  status: DocumentTypeStatus;
  reasonForChange: string;
}

export interface UpdateDocumentTypePayload {
  name: string;
  requiredFor: string[];
  status: DocumentTypeStatus;
  reasonForChange: string;
}
