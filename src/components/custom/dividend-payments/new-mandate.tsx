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
import { useBatchPushMandateQueueToNibss,  useGetDividendDeclarations, useGetMandatePayments,  usePushMandateQueueToNibss } from "@/hooks/useDividendPayment";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { useGetRegisters } from "@/hooks/useRegisters";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";

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


export const NewMandatePayment = ({ tab }: { tab: string }) => {
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [mandateRegister, setMandateRegister] = useState("");
    const [mandateDividend, setMandateDividend] = useState("");
    // const [mandateStatus, setMandateStatus] = useState("all");
    const [mandateSelIds, setMandateSelIds] = useState<Set<string>>(new Set());

    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    });

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

    const filteredMandateQueue = mandateData?.data?.content || [];
    const total = mandateData?.data?.totalElements || 0;
    const totalPages = mandateData?.data?.totalPages || 0;

    const registers = activeRegisters?.content || [];
    const dividendNumbers = dividendNumbersData?.data?.content || [];

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
        if (!mandateSelIds.size) return toast.error("Select records to push");


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
        if (!id) return toast.error("Invalid record ID");

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
        return <PendingListSkeleton cols={9} />
    }

    return (
        <>
            <div className="flex gap-3 items-end flex-wrap">
                <Select
                    value={mandateRegister}
                    onValueChange={(v) => {
                        setMandateRegister(v ?? "");
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="w-48 mrpsl-input">
                        <SelectValue placeholder="All Registers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Registers</SelectItem>
                        {registers.map((r) => (
                            <SelectItem key={r.registerId} value={r.registerId}>
                                {r.symbol}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

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
                </Select>

                {/* <Select
                    value={mandateStatus}
                    onValueChange={(v) => {
                        setMandateStatus(v ?? "");
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="w-40 mrpsl-input">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Payment Status</SelectItem>
                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                </Select> */}
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
                                    <th className="p-3">ACCOUNT NO</th>
                                    <th className="p-3">HOLDER NAME</th>
                                    <th className="p-3">NEW BANK</th>
                                    <th className="p-3">SORT CODE</th>
                                    <th className="p-3">AMOUNT (₦)</th>
                                    <th className="p-3">DIVIDEND NO</th>
                                    <th className="p-3">PAYMENT STATUS</th>
                                    <th className="p-3">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px]">
                                {filteredMandateQueue.map((row: any) => (
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
                                        <td className="p-3 font-mono">{row.accountNumber || row.account}</td>
                                        <td className="p-3 font-medium">{row.holderName || row.holder}</td>
                                        <td className="p-3">{row.bankName || row.bank}</td>
                                        <td className="p-3 font-mono">{row.sortCode}</td>
                                        <td className="p-3 text-right tabular-nums font-semibold">
                                            ₦{formatNumber(row.amount || row.grossAmount)}
                                        </td>
                                        <td className="p-3 font-mono text-muted-foreground">
                                            {row.dividendNumber || row.dividendNo}
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
                                            colSpan={9}
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