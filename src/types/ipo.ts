export type IPOBatchType = "APPROVED" | "DISAPPROVED" | "INVALID";

export interface IPO {
  batchReference: string;
  register: string;
  batchDate: string;
  approvedCount: number;
  disapprovedCount: number;
  invalidCount: number;
  totalAmount: number;
  status: string;
  opsApprovedBy: string;
  opsApprovedAt: string;
  icuApprovedBy: string;
  icuApprovedAt: string;
}

export interface PendingApprovalParams {
  register?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface IPOSubscriber {
  accountNumber: string;
  address: string | null;
  amount: number;
  bank: string;
  broker: string;
  certNo: string;
  chn: string;
  country: string | null;
  cscsAccountNo: string;
  dateOfBirth: string | null; // or Date | null depending on your data parsing
  email: string | null;
  firstName: string | null;
  id: string; // UUID
  lastName: string | null;
  lga: string | null;
  middleName: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nin: string | null;
  phoneNumber: string | null;
  remark: string | null;
  state: string;
  stockbrokerCode: string;
  subscriberName: string;
  symbol: string;
  type: IPOBatchType;
  units: number;
}

export interface LodgementResponse {
  batchReference: string;
  register: string;
  status: string;
  previewRows: {
    stockbrokerCode: string;
    chn: string;
    shareholderName: string;
    certNo: string;
    cscsAccountNo: string;
    symbol: string;
    units: number;
  }[];
  totalRows: number;
}

export interface BatchSummaryResponse {
  register: string;
  generatedAt: string;
  rows: {
    batchRef: string;
    register: string;
    dateProcessed: string;
    approved: number;
    disapproved: number;
    invalid: number;
    total: number;
    totalAmount: number;
    status: string;
  }[];
  totalBatches: number;
  totalApproved: number;
  totalDisapproved: number;
  totalInvalid: number;
  grandTotal: number;
  grandTotalAmount: number;
}

export interface StateSummaryResponse {
  register: string;
  generatedAt: string;
  totalSubscribers: number;
  rows: {
    state: string;
    subscribers: number;
    percentOfTotal: number;
    totalUnits: number;
    totalAmount: number;
  }[];
}

export interface RangeAnalysisResponse {
  register: string;
  generatedAt: string;
  rows: {
    rangeLabel: string;
    subscribers: number;
    percentOfTotal: number;
    totalUnits: number;
    totalAmount: number;
  }[];
  totalSubscribers: number;
  grandTotalUnits: number;
  grandTotalAmount: number;
}

export interface FullSubscriptionListResponse {
  register: string;
  generatedAt: string;
  rows: {
    content: {
      rowNumber: number;
      subscriberName: string;
      chn: string;
      stockbroker: string;
      cscsAccountNo: string;
      unitsSubscribed: number;
      unitsAllotted: number;
      amount: number;
      certNo: string;
    }[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export interface ApplicationOfferResponse {
  register: string;
  generatedAt: string;
  totalSubscribers: number;
  approvedCount: number;
  disapprovedCount: number;
  invalidCount: number;
  rows: {
    content: {
      rowNumber: number;
      subscriberName: string;
      chn: string;
      broker: string;
      bank: string;
      accountNumber: string;
      units: number;
      amount: number;
      status: string;
    }[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export interface ApplicationOfferSummaryResponse {
  register: string;
  generatedAt: string;
  rows: {
    stockbroker: string;
    applications: number;
    approved: number;
    disapproved: number;
    invalid: number;
    totalUnits: number;
    totalAmount: number;
  }[];
  totalApplications: number;
  totalApproved: number;
  totalDisapproved: number;
  totalInvalid: number;
  grandTotalUnits: number;
  grandTotalAmount: number;
}
