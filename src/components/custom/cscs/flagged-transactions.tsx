"use client";

import { useState } from "react";
import {
    Search,
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
import { PullHistory } from "./pull-history-dialog";
import { FlaggedTransaction } from "@/types/cscs";
import { useGetRegisters } from "@/hooks/useRegisters";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { useGetCscsFlaggedTransactions } from "@/hooks/useCscs";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";

const PAGE_SIZE = 10

export const FlaggedTransactions = ({ tab }: {
    tab: string
}) => {

    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    }, {
        enabled: tab === "flagged",
    });


    const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null)
    const [flaggedRegister, setFlaggedRegister] = useState("All");
    const [flaggedType, setFlaggedType] = useState<"BUY" | "SELL" | "All">("All");
    const [flaggedStatus, setFlaggedStatus] = useState<"PENDING" | "RESOLVED" | "FORCE_COMMITTED" | "All">("All");
    const [flaggedSearch, setFlaggedSearch] = useState("");
    const [flagSheetOpen, setFlagSheetOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)

    const debouncedSearch = useDebounce(flaggedSearch, 500)

    const { data: flaggedTransactions, isLoading, isError, error, refetch } = useGetCscsFlaggedTransactions(
        {
            register: flaggedRegister !== "ALL" ? flaggedRegister : undefined,
            status: flaggedStatus !== "All" ? flaggedStatus : undefined,
            type: flaggedType !== "All" ? flaggedType : undefined,
            search: debouncedSearch || undefined,
            page: currentPage,
            size: pageSize,
        },
        {
            enabled: tab === "flagged"
        }
    );

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
                        placeholder="Search CHN or holder…"
                        className="pl-9 mrpsl-input"
                        value={flaggedSearch}
                        onChange={(e) => setFlaggedSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={flaggedRegister}
                    onValueChange={(v) => setFlaggedRegister(v || "All")}
                >
                    <SelectTrigger className="w-44 mrpsl-input">
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
                    value={flaggedType}
                    onValueChange={(v) => setFlaggedType(v || "All")}
                >
                    <SelectTrigger className="w-32 mrpsl-input">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="Sell">Sell</SelectItem>
                        <SelectItem value="Buy">Buy</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={flaggedStatus}
                    onValueChange={(v) => setFlaggedStatus(v || "All")}
                >
                    <SelectTrigger className="w-40 mrpsl-input">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="FORCE_COMMITTED">
                            Force Committed
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                    {
                        isLoading ? (
                            <PendingListSkeleton />
                        ) : isError ? (
                            <DataErrorState
                                message={returnErrorMessage(error as ErrorLike)}
                                onRetry={refetch}
                            />
                        ) :
                            (
                                <table className="w-full text-left text-sm">
                                    <thead className="mrpsl-table-header">
                                        <tr>
                                            <th
                                                className="px-4 py-3 cursor-pointer select-none"
                                            >
                                                CHN{" "}

                                            </th>
                                            <th className="px-4 py-3">REGISTER</th>
                                            <th className="px-4 py-3">HOLDER</th>
                                            <th className="px-4 py-3">TRANSFER NO</th>
                                            <th className="px-4 py-3">TYPE</th>
                                            <th
                                                className="px-4 py-3 text-right cursor-pointer select-none"
                                            >
                                                ATTEMPTED

                                            </th>
                                            <th className="px-4 py-3 text-right">HOLDINGS</th>
                                            <th
                                                className="px-4 py-3 text-right cursor-pointer select-none"
                                            >
                                                SHORTFALL{" "}

                                            </th>
                                            <th className="px-4 py-3">STATUS</th>
                                            <th className="px-4 py-3 text-right">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {
                                            Array.isArray(flaggedTransactions?.content) && flaggedTransactions?.content.length > 0 ?
                                                flaggedTransactions?.content?.map((row) => (
                                                    <tr key={row.chn} className="mrpsl-table-row">
                                                        <td className="px-4 py-3 text-[13px] text-muted-foreground tabular-nums">
                                                            {row.chn}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className="border-0 text-[13px] bg-gray-100 text-gray-800"
                                                            >
                                                                {row.register}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold">
                                                            {row.holderName}
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px] tabular-nums text-muted-foreground">
                                                            {row.transferNo}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={`border-0 text-[13px] ${row.type === "Sell" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}
                                                            >
                                                                {row.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right tabular-nums text-red-600 font-semibold">
                                                            {formatNumber(row.attemptedUnits)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right tabular-nums">
                                                            {formatNumber(row.currentHoldings)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-semibold">
                                                            {formatNumber(row.shortfall)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={`border-0 text-[13px] ${row.status === "RESOLVED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                                                            >
                                                                {row.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedTransaction(row)
                                                                    setFlagSheetOpen(true)
                                                                }}
                                                            >
                                                                Pull History
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )) : (<tr>
                                                    <td
                                                        colSpan={9}
                                                        className="text-center py-10 text-muted-foreground"
                                                    >
                                                        No records found
                                                    </td>
                                                </tr>)}
                                    </tbody>
                                </table>
                            )}
                </div>

                {/* Pagination */}
                <PaginationBar
                    page={currentPage}
                    pageSize={PAGE_SIZE}
                    onPageSizeChange={handlePageSizeChange}
                    total={flaggedTransactions?.totalPages || 0}
                    onPageChange={handlePageChange}
                />  </Card>


            <PullHistory
                open={flagSheetOpen}
                setOpen={setFlagSheetOpen}
                selectedTransaction={selectedTransaction}
            />
        </>
    )
}