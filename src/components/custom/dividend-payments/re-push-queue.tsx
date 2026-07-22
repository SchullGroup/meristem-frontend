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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, RotateCcw, AlertTriangle } from "lucide-react";
import { useListRepushQueue, useRepushSingle, useBatchRepush } from "@/hooks/useDividendPayment";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import StatusBadge from "../status-badge";
import { useStore } from "@/lib/store";



export const RepushQueue = ({ tab }: { tab: string }) => {
    const currentUser = useStore((state) => state.currentUser);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [repushStatus, setRepushStatus] = useState("");
    const [holderViewOpen, setHolderViewOpen] = useState(false);
    const [holderViewTarget, setHolderViewTarget] = useState<any>(null);
    const [repushConfirmOpen, setRepushConfirmOpen] = useState(false);
    const [repushTarget, setRepushTarget] = useState<any>(null);
    const [repushSelIds, setRepushSelIds] = useState<Set<string>>(new Set());
    const [batchRepushOpen, setBatchRepushOpen] = useState(false);
    const [batchComment, setBatchComment] = useState("");

    const { data: repushData, isLoading: isFetching, isError, error, refetch } = useListRepushQueue({
        page,
        size,
        status: repushStatus !== "" ? repushStatus : undefined
    }, {
        enabled: tab === "repush"
    });

    const repushMutation = useRepushSingle();
    const batchRepushMutation = useBatchRepush();

    const filteredRepush = repushData?.data?.content || [];
    const totalPages = repushData?.data?.totalPages || 1;
    const total = repushData?.data?.totalElements || 0;

    const visibleIds = filteredRepush.map((r) => String(r.id));
    const allChecked =
        visibleIds.length > 0 && visibleIds.every((id) => repushSelIds.has(id));

    function toggleRepushSel(id: string) {
        setRepushSelIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleRepushAll(ids: string[]) {
        setRepushSelIds((prev) =>
            ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
        );
    }

    function openRepushConfirm(row: any) {
        setRepushTarget(row);
        setRepushConfirmOpen(true);
    }

    function confirmRepush() {
        if (!repushTarget) return;
        repushMutation.mutate(repushTarget?.id, {
            onSuccess: () => {
                toast.success(`Re-push initiated for account ${repushTarget?.accountNumber}.`);
                setRepushConfirmOpen(false);
                setRepushTarget(null);
            },
            onError: (err) => {
                toast.error(err.message || "Failed to initiate re-push.");
            }
        });
    }

    function openBatchRepush() {
        if (repushSelIds.size === 0) return;
        setBatchComment("");
        setBatchRepushOpen(true);
    }

    function confirmBatchRepush() {
        if (!batchComment.trim()) {
            toast.error("Comment is required for batch re-push.");
            return;
        }
        if (!currentUser?.email) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        batchRepushMutation.mutate(
            {
                ids: Array.from(repushSelIds),
                comment: batchComment.trim(),
                authorisedBy: currentUser.email,
            },
            {
                onSuccess: () => {
                    toast.success(
                        `${repushSelIds.size} payment${repushSelIds.size !== 1 ? "s" : ""} queued for re-push.`,
                    );
                    setRepushSelIds(new Set());
                    setBatchComment("");
                    setBatchRepushOpen(false);
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to batch re-push payments.");
                },
            },
        );
    }

    return (
        <>
            <div className="flex gap-3 items-end">
                <div className="space-y-1.5">
                    <label htmlFor="repush-status" className="mrpsl-label">
                        Payment Status
                    </label>
                    <Select
                        id="repush-status"
                        value={repushStatus}
                        onValueChange={(v) => {
                            setRepushStatus(v ?? "");
                            setPage(0);
                        }}
                    >
                        <SelectTrigger className="w-44 mrpsl-input">
                            <SelectValue placeholder="Select Payment Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Select Payment Status</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="UNPAID">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {repushSelIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                    <span className="text-sm font-medium text-primary">
                        {repushSelIds.size} payment
                        {repushSelIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <Button size="sm" className="gap-1.5" onClick={openBatchRepush}>
                        <RotateCcw className="h-3.5 w-3.5" /> Batch Re-Push Selected
                    </Button>
                </div>
            )}

            <Card className="mrpsl-card overflow-hidden">
                {isFetching ? <PendingListSkeleton cols={9} /> :
                    isError ? (
                        <DataErrorState message={error?.message || "Failed to load repush queue."} onRetry={() => refetch()} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="mrpsl-table-header">
                                    <tr>
                                        <th className="px-4 py-3 w-10">
                                            <Checkbox
                                                checked={allChecked}
                                                onCheckedChange={() => toggleRepushAll(visibleIds)}
                                            />
                                        </th>
                                        <th className="px-4 py-3">ACCOUNT NO</th>
                                        <th className="px-4 py-3">HOLDER NAME</th>
                                        <th className="px-4 py-3">BANK</th>
                                        <th className="px-4 py-3">PAYMENT NO</th>
                                        <th className="px-4 py-3">AMOUNT (₦)</th>
                                        <th className="px-4 py-3">STATUS</th>
                                        <th className="px-4 py-3">FAIL REASON</th>
                                        <th className="px-4 py-3">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-[13px]">
                                    {filteredRepush.map((row) => (
                                        <tr
                                            key={row?.id}
                                            className={`mrpsl-table-row ${repushSelIds.has(String(row.id)) ? "bg-primary/5" : ""}`}
                                        >
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={repushSelIds.has(String(row.id))}
                                                    onCheckedChange={() =>
                                                        toggleRepushSel(String(row.id))
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-mono">{row?.accountNumber}</td>
                                            <td className="px-4 py-3 font-medium">{row?.holderName}</td>
                                            <td className="px-4 py-3">{row?.bankName}</td>
                                            <td className="px-4 py-3 font-mono text-muted-foreground">
                                                {row?.paymentNumber}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                ₦{formatNumber(row?.grossAmount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={row?.status as string} />
                                            </td>
                                            <td className="px-4 py-3 text-red-600">{row?.failReason}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[13px]"
                                                        onClick={() => {
                                                            setHolderViewTarget(row);
                                                            setHolderViewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="mr-1 h-3 w-3" /> View Holder
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-[13px]"
                                                        onClick={() => openRepushConfirm(row)}
                                                        disabled={repushMutation.isPending}
                                                    >
                                                        <RotateCcw className="mr-1 h-3 w-3" /> Re-push
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRepush.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                No records match the selected status.
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
                    onPageSizeChange={setSize} />
            </Card>

            <Dialog open={repushConfirmOpen} onOpenChange={setRepushConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-amber-100">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <DialogTitle>Confirm Re-Push</DialogTitle>
                        </div>
                        <DialogDescription>
                            {repushTarget &&
                                `Account ${repushTarget?.accountNumber} · ₦${formatNumber(repushTarget?.grossAmount)} via ${repushTarget?.bankName}`}
                        </DialogDescription>
                    </DialogHeader>

                    {repushTarget && (
                        <div className="space-y-4">
                            <div className="bg-muted/30 rounded-xl border p-4 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                        Account
                                    </div>
                                    <div className="font-mono font-bold mt-0.5">
                                        {repushTarget?.accountNumber}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                        Holder
                                    </div>
                                    <div className="font-medium mt-0.5">{repushTarget?.holderName}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                        Bank
                                    </div>
                                    <div className="mt-0.5">{repushTarget?.bankName}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                        Amount
                                    </div>
                                    <div className="font-mono font-bold mt-0.5 text-base">
                                        ₦{formatNumber(repushTarget?.grossAmount)}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                                        Fail Reason
                                    </div>
                                    <div className="text-red-600 mt-0.5">
                                        {repushTarget?.failReason}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This will re-submit the payment to the gateway. Ensure the
                                underlying issue has been resolved before proceeding.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            className="text-sm font-bold px-6 h-11"
                            onClick={() => setRepushConfirmOpen(false)}
                            disabled={repushMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="text-sm font-bold px-8 h-11 rounded-xl"
                            onClick={confirmRepush}
                            disabled={repushMutation.isPending}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Confirm Re-Push
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={batchRepushOpen} onOpenChange={setBatchRepushOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-amber-100">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <DialogTitle>Confirm Batch Re-Push</DialogTitle>
                        </div>
                        <DialogDescription>
                            {repushSelIds.size} payment
                            {repushSelIds.size !== 1 ? "s" : ""} will be
                            re-submitted to the gateway.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 px-6 pb-6">
                        <div className="space-y-2">
                            <label className="mrpsl-label">Comment *</label>
                            <Textarea
                                value={batchComment}
                                onChange={(e) => setBatchComment(e.target.value)}
                                placeholder="Reason for batch re-push..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setBatchRepushOpen(false)}
                                disabled={batchRepushMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 gap-1.5"
                                onClick={confirmBatchRepush}
                                disabled={batchRepushMutation.isPending}
                            >
                                <RotateCcw className="h-4 w-4" /> Confirm Batch
                                Re-Push
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={holderViewOpen} onOpenChange={setHolderViewOpen}>
                <DialogContent className="max-w-md flex flex-col max-h-[90vh] p-0 gap-0">
                    <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
                        <DialogTitle>Holder Details</DialogTitle>
                        <DialogDescription>
                            {holderViewTarget?.accountNumber ?? ""}
                        </DialogDescription>
                    </DialogHeader>
                    {holderViewTarget && (
                        <div className="px-6 py-5 space-y-4">
                            <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                                {[
                                    {
                                        label: "Account No",
                                        value: holderViewTarget.accountNumber,
                                        mono: true,
                                    },
                                    {
                                        label: "Holder Name",
                                        value: holderViewTarget.holderName,
                                        mono: false,
                                    },
                                    { label: "Bank", value: holderViewTarget.bankName, mono: false },
                                    {
                                        label: "Payment No",
                                        value: holderViewTarget.paymentNumber,
                                        mono: true,
                                    },
                                    {
                                        label: "Amount (₦)",
                                        value: formatNumber(holderViewTarget.grossAmount),
                                        mono: true,
                                    },
                                ].map(({ label, value, mono }) => (
                                    <div
                                        key={label}
                                        className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0"
                                    >
                                        <span className="text-sm text-muted-foreground">
                                            {label}
                                        </span>
                                        <span
                                            className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-red-700">
                                    <span className="font-semibold">Failure reason: </span>
                                    {holderViewTarget.failReason}
                                </div>
                            </div>
                            <Button
                                className="w-full gap-1.5"
                                onClick={() => {
                                    openRepushConfirm(holderViewTarget);
                                    setHolderViewOpen(false);
                                }}
                            >
                                <RotateCcw className="h-4 w-4" /> Re-Push This Payment
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}