"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

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
import { PaginationBar } from "../pagination-bar";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { type AdmonReversal } from "@/types/account-maintenance";
import { DataErrorState } from "../ipo/loaders";
import { AdmonReversalDialog } from "./admon-review";
import {
    useGetAdmonReversals,
    useBatchAuthoriseAdmons,
    useBatchRejectAdmons,
} from "@/hooks/useAccountMaintenance";
import { formatDate } from "@/lib/utils/format";

export default function AdmonReversal({ tab }: { tab: string }) {
    const { currentUser } = useStore();

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [selected, setSelected] = useState<AdmonReversal | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [rejectComment, setRejectComment] = useState("");
    const [batchRejectOpen, setBatchRejectOpen] = useState(false);

    function openReview(row: AdmonReversal) {
        setSelected(row);
        setReviewOpen(true);
    }

    const { data, isLoading, error, isError, refetch } = useGetAdmonReversals({
        page: currentPage,
        pageSize: pageSize,
    }, {
        enabled: tab === "reversal"
    });

    const authoriseMutation = useBatchAuthoriseAdmons();
    const rejectMutation = useBatchRejectAdmons();

    const reversedAdmons = data?.data?.data || [];
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

    const handleBatchApprove = () => {
        if (selectedIds.size === 0) return;

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        const ids = Array.from(selectedIds).map(String);

        authoriseMutation.mutate({
            ids: ids,
            comment: "Admon reversals authorised",
            authorisedBy: currentUser?.email
        }, {
            onSuccess: () => {
                toast.success(`Reversal authorised successfully.`);
                setSelectedIds(new Set());
                refetch();
            },
            onError: (err: any) => {
                toast.error(err?.message || "Failed to approve reversal");
            }
        });




    };

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

        const ids = Array.from(selectedIds).map(String);


        rejectMutation.mutateAsync({
            ids: ids,
            comment: rejectComment,
            authorisedBy: currentUser?.email
        }, {
            onSuccess: () => {
                toast.success("Reversal rejected successfully.");
                setBatchRejectOpen(false);
                setSelectedIds(new Set());
                setRejectComment("");
                refetch();
            },


            onError: (err: any) => {
                toast.error(err?.message || "Failed to reject reversal");
            }
        });



    };

    const visibleIds = reversedAdmons.map((r) => r.id);

    const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    if (isLoading) {
        return <EntitlementTableSkeleton />;
    }

    return (
        <>
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
                        <Button size="sm" disabled={authoriseMutation.isPending} onClick={handleBatchApprove}>
                            {authoriseMutation.isPending ? "Approving..." : "Approve Selected"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                Reversals cancel a previously approved administration and restore
                the original account state.
            </div>
            <Card className="mrpsl-card overflow-hidden">
                {isError ? <DataErrorState
                    message={error?.message || "Failed to load reversed admons."}
                    onRetry={refetch}
                /> : <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                        <tr>
                            <th className="p-3 w-12">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={() =>
                                        toggleSelectAll(visibleIds)
                                    }
                                />
                            </th>
                            <th className="p-3">DATE</th>
                            <th className="p-3">ACCOUNT</th>
                            <th className="p-3">ORIGINAL DECEASED</th>
                            <th className="p-3">CURRENT ADMINISTRATOR</th>
                            <th className="p-3">REASON FOR REVERSAL</th>
                            <th className="p-3">SUBMITTED BY</th>
                            <th className="p-3">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-[13px]">
                        {reversedAdmons?.length > 0 ? reversedAdmons?.map((row) => (
                            <tr key={row.id} className="mrpsl-table-row">
                                <td className="p-3">
                                    <Checkbox
                                        checked={selectedIds.has(row.id)}
                                        onCheckedChange={() => toggleSelect(row.id)}
                                    />
                                </td>
                                <td className="p-3 text-muted-foreground">{formatDate(row.createdAt)}</td>
                                <td className="p-3 font-mono">{row.accountNumber}</td>
                                <td className="p-3 font-medium">{row.deceasedHolderName}</td>
                                <td className="p-3">{row.currentAdminName}</td>
                                <td className="p-3 text-muted-foreground">
                                    {row.reason}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                    {row.initiatorName}
                                </td>
                                <td className="p-3 text-right">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => openReview(row)}
                                    >
                                        Review &amp; Authorise
                                    </Button>
                                </td>
                            </tr>
                        )) : <tr>
                            <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                No reversed admons.
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

            <AdmonReversalDialog
                reviewOpen={reviewOpen}
                setReviewOpen={setReviewOpen}
                selected={selected}
                onSuccess={refetch}
            />

            <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Selected Administration Reversals</DialogTitle>
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
                            <Button variant="destructive" onClick={handleBatchReject} disabled={rejectMutation.isPending}>
                                {rejectMutation.isPending ? "Rejecting..." : "Reject Selected"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
