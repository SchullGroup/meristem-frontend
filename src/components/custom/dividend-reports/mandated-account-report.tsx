"use client";

import { useEffect } from "react";
import { Loader2, AlertCircle, RefreshCcw, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { downloadCsvData } from "@/lib/utils/csv-template";
import { useGetMandatedAccountReport } from "@/hooks/useDividendReport";
import type { PaginatedReportFilters } from "@/actions/dividendReportActions";

interface Props {
  filters: PaginatedReportFilters;
  generated: boolean;
  onTotalChange?: (total: number) => void;
}

export default function MandatedAccountReport({
  filters,
  generated,
  onTotalChange,
}: Props) {
  const { data, isLoading, isError, refetch } = useGetMandatedAccountReport(
    filters,
    { enabled: generated },
  );

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
        "CHN",
        "Register",
        "Bank",
        "Bank Account No",
        "Sort Code",
        "BVN",
        "Mandate Date",
        "Status",
      ],
      rows.map((r) => [
        String(r.serial),
        r.accountNumber,
        r.holderName,
        r.chn,
        r.registerSymbol,
        r.bankName,
        r.bankAccountNumber,
        r.sortCode,
        r.bvn,
        r.mandateDate,
        r.status,
      ]),
      "mandated-account-report.csv",
    );
    toast.success("Mandated Account Report exported as CSV.");
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
          Mandated Account Report —{" "}
          {(report?.totalMandatedAccounts ?? 0).toLocaleString()} accounts
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
                <th className="px-4 py-2.5">CHN</th>
                <th className="px-4 py-2.5">REGISTER</th>
                <th className="px-4 py-2.5">BANK</th>
                <th className="px-4 py-2.5">BANK ACCT NO</th>
                <th className="px-4 py-2.5">SORT CODE</th>
                <th className="px-4 py-2.5">BVN</th>
                <th className="px-4 py-2.5">MANDATE DATE</th>
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
                    No mandated accounts found for the selected filters.
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
                      {r.chn}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {r.registerSymbol}
                    </td>
                    <td className="px-4 py-2.5">{r.bankName}</td>
                    <td className="px-4 py-2.5 font-mono">
                      {r.bankAccountNumber}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {r.sortCode}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {r.bvn}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.mandateDate}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="border-0 text-[12px] bg-green-100 text-green-800">
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
