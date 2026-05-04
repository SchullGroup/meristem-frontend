"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
        minHeight: "110px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "inset 0 0 0 3px #f4f6f8",
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
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "9.5px",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              color: "#111",
            }}
          >
            {companyName}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "9px",
              color: "#333",
              whiteSpace: "nowrap",
              fontFamily: "Courier New, monospace",
              flexShrink: 0,
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
            fontSize: "10.5px",
            textTransform: "uppercase",
            color: "#000",
            letterSpacing: "0.01em",
            marginBottom: "4px",
          }}
        >
          {s.lastName} {s.firstName}
        </div>

        {/* Address lines */}
        <div style={{ fontSize: "9.5px", textTransform: "uppercase", color: "#2c2c2c", lineHeight: 1.4 }}>
          {addrLines.map((line, i) => (
            <div key={i}>{line.trim()}</div>
          ))}
        </div>
      </div>

      {/* State / city pinned to bottom */}
      <div
        style={{
          fontSize: "9.5px",
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
}: StickyLabelModalProps) {
  const preview = shareholders.slice(0, 6);
  const sheetsTotal = Math.ceil(totalCount / 24);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] flex flex-col gap-0 p-0"
        style={{ maxWidth: "860px" }}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-[15px] font-bold tracking-tight">
                Sticky Label Preview
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {offerType === "rights" ? "Rights Issue" : "Bonus Issue"} &mdash;{" "}
                <span className="font-semibold text-foreground">{companyName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
                {totalCount.toLocaleString()} labels
              </Badge>
              <Badge variant="outline" className="text-xs">
                {sheetsTotal} sheet{sheetsTotal !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* Print info strip */}
          <div className="mt-3 pt-3 border-t flex items-center gap-6 text-xs text-muted-foreground">
            <span>Format: A4 · Portrait</span>
            <span>Labels per sheet: 24 (3 × 8)</span>
            <span>Paper type: Self-adhesive label stock</span>
          </div>
        </DialogHeader>

        {/* ── Label sheet preview ── */}
        <div
          className="overflow-y-auto flex-1"
          style={{ background: "#e8eaed" }}
        >
          <div className="py-6 px-8">
            {/* Sheet page */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #c8cdd5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                padding: "20px 16px",
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
                    fontSize: "10px",
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
                    fontSize: "10px",
                    color: "#9ca3af",
                  }}
                >
                  Page 1 of {sheetsTotal} (preview — 6 of {totalCount.toLocaleString()})
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
                {preview.map((s) => (
                  <StickyLabel key={s.id} s={s} companyName={companyName} />
                ))}
              </div>

              {/* Sheet footer */}
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "10px",
                  borderTop: "1px dashed #c0c8d0",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "9px",
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                Meristem Registrars &amp; Probate Services Ltd · 213 Herbert Macaulay Way, Yaba, Lagos ·{" "}
                {offerType === "rights" ? "Rights Issue" : "Bonus Issue"} Mailing
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              toast.success("Downloading sticky labels as PDF…");
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              toast.success(
                `Print job sent — ${sheetsTotal} page${sheetsTotal !== 1 ? "s" : ""}, ${totalCount.toLocaleString()} labels.`
              );
            }}
          >
            <Printer className="mr-2 h-4 w-4" /> Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Email Preview Modal ───────────────────────────────────────────────────── */

