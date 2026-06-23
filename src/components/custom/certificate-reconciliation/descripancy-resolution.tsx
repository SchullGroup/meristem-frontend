
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useGetReconciliations, useUpdateCscsTransaction } from "@/hooks/useCscs";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { ProcessedTransaction, ReconciliationFlaggedTransaction } from "@/types/cscs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface props {
    open: boolean,
    setOpen: (open: boolean) => void,
    selectedTransaction: ReconciliationFlaggedTransaction | null,
    setSelectedTransaction: React.Dispatch<React.SetStateAction<ReconciliationFlaggedTransaction | null>>
}

export default function DiscrepancyResolution({ open, setOpen, selectedTransaction, setSelectedTransaction }: props) {
    const [txUnits, setTxUnits] = useState(0);
    const [updateSide, setUpdateSide] = useState<"CSCS" | "MRPSL">("CSCS");

    // ── NETWORK LAYER QUERY: FETCH SIDE-BY-SIDE LEDGERS ─────────────────
    const { data: reconData, isFetching: isLoadingLedger } = useGetReconciliations({
        register: selectedTransaction?.register || "",
        chn: selectedTransaction?.chn || "",
        page: 0,       // Pull page 0 completely
        size: 100,     // Request a wide baseline layer so we can run virtual split splicing safely
    }, {
        enabled: open && !!selectedTransaction?.chn && !!selectedTransaction?.register,
        refetchOnWindowFocus: false,
    });

    // ── NETWORK LAYER MUTATION: RESOLVE TRANSACTION ────────────────────
    const { mutate: updateCscsTransaction, isPending: isSubmitting } = useUpdateCscsTransaction();

    const handleApproval = () => {
        if (!selectedTransaction?.id) return;

        if (txUnits <= 0) {
            toast.error("All insertion form fields are explicitly required.");
            return;
        }

        const updatePayload: Partial<ProcessedTransaction> = {
            units: txUnits,
        };

        updateCscsTransaction({
            id: selectedTransaction.id,
            data: updatePayload,
        }, {
            onSuccess: () => {
                toast.success("Missing transaction inserted successfully. Ledger balances updated.");
                setTxUnits(0);
                setSelectedTransaction(null);
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to submit transaction adjustments.");
            },
        });
    };

    {/* Discrepancy Resolution Dialog */ }
    return (<Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Discrepancy Resolution</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 p-4">

                {/* Alert */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        <strong>Missing purchase identified:</strong> {formatNumber(selectedTransaction?.shortfall)} units on {formatDate(selectedTransaction?.transactionDate)} not reflected in MRPSL register.
                    </p>
                </div>

                {/* SIDE BY SIDE HISTORICAL LOG TABLES */}
                {isLoadingLedger ? (
                    <div className="h-32 flex flex-col items-center justify-center border border-border/40 rounded-xl bg-muted/10 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Pulling ledger positions from host registers...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {/* MRPSL VIEW CARD */}
                        <Card className="overflow-hidden shadow-sm flex flex-col border border-border">
                            <div className="px-4 py-2 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                MRPSL Records ({reconData?.mrpsl?.totalElements || 0})
                            </div>
                            <div className="p-3 max-h-[180px] overflow-y-auto space-y-2 text-xs bg-background shadow-inner">
                                {reconData?.mrpsl?.content.map((pos) => (
                                    <div key={pos.id} className="flex justify-between items-center border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{pos.transactionDate} ({pos.type})</span>
                                            <span className="text-[10px] text-muted-foreground">Ref: {pos.transferNo}</span>
                                        </div>
                                        <span className="font-mono font-bold text-foreground">{formatNumber(pos?.units)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* CSCS VIEW CARD */}
                        <Card className="overflow-hidden shadow-sm flex flex-col border border-border">
                            <div className="px-4 py-2 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                CSCS Records ({reconData?.cscs?.totalElements || 0})
                            </div>
                            <div className="p-3 max-h-[180px] overflow-y-auto space-y-2 text-xs bg-background shadow-inner">
                                {reconData?.cscs?.content.map((pos) => (
                                    <div key={pos.id} className="flex justify-between items-center border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{pos.transactionDate} ({pos.type})</span>
                                            <span className="text-[10px] text-muted-foreground">Status: {pos.transStatus}</span>
                                        </div>
                                        <span className="font-mono font-bold text-foreground">{formatNumber(pos.units)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                )}

                {/* Insert missing transaction */}
                <Card className="mrpsl-card p-5 space-y-4">
                    <h3 className="font-semibold text-sm">
                        Insert Missing Transaction
                    </h3>
                    <div className="flex gap-4 items-center">
                        <label className="text-sm font-medium">Update Side:</label>
                        <RadioGroup value={updateSide} onValueChange={(val) => setUpdateSide(val as "CSCS" | "MRPSL")} className="flex gap-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="CSCS" id="cscs" />
                                <label className="mrspl-label" htmlFor="cscs">CSCS (Shortfall)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="MRPSL" id="mrpsl" />
                                <label className="mrspl-label" htmlFor="mrpsl">MRPSL (CSCS ahead)</label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="mrpsl-label">Transaction Date</label>
                            <Input
                                value={selectedTransaction?.transactionDate || ""}
                                disabled
                                className="mrpsl-input tabular"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Transfer No</label>
                            <Input
                                name="transferNo"
                                value={selectedTransaction?.transferNo || ""}
                                disabled
                                className="mrpsl-input tabular"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Units</label>
                            <Input
                                name="units"
                                type="number"
                                value={txUnits}
                                onChange={(e) => setTxUnits(Number(e.target.value))}
                                className="mrpsl-input tabular"
                            />
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
                    <Button className="w-full" disabled={isSubmitting} onClick={handleApproval}>
                        {isSubmitting ? (
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