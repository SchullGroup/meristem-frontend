"use client";

import {
  FileSpreadsheet,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  RefreshCcw,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RIGHTS_REPORT_TYPES } from "@/lib/utils/constants";
import { useState, useRef, useEffect } from "react";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  ShholderRows,
  ShholderTableHead,
  ShholderTfoot,
} from "./entitlement-table";
import { PaginationBar } from "../pagination-bar";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";

// React Query hooks for rights reports
import {
  useGetRightsEntitlementReport,
  useGetAcceptanceSummaryReport,
  useGetNonAcceptanceReport,
  useGetTradedRightsReport,
  useGetAllotmentReport,
  useGetStateAnalysisReport,
  useGetRangeAnalysisReport,
} from "@/hooks/useRights";

// Direct API actions for exporting Excel blobs
import {
  getRightsEntitlementReport,
  exportAcceptanceSummaryReport,
  exportNonAcceptanceReport,
  getTradedRightsReport,
  exportAllotmentReport,
  exportStateAnalysisReport,
  exportRangeAnalysisReport,
} from "@/actions/rightsActions";
import {
  Shareholder,
  TradedRightsRow,
  RightsAllotmentRow,
  StateAnalysisRow,
  RangeAnalysisRow,
  RightsEntitlementResponse,
  RightsAcceptanceSummaryResponse,
  NonAcceptanceResponse,
  TradedRightsResponse,
  RightsAllotmentResponse,
  StateAnalysisResponse,
  RangeAnalysisResponse,
} from "@/types/rights";
import { ApiResponse } from "@/types";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils/format";

