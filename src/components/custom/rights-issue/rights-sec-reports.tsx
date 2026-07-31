"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchRightsDeclarationReport,
  downloadRightsDeclarationReport,
} from "@/actions/rightsActions";

interface ReportDef {
  key: string;
  label: string;
  threshold?: boolean;
}

// Backend declaration-scoped reports (RightsReportController) surfaced as the SEC bundle.
const REPORTS: ReportDef[] = [
  { key: "rights-summary", label: "Rights Summary" },
  { key: "offer-summary", label: "Offer Summary" },
  { key: "range-analysis", label: "Rights Range Analysis" },
  { key: "rights-prelist", label: "Rights Pre-List" },
  { key: "full-subscription-list", label: "Full Subscription List" },
  { key: "global-subscription-list", label: "Global Subscription List" },
  { key: "processed-rights", label: "Processed Rights" },
  { key: "processed-rights-by-batch", label: "Processed Rights by Batch" },
  { key: "processed-rights-certificates", label: "Processed Rights Certificates" },
  { key: "additional-investors", label: "Additional Investors" },
  { key: "partial-subscription", label: "Partial Subscription" },
  { key: "holders-above-units", label: "Holders With Units and Above", threshold: true },
  { key: "holders-above-percent", label: "Holders With % and Above", threshold: true },
  { key: "listing-by-batch", label: "Listing by Batch" },
  { key: "listing-by-agent", label: "Listing by Agent" },
  { key: "subscription-by-agent", label: "Subscription by Agent" },
  { key: "agent-summary", label: "Agent Summary" },
  { key: "rights-with-membercode-chn", label: "Rights with Membercode / CHN" },
  { key: "holders-with-chn", label: "Holders With CHN" },
  { key: "holders-without-chn", label: "Holders Without CHN" },
  { key: "unauthorized-batch", label: "Unauthorized Batch" },
];

export function RightsSecReports({ declarationId }: { declarationId?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ title: string; data: Record<string, unknown> } | null>(null);

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to generate SEC reports.
      </Card>
    );
  }

  const extra = (r: ReportDef): Record<string, number> | undefined => {
    if (!r.threshold) return undefined;
    const v = Number(thresholds[r.key]);
    return v > 0 ? { threshold: v } : undefined;
  };

  async function handleGenerate(r: ReportDef) {
    setBusy(`gen:${r.key}`);
    try {
      const data = await fetchRightsDeclarationReport(declarationId!, r.key, extra(r));
      setPreview({ title: r.label, data: (data ?? {}) as Record<string, unknown> });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload(r: ReportDef) {
    setBusy(`dl:${r.key}`);
    try {
      const blob = await downloadRightsDeclarationReport(declarationId!, r.key, "excel", extra(r));
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${r.key}_${declarationId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">SEC Clearance Reports</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Generate to preview on screen, or download the Excel file for SEC submission.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((r) => (
          <Card key={r.key} className="mrpsl-card p-4 flex flex-col gap-3">
            <p className="text-sm font-medium">{r.label}</p>
            {r.threshold && (
              <Input
                className="mrpsl-input h-8"
                type="number"
                placeholder={r.key.includes("percent") ? "Threshold %" : "Threshold units"}
                value={thresholds[r.key] ?? ""}
                onChange={(e) => setThresholds((t) => ({ ...t, [r.key]: e.target.value }))}
              />
            )}
            <div className="flex items-center gap-2 mt-auto">
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" disabled={busy === `gen:${r.key}`} onClick={() => handleGenerate(r)}>
                {busy === `gen:${r.key}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} Generate
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" disabled={busy === `dl:${r.key}`} onClick={() => handleDownload(r)}>
                {busy === `dl:${r.key}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ReportPreview preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function ReportPreview({
  preview,
  onClose,
}: {
  preview: { title: string; data: Record<string, unknown> } | null;
  onClose: () => void;
}) {
  const data = preview?.data ?? {};
  const rows = Array.isArray(data.rows) ? (data.rows as Record<string, unknown>[]) : [];
  const totals = data.totals && typeof data.totals === "object" ? (data.totals as Record<string, unknown>) : {};
  const scalarTotals = Object.entries(data).filter(
    ([k, v]) => k !== "rows" && k !== "totals" && (typeof v === "number" || typeof v === "string"),
  );
  const cols = rows.length > 0 ? Object.keys(rows[0]).slice(0, 8) : [];

  return (
    <Dialog open={!!preview} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
        <div className="flex-1 min-h-0 max-h-[70vh] overflow-y-auto space-y-4">
          {(Object.keys(totals).length > 0 || scalarTotals.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...scalarTotals, ...Object.entries(totals)].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border p-2">
                  <p className="mrpsl-label truncate">{k}</p>
                  <p className="font-mono font-semibold text-sm mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>
          )}
          {rows.length > 0 ? (
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground sticky top-0">
                  <tr>{cols.map((c) => <th key={c} className="text-left px-3 py-2 font-medium">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {cols.map((c) => <td key={c} className="px-3 py-1.5">{String(row[c] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && <p className="text-[11px] text-muted-foreground p-2">Showing first 100 of {rows.length} rows — download the Excel for the full set.</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No row-level data for this report.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
