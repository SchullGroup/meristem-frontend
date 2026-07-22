"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetMarkOffHistory } from "@/hooks/useWarrantMarkoff";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { PaginationBar } from "../pagination-bar";
import { formatDate, formatNumber } from "@/lib/utils/format";
import DateInput from "@/components/ui/date-input";
import { format } from "date-fns";
import RegisterSelect from "../register-select";

function getTierNumber(tier: string | number | undefined): 1 | 2 | 3 {
  if (!tier) return 1;
  const str = String(tier).toUpperCase();
  if (str.includes("3") || str.includes("THREE") || str.includes("MANAGEMENT") || str.includes("FINAL")) return 3;
  if (str.includes("2") || str.includes("TWO") || str.includes("ICU") || str.includes("SECOND")) return 2;
  return 1;
}

function tierLabel(tier: string | number | undefined) {
  const num = getTierNumber(tier);
  return num === 1 ? "1st Approval" : num === 2 ? "ICU" : "Management";
}

function tierBadgeClass(tier: string | number | undefined) {
  const num = getTierNumber(tier);
  return num === 1
    ? "bg-blue-100 text-blue-800"
    : num === 2
      ? "bg-purple-100 text-purple-800"
      : "bg-orange-100 text-orange-800";
}

export default function History({ tab }: { tab: string }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRegister, setSelectedRegister] = useState("")
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Mark-off history query
  const {
    data: historyResponse,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useGetMarkOffHistory({
    page: page,
    size: pageSize,
    registerId: selectedRegister !== "" ? selectedRegister : undefined,
    dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
    dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
    status: "APPROVED"
  }, {
    enabled: tab === "history"
  });

  const historyList = historyResponse?.data?.content || [];
  const totalElements = historyResponse?.data?.totalElements || 0;
  const totalPages = historyResponse?.data?.totalPages || 1;

  if (isLoadingHistory) {
    return (
      <EntitlementTableSkeleton />
    )
  }

  return (
    <div className="space-y-4">

      <div className="flex gap-4 items-center">
        <RegisterSelect label="Register" value={selectedRegister} onChange={(value) => setSelectedRegister(value)} />
        <div className="space-y-1.5">
          <DateInput
            label="From"
            date={dateFrom}
            setDate={(value) => setDateFrom(value)}
          />
        </div>
        <div className="space-y-1.5">
          <DateInput
            label="To"
            date={dateTo}
            setDate={(value) => setDateTo(value)}
          />
        </div></div>


      {isErrorHistory ? (
        <DataErrorState
          message={historyError?.message || "Failed to load mark-off history."}
          onRetry={refetchHistory}
        />
      ) :
        (<div className="space-y-4">
          <Card className="mrpsl-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3">DATE</th>
                  <th className="p-3">WARRANT NO</th>
                  <th className="p-3">ACCOUNT</th>
                  <th className="p-3">HOLDER</th>
                  <th className="p-3">AMOUNT (₦)</th>
                  <th className="p-3">MARKED OFF BY</th>
                  <th className="p-3">TIER</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {historyList?.length > 0 ?

                  historyList.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{formatDate(row.submittedDate)}</td>
                      <td className="p-3 font-mono">{row.warrantNumber}</td>
                      <td className="p-3 font-mono">{row.accountNumber}</td>
                      <td className="p-3 font-medium">{row.holderName}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {formatNumber(row.amount)}
                      </td>
                      <td className="p-3 text-muted-foreground">{row.submittedBy}</td>
                      <td className="p-3">
                        <Badge
                          className={`border-0 text-[12px] ${tierBadgeClass(
                            row.currentTier
                          )}`}
                        >
                          {tierLabel(row.currentTier)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`border-0 text-[13px] ${row.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {row.status ? (
                            row.status.charAt(0) + row.status.slice(1).toLowerCase()
                          ) : (
                            "Approved"
                          )}
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        No warrant mark-off history records found.
                      </td></tr>
                  )}
              </tbody>
            </table>
          </Card>
        </div>)}

      <PaginationBar
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        total={totalElements}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
