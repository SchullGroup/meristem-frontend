"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  FileArchive,
  Loader2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useInjectCscsFile } from "@/hooks/useCscs";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { useStore } from "@/lib/store";
import { BulkJobProgress } from "../bulk-upload-progress";
import { PreviewHolders } from "./holders-table";

interface CscsUploadProps {
  setActiveTab: (tab: string) => void;
}

export default function CscsUpload({ setActiveTab }: CscsUploadProps) {
  // ── Store ------──────────────────────
  const { jobs, addJob, removeJob } = useStore();

  // ── Local states ------───────────────
  const [uploadedBatchRef, setUploadedBatchRef] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── Find CSCS background job ------───
  const activeCscsJob = jobs.find((j) => j.type === 'cscs');

  // Synchronize batchRef if an active job is present in store (e.g. after reload)
  useEffect(() => {
    if (activeCscsJob) {
      //eslint-disable-next-line
      setUploadedBatchRef(activeCscsJob.id);
    }
  }, [activeCscsJob]);

  // ── Mutations ------──────────────────
  const { mutateAsync: injectFile } = useInjectCscsFile();

  const startProcessing = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const job = await injectFile(formData);

      if (job?.status === "FAILED") {
        setIsUploading(false);
        toast.error(job.message || "CSCS ingestion failed. Please try again.");
        return;
      }

      // Extract batchRef from message:
      // e.g. "Processing Zip record with BatchRef: BATCH-CSCS-20260610_123038"
      const ref = job?.batchRef;

      if (!ref) {
        setIsUploading(false);
        toast.error("Upload accepted but no batch reference was returned. Please contact support.");
        return;
      }

      // Add to store background jobs so that BulkJobMonitorProvider and JobPoller poll status
      addJob({
        id: ref,
        type: "cscs",
        route: "/certificates/cscs-updates",
        status: "PROCESSING",
        startedAt: Date.now(),
        progress: 0,
        message: "Processing CSCS Zip archive...",
      });

      setUploadedBatchRef(ref);
      setIsUploading(false);
      toast.success("File uploaded successfully. Job initiated in background.");
    } catch (err) {
      setIsUploading(false);
      const errorMessage = returnErrorMessage(err as ErrorLike);
      toast.error(errorMessage || "Failed to upload ZIP file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".zip")) startProcessing(file);
    else toast.error("Please drop a .zip file");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startProcessing(file);
  };

  const handleCancelPolling = () => {
    if (uploadedBatchRef) {
      removeJob(uploadedBatchRef);
    }
    setUploadedBatchRef(null);
    toast.info("Process Cancelled.");
  };

  const isJobActive = activeCscsJob && (activeCscsJob.status === 'PENDING' || activeCscsJob.status === 'PROCESSING');
  const isJobFailed = activeCscsJob && activeCscsJob.status === 'FAILED';
  const isActive = !isUploading && !isJobActive && !isJobFailed && !!uploadedBatchRef

  return (
    <div>
      {/* 1. UPLOADING PHASE */}
      {isUploading && (
        <Card className="mrpsl-card p-10 flex flex-col items-center gap-6 max-w-2xl mx-auto shadow-md border border-muted-foreground/10 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <span className="font-semibold text-base text-foreground">Uploading ZIP file…</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Sending zip archive to server. This may take a few moments depending on the file size.
          </p>
        </Card>
      )}

      {/* 2. POLLING PHASE */}
      {!isUploading && isJobActive && (
        <Card className="mrpsl-card p-10 flex flex-col items-center gap-6 max-w-2xl mx-auto shadow-md border border-muted-foreground/10 bg-background/50 backdrop-blur-md">


          <BulkJobProgress message="CSCS Injestion in Progress" jobId={uploadedBatchRef!} jobType="cscs" />

          {/* <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPolling}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Cancel Job
              </Button>
            </div> */}
        </Card>
      )}

      {/* 3. FAILED PHASE */}
      {!isUploading && !isJobActive && isJobFailed && (
        <Card className="mrpsl-card p-10 flex flex-col items-center gap-6 max-w-2xl mx-auto border-destructive/20 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-6 w-6 shrink-0" />
            <span className="font-semibold text-base">Ingestion Failed</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {activeCscsJob?.message || "An error occurred while processing the CSCS zip archive."}
          </p>
          <Button
            variant="outline"
            onClick={handleCancelPolling}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Go Back
          </Button>
        </Card>
      )}

      {/* 4. REVIEW PHASE */}
      {isActive && (
        <PreviewHolders
          batchRef={uploadedBatchRef}
          isActive={isActive}
          onComplete={() => {
            removeJob(uploadedBatchRef);
            setUploadedBatchRef(null);
            setActiveTab("queue");
          }}
        />
      )}

      {/* 5. IDLE PHASE */}
      {!isUploading && !isJobActive && !isJobFailed && !uploadedBatchRef && (
        <div className="space-y-6">
          <label
            htmlFor="zip-input"
            className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-16 cursor-pointer transition-colors ${isDraggingOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
          >
            <input
              id="zip-input"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileInput}
            />
            <FileArchive
              className={`h-14 w-14 mb-5 transition-colors ${isDraggingOver ? "text-primary" : "text-muted-foreground/30"
                }`}
            />
            <p className="font-semibold text-base">
              Upload Master Data ZIP (All Registers)
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              Drag &amp; drop or click —{" "}
              <span className="font-mono text-[13px]">.zip</span> only
            </p>
            <p className="text-[13px] text-muted-foreground/50 mt-3">
              Contains master file + transaction file for all active registers
            </p>
          </label>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Anti-Ghost Seller Protocol Active</strong> — BUY
              transactions are processed before SELL within each
              shareholder&apos;s batch. Shortfall SELLs are flagged and routed
              to reconciliation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
