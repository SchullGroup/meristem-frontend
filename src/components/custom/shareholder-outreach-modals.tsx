"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Printer,
  Download,
  Mail,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";
import { emailShareholders } from "@/actions/rightsActions";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { GetImageUrl } from "@/lib/utils/get-image-url";

/* ─── shared types ─────────────────────────────────────────────────────────── */

export interface OutreachShareholder {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  address: string;
  state: string;
  holdings: number;
}

export interface StickyLabelModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offerType: "rights" | "bonus";
  companyName: string;
  shareholders: OutreachShareholder[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offerType: "rights" | "bonus";
  companyName: string;
  offerName: string;
  ratio: string;
  closeDate?: string;
  issuePrice?: string;
  allotDate?: string;
  contactEmail: string;
  shareholders: OutreachShareholder[];
  totalCount: number;
  issueId?: string;
}

/* ─── Sticky Label Preview Modal ────────────────────────────────────────────── */

function StickyLabel({
  s,
  companyName,
}: {
  s: OutreachShareholder;
  companyName: string;
}) {
  /* Break address into lines at commas or natural splits to match PDF */
  const addrLines = s.address.split(/,\s*/).filter(Boolean);
  const stateCity = s.state.toUpperCase();

  return (
    <div
      style={{
        border: "1px solid #b0b8c1",
        background: "#ffffff",
        padding: "10px 12px 8px",
        fontFamily: "Arial, Helvetica, sans-serif",
        minHeight: "135px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "inset 0 0 0 3px #f4f6f8",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* Top section: company + account */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "6px",
            marginBottom: "5px",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              color: "#111",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {companyName}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "12px",
              color: "#333",
              whiteSpace: "nowrap",
              fontFamily: "Courier New, monospace",
              flexShrink: 0,
              maxWidth: "52%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            A/C.: {s.accountNumber}
          </span>
        </div>

        {/* Thin rule under company header */}
        <div style={{ borderTop: "1px solid #d0d5db", marginBottom: "6px" }} />

        {/* Shareholder name */}
        <div
          style={{
            fontWeight: 700,
            fontSize: "13px",
            textTransform: "uppercase",
            color: "#000",
            letterSpacing: "0.01em",
            marginBottom: "4px",
          }}
        >
          {s.lastName} {s.firstName}
        </div>

        {/* Address lines */}
        <div
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            color: "#2c2c2c",
            lineHeight: 1.4,
          }}
        >
          {addrLines.map((line, i) => (
            <div key={i}>{line.trim()}</div>
          ))}
        </div>
      </div>

      {/* State / city pinned to bottom */}
      <div
        style={{
          fontSize: "13px",
          textTransform: "uppercase",
          color: "#555",
          marginTop: "6px",
          letterSpacing: "0.02em",
        }}
      >
        {stateCity}
      </div>
    </div>
  );
}

