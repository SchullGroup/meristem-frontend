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

// ─────────────────────────────────────────────────────────────────────────────
// Reports without a live endpoint yet — Mandated Account, Mandated Unpaid
// Dividend Exceptions, UFTF Statutory Remittance. These return DUMMY data shaped
// like the real endpoints. To integrate, uncomment the api.get line in each
// action, delete the dummy return, and adjust field names if the backend differs.
// ─────────────────────────────────────────────────────────────────────────────

export interface MandatedAccountRow {
  serial: number;
  accountNumber: string;
  holderName: string;
  chn: string;
  registerSymbol: string;
  bankName: string;
  bankAccountNumber: string;
  sortCode: string;
  bvn: string;
  mandateDate: string;
  status: string;
}

export interface MandatedAccountReport {
  totalMandatedAccounts: number;
  rows: MandatedAccountRow[];
  page: number;
  size: number;
  totalElements: number;
}

export interface MandatedUnpaidExceptionRow {
  serial: number;
  accountNumber: string;
  holderName: string;
  dividendNumber: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  exceptionReason: string;
  daysOutstanding: number;
  status: string;
}

export interface MandatedUnpaidExceptionsReport {
  totalExceptions: number;
  totalUnpaidAmount: number;
  rows: MandatedUnpaidExceptionRow[];
  page: number;
  size: number;
  totalElements: number;
}

export interface UftfRemittanceRow {
  serial: number;
  accountNumber: string;
  holderName: string;
  dividendNumber: string;
  amount: number;
  declarationDate: string;
  yearsUnclaimed: number;
  remittanceStatus: string;
}

export interface UftfStatutoryRemittanceReport {
  totalAccounts: number;
  totalRemittableAmount: number;
  rows: UftfRemittanceRow[];
  page: number;
  size: number;
  totalElements: number;
}

// ── Dummy helpers ──
function ok<T>(data: T): ApiResponse<T> {
  return {
    isSuccessful: true,
    responseMessage: "Success (dummy data)",
    responseCode: "00",
    statusCode: "200",
    time: new Date().toISOString(),
    data,
  };
}
function reportDelay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms));
}
const RPT_NAMES = [
  "John Adeyemi",
  "Sarah Okafor",
  "Emeka Nwachukwu",
  "Fatimah Ibrahim",
  "Taiwo Adesanya",
  "Blessing Osei",
  "Ibrahim Musa",
  "Grace Adebayo",
  "Obinna Eze",
  "Halima Sani",
  "Chidi Okonkwo",
  "Ngozi Umeh",
];
const RPT_BANKS = [
  { name: "GTBank", sort: "058" },
  { name: "Zenith Bank", sort: "057" },
  { name: "Access Bank", sort: "044" },
  { name: "First Bank", sort: "011" },
  { name: "UBA", sort: "033" },
  { name: "Fidelity Bank", sort: "070" },
];
const RPT_REGS = ["MTNN", "GTCO", "DANGCEM", "ZENITHBANK", "NESTLE"];
function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pk<T>(arr: T[]): T {
  return arr[ri(0, arr.length - 1)];
}
function digits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += ri(0, 9);
  return s;
}
function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().split("T")[0];
}
// Number of rows to render on the current page given a fixed grand total.
function pageCount(total: number, page: number, size: number) {
  return Math.max(0, Math.min(size, total - page * size));
}

