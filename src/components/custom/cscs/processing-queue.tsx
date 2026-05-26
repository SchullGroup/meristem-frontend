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
import { useGetCscsProcessingQueue } from "@/hooks/useCscs";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import { ProcessingQueue as SelectedProcess } from "@/types/cscs";

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
  const [queueRegister, setQueueRegister] = useState("ALL");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState<
    "ALL" | "PARTIAL" | "COMPLETE"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const debouncedSearch = useDebounce(queueSearch, 500);

  const [selectedTransaction, setSelectedTransaction] =
    useState<SelectedProcess | null>(null);

  const {
    data: processingQueue,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCscsProcessingQueue(
    {
      search: debouncedSearch !== "" ? debouncedSearch : undefined,
      register: queueRegister !== "ALL" ? queueRegister : undefined,
      status: queueStatus !== "ALL" ? queueStatus : undefined,
      page: currentPage,
      size: pageSize,
    },
    {
      enabled: tab === "queue",
    },
  );

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

        <Select
          value={queueRegister}
          onValueChange={(v) => setQueueRegister(v || "ALL")}
        >
          <SelectTrigger className="mrpsl-input w-40">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Registers</SelectItem>
            {activeRegisters?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.registerId}>
                {r.registerName} · {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={queueStatus}
          onValueChange={(v) => setQueueStatus(v || "ALL")}
        >
          <SelectTrigger className="w-40 mrpsl-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
          </SelectContent>
        </Select>
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
                {Array.isArray(processingQueue?.content) &&
                processingQueue?.content.length > 0 ? (
                  processingQueue?.content?.map((row) => (
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
                        {row.batchDate ? formatDate(row.batchDate) : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatNumber(row?.totalTransactions)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600">
                        {formatNumber(row.buyCount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600">
                        {formatNumber(row.sellCount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(row.flaggedCount)}
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
                            {row.flaggedCount > 0 && (
                              <DropdownMenuItem
                                onClick={() => setActiveTab("flagged")}
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" /> View
                                Flagged ({row.flaggedCount})
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
          pageSize={PAGE_SIZE}
          total={processingQueue?.totalPages || 0}
          totalPages={processingQueue?.totalPages}
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
                  {selectedTransaction?.batchDate
                    ? formatDate(selectedTransaction.batchDate)
                    : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Processed by
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedTransaction?.processedBy ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Buys
                </p>
                <p className="mt-3 text-2xl font-semibold text-green-600 tabular-nums">
                  +{formatNumber(selectedTransaction?.buyCount)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Sells
                </p>
                <p className="mt-3 text-2xl font-semibold text-red-600 tabular-nums">
                  −{formatNumber(selectedTransaction?.sellCount)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Flagged
                </p>
                <p className="mt-3 text-2xl font-semibold text-orange-600 tabular-nums">
                  {formatNumber(selectedTransaction?.flaggedCount)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[13px] text-muted-foreground">Total transactions</p>
                  <p className="mt-2 text-sm font-semibold tabular-nums">
                    {formatNumber(selectedTransaction?.totalTransactions)}
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground">Batch reference</p>
                  <p className="mt-2 text-sm font-semibold tabular-nums">
                    {selectedTransaction?.batchRef ?? "N/A"}
                  </p>
                </div>
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
