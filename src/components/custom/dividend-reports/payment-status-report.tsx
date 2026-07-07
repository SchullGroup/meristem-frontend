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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetPaymentStatusReport } from "@/hooks/useDividendReport";
import { PaginatedReportFilters } from "@/actions/dividendReportActions";
import { useExportDividendReport } from "@/hooks/useDividendReport";
import { formatCurrency, formatDate, formatNaira } from "@/lib/utils/format";
import { printPaymentStatusReport } from "@/lib/utils/printDividendReport";

interface PaymentStatusReportProps {
  filters: PaginatedReportFilters;
  generated: boolean;
  onTotalChange?: (total: number) => void;
}

function statusBadgeClass(s: string) {
  if (s === "PAID" || s === "AUTHORIZED") return "bg-green-100 text-green-800";
  if (s === "REJECTED") return "bg-red-100 text-red-700";
  if (s === "DRAFT") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-800";
}

export default function PaymentStatusReport({
  filters,
  generated,
  onTotalChange,
}: PaymentStatusReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useGetPaymentStatusReport(
    filters,
    {
      enabled: generated,
    },
  );

  const report = data?.data;
  const rows = report?.paymentStatusRows ?? [];
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
        reportType: "payment-status",
        ...filters,
        format: "EXCEL",
      });
      const excelBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payment-status-report.xlsx";
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
          There was an error retrieving the Payment Status Report.
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
          Payment Status Report —{" "}
          {(report?.totalDeclarations ?? 0).toLocaleString()} declarations
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
              if (report) printPaymentStatusReport(report);
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (report) printPaymentStatusReport(report);
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
            label: "Total Declarations",
            value: (report?.totalDeclarations ?? 0).toLocaleString(),
            color: "text-foreground",
          },
          {
            label: "Total Gross Liability",
            value: formatCurrency(report?.totalGrossLiability ?? 0),
            color: "text-foreground font-bold",
          },
          {
            label: "Authorized / Paid",
            value: (report?.authorizedOrPaid ?? 0).toLocaleString(),
            color: "text-green-700",
          },
          {
            label: "Pending Approval",
            value: (report?.pendingApproval ?? 0).toLocaleString(),
            color: "text-amber-600",
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
                <th className="px-4 py-2.5">PAYMENT NO</th>
                <th className="px-4 py-2.5">REGISTER</th>
                <th className="px-4 py-2.5">DIV TYPE</th>
                <th className="px-4 py-2.5">QUAL DATE</th>
                <th className="px-4 py-2.5 text-right">RATE (₦/SH)</th>
                <th className="px-4 py-2.5 text-right">GROSS LIABILITY</th>
                <th className="px-4 py-2.5 text-right">WHT</th>
                <th className="px-4 py-2.5 text-right">NET PAYOUT</th>
                <th className="px-4 py-2.5">TIER</th>
                <th className="px-4 py-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No declarations found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((entry, i) => (
                  <tr key={i} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {from + i}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.paymentNumber || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.registerSymbol || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.dividendType || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.qualificationDate
                        ? formatDate(entry?.qualificationDate)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {entry?.ratePerShare || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatNaira(entry?.grossLiability) || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatNaira(entry?.whtAmount)}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatNaira(entry?.netPayout)}
                    </td>
                    <td className="px-4 py-2.5">{entry?.tier || "N/A"}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={`border-0 text-[12px] ${statusBadgeClass(entry?.status ?? "")}`}
                      >
                        {entry?.status
                          ?.replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase()) ??
                          "Unknown"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                <tr>
                  <td colSpan={6} className="px-4 py-2.5 text-muted-foreground">
                    TOTALS ({report?.totalDeclarations ?? 0} declarations)
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatCurrency(report?.totalGrossLiability ?? 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-amber-600">
                    {formatCurrency(report?.totalWht ?? 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-green-700">
                    {formatCurrency(report?.totalNetPayout ?? 0)}
                  </td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