export default function RightsIssueReports() {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  // Page size (shared across all tables)
  const [pageSize, setPageSize] = useState(10);

  // Reports
  const [selectedReport, setSelectedReport] = useState(RIGHTS_REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPage, setReportPage] = useState(0);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Print function setup using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printAreaRef,
    documentTitle: `${selectedReport} - Report`,
  });

  const handlePrintTrigger = () => {
    toast.info("Opening print dialog...");
    handlePrint();
  };

  const registerParam = reportRegister || undefined;
  const isReportSelected = (type: string) => {
    return reportGenerated && selectedReport === type;
  };

  // 1. Rights Entitlement List
  const {
    data: rawEntitlementData,
    isLoading: isLoadingEntitlement,
    isError: isErrorEntitlement,
    refetch: refetchEntitlement,
  } = useGetRightsEntitlementReport(registerParam, "json", {
    enabled: isReportSelected("Rights Entitlement List"),
  });
  const entitlementData = rawEntitlementData as
    | ApiResponse<RightsEntitlementResponse>
    | undefined;

  // 2. Acceptance Summary
  const {
    data: rawAcceptanceSummaryData,
    isLoading: isLoadingAcceptanceSummary,
    isError: isErrorAcceptanceSummary,
    refetch: refetchAcceptanceSummary,
  } = useGetAcceptanceSummaryReport(registerParam, "json", {
    enabled: isReportSelected("Acceptance Summary"),
  });
  const acceptanceSummaryData = rawAcceptanceSummaryData as
    | ApiResponse<RightsAcceptanceSummaryResponse>
    | undefined;

  // 3. Non-Acceptance List
  const {
    data: rawNonAcceptanceData,
    isLoading: isLoadingNonAcceptance,
    isError: isErrorNonAcceptance,
    refetch: refetchNonAcceptance,
  } = useGetNonAcceptanceReport(registerParam, "json", {
    enabled: isReportSelected("Non-Acceptance List"),
  });
  const nonAcceptanceData = rawNonAcceptanceData as
    | ApiResponse<NonAcceptanceResponse>
    | undefined;

  // 4. Traded Rights Report
  const {
    data: rawTradedRightsData,
    isLoading: isLoadingTradedRights,
    isError: isErrorTradedRights,
    refetch: refetchTradedRights,
  } = useGetTradedRightsReport(registerParam, "json", {
    enabled: isReportSelected("Traded Rights Report"),
  });
  const tradedRightsData = rawTradedRightsData as
    | ApiResponse<TradedRightsResponse>
    | undefined;

  // 5. Allotment Report
  const {
    data: rawAllotmentData,
    isLoading: isLoadingAllotment,
    isError: isErrorAllotment,
    refetch: refetchAllotment,
  } = useGetAllotmentReport(registerParam, "json", {
    enabled: isReportSelected("Allotment Report"),
  });
  const allotmentData = rawAllotmentData as
    | ApiResponse<RightsAllotmentResponse>
    | undefined;

  // 6. State Analysis
  const {
    data: rawStateAnalysisData,
    isLoading: isLoadingStateAnalysis,
    isError: isErrorStateAnalysis,
    refetch: refetchStateAnalysis,
  } = useGetStateAnalysisReport(registerParam, "json", {
    enabled: isReportSelected("State Analysis"),
  });
  const stateAnalysisData = rawStateAnalysisData as
    | ApiResponse<StateAnalysisResponse>
    | undefined;

  // 7. Range Analysis
  const {
    data: rawRangeAnalysisData,
    isLoading: isLoadingRangeAnalysis,
    isError: isErrorRangeAnalysis,
    refetch: refetchRangeAnalysis,
  } = useGetRangeAnalysisReport(registerParam, "json", {
    enabled: isReportSelected("Range Analysis"),
  });
  const rangeAnalysisData = rawRangeAnalysisData as
    | ApiResponse<RangeAnalysisResponse>
    | undefined;

  // Combined loading and error states
  const isReportLoading =
    isLoadingEntitlement ||
    isLoadingAcceptanceSummary ||
    isLoadingNonAcceptance ||
    isLoadingTradedRights ||
    isLoadingAllotment ||
    isLoadingStateAnalysis ||
    isLoadingRangeAnalysis;

  const isReportError =
    isErrorEntitlement ||
    isErrorAcceptanceSummary ||
    isErrorNonAcceptance ||
    isErrorTradedRights ||
    isErrorAllotment ||
    isErrorStateAnalysis ||
    isErrorRangeAnalysis;

  const handleRefetch = () => {
    switch (selectedReport) {
      case "Rights Entitlement List":
        refetchEntitlement();
        break;
      case "Acceptance Summary":
        refetchAcceptanceSummary();
        break;
      case "Non-Acceptance List":
        refetchNonAcceptance();
        break;
      case "Traded Rights Report":
        refetchTradedRights();
        break;
      case "Allotment Report":
        refetchAllotment();
        break;
      case "State Analysis":
        refetchStateAnalysis();
        break;
      case "Range Analysis":
        refetchRangeAnalysis();
        break;
    }
  };

  /* handlers */

  const handleRunReport = () => {
    setReportGenerated(true);
    setReportPage(0);
    // toast.success(`${selectedReport} generated successfully.`);
  };

  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    setReportPage(0);
  };

  useEffect(() => {
    if (reportGenerated && !isReportLoading) {
      toast.success(`${selectedReport} generated successfully.`);
    }
  }, [reportGenerated, selectedReport, isReportLoading]);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const filename = `${selectedReport.toLowerCase().replace(/\s+/g, "-")}-report.xlsx`;
    toast.info("Preparing Excel download...");
    try {
      let data: Blob | any;
      switch (selectedReport) {
        case "Rights Entitlement List":
          data = await getRightsEntitlementReport(reportRegister, "excel");
          break;
        case "Acceptance Summary":
          data = await exportAcceptanceSummaryReport(reportRegister, "excel");
          break;
        case "Non-Acceptance List":
          data = await exportNonAcceptanceReport(reportRegister, "excel");
          break;
        case "Traded Rights Report":
          data = await getTradedRightsReport(reportRegister, "excel");
          break;
        case "Allotment Report":
          data = await exportAllotmentReport(reportRegister, "excel");
          break;
        case "State Analysis":
          data = await exportStateAnalysisReport(reportRegister, "excel");
          break;
        case "Range Analysis":
          data = await exportRangeAnalysisReport(reportRegister, "excel");
          break;
        default:
          toast.error("Unknown report type.");
          return;
      }

      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download Excel report.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Resolve all rows for pagination
  const getRowsForPagination = () => {
    if (
      selectedReport === "Rights Entitlement List" &&
      entitlementData?.data?.rows
    ) {
      return entitlementData?.data?.rows.map((row) => ({
        shareholderId: String(row.accountNumber),
        accountNumber: row.accountNumber,
        name: row.shareholderName,
        chn: row.chn,
        brokerCode: row.brokerCode,
        address: row.address,
        bankName: row.bankName,
        bankAccount: row.bankAccount,
        unitsHeld: row.unitsHeld,
        rightsRatio: row.rightsRatio || "—",
        rightsDue: row.rightsDue,
        amountPayable: row.amountPayable,
      }));
    }
    if (
      selectedReport === "Non-Acceptance List" &&
      nonAcceptanceData?.data?.rows
    ) {
      return nonAcceptanceData?.data?.rows.map((row) => ({
        shareholderId: String(row.accountNumber),
        accountNumber: row.accountNumber,
        name: row.shareholderName,
        chn: row.chn,
        brokerCode: row.brokerCode,
        address: row.address,
        bankName: row.bankName,
        bankAccount: row.bankAccount,
        unitsHeld: row.unitsHeld,
        rightsRatio: row.rightsRatio || "—",
        rightsDue: row.rightsDue,
        amountPayable: row.amountDue,
      }));
    }
    if (
      selectedReport === "Traded Rights Report" &&
      tradedRightsData?.data?.rows
    ) {
      return tradedRightsData?.data?.rows;
    }
    if (selectedReport === "Allotment Report" && allotmentData?.data?.rows) {
      return allotmentData?.data?.rows;
    }
    if (selectedReport === "State Analysis" && stateAnalysisData?.data?.rows) {
      return stateAnalysisData?.data?.rows;
    }
    if (selectedReport === "Range Analysis" && rangeAnalysisData?.data?.rows) {
      return rangeAnalysisData?.data?.rows;
    }
    return [];
  };

  const allRows = getRowsForPagination();
  const totalRecords = allRows.length;
  const reportStart = reportPage * pageSize;
  const paginatedRows = allRows.slice(reportStart, reportStart + pageSize);

  const getRecordCount = () => {
    if (selectedReport === "Acceptance Summary") {
      return 1;
    }
    return totalRecords;
  };

  const selectedRegisterDetails = activeRegisters?.content?.find(
    (r) => r.registerId === reportRegister,
  );

  return (
    <>
      {/* Report type pills */}
      <Card className="mrpsl-card">
        <div className="p-4 border-b bg-muted/20">
          <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            Report Type
          </p>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {RIGHTS_REPORT_TYPES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedReport(r);
                setReportGenerated(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedReport === r
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="mrpsl-card p-5">
        <label className="mrpsl-label">Register</label>
        <div className="flex items-center gap-3 mt-1.5">
          <Select
            value={reportRegister}
            onValueChange={(v) => {
              setReportRegister(v ?? "");
              setReportGenerated(false);
            }}
          >
            <SelectTrigger className="mrpsl-input w-64">
              <SelectValue placeholder="Select Register" />
            </SelectTrigger>
            <SelectContent className="w-max">
              <SelectItem value="">All Registers</SelectItem>
              {activeRegisters?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.registerId}>
                  {r.registerName} · {r.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="xl"
            className="px-6 font-semibold shrink-0"
            onClick={handleRunReport}
            disabled={isReportLoading}
          >
            {isReportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>
      </Card>

      {!reportGenerated ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[280px]">
          <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">
            {selectedReport}
          </p>
          <p className="text-sm mt-1">
            Select a register and click Generate Report to view the output.
          </p>
        </Card>
      ) : isReportLoading ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[280px]">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Loading report data...
          </p>
        </Card>
      ) : isReportError ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-red-500/80 min-h-[280px]">
          <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Failed to load report data
          </p>
          <p className="text-sm mt-1 text-muted-foreground mb-4">
            There was an error retrieving the {selectedReport} data.
          </p>
          <Button variant="outline" onClick={handleRefetch}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </Card>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {/* Export bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              {selectedReport} — {getRecordCount().toLocaleString()} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
              >
                {isExportingExcel ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                )}
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintTrigger}>
                <Download className="mr-1.5 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintTrigger}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
            </div>
          </div>

          <div ref={printAreaRef} className="space-y-4">
            {/* Print header (visible only in print preview / save as PDF) */}
            <div className="hidden print:block mb-6 border-b pb-4">
              <h2 className="text-xl font-bold uppercase">{selectedReport}</h2>
              <div className="text-sm text-muted-foreground mt-1 flex justify-between">
                <span>
                  Register: {selectedRegisterDetails?.registerName || "—"}
                </span>
                <span>
                  Generated: {format(new Date(), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            </div>

            {/* ── Rights Entitlement List or Non-Acceptance List ── */}
            {(selectedReport === "Rights Entitlement List" ||
              selectedReport === "Non-Acceptance List") && (
                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <ShholderTableHead />
                      <tbody className="divide-y">
                        <ShholderRows rows={paginatedRows as Shareholder[]} />
                      </tbody>
                      <ShholderTfoot
                        rows={paginatedRows as Shareholder[]}
                        total={totalRecords}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={reportPage}
                    total={totalRecords}
                    onPageChange={setReportPage}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Card>
              )}

            {/* ── Acceptance Summary ── */}
            {selectedReport === "Acceptance Summary" &&
              acceptanceSummaryData && (
                <Card className="mrpsl-card overflow-hidden">
                  <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/10 print:grid-cols-2 print:gap-4 print:p-4">
                    <div className="p-4 bg-background rounded-lg border flex flex-col justify-center">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        Acceptance Rate
                      </span>
                      <span className="text-2xl font-bold text-green-600 mt-1">
                        {acceptanceSummaryData?.data?.acceptanceRate?.toFixed(
                          2,
                        )}
                        %
                      </span>
                    </div>
                    <div className="p-4 bg-background rounded-lg border flex flex-col justify-center">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        Non-Acceptance Rate
                      </span>
                      <span className="text-2xl font-bold text-amber-600 mt-1">
                        {acceptanceSummaryData?.data?.nonAcceptanceRate?.toFixed(
                          2,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="mrpsl-table-header">
                        <tr>
                          <th className="px-4 py-2.5">CATEGORY</th>
                          <th className="px-4 py-2.5 text-right">
                            SHAREHOLDERS
                          </th>
                          <th className="px-4 py-2.5 text-right">UNITS HELD</th>
                          <th className="px-4 py-2.5 text-right">RIGHTS</th>
                          <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono">
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                            Eligible Entitlements
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalEntitled,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalUnitsHeld,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalRightsDue,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatCurrency(
                              acceptanceSummaryData?.data?.totalAmountDue,
                            )}
                          </td>
                        </tr>
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-green-700">
                            Accepted Rights
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalAccepted,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalUnitsAccepted,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalRightsAccepted,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatCurrency(
                              acceptanceSummaryData?.data?.totalAmountAccepted,
                            )}
                          </td>
                        </tr>
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-red-700">
                            Disapproved Rights
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalDisapproved,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data
                                ?.totalUnitsDisapproved,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-red-700">
                            {formatNumber(
                              acceptanceSummaryData?.data
                                ?.totalRightsDisapproved,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatCurrency(
                              acceptanceSummaryData?.data
                                ?.totalAmountDisapproved,
                            )}
                          </td>
                        </tr>
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-amber-700">
                            Invalid Rights
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalInvalid,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalUnitsInvalid,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-amber-700">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalRightsInvalid,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatCurrency(
                              acceptanceSummaryData?.data?.totalAmountInvalid,
                            )}
                          </td>
                        </tr>
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-muted-foreground">
                            Non-Acceptance (Forfeited)
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data?.totalNotAccepted,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(
                              acceptanceSummaryData?.data
                                ?.totalUnitsNotAccepted,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            {formatNumber(
                              acceptanceSummaryData?.data
                                ?.totalRightsNotAccepted,
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatCurrency(
                              acceptanceSummaryData?.data
                                ?.totalAmountNotAccepted,
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

            {/* ── Traded Rights Report ── */}
            {selectedReport === "Traded Rights Report" && tradedRightsData && (
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">#</th>
                        <th className="px-4 py-2.5">REGISTRAR A/C</th>
                        <th className="px-4 py-2.5">SHAREHOLDER NAME</th>
                        <th className="px-4 py-2.5">CHN</th>
                        <th className="px-4 py-2.5">BROKER CODE</th>
                        <th className="px-4 py-2.5">MEMBER CODE</th>
                        <th className="px-4 py-2.5 text-right">
                          VOLUME TRADED
                        </th>
                        <th className="px-4 py-2.5">LODGED DATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px] font-mono">
                      {(paginatedRows as TradedRightsRow[]).map((r, i) => (
                        <tr key={i} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 text-muted-foreground font-sans">
                            {reportStart + i + 1}
                          </td>
                          <td className="px-4 py-2.5">{r.registrarsAccount}</td>
                          <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                            {r.shareholderName}
                          </td>
                          <td className="px-4 py-2.5">{r.chn}</td>
                          <td className="px-4 py-2.5">{r.brokerCode}</td>
                          <td className="px-4 py-2.5">{r.memberCode}</td>
                          <td className="px-4 py-2.5 text-right text-blue-600 font-semibold">
                            {formatNumber(r.volume)}
                          </td>
                          <td className="px-4 py-2.5 font-sans">
                            {formatDate(r.lodgedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-2.5 text-right text-muted-foreground font-sans"
                        >
                          TOTAL VOLUME TRADED
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-600">
                          {formatNumber(
                            tradedRightsData?.data?.totalVolumeTraded,
                          )}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <PaginationBar
                  page={reportPage}
                  total={totalRecords}
                  onPageChange={setReportPage}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Card>
            )}

            {/* ── Allotment Report ── */}
            {selectedReport === "Allotment Report" && allotmentData && (
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                        <th className="px-3 py-2.5">CHN</th>
                        <th className="px-3 py-2.5">STOCKBROKER</th>
                        <th className="px-3 py-2.5">BANK ACCOUNT</th>
                        <th className="px-3 py-2.5 text-right">UNITS HELD</th>
                        <th className="px-3 py-2.5 text-right">RIGHTS DUE</th>
                        <th className="px-3 py-2.5 text-right">
                          SHARES ALLOTTED
                        </th>
                        <th className="px-3 py-2.5 text-right">
                          AMOUNT PAYABLE (₦)
                        </th>
                        <th className="px-3 py-2.5 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px] font-mono">
                      {(paginatedRows as RightsAllotmentRow[]).map((r, i) => (
                        <tr key={i} className="mrpsl-table-row">
                          <td className="px-3 py-2.5 text-muted-foreground font-sans">
                            {reportStart + i + 1}
                          </td>
                          <td className="px-3 py-2.5 font-sans font-medium text-foreground">
                            {r.shareholderName}
                          </td>
                          <td className="px-3 py-2.5">{r.chn}</td>
                          <td className="px-3 py-2.5">{r.brokerCode}</td>
                          <td
                            className="px-3 py-2.5 truncate max-w-[150px] font-sans"
                            title={
                              r.bankName
                                ? `${r.bankName} - ${r.accountNo}`
                                : undefined
                            }
                          >
                            {r.bankName
                              ? `${r.bankName} (A/C: ${r.accountNo})`
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {formatNumber(r.unitsHeld)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-blue-600">
                            {formatNumber(r.rightsDue)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-green-700 font-semibold">
                            {formatNumber(r.certShares)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {formatCurrency(r.amountPayable)}
                          </td>
                          <td className="px-3 py-2.5 text-center font-sans">
                            <Badge
                              className={cn(
                                "border-0 text-[12px] font-normal",
                                r.status === "Approved" ||
                                  r.status === "APPROVED" ||
                                  r.status === "Allotted"
                                  ? "bg-green-100 text-green-800"
                                  : r.status === "Waived" ||
                                    r.status === "WAIVED"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800",
                              )}
                              title={r.reason || undefined}
                            >
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-2.5 text-right text-muted-foreground font-sans"
                        >
                          PAGE TOTALS
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {formatNumber(
                            (paginatedRows as RightsAllotmentRow[]).reduce(
                              (a: number, r: RightsAllotmentRow) =>
                                a + (r.unitsHeld || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-blue-600">
                          {formatNumber(
                            (paginatedRows as RightsAllotmentRow[]).reduce(
                              (a: number, r: RightsAllotmentRow) =>
                                a + (r.rightsDue || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-green-700">
                          {formatNumber(
                            (paginatedRows as RightsAllotmentRow[]).reduce(
                              (a: number, r: RightsAllotmentRow) =>
                                a + (r.certShares || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {formatCurrency(
                            (paginatedRows as RightsAllotmentRow[]).reduce(
                              (a: number, r: RightsAllotmentRow) =>
                                a + (r.amountPayable || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <PaginationBar
                  page={reportPage}
                  total={totalRecords}
                  onPageChange={setReportPage}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Card>
            )}

            {/* ── State Analysis ── */}
            {selectedReport === "State Analysis" && stateAnalysisData && (
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3">STATE</th>
                        <th className="px-4 py-3 text-right">SHAREHOLDERS</th>
                        <th className="px-4 py-3 text-right">% OF SHs</th>
                        <th className="px-4 py-3 text-right">TOTAL UNITS</th>
                        <th className="px-4 py-3 text-right">RIGHTS DUE</th>
                        <th className="px-4 py-3 text-right">
                          TOTAL AMOUNT (₦)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px] font-mono">
                      {(paginatedRows as StateAnalysisRow[]).map((r, i) => (
                        <tr key={i} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                            {r.state}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(r.shareholders)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2 font-mono">
                              <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden print:hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${r.percentageShareholders || 0}%`,
                                  }}
                                />
                              </div>
                              <span>
                                {(r.percentageShareholders || 0).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(r.unitsHeld)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-600">
                            {formatNumber(r.rightsDue)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold">
                            {formatCurrency(r.amountDue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td className="px-4 py-2.5 font-sans">TOTALS</td>
                        <td className="px-4 py-2.5 text-right">
                          {formatNumber(
                            stateAnalysisData?.data?.totalShareholders,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-sans">
                          100%
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {formatNumber(
                            stateAnalysisData?.data?.totalUnitsHeld,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-600">
                          {formatNumber(
                            stateAnalysisData?.data?.totalRightsDue,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {formatCurrency(
                            stateAnalysisData?.data?.totalAmountDue,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <PaginationBar
                  page={reportPage}
                  total={totalRecords}
                  onPageChange={setReportPage}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Card>
            )}

            {/* ── Range Analysis ── */}
            {selectedReport === "Range Analysis" && rangeAnalysisData && (
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3">UNITS RANGE</th>
                        <th className="px-4 py-3 text-right">SHAREHOLDERS</th>
                        <th className="px-4 py-3 text-right">% OF SHs</th>
                        <th className="px-4 py-3 text-right">
                          TOTAL UNITS HELD
                        </th>
                        <th className="px-4 py-3 text-right">RIGHTS DUE</th>
                        <th className="px-4 py-3 text-right">AMOUNT DUE (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px] font-mono">
                      {(paginatedRows as RangeAnalysisRow[]).map((r, i) => (
                        <tr key={i} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                            {r.rangeLabel}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(r.shareholders)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2 font-mono">
                              <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden print:hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${r.percentage || 0}%` }}
                                />
                              </div>
                              <span>{(r.percentage || 0).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {formatNumber(r.unitsHeld)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-600">
                            {formatNumber(r.rightsDue)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold">
                            {formatCurrency(r.amountDue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td className="px-4 py-2.5 font-sans">TOTALS</td>
                        <td className="px-4 py-2.5 text-right">
                          {formatNumber(
                            rangeAnalysisData?.data?.totalShareholders,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-sans">
                          100%
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {formatNumber(
                            rangeAnalysisData?.data?.totalUnitsHeld,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-600">
                          {formatNumber(
                            rangeAnalysisData?.data?.totalRightsDue,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {formatCurrency(
                            rangeAnalysisData?.data?.totalAmountDue,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <PaginationBar
                  page={reportPage}
                  total={totalRecords}
                  onPageChange={setReportPage}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
