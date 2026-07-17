"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  History,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { downloadCsvTemplate } from "@/lib/utils/csv-template";
import {
  KycBulkPreviewRow,
  KycReviewRow,
  KycReviewDecision,
} from "@/types/account-maintenance";
import { KycReviewDrawer } from "./kyc-review-drawer";

type SubmitStatus = "processing" | "success" | "failed";

// ── Template column definitions ────────────────────────────────────────────

const KYC_TEMPLATE_FIELDS = [
  "account_number",
  "shareholder_name",
  "email",
  "phone",
  "address",
  "bank_name",
  "bank_account_number",
  "nin",
  "bvn",
];

// ── Table column definitions ───────────────────────────────────────────────

const KYC_PRIMARY_COLUMNS: { key: string; label: string }[] = [
  { key: "shareholderName", label: "Shareholder" },
  { key: "accountNumber", label: "Account No" },
  { key: "bvn", label: "BVN" },
];

function cellValue(row: KycBulkPreviewRow, key: string): string {
  return (row as unknown as Record<string, string>)[key] || "";
}

function ReviewDecisionBadge({ decision }: { decision: KycReviewDecision }) {
  if (decision === "accepted")
    return (
      <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        Accepted
      </Badge>
    );
  if (decision === "rejected")
    return (
      <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
        <XCircle className="h-3 w-3 mr-0.5" />
        Rejected
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-[10px] text-muted-foreground border-muted-foreground/30"
    >
      Unreviewed
    </Badge>
  );
}

