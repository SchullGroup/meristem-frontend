"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRegisters } from "@/hooks/useRegisters";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileCheck2, FileX2, AlertCircle, CheckCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import DateInput from "@/components/ui/date-input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUploadBatchIpo, useGetRejectedIpoBatches } from "@/hooks/useIPO";
import { downloadCsvTemplate } from "@/lib/utils/csv-template";
import { ipoTemplateFields } from "@/lib/utils/constants";
import { IPO } from "@/types/ipo";

export default function UploadIPOData({ tab }: { tab: string }) {
  const { data: rejectedData } = useGetRejectedIpoBatches(
    { size: 100 },
    { enabled: tab === "upload" },
  );

  const allRejectedBatches = rejectedData?.content || [];
  const [hiddenRejectedIds, setHiddenRejectedIds] = useState<Set<string>>(
    new Set(),
  );
  const rejectedBatches = allRejectedBatches.filter(
    (b) => !hiddenRejectedIds.has(b.batchReference),
  );
  const [selectedRegister, setSelectedRegister] = useState("");
  const [batchDate, setBatchDate] = useState<Date>(new Date());

  const batchRef = `BATCH-IPO-${format(batchDate, "yyyyMMdd")}-001`;

  const [approvedFile, setApprovedFile] = useState<File | null>(null);
  const [disapprovedFile, setDisapprovedFile] = useState<File | null>(null);
  const [invalidFile, setInvalidFile] = useState<File | null>(null);
  const [processedBatch, setProcessedBatch] = useState<IPO | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  const { data: activeRegisters } = useGetRegisters({ size: 1000, status: "ACTIVE" }, {
    enabled: tab === "upload",
  });
  const uploadIpoMutation = useUploadBatchIpo();

  const handleProcess = () => {
    if (!selectedRegister) {
      toast.error("Please select a register first");
      return;
    }

    const metadata = JSON.stringify({
      register: selectedRegister,
      batchDate: batchDate.toISOString(),
    });

    const form = new FormData();

    form.append("data", new Blob([metadata], { type: "application/json" }));
    if (approvedFile) form.append("approved", approvedFile);
    if (disapprovedFile) form.append("disapproved", disapprovedFile);
    if (invalidFile) form.append("invalid", invalidFile);

    uploadIpoMutation.mutate(form, {
      onSuccess: (data) => {
        toast.success(
          `Batch ${data.batchReference ?? ""} processs with status ${data.status.toLowerCase() ?? "Pending"} `,
        );
        setProcessedBatch(data);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const clearForm = () => {
    setApprovedFile(null);
    setDisapprovedFile(null);
    setInvalidFile(null);
    setProcessedBatch(null);
    setSelectedRegister("");
  };

  return (
    <div className="space-y-6">
      {/* Rejected IPO Batches toggle */}
      {rejectedBatches && rejectedBatches.length > 0 && !showRejected && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowRejected(true)}
            className="border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            View Rejected Declarations ({rejectedBatches.length})
          </Button>
        </div>
      )}

      {/* Rejected IPO Batches list */}
      {rejectedBatches && rejectedBatches.length > 0 && showRejected && (
        <div className="space-y-4 mb-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-red-800 text-sm">
              Action Required: Rejected Declarations
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRejected(false)}
              className="text-muted-foreground h-8 px-2"
            >
              Hide
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
            {rejectedBatches.map((batch) => (
              <Card
                key={batch.batchReference}
                className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 w-full shrink-0"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      Declaration Rejected — Ref: {batch.batchReference}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Please review the data and resubmit for approval.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setHiddenRejectedIds((prev) =>
                        new Set(prev).add(batch.batchReference),
                      );
                      if (rejectedBatches.length <= 1) setShowRejected(false);
                    }}
                    className="rounded-full hover:bg-red-100 p-0.5"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Batch controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="mrpsl-label">Register *</label>
          <Select
            value={selectedRegister}
            onValueChange={(v) => setSelectedRegister(v || "")}
          >
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder="Select Ordinary Register" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select Register</SelectItem>
              {activeRegisters?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.registerId}>
                  {r.registerName} ({r.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DateInput date={batchDate} setDate={setBatchDate} label="Batch Date" />

        <div className="space-y-2">
          <label className="mrpsl-label">Batch Reference</label>
          <Input
            disabled
            value={batchRef}
            className="mrpsl-input bg-muted/50 tabular text-sm"
          />
        </div>
      </div>

      {processedBatch ? (
        <Card className="mrpsl-card bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-green-800 mb-5">
              <CheckCircle className="h-6 w-6 shrink-0" />
              <h3 className="font-semibold text-lg">
                Batch {processedBatch.batchReference} is{" "}
                {processedBatch?.status.toLowerCase()}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Processed",
                  value: processedBatch?.totalAmount,
                  color: "text-foreground",
                },
                {
                  label: "Approved",
                  value: processedBatch?.approvedCount,
                  color: "text-green-700",
                },
                {
                  label: "Disapproved",
                  value: processedBatch?.disapprovedCount,
                  color: "text-amber-600",
                },
                {
                  label: "Invalid",
                  value: processedBatch?.invalidCount,
                  color: "text-red-600",
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-white/60 border-green-200 p-4"
                >
                  <div className="mrpsl-section-title text-green-700/70">
                    {stat.label}
                  </div>
                  <div
                    className={cn("text-xl tabular mt-1 font-bold", stat.color)}
                  >
                    {stat.value}
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={clearForm}>Process New Batch</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Approved List */}
            <Card
              className={cn("mrpsl-card p-6 border-t-4 border-t-green-500")}
            >
              <div className="flex justify-center mb-3">
                <FileCheck2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground text-center">
                Approved List
              </h3>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Upload .csv file of approved subscribers
              </p>
              <div className="mt-4">
                {approvedFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <FileCheck2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs font-medium text-green-800 flex-1 truncate">
                      {approvedFile?.name}
                    </span>
                    <button
                      onClick={() => setApprovedFile(null)}
                      className="rounded-full hover:bg-green-100 p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-green-700" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
                    Drop CSV here or click to browse
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) =>
                        setApprovedFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
                <Button
                  onClick={() =>
                    downloadCsvTemplate(ipoTemplateFields, "approved_list.csv")
                  }
                  variant="link"
                  className="text-primary underline text-xs"
                >
                  Download Template
                </Button>
              </div>
            </Card>

            {/* Disapproved List */}
            <Card
              className={cn("mrpsl-card p-6 border-t-4 border-t-amber-500")}
            >
              <div className="flex justify-center mb-3">
                <FileX2 className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground text-center">
                Disapproved List
              </h3>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Upload .csv of rejected applications (Return Money)
              </p>
              <div className="mt-4 space-y-3">
                {disapprovedFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <FileX2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-medium text-amber-800 flex-1 truncate">
                      {disapprovedFile?.name}
                    </span>
                    <button
                      onClick={() => setDisapprovedFile(null)}
                      className="rounded-full hover:bg-amber-100 p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-amber-700" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
                    Drop CSV here or click to browse
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) =>
                        setDisapprovedFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
                {/* <Textarea
                  value={disapprovedComment}
                  onChange={(e) => setDisapprovedComment(e.target.value)}
                  placeholder="Reason for disapproval..."
                  rows={2}
                  className="resize-none text-xs rounded-lg"
                /> */}
                <Button
                  onClick={() =>
                    downloadCsvTemplate(
                      ipoTemplateFields,
                      "disapproved_list.csv",
                    )
                  }
                  variant="link"
                  className="text-primary underline text-xs"
                >
                  Download Template
                </Button>
              </div>
            </Card>

            {/* Invalid Subscription */}
            <Card className={cn("mrpsl-card p-6 border-t-4 border-t-red-500")}>
              <div className="flex justify-center mb-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-foreground text-center">
                Invalid Subscription
              </h3>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Upload .csv of invalid/failed applications
              </p>
              <div className="mt-4 space-y-3">
                {invalidFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-xs font-medium text-red-800 flex-1 truncate">
                      {invalidFile?.name}
                    </span>
                    <button
                      onClick={() => setInvalidFile(null)}
                      className="rounded-full hover:bg-red-100 p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-red-700" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
                    Drop CSV here or click to browse
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) =>
                        setInvalidFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
                {/* <Textarea
                  value={invalidComment}
                  onChange={(e) => setInvalidComment(e.target.value)}
                  placeholder="Comments / additional notes..."
                  rows={2}
                  className="resize-none text-xs rounded-lg"
                /> */}
                <Button
                  onClick={() =>
                    downloadCsvTemplate(ipoTemplateFields, "invalid_list.csv")
                  }
                  variant="link"
                  className="text-primary underline text-xs"
                >
                  Download Template
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            {/* {uploadStatus === "processing" && (
              <Progress value={progress} className="h-2" />
            )} */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleProcess}
              disabled={uploadIpoMutation.isPending}
            >
              {uploadIpoMutation.isPending
                ? "Processing Batch..."
                : "Process Batch"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
