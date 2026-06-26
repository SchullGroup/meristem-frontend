"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { useReconciliationFlaggedTransactions } from "@/hooks/useCscs";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { PaginationBar } from "../pagination-bar";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";
import StatusBadge from "../status-badge";
import { ReconciliationFlaggedTransaction } from "@/types/cscs";
import { ReconciliationView } from "./reconciliation-review";

export default function UpdateReconciliation({ tab }: { tab: string }) {
  const { data: activeRegisters, isLoading: loadingRegisters } =
    useGetRegisters({
      status: "ACTIVE",
      size: 100,
    });

  // Controls whether we slice out of the primary table and show the Desk Workspace workspace
  const [workspaceActive, setWorkspaceActive] = useState(false);

  const [status, setStatus] = useState<"PENDING" | "RESOLVED" | "">("");
  const [register, setRegister] = useState("");
  const [txDateRange, setTxDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<ReconciliationFlaggedTransaction | null>(null);

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  // ── PRIMARY DATA TABLE STREAM LISTING ──────────────────────────────
  const { data, isLoading, isError, error, refetch } =
    useReconciliationFlaggedTransactions(
      {
        search: debouncedSearch || undefined,
        register: register !== "" ? register : undefined,
        startDate: txDateRange?.from
          ? format(txDateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: txDateRange?.to
          ? format(txDateRange.to, "yyyy-MM-dd")
          : undefined,
        status: status !== "" ? status : undefined,
        page: currentPage,
        size: pageSize,
      },
      {
        enabled: tab === "cscs",
        select: (data) => data.data,
      },
    );

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(0);
  };

  // ── VIEW BRANCHING: IF RESOLUTION WORKSPACE IS ACTIVE ───────────────
  if (workspaceActive && selectedTransaction) {
    return (
      <ReconciliationView
        open={workspaceActive}
        setOpen={setWorkspaceActive}
        selectedTransaction={selectedTransaction}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!isLoading && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            {data?.totalElements || 0} flagged transaction awaiting resolution
          </span>
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search CHN or holder…"
            className="pl-9 mrpsl-input"
            value={search}
            type="search"
            name="search-reconciliation"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={register} onValueChange={(v) => setRegister(v || "All")}>
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            {loadingRegisters ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="animate-spin w-4 h-4" />
              </div>
            ) : (
              <>
                <SelectItem value="">All Registers</SelectItem>
                {activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.symbol}>
                    <span className="font-bold">{r.registerName}</span> -{" "}
                    <span className="text-xs translate-y-0.5">{r.symbol}</span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v || "")}>
          <SelectTrigger className="w-40 mrpsl-input">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          date={txDateRange}
          setDate={setTxDateRange}
          placeholder="Select Date Range"
        />
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <PendingListSkeleton cols={9} />
          ) : isError ? (
            <DataErrorState
              message={returnErrorMessage(error as ErrorLike)}
              onRetry={refetch}
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3">Holder Name</th>
                  <th className="px-4 py-3">Register</th>
                  <th className="px-4 py-3">Flagged Date</th>
                  <th className="px-4 py-3">Attempted Sell</th>
                  <th className="px-4 py-3">Holdings At Flag</th>
                  <th className="px-4 py-3">Shortfall</th>
                  <th className="px-4 py-3">Resolution Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.isArray(data?.content) && data?.content?.length > 0 ? (
                  data?.content?.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                        {row.chn}
                      </td>
                      <td className="px-4 py-3 tabular text-[13px]">
                        {row.holderName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.register}
                      </td>
                      <td className="px-4 py-3 text-center tabular text-red-600 font-semibold">
                        {row.transactionDate
                          ? formatDate(row.transactionDate)
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center tabular text-red-600 font-semibold">
                        {formatNumber(row.attempted)}
                      </td>
                      <td className="px-4 py-3 text-center tabular">
                        {formatNumber(row.holdings)}
                      </td>
                      <td className="px-4 py-3 text-center tabular text-amber-600 font-semibold">
                        {formatNumber(row.shortfall)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setWorkspaceActive(true);
                            setSelectedTransaction(row);
                          }}
                        >
                          Resolve
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      No reconciliation data available for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <PaginationBar
          page={currentPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalPages={data?.totalPages || 1}
          total={data?.totalElements || 0}
          onPageChange={(value) => setCurrentPage(value)}
        />
      </Card>
    </div>
  );
}
