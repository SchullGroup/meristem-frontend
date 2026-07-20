"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Download,
  User,
  Building2,
  X,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import {
  DematRequest,
  DEMAT_SHAREHOLDERS,
  DEMAT_STOCKBROKERS,
  DEMAT_CERTIFICATES,
} from "./demat-types";
import { toast } from "sonner";

interface DematApprovalComparisonProps {
  request: DematRequest;
  approveLabel: string;
  onBack: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, comment: string) => void;
}

const STATUS_BADGE_VARIANTS: Record<
  string,
  { label: string; className: string }
> = {
  PENDING_HOD: {
    label: "Pending HOD",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  PENDING_COO: {
    label: "Pending COO",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  PENDING_ICU: {
    label: "Pending ICU",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  LODGED: {
    label: "Lodged",
    className: "bg-teal-100 text-teal-800 border-teal-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium${mono ? " font-mono" : ""}`}>
        {value ?? <span className="text-muted-foreground italic">—</span>}
      </span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-3 border-b pb-1.5">
      {children}
    </p>
  );
}

export function DematApprovalComparison({
  request,
  approveLabel,
  onBack,
  onApprove,
  onReject,
}: DematApprovalComparisonProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const statusBadge =
    STATUS_BADGE_VARIANTS[request.status] ?? STATUS_BADGE_VARIANTS["PENDING_HOD"];

  const holder = DEMAT_SHAREHOLDERS.find((s) => s.chn === request.holderChn);

  const certificates = request.certificateNos.map((certNo) =>
    DEMAT_CERTIFICATES.find((c) => c.certNo === certNo)
  );

  const totalUnits = certificates.reduce(
    (sum, c) => sum + (c?.units ?? 0),
    0
  );
  const estimatedValue = totalUnits * request.unitPrice;
  const isHighValue = totalUnits > 10_000_000 || estimatedValue > 5_000_000;

  const broker = DEMAT_STOCKBROKERS.find((b) => b.id === request.stockbrokerId);
  const agent = broker?.mandates?.[0] ?? null;

  function handleApprove() {
    onApprove(request.id);
    toast.success(`${approveLabel} — Request ${request.id} approved.`);
    onBack();
  }

  function handleRejectConfirm() {
    if (!rejectComment.trim()) return;
    onReject(request.id, rejectComment.trim());
    toast.error(`Request ${request.id} rejected.`);
    setRejectOpen(false);
    onBack();
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="font-mono text-base font-semibold">{request.id}</span>
          <Badge
            variant="outline"
            className={`text-xs ${statusBadge.className}`}
          >
            {statusBadge.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Created {request.createdAt}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            {approveLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRejectOpen(true)}
            className="gap-1.5 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <AlertTriangle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>

      {/* ── Two-column grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Card 1 — Shareholder Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Shareholder Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {holder ? (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="col-span-2">
                      <DetailRow label="Full Name" value={holder.name} />
                    </div>
                    <DetailRow label="CHN" value={holder.chn} mono />
                    <DetailRow label="Account No" value={holder.accountNo} mono />
                    <DetailRow label="BVN" value={holder.bvn} mono />
                    <DetailRow label="NIN" value={holder.nin} mono />
                    <DetailRow label="Phone" value={holder.phone} />
                    <DetailRow label="Email" value={holder.email} />
                    <div className="col-span-2">
                      <DetailRow label="Address" value={holder.address} />
                    </div>
                  </div>

                  <SectionHeading>KYC</SectionHeading>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <DetailRow label="ID Type" value={holder.idType} />
                    <DetailRow label="ID Number" value={holder.idNumber} mono />
                    <DetailRow label="ID Expiry" value={holder.idExpiry} />
                  </div>

                  <SectionHeading>Bank Details</SectionHeading>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <DetailRow label="Bank Name" value={holder.bankName} />
                    <DetailRow
                      label="Account No"
                      value={holder.bankAccountNo}
                      mono
                    />
                    <DetailRow label="Account Type" value={holder.bankAccountType} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div className="col-span-2">
                    <DetailRow label="Full Name" value={request.holderName} />
                  </div>
                  <DetailRow label="CHN" value={request.holderChn} mono />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2 — Certificate Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Certificate Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {certificates.map((cert, idx) =>
                cert ? (
                  <div
                    key={cert.certNo}
                    className="rounded-md border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold">
                        {cert.certNo}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {cert.register}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{cert.description}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <DetailRow
                        label="Units"
                        value={
                          <span className="font-bold">
                            {formatNumber(cert.units)}
                          </span>
                        }
                      />
                      <DetailRow label="Date Issued" value={cert.dateIssued} />
                      <DetailRow
                        label="Status"
                        value={
                          <span
                            className={
                              cert.status === "ACTIVE"
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {cert.status}
                          </span>
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="rounded-md border border-dashed p-4 text-xs text-muted-foreground"
                  >
                    Certificate {request.certificateNos[idx]} not found in registry.
                  </div>
                )
              )}

              {/* Summary row */}
              <div className="rounded-md bg-muted/50 p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <DetailRow
                  label="Total Units"
                  value={
                    <span className="font-bold text-base">
                      {formatNumber(totalUnits)}
                    </span>
                  }
                />
                <DetailRow
                  label="Estimated Value"
                  value={
                    <span className="font-bold text-base">
                      &#8358;{formatNumber(estimatedValue)}
                    </span>
                  }
                />
              </div>

              {/* High-value banner */}
              {isHighValue && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    High-value demat — requires COO/CEO approval.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Card 3 — Supporting Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold mb-2">
                  Demat Forms ({request.documents.dematForms.length})
                </p>
                <div className="space-y-4">
                  {request.documents.dematForms.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between gap-2 rounded-md border px-4 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-7 px-2 gap-1 text-xs"
                        onClick={() =>
                          toast.info(`Downloading ${file.name}...`)
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2">
                  Scanned Certificates ({request.documents.scannedCerts.length})
                </p>
                <div className="space-y-4">
                  {request.documents.scannedCerts.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between gap-2 rounded-md border px-4 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-7 px-2 gap-1 text-xs"
                        onClick={() =>
                          toast.info(`Downloading ${file.name}...`)
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document preview placeholder */}
              <div className="flex h-56 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/20 flex-col gap-2 text-muted-foreground">
                <FileText className="h-8 w-8 opacity-40" />
                <span className="text-sm">Document Preview</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 — Stockbroker & Agent Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Stockbroker &amp; Agent Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {broker ? (
                <>
                  <p className="text-sm font-bold">{broker.firmName}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <DetailRow label="CSCS Code" value={broker.cscsCode} mono />
                    <DetailRow label="License No" value={broker.licenseNo} mono />
                    <DetailRow label="Phone" value={broker.phone} />
                    <DetailRow label="Email" value={broker.email} />
                    <div className="col-span-2">
                      <DetailRow label="Address" value={broker.address} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div className="col-span-2">
                    <DetailRow
                      label="Stockbroker"
                      value={request.stockbrokerName}
                    />
                  </div>
                </div>
              )}

              {agent && (
                <>
                  <SectionHeading>Agent</SectionHeading>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="col-span-2">
                      <DetailRow label="Agent Name" value={agent.agentName} />
                    </div>
                    <DetailRow label="Position" value={agent.position} />
                    <DetailRow label="Phone" value={agent.phone} />
                    <div className="col-span-2">
                      <DetailRow label="Email" value={agent.email} />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    {/* Agent Signature placeholder */}
                    <div className="flex flex-1 h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/20 flex-col gap-1 text-muted-foreground">
                      <span className="text-xs">Agent Signature</span>
                    </div>

                    {/* Agent Passport placeholder */}
                    <div
                      className="flex items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/20 flex-col gap-1 text-muted-foreground"
                      style={{ height: "6rem", aspectRatio: "3/4" }}
                    >
                      <User className="h-5 w-5 opacity-40" />
                      <span className="text-xs">Agent Passport</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Reject Dialog ──────────────────────────────────────────────── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Demat Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting request{" "}
              <span className="font-mono font-semibold">{request.id}</span>. This
              comment will be visible to the submitting officer.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setRejectComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectComment.trim()}
              onClick={handleRejectConfirm}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
