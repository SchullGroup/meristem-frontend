"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import {
  useUploadKycChanges,
} from "@/hooks/useAccountMaintenance";
import { downloadKycTemplate } from "@/actions/accountMaintenanceActions";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BulkJobProgress } from "../bulk-upload-progress";

interface KYCBulkUploadProps {
  /** Optional register to scope the upload */
  registerId?: string;
}

export const KYCBulkUpload = ({ registerId }: KYCBulkUploadProps) => {
  // ── Store ------──────────────────────
  const { jobs, addJob, removeJob } = useStore();
  // Find an active KYC job (not terminal)
  const activeKycJob = jobs.find(
    (j) => j.type === 'kyc' && j.status !== 'SUCCESS' && j.status !== 'FAILED'
  );
  const kycJobId = activeKycJob?.id || null;

  // ── Local state ------───────────────
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Upload mutation ------──────────
  const uploadMutation = useUploadKycChanges({
    onSuccess: (res) => {
      const jobId = res?.data?.jobId;
      if (jobId) {
        // Register the job in the global store
        addJob({
          id: jobId,
          type: 'kyc',
          route: '/account-maintenance/kyc-update', // adjust as needed
          status: 'PROCESSING',
          startedAt: Date.now(),
          progress: 0,
          message: 'KYC bulk upload in progress…',
        });
        toast.success(`Upload queued — Job ID: ${jobId}`);
      } else {
        toast.success('File submitted successfully');
      }
      setPendingFile(null);
      if (inputRef.current) inputRef.current.value = '';
    },
    onError: (err) => {
      toast.error(err.message || 'Upload failed');
    },
  });

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are accepted");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File too large — max 20 MB");
      return;
    }
    setPendingFile(f);
  };

  const handleSubmit = () => {
    if (!pendingFile) return;
    uploadMutation.mutate({
      file: pendingFile,
      registerId: registerId !== "" ? registerId : undefined,
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const blob = await downloadKycTemplate("csv");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "kyc-bulk-upload-template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearJob = () => {
    if (kycJobId) {
      removeJob(kycJobId);
      toast.info('KYC job cleared');
    }
  };

  return (
    <Card className="mrpsl-card p-12 text-center space-y-6">
      {/* Last job ID indicator */}
      {/* 2. Job Status Feedback Card */}
      {/* ── Active job progress ── */}
      {kycJobId ? (
        <div className="text-left border border/60 rounded-xl p-4 bg-muted/20 space-y-2 relative w-full max-w-3xl mx-auto">
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
      ) :
        <>
          {/* Header / template download */}
          <div>
            <Button
              variant="outline"
              className="mb-2"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Template
            </Button>
            <p className="text-[12px] text-muted-foreground">
              Fill in the CSV template then upload it below
            </p>
          </div>

          {/* Drop zone */}
          <div className="space-y-6">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {pendingFile ? (
              /* File selected — preview row */
              <div className="flex items-center gap-2.5 px-3 py-2.5 border border-green-200 bg-green-50/60 rounded-xl">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-green-800 truncate">
                    {pendingFile.name}
                  </p>
                  <p className="text-[10px] text-green-600">
                    {(pendingFile.size / 1024 / 1024).toFixed(2)} MB · CSV
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="shrink-0 text-green-500 hover:text-red-500 transition-colors p-0.5 rounded"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Drop zone */
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
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors group",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-primary/5",
                )}
              >
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Click or drag to upload
                </p>
                <p className="text-[11px] text-muted-foreground/50 mt-1">
                  CSV · Max 20 MB
                </p>
              </div>
            )}

            {/* Submit button */}
            {pendingFile && (
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Submit Bulk Upload"
                )}
              </Button>
            )}



          </div>
        </>}
    </Card>
  );
};
