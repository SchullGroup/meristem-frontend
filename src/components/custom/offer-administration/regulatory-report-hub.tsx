"use client";

import { useState } from "react";
import { Eye, Download, Search, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useIpoBatchesByOffer,
  useGenerateIpoSecReport,
  useExportIpoSecReport,
} from "@/hooks/useIPO";

interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: (v: unknown) => string;
}

interface SecReport {
  id: string;
  title: string;
  description: string;
  tag: string;
  columns: ReportColumn[];
}

const fmtN = (v: unknown) => `₦${Number(v).toLocaleString()}`;
const fmtNum = (v: unknown) => Number(v).toLocaleString();
const fmtPct = (v: unknown) => `${Number(v).toFixed(1)}%`;

// Report metadata (columns/title/tag). Rows are generated on the backend from the batch records.
const SEC_REPORTS: SecReport[] = [
  {
    id: "master-summary",
    title: "Master Summary",
    description: "Total units offered, applied for, monies received, and overall subscription percentage.",
    tag: "REQ-01",
    columns: [
      { key: "metric", label: "Metric", align: "left" },
      { key: "value", label: "Value", align: "right" },
    ],
  },
  {
    id: "basis-of-allotment",
    title: "Proposed Basis of Allotment",
    description: "Tiered band matrix showing the proposed distribution of shares, computed from the allotment bands and the applicants in each band.",
    tag: "REQ-02",
    columns: [
      { key: "band", label: "Band", align: "left" },
      { key: "minUnits", label: "Min Applied", align: "right", format: fmtNum },
      { key: "maxUnits", label: "Max Applied", align: "right", format: fmtNum },
      { key: "allotmentFactor", label: "Allotment Factor", align: "right" },
      { key: "applicants", label: "Applicants", align: "right", format: fmtNum },
      { key: "proposedAllotment", label: "Proposed Allotment", align: "right", format: fmtNum },
    ],
  },
  {
    id: "rejected-applications",
    title: "Schedule of Rejected Applications",
    description: "Applications that failed compliance vetting, with reasons and amounts paid.",
    tag: "REQ-03",
    columns: [
      { key: "ref", label: "App Ref", align: "left" },
      { key: "name", label: "Applicant", align: "left" },
      { key: "chn", label: "CHN", align: "left" },
      { key: "unitsApplied", label: "Units Applied", align: "right", format: fmtNum },
      { key: "amountPaid", label: "Amount Paid", align: "right", format: fmtN },
      { key: "reason", label: "Rejection Reason", align: "left" },
    ],
  },
  {
    id: "multiple-applications",
    title: "Schedule of Multiple Applications",
    description: "Output of the deduplication engine — applicants flagged for submitting more than one application.",
    tag: "REQ-04",
    columns: [
      { key: "primaryRef", label: "Primary Ref", align: "left" },
      { key: "name", label: "Applicant", align: "left" },
      { key: "bvn", label: "BVN", align: "left" },
      { key: "matchType", label: "Match Type", align: "left" },
      { key: "duplicateCount", label: "Duplicates", align: "right" },
      { key: "totalAmountPaid", label: "Total Paid", align: "right", format: fmtN },
      { key: "action", label: "Resolution", align: "left" },
    ],
  },
  {
    id: "global-receiving-agent",
    title: "Global Receiving Agent Report",
    description: "Applications, units, and amounts collected across all receiving agents and stockbrokers.",
    tag: "REQ-05",
    columns: [
      { key: "agent", label: "Receiving Agent", align: "left" },
      { key: "agentType", label: "Type", align: "left" },
      { key: "applications", label: "Applications", align: "right", format: fmtNum },
      { key: "totalUnits", label: "Total Units", align: "right", format: fmtNum },
      { key: "totalAmount", label: "Total Amount", align: "right", format: fmtN },
      { key: "status", label: "Status", align: "left" },
    ],
  },
  {
    id: "demographics",
    title: "Demographics Analysis",
    description: "Geographic distribution of applications by state, with units and amounts.",
    tag: "REQ-06",
    columns: [
      { key: "category", label: "Category", align: "left" },
      { key: "segment", label: "Segment", align: "left" },
      { key: "count", label: "Applications", align: "right", format: fmtNum },
      { key: "percentage", label: "% of Total", align: "right", format: fmtPct },
      { key: "totalUnits", label: "Units Applied", align: "right", format: fmtNum },
      { key: "totalAmount", label: "Amount", align: "right", format: fmtN },
    ],
  },
];

