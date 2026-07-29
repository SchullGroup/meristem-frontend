"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Loader2, Mail } from "lucide-react";
import {
  useListIpoBatchesByStatus,
  useEmailIpoShareholders,
  useDownloadIpoStickyLabels,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";

export default function IpoDispatchReal() {
  const { currentUser } = useStore();
  const [batchRef, setBatchRef] = useState("");
  const [subject, setSubject] = useState("");

  const { data: batchesData } = useListIpoBatchesByStatus("LODGED");
  const emailShareholders = useEmailIpoShareholders();
  const downloadLabels = useDownloadIpoStickyLabels();

  const batches = batchesData?.content ?? [];

  function handleEmail() {
    if (!batchRef || !currentUser?.email) {
      toast.error("Select a lodged batch first.");
      return;
    }
    emailShareholders.mutate(
      { batchRef, subject: subject || undefined, sentBy: currentUser.email },
      {
        onSuccess: (res) => toast.success(`${res.data?.sent ?? 0} notification email(s) queued.`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  async function handleDownloadLabels() {
    if (!batchRef) {
      toast.error("Select a lodged batch first.");
      return;
    }
    try {
      const blob = await downloadLabels.mutateAsync(batchRef);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ipo_sticky_labels_${batchRef}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download sticky labels.");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="mrpsl-card p-4 flex items-end gap-4 flex-wrap">
        <div className="space-y-1.5 w-72">
          <label className="mrpsl-label">Lodged Batch</label>
          <Select value={batchRef} onValueChange={(v) => setBatchRef(v ?? "")}>
            <SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select a lodged batch" /></SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.batchReference} value={b.batchReference}>
                  {b.batchReference} — {b.register}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-60">
          <label className="mrpsl-label">Email Subject (optional)</label>
          <Input className="mrpsl-input" placeholder="Public Offer Allotment Notification" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </Card>

      <Card className="mrpsl-card p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">Dispatch &amp; Notification</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Email allotment notifications to the batch&apos;s approved subscribers, or download
            sticky labels for postal dispatch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2" disabled={!batchRef || emailShareholders.isPending} onClick={handleEmail}>
            {emailShareholders.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Email Approved Shareholders
          </Button>
          <Button variant="outline" className="gap-2" disabled={!batchRef || downloadLabels.isPending} onClick={handleDownloadLabels}>
            {downloadLabels.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Sticky Labels (CSV)
          </Button>
        </div>
      </Card>
    </div>
  );
}
