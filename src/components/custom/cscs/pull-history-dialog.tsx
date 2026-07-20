"use client"

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Loader2, Upload, XCircle } from "lucide-react";
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
    onComplete?: () => void;
}

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
    file: File;
    status: FileStatus;
    error?: string;
    count?: number;
}

export const PullHistory = ({ open, setOpen, selectedTransaction, onComplete }: PullHistoryProps) => {
    const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
    const [uploadedPositions, setUploadedPositions] = useState<CscsPosition[]>([]);

    const { mutateAsync: uploadHistoryAsync } = useUploadCscsHistory({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newEntries: FileEntry[] = Array.from(e.target.files).map((f) => ({
                file: f,
                status: "pending",
            }));
            setFileEntries(newEntries);
        }
    };

    const setEntryStatus = (index: number, patch: Partial<FileEntry>) =>
        setFileEntries((prev) =>
            prev.map((e, i) => (i === index ? { ...e, ...patch } : e)),
        );

    const handleUploadSubmit = async () => {
        if (fileEntries.length === 0 || !selectedTransaction) {
            toast.error("Select at least one file and ensure a transaction is selected.");
            return;
        }

        const merged: CscsPosition[] = [];

        for (let i = 0; i < fileEntries.length; i++) {
            setEntryStatus(i, { status: "uploading" });

            const formData = new FormData();
            formData.append("file", fileEntries[i].file);

            try {
                const response = await uploadHistoryAsync({
                    register: selectedTransaction.register,
                    data: formData,
                });

                if (response.isSuccessful && response.data) {
                    merged.push(...response.data);
                    setEntryStatus(i, { status: "done", count: response.data.length });
                } else {
                    setEntryStatus(i, {
                        status: "error",
                        error: response.responseMessage || "Upload failed",
                    });
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Upload error";
                setEntryStatus(i, { status: "error", error: msg });
            }
        }

        if (merged.length > 0) {
            setUploadedPositions(merged);
            toast.success(
                `Loaded ${merged.length} historical records from ${fileEntries.length} file${fileEntries.length !== 1 ? "s" : ""}.`,
            );
        } else {
            toast.error("No records loaded — check file formats and try again.");
        }
    };

    const handleProceedToMatch = () => {
        if (onComplete) onComplete();
        setUploadedPositions([]);
        setFileEntries([]);
        setOpen(false);
    };

    const handleClose = (v: boolean) => {
        setOpen(v);
        if (!v) {
            setUploadedPositions([]);
            setFileEntries([]);
        }
    };

    const allDone = fileEntries.length > 0 && fileEntries.every((e) => e.status === "done" || e.status === "error");
    const hasResults = uploadedPositions.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className={`transition-all duration-300 ${hasResults ? "max-w-4xl" : "max-w-xl"}`}
            >
                <DialogHeader>
                    <DialogTitle>Pull History</DialogTitle>
                    <DialogDescription className="tabular-nums">
                        CHN:{" "}
                        <span className="font-semibold text-foreground">
                            {selectedTransaction?.chn}
                        </span>{" "}
                        | {selectedTransaction?.holderName} | {selectedTransaction?.register}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 p-4">
                    {/* Flagged shortfall banner */}
                    <div className="px-3 py-2.5 bg-amber-50 text-amber-800 text-[13px] font-semibold flex items-center gap-2 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <div>
                            Flagged Shortfall Discrepancy:{" "}
                            <span className="font-bold underline text-amber-900">
                                {formatNumber(selectedTransaction?.shortfall)} Units
                            </span>
                            <span className="font-normal mx-2 text-amber-700">|</span>
                            Attempted Sell: {formatNumber(selectedTransaction?.attempted)} units on{" "}
                            {formatDate(selectedTransaction?.transactionDate)}
                        </div>
                    </div>

                    {/* Upload zone — hidden once results are loaded */}
                    {!hasResults && (
                        <div className="bg-muted/40 p-5 rounded-xl border border-border/60 space-y-3">
                            <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                Upload Historical CSCS Ledger Documents
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Select one or more files (.csv, .xlsx, .xls) — no limit. Records from all files
                                will be merged.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={fileEntries.some((e) => e.status === "uploading")}
                                    className="bg-background"
                                />
                                <Button
                                    onClick={handleUploadSubmit}
                                    disabled={
                                        fileEntries.length === 0 ||
                                        fileEntries.some((e) => e.status === "uploading")
                                    }
                                    className="min-w-20"
                                >
                                    {fileEntries.some((e) => e.status === "uploading") ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Load"
                                    )}
                                </Button>
                            </div>

                            {/* Per-file status list */}
                            {fileEntries.length > 0 && (
                                <div className="space-y-1.5 mt-1">
                                    {fileEntries.map((entry, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-background border border-border/60"
                                        >
                                            {entry.status === "pending" && (
                                                <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                                            )}
                                            {entry.status === "uploading" && (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                                            )}
                                            {entry.status === "done" && (
                                                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                            )}
                                            {entry.status === "error" && (
                                                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                                            )}
                                            <span className="flex-1 truncate font-mono text-foreground">
                                                {entry.file.name}
                                            </span>
                                            {entry.status === "done" && (
                                                <span className="text-green-700 font-medium shrink-0">
                                                    {entry.count} records
                                                </span>
                                            )}
                                            {entry.status === "error" && (
                                                <span className="text-destructive shrink-0">
                                                    {entry.error}
                                                </span>
                                            )}
                                            {entry.status === "pending" && (
                                                <span className="text-muted-foreground shrink-0">
                                                    Queued
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {fileEntries.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    No files selected yet.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Results table */}
                    {hasResults && (
                        <div className="space-y-3 animate-in fade-in-50 duration-200">
                            <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>
                                        <strong>{fileEntries.filter((e) => e.status === "done").length}</strong>{" "}
                                        file{fileEntries.filter((e) => e.status === "done").length !== 1 ? "s" : ""} ·{" "}
                                        <strong>{uploadedPositions.length}</strong> total records loaded.
                                        {fileEntries.some((e) => e.status === "error") && (
                                            <span className="text-amber-700 ml-2">
                                                ({fileEntries.filter((e) => e.status === "error").length} file
                                                {fileEntries.filter((e) => e.status === "error").length !== 1 ? "s" : ""} failed)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleProceedToMatch}
                                    className="bg-green-700 hover:bg-green-800 text-white"
                                >
                                    Proceed to Missing Match
                                </Button>
                            </div>

                            <div className="border border-border rounded-xl overflow-hidden max-h-87.5 overflow-y-auto shadow-inner bg-background">
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
                                        {uploadedPositions.map((pos, idx) => {
                                            const isBuy =
                                                pos.type?.toLowerCase() === "buy" ||
                                                pos.type?.toLowerCase() === "cr";
                                            return (
                                                <tr key={`${pos.id ?? idx}`} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                                                        {pos.transactionDate}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2.5 font-semibold ${isBuy ? "text-green-600" : "text-destructive"}`}
                                                    >
                                                        {pos.type}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-mono text-xs text-foreground max-w-45 truncate">
                                                        {pos.transferNo || "—"}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2.5 text-right tabular-nums font-medium ${isBuy ? "text-green-600" : "text-foreground"}`}
                                                    >
                                                        {isBuy ? "+" : ""}
                                                        {formatNumber(pos.units)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                                                pos.status?.toLowerCase() === "processed"
                                                                    ? "bg-green-50 border-green-200 text-green-700"
                                                                    : "bg-amber-50 border-amber-200 text-amber-700"
                                                            }`}
                                                        >
                                                            {pos.status || "Unreconciled"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {allDone && fileEntries.some((e) => e.status === "error") && (
                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    {fileEntries.filter((e) => e.status === "error").length} file
                                    {fileEntries.filter((e) => e.status === "error").length !== 1 ? "s" : ""} could not
                                    be processed. Proceeding will use records from successfully loaded files only.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
