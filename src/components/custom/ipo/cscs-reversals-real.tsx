"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import {
  useListIpoBatchesByStatus,
  useUploadIpoReversalFile,
  useInitiateIpoReversal,
  useDownloadIpoReversalErrorList,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils/format";
import type { IpoReversalUploadResponse } from "@/types/ipo";

export default function IpoCscsReversalsReal() {
  const { currentUser } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [batchRef, setBatchRef] = useState("");
  const [result, setResult] = useState<IpoReversalUploadResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: batchesData } = useListIpoBatchesByStatus("LODGED");
  const uploadFile = useUploadIpoReversalFile();
  const initiate = useInitiateIpoReversal();
  const downloadErrors = useDownloadIpoReversalErrorList();

  const batches = batchesData?.content ?? [];

  function handleFile(file: File | undefined | null) {
    if (!file || !batchRef || !currentUser?.email) {
      if (!batchRef) toast.error("Select a lodged batch first.");
      return;
    }
    uploadFile.mutate(
      { batchRef, file, uploadedBy: currentUser.email },
      {
        onSuccess: (res) => {
          setResult(res.data ?? null);
          setSelected(new Set());
          toast.success(`Processed — ${res.data?.totalCredited ?? 0} credited, ${res.data?.totalErrors ?? 0} error(s).`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function toggle(acct: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(acct)) next.delete(acct);
      else next.add(acct);
      return next;
    });
  }

  function handleInitiate() {
    if (!currentUser?.email || selected.size === 0) return;
    initiate.mutate(
      { batchRef, accountNumbers: [...selected], initiatedBy: currentUser.email },
      {
        onSuccess: (res) => {
          toast.success(`${res.data?.updated ?? 0} account(s) moved to reversal-initiated.`);
          setSelected(new Set());
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  async function handleDownloadErrors() {
    try {
      const blob = await downloadErrors.mutateAsync(batchRef);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ipo_cscs_reversal_errors_${batchRef}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download error list.");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="mrpsl-card p-4 space-y-4">
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
        <div>
          <p className="text-sm font-semibold mb-1">Upload CSCS Confirmation File</p>
          <p className="text-[13px] text-muted-foreground mb-3">
            CSV: <code>accountNumber,name,chn,units</code>. Rows are classified CREDITED or ERROR automatically.
          </p>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => batchRef && fileRef.current?.click()}
          >
            {uploadFile.isPending ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Click to upload CSCS confirmation file (.csv)</span>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </Card>

      {result && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-semibold">Reversal Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Credited</span>
                <Badge className="ml-auto bg-green-600 hover:bg-green-600 text-white text-xs">{result.totalCredited}</Badge>
              </div>
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {result.credited.map((c) => (
                  <li key={c.accountNumber} className="text-sm">
                    <span className="font-mono font-semibold text-green-800">{c.accountNumber}</span>
                    <span className="block text-xs text-green-600 mt-0.5">{c.name} — {formatNumber(c.units)} units</span>
                  </li>
                ))}
                {result.credited.length === 0 && <li className="text-sm text-green-600 italic">None</li>}
              </ul>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Errors</span>
                <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs">{result.totalErrors}</Badge>
              </div>
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {result.errors.map((e) => (
                  <li key={e.accountNumber} className="flex items-start gap-2 text-sm">
                    <Checkbox checked={selected.has(e.accountNumber)} onCheckedChange={() => toggle(e.accountNumber)} className="mt-0.5" />
                    <div>
                      <span className="font-mono font-semibold text-red-800">{e.accountNumber}</span>
                      <span className="block text-xs text-red-600 mt-0.5">{e.name} ({e.chn}) — {formatNumber(e.units)} units</span>
                      <span className="block text-xs text-red-400 mt-0.5 italic">{e.reason}</span>
                    </div>
                  </li>
                ))}
                {result.errors.length === 0 && <li className="text-sm text-red-600 italic">None</li>}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadErrors}>
              <Download className="h-3.5 w-3.5" /> Download Error List
            </Button>
            <Button size="sm" disabled={selected.size === 0 || initiate.isPending} onClick={handleInitiate}>
              {initiate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Initiate Reversal for {selected.size > 0 ? `${selected.size} ` : ""}Selected
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
