"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useSendMandateNotification } from "@/hooks/useMandatePaymentFlow";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import { formatDate } from "./helpers";

function defaultSubject(batch: MandateBatch) {
  return `Your Dividend Payment Advice — Mandate Batch ${batch.batchRef}`;
}

function EmailPreview({ batch, note }: { batch: MandateBatch; note: string }) {
  const baseFont: React.CSSProperties = {
    fontFamily: "Tahoma, Geneva, Arial, sans-serif",
    fontSize: "15px",
    color: "#3b3f44",
    lineHeight: 1.6,
    margin: 0,
  };
  return (
    <div style={{ background: "#f0f2f5", padding: 0 }}>
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
            marginTop: 3,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Dividend Payment Advice
        </div>
      </div>

      <div style={{ background: "#ffffff", margin: "0 20px", padding: "28px 32px 24px" }}>
        <p style={{ ...baseFont, marginBottom: 16 }}>
          Dear{" "}
          <strong style={{ color: "#6b7280", fontStyle: "italic" }}>
            [SHAREHOLDER NAME]
          </strong>
          ,
        </p>
        <p style={{ ...baseFont, textAlign: "justify", marginBottom: 14 }}>
          Following the update of your bank mandate, we are pleased to inform you
          that your outstanding dividend has been processed and paid electronically
          to your newly mandated account, effective{" "}
          <strong>{formatDate(batch.paymentInitiatedAt)}</strong>.
        </p>

        {note && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderLeft: "4px solid #f97316",
              borderRadius: 3,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: "#9a3412",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 5,
              }}
            >
              Note from Registrars
            </div>
            <div style={{ fontSize: 14, color: "#7c2d12", fontWeight: 600 }}>{note}</div>
          </div>
        )}

        <div
          style={{
            border: "1px solid #dde2e8",
            borderLeft: "4px solid #004023",
            background: "#f8faf8",
            borderRadius: 3,
            padding: "16px 20px",
            marginBottom: 22,
          }}
        >
          {[
            ["Registrars Account Number", "[ACCOUNT NUMBER]"],
            ["Name", "[SHAREHOLDER NAME]"],
            ["Dividend Number", "[DIVIDEND NUMBER]"],
            ["Net Amount Paid (₦)", "[NET AMOUNT]"],
            ["Bank Account Credited", "[BANK NAME / ACCOUNT NO]"],
          ].map(([label, value], i) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "baseline",
                paddingTop: i === 0 ? 0 : 8,
                marginTop: i === 0 ? 0 : 8,
                borderTop: i === 0 ? "none" : "1px solid #e5eae5",
              }}
            >
              <span style={{ fontSize: 13, color: "#555", width: 200, flexShrink: 0 }}>
                {label}:
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#6b7280",
                  fontStyle: "italic",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <p style={{ ...baseFont, fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          For enquiries, email{" "}
          <span style={{ color: "#0077cc" }}>dividends@meristemregistrars.com</span>
        </p>
      </div>

      <div style={{ height: 20, background: "#f0f2f5" }} />
    </div>
  );
}

export function MandateEmailDialog({
  batch,
  open,
  onOpenChange,
}: {
  batch: MandateBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUser } = useStore();
  const sendMutation = useSendMandateNotification();
  const [step, setStep] = useState<1 | 2>(1);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset the composer when the dialog opens for a (possibly different) batch.
  const openKey = open ? (batch?.id ?? "__none__") : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (open && batch && openKey !== loadedKey) {
    setLoadedKey(openKey);
    setStep(1);
    setSubject(defaultSubject(batch));
    setNote("");
    setMode("all");
    setSelectedIds(new Set());
  }

  if (!batch) return null;

  const recipientCount =
    mode === "all" ? batch.shareholders.length : selectedIds.size;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSend() {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (mode === "selected" && selectedIds.size === 0) {
      toast.error("Select at least one shareholder to email.");
      return;
    }
    sendMutation.mutate(
      {
        batchId: batch!.id,
        subject,
        sentBy: currentUser.email,
        recipientIds: mode === "selected" ? Array.from(selectedIds) : undefined,
      },
      {
        onSuccess: (entry) => {
          const undelivered = entry.undelivered?.length ?? 0;
          toast.success(
            `Email sent to ${entry.recipients.length} shareholder(s)${
              undelivered ? ` — ${undelivered} not delivered.` : "."
            }`,
          );
          onOpenChange(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to send email."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {recipientCount.toLocaleString()} recipients
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Step {step} of 2 · Mandate Batch{" "}
            <span className="font-semibold text-foreground">{batch.batchRef}</span>
          </p>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recipients
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("all")}
                  className={`px-3 py-1.5 text-[13px] rounded-lg border transition-colors ${
                    mode === "all"
                      ? "border-primary/50 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  All shareholders ({batch.shareholders.length})
                </button>
                <button
                  onClick={() => setMode("selected")}
                  className={`px-3 py-1.5 text-[13px] rounded-lg border transition-colors ${
                    mode === "selected"
                      ? "border-primary/50 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  Select shareholders
                </button>
              </div>

              {mode === "selected" && (
                <div className="border border-border/60 rounded-lg max-h-56 overflow-y-auto divide-y">
                  {batch.shareholders.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                      />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">· {s.email}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Note to Shareholders{" "}
                <span className="text-[12px] normal-case font-normal">(optional)</span>
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional context…"
                className="h-9 text-[13px]"
              />
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="px-4 py-3 bg-amber-50 border-b text-[13px] text-amber-800">
              <span className="font-semibold">Template preview</span> —
              placeholders in <em>italics</em> are replaced with each
              shareholder&apos;s data when sent.
            </div>
            <EmailPreview batch={batch} note={note} />
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
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
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="gap-2"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Send to{" "}
                    {recipientCount.toLocaleString()} Shareholders
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
