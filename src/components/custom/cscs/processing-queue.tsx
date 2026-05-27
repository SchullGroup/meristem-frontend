import { useState } from "react";
import {
    AlertTriangle,
    Search,
    MoreHorizontal,
    Eye,
} from "lucide-react";
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
import { toast } from "sonner";

// import { GET_CSCS_PROCESSING_QUEUE } from "@/actions/cscsActions";
import { useGetCscsProcessingQueue } from "@/hooks/useCscs";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";

const PAGE_SIZE = 10

export const ProcessingQueue = ({ tab, setActiveTab }: {
    tab: string; setActiveTab: React.Dispatch<React.SetStateAction<string>>
}) => {
    // const data = await GET_CSCS_PROCESSING_QUEUE()

    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    }, {
        enabled: tab === "queue",
    });
    const [queueRegister, setQueueRegister] = useState("ALL");
    const [queueSearch, setQueueSearch] = useState("");
    const [queueStatus, setQueueStatus] = useState<"ALL" | "PARTIAL" | "COMPLETE">("ALL");
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)

    const debouncedSearch = useDebounce(queueSearch, 500)

    const { data: processingQueue, isLoading, isError, error, refetch } = useGetCscsProcessingQueue({
        search: debouncedSearch !== "" ? debouncedSearch : undefined,
        register: queueRegister !== "ALL" ? queueRegister : undefined,
        status: queueStatus !== "ALL" ? queueStatus : undefined,
        page: currentPage,
        size: pageSize
    }, {
        enabled: tab === "queue"
    })

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize)
        setCurrentPage(0)
    }
    return (
        <>
            <div className="flex gap-2 items-center flex-wrap">
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
                    <SelectTrigger className="mrpsl-input w-full">
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
                <Select value={queueStatus} onValueChange={(v) => setQueueStatus(v || "ALL")}>
                    <SelectTrigger className="w-36 mrpsl-input">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                    </SelectContent>
                </Select>
                {/* <Select defaultValue="All">
                      <SelectTrigger className="w-40 mrpsl-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select> */}
            </div>

            <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                            <tr>
                                <th
                                    className="px-4 py-3 cursor-pointer select-none"
                                //   onClick={() => toggleSort("ref")}
                                >
                                    BATCH REF{" "}
                                    {/* <SortIcon
                                col="ref"
                                sortCol={sortCol}
                                sortDir={sortDir}
                              /> */}
                                </th>
                                <th
                                    className="px-4 py-3 cursor-pointer select-none"
                                //   onClick={() => toggleSort("register")}
                                >
                                    REGISTER{" "}
                                    {/* <SortIcon
                                col="register"
                                sortCol={sortCol}
                                sortDir={sortDir}
                              /> */}
                                </th>
                                <th
                                    className="px-4 py-3 cursor-pointer select-none"
                                //   onClick={() => toggleSort("date")}
                                >
                                    DATE{" "}
                                    {/* <SortIcon
                                col="date"
                                sortCol={sortCol}
                                sortDir={sortDir}
                              /> */}
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer select-none"
                                //   onClick={() => toggleSort("total")}
                                >
                                    TOTAL{" "}
                                    {/* <SortIcon
                                col="total"
                                sortCol={sortCol}
                                sortDir={sortDir}
                              /> */}
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
                                isLoading ? (
                                    <PendingListSkeleton />
                                ) : isError ? (
                                    <DataErrorState
                                        message={returnErrorMessage(error as ErrorLike)}
                                        onRetry={refetch}
                                    />
                                ) :
                                    Array.isArray(processingQueue?.content) && processingQueue?.content.length > 0 ?
                                        processingQueue?.content?.map((row) => (
                                            <tr key={row.batchRef} className="mrpsl-table-row">
                                                <td className="px-4 py-3 tabular-nums text-[13px] text-muted-foreground">
                                                    {row.batchRef}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        className="border-0 text-[13px] bg-gray-100 text-gray-800"
                                                    >
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
                                                                onClick={() => toast.info("Batch detail")}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" /> View Batch
                                                                Detail
                                                            </DropdownMenuItem>
                                                            {row.flaggedCount > 0 && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setActiveTab("flagged")}
                                                                >
                                                                    <AlertTriangle className="mr-2 h-4 w-4" />{" "}
                                                                    View Flagged ({row.flaggedCount})
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="text-center py-10 text-muted-foreground"
                                                >
                                                    No records found
                                                </td>
                                            </tr>
                                        )
                            }
                        </tbody>
                    </table>
                </div>


                {/* Pagination */}
                <PaginationBar
                    page={currentPage}
                    pageSize={PAGE_SIZE}
                    onPageSizeChange={handlePageSizeChange}
                    total={processingQueue?.totalElements || 0}
                    onPageChange={handlePageChange}
                    pageBase={0}
                    totalPages={processingQueue?.totalPages}
                />  </Card>



        </>
    )
}
