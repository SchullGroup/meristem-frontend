"use client";

import { useEffect } from "react";
import { Loader2, AlertCircle, RefreshCcw, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatNaira } from "@/lib/utils/format";
import { downloadCsvData } from "@/lib/utils/csv-template";
import { useGetMandatedUnpaidExceptionsReport } from "@/hooks/useDividendReport";
import type { PaginatedReportFilters } from "@/actions/dividendReportActions";

interface Props {
  filters: PaginatedReportFilters;
  generated: boolean;
  onTotalChange?: (total: number) => void;
}

export default function MandatedUnpaidExceptionsReport({
  filters,
  generated,
  onTotalChange,
}: Props) {
  const { data, isLoading, isError, refetch } =
    useGetMandatedUnpaidExceptionsReport(filters, { enabled: generated });

  const report = data?.data;
  const rows = report?.rows ?? [];
  const total = report?.totalElements ?? 0;

  useEffect(() => {
    if (total > 0) onTotalChange?.(total);
  }, [total, onTotalChange]);

  function handleExport() {
    downloadCsvData(
      [
        "#",
        "Account No",
        "Holder Name",
        "Dividend No",
        "Amount (NGN)",
        "Bank",
        "Bank Account No",
        "Exception Reason",
        "Days Outstanding",
        "Status",
      ],
      rows.map((r) => [
        String(r.serial),
        r.accountNumber,
        r.holderName,
        r.dividendNumber,
        r.amount.toFixed(2),
        r.bankName,
        r.bankAccountNumber,
        r.exceptionReason,
        String(r.daysOutstanding),
        r.status,
      ]),
      "mandated-unpaid-dividend-exceptions-report.csv",
    );
    toast.success("Exceptions Report exported as CSV.");
  }

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
        <p className="text-sm font-medium text-red-600">
          Failed to load report data
        </p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">
          Mandated Unpaid Dividend Exceptions —{" "}
          {(report?.totalExceptions ?? 0).toLocaleString()} exceptions ·{" "}
          <span className="font-semibold text-red-600">
            {formatNaira(report?.totalUnpaidAmount ?? 0)} unpaid
          </span>
        </span>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">ACCOUNT NO</th>
                <th className="px-4 py-2.5">HOLDER NAME</th>
                <th className="px-4 py-2.5">DIVIDEND NO</th>
                <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                <th className="px-4 py-2.5">BANK</th>
                <th className="px-4 py-2.5">BANK ACCT NO</th>
                <th className="px-4 py-2.5">EXCEPTION REASON</th>
                <th className="px-4 py-2.5 text-center">DAYS O/S</th>
                <th className="px-4 py-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No unpaid-dividend exceptions found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.serial} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {r.serial}
                    </td>
                    <td className="px-4 py-2.5 font-mono">{r.accountNumber}</td>
                    <td className="px-4 py-2.5">{r.holderName}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {r.dividendNumber}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {formatNaira(r.amount)}
                    </td>
                    <td className="px-4 py-2.5">{r.bankName}</td>
                    <td className="px-4 py-2.5 font-mono">
                      {r.bankAccountNumber}
                    </td>
                    <td className="px-4 py-2.5 text-amber-700">
                      {r.exceptionReason}
                    </td>
                    <td className="px-4 py-2.5 text-center tabular-nums">
                      {r.daysOutstanding}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800">
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
