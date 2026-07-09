"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Archive,
  Clock,
  History,
} from "lucide-react";
import {
  useGetHolderKycDocuments,
  useGetHolderSignature,
  useGetHolderSignatureArchive,
} from "@/hooks/useAccountMaintenance";
import { HolderKycDocument } from "@/types/account-maintenance";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { GetPDFUrl } from "@/lib/utils/get-file-url";
import {
  DocumentViewer,
  DocumentEntry,
} from "@/components/custom/document-viewer";

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

// ── Local entry types ───────────────────────────────────────────────────────
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

interface SigEntry {
  id: string;
  file: File | null;
  url: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
}

function newSigEntry(): SigEntry {
  return { id: crypto.randomUUID(), file: null, url: "", status: "idle" };
}

// ── Signature archive entry ─────────────────────────────────────────────────
interface ArchivedSignature {
  id: string;
  signatureUrl: string;
  status: "ACTIVE" | "ARCHIVED";
  uploadedAt: string;
  uploadedBy: string;
  approvedAt?: string;
  approvedBy?: string;
}

// ── Props ───────────────────────────────────────────────────────────────────
interface KycDocumentsTabProps {
  chn: string;
  registerSymbol: string;
  holderName: string;
  currentUserEmail: string;
  accountNumber: string;
  isSubmitting: boolean;
  onFieldSubmit: (
    accountNumber: string,
    changeType: string,
    field: string,
    newValue: string,
    reason: string,
  ) => Promise<void>;
}

