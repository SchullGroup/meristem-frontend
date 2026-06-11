"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  Download,
  Loader2,
  AlertCircle,
  RefreshCcw,
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
import { cn, downloadCSVString } from "@/lib/utils";
import { toast } from "sonner";
import {
  useGetApplicationOfferReport,
  useExportApplicationOfferReport,
  useGetApplicationOfferSummaryReport,
  useExportApplicationOfferSummaryReport,
  useGetFullSubscriptionListReport,
  useExportFullSubscriptionListReport,
  useGetStateSummaryReport,
  useExportStateSummaryReport,
  useGetRangeAnalysisReport,
  useExportRangeAnalysisReport,
  useGetBatchSummaryReport,
  useExportBatchSummaryReport,
} from "@/hooks/useIPO";
import { useGetRegisters } from "@/hooks/useRegisters";
import { formatNumber } from "@/lib/utils/format";

const REPORT_TYPES = [
  "Application Offer",
  "Application Offer Summary",
  "Full Subscription List",
  "State Summary",
  "Range Analysis",
  "Summary Batch Report",
];

export default function IPOReports() {
  const { data: activeRegisters } = useGetRegisters({
    size: 1000,
    status: "ACTIVE",
  });

  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("all");
  const [reportRun, setReportRun] = useState(false);

  const registerParam =
    reportRegister === "all" || reportRegister === ""
      ? undefined
      : reportRegister;

  // Report Queries (only enabled when reportRun is true and the report type matches)
  const isReportSelected = (type: string) =>
    reportRun && selectedReport === type;

  // 1. Application Offer
  const {
    data: applicationOfferData,
    isLoading: isLoadingAppOffer,
    isError: isErrorAppOffer,
    refetch: refetchAppOffer,
  } = useGetApplicationOfferReport(
    { register: registerParam, page: 0, size: 2000 },
    { enabled: isReportSelected("Application Offer") },
  );
  const { mutate: exportAppOffer, isPending: isExportingAppOffer } =
    useExportApplicationOfferReport();

  // 2. Application Offer Summary
  const {
    data: appOfferSummaryData,
    isLoading: isLoadingAppOfferSummary,
    isError: isErrorAppOfferSummary,
    refetch: refetchAppOfferSummary,
  } = useGetApplicationOfferSummaryReport(registerParam, {
    enabled: isReportSelected("Application Offer Summary"),
  });
  const {
    mutate: exportAppOfferSummary,
    isPending: isExportingAppOfferSummary,
  } = useExportApplicationOfferSummaryReport();

  // 3. Full Subscription List
  const {
    data: fullSubListData,
    isLoading: isLoadingFullSubList,
    isError: isErrorFullSubList,
    refetch: refetchFullSubList,
  } = useGetFullSubscriptionListReport(
    { register: registerParam, page: 0, size: 2000 },
    { enabled: isReportSelected("Full Subscription List") },
  );
  const { mutate: exportFullSubList, isPending: isExportingFullSubList } =
    useExportFullSubscriptionListReport();

  // 4. State Summary
  const {
    data: stateSummaryData,
    isLoading: isLoadingStateSummary,
    isError: isErrorStateSummary,
    refetch: refetchStateSummary,
  } = useGetStateSummaryReport(registerParam, {
    enabled: isReportSelected("State Summary"),
  });
  const { mutate: exportStateSummary, isPending: isExportingStateSummary } =
    useExportStateSummaryReport();

  // 5. Range Analysis
  const {
    data: rangeAnalysisData,
    isLoading: isLoadingRangeAnalysis,
    isError: isErrorRangeAnalysis,
    refetch: refetchRangeAnalysis,
  } = useGetRangeAnalysisReport(registerParam, {
    enabled: isReportSelected("Range Analysis"),
  });
  const { mutate: exportRangeAnalysis, isPending: isExportingRangeAnalysis } =
    useExportRangeAnalysisReport();

  // 6. Summary Batch Report
  const {
    data: batchSummaryData,
    isLoading: isLoadingBatchSummary,
    isError: isErrorBatchSummary,
    refetch: refetchBatchSummary,
  } = useGetBatchSummaryReport(registerParam, {
    enabled: isReportSelected("Summary Batch Report"),
  });
  const { mutate: exportBatchSummary, isPending: isExportingBatchSummary } =
    useExportBatchSummaryReport();

  // Check overall loading state
  const isReportLoading =
    isLoadingAppOffer ||
    isLoadingAppOfferSummary ||
    isLoadingFullSubList ||
    isLoadingStateSummary ||
    isLoadingRangeAnalysis ||
    isLoadingBatchSummary;

  useEffect(() => {
    if (reportRun && !isReportLoading) {
      toast.success(`${selectedReport} generated.`);
    }
  }, [reportRun, selectedReport, isReportLoading]);

  // Check overall error state
  const isReportError =
    isErrorAppOffer ||
    isErrorAppOfferSummary ||
    isErrorFullSubList ||
    isErrorStateSummary ||
    isErrorRangeAnalysis ||
    isErrorBatchSummary;

  const handleRefetch = () => {
    switch (selectedReport) {
      case "Application Offer":
        refetchAppOffer();
        break;
      case "Application Offer Summary":
        refetchAppOfferSummary();
        break;
      case "Full Subscription List":
        refetchFullSubList();
        break;
      case "State Summary":
        refetchStateSummary();
        break;
      case "Range Analysis":
        refetchRangeAnalysis();
        break;
      case "Summary Batch Report":
        refetchBatchSummary();
        break;
    }
  };

  // Handle run report trigger
  const handleRunReport = () => {
    setReportRun(true);
  };

  // Handle export to CSV
  const handleExport = () => {
    const filename = `${selectedReport.toLowerCase().replace(/\s+/g, "-")}-report.csv`;

    const successCallback = {
      onSuccess: (csvContent: string) => {
        downloadCSVString(filename, csvContent);
        toast.success("Report exported successfully.");
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(`Export failed: ${message}`);
      },
    };

    switch (selectedReport) {
      case "Application Offer":
        exportAppOffer(registerParam, successCallback);
        break;
      case "Application Offer Summary":
        exportAppOfferSummary(registerParam, successCallback);
        break;
      case "Full Subscription List":
        exportFullSubList(registerParam, successCallback);
        break;
      case "State Summary":
        exportStateSummary(registerParam, successCallback);
        break;
      case "Range Analysis":
        exportRangeAnalysis(registerParam, successCallback);
        break;
      case "Summary Batch Report":
        exportBatchSummary(registerParam, successCallback);
        break;
      default:
        toast.error("Invalid report selection");
    }
  };

  const isExporting =
    isExportingAppOffer ||
    isExportingAppOfferSummary ||
    isExportingFullSubList ||
    isExportingStateSummary ||
    isExportingRangeAnalysis ||
    isExportingBatchSummary;

  return (
    <div className="space-y-4">
      {/* Type + filters bar */}
      <Card className="mrpsl-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedReport(r);
                setReportRun(false);
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
        <div className="border-t pt-4">
          <label className="mrpsl-label">Register</label>
          <div className="flex items-center gap-3 mt-1.5">
            <Select
              value={reportRegister}
              onValueChange={(v) => {
                setReportRegister(v ?? "all");
                setReportRun(false);
              }}
            >
              <SelectTrigger className="mrpsl-input w-64">
                <SelectValue placeholder="All Registers" />
              </SelectTrigger>
              <SelectContent className="w-max">
                <SelectItem value="all">All Registers</SelectItem>
                {activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.symbol}>
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
                <BarChart3 className="mr-2 h-4 w-4" />
              )}
              Run Report
            </Button>
            {reportRun && (
              <Button
                size="xl"
                variant="outline"
                className="px-5 shrink-0"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Report output */}
      {!reportRun ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-70">
          <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">
            {selectedReport}
          </p>
          <p className="text-sm mt-1">
            Select a register and click Run Report to generate the output.
          </p>
        </Card>
      ) : isReportLoading ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-70">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Loading report data...
          </p>
        </Card>
      ) : isReportError ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-red-500/80 min-h-70">
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
        <Card className="mrpsl-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <span className="font-semibold text-sm">{selectedReport}</span>
            <span className="text-[13px] text-muted-foreground">
              Generated {format(new Date(), "dd MMM yyyy, HH:mm")}
            </span>
          </div>

          {/* ── Application Offer ── */}
          {selectedReport === "Application Offer" && applicationOfferData && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">NAME</th>
                    <th className="px-4 py-2.5">CHN</th>
                    <th className="px-4 py-2.5">BROKER</th>
                    <th className="px-4 py-2.5">BANK</th>
                    <th className="px-4 py-2.5">ACCOUNT NO</th>
                    <th className="px-4 py-2.5 text-right">UNITS</th>
                    <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                    <th className="px-4 py-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(applicationOfferData.rows?.content || []).map((r, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.rowNumber || i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {r.subscriberName}
                      </td>
                      <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.broker}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.bank}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {r.accountNumber}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {r.units > 0 ? formatNumber(r.units) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {formatNumber(r.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          className={cn(
                            "border-0 text-[13px] font-normal",
                            r.status === "Approved" || r.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : r.status === "Disapproved" ||
                                  r.status === "DISAPPROVED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-700",
                          )}
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
                      colSpan={6}
                      className="px-4 py-2.5 text-right text-muted-foreground"
                    >
                      TOTALS (
                      {formatNumber(applicationOfferData.totalSubscribers)}{" "}
                      applications)
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatNumber(applicationOfferData.approvedCount)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      ₦
                      {(applicationOfferData.rows?.content || [])
                        .reduce((s, r) => s + r.amount, 0)
                        .toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Application Offer Summary ── */}
          {selectedReport === "Application Offer Summary" &&
            appOfferSummaryData && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2.5">STOCKBROKER</th>
                      <th className="px-4 py-2.5 text-right">APPLICATIONS</th>
                      <th className="px-4 py-2.5 text-right">APPROVED</th>
                      <th className="px-4 py-2.5 text-right">DISAPPROVED</th>
                      <th className="px-4 py-2.5 text-right">INVALID</th>
                      <th className="px-4 py-2.5 text-right">TOTAL UNITS</th>
                      <th className="px-4 py-2.5 text-right">
                        TOTAL AMOUNT (₦)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(appOfferSummaryData.rows || []).map((r, i) => (
                      <tr key={i} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 font-medium">
                          {r.stockbroker}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {formatNumber(r.applications)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-green-700 font-semibold">
                          {formatNumber(r.approved)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-amber-600 font-semibold">
                          {formatNumber(r.disapproved)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-red-600 font-semibold">
                          {formatNumber(r.invalid)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {formatNumber(r.totalUnits)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                          {formatNumber(r.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                    <tr>
                      <td className="px-4 py-2.5">TOTAL</td>
                      <td className="px-4 py-2.5 text-right">
                        {formatNumber(appOfferSummaryData.totalApplications)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-700">
                        {formatNumber(appOfferSummaryData.totalApproved)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-amber-600">
                        {formatNumber(appOfferSummaryData.totalDisapproved)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600">
                        {formatNumber(appOfferSummaryData.totalInvalid)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {formatNumber(appOfferSummaryData.grandTotalUnits)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {formatNumber(appOfferSummaryData.grandTotalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

          {/* ── Full Subscription List ── */}
          {selectedReport === "Full Subscription List" && fullSubListData && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">NAME</th>
                    <th className="px-4 py-2.5">CHN</th>
                    <th className="px-4 py-2.5">STOCKBROKER</th>
                    <th className="px-4 py-2.5">CSCS ACCOUNT NO</th>
                    <th className="px-4 py-2.5 text-right">UNITS SUBSCRIBED</th>
                    <th className="px-4 py-2.5 text-right">UNITS ALLOTTED</th>
                    <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                    <th className="px-4 py-2.5">CERT NO</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(fullSubListData.rows?.content || []).map((r, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.rowNumber || i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {r.subscriberName}
                      </td>
                      <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.stockbroker}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {r.cscsAccountNo}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.unitsSubscribed)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">
                        {formatNumber(r.unitsAllotted)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {formatNumber(r.amount)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {r.certNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-2.5 text-right text-muted-foreground"
                    >
                      TOTALS ({(fullSubListData.rows?.content || []).length}{" "}
                      allottees)
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {(fullSubListData.rows?.content || [])
                        .reduce((s, r) => s + r.unitsSubscribed, 0)
                        .toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-green-700">
                      {(fullSubListData.rows?.content || [])
                        .reduce((s, r) => s + r.unitsAllotted, 0)
                        .toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      ₦
                      {(fullSubListData.rows?.content || [])
                        .reduce((s, r) => s + r.amount, 0)
                        .toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── State Summary ── */}
          {selectedReport === "State Summary" && stateSummaryData && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-2.5">STATE</th>
                    <th className="px-4 py-2.5 text-right">SUBSCRIBERS</th>
                    <th className="px-4 py-2.5 text-right">% OF TOTAL</th>
                    <th className="px-4 py-2.5 text-right">TOTAL UNITS</th>
                    <th className="px-4 py-2.5 text-right">TOTAL AMOUNT (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(stateSummaryData.rows || []).map((r, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">{r.state}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.subscribers)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${r.percentOfTotal}%` }}
                            />
                          </div>
                          <span className="font-mono tabular w-10 text-right">
                            {r.percentOfTotal?.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.totalUnits)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {formatNumber(r.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                  <tr>
                    <td className="px-4 py-2.5">TOTAL</td>
                    <td className="px-4 py-2.5 text-right">
                      {formatNumber(stateSummaryData.totalSubscribers)}
                    </td>
                    <td className="px-4 py-2.5 text-right">100%</td>
                    <td className="px-4 py-2.5 text-right">
                      {(stateSummaryData.rows || [])
                        .reduce((s, r) => s + r.totalUnits, 0)
                        .toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      ₦
                      {(stateSummaryData.rows || [])
                        .reduce((s, r) => s + r.totalAmount, 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Range Analysis ── */}
          {selectedReport === "Range Analysis" && rangeAnalysisData && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-2.5">SUBSCRIPTION RANGE</th>
                    <th className="px-4 py-2.5 text-right">SUBSCRIBERS</th>
                    <th className="px-4 py-2.5 text-right">% OF TOTAL</th>
                    <th className="px-4 py-2.5 text-right">TOTAL UNITS</th>
                    <th className="px-4 py-2.5 text-right">TOTAL AMOUNT (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(rangeAnalysisData.rows || []).map((r, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">
                        {r.rangeLabel}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.subscribers)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${r.percentOfTotal}%` }}
                            />
                          </div>
                          <span className="font-mono tabular w-10 text-right">
                            {r.percentOfTotal.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.totalUnits)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {formatNumber(r.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                  <tr>
                    <td className="px-4 py-2.5">TOTAL</td>
                    <td className="px-4 py-2.5 text-right">
                      {formatNumber(rangeAnalysisData.totalSubscribers)}
                    </td>
                    <td className="px-4 py-2.5 text-right">100%</td>
                    <td className="px-4 py-2.5 text-right">
                      {formatNumber(rangeAnalysisData.grandTotalUnits)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      ₦{formatNumber(rangeAnalysisData.grandTotalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Summary Batch Report ── */}
          {selectedReport === "Summary Batch Report" && batchSummaryData && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-2.5">BATCH REF</th>
                    <th className="px-4 py-2.5">REGISTER</th>
                    <th className="px-4 py-2.5">DATE PROCESSED</th>
                    <th className="px-4 py-2.5 text-right">APPROVED</th>
                    <th className="px-4 py-2.5 text-right">DISAPPROVED</th>
                    <th className="px-4 py-2.5 text-right">INVALID</th>
                    <th className="px-4 py-2.5 text-right">TOTAL</th>
                    <th className="px-4 py-2.5 text-right">TOTAL AMOUNT (₦)</th>
                    <th className="px-4 py-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(batchSummaryData.rows || []).map((r, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {r.batchRef}
                      </td>
                      <td className="px-4 py-2.5 font-semibold">
                        {r.register}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {r.dateProcessed}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-green-700 font-semibold">
                        {formatNumber(r.approved)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-600 font-semibold">
                        {formatNumber(r.disapproved)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-600 font-semibold">
                        {formatNumber(r.invalid)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.total)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {formatNumber(r.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          className={cn(
                            "border-0 text-[13px] font-normal",
                            r.status === "Lodged" || r.status === "LODGED"
                              ? "bg-green-100 text-green-800"
                              : r.status === "ICU Approved" ||
                                  r.status === "ICU_APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800",
                          )}
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
                      colSpan={3}
                      className="px-4 py-2.5 text-right text-muted-foreground"
                    >
                      TOTALS ({batchSummaryData.totalBatches} batches)
                    </td>
                    <td className="px-4 py-2.5 text-right text-green-700">
                      {formatNumber(batchSummaryData.totalApproved)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-600">
                      {formatNumber(batchSummaryData.totalDisapproved)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-red-600">
                      {formatNumber(batchSummaryData.totalInvalid)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatNumber(batchSummaryData.grandTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      ₦{formatNumber(batchSummaryData.grandTotalAmount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
