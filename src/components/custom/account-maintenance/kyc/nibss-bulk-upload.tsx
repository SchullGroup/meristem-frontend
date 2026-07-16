"use client";

import { useCallback, useRef, useState } from "react";
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
  FileText,
  Loader2,
  CheckCircle2,
  Upload,
  AlertCircle,
  XCircle,
  Clock,
  ArrowLeft,
  X,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  NibssMandatePreviewRow,
  NibssReviewRow,
} from "@/types/account-maintenance";
import { NibssReviewDrawer } from "./nibss-review-drawer";

type SubmitStatus = "processing" | "success" | "failed";

// ── Table column definitions ───────────────────────────────────────────────

const NIBSS_PRIMARY_COLUMNS: { key: string; label: string }[] = [
  { key: "subscriberName", label: "Subscriber Name" },
  { key: "accountNumber", label: "Account No" },
  { key: "symbol", label: "Symbol" },
  { key: "bvn", label: "BVN" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function cellValue(row: NibssMandatePreviewRow, key: string): string {
  return (row as unknown as Record<string, string>)[key] || "";
}

function ReviewDecisionBadge({
  decision,
}: {
  decision: NibssReviewRow["decision"];
}) {
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
function toReviewRows(rows: NibssMandatePreviewRow[]): NibssReviewRow[] {
  return rows.map((r) => ({
    ...r,
    decision: "unreviewed" as const,
    documents: [],
  }));
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_NAMES = [
  "Adebayo Ogunlesi",
  "Chioma Eze",
  "Ibrahim Musa",
  "Ngozi Okonkwo",
  "Folake Adeyemi",
  "Tunde Bakare",
  "Aisha Bello",
];
const MOCK_SYMBOLS = [
  "MTNN",
  "DANGCEM",
  "ETI",
  "UBA",
  "ZENITH",
  "ACCESS",
  "SEPLAT",
];

function generateMockNibssRows(count = 7): NibssMandatePreviewRow[] {
  return Array.from({ length: count }, (_, i) => ({
    row: i + 2,
    subscriberName: MOCK_NAMES[i % MOCK_NAMES.length],
    broker: `Broker ${i + 1} Securities Ltd`,
    chn: `CHN-${8800 + i}`,
    accountNumber: String(100000 + i * 1111).padStart(7, "0"),
    bankSortCode: "000014",
    stockbrokerCode: `SB-${100 + i}`,
    symbol: MOCK_SYMBOLS[i % MOCK_SYMBOLS.length],
    units: String(1000 * (i + 1)),
    amount: String(5000 * (i + 1)),
    remark: "e-Dividend mandate registration",
    // Mock stand-in: 9033387545 is a real seeded account number, reused as
    // every row's BVN so the account-number lookup below returns real data.
    bvn: "9033387545",
    nin: String(11000000000 + i * 11111111),
    tin: String(33000000000 + i * 11111111),
    nextKin: `Next of Kin ${i + 1}`,
    gender: i % 2 === 0 ? "Male" : "Female",
    type: i % 3 === 0 ? "corporate" : "individual",
    bankAccountNumber: String(2000000000 + i * 11111111),
    phone: `+234800${(1000000 + i).toString().slice(-7)}`,
    email: `mandate${i + 1}@example.com`,
    status: i % 5 === 0 ? "warning" : "valid",
    errors: [],
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

interface NibssBulkUploadProps {
  /** Navigate the user to the KYC change history after a successful submit. */
  onViewChanges?: () => void;
}

export function NibssBulkUpload({ onViewChanges }: NibssBulkUploadProps = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = useStore((s) => s.currentUser);

  const [step, setStep] = useState(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  const [rows, setRows] = useState<NibssReviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [submitMeta, setSubmitMeta] = useState<{
    fileName: string;
    rowCount: number;
    submittedAt: string;
  } | null>(null);

  const [leaveConfirmTarget, setLeaveConfirmTarget] = useState<
    "different-file" | "start-over" | null
  >(null);
  const [showUnreviewedConfirm, setShowUnreviewedConfirm] = useState(false);

  const steps = ["Upload", "Review", "Submit"];

  // ── Derived ──────────────────────────────────────────────────────────

  const acceptedCount = rows.filter((r) => r.decision === "accepted").length;
  const rejectedCount = rows.filter((r) => r.decision === "rejected").length;
  const unreviewedCount = rows.filter(
    (r) => r.decision === "unreviewed",
  ).length;
  const selectedReviewRow = rows.find((r) => r.row === selectedRow) ?? null;

  // ── Actions ──────────────────────────────────────────────────────────

  const approveRow = useCallback(
    (rowNum: number, documents: { name: string; url: string }[]) => {
      setRows((prev) =>
        prev.map((r) =>
          r.row === rowNum ? { ...r, decision: "accepted", documents } : r,
        ),
      );
      setSelectedRow(null);
    },
    [],
  );

  const rejectRow = useCallback((rowNum: number) => {
    setRows((prev) =>
      prev.map((r) => (r.row === rowNum ? { ...r, decision: "rejected" } : r)),
    );
    setSelectedRow(null);
  }, []);

  function resetAll() {
    setStep(1);
    setPendingFile(null);
    setRows([]);
    setFileError("");
    setSelectedRow(null);
    setSubmitStatus(null);
    setSubmitMeta(null);
    if (inputRef.current) inputRef.current.value = "";
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
    // Mock: simulate backend parsing
    setTimeout(() => {
      setRows(toReviewRows(generateMockNibssRows()));
      setPreviewLoading(false);
      setStep(2);
    }, 1800);
  }

  function removeRow(row: number) {
    setRows((prev) => prev.filter((r) => r.row !== row));
    if (selectedRow === row) setSelectedRow(null);
  }

  /** Guard against losing in-progress review decisions when leaving the Review step. */
  function requestLeaveReview(target: "different-file" | "start-over") {
    if (acceptedCount + rejectedCount === 0) {
      executeLeaveReview(target);
      return;
    }
    setLeaveConfirmTarget(target);
  }

  function executeLeaveReview(target: "different-file" | "start-over") {
    if (target === "different-file") {
      setStep(1);
      setRows([]);
      setSelectedRow(null);
    } else {
      setStep(1);
    }
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
    const submissionRows = rows
      .filter((r) => r.decision === "accepted")
      .map((r) => ({
        subscriberName: r.subscriberName,
        broker: r.broker,
        chn: r.chn,
        accountNumber: r.accountNumber,
        bankSortCode: r.bankSortCode,
        stockbrokerCode: r.stockbrokerCode,
        symbol: r.symbol,
        units: r.units,
        amount: r.amount,
        remark: r.remark,
        bvn: r.bvn,
        nin: r.nin,
        tin: r.tin,
        nextKin: r.nextKin,
        gender: r.gender,
        type: r.type,
        bankAccountNumber: r.bankAccountNumber,
        phone: r.phone,
        email: r.email,
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
    // The payload `submissionRows` maps to NibssMandateSubmitRequest.rows.
    setTimeout(() => {
      setSubmitStatus("success");
      toast.success(
        `NIBSS BVN mandate batch submitted — ${submissionRows.length} row${submissionRows.length !== 1 ? "s" : ""} sent for processing.`,
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

        {/* Step 1: Upload */}
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
          </div>
        )}

        {/* Step 2: Review (master table + drawer) */}
        {step === 2 && (
          <div className="space-y-0">
            {/* Summary bar */}
            <div className="flex items-center gap-3 flex-wrap text-[13px] text-muted-foreground mb-4 px-1">
              <span>
                <strong className="text-foreground">{rows.length}</strong> total
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

            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-8" />
                      <th className="p-2.5 text-[11px] font-bold uppercase text-muted-foreground w-8">
                        #
                      </th>
                      {NIBSS_PRIMARY_COLUMNS.map((c) => (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={NIBSS_PRIMARY_COLUMNS.length + 3}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No rows left — every row was removed.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => {
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
                            <td className="p-2.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRow(r.row);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title="Remove this row"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                            <td className="p-2.5 font-mono text-[12px] text-muted-foreground">
                              {r.row}
                            </td>
                            {NIBSS_PRIMARY_COLUMNS.map((c) => (
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
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Submit bar */}
              <div className="flex items-center justify-between gap-4 flex-wrap p-3 border-t bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestLeaveReview("different-file")}
                >
                  ← Upload a different file
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestLeaveReview("start-over")}
                  >
                    Start over
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
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Submit */}
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

      <NibssReviewDrawer
        open={selectedReviewRow !== null}
        onOpenChange={(o) => !o && setSelectedRow(null)}
        row={selectedReviewRow}
        onApprove={(docs) =>
          selectedReviewRow && approveRow(selectedReviewRow.row, docs)
        }
        onReject={() => selectedReviewRow && rejectRow(selectedReviewRow.row)}
      />

      {/* Discard review progress confirmation */}
      <Dialog
        open={leaveConfirmTarget !== null}
        onOpenChange={(o) => !o && setLeaveConfirmTarget(null)}
      >
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
              onClick={() => setLeaveConfirmTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (leaveConfirmTarget) executeLeaveReview(leaveConfirmTarget);
                setLeaveConfirmTarget(null);
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
}
