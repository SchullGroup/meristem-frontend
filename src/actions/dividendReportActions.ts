import api from "@/services/api";
import { ApiResponse } from "@/types";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export interface ReportFilters {
  registerId?: string;
  dividendId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedReportFilters extends ReportFilters {
  page?: number;
  size?: number;
}

export interface LiabilityRow {
  serial: number;
  accountNumber: string;
  holderName: string;
  chn: string;
  units: number;
  grossDividend: number;
  whtAmount: number;
  netDividend: number;
}

export interface WhtRow {
  serial: number;
  accountNumber: string;
  holderName: string;
  holderType: string;
  units: number;
  grossDividend: number;
  whtRate: number;
  whtAmount: number;
  netDividend: number;
}

export interface PaymentStatusRow {
  serial: number;
  paymentNumber: string;
  registerSymbol: string;
  dividendType: string;
  qualificationDate: string;
  ratePerShare: number;
  grossLiability: number;
  whtAmount: number;
  netPayout: number;
  tier: number;
  status: string;
}

export interface UnclaimedRow {
  serial: number;
  warrantNumber: string;
  accountNumber: string;
  holderName: string;
  dividendNumber: string;
  amount: number;
  dateIssued: string;
  daysOutstanding: number;
  status: string;
}

export interface RegisterSummaryRow {
  registerSymbol: string;
  registerType: string;
  declarationCount: number;
  totalGrossLiability: number;
  totalWht: number;
  totalNetPayout: number;
  latestDividendType: string;
  latestRate: number;
}

export interface MandatePaymentRow {
  serial: number;
  accountNumber: string;
  holderName: string;
  newBank: string;
  bankAccountNumber: string;
  sortCode: string;
  amount: number;
  dividendNumber: string;
  status: string;
}

export interface DividendReport {
  registerSymbol: string;
  dividendNumber: string;
  rate: number;

  totalShareholders: number;
  shareholdersAssessed: number;
  totalUnits: number;
  totalGrossLiability: number;
  totalWht: number;
  totalNetPayout: number;

  liabilityRows: LiabilityRow[];
  whtRows: WhtRow[];

  totalDeclarations: number;
  authorizedOrPaid: number;
  pendingApproval: number;

  paymentStatusRows: PaymentStatusRow[];

  unclaimedWarrants: number;
  totalUnclaimedAmount: number;
  averageDaysOutstanding: number;

  unclaimedRows: UnclaimedRow[];

  byRegister: RegisterSummaryRow[];

  mandatePaymentRows: MandatePaymentRow[];

  page: number;
  size: number;
  totalElements: number;
}

export type ReportExportFormat = "EXCEL" | "PDF" | "CSV";

export type DividendReportType =
  | "wht-deduction"
  | "unclaimed-dividends"
  | "payment-status"
  | "mandate-payments"
  | "liability-register"
  | "declaration-summary";

export const exportDividendReport = async (
  reportType: DividendReportType,
  params: ReportFilters & {
    format?: ReportExportFormat;
  },
) => {
  try {
    const res = await api.get<Blob>(`/dividend/reports/${reportType}/export`, {
      params,
      responseType: "blob",
    });

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getWhtDeductionReport = async (params: PaginatedReportFilters) => {
  try {
    const res = await api.get<ApiResponse<DividendReport>>(
      "/dividend/reports/wht-deduction",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getUnclaimedDividendsReport = async (
  params: PaginatedReportFilters,
) => {
  try {
    const res = await api.get<ApiResponse<DividendReport>>(
      "/dividend/reports/unclaimed-dividends",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getPaymentStatusReport = async (
  params: PaginatedReportFilters,
) => {
  try {
    const res = await api.get<ApiResponse<DividendReport>>(
      "/dividend/reports/payment-status",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getMandatePaymentsReport = async (
  params: PaginatedReportFilters,
) => {
  try {
    const res = await api.get<ApiResponse<DividendReport>>(
      "/dividend/reports/mandate-payments",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getLiabilityRegisterReport = async (
  params: PaginatedReportFilters,
) => {
  try {
    const res = await api.get<ApiResponse<DividendReport>>(
      "/dividend/reports/liability-register",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const getDeclarationSummaryReport = async (
  params: Omit<ReportFilters, "dividendId">,
) => {
  try {
    const res = await api.get<ApiResponse<DividendReport>>(
      "/dividend/reports/declaration-summary",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ALL DIVIDEND NUMBERS (BELONGS IN DIVIDEND DECLARATION ACTIONS)
export const getDividendNumbers = async (params?: {
  registerId?: string;
  status?:
    | "DRAFT"
    | "PENDING_TIER2"
    | "PENDING_TIER3"
    | "PENDING_TIER4"
    | "AUTHORIZED"
    | "PAID"
    | "REJECTED"
    | "RECALLED";
}) => {
  try {
    const res = await api.get<ApiResponse<string[]>>(
      "/dividend/declarations/dividend-numbers",
      { params },
    );

    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
