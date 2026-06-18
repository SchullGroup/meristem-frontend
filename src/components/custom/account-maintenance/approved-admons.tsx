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
    useCreateAdmonReversal,
} from "@/hooks/useAccountMaintenance";
import { useGetRegisters } from "@/hooks/useRegisters";
import { Admon } from "@/types/account-maintenance";
import { DateRange } from "react-day-picker";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { DateRangePicker } from "../date-range-picker";
import { DataErrorState } from "../ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import { Eye } from "lucide-react";
import { DocPreview } from "../doc-upload-zone";

export default function ApprovedAdmons({ tab }: { tab: string }) {
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE"
    });

    const { currentUser } = useStore();

    //----------------- filters -------------- //
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [registerId, setRegisterId] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );

    //------------ review and reversal ------------------ //
    const [selected, setSelected] = useState<Admon | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reason, setReason] = useState("");

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
        status: "APPROVED"
    }, {
        enabled: tab === "approved"
    });

    const initiateReversalMutation = useCreateAdmonReversal();

    const approvedAdmons = data?.data?.data || [];
    const totalPages = data?.data?.totalPages || 1;
    const total = data?.data?.total || 0;

    function closeModal() {
        setReason("");
        setSelected(null);
        setReviewOpen(false);
    }


    function handleReverseAdmon() {
        if (!selected) {
            toast.error("Please select an admon to reverse");
            return;
        };

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        if (!reason) {
            toast.error("Please provide a reason for reversal");
            return;
        }

        if (reason.trim().length < 3) {
            toast.error("Reason must be at least 3 characters long");
            return;
        }

        initiateReversalMutation.mutate({
            admonId: selected?.id,
            data: {
                reason,
                initiatedBy: currentUser?.email
            }
        }, {
            onSuccess: () => {
                toast.success("Admon reversal initiated");
                closeModal();
                refetch();
            },
            onError: (err) => {
                toast.error(err.message || "Failed to approve records");
            }
        });
    }

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


            <Card className="mrpsl-card overflow-hidden">
                {isError ? <DataErrorState
                    message={error?.message || "Failed to load historical admons."}
                    onRetry={refetch}
                /> :
                    <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                            <tr>

                                <th className="p-3">DATE</th>
                                <th className="p-3">ACCOUNT</th>
                                <th className="p-3">ORIGINAL DECEASED</th>
                                <th className="p-3">CURRENT ADMINISTRATOR</th>
                                <th className="p-3">PROBATE NO</th>
                                <th className="p-3">AUTHORISED BY</th>
                                <th className="p-3">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px]">
                            {approvedAdmons?.length > 0 ? approvedAdmons?.map((row) => (
                                <tr key={row.id} className="mrpsl-table-row">

                                    <td className="p-3 text-muted-foreground">{formatDate(row.createdAt)}</td>
                                    <td className="p-3 font-mono">{row.deceasedAccountNumbers?.join(", ")}</td>
                                    <td className="p-3 font-medium">{row.deceasedHolderName}</td>
                                    <td className="p-3">{row.adminName}</td>
                                    <td className="p-3 font-mono text-muted-foreground">
                                        {row.probateNumber}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {row.authorisedBy}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openReview(row)}
                                        >
                                            <Eye /> View
                                        </Button>
                                    </td>
                                </tr>
                            )) : <tr>
                                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                    No approved admons.
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



            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Initiate Reversal for {selected?.estateNamePreview}</DialogTitle>
                    </DialogHeader>
                    {selected && <div className="space-y-4 p-4">
                        <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="mrpsl-section-title">Accounts</div>
                                    <div className="font-mono font-bold mt-0.5">
                                        {selected.deceasedAccountNumbers?.join(", ") || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Deceased Holder
                                    </div>
                                    <div className="font-semibold text-sm mt-0.5 text-destructive">
                                        {selected.deceasedHolderName}
                                    </div>
                                </div>

                                <div>
                                    <div className="mrpsl-section-title">Probate Court</div>
                                    <div className="font-mono text-sm mt-0.5">
                                        {selected.probateCourt}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">Probate No</div>
                                    <div className="font-mono text-sm mt-0.5">
                                        {selected.probateNumber}
                                    </div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Administrator / Executor
                                    </div>
                                    <div className="text-sm mt-0.5">{selected.adminName}</div>
                                </div>
                                <div>
                                    <div className="mrpsl-section-title">
                                        Probate Date
                                    </div>
                                    <div className="text-sm mt-0.5">{formatDate(selected.probateDate)}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="mrpsl-section-title">
                                        Probate / Letter of Administration
                                    </div>
                                    <DocPreview url={selected?.probateDocUrl} />

                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="mrpsl-label">Reason for Reversal</label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please enter a reason for reversal..."
                                className="resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setReviewOpen(false); setSelected(null) }}>
                                Cancel
                            </Button>
                            <Button variant="secondary" onClick={handleReverseAdmon} disabled={initiateReversalMutation.isPending}>
                                {initiateReversalMutation.isPending ? "Processing..." : "Reverse Selected"}
                            </Button>
                        </div>
                    </div>}
                </DialogContent>
            </Dialog>
        </>
    );
}