export function KycDocumentsTab({
  chn,
  registerSymbol,
  accountNumber,
  isSubmitting,
  onFieldSubmit,
}: KycDocumentsTabProps) {
  const [docSubTab, setDocSubTab] = useState("upload");

  // ── Signature on file (current) ──────────────────────────────────────────
  const {
    data: sigOnFileData,
    isLoading: isLoadingSigOnFile,
    refetch: refetchSigOnFile,
  } = useGetHolderSignature(chn, registerSymbol, {
    enabled: !!chn && !!registerSymbol,
  });
  const sigOnFileUrl = sigOnFileData?.data?.signatureUrl ?? "";

  // ── Signature archive ────────────────────────────────────────────────────
  const {
    data: sigArchiveData,
    isLoading: isLoadingSigArchive,
    refetch: refetchSigArchive,
  } = useGetHolderSignatureArchive(chn, registerSymbol, {
    enabled: !!chn && !!registerSymbol,
  });

  // ── Memoized signature archive groups ────────────────────────────────────
  const { activeSig, archivedSigs } = useMemo(() => {
    const sigs: ArchivedSignature[] = sigArchiveData?.data ?? [];
    const active = sigs.find((s) => s.status === "ACTIVE") ?? null;
    const archived = sigs.filter((s) => s.status !== "ACTIVE");
    return { activeSig: active, archivedSigs: archived };
  }, [sigArchiveData]);

  // ── KYC Documents ───────────────────────────────────────────────────────
  const {
    data: kycDocsData,
    isLoading: isLoadingKycDocs,
    refetch: refetchKycDocs,
  } = useGetHolderKycDocuments(chn, registerSymbol, {
    enabled: !!chn && !!registerSymbol,
  });
  const uploadedDocs: HolderKycDocument[] = kycDocsData?.data ?? [];

  // ── Document viewer state ──────────────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocs, setViewerDocs] = useState<DocumentEntry[]>([]);

  const openInViewer = (docs: DocumentEntry[]) => {
    setViewerDocs(docs);
    setViewerOpen(true);
  };

  // ── Signature upload state ──────────────────────────────────────────────
  const [sigEntry, setSigEntry] = useState<SigEntry>(newSigEntry());
  const [sigReason, setSigReason] = useState("");

  const handleSigFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSigEntry((prev) => ({
        ...prev,
        status: "error",
        errorMsg: "Only image files are accepted (JPG, PNG)",
      }));
      return;
    }
    setSigEntry((prev) => ({
      ...prev,
      file,
      status: "uploading",
      errorMsg: undefined,
    }));
    try {
      const res = await GetImageUrl(file, "signatures");
      if (res?.type === "success") {
        setSigEntry((prev) => ({
          ...prev,
          url: res.result as string,
          status: "done",
        }));
      } else {
        const r = res?.result;
        const msg =
          r instanceof Error
            ? r.message
            : typeof r === "string"
              ? r
              : "Upload failed";
        setSigEntry((prev) => ({
          ...prev,
          status: "error",
          errorMsg: msg,
          file: null,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setSigEntry((prev) => ({
        ...prev,
        status: "error",
        errorMsg: msg,
        file: null,
      }));
    }
  };

  const handleSubmitSignature = async () => {
    if (!sigEntry.url || !sigReason.trim()) {
      toast.error("Please provide a reason for the signature change");
      return;
    }
    try {
      await onFieldSubmit(
        accountNumber,
        "SIGNATURE",
        "signature",
        sigEntry.url,
        sigReason.trim(),
      );
      toast.success("Signature submitted for approval");
      setSigEntry(newSigEntry());
      setSigReason("");
      refetchSigOnFile();
      refetchSigArchive();
    } catch {
      // Error toast already shown by parent
    }
  };

  // ── KYC Documents upload state ──────────────────────────────────────────
  const [kycDocEntries, setKycDocEntries] = useState<KycDocEntry[]>([
    newKycDocEntry(),
  ]);
  const [docReason, setDocReason] = useState("");

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

  const handleSubmitKycDocs = async () => {
    const readyDocs = kycDocEntries.filter((e) => e.status === "done" && e.url);
    if (!readyDocs.length) {
      toast.error("Upload at least one document before submitting");
      return;
    }
    if (!docReason.trim()) {
      toast.error("Please provide a reason for the document upload");
      return;
    }

    // Submit each document as a KYC change for approval
    let failed = false;
    for (const doc of readyDocs) {
      try {
        await onFieldSubmit(
          accountNumber,
          "DOCUMENT",
          doc.documentType || "OTHER",
          JSON.stringify({
            url: doc.url,
            name: doc.documentName || doc.file?.name || "Document",
            ref: doc.documentRef,
            type: doc.documentType || "OTHER",
          }),
          docReason.trim(),
        );
      } catch {
        failed = true;
      }
    }

    if (!failed) {
      toast.success(`${readyDocs.length} document(s) submitted for approval`);
      setKycDocEntries([newKycDocEntry()]);
      setDocReason("");
      refetchKycDocs();
    }
  };

  return (
    <>
      <Tabs
        value={docSubTab}
        onValueChange={(v) => setDocSubTab(v || "upload")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5 mb-6">
          {[
            { value: "upload", label: "Upload" },
            { value: "archive", label: "Signature Archive" },
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

        {/* ═══════════════════════════════════════════════════════════════════
          Upload sub-tab
          ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="upload" className="space-y-6">
          {/* ── Signature section ── */}
          <Card className="mrpsl-card p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-primary" />
                  Signature Upload
                </h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Upload a new signature for this holder. All signature changes
                  now go through the KYC approval workflow before being applied.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Requires approval
              </div>
            </div>

            {/* Current signature preview */}
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
                  <button
                    type="button"
                    onClick={() =>
                      openInViewer([
                        { name: "Current Signature", url: sigOnFileUrl },
                      ])
                    }
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/5"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sigOnFileUrl}
                  alt="Current signature on file"
                  className="max-h-24 max-w-xs rounded border border-border/40 bg-white object-contain"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-center">
                <p className="text-[13px] text-muted-foreground">
                  No signature on file for this holder
                </p>
              </div>
            )}

            {/* Upload new signature */}
            <div className="space-y-3">
              {sigEntry.status === "done" && sigEntry.file ? (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden border border-green-200 bg-white shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sigEntry.url}
                      alt="Signature preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <p className="text-[13px] font-semibold text-green-900 truncate">
                        {sigEntry.file.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-green-700/70 mt-0.5">
                      {(sigEntry.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSigEntry(newSigEntry())}
                      className="text-green-400 hover:text-destructive transition-colors p-0.5 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openInViewer([
                          {
                            name: sigEntry.file?.name || "Signature",
                            url: sigEntry.url,
                          },
                        ])
                      }
                      className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Preview
                    </button>
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
                      sigEntry.status === "uploading" &&
                        "border-primary/40 bg-primary/5 cursor-default",
                      sigEntry.status === "error" &&
                        "border-destructive/40 bg-destructive/5",
                      sigEntry.status === "idle" &&
                        "border-border/60 hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    {sigEntry.status === "uploading" ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    ) : (
                      <Upload
                        className={cn(
                          "h-5 w-5 shrink-0",
                          sigEntry.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground group-hover:text-primary",
                        )}
                      />
                    )}
                    <div>
                      <p
                        className={cn(
                          "text-[13px] font-medium",
                          sigEntry.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground group-hover:text-primary",
                        )}
                      >
                        {sigEntry.status === "uploading"
                          ? "Uploading…"
                          : sigEntry.status === "error"
                            ? sigEntry.errorMsg
                            : "Click to upload new signature image"}
                      </p>
                      {sigEntry.status !== "error" &&
                        sigEntry.status !== "uploading" && (
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            JPG or PNG · Max 10 MB
                          </p>
                        )}
                    </div>
                  </label>
                </>
              )}
            </div>

            {/* Reason and submit */}
            {sigEntry.status === "done" && (
              <div className="space-y-3 pt-2">
                <Input
                  className="mrpsl-input text-sm"
                  placeholder="Reason for signature change (required)"
                  value={sigReason}
                  onChange={(e) => setSigReason(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitSignature}
                    disabled={!sigReason.trim() || isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Submit for Approval
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* ── KYC Documents section ── */}
          <Card className="mrpsl-card p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  KYC Documents
                </h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Upload supporting identity documents. Each submission goes
                  through the KYC approval workflow before being accepted.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Requires approval
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
                        <button
                          type="button"
                          onClick={() =>
                            openInViewer([
                              {
                                name: entry.file?.name || "Document",
                                url: entry.url,
                              },
                            ])
                          }
                          className="flex items-center gap-1 text-[10px] font-semibold text-green-700 hover:text-green-900 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100 shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Preview
                        </button>
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

            {/* Reason for documents */}
            <div className="space-y-3 pt-2">
              <Input
                className="mrpsl-input text-sm"
                placeholder="Reason for uploading these documents (required)"
                value={docReason}
                onChange={(e) => setDocReason(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitKycDocs}
                  disabled={
                    isSubmitting ||
                    !kycDocEntries.some((e) => e.status === "done") ||
                    !docReason.trim()
                  }
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit Documents for Approval
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
          Signature Archive sub-tab
          ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="archive">
          <Card className="mrpsl-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">Signature Archive</h3>
            </div>
            <p className="text-[13px] text-muted-foreground">
              View all signatures associated with this account — both the
              currently active signature and past archived versions.
            </p>

            {isLoadingSigArchive ? (
              <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading signature archive…
              </div>
            ) : archivedSigs.length === 0 && !activeSig ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                No signatures found for this holder.
              </div>
            ) : (
              <div className="space-y-3">
                {archivedSigs.map((sig) => {
                  const isActive = sig.status === "ACTIVE";
                  return (
                    <div
                      key={sig.id}
                      className={cn(
                        "rounded-xl border p-4 space-y-3",
                        isActive
                          ? "border-green-300 bg-green-50/40 ring-1 ring-green-200"
                          : "border-border/60 bg-muted/10",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {isActive ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] h-5 px-2 font-bold uppercase">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border text-[10px] h-5 px-2 font-bold uppercase">
                              Archived
                            </Badge>
                          )}
                          <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {sig.uploadedAt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openInViewer([
                              {
                                name: `Signature (${isActive ? "Active" : "Archived"})`,
                                url: sig.signatureUrl,
                                uploadedAt: sig.uploadedAt,
                                uploaderName: sig.uploadedBy,
                              },
                            ])
                          }
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/5 shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </button>
                      </div>

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sig.signatureUrl}
                        alt={`Signature ${isActive ? "(Active)" : "(Archived)"}`}
                        className={cn(
                          "max-h-32 max-w-xs rounded border bg-white object-contain",
                          isActive
                            ? "border-green-200"
                            : "border-border/40 opacity-60",
                        )}
                      />

                      <div className="flex gap-4 flex-wrap text-[11px] text-muted-foreground">
                        <span>
                          Uploaded by:{" "}
                          <span className="font-medium text-foreground">
                            {sig.uploadedBy || "—"}
                          </span>
                        </span>
                        {sig.approvedAt && (
                          <span>
                            Approved:{" "}
                            <span className="font-medium text-foreground">
                              {sig.approvedAt}
                            </span>
                          </span>
                        )}
                        {sig.approvedBy && (
                          <span>
                            Approved by:{" "}
                            <span className="font-medium text-foreground">
                              {sig.approvedBy}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
          Review Documents sub-tab (read-only)
          ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="review">
          <Card className="mrpsl-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Uploaded Documents
              </h3>
              <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1">
                <Info className="h-3.5 w-3.5" />
                Approve/reject in KYC Approvals
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Documents uploaded here go through the KYC approval workflow. Use
              the KYC Approvals page to approve or reject them.
            </p>

            {isLoadingKycDocs ? (
              <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents…
              </div>
            ) : uploadedDocs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No documents have been uploaded for this holder yet
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
                        <button
                          type="button"
                          onClick={() =>
                            openInViewer([
                              {
                                name:
                                  doc.documentName ||
                                  doc.documentType ||
                                  "Document",
                                url: doc.documentUrl,
                                uploadedAt: doc.uploadedAt,
                                uploaderName: doc.verifiedBy,
                              },
                            ])
                          }
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Preview
                        </button>
                        {/* Resubmit button for rejected documents */}
                        {isRejected && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] border-primary text-primary hover:bg-primary/3"
                            onClick={() => {
                              // Prefill the upload form and switch to Upload tab
                              setKycDocEntries([
                                {
                                  id: crypto.randomUUID(),
                                  documentType: doc.documentType || "",
                                  documentName: doc.documentName || "",
                                  documentRef: doc.documentRef || "",
                                  file: null,
                                  url: "",
                                  status: "idle",
                                },
                              ]);
                              setDocReason("");
                              setDocSubTab("upload");
                            }}
                          >
                            Resubmit
                          </Button>
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
      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documents={viewerDocs}
      />
    </>
  );
}
