"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Loader2, Upload, X } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetBulkConsolidationUpload, useUploadConsolidations } from "@/hooks/useAccountMaintenance";


export default function BulkAccountConsolidation({ register, mode }: { register: string, mode: "single" | "bulk" }) {
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    }, {
        enabled: mode === "bulk"
    });

    const { consolidationJobId, setConsolidationJobId } = useStore();

    /* ─── bulk flow ─── */
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [bulkFile, setBulkFile] = useState<File | null>(null);

    const uploadConsolidations = useUploadConsolidations();

    /* poll if we have a jobId */
    const isPolling = !!consolidationJobId;
    const { data: jobData } = useGetBulkConsolidationUpload(consolidationJobId ?? "", {
        enabled: isPolling,
        refetchInterval: (query) => {
            const status = query.state.data?.data?.status;
            return status === "COMPLETED" || status === "FAILED" ? false : 3000;
        },
    });

    const jobStatus = jobData?.data?.status;

    function handleBulkUpload() {
        if (!register) { toast.error("Please select a register first."); return; }
        if (!bulkFile) { toast.error("Please select a CSV file to upload."); return; }

        const selectedRegisterObj = activeRegisters?.content.find((r) => r.registerId === register);
        const registerSymbol = selectedRegisterObj?.symbol || register;

        uploadConsolidations.mutate(
            { registerId: registerSymbol, file: bulkFile },
            {
                onSuccess: (res) => {
                    const jobId = res?.data?.jobId;
                    if (jobId) {
                        setConsolidationJobId(jobId);
                        toast.success("File uploaded. Processing started…");
                    }
                    setBulkFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                },
                onError: (err) => toast.error(err.message || "Upload failed."),
            },
        );
    }

    const jobComplete = jobStatus === "COMPLETED" || jobStatus === "FAILED";

    return (
        <div className="space-y-4">
            <Card className="mrpsl-card p-8 space-y-6">
                <div className="text-center space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Upload Consolidation CSV</p>
                    <p className="text-xs text-muted-foreground">
                        The file should contain source and destination account numbers in the expected format.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                    />
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadConsolidations.isPending}
                    >
                        {bulkFile ? bulkFile.name : "Choose File"}
                    </Button>

                    {bulkFile && (
                        <Button
                            disabled={!register || uploadConsolidations.isPending}
                            onClick={handleBulkUpload}
                        >
                            {uploadConsolidations.isPending ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                            ) : "Upload & Process"}
                        </Button>
                    )}
                </div>
            </Card>

            {/* Job status card — shown whenever we have a jobId */}
            {consolidationJobId && jobData?.data && (
                <Card className="mrpsl-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Upload Job Status</h4>
                        <div className="flex items-center gap-2">
                            {!jobComplete && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                            <Badge
                                className={
                                    jobStatus === "COMPLETED"
                                        ? "bg-green-100 text-green-800 border-0"
                                        : jobStatus === "FAILED"
                                            ? "bg-red-100 text-red-800 border-0"
                                            : "bg-amber-100 text-amber-800 border-0"
                                }
                            >
                                {jobStatus ?? "PROCESSING"}
                            </Badge>
                            {jobComplete && (
                                <button
                                    onClick={() => setConsolidationJobId(null)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-sm">
                        {[
                            { label: "Total Rows", value: jobData.data.totalRows },
                            { label: "Processed", value: jobData.data.processed },
                            { label: "Succeeded", value: jobData.data.succeeded },
                            { label: "Failed", value: jobData.data.failed },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-muted/20 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold tabular-nums">{value ?? 0}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>

                    {jobData.data.errors?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-destructive">Errors</p>
                            <div className="max-h-40 overflow-y-auto rounded border divide-y text-xs">
                                {jobData.data.errors.map((err, i) => (
                                    <div key={i} className="px-3 py-1.5 flex gap-4">
                                        <span className="text-muted-foreground">Row {err.row}</span>
                                        <span className="font-mono">{err.accountNumber}</span>
                                        <span className="text-destructive">{err.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}