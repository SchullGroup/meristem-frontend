"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCcw,
  FileSpreadsheet,
  Download,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetWhtDeductionReport } from "@/hooks/useDividendReport";
import { PaginatedReportFilters } from "@/actions/dividendReportActions";
import { useExportDividendReport } from "@/hooks/useDividendReport";
import { formatCurrency, formatNaira, formatNumber } from "@/lib/utils/format";
import { printWhtDeductionReport } from "@/lib/utils/printDividendReport";

interface WhtReportProps {
  filters: PaginatedReportFilters;
  generated: boolean;
  onTotalChange?: (total: number) => void;
}

export default function WhtDeductionReport({
  filters,
  generated,
  onTotalChange,
}: WhtReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useGetWhtDeductionReport(
    filters,
    {
      enabled: generated,
    },
  );

  const report = data?.data;
  const rows = report?.whtRows ?? [];
  const total = report?.totalElements ?? 0;

  // Surface total to parent for PaginationBar
  useEffect(() => {
    if (total > 0) onTotalChange?.(total);
  }, [total, onTotalChange]);

  const { mutateAsync: exportDividendReport } = useExportDividendReport();

  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Preparing Excel download...");
    try {
      const blob = await exportDividendReport({
        reportType: "wht-deduction",
        ...filters,
        format: "EXCEL",
      });
      const excelBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wht-deduction-report.xlsx";
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
          There was an error retrieving the WHT Deduction Report.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Card>
    );
  }

  const pageSize = filters.size ?? 10;
  const page = filters.page ?? 0;
  const from = total === 0 ? 0 : page * pageSize + 1;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Export bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">
          WHT Deduction Report —{" "}
          {(report?.shareholdersAssessed ?? 0).toLocaleString()} shareholders
          assessed
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
              if (report) printWhtDeductionReport(report);
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (report) printWhtDeductionReport(report);
            }}
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Gross Dividend",
            value: formatCurrency(report?.totalGrossLiability ?? 0),
            color: "text-foreground",
          },
          {
            label: "Total WHT @ 10%",
            value: formatCurrency(report?.totalWht ?? 0),
            color: "text-amber-600",
          },
          {
            label: "Net Payout",
            value: formatCurrency(report?.totalNetPayout ?? 0),
            color: "text-green-700",
          },
          {
            label: "Shareholders Assessed",
            value: (report?.shareholdersAssessed ?? 0).toLocaleString(),
            color: "text-foreground",
          },
        ].map((c) => (
          <Card key={c.label} className="mrpsl-card p-4">
            <div className="mrpsl-section-title">{c.label}</div>
            <div className={`text-lg font-mono font-bold mt-1 ${c.color}`}>
              {c.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Detail table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">ACCOUNT NO</th>
                <th className="px-4 py-2.5">HOLDER NAME</th>
                <th className="px-4 py-2.5">HOLDER TYPE</th>
                <th className="px-4 py-2.5 text-right">UNITS</th>
                <th className="px-4 py-2.5 text-right">GROSS DIV (₦)</th>
                <th className="px-4 py-2.5 text-right">WHT RATE</th>
                <th className="px-4 py-2.5 text-right">WHT AMOUNT (₦)</th>
                <th className="px-4 py-2.5 text-right">NET DIV (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((entry, i) => (
                  <tr key={i} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {from + i}
                    </td>
                    <td className="px-4 py-2.5">{entry?.accountNumber}</td>
                    <td className="px-4 py-2.5">{entry?.holderName}</td>
                    <td className="px-4 py-2.5">
                      {entry?.holderType || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatNumber(entry?.units)}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatNaira(entry?.grossDividend)}
                    </td>
                    <td className="px-4 py-2.5">{entry?.whtRate || "N/A"}</td>
                    <td className="px-4 py-2.5">
                      {formatNaira(entry?.whtAmount)}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatNaira(entry?.netDividend)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
              <tr>
                <td className="px-4 py-2.5 text-muted-foreground">TOTALS</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center gap-4">
                    <span>
                      Gross:{" "}
                      {formatCurrency(report?.totalGrossLiability ?? 0)}{" "}
                    </span>
                    <span>
                      WHT:{" "}
                      <span className="text-amber-600">
                        {formatCurrency(report?.totalWht ?? 0)}
                      </span>
                    </span>
                    <span>
                      Net:{" "}
                      <span className="text-green-700">
                        {formatCurrency(report?.totalNetPayout ?? 0)}
                      </span>
                    </span>
                  </div>{" "}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
