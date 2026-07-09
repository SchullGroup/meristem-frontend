"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Upload,
  Table2,
  AlertCircle,
  X,
} from "lucide-react";
import { useUploadKycChanges } from "@/hooks/useAccountMaintenance";
import { downloadKycTemplate } from "@/actions/accountMaintenanceActions";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BulkJobProgress } from "../../bulk-upload-progress";
import { useQuery } from "@tanstack/react-query";
import { getKycUploadJob } from "@/actions/accountMaintenanceActions";

interface KYCBulkUploadProps {
  registerId?: string;
}

export const KYCBulkUpload = ({ registerId }: KYCBulkUploadProps) => {
  const { jobs, addJob, removeJob } = useStore();
  const activeKycJob = jobs.find(
    (j) => j.type === "kyc" && j.status !== "SUCCESS" && j.status !== "FAILED",
  );
  const kycJobId = activeKycJob?.id || null;

  const { data: jobStatus } = useQuery({
    queryKey: ["kyc-upload-job", kycJobId],
    queryFn: () => getKycUploadJob(kycJobId!),
    enabled: !!kycJobId,
    refetchInterval: (query) =>
      query.state.data?.data?.status === "PROCESSING" ||
      query.state.data?.data?.status === "PENDING"
        ? 3000
        : false,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileError, setFileError] = useState("");

  const uploadMutation = useUploadKycChanges({
    onSuccess: (res) => {
      const jobId = res?.data?.jobId;
      if (jobId) {
        addJob({
          id: jobId,
          type: "kyc",
          route: "/account-maintenance/kyc-update",
          status: "PROCESSING",
          startedAt: Date.now(),
          progress: 0,
          message: "KYC bulk upload in progress…",
        });
        toast.success(`Upload queued — Job ID: ${jobId}`);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    onError: (err) => {
      toast.error(err.message || "Upload failed");
    },
  });

  const handleFile = useCallback(
    (f: File) => {
      setFileError("");
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (![".csv", ".xlsx", ".xls"].includes(ext)) {
        setFileError(
          `Unsupported file type "${ext}". Accepted: .xlsx, .xls, .csv`,
        );
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setFileError("File too large — max 20 MB");
        return;
      }
      setPendingFile(f);
      setStep(3);
      uploadMutation.mutate({
        file: f,
        registerId: registerId !== "" ? registerId : undefined,
      });
    },
    [registerId, uploadMutation],
  );

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const data = await downloadKycTemplate("csv");
      const blob = new Blob([data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "kyc-bulk-upload-template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearJob = () => {
    if (kycJobId) {
      removeJob(kycJobId);
      toast.info("KYC job cleared");
    }
  };

  const result = jobStatus?.data;
  const jobErrors = result?.errors ?? [];
  const totalRows = result?.totalRows ?? 0;
  const succeeded = result?.succeeded ?? 0;
  const failed = result?.failed ?? 0;
  const jobState = result?.status ?? "PENDING";
  const isProcessing = jobState === "PROCESSING" || jobState === "PENDING";

  return (
    <Card className="mrpsl-card p-8 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors",
                step > s
                  ? "bg-primary text-primary-foreground"
                  : step === s
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span
              className={cn(
                "text-[13px] font-medium",
                step === s ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s === 1 ? "Template" : s === 2 ? "Upload" : "Review"}
            </span>
            {s < 3 && (
              <div
                className={cn(
                  "w-8 h-px mx-1",
                  step > s ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Active job progress */}
      {kycJobId && isProcessing && (
        <div className="relative border rounded-xl p-4 bg-muted/20 space-y-2">
          <button
            type="button"
            onClick={handleClearJob}
            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
            title="Clear tracking"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="pr-6">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Upload in Progress
            </p>
            <BulkJobProgress jobId={kycJobId} jobType="kyc" />
          </div>
        </div>
      )}

      {/* Step 1: Template */}
      {step === 1 && (
        <div className="space-y-6 text-center">
          <div className="py-8">
            <Download className="mx-auto h-12 w-12 text-primary/60 mb-4" />
            <h2 className="text-lg font-bold mb-1">Download Template</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start by downloading the template. Fill in the shareholder account
              numbers, fields to change, and new values.
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Download Template (.csv)
          </Button>
          <div className="pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              I already have a file →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <Upload className="mx-auto h-10 w-10 text-primary/60 mb-3" />
            <h2 className="text-lg font-bold mb-1">Upload Your File</h2>
            <p className="text-sm text-muted-foreground">
              Upload the completed .xlsx or .csv file
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              "border-2 border-dashed rounded-xl py-12 text-center cursor-pointer transition-colors group",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Uploading &amp; parsing file…
                </p>
              </div>
            ) : (
              <>
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-[12px] text-muted-foreground/50 mt-1">
                  .xlsx, .xls, .csv · Max 20 MB
                </p>
              </>
            )}
          </div>
          {fileError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg px-4 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {fileError}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back to Template
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Table2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Upload Summary</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pendingFile?.name && (
                  <span className="font-medium text-foreground">
                    {pendingFile.name}
                  </span>
                )}
                {totalRows > 0 &&
                  ` — ${totalRows} row${totalRows !== 1 ? "s" : ""}`}
              </p>
            </div>
            {!isProcessing && totalRows > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {succeeded > 0 && (
                  <Badge className="bg-green-100 text-green-700 border-0 text-[11px]">
                    {succeeded} success
                  </Badge>
                )}
                {failed > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-0 text-[11px]">
                    {failed} failed
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Processing your file…
              </p>
              <p className="text-[13px] text-muted-foreground">
                {totalRows > 0
                  ? `${succeeded + failed} / ${totalRows} rows processed`
                  : "Backend is parsing and validating each row"}
              </p>
            </div>
          ) : totalRows > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="mrpsl-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {totalRows}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Total Rows
                  </p>
                </Card>
                <Card className="mrpsl-card p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {succeeded}
                  </p>
                  <p className="text-[12px] text-muted-foreground">Succeeded</p>
                </Card>
                <Card className="mrpsl-card p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{failed}</p>
                  <p className="text-[12px] text-muted-foreground">Failed</p>
                </Card>
              </div>

              {jobErrors.length > 0 && (
                <Card className="mrpsl-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-red-50/50">
                    <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Error Report — {jobErrors.length} issue
                      {jobErrors.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground w-12">
                          Row
                        </th>
                        <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                          Account
                        </th>
                        <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                          Field
                        </th>
                        <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[13px]">
                      {jobErrors.map((err, idx) => (
                        <tr key={idx} className="bg-red-50/30">
                          <td className="p-2.5 font-mono text-[12px]">
                            {err.row}
                          </td>
                          <td className="p-2.5 font-mono text-[12px]">
                            {err.accountNumber}
                          </td>
                          <td className="p-2.5">{err.field}</td>
                          <td className="p-2.5 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              {failed === 0 && succeeded > 0 && (
                <div className="flex items-center justify-center gap-2 py-6 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    All {succeeded} row{succeeded !== 1 ? "s" : ""} processed
                    successfully
                  </p>
                </div>
              )}
            </>
          ) : (
            !uploadMutation.isPending && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Waiting for the backend to process the file. Check the job
                progress above.
              </div>
            )
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setStep(2);
                setFileError("");
              }}
            >
              ← Upload a new file
            </Button>
            <Button variant="outline" onClick={() => setStep(1)}>
              Start over
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
