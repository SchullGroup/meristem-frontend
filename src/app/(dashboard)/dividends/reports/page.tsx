"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
// Report sub-components
import LiabilityRegisterReport from "@/components/custom/dividend-reports/liability-register-report";
import WhtDeductionReport from "@/components/custom/dividend-reports/wht-deduction-report";
import PaymentStatusReport from "@/components/custom/dividend-reports/payment-status-report";
import UnclaimedDividendsReport from "@/components/custom/dividend-reports/unclaimed-dividends-report";
import DeclarationSummaryReport from "@/components/custom/dividend-reports/declaration-summary-report";
import MandatePaymentReport from "@/components/custom/dividend-reports/mandate-payment-report";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getDividendNumbers } from "@/actions/dividendReportActions";
import { PaginationBar } from "@/components/custom/pagination-bar";
const REPORT_TYPES = [
  "Dividend Liability Register",
  "WHT Deduction Report",
  "Payment Status Report",
  "Unclaimed Dividends Report",
  "Declaration Summary",
  "Mandate Payment Report",
] as const;
type ReportType = (typeof REPORT_TYPES)[number];

export default function DividendReportsPage() {
  const [reportRegister, setReportRegister] = useState("all");
  const [selectedReport, setSelectedReport] = useState<ReportType>(
    "Dividend Liability Register",
  );
  const [reportDividend, setReportDividend] = useState("all");
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [reportGenerated, setReportGenerated] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Active registers for the Register filter
  const { data: activeRegisters } = useGetRegisters({
    size: 1000,
    status: "ACTIVE",
  });

  const { data: activeDividends } = useQuery({
    queryKey: ["dividend-numbers"],
    queryFn: () => getDividendNumbers(),
  });

  // Shared filter params for all reports
  const sharedFilters = {
    registerId: reportRegister || undefined,
    dividendId: reportDividend || undefined,
    dateFrom: reportDateRange?.from
      ? format(reportDateRange.from, "yyyy-MM-dd")
      : undefined,
    dateTo: reportDateRange?.to
      ? format(reportDateRange.to, "yyyy-MM-dd")
      : undefined,
    size: pageSize,
    page: page
  };

  function handleRunReport() {
    setPage(0);
    setTotal(0);
    setReportGenerated(true);
    toast.success(`${selectedReport} generated.`);
  }

  function handleReportTypeChange(r: ReportType) {
    setSelectedReport(r);
    setReportGenerated(false);
    setPage(0);
    setTotal(0);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dividend Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate, export, and print dividend management reports
        </p>
      </div>

      {/* Report type selector */}
      <Card className="mrpsl-card">
        <div className="px-5 py-3 border-b bg-muted/20">
          <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            Report Type
          </p>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {REPORT_TYPES.map((r) => (
            <button
              key={r}
              onClick={() => handleReportTypeChange(r)}
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
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          {/* Register */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Register</label>
            <Select
              value={reportRegister}
              onValueChange={(v) => {
                setReportRegister(v ?? "");
                setReportGenerated(false);
                setPage(0);
                setTotal(0);
              }}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="All Registers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Registers</SelectItem>
                {activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.registerId}>
                    {r.registerName} · {r.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dividend filter (only shown for reports that need it) */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Dividend Number</label>
            <Select
              value={reportDividend}
              onValueChange={(v) => {
                setReportDividend(v ?? "");
                setReportGenerated(false);
                setPage(0);
                setTotal(0);
              }}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="All Dividends" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Dividends</SelectItem>
                {activeDividends?.data?.map((r, i) => (
                  <SelectItem key={i} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Date Range</label>
            <DateRangePicker
              className="mt-0"
              date={reportDateRange}
              setDate={setReportDateRange}
            />
          </div>

          <Button
            size="lg"
            className="px-6 font-semibold"
            onClick={handleRunReport}
          >
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Empty state — report not yet generated */}
      {!reportGenerated && (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-70">
          <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">
            {selectedReport}
          </p>
          <p className="text-sm mt-1">
            Configure your filters and click <strong>Generate Report</strong> to
            view the output.
          </p>
        </Card>
      )}

      {/* Report output — only one is rendered at a time based on selectedReport */}
      {reportGenerated && selectedReport === "Dividend Liability Register" && (
        <LiabilityRegisterReport
          filters={sharedFilters}
          generated={reportGenerated}
          onTotalChange={setTotal}
        />
      )}
      {reportGenerated && selectedReport === "WHT Deduction Report" && (
        <WhtDeductionReport
          filters={sharedFilters}
          generated={reportGenerated}
          onTotalChange={setTotal}
        />
      )}
      {reportGenerated && selectedReport === "Payment Status Report" && (
        <PaymentStatusReport
          filters={sharedFilters}
          generated={reportGenerated}
          onTotalChange={setTotal}
        />
      )}
      {reportGenerated && selectedReport === "Unclaimed Dividends Report" && (
        <UnclaimedDividendsReport
          filters={sharedFilters}
          generated={reportGenerated}
          onTotalChange={setTotal}
        />
      )}
      {reportGenerated && selectedReport === "Declaration Summary" && (
        <DeclarationSummaryReport
          filters={sharedFilters}
          generated={reportGenerated}
          onTotalChange={setTotal}
        />
      )}
      {reportGenerated && selectedReport === "Mandate Payment Report" && (
        <MandatePaymentReport
          filters={sharedFilters}
          generated={reportGenerated}
          onTotalChange={setTotal}
        />
      )}

      {reportGenerated && (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          total={total}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(ps) => {
            setPageSize(ps);
            setPage(0);
          }}
        />
      )}
    </div>
  );
}
