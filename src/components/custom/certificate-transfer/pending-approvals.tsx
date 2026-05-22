"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TransferRequest } from "@/types/cscs";
import { useGetAllTransferRequests, useBatchApproveOrRejectTransferRequest } from "@/hooks/useCertTransfer";
import { PaginationBar } from "../pagination-bar";
import { ReviewTranser, RejectTransfer } from "./review-transfer";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

export const PendingApprovals = () => {
    const [reviewOpen, setReviewOpen] = useState(false);
    const [selected, setSelected] = useState<TransferRequest | null>(null);
    // const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchRejectOpen, setBatchRejectOpen] = useState(false);

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)

    const { data, isLoading, isError, error, refetch } = useGetAllTransferRequests({
        page: page,
        pageSize: pageSize,
        status: "PENDING"
    });

    const batchApproveMutation = useBatchApproveOrRejectTransferRequest();

    const openReview = (row: TransferRequest) => {
        setSelected(row);
        setReviewOpen(true);
    };

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleSelectAll(ids: string[]) {
        setSelectedIds((prev) =>
            prev.size === ids.length ? new Set() : new Set(ids),
        );
    }
    function handleBatchApprove() {
        if (selectedIds.size === 0) return;

        batchApproveMutation.mutate({
            approveIds: Array.from(selectedIds),
            rejectIds: [],
            rejectComment: "",
            authorisedBy: "ADMIN"
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

    const pendingTransfers = data?.data?.content || [];
    const visibleTransferIds = pendingTransfers.map((r: TransferRequest) => r.id);
    const transferAllSelected =
        visibleTransferIds.length > 0 &&
        visibleTransferIds.every((id: string) => selectedIds.has(id));

    if (isLoading) {
        return (
            <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading pending transfer requests...</p>
            </Card>
        );
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
                        <Button size="sm" onClick={handleBatchApprove}>
                            Approve Selected
                        </Button>
                    </div>
                </div>
            )}

            {
                isError ? (<Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-destructive min-h-[400px]">
                    <p className="font-semibold text-lg mb-2">Failed to load requests</p>
                    <p className="text-sm mb-4">{error?.message || "An unexpected error occurred"}</p>
                    <Button onClick={() => refetch()} variant="outline">Try Again</Button>
                </Card>) : (
                    <Card className="mrpsl-card overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="mrpsl-table-header">
                                <tr>
                                    <th className="p-3 w-10">
                                        <Checkbox
                                            checked={transferAllSelected}
                                            onCheckedChange={() =>
                                                toggleSelectAll(visibleTransferIds)
                                            }
                                        />
                                    </th>
                                    <th className="p-3">DATE</th>
                                    <th className="p-3">CERTIFICATE</th>
                                    <th className="p-3">FROM</th>
                                    <th className="p-3">TO</th>
                                    <th className="p-3">UNITS</th>
                                    <th className="p-3">STAMP DUTY</th>
                                    <th className="p-3">SUBMITTED BY</th>
                                    <th className="p-3">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px]">
                                {pendingTransfers.map((row: TransferRequest) => (
                                    <tr key={row.id} className="mrpsl-table-row">
                                        <td className="p-3">
                                            <Checkbox
                                                checked={selectedIds.has(row.id)}
                                                onCheckedChange={() => toggleSelect(row.id)}
                                            />
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-3 font-mono">{row.sourceCertNumber}</td>
                                        <td className="p-3">
                                            <div className="font-medium">{row.fromHolder}</div>
                                            <div className="font-mono text-muted-foreground text-[13px]">
                                                {row.fromAccount}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium">{row.toHolder}</div>
                                            <div className="font-mono text-muted-foreground text-[13px]">
                                                {row.toAccount}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right tabular-nums font-semibold">
                                            {row.units?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">
                                            ₦{row.stampDuty?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {row.submittedBy}
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button size="sm" onClick={() => openReview(row)}>
                                                Review &amp; Decide
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingTransfers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="p-12 text-center text-muted-foreground"
                                        >
                                            No pending transfer approvals.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                )}

            <PaginationBar
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                total={data?.data?.totalElements || 0}
                pageBase={1}
                onPageSizeChange={setPageSize}
                totalPages={data?.data?.totalPages}
            />

            <ReviewTranser
                reviewOpen={reviewOpen}
                setReviewOpen={setReviewOpen}
                selected={selected}
                onSuccess={() => refetch()}
            />

            <RejectTransfer
                selectedIds={Array.from(selectedIds)}
                selectedTransfers={pendingTransfers.filter((t: TransferRequest) => selectedIds.has(t.id))}
                batchRejectOpen={batchRejectOpen}
                setBatchRejectOpen={setBatchRejectOpen}
                onSuccess={() => {
                    setSelectedIds(new Set());
                    refetch();
                }}
            />
        </>
    );
};