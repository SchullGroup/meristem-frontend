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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { PaginationBar } from "../pagination-bar";
import { useGetConsolidations } from "@/hooks/useAccountMaintenance";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { DateRangePicker } from "../date-range-picker";
import { formatDate } from "@/lib/utils/format";


export default function History({ tab }: { tab: string }) {
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE"
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [register, setRegister] = useState("");
    const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "">("");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );
    const debouncedSearch = useDebounce(search, 500)


    const { data, isLoading, isError, error, refetch } = useGetConsolidations({
        status: status !== "" ? status : undefined,
        page: currentPage,
        pageSize: pageSize,
        from: dateRange?.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : undefined,
        to: dateRange?.to
            ? format(dateRange.to, "yyyy-MM-dd")
            : undefined,
        q: debouncedSearch !== "" ? debouncedSearch : undefined,
        registerId: register !== "" ? register : undefined
    }, {
        enabled: tab === "history"
    })

    const consolidations = data?.content || []
    const totalPages = data?.pagination?.totalPages || 0
    const total = data?.pagination?.total || 0;

    if (isLoading) {
        return (
            <EntitlementTableSkeleton />
        );
    }

    return (
        <>

            <div className="flex gap-2 items-center flex-wrap">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search CHN or holder…"
                        className="pl-9 mrpsl-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={register}
                    onValueChange={(v) => setRegister(v || "")}
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

                <Select
                    value={status}
                    onValueChange={(v) => setStatus(v || "")}
                >
                    <SelectTrigger className="w-40 mrpsl-input">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="DECLINED">Declined</SelectItem>

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

                {isError ? <DataErrorState
                    message={error?.message || "Failed to load consolidations."}
                    onRetry={refetch}
                /> :
                    <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                            <tr>
                                <th className="p-3">DATE</th>
                                <th className="p-3">SOURCE ACCOUNTS</th>
                                <th className="p-3">DESTINATION</th>
                                <th className="p-3">TOTAL HOLDINGS</th>
                                <th className="p-3">STATUS</th>
                                <th className="p-3">AUTHORISED BY</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px]">
                            {consolidations?.length > 0 ? consolidations?.map((row) => (
                                <tr key={row.id} className="mrpsl-table-row">
                                    <td className="p-3 text-muted-foreground">{row?.createdAt ? formatDate(row.createdAt) : "---"}</td>
                                    <td className="p-3 font-mono text-muted-foreground">
                                        {row?.sourceAccounts?.length > 0 ? row.sourceAccounts?.map((account) => account?.accountNumber).join(", ") : "---"}
                                    </td>
                                    <td className="p-3 font-medium">{row?.destinationAccount?.accountNumber}({row?.destinationAccount?.holderName})</td>
                                    <td className="p-3 text-right font-mono font-semibold">
                                        {row?.totalHoldings?.toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                        {statusBadge(row.status)}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {row.authorisedBy}
                                    </td>
                                </tr>
                            )) : <tr>
                                <td colSpan={6} className="p-3 text-center">
                                    No consolidations found
                                </td>
                            </tr>}
                        </tbody>
                    </table>}
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

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        PENDING: "bg-amber-100 text-amber-800",
        APPROVED: "bg-green-100 text-green-800",
        AUTHORISED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-700",
    };
    return (
        <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-0 text-[12px]`}>
            {status}
        </Badge>
    );
};