export function StickyLabelModal({
  open,
  onOpenChange,
  offerType,
  companyName,
  shareholders,
  totalCount,
  currentPage,
  onPageChange,
  loading,
}: StickyLabelModalProps) {
  const sheetsTotal = Math.ceil(totalCount / 24);

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `${companyName} - Labels`,
  });

  const handleDownloadPDF = () => {
    toast.info(
      "Opening browser print dialog. To download as a PDF, please set the 'Destination' field in the printer options to 'Save as PDF'.",
      {
        duration: 6500,
      },
    );
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        style={{ display: "flex", flexDirection: "column", maxWidth: "860px" }}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2.5 pr-8">
            <DialogTitle className="text-[15px] font-bold tracking-tight">
              Sticky Label Preview
            </DialogTitle>
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px] font-normal shrink-0">
              {totalCount.toLocaleString()} labels
            </Badge>
            <Badge
              variant="outline"
              className="text-[13px] font-normal shrink-0"
            >
              {sheetsTotal} sheet{sheetsTotal !== 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {offerType === "rights" ? "Rights Issue" : "Bonus Issue"} &mdash;{" "}
            <span className="font-semibold text-foreground">{companyName}</span>
          </p>

          {/* Print info strip */}
          <div className="mt-3 pt-3 border-t flex items-center gap-6 text-[13px] text-muted-foreground">
            <span>Format: A4 · Portrait</span>
            <span>Labels per sheet: 24 (3 × 8)</span>
            <span>Paper type: Self-adhesive label stock</span>
          </div>
        </DialogHeader>

        {/* Pagination controls for pages/sheets of labels */}
        <div className="bg-muted/30 px-6 py-2.5 border-b flex items-center justify-between shrink-0 text-sm">
          <span className="text-muted-foreground">
            Showing sheet {currentPage} of {sheetsTotal} (
            {totalCount.toLocaleString()} total labels)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Previous Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage >= sheetsTotal}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next Sheet <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Label sheet preview ── */}
        <div
          className="overflow-y-auto overflow-x-hidden flex-1"
          style={{ background: "#e8eaed" }}
        >
          <div className="py-4 px-3" ref={contentRef}>
            {/* Sheet page */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #c8cdd5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                padding: "16px 12px",
              }}
            >
              {/* Sheet header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                  paddingBottom: "10px",
                  borderBottom: "1px dashed #c0c8d0",
                }}
              >
                <span
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  {companyName} — Shareholder Mailing Labels
                </span>
                <span
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "13px",
                    color: "#9ca3af",
                  }}
                >
                  Sheet {currentPage} of {sheetsTotal}
                </span>
              </div>

              {/* 3-column label grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px 12px",
                }}
              >
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 animate-pulse h-20 rounded"
                    />
                  ))}
                {shareholders.map((s, i) => (
                  <StickyLabel key={i} s={s} companyName={companyName} />
                ))}
              </div>

              {/* Sheet footer */}
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "10px",
                  borderTop: "1px dashed #c0c8d0",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "13px",
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                Meristem Registrars &amp; Probate Services Ltd · 213 Herbert
                Macaulay Way, Yaba, Lagos ·{" "}
                {offerType === "rights" ? "Rights Issue" : "Bonus Issue"}{" "}
                Mailing
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" /> Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Email Preview Modal ───────────────────────────────────────────────────── */

