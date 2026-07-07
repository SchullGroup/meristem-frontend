
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCreateCscsTransaction } from "@/hooks/useCscs";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { CscsReconciliationRecord, ProcessedTransaction } from "@/types/cscs";
import { useStore } from "@/lib/store";
import DateInput from "@/components/ui/date-input";
import { format } from "date-fns";

interface props {
    open: boolean,
    onClose: () => void,
    /** The top-level reconciliation record (always available — provides chn & register for the payload) */
    selectedTransaction: CscsReconciliationRecord | null,
    /** The specific missing transaction row the user clicked. When null the form starts empty. */
    missingTransaction?: CscsReconciliationRecord | null,
}

export default function DiscrepancyResolutionForm({ open, onClose, selectedTransaction, missingTransaction }: props) {
    const currentUser = useStore((state) => state.currentUser)
    const [data, setData] = useState({
        units: missingTransaction?.units ?? 0,
        transactionDate: missingTransaction?.transactionDate ? new Date(missingTransaction.transactionDate) : new Date(),
        transferNo: missingTransaction?.transferNo ?? "",
        type: missingTransaction?.type ?? "",
    });

    // Re-seed form whenever the modal opens or the selected missing row changes
    useEffect(() => {
        if (open) {
            //eslint-disable-next-line
            setData({
                units: missingTransaction?.units ?? 0,
                transactionDate: missingTransaction?.transactionDate ? new Date(missingTransaction.transactionDate) : new Date(),
                transferNo: missingTransaction?.transferNo ?? "",
                type: missingTransaction?.type ?? "",
            });
        }
    }, [open, missingTransaction]);

    const createTransaction = useCreateCscsTransaction()


    const handleSubmitMissing = () => {
        if (!selectedTransaction) return;

        if (!currentUser) {
            toast.error("Your session has expired. Please login to continue")
            return;
        }

        if (data?.units <= 0) {
            toast.error("Please enter a valid number of units.");
            return;
        }

        if (!data.type || data.type === "") {
            toast.error("Please select a transaction type.");
            return;
        }

        const payload: Omit<ProcessedTransaction, "id" | "holderName" | "batchRef" | "balanceAfter"> & { transStatus: string; } = {
            ...data,
            chn: selectedTransaction.chn,
            register: selectedTransaction.register,
            transStatus: "PENDING",
            processedBy: currentUser?.email,
            transactionDate: format(data?.transactionDate, "yyyy-MM-dd"),
        };

        createTransaction.mutate(
            { data: payload },
            {
                onSuccess: () => {
                    toast.success("Missing transaction inserted successfully.");
                    onClose();
                },
                onError: (error: any) => {
                    toast.error(error?.message || "Failed to insert missing transaction.");
                },
            }
        );
    };


    {/* Discrepancy Resolution Dialog */ }
    return (<Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Insert Missing Transaction</DialogTitle>
                {missingTransaction && (
                    <p className="text-sm text-muted-foreground">
                        Pre-filled from selected row — review and confirm before submitting.
                    </p>
                )}
            </DialogHeader>

            <div className="space-y-5 p-4">

                {/* Alert — only shown when a specific missing row was passed in */}
                {missingTransaction ? (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            <strong>CHN:</strong> {selectedTransaction?.chn} &mdash; {selectedTransaction?.register} &mdash; <strong>{missingTransaction.type}</strong> of <strong>{formatNumber(missingTransaction.units)}</strong> units on {formatDate(missingTransaction.transactionDate)} not reflected in MRPSL register.
                        </p>
                    </div>
                ) : (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            Manually inserting a missing transaction for <strong>CHN:</strong> {selectedTransaction?.chn} &mdash; {selectedTransaction?.register}.
                        </p>
                    </div>
                )}


                {/* Insert missing transaction */}
                <Card className="mrpsl-card p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <DateInput
                                label="Transaction Date"
                                date={data.transactionDate}
                                setDate={(date) => setData({ ...data, transactionDate: date })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Transfer Number</label>
                            <Input
                                name="transferNo"
                                value={data.transferNo}
                                onChange={(e) => setData({ ...data, transferNo: e.target.value })}
                                className="mrpsl-input tabular"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Units</label>
                            <Input
                                name="units"
                                type="number"
                                value={data.units}
                                onChange={(e) => setData({ ...data, units: Number(e.target.value) })}
                                className="mrpsl-input tabular"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Transaction Type</label>
                            <Select
                                value={data.type}
                                onValueChange={(value) => setData({ ...data, type: value || "" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Select Type</SelectItem>
                                    <SelectItem value="BUY">BUY</SelectItem>
                                    <SelectItem value="SELL">SELL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="mrpsl-label">Symbol</label>
                            <Input
                                name="symbol"
                                value={selectedTransaction?.register || ""}
                                disabled
                                className="mrpsl-input tabular"
                            />
                        </div>

                    </div>
                    <Button className="w-full" disabled={createTransaction.isPending} onClick={handleSubmitMissing}>
                        {createTransaction.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Submit for Approval"
                        )}
                    </Button>
                </Card>
            </div>
        </DialogContent>
    </Dialog>)
}