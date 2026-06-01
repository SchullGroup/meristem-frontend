"use client";

import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCcw,
  FileSpreadsheet,
  Download,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TablePagination } from "@/components/custom/table-pagination";
import { usePagination } from "@/lib/use-pagination";
import { useGetUnclaimedDividendsReport } from "@/hooks/useDividendReport";
import { ReportFilters as DividendReportFilters } from "@/actions/dividendReportActions";
import { useExportDividendReport } from "@/hooks/useDividendReport";

import { formatCurrency, formatDate, formatNaira } from "@/lib/utils/format";
import { printUnclaimedDividendsReport } from "@/lib/utils/printDividendReport";

interface UnclaimedDividendsReportProps {
  filters: DividendReportFilters;
  generated: boolean;
}

export default function UnclaimedDividendsReport({
  filters,
  generated,
}: UnclaimedDividendsReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useGetUnclaimedDividendsReport(
    filters,
    {
      enabled: generated,
    },
  );

  const report = data?.data;
  const rows = report?.unclaimedRows ?? [];

  const { mutateAsync: exportDividendReport } = useExportDividendReport();

  const {
    page,
    pageSize,
    totalPages,
    paged,
    from,
    to,
    total,
    setPage,
    setPageSize,
  } = usePagination(rows);

  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Preparing Excel download...");
    try {
      const blob = await exportDividendReport({
        reportType: "unclaimed-dividends",
        ...filters,
        format: "EXCEL",
      });
      const excelBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "unclaimed-dividends-report.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Excel downloaded successfully.");
    } catch {
      toast.error("Failed to download Excel report.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!generated) return null;

  if (isLoading) {
    return (
      <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-70">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium text-foreground">
          Loading report data...
        </p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-red-500/80 min-h-70">
        <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          Failed to load report data
        </p>
        <p className="text-sm mt-1 text-muted-foreground mb-4">
          There was an error retrieving the Unclaimed Dividends Report.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Export bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">
          Unclaimed Dividends Report —{" "}
          {(report?.unclaimedWarrants ?? 0).toLocaleString()} warrants
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            )}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (report) printUnclaimedDividendsReport(report);
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (report) printUnclaimedDividendsReport(report);
            }}
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="mrpsl-card p-4 border-l-4 border-amber-400">
          <div className="mrpsl-section-title">Unclaimed Warrants</div>
          <div className="text-2xl font-mono font-bold mt-1">
            {(report?.unclaimedWarrants ?? 0).toLocaleString()}
          </div>
        </Card>
        <Card className="mrpsl-card p-4 border-l-4 border-red-400">
          <div className="mrpsl-section-title">Total Unclaimed Amount</div>
          <div className="text-xl font-mono font-bold mt-1 text-red-600">
            {formatCurrency(report?.totalUnclaimedAmount ?? 0)}
          </div>
        </Card>
        <Card className="mrpsl-card p-4 border-l-4 border-orange-400">
          <div className="mrpsl-section-title">Avg Days Outstanding</div>
          <div className="text-2xl font-mono font-bold mt-1 text-orange-600">
            {Math.round(report?.averageDaysOutstanding ?? 0)}
          </div>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">WARRANT NO</th>
                <th className="px-4 py-2.5">ACCOUNT NO</th>
                <th className="px-4 py-2.5">HOLDER NAME</th>
                <th className="px-4 py-2.5">DIVIDEND NO</th>
                <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                <th className="px-4 py-2.5">DATE ISSUED</th>
                <th className="px-4 py-2.5 text-right">DAYS OUTSTANDING</th>
                <th className="px-4 py-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No unclaimed dividend records found for the selected
                    filters.
                  </td>
                </tr>
              ) : (
                paged.map((entry, i) => (
                  <tr key={i} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {entry?.serial}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.warrantNumber || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">{entry?.accountNumber}</td>
                    <td className="px-4 py-2.5">{entry?.holderName}</td>
                    <td className="px-4 py-2.5">
                      {entry?.dividendNumber || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.amount ? formatNaira(entry?.amount) : "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.dateIssued
                        ? formatDate(entry?.dateIssued)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {entry?.daysOutstanding || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800">
                        {entry?.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-muted-foreground">
                  TOTALS ({report?.unclaimedWarrants ?? 0} warrants)
                </td>
                <td className="px-4 py-2.5 text-right text-red-600">
                  {formatCurrency(report?.totalUnclaimedAmount ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-4 py-3 border-t">
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            from={from}
            to={to}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>
    </div>
  );
}