function EmailBody({
  isRights,
  companyName,
  offerName,
  ratio,
  closeDate,
  issuePrice,
  allotDate,
  contactEmail,
  headerImageUrl,
  circularLinkUrl,
}: {
  isRights: boolean;
  companyName: string;
  offerName: string;
  ratio: string;
  closeDate?: string;
  issuePrice?: string;
  allotDate?: string;
  contactEmail: string;
  headerImageUrl?: string | null;
  circularLinkUrl?: string;
}) {
  const denominator = parseFloat(
    ratio.split(":")[1]?.trim() || (isRights ? "7" : "4"),
  );

  const baseFont: React.CSSProperties = {
    fontFamily: "Tahoma, Geneva, Arial, sans-serif",
    fontSize: "15px",
    color: "#3b3f44",
    lineHeight: "1.6",
    margin: 0,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "Tahoma, Geneva, Arial, sans-serif",
    fontSize: "13px",
    color: "#555",
    width: "200px",
    flexShrink: 0,
    paddingRight: "8px",
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "Tahoma, Geneva, Arial, sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    color: "#6b7280",
    fontStyle: "italic",
  };

  const placeholderRows = isRights
    ? [
        ["Registrars Account Number", "[ACCOUNT NUMBER]"],
        ["Name", "[SHAREHOLDER NAME]"],
        ["Units Held", "[UNITS HELD]"],
        ["Rights Due", "[RIGHTS DUE]"],
        ["Amount Payable", "[AMOUNT PAYABLE]"],
      ]
    : [
        ["Registrars Account Number", "[ACCOUNT NUMBER]"],
        ["Name", "[SHAREHOLDER NAME]"],
        ["Units Held", "[UNITS HELD]"],
        ["Bonus Due", "[BONUS DUE]"],
      ];

  return (
    <div style={{ background: "#f0f2f5", padding: "0" }}>
      {/* ── Header: uploaded image or fallback dark green block ── */}
      {headerImageUrl ? (
        <Image
          src={headerImageUrl}
          alt="Email header"
          style={{
            width: "100%",
            display: "block",
            maxHeight: "120px",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            background: "#004023",
            padding: "18px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "#ffffff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Meristem Registrars &amp; Probate Services Ltd
          </div>
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "13px",
              color: "#86c9a3",
              marginTop: "3px",
              letterSpacing: "0.06em",
            }}
          >
            213 Herbert Macaulay Way, Yaba, Lagos · info@meristemregistrars.com
          </div>
        </div>
      )}

      {/* ── Green offer banner ── */}
      <div
        style={{
          background: "#1a6b3c",
          padding: "14px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {companyName}
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "13px",
            color: "#86c9a3",
            marginTop: "2px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {isRights
            ? "Rights Issue — Now Open"
            : `${offerName} — Allotment Notice`}
        </div>
      </div>

      {/* ── White email body ── */}
      <div
        style={{
          background: "#ffffff",
          margin: "0 20px",
          padding: "28px 32px 24px",
        }}
      >
        {/* Salutation */}
        <p style={{ ...baseFont, marginBottom: "16px" }}>
          Dear{" "}
          <strong style={{ color: "#6b7280", fontStyle: "italic" }}>
            [SHAREHOLDER NAME]
          </strong>
          ,
        </p>

        {/* Opening paragraph */}
        <p style={{ ...baseFont, textAlign: "justify", marginBottom: "14px" }}>
          {isRights ? (
            <>
              The <strong>{companyName} Rights Issue is now open</strong> and
              will close on <strong>{closeDate ?? "—"}</strong>.
            </>
          ) : (
            <>
              We are pleased to inform you that the{" "}
              <strong>
                {companyName} {offerName} has been duly approved
              </strong>{" "}
              and bonus shares have been allotted to your account with effect
              from <strong>{allotDate ?? "—"}</strong>.
            </>
          )}
        </p>

        <p style={{ ...baseFont, marginBottom: "16px" }}>
          Kindly find below the details of your {isRights ? "Rights" : "Bonus"}{" "}
          for your use:
        </p>

        {/* ── Shareholder details card ── */}
        <div
          style={{
            border: "1px solid #dde2e8",
            borderLeft: "4px solid #004023",
            background: "#f8faf8",
            borderRadius: "3px",
            padding: "16px 20px",
            marginBottom: "22px",
          }}
        >
          {placeholderRows.map(([label, value], i) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "baseline",
                paddingTop: i === 0 ? 0 : "8px",
                marginTop: i === 0 ? 0 : "8px",
                borderTop: i === 0 ? "none" : "1px solid #e5eae5",
              }}
            >
              <span style={labelStyle}>{label}:</span>
              <span style={valueStyle}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Green CTA button ── */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <a
            href={circularLinkUrl || "#"}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              background: "#004023",
              color: "#ffffff",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              borderRadius: "4px",
              padding: "12px 36px",
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            {isRights ? "Rights Issue Circular" : "Bonus Allotment Notice"}
          </a>
        </div>

        {/* Body copy */}
        <p
          style={{
            ...baseFont,
            fontSize: "14px",
            textAlign: "justify",
            marginBottom: "12px",
          }}
        >
          {isRights ? (
            <>
              The offer is on the basis of{" "}
              <strong>
                1 new ordinary share for every {denominator} ordinary shares
              </strong>{" "}
              held at the rate of{" "}
              <strong>₦{issuePrice ?? "—"} per share</strong> as at the close of
              business on the qualification date. Kindly visit{" "}
              <span
                style={{
                  color: "#0077cc",
                  textDecoration: "underline",
                  cursor: "default",
                }}
              >
                myrightsdata.meristemregistrars.com
              </span>{" "}
              to download your personalised Rights Acceptance form.
            </>
          ) : (
            <>
              The bonus issue is on the basis of{" "}
              <strong>
                1 new ordinary share for every {denominator} ordinary shares
              </strong>{" "}
              held as at the qualification date. Your account has been credited
              with the additional shares accordingly.
            </>
          )}
        </p>

        <p
          style={{
            ...baseFont,
            fontSize: "14px",
            textAlign: "justify",
            marginBottom: "12px",
          }}
        >
          Please note that all completed{" "}
          {isRights
            ? "subscription forms and corresponding payments"
            : "documentation"}{" "}
          must be submitted through your stockbroker or the Registrar.
        </p>

        <p
          style={{
            ...baseFont,
            fontSize: "14px",
            textAlign: "justify",
            marginBottom: "22px",
          }}
        >
          <strong>
            It will be appreciated if you indicate your complete and valid CSCS
            details (i.e. your CHN and stockbroker details) as this is where
            your {isRights ? "purchased" : "allocated"} units, upon receipt of
            the requisite{" "}
            {isRights ? "SEC approval after the Offer Closure" : "approval"},
            will be credited thereto.
          </strong>
        </p>

        {/* ── Green Subscribe button — rights only ── */}
        {isRights && (
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <span
              style={{
                display: "inline-block",
                background: "#1a6b3c",
                color: "#ffffff",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "4px",
                padding: "12px 36px",
                letterSpacing: "0.02em",
              }}
            >
              Subscribe Now
            </span>
          </div>
        )}

        {/* Horizontal rule */}
        <div style={{ borderTop: "1px solid #e2e6ea", margin: "0 0 18px" }} />

        {/* Contact */}
        <p
          style={{
            ...baseFont,
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          For enquiries or prompt assistance, please call us on{" "}
          <strong style={{ color: "#3b3f44" }}>020&nbsp;1280&nbsp;9250</strong>{" "}
          or{" "}
          <strong style={{ color: "#3b3f44" }}>020&nbsp;1280&nbsp;9251</strong>,
          or email <span style={{ color: "#0077cc" }}>{contactEmail}</span>
        </p>
      </div>

      {/* ── Dark green footer ── */}
      <div
        style={{
          background: "#004023",
          margin: "0 20px",
          padding: "16px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            color: "#ffffff",
            letterSpacing: "0.03em",
          }}
        >
          Meristem Registrars &amp; Probate Services Ltd
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "13px",
            color: "#86c9a3",
            marginTop: "4px",
          }}
        >
          213 Herbert Macaulay Way, Yaba, Lagos
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "13px",
            color: "#5aab7a",
            marginTop: "5px",
          }}
        >
          Visit{" "}
          <span style={{ color: "#86c9a3", textDecoration: "underline" }}>
            www.meristemng.com
          </span>{" "}
          &nbsp;·&nbsp; Call 0700&nbsp;MERISTEM &nbsp;·&nbsp;
          info@meristemregistrars.com
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "13px",
            color: "#3a7a54",
            marginTop: "8px",
          }}
        >
          You are receiving this because you are a registered shareholder.&nbsp;
          <span
            style={{
              color: "#5aab7a",
              textDecoration: "underline",
              cursor: "default",
            }}
          >
            Unsubscribe
          </span>
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: "20px", background: "#f0f2f5" }} />
    </div>
  );
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  offerType,
  companyName,
  offerName,
  ratio,
  closeDate,
  issuePrice,
  allotDate,
  contactEmail,
  totalCount,
  issueId,
}: EmailPreviewModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null);
  const [circularLinkUrl, setCircularLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRights = offerType === "rights";

  const resetAndClose = (v: boolean) => {
    if (!v) {
      setStep(1);
      setHeaderImageUrl(null);
      setCircularLinkUrl("");
    }
    onOpenChange(v);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const urlResponse = await GetImageUrl(file, "emailHeaders");
    if (urlResponse?.type === "success") {
      setHeaderImageUrl(urlResponse.result);
      setUploading(false);
    } else {
      toast.error(
        urlResponse.result || "Failed to upload image. Please try again.",
      );
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!issueId) {
      toast.error("No issue ID available to send emails.");
      return;
    }
    try {
      const res = await emailShareholders(issueId);
      if (res.data) {
        toast.success("Emails sent to shareholders");
      }
      resetAndClose(false);
    } catch (error) {
      const errorMessge = new Error(returnErrorMessage(error as ErrorLike));
      toast.error(errorMessge?.message || "Failed to send emails");
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        className="h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        style={{ display: "flex", flexDirection: "column", maxWidth: "680px" }}
      >
        {/* ── Dialog header ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2.5 pr-8">
            <DialogTitle className="text-[15px] font-bold tracking-tight">
              {step === 1 ? "Email Setup" : "Email Preview"}
            </DialogTitle>
            <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px] font-normal shrink-0">
              {totalCount.toLocaleString()} recipients
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Step {step} of 2 &mdash;{" "}
            {step === 1
              ? "Customise header & link"
              : "Review template before sending"}{" "}
            &middot;{" "}
            <span className="font-semibold text-foreground">{companyName}</span>
          </p>

          {/* Step indicator */}
          <div className="mt-3 pt-3 border-t flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 text-[13px] font-medium ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 1 ? "bg-[#004023] text-white" : "bg-muted text-muted-foreground"}`}
              >
                1
              </span>
              Header &amp; Link
            </div>
            <div className="flex-1 h-px bg-border mx-1" />
            <div
              className={`flex items-center gap-1.5 text-[13px] font-medium ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 2 ? "bg-[#004023] text-white" : "bg-muted text-muted-foreground"}`}
              >
                2
              </span>
              Preview &amp; Send
            </div>
          </div>
        </DialogHeader>

        {/* ── Step 1: Setup ── */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header image */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Header Image{" "}
                <span className="text-[12px] normal-case font-normal">
                  (optional)
                </span>
              </label>
              <p className="text-[13px] text-muted-foreground">
                Upload a branded banner that will appear at the top of the
                email. Recommended: 600×120 px. If omitted the default green
                header is used.
              </p>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-[#004023]/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {headerImageUrl ? (
                  <div className="space-y-3">
                    <Image
                      src={headerImageUrl}
                      alt="Header preview"
                      className="max-h-24 mx-auto rounded object-cover"
                    />
                    <p className="text-[13px] text-muted-foreground">
                      Click to replace image
                    </p>
                  </div>
                ) : uploading ? (
                  <div className="space-y-3">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    <p className="text-[13px] font-medium text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-[13px] font-medium">
                      Click to upload header image
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      PNG, JPG or GIF · max 5 MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {headerImageUrl && (
                <button
                  className="text-[13px] text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => {
                    setHeaderImageUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove image
                </button>
              )}
            </div>

            {/* Circular link */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                {isRights
                  ? "Rights Issue Circular URL"
                  : "Bonus Allotment Notice URL"}{" "}
                <span className="text-[12px] normal-case font-normal">
                  (optional)
                </span>
              </label>
              <p className="text-[13px] text-muted-foreground">
                The URL shareholders click to view the full{" "}
                {isRights ? "rights issue circular" : "allotment notice"}. Leave
                blank to omit the link from the email.
              </p>
              <Input
                placeholder="https://..."
                value={circularLinkUrl}
                onChange={(e) => setCircularLinkUrl(e.target.value)}
                className="h-9 text-[13px] font-mono"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 2 && (
          <div className="overflow-y-auto flex-1">
            <div className="px-4 py-3 bg-amber-50 border-b text-[13px] text-amber-800 flex items-center gap-2">
              <span className="font-semibold">Template preview</span> —
              placeholders in <em>italics</em> will be replaced with each
              shareholder&apos;s actual data when sent.
            </div>
            <EmailBody
              isRights={isRights}
              companyName={companyName}
              offerName={offerName}
              ratio={ratio}
              closeDate={closeDate}
              issuePrice={issuePrice}
              allotDate={allotDate}
              contactEmail={contactEmail}
              headerImageUrl={headerImageUrl}
              circularLinkUrl={circularLinkUrl}
            />
          </div>
        )}

        {/* ── Footer ── */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <Button variant="ghost" onClick={() => resetAndClose(false)}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>
              Preview Email <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSend}>
                <Mail className="mr-2 h-4 w-4" />
                Send to {totalCount.toLocaleString()} Shareholders
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
