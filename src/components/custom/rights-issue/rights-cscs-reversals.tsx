"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUploadRightsReversal, useInitiateRightsReversal } from "@/hooks/useRights";
import { downloadRightsReversalErrors, type RightsReversalUploadResult } from "@/actions/rightsActions";

const RESOLUTIONS = [
  { value: "FULL_REFUND", label: "Full Refund (unlodge + queue refund)" },
  { value: "CORRECT_REBATCH", label: "Correct & Re-batch" },
  { value: "FORCE_CERTIFICATE", label: "Force Certificate" },
];

export function RightsCscsReversals({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<RightsReversalUploadResult | null>(null);
  const [resolution, setResolution] = useState("FULL_REFUND");

  const upload = useUploadRightsReversal();
  const initiate = useInitiateRightsReversal();

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to process CSCS responses.
      </Card>
    );
  }

  function handleUpload() {
    if (!file) { toast.error("Choose the CSCS response file first."); return; }
    upload.mutate(
      { id: declarationId!, file, uploadedBy: currentUser?.email ?? "" },
      {
        onSuccess: (res) => {
          setResult(res);
          toast.success(`${res.totalCredited} credited, ${res.totalErrors} error(s).`);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function handleInitiateAll() {
    const accts = (result?.errors ?? []).map((e) => e.accountNumber).filter(Boolean);
    if (accts.length === 0) { toast.error("No error rows to reverse."); return; }
    initiate.mutate(
      { id: declarationId!, accountNumbers: accts, resolution, initiatedBy: currentUser?.email },
      {
        onSuccess: () => toast.success(`Reversal initiated for ${accts.length} record(s).`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  async function handleDownloadErrors() {
    try {
      const blob = await downloadRightsReversalErrors(declarationId!);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rights_cscs_errors_${declarationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">CSCS Reversals &amp; Error Resolution</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Upload the CSCS response file. Unsuccessful rows can be reversed — Full Refund zeroes the
          allotted units and queues the additional-shares refund.
        </p>
      </div>

      <Card className="mrpsl-card p-5 space-y-4">
        <label className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer">
          {file ? <><FileUp className="h-6 w-6 text-primary" /><span className="font-medium">{file.name}</span></>
            : <><Upload className="h-6 w-6 opacity-40" /><span>Drop the CSCS response file or click to browse</span></>}
          <input type="file" accept=".txt,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="flex justify-end">
          <Button className="gap-2" disabled={upload.isPending || !file} onClick={handleUpload}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Process Response File
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="mrpsl-card p-3"><p className="mrpsl-label">Successfully Lodged</p><p className="font-mono font-semibold text-lg mt-1 text-green-700">{result.totalCredited}</p></Card>
            <Card className="mrpsl-card p-3"><p className="mrpsl-label">Lodgement Errors</p><p className="font-mono font-semibold text-lg mt-1 text-red-600">{result.totalErrors}</p></Card>
          </div>

          {result.errors.length > 0 && (
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
                <p className="mrpsl-section-title">Lodgement Errors</p>
                <div className="flex-1" />
                <Select value={resolution} onValueChange={(v) => setResolution(v ?? "FULL_REFUND")}>
                  <SelectTrigger className="mrpsl-input h-8 w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOLUTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadErrors}>
                  <Download className="h-3.5 w-3.5" /> Errors CSV
                </Button>
                <Button size="sm" className="gap-1.5" disabled={initiate.isPending} onClick={handleInitiateAll}>
                  {initiate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Initiate All Reversals
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">ACCOUNT</th>
                      <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                      <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                      <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                      <th className="text-left px-4 py-2.5 font-medium">REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={`${e.accountNumber}-${i}`} className="border-t border-border">
                        <td className="px-4 py-2.5 font-mono text-xs">{e.accountNumber}</td>
                        <td className="px-4 py-2.5">{e.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{e.chn}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{Number(e.units ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-xs text-red-600">{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {result.credited.length > 0 && (
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><p className="mrpsl-section-title">Successfully Lodged</p></div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">ACCOUNT</th>
                      <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                      <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.credited.map((c, i) => (
                      <tr key={`${c.accountNumber}-${i}`} className="border-t border-border">
                        <td className="px-4 py-2.5 font-mono text-xs">{c.accountNumber}</td>
                        <td className="px-4 py-2.5">{c.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{Number(c.units ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