/** Convert raw preview rows into review rows with decision tracking. */
function toReviewRows(rows: KycBulkPreviewRow[]): KycReviewRow[] {
  return rows.map((r) => ({
    ...r,
    decision: "unreviewed" as const,
    documents: [],
  }));
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_KYC_NAMES = [
  "Adebayo Ogunlesi",
  "Chioma Eze",
  "Ibrahim Musa",
  "Ngozi Okonkwo",
  "Folake Adeyemi",
  "Tunde Bakare",
  "Aisha Bello",
  "Emeka Nwankwo",
  "Zainab Ibrahim",
  "Olumide Afolabi",
];

function generateMockKycRows(count = 10): KycBulkPreviewRow[] {
  return Array.from({ length: count }, (_, i) => ({
    row: i + 2,
    accountNumber: "123456789",
    shareholderName: MOCK_KYC_NAMES[i % MOCK_KYC_NAMES.length],
    email: `holder${i + 1}@example.com`,
    phone: `+234801${(2000000 + i).toString().slice(-7)}`,
    address: `${i + 1} Marina Street, Lagos`,
    bankName: i % 3 === 0 ? "GTBank" : i % 3 === 1 ? "Access Bank" : "UBA",
    bankAccountNumber: String(3000000000 + i * 11111111),
    nin: String(11000000000 + i * 11111111),
    bvn: String(22000000000 + i * 11111111),
    status: "valid",
    errors: [],
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

interface KYCBulkUploadProps {
  /** Navigate the user to the KYC change history after a successful submit. */
  onViewChanges?: () => void;
}

export const KYCBulkUpload = ({ onViewChanges }: KYCBulkUploadProps = {}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = useStore((s) => s.currentUser);

  const [step, setStep] = useState(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  const [kycRows, setKycRows] = useState<KycReviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [submitMeta, setSubmitMeta] = useState<{
    fileName: string;
    rowCount: number;
    submittedAt: string;
  } | null>(null);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showUnreviewedConfirm, setShowUnreviewedConfirm] = useState(false);

  const steps = ["Upload", "Review", "Submit"];

  // ── Derived ──────────────────────────────────────────────────────────

  const acceptedCount = kycRows.filter((r) => r.decision === "accepted").length;
  const rejectedCount = kycRows.filter((r) => r.decision === "rejected").length;
  const unreviewedCount = kycRows.filter(
    (r) => r.decision === "unreviewed",
  ).length;
  const selectedReviewRow = kycRows.find((r) => r.row === selectedRow) ?? null;

  // ── Actions ──────────────────────────────────────────────────────────

  const approveRow = useCallback(
    (rowNum: number, documents: { name: string; url: string }[]) => {
      setKycRows((prev) =>
        prev.map((r) =>
          r.row === rowNum ? { ...r, decision: "accepted", documents } : r,
        ),
      );
      setSelectedRow(null);
    },
    [],
  );

  const rejectRow = useCallback((rowNum: number) => {
    setKycRows((prev) =>
      prev.map((r) => (r.row === rowNum ? { ...r, decision: "rejected" } : r)),
    );
    setSelectedRow(null);
  }, []);

  function resetAll() {
    setStep(1);
    setPendingFile(null);
    setKycRows([]);
    setFileError("");
    setSelectedRow(null);
    setSubmitStatus(null);
    setSubmitMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDownloadTemplate() {
    downloadCsvTemplate(KYC_TEMPLATE_FIELDS, "kyc-bulk-upload-template.csv");
  }

  function handleFile(f: File) {
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
    setPreviewLoading(true);
    // Mock: simulate backend parsing + validation
    setTimeout(() => {
      setKycRows(toReviewRows(generateMockKycRows()));
      setPreviewLoading(false);
      setStep(2);
    }, 1800);
  }

  function removeRow(row: number) {
    setKycRows((prev) => prev.filter((r) => r.row !== row));
    if (selectedRow === row) setSelectedRow(null);
  }

  /** Guard against losing in-progress review decisions when leaving the Review step. */
  function requestLeaveReview() {
    if (acceptedCount + rejectedCount === 0) {
      executeLeaveReview();
      return;
    }
    setShowLeaveConfirm(true);
  }

  function executeLeaveReview() {
    setStep(1);
    setKycRows([]);
    setSelectedRow(null);
  }

  function handleSubmit() {
    if (acceptedCount === 0) {
      toast.error(
        "No approved rows to submit. Approve at least one row first.",
      );
      return;
    }

    if (unreviewedCount > 0) {
      setShowUnreviewedConfirm(true);
      return;
    }

    proceedSubmit();
  }

  function proceedSubmit() {
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    // ── Build submission payload from approved rows ────────────────────
    const submissionRows = kycRows
      .filter((r) => r.decision === "accepted")
      .map((r) => ({
        accountNumber: r.accountNumber,
        shareholderName: r.shareholderName,
        email: r.email,
        phone: r.phone,
        address: r.address,
        bankName: r.bankName,
        bankAccountNumber: r.bankAccountNumber,
        nin: r.nin,
        bvn: r.bvn,
        supportingDocuments: r.documents,
      }));

    setSubmitMeta({
      fileName: pendingFile?.name ?? "upload.csv",
      rowCount: submissionRows.length,
      submittedAt: new Date().toISOString(),
    });
    setSubmitStatus("processing");
    setStep(3);

    // Mock: simulate backend submission — replace with real API call.
    // The payload `submissionRows` maps to KycBulkSubmitRequest.rows.
    setTimeout(() => {
      setSubmitStatus("success");
      toast.success(
        `KYC bulk update submitted — ${submissionRows.length} row${submissionRows.length !== 1 ? "s" : ""} sent for approval.`,
        { duration: 8000 },
      );
    }, 2200);
  }

  return (
    <>
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
                {s < steps.length && (
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

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 1: Upload                                                 */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 1 && (
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
                if (!previewLoading) inputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !previewLoading)
                  inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!previewLoading) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (previewLoading) return;
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={cn(
                "border-2 border-dashed rounded-xl py-12 text-center transition-colors group",
                previewLoading
                  ? "border-primary bg-primary/5 cursor-default"
                  : dragging
                    ? "border-primary bg-primary/5 cursor-pointer"
                    : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
              )}
            >
              {previewLoading ? (
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
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download template
              </Button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 2: Review (split panel)                                   */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-0">
            {/* Summary bar */}
            <div className="flex items-center gap-3 flex-wrap text-[13px] text-muted-foreground mb-4 px-1">
              <span>
                <strong className="text-foreground">{kycRows.length}</strong>{" "}
                valid
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-green-700">
                <strong>{acceptedCount}</strong> accepted
              </span>
              <span className="text-red-700">
                <strong>{rejectedCount}</strong> rejected
              </span>
              <span>
                <strong>{unreviewedCount}</strong> unreviewed
              </span>
            </div>

            {/* Submit bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap p-3 border-t bg-muted/20">
              <Button variant="ghost" size="sm" onClick={requestLeaveReview}>
                ← Upload a different file
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={acceptedCount === 0}
              >
                Submit {acceptedCount} Row
                {acceptedCount !== 1 ? "s" : ""}
              </Button>
            </div>

            {/* Master table (full width — the review UI lives in a drawer now) */}
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header sticky top-0">
                  <tr>
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground w-8">
                      #
                    </th>
                    {KYC_PRIMARY_COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground w-24">
                      Decision
                    </th>
                    <th className="p-2.5 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {kycRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={KYC_PRIMARY_COLUMNS.length + 3}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No valid rows found.
                      </td>
                    </tr>
                  ) : (
                    kycRows.map((r) => {
                      const isSelected = selectedRow === r.row;
                      return (
                        <tr
                          key={r.row}
                          onClick={() => setSelectedRow(r.row)}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isSelected
                              ? "bg-primary/10 border-l-2 border-l-primary"
                              : "hover:bg-muted/20 border-l-2 border-l-transparent",
                          )}
                        >
                          <td className="p-2.5 font-mono text-[12px] text-muted-foreground">
                            {r.row}
                          </td>
                          {KYC_PRIMARY_COLUMNS.map((c) => (
                            <td
                              key={c.key}
                              className="p-2.5 font-mono text-[12px] whitespace-nowrap max-w-40 truncate"
                              title={cellValue(r, c.key)}
                            >
                              {cellValue(r, c.key) || "—"}
                            </td>
                          ))}
                          <td className="p-2.5">
                            <ReviewDecisionBadge decision={r.decision} />
                          </td>
                          <td className="p-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRow(r.row);
                              }}
                              className="text-red-400 hover:text-destructive transition-colors"
                              title="Remove this row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 3: Submit                                                 */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 3 && submitMeta && submitStatus && (
          <div className="space-y-6">
            <div
              className={cn(
                "rounded-xl p-8 text-center space-y-4",
                submitStatus === "processing"
                  ? "bg-primary/10 border border-primary/30"
                  : submitStatus === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200",
              )}
            >
              {submitStatus === "processing" ? (
                <>
                  <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
                  <h2 className="text-xl font-bold text-primary">
                    Processing Your Bulk Upload
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    Your file <strong>{submitMeta.fileName}</strong> (
                    {submitMeta.rowCount} rows) is being submitted.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Submitted{" "}
                      {new Date(submitMeta.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
                  <h2 className="text-xl font-bold text-green-900">
                    Upload Complete
                  </h2>
                  <p className="text-sm text-green-700 max-w-lg mx-auto">
                    All {submitMeta.rowCount} rows from{" "}
                    <strong>{submitMeta.fileName}</strong> were submitted
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
                    <strong>{submitMeta.fileName}</strong> could not be
                    submitted. Please try again.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-center gap-3">
              {submitStatus === "processing" ? (
                <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </p>
              ) : (
                <>
                  <Button variant="outline" onClick={resetAll}>
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Start New Upload
                  </Button>
                  {submitStatus === "success" && onViewChanges && (
                    <Button
                      onClick={() => {
                        resetAll();
                        onViewChanges();
                      }}
                    >
                      <History className="h-4 w-4 mr-1.5" />
                      View Changes
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      <KycReviewDrawer
        open={selectedReviewRow !== null}
        onOpenChange={(o) => !o && setSelectedRow(null)}
        row={selectedReviewRow}
        onApprove={(docs) =>
          selectedReviewRow && approveRow(selectedReviewRow.row, docs)
        }
        onReject={() => selectedReviewRow && rejectRow(selectedReviewRow.row)}
      />

      {/* Discard review progress confirmation */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="max-w-md px-4">
          <DialogHeader>
            <DialogTitle>Discard review progress?</DialogTitle>
            <DialogDescription>
              You have review decisions on this page. Leaving now will discard
              them — this can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLeaveConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowLeaveConfirm(false);
                executeLeaveReview();
              }}
            >
              Discard &amp; Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit-with-unreviewed-rows confirmation */}
      <Dialog
        open={showUnreviewedConfirm}
        onOpenChange={setShowUnreviewedConfirm}
      >
        <DialogContent className="max-w-md px-4">
          <DialogHeader>
            <DialogTitle>Submit with unreviewed rows?</DialogTitle>
            <DialogDescription>
              {unreviewedCount} unreviewed row
              {unreviewedCount !== 1 ? "s" : ""} will be skipped if you
              continue.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/20 p-3 text-[13px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Approved (will be submitted)
              </span>
              <span className="font-semibold text-green-700">
                {acceptedCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Rejected (will be skipped)
              </span>
              <span className="font-semibold text-red-700">
                {rejectedCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Unreviewed (will be skipped)
              </span>
              <span className="font-semibold">{unreviewedCount}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUnreviewedConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowUnreviewedConfirm(false);
                proceedSubmit();
              }}
            >
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
