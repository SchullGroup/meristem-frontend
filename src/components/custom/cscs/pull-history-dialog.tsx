"use client"

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CscsPosition, FlaggedTransaction } from "@/types/cscs";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { useUploadCscsHistory } from "@/hooks/useCscs";

interface PullHistoryProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    selectedTransaction: FlaggedTransaction | null;
    // Callback to push up the results to the next step of your pipeline
    onComplete?: () => void;
}


export const PullHistory = ({ open, setOpen, selectedTransaction, onComplete }: PullHistoryProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadedPositions, setUploadedPositions] = useState<CscsPosition[]>([]);

    // Instantiating your custom mutation hook
    const { mutate: uploadHistory, isPending: isUploading } = useUploadCscsHistory({
        onSuccess: (response) => {
            if (response.isSuccessful && response.data) {
                setUploadedPositions(response.data);
                toast.success(`Successfully loaded ${response.data.length} historical records.`);
            } else {
                toast.error(response.responseMessage || "Failed to process the upload layout.");
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || "An error occurred while uploading historical ledger records.");
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadSubmit = () => {
        if (!file || !selectedTransaction) {
            toast.error("Missing critical file or transaction reference criteria.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        uploadHistory({
            register: selectedTransaction.register,
            data: formData,
        });
    };

    const handleProceedToMatch = () => {
        if (onComplete) {
            onComplete();
        }
        // Reset layout states cleanly
        setUploadedPositions([]);
        setFile(null);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
                setUploadedPositions([]);
                setFile(null);
            }
        }}>
            {/* Dynamic max-w optimization: scales up to max-w-4xl if dealing with huge data columns */}
            <DialogContent className={`transition-all duration-300 ${uploadedPositions.length > 0 ? "max-w-4xl" : "max-w-xl"}`}>
                <DialogHeader>
                    <DialogTitle>Pull History</DialogTitle>
                    <DialogDescription className="tabular-nums">
                        CHN: <span className="font-semibold text-foreground">{selectedTransaction?.chn}</span> | {selectedTransaction?.holderName} | {selectedTransaction?.register}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 p-4">

                    {/* ── ACTION ZONE: UPLOAD TRIGGER ------─ */}
                    {uploadedPositions.length === 0 && (
                        <div className="bg-muted/40 p-5 rounded-xl border border-border/60">
                            <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-1.5">
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                Upload Historical CSCS Ledger Document
                            </h4>
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                    className="bg-background"
                                />
                                <Button
                                    onClick={handleUploadSubmit}
                                    disabled={isUploading || !file}
                                    className="min-w-[80px]"
                                >
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── METRIC BLOCK: CURRENT FLAGGED POSITION STATUS ────────────── */}
                    <div className="px-3 py-2.5 bg-amber-50 text-amber-800 text-[13px] font-semibold flex items-center gap-2 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <div>
                            Flagged Shortfall Discrepancy: <span className="font-bold underline text-amber-900">{formatNumber(selectedTransaction?.shortfall)} Units</span>
                            <span className="font-normal mx-2 text-amber-700">|</span>
                            Attempted Sell: {formatNumber(selectedTransaction?.attempted)} units on {formatDate(selectedTransaction?.transactionDate)}
                        </div>
                    </div>

                    {/* ── RENDER DATA PREVIEW: SCROLLABLE FOR LARGE DATASETS ────────── */}
                    {uploadedPositions.length > 0 && (
                        <div className="space-y-3 animate-in fade-in-50 duration-200">
                            <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Found <strong>{uploadedPositions.length}</strong> transaction items matching historical criteria parameters.</span>
                                </div>
                                <Button size="sm" onClick={handleProceedToMatch} className="bg-green-700 hover:bg-green-800 text-white">
                                    Proceed to Missing Match
                                </Button>
                            </div>

                            {/* Set max height with virtualized scroll configuration container */}
                            <div className="border border-border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto shadow-inner bg-background">
                                <table className="w-full text-[13px] text-left border-collapse">
                                    <thead className="bg-muted sticky top-0 border-b border-border shadow-sm z-10">
                                        <tr>
                                            <th className="px-3 py-2.5 bg-muted text-muted-foreground font-medium">Date</th>
                                            <th className="px-3 py-2.5 bg-muted text-muted-foreground font-medium">Type</th>
                                            <th className="px-3 py-2.5 bg-muted text-muted-foreground font-medium">Transfer Reference No</th>
                                            <th className="px-3 py-2.5 bg-muted text-muted-foreground font-medium text-right">Units</th>
                                            <th className="px-3 py-2.5 bg-muted text-muted-foreground font-medium text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {uploadedPositions.map((pos) => {
                                            const isBuy = pos.type?.toLowerCase() === "buy" || pos.type?.toLowerCase() === "cr";
                                            return (
                                                <tr key={pos.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{pos.transactionDate}</td>
                                                    <td className={`px-3 py-2.5 font-semibold ${isBuy ? "text-green-600" : "text-destructive"}`}>
                                                        {pos.type}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-mono text-xs text-foreground max-w-[180px] truncate">
                                                        {pos.transferNo || "---"}
                                                    </td>
                                                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${isBuy ? "text-green-600" : "text-foreground"}`}>
                                                        {isBuy ? "+" : ""}{formatNumber(pos.units)}
                                                    </td>

                                                    <td className="px-3 py-2.5 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${pos.status?.toLowerCase() === "processed"
                                                            ? "bg-green-50 border-green-200 text-green-700"
                                                            : "bg-amber-50 border-amber-200 text-amber-700"
                                                            }`}>
                                                            {pos.status || "Unreconciled"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};