"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Upload,
  AlertCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Info,
  Lock,
  Pencil,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadKycTemplate } from "@/actions/accountMaintenanceActions";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FieldLockBadge } from "./field-lock-badge";
import {
  InlineEditDialog,
  isEvidenceRequiredField,
} from "./inline-edit-dialog";

// ── Types ───────────────────────────────────────────────────────────────────

export interface MockRow {
  row: number;
  accountNumber: string;
  holderName: string;
  registerSymbol: string;
  field: string;
  newValue: string;
}

type BvnStatus = "verified" | "mismatch" | "pending";
type NibssType = "standard" | "nibssBvnMandate";

interface BulkJob {
  id: string;
  fileName: string;
  rowCount: number;
  submittedAt: string;
  status: "PROCESSING" | "SUCCESS" | "FAILED";
  errorCount?: number;
  source?: "manual" | "cscs";
  cscsIngestionJobId?: string;
  kycApprovalRouteId?: string;
}

const JOB_STORAGE_KEY = "kyc-bulk-job";
const COVER_LETTER_MAX_MB = 10;
const COVER_LETTER_MAX_BYTES = COVER_LETTER_MAX_MB * 1024 * 1024;

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateMockRows(
  _fileName: string,
  nibssType: NibssType,
  count = 7,
): MockRow[] {
  const standardFields = [
    "email",
    "phone",
    "address",
    "bankName",
    "bankAccountNumber",
    "bvn",
    "holderName",
  ];
  const nibssFields = [
    "bvn",
    "bankName",
    "bankAccountNumber",
    "holderName",
    "email",
    "phone",
    "address",
  ];
  const fields = nibssType === "nibssBvnMandate" ? nibssFields : standardFields;
  const holders = [
    "Adebayo Ogunlesi",
    "Chioma Eze",
    "Ibrahim Musa",
    "Ngozi Okonkwo",
    "Folake Adeyemi",
    "Tunde Bakare",
    "Aisha Bello",
  ];
  const registers = [
    "MTNN",
    "DANGCEM",
    "ETI",
    "UBA",
    "ZENITH",
    "ACCESS",
    "SEPLAT",
  ];

  return Array.from({ length: count }, (_, i) => ({
    row: i + 2,
    accountNumber: `${String(100000 + i * 1111).padStart(7, "0")}`,
    holderName: holders[i % holders.length],
    registerSymbol: registers[i % registers.length],
    field: fields[i % fields.length],
    newValue:
      fields[i % fields.length] === "bankAccountNumber"
        ? String(2000000000 + i * 11111111)
        : fields[i % fields.length] === "bvn"
          ? String(22000000000 + i * 11111111)
          : `${fields[i % fields.length]}_updated_${i + 1}@example.com`,
  }));
}

function saveJob(job: BulkJob) {
  if (typeof window !== "undefined") {
    localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(job));
  }
}

function loadJob(): BulkJob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(JOB_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BulkJob) : null;
  } catch {
    return null;
  }
}

