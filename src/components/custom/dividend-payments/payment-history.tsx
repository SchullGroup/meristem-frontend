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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Eye, RotateCcw, } from "lucide-react";
import { useDownloadPaymentRunReceipt, useListPaymentRuns, useRepushPaymentRun } from "@/hooks/useDividendPayment";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { useGetRegisters } from "@/hooks/useRegisters";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { PaymentRun } from "@/actions/dividendPayments";
import { PaginationBar } from "../pagination-bar";



export const PaymentHistory = ({ tab }: { tab: string }) => {

    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    });

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );
    const [selectedRegister, setSelectedRegister] = useState("")

    const [payRunViewOpen, setPayRunViewOpen] = useState(false);
    const [payRunViewTarget, setPayRunViewTarget] = useState<PaymentRun | null>(null);


    const { data, isLoading: fetchingDeclarations, isError, error, refetch } = useListPaymentRuns({
        page,
        size,
        dateFrom: dateRange?.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : undefined,
        dateTo: dateRange?.to
            ? format(dateRange.to, "yyyy-MM-dd")
            : undefined,
        registerId: selectedRegister !== "" ? selectedRegister : undefined
    }, {
        enabled: tab === "history"
    });

    const historyData = data?.data?.content || [];
    const total = data?.data?.totalElements || 0;
    const totalPages = data?.data?.totalPages || 0;


    const downloadMutation = useDownloadPaymentRunReceipt();
    const repushMutation = useRepushPaymentRun();

    const handleRepush = (id: number) => {
        repushMutation.mutate(id, {
            onSuccess: () => {
                toast.success("Added to re-push queue");
            },
            onError: (err) => {
                toast.error(err.message || "Failed to add to re-push queue");
            }
        });
    }

    const handleDownload = (paymentRun: PaymentRun) => {
        downloadMutation.mutate(paymentRun.id,
            {
                onSuccess: (data) => {
                    const blob = new Blob([data], {
                        type: "application/pdf",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `payment-run-receipt-${paymentRun?.ref || ""}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success("Recipt exported successfully.");
                },
                onError: (error) => {
                    toast.error(error.message || "Failed to download recipet.");
                }
            });
    }


    if (fetchingDeclarations) {
        return <PendingListSkeleton cols={9} />
    }

    return (
        <>
            {/* Filters */}
            <Card className="mrpsl-card p-5">
                <div className="flex gap-3 items-end flex-wrap">
                    {/* Register */}
                    <div className="space-y-1.5">
                        <label className="mrpsl-label">Register</label>
                        <Select
                            value={selectedRegister}
                            onValueChange={(v) => {
                                setSelectedRegister(v ?? "");
                            }}
                        >
                            <SelectTrigger className="mrpsl-input">
                                <SelectValue placeholder="All Registers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Registers</SelectItem>
                                {activeRegisters?.content?.map((r) => (
                                    <SelectItem key={r.registerId} value={r.symbol}>
                                        {r.symbol}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                    {/* Date range */}
                    <div className="space-y-1.5">
                        <label className="mrpsl-label">Date Range</label>
                        <DateRangePicker
                            className="mt-0"
                            date={dateRange}
                            setDate={setDateRange}
                        />
                    </div>
                </div>
            </Card>

            <Card className="mrpsl-card overflow-hidden">
                {
                    isError ? (<DataErrorState
                        message={error?.message || "Failed to load payment history."}
                        onRetry={() => refetch()}
                    />) :

                        (<div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="mrpsl-table-header">
                                    <tr>
                                        <th className="px-4 py-3">PAY RUN REF</th>
                                        <th className="px-4 py-3">PAYMENT NO</th>
                                        <th className="px-4 py-3">REGISTER</th>
                                        <th className="px-4 py-3">GATEWAY</th>
                                        <th className="px-4 py-3">TOTAL RECORDS</th>
                                        <th className="px-4 py-3">AMOUNT (₦)</th>
                                        <th className="px-4 py-3">DATE RUN</th>
                                        <th className="px-4 py-3">STATUS</th>
                                        <th className="px-4 py-3">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-[13px]">
                                    {
                                        historyData?.length > 0 ?
                                            historyData?.map((row) => (
                                                <tr key={row.ref} className="mrpsl-table-row">
                                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                                        {row.ref}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">{row.paymentNumber}</td>
                                                    <td className="px-4 py-3 font-semibold">{row.registerSymbol}</td>
                                                    <td className="px-4 py-3">{row.gateway}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {formatNumber(row.totalRecords)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                                        ₦{formatNumber(row.totalAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {formatDate(row.dateRun)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            className={`border-0 text-[13px] ${row.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                                                        >
                                                            {row.status === "PAID" ? "Paid" : "Failed"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-[13px]"
                                                                onClick={() => {
                                                                    setPayRunViewTarget(row);
                                                                    setPayRunViewOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="mr-1 h-3 w-3" /> View
                                                            </Button>
                                                            {row.status === "FAILED" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 text-[13px] text-amber-600"
                                                                    onClick={() =>
                                                                        handleRepush(row.id)
                                                                    }
                                                                >
                                                                    <RotateCcw className="mr-1 h-3 w-3" /> Re-push
                                                                </Button>
                                                            )}
                                                            {row.status === "PAID" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 text-[13px]"
                                                                    onClick={() => handleDownload(row)}
                                                                >
                                                                    <Download className="mr-1 h-3 w-3" /> Receipt
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : <tr>
                                                <td className="px-4 py-3 text-center" colSpan={9}>
                                                    No payment history
                                                </td>
                                            </tr>}
                                </tbody>
                            </table>



                        </div>)}


                <PaginationBar
                    page={page}
                    pageSize={size}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={setSize}
                />
            </Card>

            {/* ── Payment Run View Dialog ── */}
            <Dialog open={payRunViewOpen} onOpenChange={setPayRunViewOpen}>
                <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
                    <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
                        <DialogTitle>Payment Run Details</DialogTitle>
                        <DialogDescription>{payRunViewTarget?.ref ?? ""}</DialogDescription>
                    </DialogHeader>
                    {payRunViewTarget && (
                        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        label: "Pay Run Reference",
                                        value: payRunViewTarget.ref,
                                        mono: true,
                                    },
                                    {
                                        label: "Payment Number",
                                        value: payRunViewTarget.paymentNumber,
                                        mono: true,
                                    },
                                    {
                                        label: "Register",
                                        value: payRunViewTarget.registerSymbol,
                                        mono: false,
                                    },
                                    { label: "Gateway", value: payRunViewTarget.gateway, mono: false },
                                    {
                                        label: "Date Run",
                                        value: formatDate(payRunViewTarget.dateRun),
                                        mono: false,
                                    },
                                    {
                                        label: "Total Records",
                                        value: formatNumber(payRunViewTarget.totalRecords),
                                        mono: true,
                                    },
                                ].map(({ label, value, mono }) => (
                                    <div key={label}>
                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                            {label}
                                        </div>
                                        <div
                                            className={`mt-0.5 text-sm font-medium ${mono ? "font-mono" : ""}`}
                                        >
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-muted/30 rounded-xl border p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mrpsl-section-title">Total Amount</div>
                                    <div className="text-2xl font-mono font-bold mt-1">
                                        ₦{formatNumber(payRunViewTarget.totalAmount)}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Status</div>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${payRunViewTarget.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                                        >
                                            {payRunViewTarget.status === "PAID" ? "Paid" : "Failed"}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Paid Records</div>
                                    <div className="text-lg font-mono font-bold mt-1 text-green-700">
                                        {payRunViewTarget.status === "PAID"
                                            ? formatNumber(payRunViewTarget.paidRecords)
                                            : "0"}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Failed Records</div>
                                    <div className="text-lg font-mono font-bold mt-1 text-red-600">
                                        {payRunViewTarget.status === "FAILED"
                                            ? formatNumber(payRunViewTarget.failedRecords)
                                            : "0"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1.5"
                                    onClick={() => handleDownload(payRunViewTarget)}
                                >
                                    <Download className="h-4 w-4" /> Download Receipt
                                </Button>
                                {payRunViewTarget.status === "FAILED" && (
                                    <Button
                                        className="flex-1 gap-1.5"
                                        onClick={() => {
                                            toast.success("Added to re-push queue");
                                            setPayRunViewOpen(false);
                                        }}
                                    >
                                        <RotateCcw className="h-4 w-4" /> Add to Re-Push Queue
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}