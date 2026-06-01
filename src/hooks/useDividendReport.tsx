import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  exportDividendReport,
  getDeclarationSummaryReport,
  getLiabilityRegisterReport,
  getMandatePaymentsReport,
  getPaymentStatusReport,
  getUnclaimedDividendsReport,
  getWhtDeductionReport,
  ReportFilters,
  PaginatedReportFilters,
  DividendReport,
  ReportExportFormat,
  DividendReportType,
} from "@/actions/dividendReportActions";
import { ApiResponse } from "@/types";

export interface ExportDividendReportParams extends ReportFilters {
  reportType: DividendReportType;
  format?: ReportExportFormat;
}

export const useExportDividendReport = (
  options?: Omit<
    UseMutationOptions<Blob, Error, ExportDividendReportParams>,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: ({ reportType, ...params }: ExportDividendReportParams) =>
      exportDividendReport(reportType, params),
    ...options,
  });
};
//WHT Deduction
export const useGetWhtDeductionReport = (
  params: PaginatedReportFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<DividendReport>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dividend-report", "wht-deduction", params],
    queryFn: () => getWhtDeductionReport(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
//Unclaimed Dividends
export const useGetUnclaimedDividendsReport = (
  params: PaginatedReportFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<DividendReport>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dividend-report", "unclaimed-dividends", params],
    queryFn: () => getUnclaimedDividendsReport(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Payment Status
export const useGetPaymentStatusReport = (
  params: PaginatedReportFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<DividendReport>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dividend-report", "payment-status", params],
    queryFn: () => getPaymentStatusReport(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Mandate Payments
export const useGetMandatePaymentsReport = (
  params: PaginatedReportFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<DividendReport>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dividend-report", "mandate-payments", params],
    queryFn: () => getMandatePaymentsReport(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Liability Register
export const useGetLiabilityRegisterReport = (
  params: PaginatedReportFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<DividendReport>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dividend-report", "liability-register", params],
    queryFn: () => getLiabilityRegisterReport(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Declaration Summary

export type DeclarationSummaryFilters = Omit<ReportFilters, "dividendId">;

export const useGetDeclarationSummaryReport = (
  params: DeclarationSummaryFilters,
  options?: Omit<
    UseQueryOptions<ApiResponse<DividendReport>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dividend-report", "declaration-summary", params],
    queryFn: () => getDeclarationSummaryReport(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};
