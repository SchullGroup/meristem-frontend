"use client";

import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { useSendNotification } from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatDate } from "./helpers";

function defaultSubject(record: DividendFlowRecord) {
  return `Your ${record.registerName} Dividend Payment Advice — ${record.paymentNumber}`;
}

function DividendEmailBody({
  record,
  headerImageUrl,
  reportLinkUrl,
  note,
}: {
  record: DividendFlowRecord;
  headerImageUrl: string | null;
  reportLinkUrl: string;
  note: string;
}) {
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

  const detailRows: [string, string][] = [
    ["Registrars Account Number", "[ACCOUNT NUMBER]"],
    ["Name", "[SHAREHOLDER NAME]"],
    ["Units Held", "[UNITS HELD]"],
    ["Gross Dividend (₦)", "[GROSS DIVIDEND]"],
    ["WHT Deducted (₦)", "[WHT AMOUNT]"],
    ["Net Amount Paid (₦)", "[NET AMOUNT]"],
    ["Bank Account Credited", "[BANK NAME / ACCOUNT NO]"],
  ];

  return (
    <div style={{ background: "#f0f2f5", padding: "0" }}>
      {headerImageUrl ? (
        <img
          src={headerImageUrl}
          alt="Email header"
          style={{ width: "100%", display: "block", maxHeight: "120px", objectFit: "cover" }}
        />
      ) : (
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

      <div style={{ background: "#1a6b3c", padding: "14px 32px", textAlign: "center" }}>
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
          {record.registerName}
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
          Dividend Payment Advice
        </div>
      </div>

      <div style={{ background: "#ffffff", margin: "0 20px", padding: "28px 32px 24px" }}>
        <p style={{ ...baseFont, marginBottom: "16px" }}>
          Dear{" "}
          <strong style={{ color: "#6b7280", fontStyle: "italic" }}>
            [SHAREHOLDER NAME]
          </strong>
          ,
        </p>

        <p style={{ ...baseFont, textAlign: "justify", marginBottom: "14px" }}>
          We are pleased to inform you that your dividend on{" "}
          <strong>{record.registerName}</strong> ({record.registerSymbol}) has been
          processed and paid electronically via <strong>{record.gateway}</strong>,
          effective <strong>{formatDate(record.paymentDate)}</strong>.
        </p>

        <p style={{ ...baseFont, marginBottom: "16px" }}>
          Kindly find below the details of your dividend payment for your use:
        </p>

        {note && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderLeft: "4px solid #f97316",
              borderRadius: "3px",
              padding: "14px 18px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#9a3412",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "5px",
              }}
            >
              Note from Registrars
            </div>
            <div
              style={{
                fontFamily: "Tahoma, Geneva, Arial, sans-serif",
                fontSize: "14px",
                color: "#7c2d12",
                fontWeight: 600,
              }}
            >
              {note}
            </div>
          </div>
        )}

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
          {detailRows.map(([label, value], i) => (
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

        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <a
            href={reportLinkUrl || "#"}
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
            View Payment Advice
          </a>
        </div>

        <p style={{ ...baseFont, fontSize: "14px", textAlign: "justify", marginBottom: "22px" }}>
          The dividend was declared at a rate of <strong>₦{record.rate.toFixed(4)}</strong> per
          share held as at the qualification date, and the net amount (after applicable
          withholding tax) has been credited to the bank account registered with us.
        </p>

        <div style={{ borderTop: "1px solid #e2e6ea", margin: "0 0 18px" }} />

        <p style={{ ...baseFont, fontSize: "13px", color: "#6b7280", textAlign: "center" }}>
          For enquiries, please call us on{" "}
          <strong style={{ color: "#3b3f44" }}>020&nbsp;1280&nbsp;9250</strong> or email{" "}
          <span style={{ color: "#0077cc" }}>dividends@meristemregistrars.com</span>
        </p>
      </div>

      <div style={{ background: "#004023", margin: "0 20px", padding: "16px 32px", textAlign: "center" }}>
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
      </div>

      <div style={{ height: "20px", background: "#f0f2f5" }} />
    </div>
  );
}

export function EmailTemplateDialog({
  record,
  open,
  onOpenChange,
}: {
  record: DividendFlowRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUser } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [subject, setSubject] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null);
  const [reportLinkUrl, setReportLinkUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMutation = useSendNotification();

  // Reset the composer whenever the dialog opens for a (possibly different)
  // record — adjusted during render rather than in an effect.
  const openKey = open ? (record?.id ?? "__none__") : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (open && record && openKey !== loadedKey) {
    setLoadedKey(openKey);
    setStep(1);
    setSubject(defaultSubject(record));
    setHeaderImageUrl(null);
    setReportLinkUrl("");
    setNote("");
  }

  if (!record) return null;

  function resetAndClose(v: boolean) {
    if (!v) {
      setStep(1);
      setHeaderImageUrl(null);
      setReportLinkUrl("");
      setNote("");
    }
    onOpenChange(v);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const urlResponse = await GetImageUrl(file, "dividendEmailHeaders");
      if (urlResponse?.type === "success") {
        setHeaderImageUrl(urlResponse.result);
      } else {
        toast.error(urlResponse.result || "Failed to upload image. Please try again.");
      }
    } catch (error) {
      const errorMessage = new Error(returnErrorMessage(error as ErrorLike));
      toast.error(errorMessage?.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSend() {
    if (!record) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    sendMutation.mutate(
      {
        declarationId: record.id,
        subject,
        sentBy: currentUser.email,
      },
      {
        onSuccess: () => {
          toast.success(`Email sent to ${record.prelist.length} shareholders.`);
          resetAndClose(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to send email."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        className="h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        style={{ display: "flex", flexDirection: "column", maxWidth: "680px" }}
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2.5 pr-8">
            <DialogTitle className="text-[15px] font-bold tracking-tight">
              {step === 1 ? "Email Setup" : "Email Preview"}
            </DialogTitle>
            <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px] font-normal shrink-0">
              {record.prelist.length.toLocaleString()} recipients
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Step {step} of 2 &mdash; {step === 1 ? "Customise subject, header & note" : "Review template before sending"}{" "}
            &middot; <span className="font-semibold text-foreground">{record.paymentNumber}</span>
          </p>

          <div className="mt-3 pt-3 border-t flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 text-[13px] font-medium ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 1 ? "bg-[#004023] text-white" : "bg-muted text-muted-foreground"}`}
              >
                1
              </span>
              Setup
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

        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 text-[13px]" />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Header Image <span className="text-[12px] normal-case font-normal">(optional)</span>
              </label>
              <p className="text-[13px] text-muted-foreground">
                Upload a branded banner for the top of the email. Recommended: 600×120 px. If
                omitted the default green header is used.
              </p>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-[#004023]/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {headerImageUrl ? (
                  <div className="space-y-3">
                    <img
                      src={headerImageUrl}
                      alt="Header preview"
                      className="max-h-24 mx-auto rounded object-cover"
                    />
                    <p className="text-[13px] text-muted-foreground">Click to replace image</p>
                  </div>
                ) : uploading ? (
                  <div className="space-y-3">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-[13px] font-medium text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-[13px] font-medium">Click to upload header image</p>
                    <p className="text-[12px] text-muted-foreground">PNG, JPG or GIF · max 5 MB</p>
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

            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Payment Advice Link <span className="text-[12px] normal-case font-normal">(optional)</span>
              </label>
              <p className="text-[13px] text-muted-foreground">
                The URL shareholders click to view their full payment advice.
              </p>
              <Input
                placeholder="https://..."
                value={reportLinkUrl}
                onChange={(e) => setReportLinkUrl(e.target.value)}
                className="h-9 text-[13px] font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Note to Shareholders <span className="text-[12px] normal-case font-normal">(optional)</span>
              </label>
              <Textarea
                placeholder="Add any additional context for shareholders..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none text-[13px]"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="overflow-y-auto flex-1">
            <div className="px-4 py-3 bg-amber-50 border-b text-[13px] text-amber-800">
              <span className="font-semibold">Template preview</span> — placeholders in{" "}
              <em>italics</em> will be replaced with each shareholder&apos;s actual data when
              sent.
            </div>
            <DividendEmailBody
              record={record}
              headerImageUrl={headerImageUrl}
              reportLinkUrl={reportLinkUrl}
              note={note}
            />
          </div>
        )}

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
              <Button onClick={handleSend} disabled={sendMutation.isPending} className="flex items-center gap-2">
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Send to {record.prelist.length.toLocaleString()} Shareholders
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
