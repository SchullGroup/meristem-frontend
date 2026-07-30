"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Mail, RefreshCw, Send, Users, X } from "lucide-react";
import { toast } from "sonner";
import { GetImageUrl } from "@/lib/utils/get-image-url";
import { buildBonusEmailHtml } from "@/lib/utils/bonus-email-template";
import { useStore } from "@/lib/store";
import {
  useBonusEmailPreview,
  useSendBonusEmails,
  useSendBonusTestEmail,
  useBonusEmailLogs,
  useBonusEmailSummary,
} from "@/hooks/useBonus";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import type { BonusEmailLog } from "@/actions/bonusIssuesAction";

const POLL = 5000;
type Filter = "ALL" | "QUEUED" | "SENT" | "FAILED";

export function BonusDispatch({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const [tab, setTab] = useState<"compose" | "delivery">("compose");
  const [subject, setSubject] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [intro, setIntro] = useState("");
  const [uploading, setUploading] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: preview } = useBonusEmailPreview(declarationId);
  const send = useSendBonusEmails();
  const test = useSendBonusTestEmail();
  const { data: summary, refetch: refetchSummary } = useBonusEmailSummary(declarationId, POLL);
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useBonusEmailLogs(
    declarationId,
    { status: filter === "ALL" ? undefined : filter },
    POLL,
  );

  const html = useMemo(() => buildBonusEmailHtml({ headerImageUrl, intro }), [headerImageUrl, intro]);

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a bonus issue above to compose the dispatch email.
      </Card>
    );
  }

  const recipientCount = preview?.recipientCount ?? 0;
  const withoutEmail = preview?.recipientsWithoutEmail ?? 0;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await GetImageUrl(file, "bonusEmailHeaders");
      if (res?.type === "success" && typeof res.result === "string") setHeaderImageUrl(res.result);
      else toast.error(typeof res?.result === "string" ? res.result : "Failed to upload image.");
    } catch (error) {
      toast.error(returnErrorMessage(error as ErrorLike));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleTest() {
    const recipients = testInput.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    if (recipients.length === 0) { toast.error("Enter at least one test address."); return; }
    test.mutate(
      { declarationId: declarationId!, subject: subject || undefined, html, recipients, sentBy: currentUser?.email },
      {
        onSuccess: (r) => toast.success(`${r?.queued ?? 0} test email(s) queued.`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function handleSendAll() {
    setConfirmOpen(false);
    send.mutate(
      { declarationId: declarationId!, subject: subject || undefined, html, sentBy: currentUser?.email },
      {
        onSuccess: (r) => { toast.success(`${r?.queued ?? 0} email(s) queued${r?.skipped ? `, ${r.skipped} skipped` : ""}.`); setTab("delivery"); },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  const rows: BonusEmailLog[] = logs ?? [];
  const cards = [
    { label: "Total", value: summary?.total ?? 0, color: "text-foreground" },
    { label: "In Queue", value: summary?.queued ?? 0, color: "text-amber-600" },
    { label: "Sent", value: summary?.sent ?? 0, color: "text-green-700" },
    { label: "Failed / Not Sent", value: summary?.failed ?? 0, color: "text-red-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "compose" ? "default" : "outline"} size="sm" onClick={() => setTab("compose")}>Compose &amp; Send</Button>
        <Button variant={tab === "delivery" ? "default" : "outline"} size="sm" onClick={() => setTab("delivery")}>Delivery Report</Button>
      </div>

      {tab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="mrpsl-card p-5 space-y-5">
            <div>
              <h3 className="text-base font-semibold">Dispatch &amp; Notifications</h3>
              <p className="text-[13px] text-muted-foreground mt-1">Bonus allotment email to each shareholder via the mailing API. <code className="text-[11px]">[SHAREHOLDER NAME]</code> etc. are filled per recipient.</p>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Subject</label>
              <Input className="mrpsl-input" placeholder={preview?.suggestedSubject || "Bonus Issue Notification"} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Header Image (optional)</label>
              {headerImageUrl ? (
                <div className="relative rounded-lg border border-border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={headerImageUrl} alt="Header" className="w-full max-h-40 object-contain bg-muted/30" />
                  <button type="button" onClick={() => setHeaderImageUrl("")} className="absolute top-2 right-2 rounded-full bg-background/90 p-1 shadow"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin opacity-60" /> : <ImagePlus className="h-6 w-6 opacity-40" />}
                  <span>{uploading ? "Uploading…" : "Click to upload a banner (max 2 MB)"}</span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Opening Message (optional)</label>
              <Textarea className="mrpsl-input min-h-24" placeholder="Leave blank for the default bonus message." value={intro} onChange={(e) => setIntro(e.target.value)} />
            </div>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <label className="mrpsl-label flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Send a test first</label>
              <div className="flex items-center gap-2">
                <Input className="mrpsl-input flex-1" placeholder="you@example.com" value={testInput} onChange={(e) => setTestInput(e.target.value)} />
                <Button variant="outline" className="gap-2 shrink-0" disabled={test.isPending} onClick={handleTest}>
                  {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Test emails go only to typed addresses — never the shareholders.</p>
            </div>
            {withoutEmail > 0 && (
              <p className="text-[12px] text-amber-700">{withoutEmail} shareholder(s) have no email and will be skipped.</p>
            )}
            <Button className="w-full gap-2" size="lg" disabled={recipientCount === 0 || send.isPending} onClick={() => setConfirmOpen(true)}>
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Send to {recipientCount} Shareholder{recipientCount === 1 ? "" : "s"}
            </Button>
          </Card>

          <Card className="mrpsl-card p-5 space-y-3">
            <h3 className="text-base font-semibold">Preview</h3>
            <div className="rounded-lg border border-border bg-white p-4 max-h-[540px] overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
            <p className="text-[11px] text-muted-foreground">Placeholders are replaced with each shareholder&apos;s values when sent.</p>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map((c) => (
              <Card key={c.label} className="mrpsl-card p-4"><p className="mrpsl-section-title">{c.label}</p><p className={cn("text-2xl font-bold tabular mt-1", c.color)}>{c.value}</p></Card>
            ))}
          </div>
          <Card className="mrpsl-card overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border flex-wrap">
              {(["ALL", "QUEUED", "SENT", "FAILED"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
              <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={() => { refetchSummary(); refetchLogs(); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">RECIPIENT</th>
                    <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                    <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
                    <th className="text-left px-4 py-2.5 font-medium">SENT</th>
                    <th className="text-left px-4 py-2.5 font-medium">ERROR</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No emails {filter === "ALL" ? "sent yet" : `in "${filter.toLowerCase()}"`}.</td></tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-4 py-2.5 font-mono text-[12px]">{r.recipientEmail}</td>
                        <td className="px-4 py-2.5">{r.recipientName ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={cn("border-0 text-[11px]", r.status === "SENT" ? "bg-green-100 text-green-800" : r.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800")}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}</td>
                        <td className="px-4 py-2.5 text-[12px] text-red-600 max-w-xs truncate" title={r.errorMessage ?? ""}>{r.errorMessage ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send to all shareholders?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This queues the notification email to <strong>{recipientCount}</strong> shareholder(s) with an address on this bonus issue.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="gap-2" onClick={handleSendAll}><Send className="h-4 w-4" /> Send Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
