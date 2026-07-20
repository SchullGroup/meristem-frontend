"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "../../pagination-bar";
import { useGetAdmons } from "@/hooks/useAccountMaintenance";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../../date-range-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { EntitlementTableSkeleton } from "../../rights-issue/loaders";
import { formatDate } from "@/lib/utils/format";
import { DataErrorState } from "../../ipo/loaders";

export default function AdmonHistory({ tab }: { tab: string }) {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [registerId, setRegisterId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data, isLoading, error, isError, refetch } = useGetAdmons(
    {
      registerId: registerId !== "" ? registerId : undefined,
      from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      page: currentPage,
      pageSize: pageSize,
    },
    {
      enabled: tab === "history",
    },
  );

  const admonHistory = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;

  if (isLoading) {
    return <EntitlementTableSkeleton />;
  }

  return (
    <>
      <div className="flex gap-2 items-center flex-wrap">
        <Select
          value={registerId}
          onValueChange={(v) => setRegisterId(v || "")}
        >
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Registers</SelectItem>
            {activeRegisters?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                {r.registerName} · {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="space-y-1.5">
          <DateRangePicker
            className="mt-0"
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
      </div>
      <Card className="mrpsl-card overflow-hidden">
        {isError ? (
          <DataErrorState
            message={error?.message || "Failed to load historical ADMORs."}
            onRetry={refetch}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3">DATE</th>
                <th className="p-3">ACCOUNT</th>
                <th className="p-3">DECEASED</th>
                <th className="p-3">ADMINISTRATOR / EXECUTOR</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">AUTHORISED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {admonHistory?.length > 0 ? (
                admonHistory?.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    <td className="p-3 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="p-3 font-mono">
                      {row.deceasedAccountNumbers?.join(", ") || "-"}
                    </td>
                    <td className="p-3 font-medium">
                      {row.deceasedHolderName}
                    </td>
                    <td className="p-3">{row.adminName}</td>
                    <td className="p-3">
                      <Badge
                        className={`border-0 text-[13px] capitalize ${row.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.authorisedBy}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No historical ADMORs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
      <PaginationBar
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}
