import { useState } from "react";
import { AlertTriangle, Search, MoreHorizontal, Eye } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// import { GET_CSCS_PROCESSING_QUEUE } from "@/actions/cscsActions";
import { useGetCscsTransactionBatchLogs } from "@/hooks/useCscs";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import { TransactionBatch as SelectedProcess } from "@/types/cscs";

const PAGE_SIZE = 10;

export const ProcessingQueue = ({
  tab,
  setActiveTab,
}: {
  tab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { data: activeRegisters } = useGetRegisters(
    {
      size: 100,
      status: "ACTIVE",
    },
    {
      enabled: tab === "queue",
    },
  );

  const [open, setOpen] = useState(false);
  const [queueRegister, setQueueRegister] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState<
    "" | "PARTIAL" | "COMPLETE"
  >("");
  const [queueDateFilter, setQueueDateFilter] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH" | "">("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const debouncedSearch = useDebounce(queueSearch, 500);

  const [selectedTransaction, setSelectedTransaction] =
    useState<SelectedProcess | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCscsTransactionBatchLogs(
    {
      batchRef: debouncedSearch !== "" ? debouncedSearch : undefined,
      register: queueRegister !== "" ? queueRegister : undefined,
      status: queueStatus !== "" ? queueStatus : undefined,
      dateFilter: queueDateFilter !== "" ? queueDateFilter : undefined,
      page: currentPage,
      size: pageSize,
    },
    {
      enabled: tab === "queue",
    },
  );

  const processingQueue = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.totalElements || 0;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0);
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batch ref…"
            className="pl-9 mrpsl-input"
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
          />
        </div>

        <div >
          <Select
            value={queueRegister}
            onValueChange={(v) => setQueueRegister(v || "")}
          >
            <SelectTrigger className="mrpsl-input">
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
        </div>
        <div >
          <Select
            value={queueStatus}
            onValueChange={(v) => setQueueStatus(v || "")}
          >
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div >
          <Select
            value={queueDateFilter}
            onValueChange={(v) => setQueueDateFilter(v || "")}
          >
            <SelectTrigger className="w-40 mrpsl-input">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Dates</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="THIS_WEEK">This Week</SelectItem>
              <SelectItem value="THIS_MONTH">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <PendingListSkeleton />
          ) : isError ? (
            <DataErrorState
              message={returnErrorMessage(error as ErrorLike)}
              onRetry={refetch}
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 cursor-pointer select-none">
                    BATCH REF
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none">
                    REGISTER
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none">DATE</th>
                  <th className="px-4 py-3 text-right cursor-pointer select-none">
                    TOTAL
                  </th>
                  <th className="px-4 py-3 text-right">BUYS</th>
                  <th className="px-4 py-3 text-right">SELLS</th>
                  <th className="px-4 py-3 text-right">FLAGGED</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {
                  processingQueue?.length > 0 ? (
                    processingQueue?.map((row) => (
                      <tr key={row.batchRef} className="mrpsl-table-row">
                        <td className="px-4 py-3 tabular-nums text-[13px] text-muted-foreground">
                          {row.batchRef}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">
                            {row.register}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[13px]">
                          {row.transactionDate ? formatDate(row.transactionDate) : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {formatNumber(row?.total)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-green-600">
                          {formatNumber(row.buys)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-red-600">
                          {formatNumber(row.sells)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(row.flagged)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`border-0 text-[13px] ${row.status === "COMPLETE" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                          >
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTransaction(row);
                                  setOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Batch Detail
                              </DropdownMenuItem>
                              {row?.flagged > 0 && (
                                <DropdownMenuItem
                                  onClick={() => setActiveTab("flagged")}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" /> View
                                  Flagged ({row.flagged})
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No records found
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
          total={total}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Batch Reference: {selectedTransaction?.batchRef ?? "N/A"}
            </DialogTitle>
            <DialogDescription>
              View the full processing summary for this batch, including totals, status and processing metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 px-8 pb-8 overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Register
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedTransaction?.register ?? "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedTransaction?.status ?? "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Batch date
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedTransaction?.transactionDate
                    ? formatDate(selectedTransaction.transactionDate)
                    : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Total Transactions
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formatNumber(selectedTransaction?.total)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Buys
                </p>
                <p className="mt-3 text-2xl font-semibold text-green-600 tabular-nums">
                  +{formatNumber(selectedTransaction?.buys)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Sells
                </p>
                <p className="mt-3 text-2xl font-semibold text-red-600 tabular-nums">
                  −{formatNumber(selectedTransaction?.sells)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Flagged
                </p>
                <p className="mt-3 text-2xl font-semibold text-orange-600 tabular-nums">
                  {formatNumber(selectedTransaction?.flagged)}
                </p>
              </div>
            </div>


          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
