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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Check, Loader2 } from "lucide-react";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { DateRangePicker } from "../date-range-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useAuthoriseConsolidation, useBatchAuthoriseConsolidations, useBatchRejectConsolidations, useGetConsolidations, useRejectConsolidation } from "@/hooks/useAccountMaintenance";
import { DataErrorState } from "../ipo/loaders";
import { PaginationBar } from "../pagination-bar";
import { Consolidation } from "@/types/account-maintenance";
import { formatDate } from "@/lib/utils/format";

export default function PendingAuth({ tab }: { tab: string }) {
    const { currentUser } = useStore();
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE"
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [register, setRegister] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );

    const [selected, setSelected] = useState<Consolidation | null>(null);

    const [reviewOpen, setReviewOpen] = useState(false)

    const [rejectComment, setRejectComment] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchRejectOpen, setBatchRejectOpen] = useState(false);


    const { data, isLoading, isError, error, refetch } = useGetConsolidations({
        status: "PENDING",
        page: currentPage,
        pageSize: pageSize,
        from: dateRange?.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : undefined,
        to: dateRange?.to
            ? format(dateRange.to, "yyyy-MM-dd")
            : undefined,
        registerId: register !== "" ? register : undefined
    }, {
        enabled: tab === "auth"
    })

    const batchApproveMutation = useBatchAuthoriseConsolidations()
    const batchRejectMutation = useBatchRejectConsolidations()
    const approveMutation = useAuthoriseConsolidation();
    const rejectMutation = useRejectConsolidation();

    const consolidations = data?.content || []
    const totalPages = data?.pagination?.totalPages || 0
    const total = data?.pagination?.total || 0;

    function openReview(row: Consolidation) {
        setSelected(row);
        setRejectComment("");
        setReviewOpen(true);
    }

    function toggleSelect(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function toggleSelectAll(ids: number[]) {
        setSelectedIds((prev) =>
            prev.size === ids.length ? new Set() : new Set(ids),
        );
    }

    function handleBatchApprove() {
        if (selectedIds.size === 0) return;

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        batchApproveMutation.mutate({
            ids: Array.from(selectedIds).map(String),
            comment: "Consolidation authorised",
            authorisedBy: currentUser?.email
        }, {
            onSuccess: () => {
                toast.success(`${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} approved.`);
                setSelectedIds(new Set());
                refetch();
            },
            onError: (err) => {
                toast.error(err.message || "Failed to approve records");
            }
        });
    }

    const handleBatchReject = () => {
        if (rejectComment.trim() === "") {
            toast.error("Please enter a rejection comment");
            return;
        }

        if (selectedIds.size === 0) {
            toast.error("Please select at least one consolidation");
            return;
        }

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        batchRejectMutation.mutate(
            {
                ids: Array.from(selectedIds).map(String),
                comment: rejectComment,
                authorisedBy: currentUser?.email,
            },
            {
                onSuccess: () => {
                    refetch();
                    setBatchRejectOpen(false);
                    setSelectedIds(new Set());
                    setRejectComment("");
                    toast.success("Consolidations rejected successfully");
                },
                onError: (error: any) => {
                    toast.error(error?.message || "Failed to reject consolidations");
                },
            },
        );
    };

    function handleReject() {
        if (!selected) return;

        if (rejectComment.trim() === "") {
            toast.error("Please enter a rejection comment");
            return;
        }

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        rejectMutation.mutate({
            id: selected?.id,
            data: {
                comment: rejectComment,
                authorisedBy: currentUser?.email
            }
        }, {
            onSuccess: () => {
                toast.success("Consolidation rejected successfully");
                setReviewOpen(false);
                setSelected(null);
                setRejectComment("");
                refetch();
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to reject consolidation");
            }
        })
    }

    function handleApprove() {
        if (!selected) return;

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        approveMutation.mutate({
            id: selected?.id,
            data: {
                comment: "Consolidation Authorised",
                authorisedBy: currentUser?.email
            }
        }, {
            onSuccess: () => {
                toast.success("Consolidation approved successfully");
                setReviewOpen(false);
                setSelected(null);
                setRejectComment("");
                refetch();
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to reject consolidation");
            }
        })
    }


    const visibleIds = consolidations.map((r) => r.id);

    const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));


    if (isLoading) {
        return (
            <EntitlementTableSkeleton />
        );
    }

    return (
        <>
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <span className="text-sm font-semibold text-primary">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-2 ml-auto">
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => setBatchRejectOpen(true)}
                        >
                            Reject Selected
                        </Button>
                        <Button size="sm" disabled={batchApproveMutation.isPending} onClick={handleBatchApprove}>
                            {batchApproveMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mrpsl-loader" />
                                    Approving...
                                </>
                            ) : (
                                "Approve Selected"
                            )}
                        </Button>
                    </div>
                </div>
            )}
            <div className="flex gap-2 items-center flex-wrap py-4">

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
                                <th className="p-3 w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={() => toggleSelectAll(visibleIds)}
                                    />
                                </th>
                                <th className="p-3">DATE</th>
                                <th className="p-3">SOURCE ACCOUNTS</th>
                                <th className="p-3">DESTINATION</th>
                                <th className="p-3">TOTAL HOLDINGS</th>
                                <th className="p-3">SUBMITTED BY</th>
                                <th className="p-3">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px]">
                            {consolidations?.length > 0 ? consolidations?.map((row) => (
                                <tr key={row.id} className="mrpsl-table-row">
                                    <td className="p-3">
                                        <Checkbox
                                            checked={selectedIds.has(row.id)}
                                            onCheckedChange={() => toggleSelect(row.id)}
                                        />
                                    </td>
                                    <td className="p-3 text-muted-foreground">{formatDate(row?.createdAt)}</td>
                                    <td className="p-3 font-mono text-muted-foreground">
                                        {row?.sourceAccounts?.length > 0 ? row.sourceAccounts?.map((account) => account?.accountNumber).join(", ") : "---"}
                                    </td>
                                    <td className="p-3 font-medium">{row?.destinationAccount?.accountNumber}({row?.destinationAccount?.holderName})</td>
                                    <td className="p-3 text-right font-mono font-semibold">
                                        {row?.totalHoldings?.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {row?.initiatorName}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button size="sm" onClick={() => openReview(row)}>
                                            Review &amp; Authorise
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                        No pending account consolidations found.
                                    </td>
                                </tr>
                            )}
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


            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="max-w-lg max-h-[700px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review Account Consolidation</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-6 px-8 pb-8">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                Approving will permanently deactivate all source accounts and
                                transfer their holdings to the destination.
                            </div>

                            <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                                <div className="space-y-2">
                                    <div>
                                        <div className="mrpsl-section-title">
                                            Source Accounts (to deactivate)
                                        </div>
                                        <div className="font-mono text-sm mt-0.5 text-muted-foreground">
                                            {selected?.sourceAccounts?.length > 0 ? selected.sourceAccounts?.map((account) => account?.accountNumber).join(", ") : "---"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mrpsl-section-title">
                                            Destination (surviving account)
                                        </div>
                                        <div className="font-medium text-sm mt-0.5">
                                            {selected?.destinationAccount?.accountNumber}({selected.destinationAccount?.holderName})
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mrpsl-section-title">
                                            Total Holdings to Transfer
                                        </div>
                                        <div className="text-2xl tabular-nums font-bold mt-0.5 text-primary">
                                            {selected?.totalHoldings?.toLocaleString()} units
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-border/60 rounded-xl p-4">
                                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                                    Approval Chain
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        {
                                            label: `Submitted by ${selected?.initiatorName}`,
                                            done: true,
                                            pending: false,
                                        },
                                        {
                                            label: "Authoriser — Pending your action",
                                            done: false,
                                            pending: true,
                                        },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div
                                                className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : "bg-amber-200 animate-pulse"}`}
                                            >
                                                {step.done && (
                                                    <Check className="h-3 w-3 text-green-600" />
                                                )}
                                            </div>
                                            <div className="text-sm">{step.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="mrpsl-label">Comment</label>
                                <Textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder="Required for rejection..."
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border/60">
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                >
                                    {rejectMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mrpsl-loader" />
                                            Rejecting...
                                        </>
                                    ) : (
                                        "Reject"
                                    )}
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                >
                                    {approveMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mrpsl-loader" />
                                            Authorising...
                                        </>
                                    ) : (
                                        "Authorise Consolidation"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
                <DialogContent className="max-w-lg max-h-[700px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Reject {Array.from(selectedIds).length} Record
                            {Array.from(selectedIds).length !== 1 ? "s" : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 px-6 pb-6">
                        <p className="text-sm text-muted-foreground">
                            This comment will be applied to all selected records and sent to the
                            initiator.
                        </p>
                        <div className="space-y-2">
                            <label className="mrpsl-label">
                                Rejection Comment <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="State reason for rejection..."
                                className="resize-none"
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-3 pt-2 border-t">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={() => setBatchRejectOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleBatchReject}
                                disabled={batchRejectMutation.isPending}
                            >
                                {batchRejectMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mrpsl-loader" />
                                        Rejecting...
                                    </>
                                ) : (
                                    "Confirm Rejection"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