type Row = Record<string, string | number>;

interface RegulatoryReportHubProps {
  activeOffer?: { id: string; offerName?: string } | null;
}

export function RegulatoryReportHub({ activeOffer }: RegulatoryReportHubProps) {
  const [batchRef, setBatchRef] = useState("");
  const [previewReport, setPreviewReport] = useState<SecReport | null>(null);
  const [previewRows, setPreviewRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: batches } = useIpoBatchesByOffer(activeOffer?.id ?? "");
  const batchList = batches?.content ?? [];
  const generate = useGenerateIpoSecReport();
  const exportReport = useExportIpoSecReport();

  const openPreview = async (report: SecReport) => {
    if (!batchRef) return toast.error("Select an uploaded batch first.");
    setBusy(`view-${report.id}`);
    try {
      const res = await generate.mutateAsync({ batchRef, reportId: report.id });
      setPreviewRows((res?.rows ?? []) as Row[]);
      setSearch("");
      setPreviewReport(report);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportForSec = async (report: SecReport) => {
    if (!batchRef) return toast.error("Select an uploaded batch first.");
    setBusy(`export-${report.id}`);
    try {
      const blob = await exportReport.mutateAsync({ batchRef, reportId: report.id });
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sec-${report.id}-${batchRef}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const filteredRows = previewReport
    ? previewRows.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase())),
      )
    : [];

  if (!activeOffer) {
    return (
      <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
        Select an active offer above to generate its SEC clearance reports.
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="mrpsl-card p-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="space-y-1.5 w-96 max-w-full">
              <label className="mrpsl-label">Uploaded Batch</label>
              <Select value={batchRef} onValueChange={(v) => setBatchRef(v ?? "")}>
                <SelectTrigger className="mrpsl-input">
                  <SelectValue placeholder={batchList.length ? "Select a batch" : "No batches uploaded for this offer"} />
                </SelectTrigger>
                <SelectContent>
                  {batchList.map((b) => (
                    <SelectItem key={b.batchReference} value={b.batchReference}>
                      {b.batchReference} — {b.batchDate} ({b.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-0 text-xs shrink-0">
              Pending SEC Submission
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            The 6 mandatory SEC clearance reports, generated from the selected batch&apos;s vetted records.
          </p>
        </Card>

        {!batchRef ? (
          <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
            Select an uploaded batch above to generate its SEC clearance reports.
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {SEC_REPORTS.map((report) => (
              <Card key={report.id} className="mrpsl-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">
                        {report.tag}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm">{report.title}</p>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-1" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{report.description}</p>
                <div className="flex gap-2 pt-1 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={busy === `view-${report.id}`}
                    onClick={() => openPreview(report)}
                  >
                    {busy === `view-${report.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Preview Data
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={busy === `export-${report.id}`}
                    onClick={() => exportForSec(report)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export for SEC
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generic preview dialog */}
      <Dialog open={!!previewReport} onOpenChange={(open) => { if (!open) setPreviewReport(null); }}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">
                {previewReport?.tag}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {previewRows.length.toLocaleString()} row{previewRows.length === 1 ? "" : "s"}
              </span>
            </div>
            <DialogTitle>{previewReport?.title}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-3 border-b border-border shrink-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="mrpsl-input pl-9 h-9"
                placeholder="Search rows…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 max-h-[70vh] overflow-y-auto px-6 py-4">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="mrpsl-table-header">
                  {previewReport?.columns.map((c) => (
                    <th key={c.key} className={`px-3 py-2.5 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={previewReport?.columns.length ?? 1} className="px-3 py-10 text-center text-muted-foreground">
                      No rows.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      {previewReport?.columns.map((c) => (
                        <td key={c.key} className={`px-3 py-2.5 ${c.align === "right" ? "text-right font-mono tabular-nums" : "text-left"}`}>
                          {row[c.key] === undefined || row[c.key] === null || row[c.key] === ""
                            ? "—"
                            : c.format
                              ? c.format(row[c.key])
                              : String(row[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
            <Button
              size="sm"
              onClick={() => previewReport && exportForSec(previewReport)}
              disabled={!previewReport || busy === `export-${previewReport?.id}`}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export for SEC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
