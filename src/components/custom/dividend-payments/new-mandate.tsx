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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useBatchPushMandateQueueToNibss, useGetDividendDeclarations, useGetMandatePayments, usePushMandateQueueToNibss } from "@/hooks/useDividendPayment";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import RegisterSelect from "../register-select";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";

const statusBadge = (status: string) => {
    if (status === "PAID")
        return (
            <Badge className="border-0 text-[13px] bg-green-100 text-green-800">
                Paid
            </Badge>
        );
    if (status === "FAILED")
        return (
            <Badge className="border-0 text-[13px] bg-red-100 text-red-700">
                Failed
            </Badge>
        );
    return (
        <Badge className="border-0 text-[13px] bg-amber-100 text-amber-800">
            Unpaid
        </Badge>
    );
};

const nipsStatusBadge = (status?: string) => {
    if (status === "VERIFIED")
        return (
            <Badge className="border-0 text-[13px] bg-green-100 text-green-800">
                Verified
            </Badge>
        );
    if (status === "NAME_MISMATCH")
        return (
            <Badge className="border-0 text-[13px] bg-amber-100 text-amber-800">
                Name Mismatch
            </Badge>
        );
    if (status === "FAILED")
        return (
            <Badge className="border-0 text-[13px] bg-red-100 text-red-700">
                Failed
            </Badge>
        );
    return <span className="text-muted-foreground text-[13px]">—</span>;
};


