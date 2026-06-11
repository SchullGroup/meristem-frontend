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
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PaginationBar } from "../pagination-bar";
import {
    useGetAdmons,
    useBatchAuthoriseAdmons,
    useBatchRejectAdmons,
} from "@/hooks/useAccountMaintenance";
import { useGetRegisters } from "@/hooks/useRegisters";
import { Admon } from "@/types/account-maintenance";
import { DateRange } from "react-day-picker";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { DateRangePicker } from "../date-range-picker";
import { DataErrorState } from "../ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import { AdmonReviewDialog } from "./admon-review";

export default function PendingAdmon({ tab }: { tab: string }) {
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE"
    });

    const { currentUser } = useStore();

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [registerId, setRegisterId] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );

    const [selected, setSelected] = useState<Admon | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [rejectComment, setRejectComment] = useState("");
    const [batchRejectOpen, setBatchRejectOpen] = useState(false);

    function openReview(row: Admon) {
        setSelected(row);
        setReviewOpen(true);
    }

    const { data, isLoading, error, isError, refetch } = useGetAdmons({
        registerId: registerId !== "" ? registerId : undefined,
        from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        page: currentPage,
        pageSize: pageSize,
        status: "PENDING"
    }, {
        enabled: tab === "pending"
    });

    const batchApproveMutation = useBatchAuthoriseAdmons();
    const batchRejectMutation = useBatchRejectAdmons();

    const pendingAdmons = data?.data?.data || [];
    const totalPages = data?.data?.totalPages || 0;
    const total = data?.data?.total || 0;

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
            comment: "Admons approved",
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
            toast.error("Please select at least one record");
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
                    toast.success("Estate administrations rejected successfully");
                },
                onError: (error: any) => {
                    toast.error(error?.message || "Failed to reject estate administrations");
                },
            },
        );
    };

    const visibleIds = pendingAdmons.map((r) => r.id);

    const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    if (isLoading) {
        return <EntitlementTableSkeleton />;
    }

    return (
        <>
            <div className="flex gap-2 items-center flex-wrap">
                <Select
                    value={registerId}
                    onValueChange={(v) => setRegisterId(v || "")}
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

            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
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
                        <Button size="sm" onClick={handleBatchApprove}>
                            Approve Selected
                        </Button>
                    </div>
                </div>
            )}

            <Card className="mrpsl-card overflow-hidden">
                {isError ? <DataErrorState
                    message={error?.message || "Failed to load historical admons."}
                    onRetry={refetch}
                /> :
                    <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                            <tr>
                                <th className="p-3 w-12">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={() => toggleSelectAll(visibleIds)}
                                    />
                                </th>
                                <th className="p-3">DATE</th>
                                <th className="p-3">ACCOUNT</th>
                                <th className="p-3">ORIGINAL DECEASED</th>
                                <th className="p-3">CURRENT ADMINISTRATOR</th>
                                <th className="p-3">PROBATE NO</th>
                                <th className="p-3">SUBMITTED BY</th>
                                <th className="p-3">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px]">
                            {pendingAdmons?.length > 0 ? pendingAdmons?.map((row) => (
                                <tr key={row.id} className="mrpsl-table-row">
                                    <td className="p-3">
                                        <Checkbox
                                            checked={selectedIds.has(row.id)}
                                            onCheckedChange={() => toggleSelect(row.id)}
                                        />
                                    </td>
                                    <td className="p-3 text-muted-foreground">{formatDate(row.createdAt)}</td>
                                    <td className="p-3 font-mono">{row.deceasedAccountNumbers?.join(", ")}</td>
                                    <td className="p-3 font-medium">{row.deceasedHolderName}</td>
                                    <td className="p-3">{row.adminName}</td>
                                    <td className="p-3 font-mono text-muted-foreground">
                                        {row.probateNumber}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {row.initiatorName}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => openReview(row)}
                                        >
                                            Review &amp; Authorise
                                        </Button>
                                    </td>
                                </tr>
                            )) : <tr>
                                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                    No pending admons.
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

            <AdmonReviewDialog
                reviewOpen={reviewOpen}
                setReviewOpen={setReviewOpen}
                selected={selected}
                onSuccess={refetch}
            />

            <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Selected Estate Administrations</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <label className="mrpsl-label">Rejection Comment</label>
                            <Textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="Please enter a reason for rejection..."
                                className="resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBatchRejectOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleBatchReject}>
                                Reject Selected
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
