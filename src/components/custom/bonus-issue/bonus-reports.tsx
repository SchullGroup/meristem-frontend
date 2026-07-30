"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  GENERATE_BONUS_REPORT,
  GENERATE_BONUS_DECLARATION_REPORT,
} from "@/actions/bonusIssuesAction";

interface ReportDef {
  key: string;
  label: string;
  scope: "register" | "declaration";
}

const REPORTS: ReportDef[] = [
  { key: "bonus-entitlement-register", label: "Bonus Entitlement Register", scope: "register" },
  { key: "shareholder-bonus-allotment-list", label: "Shareholder Bonus Allotment List", scope: "register" },
  { key: "summary-of-bonus-shares-issued", label: "Summary of Bonus Shares Issued", scope: "register" },
  { key: "exception-and-rounding-report", label: "Exception and Rounding Report", scope: "register" },
  { key: "bonus-report", label: "Bonus Report", scope: "declaration" },
];

export function BonusReports({
  declarationId,
  registerId,
}: {
  declarationId?: string;
  registerId?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; data: Record<string, unknown> } | null>(null);

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a bonus issue above to generate reports.
      </Card>
    );
  }

  async function run(r: ReportDef, format: "json" | "excel") {
    setBusy(`${format}:${r.key}`);
    try {
      const res =
        r.scope === "declaration"
          ? await GENERATE_BONUS_DECLARATION_REPORT(declarationId!, r.key, format)
          : await GENERATE_BONUS_REPORT(r.key, { registerId, format });
      if (format === "excel") {
        const url = URL.createObjectURL(res as Blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${r.key}.xlsx`; a.click();
        URL.revokeObjectURL(url);
      } else {
        const payload = (res?.data ?? res ?? {}) as Record<string, unknown>;
        setPreview({ title: r.label, data: payload });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Bonus Reports</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Generate to preview on screen, or download the Excel file where supported.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((r) => (
          <Card key={r.key} className="mrpsl-card p-4 flex flex-col gap-3">
            <p className="text-sm font-medium">{r.label}</p>
            <div className="flex items-center gap-2 mt-auto">
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" disabled={busy === `json:${r.key}`} onClick={() => run(r, "json")}>
                {busy === `json:${r.key}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} Generate
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" disabled={busy === `excel:${r.key}`} onClick={() => run(r, "excel")}>
                {busy === `excel:${r.key}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <BonusReportPreview preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function BonusReportPreview({
  preview,
  onClose,
}: {
  preview: { title: string; data: Record<string, unknown> } | null;
  onClose: () => void;
}) {
  const data = preview?.data ?? {};
  const rows = Array.isArray(data.rows)
    ? (data.rows as Record<string, unknown>[])
    : Array.isArray(data.entitlements)
      ? (data.entitlements as Record<string, unknown>[])
      : [];
  const scalars = Object.entries(data).filter(
    ([, v]) => typeof v === "number" || typeof v === "string",
  );
  const cols = rows.length > 0 ? Object.keys(rows[0]).slice(0, 8) : [];

  return (
    <Dialog open={!!preview} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
        <div className="flex-1 min-h-0 max-h-[70vh] overflow-y-auto space-y-4">
          {scalars.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {scalars.map(([k, v]) => (
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
              {rows.length > 100 && <p className="text-[11px] text-muted-foreground p-2">Showing first 100 of {rows.length} rows.</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No row-level data for this report.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
