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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Search } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { useReconciliationFlaggedTransactions } from "@/hooks/useCscs";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { PaginationBar } from "../pagination-bar";
import { formatDate, formatNumber } from "@/lib/utils/format";
import DateInput from "@/components/ui/date-input";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";

export default function UpdateReconciliation({ tab }: { tab: string }) {
  const { data: activeRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  const [status, setStatus] = useState<"PENDING" | "RESOLVED" | "ALL">("ALL");
  const [register, setRegister] = useState("ALL");
  const [txDateRange, setTxDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  const [txDate, setTxDate] = useState<Date>(new Date());
  const [txSymbol, setTxSymbol] = useState("");
  const [txUnits, setTxUnits] = useState(0);
  const [transferNo, setTransferNo] = useState("");

  const { data, isLoading, isError, error, refetch } =
    useReconciliationFlaggedTransactions(
      {
        search: search !== "" ? debouncedSearch : undefined,
        register: register !== "ALL" ? register : undefined,
        startDate: txDateRange?.from
          ? format(txDateRange?.from, "yyyy-MM-dd")
          : undefined,
        endDate: txDateRange?.to
          ? format(txDateRange?.to, "yyyy-MM-dd")
          : undefined,
        status: status !== "ALL" ? status : undefined,
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

  const handleApproval = () => {
    toast.success("Submitted for approval.");
    setSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm font-medium text-amber-800">
            1 flagged transaction awaiting resolution
            </span>
        </div> */}

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
            <SelectItem value="ALL">All Registers</SelectItem>
            {activeRegisters?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                {r.registerName} · {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v || "ALL")}>
          <SelectTrigger className="w-40 mrpsl-input">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
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
                      <td className="px-4 py-3 text-right tabular text-red-600 font-semibold">
                        {row.transactionDate
                          ? formatDate(row.transactionDate)
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-red-600 font-semibold">
                        {formatNumber(row.attempted)}
                      </td>
                      <td className="px-4 py-3 text-right tabular">
                        {formatNumber(row.holdings)}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-amber-600 font-semibold">
                        {formatNumber(row.shortfall)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`border-0 text-[13px] ${row.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => setSheetOpen(true)}>
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
          total={data?.totalPages || 0}
          onPageChange={(value) => setCurrentPage(value)}
        />
      </Card>

      {/* Discrepancy Resolution Dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discrepancy Resolution</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-8 pb-8">
            {/* Side-by-side ledger view */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  MRPSL Records
                </div>
                <div className="p-4 space-y-2 text-sm tabular">
                  <div className="flex justify-between text-muted-foreground">
                    <span>01 Jan 2026 (Buy)</span>
                    <span>+10,000</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span>Balance</span>
                    <span>10,000</span>
                  </div>
                </div>
              </Card>

              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  CSCS Records
                </div>
                <div className="p-4 space-y-2 text-sm tabular">
                  <div className="flex justify-between text-muted-foreground">
                    <span>01 Jan 2026 (Buy)</span>
                    <span>+10,000</span>
                  </div>
                  <div className="flex justify-between bg-green-50 rounded px-2 py-1 text-green-700">
                    <span>25 Apr 2026 (Buy)</span>
                    <span>+5,000</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span>Balance</span>
                    <span>15,000</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Missing purchase identified:</strong> 5,000 units on 25
                Apr 2026 not reflected in MRPSL register.
              </p>
            </div>

            {/* Insert missing transaction */}
            <Card className="mrpsl-card p-5 space-y-4">
              <h3 className="font-semibold text-sm">
                Insert Missing Transaction
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {/* <label className="mrpsl-label">Transaction Date</label> */}
                  <DateInput
                    label="Transaction Date"
                    date={txDate}
                    setDate={setTxDate}
                  />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Transfer No</label>
                  <Input
                    name="transferNo"
                    value={transferNo}
                    onChange={(e) => setTransferNo(e.target.value)}
                    placeholder="TRN-0099123"
                    className="mrpsl-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Units</label>
                  <Input
                    name="units"
                    type="number"
                    value={txUnits}
                    onChange={(e) => setTxUnits(Number(e.target.value))}
                    className="mrpsl-input tabular"
                  />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Symbol</label>
                  <Select
                    name="symbol"
                    value={txSymbol}
                    onValueChange={(v) => setTxSymbol(v ?? "")}
                  >
                    <SelectTrigger className="mrpsl-input w-full">
                      <SelectValue placeholder="Select register" />
                    </SelectTrigger>
                    <SelectContent className="w-max">
                      {activeRegisters?.content.map((r) => (
                        <SelectItem key={r.registerId} value={r.registerId}>
                          {r.symbol} — {r.registerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleApproval}>
                Submit for Approval
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
