"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Upload,
  FileText,
  Plus,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import {
  DematRequest,
  DematCertificate,
  DEMAT_CERTIFICATES,
  DEMAT_STOCKBROKERS,
  UNIT_PRICES,
} from "./demat-types";

interface Props {
  requests: DematRequest[];
  onCreateRequest: (req: DematRequest) => void;
  onEditRequest: (id: string, updates: Partial<DematRequest>) => void;
  initialCertNo?: string;
}

export function DematCertificateCapture({
  requests,
  onCreateRequest,
  onEditRequest,
  initialCertNo,
}: Props) {
  // ── Search state ────────────────────────────────────────────────────────
  const [searchValue, setSearchValue] = useState("");
  const [foundCert, setFoundCert] = useState<DematCertificate | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // ── Capture form state ──────────────────────────────────────────────────
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [dematFiles, setDematFiles] = useState<File[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);

  const dematInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // ── Edit form state ─────────────────────────────────────────────────────
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDematFiles, setEditDematFiles] = useState<File[]>([]);
  const [editCertFiles, setEditCertFiles] = useState<File[]>([]);

  const editDematInputRef = useRef<HTMLInputElement>(null);
  const editCertInputRef = useRef<HTMLInputElement>(null);

  // Auto-search when navigated from Verification tab
  useEffect(() => {
    if (!initialCertNo) return;
    const trimmed = initialCertNo.trim();
    setSearchValue(trimmed);
    const match = DEMAT_CERTIFICATES.find(
      (c) => c.certNo.toLowerCase() === trimmed.toLowerCase(),
    );
    setFoundCert(match ?? null);
    setSearchAttempted(true);
    setShowCaptureForm(false);
    setSelectedBrokerId("");
    setDematFiles([]);
    setCertFiles([]);
  }, [initialCertNo]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const trimmed = searchValue.trim();
    setSearchAttempted(true);
    if (!trimmed) {
      setFoundCert(null);
      return;
    }
    const match = DEMAT_CERTIFICATES.find(
      (c) => c.certNo.toLowerCase() === trimmed.toLowerCase(),
    );
    setFoundCert(match ?? null);
    setShowCaptureForm(false);
    setSelectedBrokerId("");
    setDematFiles([]);
    setCertFiles([]);
  };

  const handleCaptureCancel = () => {
    setShowCaptureForm(false);
    setSelectedBrokerId("");
    setDematFiles([]);
    setCertFiles([]);
  };

  const handleDematFileAdd = (files: FileList | null) => {
    if (!files) return;
    setDematFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleCertFileAdd = (files: FileList | null) => {
    if (!files) return;
    setCertFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleSave = () => {
    if (!foundCert) return;
    if (!selectedBrokerId) {
      toast.error("Please select a stockbroker.");
      return;
    }
    if (dematFiles.length === 0) {
      toast.error("Please upload at least one dematerialization form.");
      return;
    }
    if (certFiles.length === 0) {
      toast.error("Please upload at least one scanned certificate.");
      return;
    }

    const broker = DEMAT_STOCKBROKERS.find((b) => b.id === selectedBrokerId);
    if (!broker) return;

    const newRequest: DematRequest = {
      id: "DR" + (Date.now() % 10000).toString().padStart(3, "0"),
      createdAt: "16 Jul 2026",
      certificateNos: [foundCert.certNo],
      holderName: foundCert.holderName,
      holderChn: foundCert.holderChn,
      registerSymbol: foundCert.register,
      stockbrokerName: broker.firmName,
      stockbrokerId: selectedBrokerId,
      totalUnits: foundCert.units,
      unitPrice: UNIT_PRICES[foundCert.register] ?? 0,
      status: "PENDING_HOD",
      documents: {
        dematForms: dematFiles.map((f) => ({ name: f.name, size: "—" })),
        scannedCerts: certFiles.map((f) => ({ name: f.name, size: "—" })),
      },
    };

    onCreateRequest(newRequest);
    toast.success("Demat request created successfully.");
    setShowCaptureForm(false);
    setSelectedBrokerId("");
    setDematFiles([]);
    setCertFiles([]);
    setFoundCert(null);
    setSearchValue("");
    setSearchAttempted(false);
  };

  // ── Edit helpers ─────────────────────────────────────────────────────────
  const openEditForm = (requestId: string) => {
    setEditingRequestId(requestId);
    setEditDematFiles([]);
    setEditCertFiles([]);
    setShowEditForm(true);
  };

  const handleEditDematFileAdd = (files: FileList | null) => {
    if (!files) return;
    setEditDematFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleEditCertFileAdd = (files: FileList | null) => {
    if (!files) return;
    setEditCertFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleResubmit = () => {
    if (!editingRequestId) return;

    const existing = requests.find((r) => r.id === editingRequestId);
    if (!existing) return;

    const mergedDematForms =
      editDematFiles.length > 0
        ? editDematFiles.map((f) => ({ name: f.name, size: "—" }))
        : existing.documents.dematForms;

    const mergedScannedCerts =
      editCertFiles.length > 0
        ? editCertFiles.map((f) => ({ name: f.name, size: "—" }))
        : existing.documents.scannedCerts;

    onEditRequest(editingRequestId, {
      documents: {
        dematForms: mergedDematForms,
        scannedCerts: mergedScannedCerts,
      },
      status: "PENDING_HOD",
    });

    toast.success("Request resubmitted successfully.");
    setShowEditForm(false);
    setEditingRequestId(null);
    setEditDematFiles([]);
    setEditCertFiles([]);
  };

  const rejectedRequests = requests.filter((r) => r.status === "REJECTED");
  const editingRequest = requests.find((r) => r.id === editingRequestId);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Section 1: Certificate Search ─────────────────────────────── */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Certificate Lookup
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search for a shareholder certificate by its certificate number to
            begin a new dematerialization request.
          </p>
        </div>

        {/* Search row */}
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Enter certificate number e.g. DANGCEM/2019/001234"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="xl" onClick={handleSearch} className="shrink-0">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* No result warning */}
        {searchAttempted && !foundCert && searchValue.trim() !== "" && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>No certificate found with that number.</span>
          </div>
        )}

        {/* Certificate detail card */}
        {foundCert && (
          <div className="mt-5 rounded-lg border bg-muted/30 p-5 space-y-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Register
                  </p>
                  <p className="font-medium mt-0.5">{foundCert.register}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Description
                  </p>
                  <p className="font-medium mt-0.5">{foundCert.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Date Issued
                  </p>
                  <p className="font-medium mt-0.5">{foundCert.dateIssued}</p>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Certificate No
                  </p>
                  <p className="font-mono font-medium mt-0.5 text-xs">
                    {foundCert.certNo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Units
                  </p>
                  <p className="font-bold mt-0.5">
                    {formatNumber(foundCert.units)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </p>
                  <div className="mt-0.5">
                    {foundCert.status === "ACTIVE" ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {foundCert.status}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {foundCert.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Holder section */}
            <div className="border-t pt-5 grid grid-cols-3 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Holder Name
                </p>
                <p className="font-medium mt-0.5">{foundCert.holderName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  CHN
                </p>
                <p className="font-mono font-medium mt-0.5 text-xs">
                  {foundCert.holderChn}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Account No
                </p>
                <p className="font-mono font-medium mt-0.5 text-xs">
                  {foundCert.accountNo}
                </p>
              </div>
            </div>

            {/* CTA */}
            {!showCaptureForm && (
              <div className="pt-1">
                <Button
                  onClick={() => setShowCaptureForm(true)}
                  size="sm"
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Create New Demat Request
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Section 2: Create Demat Request form ──────────────────────── */}
      {showCaptureForm && foundCert && (
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Create Demat Request
              </h2>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {foundCert.certNo}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleCaptureCancel}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-5">
            {/* Register (readonly) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Register
              </label>
              <Input
                value={foundCert.register}
                readOnly
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* Stockbroker select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Stockbroker
              </label>
              <Select
                value={selectedBrokerId}
                onValueChange={(v) => setSelectedBrokerId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a stockbroker" />
                </SelectTrigger>
                <SelectContent>
                  {DEMAT_STOCKBROKERS.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.firmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dematerialization Forms upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Dematerialization Forms
              </label>
              <div
                className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-6 flex flex-col items-center gap-2 text-center"
                onClick={() => dematInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload{" "}
                  <span className="text-foreground font-medium">
                    (multiple allowed)
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX supported
                </p>
              </div>
              <input
                ref={dematInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleDematFileAdd(e.target.files)}
              />
              {dematFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {dematFiles.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        className="ml-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() =>
                          setDematFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        aria-label="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Scanned Certificates upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Scanned Certificates
              </label>
              <div
                className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-6 flex flex-col items-center gap-2 text-center"
                onClick={() => certInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload{" "}
                  <span className="text-foreground font-medium">
                    (multiple allowed)
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX supported
                </p>
              </div>
              <input
                ref={certInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleCertFileAdd(e.target.files)}
              />
              {certFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {certFiles.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        className="ml-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() =>
                          setCertFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        aria-label="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-1">
              <Button onClick={handleSave}>Save Demat Request</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Section 3: Rejected Requests ──────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-foreground">
            Returned Requests
          </h2>
          <Badge variant="secondary" className="text-xs">
            {rejectedRequests.length}
          </Badge>
        </div>

        {rejectedRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No returned requests at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {rejectedRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border bg-muted/20 p-5 space-y-4"
              >
                {/* Request summary row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {req.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {req.holderName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.registerSymbol} &mdash;{" "}
                      {req.certificateNos.join(", ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => openEditForm(req.id)}
                  >
                    Edit &amp; Resubmit
                  </Button>
                </div>

                {/* Rejection reason */}
                {req.rejectionComment && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{req.rejectionComment}</span>
                  </div>
                )}

                {/* Inline edit form */}
                {showEditForm &&
                  editingRequestId === req.id &&
                  editingRequest && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Demat Forms */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Dematerialization Forms
                        </label>

                        {/* Existing files as chips */}
                        {editingRequest.documents.dematForms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {editingRequest.documents.dematForms.map(
                              (f, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  <FileText className="h-3 w-3" />
                                  {f.name}
                                </span>
                              ),
                            )}
                          </div>
                        )}

                        <div
                          className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-5 flex flex-col items-center gap-2 text-center"
                          onClick={() => editDematInputRef.current?.click()}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Upload replacement files{" "}
                            <span className="text-foreground font-medium">
                              (multiple allowed)
                            </span>
                          </p>
                        </div>
                        <input
                          ref={editDematInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) =>
                            handleEditDematFileAdd(e.target.files)
                          }
                        />
                        {editDematFiles.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {editDematFiles.map((file, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-2.5 text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  className="ml-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() =>
                                    setEditDematFiles((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  aria-label="Remove file"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Scanned Certs */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Scanned Certificates
                        </label>

                        {/* Existing files as chips */}
                        {editingRequest.documents.scannedCerts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {editingRequest.documents.scannedCerts.map(
                              (f, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  <FileText className="h-3 w-3" />
                                  {f.name}
                                </span>
                              ),
                            )}
                          </div>
                        )}

                        <div
                          className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-5 flex flex-col items-center gap-2 text-center"
                          onClick={() => editCertInputRef.current?.click()}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Upload replacement files{" "}
                            <span className="text-foreground font-medium">
                              (multiple allowed)
                            </span>
                          </p>
                        </div>
                        <input
                          ref={editCertInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) =>
                            handleEditCertFileAdd(e.target.files)
                          }
                        />
                        {editCertFiles.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {editCertFiles.map((file, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-2.5 text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  className="ml-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() =>
                                    setEditCertFiles((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  aria-label="Remove file"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Resubmit / cancel */}
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowEditForm(false);
                            setEditingRequestId(null);
                            setEditDematFiles([]);
                            setEditCertFiles([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleResubmit}>
                          Resubmit Request
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
