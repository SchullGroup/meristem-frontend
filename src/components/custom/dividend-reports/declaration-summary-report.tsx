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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TablePagination } from "@/components/custom/table-pagination";
import { usePagination } from "@/lib/use-pagination";
import { useGetDeclarationSummaryReport } from "@/hooks/useDividendReport";
import { ReportFilters as DividendReportFilters } from "@/actions/dividendReportActions";
import { useExportDividendReport } from "@/hooks/useDividendReport";
import { formatCurrency } from "@/lib/utils/format";
import { printDeclarationSummaryReport } from "@/lib/utils/printDividendReport";

interface DeclarationSummaryReportProps {
  filters: DividendReportFilters;
  generated: boolean;
}

export default function DeclarationSummaryReport({
  filters,
  generated,
}: DeclarationSummaryReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useGetDeclarationSummaryReport(
    filters,
    {
      enabled: generated,
    },
  );

  const report = data?.data;
  const rows = report?.byRegister ?? [];

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
        reportType: "declaration-summary",
        ...filters,
        format: "EXCEL",
      });
      const excelBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "declaration-summary-report.xlsx";
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
          There was an error retrieving the Declaration Summary.
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
          Declaration Summary —{" "}
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
              if (report) printDeclarationSummaryReport(report);
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (report) printDeclarationSummaryReport(report);
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
            label: "Total WHT",
            value: formatCurrency(report?.totalWht ?? 0),
            color: "text-amber-600",
          },
          {
            label: "Total Net Payout",
            value: formatCurrency(report?.totalNetPayout ?? 0),
            color: "text-green-700",
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

      {/* Grouped by register table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-2.5">REGISTER</th>
                <th className="px-4 py-2.5">REGISTER TYPE</th>
                <th className="px-4 py-2.5 text-right">DECLARATIONS</th>
                <th className="px-4 py-2.5 text-right">
                  TOTAL GROSS LIABILITY
                </th>
                <th className="px-4 py-2.5 text-right">TOTAL WHT</th>
                <th className="px-4 py-2.5 text-right">TOTAL NET PAYOUT</th>
                <th className="px-4 py-2.5">LATEST DIV TYPE</th>
                <th className="px-4 py-2.5 text-right">LATEST RATE (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No declarations found for the selected filters.
                  </td>
                </tr>
              ) : (
                paged.map((reg, i) => (
                  <tr key={i} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 font-semibold">
                      {reg.registerSymbol}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {reg.registerType}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {reg.declarationCount}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                      {formatCurrency(reg.totalGrossLiability)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">
                      {formatCurrency(reg.totalWht)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-green-700 font-semibold">
                      {formatCurrency(reg.totalNetPayout)}
                    </td>
                    <td className="px-4 py-2.5">
                      {reg.latestDividendType ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {reg.latestRate?.toFixed(4) ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-muted-foreground">
                    TOTALS
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
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
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