// ── Mandated Account Report ──
export const getMandatedAccountReport = async (
  params: PaginatedReportFilters,
): Promise<ApiResponse<MandatedAccountReport>> => {
  // Integration: replace the dummy below with the real endpoint.
  // return (await api.get<ApiResponse<MandatedAccountReport>>("/dividend/reports/mandated-account", { params })).data;
  await reportDelay();
  const size = params.size ?? 20;
  const page = params.page ?? 0;
  const total = 47;
  const rows: MandatedAccountRow[] = Array.from({
    length: pageCount(total, page, size),
  }).map((_, i) => {
    const bank = pk(RPT_BANKS);
    return {
      serial: page * size + i + 1,
      accountNumber: `ACC-${digits(6)}`,
      holderName: pk(RPT_NAMES),
      chn: `CHN${digits(8)}`,
      registerSymbol: params.registerId || pk(RPT_REGS),
      bankName: bank.name,
      bankAccountNumber: digits(10),
      sortCode: bank.sort,
      bvn: digits(11),
      mandateDate: daysAgo(ri(1, 720)),
      status: "Mandated",
    };
  });
  return ok({ totalMandatedAccounts: total, rows, page, size, totalElements: total });
};

// ── Mandated Unpaid Dividend Exceptions Report ──
const EXCEPTION_REASONS = [
  "Bank returned funds — account dormant",
  "BVN mismatch flagged on last run",
  "Mandate updated after payment cut-off",
  "Account name mismatch at destination bank",
  "Duplicate warrant held for review",
  "Payment failed — destination bank timeout",
];
export const getMandatedUnpaidExceptionsReport = async (
  params: PaginatedReportFilters,
): Promise<ApiResponse<MandatedUnpaidExceptionsReport>> => {
  // Integration: replace the dummy below with the real endpoint.
  // return (await api.get<ApiResponse<MandatedUnpaidExceptionsReport>>("/dividend/reports/mandated-unpaid-exceptions", { params })).data;
  await reportDelay();
  const size = params.size ?? 20;
  const page = params.page ?? 0;
  const total = 32;
  const rows: MandatedUnpaidExceptionRow[] = Array.from({
    length: pageCount(total, page, size),
  }).map((_, i) => {
    const bank = pk(RPT_BANKS);
    const reg = params.registerId || pk(RPT_REGS);
    return {
      serial: page * size + i + 1,
      accountNumber: `ACC-${digits(6)}`,
      holderName: pk(RPT_NAMES),
      dividendNumber: `${reg}-DIV-2024/${ri(1, 4)}`,
      amount: ri(3_000, 480_000),
      bankName: bank.name,
      bankAccountNumber: digits(10),
      exceptionReason: pk(EXCEPTION_REASONS),
      daysOutstanding: ri(15, 540),
      status: "Unpaid",
    };
  });
  return ok({
    totalExceptions: total,
    totalUnpaidAmount: total * 95_000,
    rows,
    page,
    size,
    totalElements: total,
  });
};

// ── UFTF Statutory Remittance Report ──
export const getUftfStatutoryRemittanceReport = async (
  params: PaginatedReportFilters,
): Promise<ApiResponse<UftfStatutoryRemittanceReport>> => {
  // Integration: replace the dummy below with the real endpoint.
  // return (await api.get<ApiResponse<UftfStatutoryRemittanceReport>>("/dividend/reports/uftf-statutory-remittance", { params })).data;
  await reportDelay();
  const size = params.size ?? 20;
  const page = params.page ?? 0;
  const total = 25;
  const rows: UftfRemittanceRow[] = Array.from({
    length: pageCount(total, page, size),
  }).map((_, i) => {
    const reg = params.registerId || pk(RPT_REGS);
    const years = ri(6, 12);
    return {
      serial: page * size + i + 1,
      accountNumber: `ACC-${digits(6)}`,
      holderName: pk(RPT_NAMES),
      dividendNumber: `${reg}-DIV-${2024 - years}/${ri(1, 4)}`,
      amount: ri(2_000, 300_000),
      declarationDate: daysAgo(years * 365 + ri(0, 200)),
      yearsUnclaimed: years,
      remittanceStatus: pk(["Due", "Remitted", "Pending"]),
    };
  });
  return ok({
    totalAccounts: total,
    totalRemittableAmount: total * 60_000,
    rows,
    page,
    size,
    totalElements: total,
  });
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
