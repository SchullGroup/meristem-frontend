"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Loader2,
  Upload,
  X,
  CheckCircle2,
  FileText,
  Plus,
  Info,
  PenLine,
  ExternalLink,
} from "lucide-react";
import {
  useUploadHolderSignature,
  useUploadHolderKycDocuments,
  useGetHolderKycDocuments,
  useGetHolderSignature,
  useVerifyHolderKycDocument,
  useRejectHolderKycDocument,
} from "@/hooks/useAccountMaintenance";
import { HolderKycDocument } from "@/types/account-maintenance";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import { fullName } from "@/lib/utils/shareholder";

// ── Document types ──────────────────────────────────────────────────────────
const DOC_TYPES = [
  { value: "NIN", label: "National ID (NIN)" },
  { value: "BVN", label: "Bank Verification Number (BVN)" },
  { value: "PASSPORT", label: "International Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
  { value: "UTILITY_BILL", label: "Utility Bill" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "EMPLOYMENT_LETTER", label: "Employment Letter" },
  { value: "OTHER", label: "Other" },
];

interface KycDocEntry {
  id: string;
  documentType: string;
  documentName: string;
  documentRef: string;
  file: File | null;
  url: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
}

function newKycDocEntry(): KycDocEntry {
  return {
    id: crypto.randomUUID(),
    documentType: "",
    documentName: "",
    documentRef: "",
    file: null,
    url: "",
    status: "idle",
  };
}

// ── Props ───────────────────────────────────────────────────────────────────
interface KycDocumentsTabProps {
  chn: string;
  registerSymbol: string;
  holderName: string;
  currentUserEmail: string;
}

export function KycDocumentsTab({
  chn,
  registerSymbol,
  holderName,
  currentUserEmail,
}: KycDocumentsTabProps) {
  const [docSubTab, setDocSubTab] = useState("upload");

  // ── Signature ───────────────────────────────────────────────────────────
  const {
    data: sigOnFileData,
    isLoading: isLoadingSigOnFile,
    refetch: refetchSigOnFile,
  } = useGetHolderSignature(chn, registerSymbol, {
    enabled: !!chn && !!registerSymbol,
  });
  const sigOnFileUrl = sigOnFileData?.data?.signatureUrl ?? "";

  const uploadSignatureMutation = useUploadHolderSignature();

  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigUrl, setSigUrl] = useState("");
  const [sigStatus, setSigStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [sigError, setSigError] = useState("");

  const handleSigFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSigError("Only image files are accepted for signatures (JPG, PNG)");
      setSigStatus("error");
      return;
    }
    setSigFile(file);
    setSigStatus("uploading");
    setSigError("");
    try {
      const res = await GetImageUrl(file, "signatures");
      if (res?.type === "success") {
        setSigUrl(res.result as string);
        setSigStatus("done");
      } else {
        const r = res?.result;
        setSigError(
          r instanceof Error
            ? r.message
            : typeof r === "string"
              ? r
              : "Upload failed",
        );
        setSigStatus("error");
        setSigFile(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setSigError(msg);
      setSigStatus("error");
      setSigFile(null);
    }
  };

  const handleSubmitSignature = () => {
    if (!sigUrl) return;
    uploadSignatureMutation.mutate(
      { chn, registerSymbol, signatureUrl: sigUrl, holderName },
      {
        onSuccess: () => {
          toast.success("Signature uploaded successfully!");
          setSigFile(null);
          setSigUrl("");
          setSigStatus("idle");
          refetchSigOnFile();
        },
        onError: (err: Error) =>
          toast.error(err.message || "Failed to upload signature"),
      },
    );
  };

  // ── KYC Documents ───────────────────────────────────────────────────────
  const uploadKycDocsMutation = useUploadHolderKycDocuments();
  const verifyDocMutation = useVerifyHolderKycDocument();
  const rejectDocMutation = useRejectHolderKycDocument();

  const {
    data: kycDocsData,
    isLoading: isLoadingKycDocs,
    refetch: refetchKycDocs,
  } = useGetHolderKycDocuments(chn, registerSymbol, {
    enabled: !!chn && !!registerSymbol,
  });
  const uploadedDocs: HolderKycDocument[] = kycDocsData?.data ?? [];

  const [kycDocEntries, setKycDocEntries] = useState<KycDocEntry[]>([
    newKycDocEntry(),
  ]);

  const updateKycDocEntry = (id: string, patch: Partial<KycDocEntry>) => {
    setKycDocEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  };

  const handleKycDocFile = async (id: string, file: File) => {
    updateKycDocEntry(id, { file, status: "uploading", errorMsg: undefined });
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeType = file.type.toLowerCase();
      let res;
      if (mimeType === "application/pdf" || ext === "pdf") {
        res = await GetPDFUrl(file, "kycdocs");
      } else {
        res = await GetImageUrl(file, "kycdocs");
      }
      if (res?.type === "success") {
        updateKycDocEntry(id, { url: res.result as string, status: "done" });
      } else {
        const r = res?.result;
        const errorMsg =
          r instanceof Error
            ? r.message
            : typeof r === "string"
              ? r
              : "Upload failed";
        updateKycDocEntry(id, { status: "error", errorMsg, file: null });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      updateKycDocEntry(id, { status: "error", errorMsg: msg, file: null });
    }
  };

  const handleSubmitKycDocs = () => {
    const readyDocs = kycDocEntries.filter((e) => e.status === "done" && e.url);
    if (!readyDocs.length) {
      toast.error("Upload at least one document before submitting");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    uploadKycDocsMutation.mutate(
      {
        chn,
        registerSymbol,
        documents: readyDocs.map((e) => ({
          documentType: e.documentType || "OTHER",
          documentName: e.documentName || e.file?.name || "Document",
          documentRef: e.documentRef || e.file?.name || "",
          documentUrl: e.url,
          uploadedAt: today,
        })),
      },
      {
        onSuccess: () => {
          toast.success("KYC documents submitted for review!");
          setKycDocEntries([newKycDocEntry()]);
          refetchKycDocs();
        },
        onError: (err: Error) =>
          toast.error(err.message || "Failed to submit KYC documents"),
      },
    );
  };

  return (
    <Tabs
      value={docSubTab}
      onValueChange={(v) => setDocSubTab(v || "upload")}
      className="w-full"
    >
      <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-6">
        {[
          { value: "upload", label: "Upload" },
          { value: "review", label: "Review Documents" },
        ].map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="rounded-lg px-5 py-2 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* ── Upload sub-tab ── */}
      <TabsContent value="upload" className="space-y-6">
        {/* Signature section */}
        <Card className="mrpsl-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                Signature Upload
              </h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Upload the holder&apos;s signature image. Applied immediately —
                no review required.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1">
              <Info className="h-3.5 w-3.5" />
              No approval needed
            </div>
          </div>

          {isLoadingSigOnFile ? (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading current signature…
            </div>
          ) : sigOnFileUrl ? (
            <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Current Signature on File
                </p>
                <a
                  href={sigOnFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/5"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sigOnFileUrl}
                alt="Current signature on file"
                className="max-h-24 max-w-xs rounded border border-border/40 bg-white object-contain"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            {sigStatus === "done" && sigFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-3">
                <div className="h-12 w-12 rounded-lg overflow-hidden border border-green-200 bg-white shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sigUrl}
                    alt="Signature preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <p className="text-[13px] font-semibold text-green-900 truncate">
                      {sigFile.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-green-700/70 mt-0.5">
                    {(sigFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSigFile(null);
                      setSigUrl("");
                      setSigStatus("idle");
                      setSigError("");
                    }}
                    className="text-green-400 hover:text-destructive transition-colors p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={sigUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Preview
                  </a>
                </div>
              </div>
            ) : (
              <>
                <input
                  id="sig-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSigFile(f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor="sig-upload"
                  className={cn(
                    "flex items-center gap-3 border-2 border-dashed rounded-xl px-5 py-4 cursor-pointer transition-colors group",
                    sigStatus === "uploading" &&
                      "border-primary/40 bg-primary/5 cursor-default",
                    sigStatus === "error" &&
                      "border-destructive/40 bg-destructive/5",
                    sigStatus === "idle" &&
                      "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                  )}
                >
                  {sigStatus === "uploading" ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  ) : (
                    <Upload
                      className={cn(
                        "h-5 w-5 shrink-0",
                        sigStatus === "error"
                          ? "text-destructive"
                          : "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-[13px] font-medium",
                        sigStatus === "error"
                          ? "text-destructive"
                          : "text-muted-foreground group-hover:text-primary",
                      )}
                    >
                      {sigStatus === "uploading"
                        ? "Uploading…"
                        : sigStatus === "error"
                          ? sigError
                          : "Click to upload signature image"}
                    </p>
                    {sigStatus !== "error" && sigStatus !== "uploading" && (
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                        JPG or PNG · Max 10 MB
                      </p>
                    )}
                  </div>
                </label>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmitSignature}
              disabled={!sigUrl || uploadSignatureMutation.isPending}
            >
              {uploadSignatureMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Upload Signature
            </Button>
          </div>
        </Card>

        {/* KYC Documents section */}
        <Card className="mrpsl-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                KYC Documents
              </h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Upload supporting identity documents. Each submission goes
                through a review and approval workflow.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Requires review
            </div>
          </div>

          <div className="space-y-3">
            {kycDocEntries.map((entry, idx) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <span className="text-[11px] font-bold text-muted-foreground/60 w-5 shrink-0">
                    {idx + 1}.
                  </span>
                  <Select
                    value={entry.documentType}
                    onValueChange={(v) =>
                      updateKycDocEntry(entry.id, { documentType: v || "" })
                    }
                  >
                    <SelectTrigger className="w-52 mrpsl-input h-8 text-[13px]">
                      <SelectValue placeholder="Document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Document name (e.g. John NIN Slip)"
                    value={entry.documentName}
                    onChange={(e) =>
                      updateKycDocEntry(entry.id, {
                        documentName: e.target.value,
                      })
                    }
                    className="h-8 text-[13px] mrpsl-input flex-1"
                  />
                  <Input
                    placeholder="Ref / ID number"
                    value={entry.documentRef}
                    onChange={(e) =>
                      updateKycDocEntry(entry.id, {
                        documentRef: e.target.value,
                      })
                    }
                    className="h-8 text-[13px] mrpsl-input w-36"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setKycDocEntries((prev) =>
                        prev.filter((e) => e.id !== entry.id),
                      )
                    }
                    className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded"
                    aria-label="Remove document"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="px-3 pb-3 pl-10">
                  {entry.status === "done" && entry.file ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 p-2.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <p className="text-[13px] font-medium text-green-900 truncate flex-1">
                        {entry.file.name}
                      </p>
                      <p className="text-[11px] text-green-600/70 shrink-0">
                        {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100 shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          updateKycDocEntry(entry.id, {
                            file: null,
                            url: "",
                            status: "idle",
                            errorMsg: undefined,
                          })
                        }
                        className="text-green-400 hover:text-destructive transition-colors p-0.5 rounded shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : entry.status === "uploading" ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 border border-primary/20 bg-primary/5 rounded-lg">
                      <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                      <p className="text-[12px] text-primary truncate">
                        Uploading {entry.file?.name}…
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        id={`doc-upload-${entry.id}`}
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/jpg"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleKycDocFile(entry.id, f);
                          e.target.value = "";
                        }}
                      />
                      <label
                        htmlFor={`doc-upload-${entry.id}`}
                        className={cn(
                          "flex items-center gap-3 border-2 border-dashed rounded-lg px-4 py-2.5 cursor-pointer transition-colors group",
                          entry.status === "error"
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                        )}
                      >
                        <Upload
                          className={cn(
                            "h-4 w-4 shrink-0",
                            entry.status === "error"
                              ? "text-destructive"
                              : "text-muted-foreground group-hover:text-primary",
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              "text-[12px] font-medium",
                              entry.status === "error"
                                ? "text-destructive"
                                : "text-muted-foreground group-hover:text-primary",
                            )}
                          >
                            {entry.status === "error"
                              ? entry.errorMsg
                              : "Click or drag to upload file"}
                          </p>
                          {entry.status !== "error" && (
                            <p className="text-[10px] text-muted-foreground/50">
                              PDF, JPG, PNG · Max 10 MB
                            </p>
                          )}
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setKycDocEntries((prev) => [...prev, newKycDocEntry()])
            }
            className="w-full border-dashed text-muted-foreground hover:text-foreground h-8 text-[12px]"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add another document
          </Button>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmitKycDocs}
              disabled={
                uploadKycDocsMutation.isPending ||
                !kycDocEntries.some((e) => e.status === "done")
              }
            >
              {uploadKycDocsMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Documents for Review
            </Button>
          </div>
        </Card>
      </TabsContent>

      {/* ── Review sub-tab ── */}
      <TabsContent value="review">
        <Card className="mrpsl-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Uploaded Documents
            </h3>
          </div>

          {isLoadingKycDocs ? (
            <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents…
            </div>
          ) : uploadedDocs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No documents uploaded for this holder yet
            </div>
          ) : (
            <div className="space-y-2">
              {uploadedDocs.map((doc) => {
                const isPending =
                  !doc.status ||
                  doc.status.toUpperCase() === "PENDING" ||
                  doc.status.toUpperCase() === "UPLOADED";
                const isVerified =
                  doc.status?.toUpperCase() === "VERIFIED" ||
                  doc.status?.toUpperCase() === "APPROVED";
                const isRejected = doc.status?.toUpperCase() === "REJECTED";
                const isApproving =
                  verifyDocMutation.isPending &&
                  verifyDocMutation.variables?.id === doc.id;
                const isRejecting =
                  rejectDocMutation.isPending &&
                  rejectDocMutation.variables?.id === doc.id;
                const isActing = isApproving || isRejecting;

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "rounded-xl border p-3.5 flex items-center gap-4",
                      isVerified && "border-green-200 bg-green-50/40",
                      isRejected && "border-red-200 bg-red-50/40",
                      isPending && "border-amber-200 bg-amber-50/30",
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold truncate">
                          {doc.documentName || doc.documentType}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                            isVerified && "bg-green-100 text-green-700",
                            isRejected && "bg-red-100 text-red-700",
                            isPending && "bg-amber-100 text-amber-700",
                          )}
                        >
                          {doc.status || "Pending"}
                        </span>
                      </div>
                      <div className="flex gap-3 flex-wrap text-[11px] text-muted-foreground">
                        <span>
                          Type:{" "}
                          <span className="font-medium text-foreground">
                            {doc.documentType}
                          </span>
                        </span>
                        {doc.documentRef && (
                          <span>
                            Ref:{" "}
                            <span className="font-mono text-foreground">
                              {doc.documentRef}
                            </span>
                          </span>
                        )}
                        <span>
                          Uploaded:{" "}
                          <span className="text-foreground">
                            {doc.uploadedAt}
                          </span>
                        </span>
                        {isVerified && doc.verifiedBy && (
                          <span>
                            Verified by:{" "}
                            <span className="text-foreground">
                              {doc.verifiedBy}
                            </span>
                          </span>
                        )}
                        {isRejected && doc.verifiedBy && (
                          <span>
                            Rejected by:{" "}
                            <span className="text-foreground">
                              {doc.verifiedBy}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview
                      </a>
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] border-primary text-primary hover:bg-primary/3"
                            disabled={isActing}
                            onClick={() =>
                              verifyDocMutation.mutate(
                                { id: doc.id, actionBy: currentUserEmail },
                                {
                                  onSuccess: () => {
                                    toast.success("Document approved");
                                    refetchKycDocs();
                                  },
                                  onError: (err: Error) =>
                                    toast.error(
                                      err.message ||
                                        "Failed to approve document",
                                    ),
                                },
                              )
                            }
                          >
                            {isApproving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isActing}
                            onClick={() =>
                              rejectDocMutation.mutate(
                                { id: doc.id, actionBy: currentUserEmail },
                                {
                                  onSuccess: () => {
                                    toast.success("Document rejected");
                                    refetchKycDocs();
                                  },
                                  onError: (err: Error) =>
                                    toast.error(
                                      err.message ||
                                        "Failed to reject document",
                                    ),
                                },
                              )
                            }
                          >
                            {isRejecting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Reject"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}