function EmailBody({
  s,
  isRights,
  companyName,
  offerName,
  ratio,
  closeDate,
  issuePrice,
  allotDate,
  contactEmail,
}: {
  s: OutreachShareholder;
  isRights: boolean;
  companyName: string;
  offerName: string;
  ratio: string;
  closeDate?: string;
  issuePrice?: string;
  allotDate?: string;
  contactEmail: string;
}) {
  const denominator = parseFloat(ratio.split(":")[1]?.trim() || (isRights ? "7" : "4"));
  const sharesDue   = Math.floor(s.holdings / denominator);
  const amountDue   = issuePrice
    ? `₦${(sharesDue * parseFloat(issuePrice)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
    : "—";

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
    color: "#111",
  };

  return (
    <div
      style={{
        background: "#f0f2f5",
        padding: "0",
      }}
    >
      {/* ── Dark green Meristem header ── */}
      <div style={{ background: "#004023", padding: "18px 32px", textAlign: "center" }}>
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
            fontSize: "11px",
            color: "#86c9a3",
            marginTop: "3px",
            letterSpacing: "0.06em",
          }}
        >
          213 Herbert Macaulay Way, Yaba, Lagos · info@meristemregistrars.com
        </div>
      </div>

      {/* ── Red offer banner ── */}
      <div style={{ background: "#d91935", padding: "14px 32px", textAlign: "center" }}>
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
            fontSize: "11px",
            color: "#ffccd4",
            marginTop: "2px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {isRights ? "Rights Issue — Now Open" : `${offerName} — Allotment Notice`}
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
          Dear <strong>{s.firstName} {s.lastName}</strong>,
        </p>

        {/* Opening paragraph */}
        <p style={{ ...baseFont, textAlign: "justify", marginBottom: "14px" }}>
          {isRights ? (
            <>
              The{" "}
              <strong>
                {companyName} Rights Issue is now open
              </strong>{" "}
              and will close on{" "}
              <strong>{closeDate ?? "—"}</strong>.
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
          Kindly find below the details of your{" "}
          {isRights ? "Rights" : "Bonus"} for your use:
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
          {[
            ["Registrars Account Number", s.accountNumber],
            ["Name", `${s.firstName} ${s.lastName}`],
            ["Units Held", s.holdings.toLocaleString()],
            ...(isRights
              ? [
                  ["Rights Due", sharesDue.toLocaleString()],
                  ["Amount Payable", amountDue],
                ]
              : [["Bonus Due", sharesDue.toLocaleString()]]),
          ].map(([label, value], i) => (
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

        {/* ── Red CTA button ── */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#d91935",
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
          </span>
        </div>

        {/* Body copy */}
        <p style={{ ...baseFont, fontSize: "14px", textAlign: "justify", marginBottom: "12px" }}>
          {isRights ? (
            <>
              The offer is on the basis of{" "}
              <strong>1 new ordinary share for every {denominator} ordinary shares</strong>{" "}
              held at the rate of <strong>₦{issuePrice ?? "—"} per share</strong> as at the close of
              business on the qualification date. Kindly visit{" "}
              <span
                style={{ color: "#0077cc", textDecoration: "underline", cursor: "default" }}
              >
                myrightsdata.meristemregistrars.com
              </span>{" "}
              to download your personalised Rights Acceptance form.
            </>
          ) : (
            <>
              The bonus issue is on the basis of{" "}
              <strong>1 new ordinary share for every {denominator} ordinary shares</strong>{" "}
              held as at the qualification date. Your account has been credited with the
              additional shares accordingly.
            </>
          )}
        </p>

        <p style={{ ...baseFont, fontSize: "14px", textAlign: "justify", marginBottom: "12px" }}>
          Please note that all completed{" "}
          {isRights
            ? "subscription forms and corresponding payments"
            : "documentation"}{" "}
          must be submitted through your stockbroker or the Registrar.
        </p>

        <p style={{ ...baseFont, fontSize: "14px", textAlign: "justify", marginBottom: "22px" }}>
          <strong>
            It will be appreciated if you indicate your complete and valid CSCS details
            (i.e. your CHN and stockbroker details) as this is where your{" "}
            {isRights ? "purchased" : "allocated"} units, upon receipt of the requisite{" "}
            {isRights ? "SEC approval after the Offer Closure" : "approval"}, will be
            credited thereto.
          </strong>
        </p>

        {/* ── Purple Subscribe button — rights only ── */}
        {isRights && (
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <span
              style={{
                display: "inline-block",
                background: "#260d71",
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
        <p style={{ ...baseFont, fontSize: "13px", color: "#6b7280", textAlign: "center" }}>
          For enquiries or prompt assistance, please call us on{" "}
          <strong style={{ color: "#3b3f44" }}>020&nbsp;1280&nbsp;9250</strong> or{" "}
          <strong style={{ color: "#3b3f44" }}>020&nbsp;1280&nbsp;9251</strong>, or email{" "}
          <span style={{ color: "#0077cc" }}>{contactEmail}</span>
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
            fontSize: "12px",
            color: "#ffffff",
            letterSpacing: "0.03em",
          }}
        >
          Meristem Registrars &amp; Probate Services Ltd
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            color: "#86c9a3",
            marginTop: "4px",
          }}
        >
          213 Herbert Macaulay Way, Yaba, Lagos
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "10.5px",
            color: "#5aab7a",
            marginTop: "5px",
          }}
        >
          Visit{" "}
          <span style={{ color: "#86c9a3", textDecoration: "underline" }}>
            www.meristemng.com
          </span>{" "}
          &nbsp;·&nbsp; Call 0700&nbsp;MERISTEM &nbsp;·&nbsp; info@meristemregistrars.com
        </div>
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "10px",
            color: "#3a7a54",
            marginTop: "8px",
          }}
        >
          You are receiving this because you are a registered shareholder.&nbsp;
          <span style={{ color: "#5aab7a", textDecoration: "underline", cursor: "default" }}>
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
  shareholders,
  totalCount,
}: EmailPreviewModalProps) {
  const [idx, setIdx] = useState(0);
  const s = shareholders[Math.min(idx, shareholders.length - 1)];
  const isRights = offerType === "rights";

  if (!s) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) setIdx(0); onOpenChange(v); }}>
      <DialogContent
        className="max-h-[92vh] flex flex-col gap-0 p-0"
        style={{ maxWidth: "680px" }}
      >
        {/* ── Dialog header ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-[15px] font-bold tracking-tight">
                Email Preview
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRights ? "Rights Issue Notification" : "Bonus Allotment Notification"}{" "}
                &mdash;{" "}
                <span className="font-semibold text-foreground">{companyName}</span>
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-0 text-xs shrink-0">
              {totalCount.toLocaleString()} recipients
            </Badge>
          </div>

          {/* Shareholder navigator */}
          {shareholders.length > 1 && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium">
                  {s.firstName} {s.lastName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  A/C {s.accountNumber} · {s.holdings.toLocaleString()} units
                </span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-muted-foreground mr-1">
                  {idx + 1} / {shareholders.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={idx === 0}
                  onClick={() => setIdx(i => i - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={idx === shareholders.length - 1}
                  onClick={() => setIdx(i => i + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* ── Scrollable email preview ── */}
        <div className="overflow-y-auto flex-1">
          <EmailBody
            s={s}
            isRights={isRights}
            companyName={companyName}
            offerName={offerName}
            ratio={ratio}
            closeDate={closeDate}
            issuePrice={issuePrice}
            allotDate={allotDate}
            contactEmail={contactEmail}
          />
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              toast.success(
                `Email dispatch queued for ${totalCount.toLocaleString()} shareholders.`
              );
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send to {totalCount.toLocaleString()} Shareholders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