export const NewMandatePayment = ({ tab }: { tab: string }) => {
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [mandateRegister, setMandateRegister] = useState("");
    const [mandateDividend, setMandateDividend] = useState("");
    const [mandateStatus, setMandateStatus] = useState("");
    const [bankFilter, setBankFilter] = useState("");
    const [nipsStatusFilter, setNipsStatusFilter] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [mandateSelIds, setMandateSelIds] = useState<Set<string>>(new Set());

    const { data: dividendNumbersData } = useGetDividendDeclarations({
        size: 100,
    });

    const { data: mandateData, isLoading: fetchingMandates, isError, error, refetch } = useGetMandatePayments({
        registerId: mandateRegister !== "" ? mandateRegister : undefined,
        dividendNumber: mandateDividend !== "" ? mandateDividend : undefined,
        page,
        size
    }, {
        enabled: tab === "new"
    });

    const rawMandateQueue = mandateData?.data?.content || [];
    const total = mandateData?.data?.totalElements || 0;
    const totalPages = mandateData?.data?.totalPages || 1;

    const dividendNumbers = dividendNumbersData?.data?.content || [];

    const bankOptions = Array.from(
        new Set(
            rawMandateQueue
                .map((r: any) => r.bankName || r.newBank)
                .filter(Boolean),
        ),
    ) as string[];

    const filteredMandateQueue = rawMandateQueue.filter((row: any) => {
        if (mandateStatus !== "" && row.status !== mandateStatus) return false;
        if (bankFilter !== "" && (row.bankName || row.newBank) !== bankFilter)
            return false;
        if (
            nipsStatusFilter !== "" &&
            row.nipsValidationStatus !== nipsStatusFilter
        )
            return false;
        if (dateRange?.from) {
            const rowDateRaw = row.submittedDate || row.createdAt;
            if (!rowDateRaw) return false;
            const rowDate = new Date(rowDateRaw);
            if (rowDate < dateRange.from) return false;
            if (dateRange.to && rowDate > dateRange.to) return false;
        }
        return true;
    });

    const singlePushToNibssMutation = usePushMandateQueueToNibss();
    const batchPushToNibssMutation = useBatchPushMandateQueueToNibss();

    const toggleMandateSel = (id: string) => {
        const next = new Set(mandateSelIds);
        if (next.has(id)) { next.delete(id); }
        else { next.add(id); }
        setMandateSelIds(next);
    };

    const toggleMandateAll = (ids: string[]) => {
        setMandateSelIds((prev) =>
            ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
        );
    };

    const batchPushToNibss = () => {
        if (!mandateSelIds.size) {
            toast.error("Select records to push");
            return;
        };


        batchPushToNibssMutation.mutate({
            ids: Array.from(mandateSelIds)
        }, {
            onSuccess: () => {
                toast.success("Batch push to NIBSS successful.");
                setMandateSelIds(new Set());
            },
            onError: (err) => {
                toast.error(err.message || "Failed to push to NIBSS.");
            }
        });
    };

    const pushToNibss = (id: string) => {
        if (!id) {
            toast.error("Invalid record ID");
            return;
        };

        singlePushToNibssMutation.mutate(
            Number(id)
            , {
                onSuccess: () => {
                    toast.success("Push to NIBSS successful.");
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to push to NIBSS.");
                }
            });

    };

    const visibleIds = filteredMandateQueue.map((r) => String(r.id));
    const allChecked = visibleIds.length > 0 && visibleIds.every((id) => mandateSelIds.has(id))


    if (fetchingMandates) {
        return <PendingListSkeleton cols={11} />
    }

    return (
        <>
            <div className="flex gap-3 items-end flex-wrap">


                <RegisterSelect value={mandateRegister} onChange={(val) => { setMandateRegister(val); setPage(0) }}
                    label="Registers"

                />

                <div className="space-y-1 5">
                    <label className="mrpsl-label">Dividend Number</label>
                    <Select
                        value={mandateDividend}
                        onValueChange={(v) => {
                            setMandateDividend(v ?? "");
                            setPage(0);
                        }}
                    >
                        <SelectTrigger className="w-48 mrpsl-input">
                            <SelectValue placeholder="All Dividends" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Dividends</SelectItem>
                            {dividendNumbers.map((d) => (
                                <SelectItem key={d.paymentNumber} value={d.paymentNumber}>
                                    {d.paymentNumber}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select></div>

                <div className="space-y-1.5">
                    <label className="mrpsl-label">Payment Status</label>
                    <Select
                        value={mandateStatus}
                        onValueChange={(v) => {
                            setMandateStatus(v ?? "");
                        }}
                    >
                        <SelectTrigger className="w-40 mrpsl-input">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            <SelectItem value="UNPAID">Unpaid</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="mrpsl-label">Bank</label>
                    <Select
                        value={bankFilter}
                        onValueChange={(v) => setBankFilter(v ?? "")}
                    >
                        <SelectTrigger className="w-44 mrpsl-input">
                            <SelectValue placeholder="All Banks" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Banks</SelectItem>
                            {bankOptions.map((b) => (
                                <SelectItem key={b} value={b}>
                                    {b}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="mrpsl-label">Mandate Status</label>
                    <Select
                        value={nipsStatusFilter}
                        onValueChange={(v) => setNipsStatusFilter(v ?? "")}
                    >
                        <SelectTrigger className="w-44 mrpsl-input">
                            <SelectValue placeholder="All Mandate Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Mandate Statuses</SelectItem>
                            <SelectItem value="VERIFIED">Verified</SelectItem>
                            <SelectItem value="NAME_MISMATCH">Name Mismatch</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="mrpsl-label">Date Range</label>
                    <DateRangePicker
                        className="mt-0"
                        date={dateRange}
                        setDate={setDateRange}
                    />
                </div>
            </div>

            {/* Batch action toolbar */}
            {mandateSelIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                    <span className="text-sm font-medium text-primary">
                        {mandateSelIds.size} record
                        {mandateSelIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={batchPushToNibss}
                    >
                        Push Selected to NIBSS
                    </Button>
                </div>
            )}

            <Card className="mrpsl-card overflow-hidden">
                {isError ? (
                    <DataErrorState message={error?.message || "Failed to load mandate queue."} onRetry={() => refetch()} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="mrpsl-table-header">
                                <tr>
                                    <th className="p-3 w-10">
                                        <Checkbox
                                            checked={allChecked}
                                            onCheckedChange={() =>
                                                toggleMandateAll(
                                                    visibleIds
                                                )
                                            }
                                        />
                                    </th>
                                    <th className="p-3">#</th>
                                    <th className="p-3">PAYMENT REF</th>
                                    <th className="p-3">ACCOUNT NO</th>
                                    <th className="p-3">HOLDER NAME</th>
                                    <th className="p-3">NEW BANK</th>
                                    <th className="p-3">SORT CODE</th>
                                    <th className="p-3">AMOUNT (₦)</th>
                                    <th className="p-3">DIVIDEND NO</th>
                                    <th className="p-3">MANDATE STATUS</th>
                                    <th className="p-3">PAYMENT STATUS</th>
                                    <th className="p-3">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px]">
                                {filteredMandateQueue.map((row: any, i: number) => (
                                    <tr
                                        key={row.id}
                                        className={`mrpsl-table-row ${mandateSelIds.has(row.id) ? "bg-primary/5" : ""}`}
                                    >
                                        <td className="p-3">
                                            {row.status !== "PAID" && (
                                                <Checkbox
                                                    checked={mandateSelIds.has(row.id)}
                                                    onCheckedChange={() => toggleMandateSel(row.id)}
                                                />
                                            )}
                                        </td>
                                        <td className="p-3 text-muted-foreground tabular-nums">
                                            {page * size + i + 1}
                                        </td>
                                        <td className="p-3 font-mono text-muted-foreground">
                                            {row.approvalRef || "—"}
                                        </td>
                                        <td className="p-3 font-mono">{row.accountNumber}</td>
                                        <td className="p-3 font-medium">{row.holderName || row.holder}</td>
                                        <td className="p-3">{row.bankName || row.bank}</td>
                                        <td className="p-3 font-mono">{row.sortCode}</td>
                                        <td className="p-3 text-right tabular-nums font-semibold">
                                            ₦{formatNumber(row.amount || row.grossAmount)}
                                        </td>
                                        <td className="p-3 font-mono text-muted-foreground">
                                            {row.dividendNumber || row.dividendNo}
                                        </td>
                                        <td className="p-3">
                                            {nipsStatusBadge(row.nipsValidationStatus)}
                                        </td>
                                        <td className="p-3">{statusBadge(row.status)}</td>
                                        <td className="p-3 text-right">
                                            {row.status !== "PAID" && (
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-[13px]"
                                                    onClick={() => pushToNibss(row.id)}
                                                >
                                                    Push to NIBSS
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredMandateQueue.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={11}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            No records match the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <PaginationBar
                    page={page}
                    pageSize={size}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={setSize}
                />
            </Card>
        </>
    )
}