"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePlus, Loader2, Mail, Send, Users, X } from "lucide-react";
import { toast } from "sonner";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { buildRightsEmailHtml } from "@/lib/utils/rights-email-template";
import { useDispatchRightsEmails, useDispatchTestRights } from "@/hooks/useRights";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export function RightsDispatch({ declarationId }: { declarationId?: string }) {
  const [subject, setSubject] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [intro, setIntro] = useState("");
  const [uploading, setUploading] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = useDispatchRightsEmails();
  const test = useDispatchTestRights();

  const html = useMemo(() => buildRightsEmailHtml({ headerImageUrl, intro }), [headerImageUrl, intro]);

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to compose the dispatch email.
      </Card>
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await GetImageUrl(file, "rightsEmailHeaders");
      if (res?.type === "success" && typeof res.result === "string") setHeaderImageUrl(res.result);
      else toast.error(typeof res?.result === "string" ? res.result : "Failed to upload image.");
    } catch (error) {
      toast.error(returnErrorMessage(error as ErrorLike));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleTest() {
    const recipients = testInput.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    if (recipients.length === 0) { toast.error("Enter at least one test address."); return; }
    test.mutate(
      { id: declarationId!, subject: subject || undefined, html, recipients },
      {
        onSuccess: (r) => toast.success(`${r?.data?.sent ?? 0} test email(s) queued.`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function handleSendAll() {
    setConfirmOpen(false);
    send.mutate(
      { id: declarationId!, subject: subject || undefined, html },
      {
        onSuccess: (r) => toast.success(`${r?.data?.sent ?? 0} notification email(s) queued to shareholders.`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card className="mrpsl-card p-5 space-y-5">
        <div>
          <h3 className="text-base font-semibold">Dispatch &amp; Notifications</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Allotment email sent to each shareholder via the mailing API. Placeholders like{" "}
            <code className="text-[11px]">[SHAREHOLDER NAME]</code> are filled per recipient.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="mrpsl-label">Subject</label>
          <Input className="mrpsl-input" placeholder="Rights Issue Notification" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="mrpsl-label">Header Image (optional)</label>
          {headerImageUrl ? (
            <div className="relative rounded-lg border border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={headerImageUrl} alt="Email header" className="w-full max-h-40 object-contain bg-muted/30" />
              <button type="button" onClick={() => setHeaderImageUrl("")} className="absolute top-2 right-2 rounded-full bg-background/90 p-1 shadow hover:bg-background">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin opacity-60" /> : <ImagePlus className="h-6 w-6 opacity-40" />}
              <span>{uploading ? "Uploading…" : "Click to upload a banner image (max 2 MB)"}</span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="mrpsl-label">Opening Message (optional)</label>
          <Textarea className="mrpsl-input min-h-24" placeholder="Leave blank to use the default allotment message." value={intro} onChange={(e) => setIntro(e.target.value)} />
        </div>

        <div className="rounded-lg border border-border p-3 space-y-2">
          <label className="mrpsl-label flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Send a test first</label>
          <div className="flex items-center gap-2">
            <Input className="mrpsl-input flex-1" placeholder="you@example.com, colleague@example.com" value={testInput} onChange={(e) => setTestInput(e.target.value)} />
            <Button variant="outline" className="gap-2 shrink-0" disabled={test.isPending} onClick={handleTest}>
              {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Test emails go only to the addresses you type — never the shareholders.</p>
        </div>

        <Button className="w-full gap-2" size="lg" disabled={send.isPending} onClick={() => setConfirmOpen(true)}>
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Send to All Shareholders
        </Button>
      </Card>

      <Card className="mrpsl-card p-5 space-y-3">
        <h3 className="text-base font-semibold">Preview</h3>
        <div className="rounded-lg border border-border bg-white p-4 max-h-[540px] overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <p className="text-[11px] text-muted-foreground">Placeholders are replaced with each shareholder&apos;s values when sent.</p>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send to all shareholders?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This queues the notification email to every entitlement with an address on this rights issue. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="gap-2" onClick={handleSendAll}><Send className="h-4 w-4" /> Send Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
