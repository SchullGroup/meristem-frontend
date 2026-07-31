"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useProcessDematReversal, useNotifyDematReversal } from "@/hooks/useCertDematerialisation";
import type { ReversalProcessResult } from "@/actions/certDematActions";

const OUTCOME_BADGE: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-700",
  UNMATCHED: "bg-amber-100 text-amber-800",
};

export function DematReversal() {
  const fileRef = useRef<HTMLInputElement>(null);
  const process = useProcessDematReversal();
  const notify = useNotifyDematReversal();

  const [result, setResult] = useState<ReversalProcessResult | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    process.mutate(file, {
      onSuccess: (res) => {
        setResult(res);
        setSubject(res.suggestedSubject ?? "CSCS Dematerialisation Lodgment — Outcome");
        setBody(res.suggestedBody ?? "");
        toast.success(`Processed ${res.total} row(s): ${res.successCount} success, ${res.failedCount} failed, ${res.unmatchedCount} unmatched.`);
      },
      onError: (err) => toast.error((err as Error).message),
    });
    e.target.value = "";
  };

  const sendNotify = () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body are required."); return; }
    notify.mutate(
      { to: to.trim() || undefined, subject: subject.trim(), body: body.trim() },
      {
        onSuccess: () => toast.success("Reversal notification sent."),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload the CSCS lodgment-response file (<span className="font-mono">certNo, outcome, reason</span>). FAILED rows flip
        their record to <strong>Lodgment Failed</strong> for re-lodging; then notify the desk by email.
      </p>

      <Card className="mrpsl-card p-5 flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><Upload className="h-4 w-4 text-muted-foreground" /></div>
        <p className="text-sm font-medium text-muted-foreground">Upload CSCS Lodgment Response</p>
        <Button variant="outline" className="gap-1.5" disabled={process.isPending} onClick={() => fileRef.current?.click()}>
          {process.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Choose File
        </Button>
        <p className="text-[11px] text-muted-foreground">CSV · certNo, outcome (SUCCESS/FAILED), reason</p>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
      </Card>

      {result && (
        <>
          <div className="flex gap-3 flex-wrap">
            <Card className="mrpsl-card p-4 flex-1 min-w-32"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p><p className="font-mono font-bold text-lg">{result.total}</p></Card>
            <Card className="mrpsl-card p-4 flex-1 min-w-32 bg-green-50"><p className="text-xs text-green-700 uppercase tracking-wider">Success</p><p className="font-mono font-bold text-lg text-green-700">{result.successCount}</p></Card>
            <Card className="mrpsl-card p-4 flex-1 min-w-32 bg-red-50"><p className="text-xs text-red-700 uppercase tracking-wider">Failed</p><p className="font-mono font-bold text-lg text-red-700">{result.failedCount}</p></Card>
            <Card className="mrpsl-card p-4 flex-1 min-w-32 bg-amber-50"><p className="text-xs text-amber-700 uppercase tracking-wider">Unmatched</p><p className="font-mono font-bold text-lg text-amber-700">{result.unmatchedCount}</p></Card>
          </div>

          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header"><tr>
                  <th className="px-4 py-3">CERT NO</th>
                  <th className="px-4 py-3">HOLDER</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">OUTCOME</th>
                  <th className="px-4 py-3">REASON</th>
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {result.results.map((row, i) => (
                    <tr key={`${row.certNo}-${i}`} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-[13px]">{row.certNo}</td>
                      <td className="px-4 py-3 text-[13px]">{row.holderName || "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.register || "—"}</td>
                      <td className="px-4 py-3"><Badge className={`border-0 text-[11px] ${OUTCOME_BADGE[row.outcome] ?? "bg-gray-100 text-gray-700"}`}>{row.outcome}</Badge></td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mrpsl-card p-5 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Notify</p>
            <div className="space-y-1.5">
              <label className="mrpsl-label">To (optional — defaults to the desk distribution list)</label>
              <Input className="mrpsl-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="ops@meristem.com" />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Subject</label>
              <Input className="mrpsl-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Body</label>
              <textarea className="mrpsl-input w-full min-h-32 py-2" value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button className="gap-1.5" disabled={notify.isPending} onClick={sendNotify}>
                {notify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Notification
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