function clearJob() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(JOB_STORAGE_KEY);
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export const KYCBulkUpload = ({}: { registerId?: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const coverLetterRef = useRef<HTMLInputElement>(null);

  // ── Check for existing job on mount ─────────────────────────────────────
  const [existingJob] = useState<BulkJob | null>(() => loadJob());
  const initialStep = (() => {
    const job = loadJob();
    return job?.status === "PROCESSING" ? 4 : 1;
  })();
  const didShowToast = useRef(false);

  useEffect(() => {
    if (didShowToast.current) return;
    didShowToast.current = true;
    const job = loadJob();
    if (job && job.status !== "PROCESSING") {
      if (job.status === "SUCCESS") {
        toast.success(
          `Bulk upload "${job.fileName}" completed — ${job.rowCount} rows processed.`,
          { duration: 8000 },
        );
      } else {
        toast.error(
          `Bulk upload "${job.fileName}" failed — ${job.errorCount ?? "?"} errors.`,
          { duration: 8000 },
        );
      }
      clearJob();
    }
  }, []);

  // ── UI state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<number>(initialStep);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  // ── Template type ───────────────────────────────────────────────────────
  const [nibssTemplateType, setNibssTemplateType] =
    useState<NibssType>("standard");
  const [infoBannerDismissed, setInfoBannerDismissed] = useState(false);

  // ── Preview data ────────────────────────────────────────────────────────
  const [previewRows, setPreviewRows] = useState<MockRow[]>([]);
  const [bvnVerificationStatus, setBvnVerificationStatus] = useState<
    Map<number, BvnStatus>
  >(new Map());
  const [lockedFieldRowIds, setLockedFieldRowIds] = useState<Set<number>>(
    new Set(),
  );

  // ── Evidence / Cover Letter ─────────────────────────────────────────────
  const [bulkCoverLetterFile, setBulkCoverLetterFile] = useState<File | null>(
    null,
  );
  const [bulkCoverLetterUrl, setBulkCoverLetterUrl] = useState("");
  const [coverLetterUploading, setCoverLetterUploading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState("");

  // ── Inline edit dialog ──────────────────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<MockRow | null>(null);

  // ── Job state ───────────────────────────────────────────────────────────
  const [activeJob, setActiveJob] = useState<BulkJob | null>(null);
  const jobTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  const evidenceRequiredRows = previewRows.filter((r) =>
    isEvidenceRequiredField(r.field),
  );
  const evidenceAttached =
    evidenceRequiredRows.length === 0 || !!bulkCoverLetterUrl;
  const isSubmitDisabled = !evidenceAttached;

  useEffect(() => {
    return () => {
      if (jobTimerRef.current) clearTimeout(jobTimerRef.current);
    };
  }, []);

  // ── BVN verification (mocked) ───────────────────────────────────────────
  const runBvnVerification = useCallback((rows: MockRow[]) => {
    const bvnRows = rows.filter((r) => r.field === "bvn");
    if (bvnRows.length === 0) return;

    // Set all to pending initially
    setBvnVerificationStatus((prev) => {
      const next = new Map(prev);
      bvnRows.forEach((r) => next.set(r.row, "pending"));
      return next;
    });

    // Simulate async resolution per row
    bvnRows.forEach((r, idx) => {
      setTimeout(
        () => {
          setBvnVerificationStatus((prev) => {
            const next = new Map(prev);
            next.set(r.row, Math.random() > 0.25 ? "verified" : "mismatch");
            return next;
          });
        },
        1500 + idx * 800,
      );
    });
  }, []);

  // ── File handler ────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
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
    setFileLoading(true);

    setTimeout(() => {
      const rows = generateMockRows(f.name, nibssTemplateType);

      // Cross-check for locked fields (mock — 10% chance per row)
      const locked = new Set<number>();
      rows.forEach((r) => {
        if (Math.random() < 0.1) locked.add(r.row);
      });
      setLockedFieldRowIds(locked);

      setPreviewRows(rows);
      setFileLoading(false);
      setStep(3);

      // Fire BVN verification if nibss template
      if (nibssTemplateType === "nibssBvnMandate") {
        runBvnVerification(rows);
      }
    }, 5000);
  };

  // ── Download template ───────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const data = await downloadKycTemplate("csv");
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        nibssTemplateType === "nibssBvnMandate"
          ? "kyc-nibss-bvn-mandate-template.csv"
          : "kyc-bulk-upload-template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Cover letter upload ─────────────────────────────────────────────────
  const handleCoverLetter = async (f: File) => {
    setCoverLetterError("");
    if (
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      setCoverLetterError("Only PDF files are accepted.");
      return;
    }
    if (f.size > COVER_LETTER_MAX_BYTES) {
      setCoverLetterError(`File too large — max ${COVER_LETTER_MAX_MB} MB`);
      return;
    }

    setBulkCoverLetterFile(f);
    setCoverLetterUploading(true);
    try {
      const res = await GetPDFUrl(f, "kycCoverLetters");
      if (res?.type === "success") {
        setBulkCoverLetterUrl(res.result as string);
      } else {
        setCoverLetterError("Upload failed — please try again.");
      }
    } catch {
      setCoverLetterError("Upload failed — please try again.");
    } finally {
      setCoverLetterUploading(false);
    }
  };

  // ── Row editing ─────────────────────────────────────────────────────────
  const handleRowUpdate = (
    rowId: number,
    patch: Partial<MockRow>,
    _reason: string,
  ) => {
    void _reason; // audit trail — sent to backend in production
    setPreviewRows((prev) =>
      prev.map((r) => (r.row === rowId ? { ...r, ...patch } : r)),
    );
    toast.success(`Row #${rowId} updated.`);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const source: "manual" | "cscs" = Math.random() < 0.2 ? "cscs" : "manual"; // 20% chance CSCS for demo
    const job: BulkJob = {
      id: `kyc-job-${Date.now()}`,
      fileName: pendingFile?.name ?? "kyc-bulk-upload.csv",
      rowCount: previewRows.length,
      submittedAt: new Date().toISOString(),
      status: "PROCESSING",
      source,
      ...(source === "cscs"
        ? {
            cscsIngestionJobId: `CSCS-${Date.now().toString(36).toUpperCase()}`,
            kycApprovalRouteId: `APR-${Math.floor(Math.random() * 9000) + 1000}`,
          }
        : {}),
    };

    saveJob(job);
    setActiveJob(job);
    setStep(4);

    const delay = 10000 + Math.random() * 5000;
    jobTimerRef.current = setTimeout(() => {
      const success = Math.random() > 0.1;
      const finishedJob: BulkJob = {
        ...job,
        status: success ? "SUCCESS" : "FAILED",
        errorCount: success ? 0 : Math.ceil(Math.random() * 3),
      };

      if (success) {
        toast.success(
          `Bulk upload "${job.fileName}" completed — ${job.rowCount} rows processed.`,
          { duration: 10000 },
        );
      } else {
        toast.error(
          `Bulk upload "${job.fileName}" failed — ${finishedJob.errorCount} error(s) found.`,
          { duration: 10000 },
        );
      }
      clearJob();
      setActiveJob(null);
      setPendingFile(null);
      setPreviewRows([]);
      setBulkCoverLetterFile(null);
      setBulkCoverLetterUrl("");
      setStep(1);
    }, delay);
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const isUploading = fileLoading;
  const steps = ["Template", "Upload", "Preview", "Submit"];
  const showBvnColumn = nibssTemplateType === "nibssBvnMandate";

  return (
    <Card className="mrpsl-card p-8 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors shrink-0",
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
                {label}
              </span>
              {s < 4 && (
                <div
                  className={cn(
                    "w-6 h-px mx-1",
                    step > s ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Step 1: Template                                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Segmented control: Update Type */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {(
              [
                { value: "standard", label: "Standard KYC" },
                { value: "nibssBvnMandate", label: "NIBSS BVN Mandate" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNibssTemplateType(opt.value)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                  nibssTemplateType === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amber info banner */}
          {!infoBannerDismissed && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span className="flex-1">
                Changes to Bank Account Number or BVN require a signed Cover
                Letter as evidence. You&apos;ll be prompted to upload one after
                Preview.
              </span>
              <button
                type="button"
                onClick={() => setInfoBannerDismissed(true)}
                className="text-amber-400 hover:text-amber-600 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-6 text-center">
            <div className="py-8">
              <Download className="mx-auto h-12 w-12 text-primary/60 mb-4" />
              <h2 className="text-lg font-bold mb-1">Download Template</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Start by downloading the template. Fill in the shareholder
                account numbers, fields to change, and new values.
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
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Step 2: Upload                                                    */}
      {/* ────────────────────────────────────────────────────────────────── */}
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
            onClick={() => {
              if (!isUploading) inputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isUploading) inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (isUploading) return;
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              "border-2 border-dashed rounded-xl py-12 text-center transition-colors group",
              isUploading
                ? "border-primary bg-primary/5 cursor-default"
                : dragging
                  ? "border-primary bg-primary/5 cursor-pointer"
                  : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Parsing file…
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {pendingFile?.name}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  This will take a few seconds
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
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={isUploading}
            >
              ← Back to Template
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Step 3: Preview Table                                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Preview Upload Data</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground">
                  {pendingFile?.name}
                </span>
                {" — "}
                {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}{" "}
                detected
                {evidenceRequiredRows.length > 0 &&
                  ` · ${evidenceRequiredRows.length} require evidence`}
              </p>
            </div>
            <Badge variant="outline" className="text-[11px]">
              {previewRows.length} rows
            </Badge>
          </div>

          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header sticky top-0">
                  <tr>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground w-6" />
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground w-8">
                      #
                    </th>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                      Account No
                    </th>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                      Holder
                    </th>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                      Register
                    </th>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                      Field
                    </th>
                    {showBvnColumn && (
                      <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                        BVN Status
                      </th>
                    )}
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                      New Value
                    </th>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground">
                      Evidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {previewRows.map((r) => {
                    const isLocked = lockedFieldRowIds.has(r.row);
                    const bvnStatus = bvnVerificationStatus.get(r.row);
                    const needsEvidence = isEvidenceRequiredField(r.field);

                    return (
                      <tr key={r.row} className="hover:bg-muted/20">
                        {/* Pencil edit / Lock */}
                        <td className="p-2.5">
                          {isLocked ? (
                            <FieldLockBadge status="lockedPendingApproval" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRow(r);
                                setEditDialogOpen(true);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="Edit this row"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[12px] text-muted-foreground">
                          {r.row}
                        </td>
                        <td className="p-2.5 font-mono text-[12px]">
                          {r.accountNumber}
                        </td>
                        <td className="p-2.5 font-medium">{r.holderName}</td>
                        <td className="p-2.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {r.registerSymbol}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {r.field}
                        </td>
                        {showBvnColumn && (
                          <td className="p-2.5">
                            {bvnStatus === "verified" ? (
                              <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                Verified
                              </Badge>
                            ) : bvnStatus === "mismatch" ? (
                              <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                                <XCircle className="h-3 w-3 mr-0.5" />
                                Mismatch
                              </Badge>
                            ) : bvnStatus === "pending" ? (
                              <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
                                <Loader2 className="h-3 w-3 mr-0.5 animate-spin" />
                                Pending
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        )}
                        <td className="p-2.5 font-mono text-[12px] text-primary truncate max-w-40">
                          {r.newValue}
                        </td>
                        <td className="p-2.5">
                          {needsEvidence ? (
                            bulkCoverLetterUrl ? (
                              <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                Attached
                              </Badge>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                <Lock className="h-3 w-3" />
                                Required
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bulk Cover-Letter Upload */}
          {evidenceRequiredRows.length > 0 && (
            <Card className="mrpsl-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold">Bulk Cover-Letter Upload</h3>
                <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                  {evidenceRequiredRows.length} row
                  {evidenceRequiredRows.length !== 1 ? "s" : ""} require
                  evidence
                </Badge>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Upload a single signed Cover Letter (PDF) that covers all
                bank-related changes in this batch.
              </p>

              {bulkCoverLetterUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {bulkCoverLetterFile?.name ?? "cover-letter.pdf"}
                    </p>
                    <p className="text-[11px] text-green-600">
                      Cover letter uploaded
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => {
                      setBulkCoverLetterFile(null);
                      setBulkCoverLetterUrl("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={coverLetterRef}
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCoverLetter(f);
                      e.target.value = "";
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => coverLetterRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") coverLetterRef.current?.click();
                    }}
                    className="border-2 border-dashed border-amber-300 rounded-xl py-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
                  >
                    {coverLetterUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                        <p className="text-sm text-muted-foreground">
                          Uploading…
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-6 w-6 text-amber-500 mb-1" />
                        <p className="text-sm font-medium text-amber-700">
                          Click to upload Cover Letter
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PDF only · Max {COVER_LETTER_MAX_MB} MB
                        </p>
                      </>
                    )}
                  </div>
                  {coverLetterError && (
                    <p className="text-[12px] text-destructive">
                      {coverLetterError}
                    </p>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setStep(2);
                setPreviewRows([]);
                setBvnVerificationStatus(new Map());
                setBulkCoverLetterFile(null);
                setBulkCoverLetterUrl("");
              }}
            >
              ← Upload a different file
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Start over
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span>
                      <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                      >
                        Submit {previewRows.length} Row
                        {previewRows.length !== 1 ? "s" : ""}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isSubmitDisabled && (
                    <TooltipContent side="top">
                      Attach the Cover Letter to continue
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Step 4: Job Queue Simulation                                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 4 && (activeJob || existingJob) && (
        <div className="space-y-6">
          {(() => {
            const job = activeJob ?? existingJob!;
            const isProcessing = job.status === "PROCESSING";
            const isCscs = job.source === "cscs";

            return (
              <>
                {/* Main processing banner */}
                <div
                  className={cn(
                    "rounded-xl p-8 text-center space-y-4",
                    isProcessing
                      ? "bg-primary/10 border border-primary/30"
                      : job.status === "SUCCESS"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200",
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
                      <h2 className="text-xl font-bold text-primary">
                        Processing Your Bulk Upload
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                        Your file <strong>{job.fileName}</strong> (
                        {job.rowCount} rows) is being processed in the
                        background. You can safely leave this page — the job
                        will continue running.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Submitted{" "}
                          {new Date(job.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground">
                        A notification will appear when the job is complete.
                      </p>
                    </>
                  ) : job.status === "SUCCESS" ? (
                    <>
                      <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
                      <h2 className="text-xl font-bold text-green-900">
                        Upload Complete
                      </h2>
                      <p className="text-sm text-green-700 max-w-lg mx-auto">
                        All {job.rowCount} rows from{" "}
                        <strong>{job.fileName}</strong> were processed
                        successfully.
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="mx-auto h-14 w-14 text-red-600" />
                      <h2 className="text-xl font-bold text-red-900">
                        Upload Failed
                      </h2>
                      <p className="text-sm text-red-700 max-w-lg mx-auto">
                        <strong>{job.fileName}</strong> could not be fully
                        processed. {job.errorCount} error
                        {(job.errorCount ?? 0) !== 1 ? "s" : ""} were found.
                      </p>
                    </>
                  )}
                </div>

                {/* CSCS secondary status card */}
                {isCscs && job.cscsIngestionJobId && isProcessing && (
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>
                        This batch originated from CSCS daily ingestion (Job #
                        {job.cscsIngestionJobId}) and has been routed to the KYC
                        Approvals queue for review.
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        toast.info(
                          `Navigating to KYC Approvals (route: ${job.kycApprovalRouteId ?? "—"})`,
                        );
                      }}
                    >
                      View in Approvals
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-center gap-3">
                  {isProcessing ? (
                    <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Job running — you can navigate away
                    </p>
                  ) : (
                    <Button
                      onClick={() => {
                        clearJob();
                        setActiveJob(null);
                        setPendingFile(null);
                        setPreviewRows([]);
                        setBulkCoverLetterFile(null);
                        setBulkCoverLetterUrl("");
                        setBvnVerificationStatus(new Map());
                        setStep(1);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      Start New Upload
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Inline Edit Dialog */}
      <InlineEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        row={editingRow}
        onSave={handleRowUpdate}
        isFieldLocked={
          editingRow ? lockedFieldRowIds.has(editingRow.row) : false
        }
      />
    </Card>
  );
};
