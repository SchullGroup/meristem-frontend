"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImagePlus, Loader2, Mail, Send, Users, X, AlertTriangle } from "lucide-react";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { buildIpoEmailHtml } from "@/lib/utils/ipo-email-template";
import {
  useIpoEmailPreview,
  useSendIpoEmails,
  useSendIpoTestEmail,
} from "@/hooks/useIPO";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export default function IpoEmailComposer({
  batchRef,
  sentBy,
}: {
  batchRef: string;
  sentBy: string;
}) {
  const { data: preview, isLoading } = useIpoEmailPreview(batchRef);

  const [subject, setSubject] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [intro, setIntro] = useState("");
  const [uploading, setUploading] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMutation = useSendIpoEmails();
  const testMutation = useSendIpoTestEmail();

  const effectiveSubject = subject || preview?.suggestedSubject || "";
  const html = useMemo(
    () => buildIpoEmailHtml({ headerImageUrl, intro }),
    [headerImageUrl, intro],
  );

  const recipientCount = preview?.recipientCount ?? 0;
  const withoutEmail = preview?.recipientsWithoutEmail ?? 0;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await GetImageUrl(file, "ipoEmailHeaders");
      if (res?.type === "success" && typeof res.result === "string") {
        setHeaderImageUrl(res.result);
      } else {
        toast.error(
          typeof res?.result === "string" ? res.result : "Failed to upload image.",
        );
      }
    } catch (error) {
      toast.error(returnErrorMessage(error as ErrorLike));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function parseRecipients(raw: string): string[] {
    return raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleTestSend() {
    const recipients = parseRecipients(testInput);
    if (recipients.length === 0) {
      toast.error("Enter at least one test email address.");
      return;
    }
    testMutation.mutate(
      { batchRef, subject: subject || undefined, html, recipients, sentBy },
      {
        onSuccess: (res) =>
          toast.success(`${res?.queued ?? 0} test email(s) queued to your test address(es).`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  function handleSendAll() {
    setConfirmOpen(false);
    sendMutation.mutate(
      { batchRef, subject: subject || undefined, html, sentBy },
      {
        onSuccess: (res) =>
          toast.success(
            `${res?.queued ?? 0} notification email(s) queued${res?.skipped ? `, ${res.skipped} skipped (no email)` : ""}.`,
          ),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* ── Left: compose ─────────────────────────────────────────── */}
      <Card className="mrpsl-card p-5 space-y-5">
        <div>
          <h3 className="text-base font-semibold">Compose Notification</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Certificate-lodgement email sent to each approved shareholder. Placeholders like{" "}
            <code className="text-[11px]">[SHAREHOLDER NAME]</code> are filled in per recipient.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="mrpsl-label">Subject</label>
          <Input
            className="mrpsl-input"
            placeholder={preview?.suggestedSubject || "Subject"}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="mrpsl-label">Header Image (optional)</label>
          {headerImageUrl ? (
            <div className="relative rounded-lg border border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={headerImageUrl} alt="Email header" className="w-full max-h-40 object-contain bg-muted/30" />
              <button
                type="button"
                onClick={() => setHeaderImageUrl("")}
                className="absolute top-2 right-2 rounded-full bg-background/90 p-1 shadow hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin opacity-60" />
              ) : (
                <ImagePlus className="h-6 w-6 opacity-40" />
              )}
              <span>{uploading ? "Uploading…" : "Click to upload a banner image (max 2 MB)"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="mrpsl-label">Opening Message (optional)</label>
          <Textarea
            className="mrpsl-input min-h-24"
            placeholder="Leave blank to use the default lodgement message."
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border p-3 space-y-2">
          <label className="mrpsl-label flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Send a test to yourself first
          </label>
          <div className="flex items-center gap-2">
            <Input
              className="mrpsl-input flex-1"
              placeholder="you@example.com, colleague@example.com"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              disabled={testMutation.isPending}
              onClick={handleTestSend}
            >
              {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Test
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Test emails go only to the addresses you type here — never to the shareholders.
          </p>
        </div>

        {withoutEmail > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {withoutEmail} approved subscriber(s) have no email address and will be skipped.
          </div>
        )}

        <Button
          className="w-full gap-2"
          size="lg"
          disabled={isLoading || recipientCount === 0 || sendMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Send to {recipientCount} Approved Shareholder{recipientCount === 1 ? "" : "s"}
        </Button>
      </Card>

      {/* ── Right: live preview ───────────────────────────────────── */}
      <Card className="mrpsl-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Preview</h3>
          <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">
            {effectiveSubject}
          </span>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 max-h-[540px] overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Placeholders shown here are replaced with each shareholder&apos;s real values when sent.
        </p>
      </Card>

      {/* ── Confirm send-to-all ───────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to all approved shareholders?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This queues the notification email to <strong>{recipientCount}</strong> approved
            shareholder{recipientCount === 1 ? "" : "s"} on batch{" "}
            <span className="font-mono">{batchRef}</span>. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAll} className="gap-2">
              <Send className="h-4 w-4" /> Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
