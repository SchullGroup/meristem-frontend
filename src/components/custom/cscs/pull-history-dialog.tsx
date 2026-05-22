"use client"

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FlaggedTransaction } from "@/types/cscs";
import { formatNumber } from "@/lib/utils/format";
import DateInput from "@/components/ui/date-input";

interface PullHistoryProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    selectedTransaction: FlaggedTransaction | null;
}


export const PullHistory = ({ open, setOpen, selectedTransaction }: PullHistoryProps) => {
    const [insertMode, setInsertMode] = useState(false);

    const [formData, setFormData] = useState<{
        transactionDate: Date;
        transferNo: string;
        transactionType: "Buy" | "Sell";
        units: string;
        resolutionReason: string;
    }>({
        transactionDate: new Date(),
        transferNo: "",
        transactionType: "Buy",
        units: "",
        resolutionReason: "",
    })

    const handleSubmit = () => {
        if (Object.values(formData).some((value) => value === "")) {
            toast.error("All fields are required");
            return;
        }


        toast.success(
            "Missing transaction inserted. Flagged sell sent to checker for approval.",
        );
        setOpen(false);
        setInsertMode(false);
    }




    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                setOpen(open);
                if (!open) setInsertMode(false);
            }}
        >
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {insertMode
                            ? "Insert Missing Transaction"
                            : "Transaction History"}
                    </DialogTitle>
                    <DialogDescription className="tabular-nums">
                        CHN: {selectedTransaction?.chn} | {selectedTransaction?.holderName} | {selectedTransaction?.register}
                    </DialogDescription>
                </DialogHeader>

                {!insertMode ? (
                    /* ── History view ─────────────────────────────────── */
                    <div className="space-y-5 px-8 pb-8">
                        <div className="bg-muted/40 p-4 rounded-xl">
                            <h4 className="font-semibold text-sm mb-2">
                                Upload Historical CSCS Data
                            </h4>
                            <div className="flex gap-2">
                                <Input type="file" className="mrpsl-input bg-background" />
                                <Button variant="outline">Load</Button>
                            </div>
                        </div>

                        <div className="border border-border/60 rounded-xl overflow-hidden">
                            <div className="px-3 py-2.5 bg-amber-50 text-amber-800 text-[13px] font-semibold flex items-center gap-2 border-b border-amber-200">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                Flagged Sell: {formatNumber(selectedTransaction?.attemptedUnits)} units on {selectedTransaction?.transactionDate}. Current balance:
                                {formatNumber(selectedTransaction?.currentHoldings)}. Shortfall: {formatNumber(selectedTransaction?.shortfall)}.
                            </div>
                            <table className="w-full text-[13px] text-left">
                                <thead className="mrpsl-table-header">
                                    <tr>
                                        <th className="px-3 py-2.5">Date</th>
                                        <th className="px-3 py-2.5">Type</th>
                                        <th className="px-3 py-2.5">Transfer No</th>
                                        <th className="px-3 py-2.5 text-right">Units</th>
                                        <th className="px-3 py-2.5 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    <tr className="bg-green-50/60">
                                        <td className="px-3 py-2.5 tabular-nums">25 Apr 2026</td>
                                        <td className="px-3 py-2.5 text-green-700 font-semibold">
                                            Buy
                                        </td>
                                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                            TRN-8944521
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums text-green-700 font-semibold">
                                            +5,000
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            15,000
                                        </td>
                                    </tr>
                                    <tr className="bg-amber-50/40">
                                        <td
                                            className="px-3 py-2.5 text-amber-700 italic text-[13px]"
                                            colSpan={5}
                                        >
                                            ⚠ Missing in MRPSL register — CSCS shows this Buy but
                                            MRPSL does not.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2.5 tabular-nums">01 Jan 2026</td>
                                        <td className="px-3 py-2.5 text-green-700 font-semibold">
                                            Buy
                                        </td>
                                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                            TRN-8100001
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums text-green-700 font-semibold">
                                            +10,000
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            10,000
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/60">
                            <Button className="w-full" onClick={() => setInsertMode(true)}>
                                Insert Missing Transaction &amp; Resolve
                            </Button>
                            <Button
                                className="w-full"
                                variant="destructive"
                                onClick={() => {
                                    toast.error("Force commit logged for audit review.");
                                    setOpen(false);
                                    setInsertMode(false);
                                }}
                            >
                                Override and Force Commit
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ── Insert form ──────────────────────────────────── */
                    <div className="space-y-5 px-8 pb-8">
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                            <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-900">
                                This will insert the missing Buy transaction into the MRPSL
                                register and submit for checker approval before the flagged
                                sell is committed.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="mrpsl-label">Transaction Date *</label>
                                    <DateInput date={formData.transactionDate} setDate={(e) => setFormData({ ...formData, transactionDate: e })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="mrpsl-label">Transfer No *</label>
                                    <Input
                                        value={formData.transferNo} onChange={(e) => setFormData({ ...formData, transferNo: e.target.value })}
                                        className="mrpsl-input font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="mrpsl-label">Transaction Type</label>
                                    <Select value={formData.transactionType} onValueChange={(e) => setFormData({ ...formData, transactionType: e as "Buy" | "Sell" })}>
                                        <SelectTrigger className="mrpsl-input">
                                            <SelectValue placeholder="Select transaction type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Buy">Buy</SelectItem>
                                            <SelectItem value="Sell">Sell</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="mrpsl-label">Units *</label>
                                    <Input
                                        value={formData.units}
                                        onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                        className="mrpsl-input font-mono"
                                        type="number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="mrpsl-label">Resolution Reason *</label>
                                <textarea
                                    value={formData.resolutionReason}
                                    onChange={(e) => setFormData({ ...formData, resolutionReason: e.target.value })}
                                    className="w-full mrpsl-input rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus-visible:outline-none"
                                    placeholder="Explain why this transaction was missing from the MRPSL register…"
                                />
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => setInsertMode(false)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"

                                >
                                    Submit for Checker Approval
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}