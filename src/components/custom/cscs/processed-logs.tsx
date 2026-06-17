"use client";

import { useState } from "react";
import {
    Search,

} from "lucide-react";
import {
    format,

} from "date-fns";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "../pagination-bar";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetCscsProcessedLogs } from "@/hooks/useCscs";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";


const PAGE_SIZE = 10


export const ProcessedLogs = ({ tab }: {
    tab: string; setActiveTab: React.Dispatch<React.SetStateAction<string>>
}) => {

    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    }, {
        enabled: tab === "logs",
    });


    const [logSearch, setLogSearch] = useState("");
    const [logRegister, setLogRegister] = useState("All");
    const [logType, setLogType] = useState<"BUY" | "SELL" | "All">("All");
    const [logDateRange, setLogDateRange] = useState<DateRange | undefined>(undefined);

    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)
    const debouncedSearch = useDebounce(logSearch, 500)

    const { data: processedLogs, isLoading, isError, error, refetch } = useGetCscsProcessedLogs({
        search: debouncedSearch !== "" ? debouncedSearch : undefined,
        register: logRegister !== "All" ? logRegister : undefined,
        type: logType !== "All" ? logType : undefined,
        fromDate: logDateRange?.from
            ? format(logDateRange?.from, "yyyy-MM-dd")
            : undefined,
        toDate: logDateRange?.to
            ? format(logDateRange?.to, "yyyy-MM-dd")
            : undefined,
        page: currentPage,
        size: pageSize
    }, {
        enabled: tab === "logs"
    })

    console.log(processedLogs)

    return (
        <>
            <div className="flex gap-2 items-center flex-wrap">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search CHN, holder, transfer no…"
                        className="pl-9 mrpsl-input"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={logRegister}
                    onValueChange={(v) => setLogRegister(v || "All")}
                >
                    <SelectTrigger className="w-44 mrpsl-input">
                        <SelectValue placeholder="All Registers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Registers</SelectItem>
                        {activeRegisters?.content?.map((r) => (
                            <SelectItem key={r.registerId} value={r.symbol}>
                                {r.registerName} · {r.symbol}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={logType}
                    onValueChange={(v) => setLogType(v || "All")}
                >
                    <SelectTrigger className="w-32 mrpsl-input">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                    </SelectContent>
                </Select>

                <div className="space-y-1.5">
                    <DateRangePicker
                        date={logDateRange}
                        setDate={setLogDateRange}
                    />
                </div>


                <div className="ml-auto flex items-center gap-4 text-[13px] text-muted-foreground">
                    <span className="text-green-600 font-semibold tabular-nums">
                        Buys: +{formatNumber(processedLogs?.totalBuyUnits)}
                    </span>
                    <span className="text-red-600 font-semibold tabular-nums">
                        Sells: −{formatNumber(processedLogs?.totalSellUnits)}
                    </span>
                    <span className="font-medium">
                        {formatNumber(processedLogs?.totalRecords)} record{processedLogs && processedLogs?.totalRecords > 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                    {
                        isLoading ? (
                            <PendingListSkeleton cols={10} />
                        ) : isError ? (
                            <DataErrorState
                                message={returnErrorMessage(error as ErrorLike)}
                                onRetry={refetch}
                            />) :
                            (<table className="w-full text-left text-sm">
                                <thead className="mrpsl-table-header">
                                    <tr>
                                        <th className="px-4 py-3">DATE</th>
                                        <th className="px-4 py-3">BATCH REF</th>
                                        <th className="px-4 py-3">CHN</th>
                                        <th className="px-4 py-3">REGISTER</th>
                                        <th className="px-4 py-3">HOLDER</th>
                                        <th className="px-4 py-3">TRANSFER NO</th>
                                        <th className="px-4 py-3">TYPE</th>
                                        <th className="px-4 py-3 text-right">UNITS</th>
                                        <th className="px-4 py-3 text-right">BALANCE AFTER</th>
                                        <th className="px-4 py-3">PROCESSED BY</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border/60">

                                    {Array.isArray(processedLogs?.transactions?.content) && processedLogs?.transactions?.content.length > 0 ?
                                        processedLogs?.transactions?.content?.map((row) => (
                                            <tr key={row.id} className="mrpsl-table-row">
                                                <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                                                    {formatDate(row.transactionDate)}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                                                    {row.batchRef}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                                                    {row.chn}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        className="border-0 text-[13px] bg-gray-100 text-gray-800"
                                                    >
                                                        {row.register}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-sm">
                                                    {row.holderName}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                                                    {row.transferNo}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        className={`border-0 text-[13px] ${row.type === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                                                    >
                                                        {row.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                                    {formatNumber(row.units)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatNumber(row.balanceAfter)}
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-muted-foreground">
                                                    {row.processedBy}
                                                </td>
                                            </tr>
                                        )) :
                                        (
                                            <tr>
                                                <td
                                                    colSpan={10}
                                                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                                                >
                                                    No transactions match your filters.
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>)}
                </div>

            </Card>
            <PaginationBar
                page={currentPage}
                pageSize={pageSize}
                total={processedLogs?.transactions?.totalElements || 0}
                totalPages={processedLogs?.transactions?.totalPages || 0}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(pageSize) => setPageSize(pageSize)}
            />
        </>
    )
}