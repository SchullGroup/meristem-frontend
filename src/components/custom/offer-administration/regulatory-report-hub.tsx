"use client";

import { useState } from "react";
import { Eye, Download, Search, FileSpreadsheet, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  rowCount: number;
  columns: ReportColumn[];
  mockRows: Record<string, string | number>[];
}

const fmtN = (v: unknown) => `₦${Number(v).toLocaleString()}`;
const fmtNum = (v: unknown) => Number(v).toLocaleString();
const fmtPct = (v: unknown) => `${Number(v).toFixed(1)}%`;

const SEC_REPORTS: SecReport[] = [
  {
    id: "master-summary",
    title: "Master Summary",
    description: "Total units offered, applied for, monies received, and overall subscription percentage.",
    tag: "REQ-01",
    rowCount: 7,
    columns: [
      { key: "metric", label: "Metric", align: "left" },
      { key: "value", label: "Value", align: "right" },
    ],
    mockRows: [
      { metric: "Total Units Offered", value: "17,772,612,811" },
      { metric: "Total Units Applied For", value: "22,450,318,000" },
      { metric: "Total Monies Received (₦)", value: "504,956,655,000" },
      { metric: "Subscription Percentage", value: "126.3%" },
      { metric: "Total Applications Received", value: "83,417" },
      { metric: "Valid Applications", value: "78,956" },
      { metric: "Rejected Applications", value: "4,461" },
    ],
  },
  {
    id: "basis-of-allotment",
    title: "Proposed Basis of Allotment",
    description: "Tiered band matrix showing the proposed distribution of shares between retail and institutional investors.",
    tag: "REQ-02",
    rowCount: 5,
    columns: [
      { key: "band", label: "Band", align: "left" },
      { key: "minUnits", label: "Min Applied", align: "right", format: fmtNum },
      { key: "maxUnits", label: "Max Applied", align: "right", format: fmtNum },
      { key: "allotmentFactor", label: "Allotment Factor", align: "right" },
      { key: "applicants", label: "Applicants", align: "right", format: fmtNum },
      { key: "proposedAllotment", label: "Proposed Allotment", align: "right", format: fmtNum },
    ],
    mockRows: [
      { band: "Band A — Retail", minUnits: 500, maxUnits: 10000, allotmentFactor: "100%", applicants: 41832, proposedAllotment: 152000000 },
      { band: "Band B — Retail+", minUnits: 10001, maxUnits: 50000, allotmentFactor: "85%", applicants: 18450, proposedAllotment: 380000000 },
      { band: "Band C — Mid-tier", minUnits: 50001, maxUnits: 500000, allotmentFactor: "70%", applicants: 9210, proposedAllotment: 640000000 },
      { band: "Band D — HNI", minUnits: 500001, maxUnits: 5000000, allotmentFactor: "55%", applicants: 3100, proposedAllotment: 420000000 },
      { band: "Band E — Institutional", minUnits: 5000001, maxUnits: 999999999, allotmentFactor: "40%", applicants: 480, proposedAllotment: 1500000000 },
    ],
  },
  {
    id: "rejected-applications",
    title: "Schedule of Rejected Applications",
    description: "Full list of applications that failed compliance vetting, with reasons and amounts paid.",
    tag: "REQ-03",
    rowCount: 4461,
    columns: [
      { key: "ref", label: "App Ref", align: "left" },
      { key: "name", label: "Applicant", align: "left" },
      { key: "chn", label: "CHN", align: "left" },
      { key: "unitsApplied", label: "Units Applied", align: "right", format: fmtNum },
      { key: "amountPaid", label: "Amount Paid", align: "right", format: fmtN },
      { key: "reason", label: "Rejection Reason", align: "left" },
    ],
    mockRows: [
      { ref: "IPO-2024-00123", name: "Oluwaseun Adeyemi", chn: "10012345678", unitsApplied: 5000, amountPaid: 112500, reason: "Missing CHN" },
      { ref: "IPO-2024-00456", name: "Chinwe Okafor", chn: "10098765432", unitsApplied: 10000, amountPaid: 225000, reason: "Uncleared Funds" },
      { ref: "IPO-2024-00789", name: "Emeka Nwosu", chn: "10011223344", unitsApplied: 2000, amountPaid: 45000, reason: "KYC Incomplete" },
      { ref: "IPO-2024-01012", name: "Fatima Abubakar", chn: "—", unitsApplied: 15000, amountPaid: 337500, reason: "Invalid BVN" },
      { ref: "IPO-2024-01345", name: "Yemi Olatunde", chn: "10033445566", unitsApplied: 7500, amountPaid: 168750, reason: "Uncleared Funds" },
    ],
  },
  {
    id: "multiple-applications",
    title: "Schedule of Multiple Applications",
    description: "Output of the deduplication engine — applicants flagged for submitting more than one application.",
    tag: "REQ-04",
    rowCount: 312,
    columns: [
      { key: "primaryRef", label: "Primary Ref", align: "left" },
      { key: "name", label: "Applicant", align: "left" },
      { key: "bvn", label: "BVN", align: "left" },
      { key: "matchType", label: "Match Type", align: "left" },
      { key: "duplicateCount", label: "Duplicates", align: "right" },
      { key: "totalAmountPaid", label: "Total Paid", align: "right", format: fmtN },
      { key: "action", label: "Resolution", align: "left" },
    ],
    mockRows: [
      { primaryRef: "IPO-2024-02001", name: "Adebayo Johnson", bvn: "22312345678", matchType: "BVN Match", duplicateCount: 2, totalAmountPaid: 250000, action: "Primary Retained" },
      { primaryRef: "IPO-2024-03001", name: "Ngozi Ibe", bvn: "22398765432", matchType: "Name+Address", duplicateCount: 2, totalAmountPaid: 1000000, action: "Primary Retained" },
      { primaryRef: "IPO-2024-04001", name: "Tunde Bakare", bvn: "22387651234", matchType: "CHN Match", duplicateCount: 3, totalAmountPaid: 675000, action: "Primary Retained" },
    ],
  },
  {
    id: "bank-reconciliation",
    title: "Bank Reconciliation",
    description: "Applications processed per receiving bank vs. actual cash confirmed in bank accounts.",
    tag: "REQ-05",
    rowCount: 12,
    columns: [
      { key: "bank", label: "Receiving Bank", align: "left" },
      { key: "applications", label: "Applications", align: "right", format: fmtNum },
      { key: "systemAmount", label: "System Amount", align: "right", format: fmtN },
      { key: "confirmedAmount", label: "Bank Confirmed", align: "right", format: fmtN },
      { key: "variance", label: "Variance", align: "right", format: fmtN },
      { key: "status", label: "Status", align: "left" },
    ],
    mockRows: [
      { bank: "Access Bank PLC", applications: 12450, systemAmount: 1017000000, confirmedAmount: 1017000000, variance: 0, status: "Reconciled" },
      { bank: "GTBank PLC", applications: 8320, systemAmount: 686250000, confirmedAmount: 686250000, variance: 0, status: "Reconciled" },
      { bank: "Zenith Bank PLC", applications: 6740, systemAmount: 497250000, confirmedAmount: 495750000, variance: -1500000, status: "Variance — Under Review" },
      { bank: "Fidelity Bank PLC", applications: 4210, systemAmount: 324750000, confirmedAmount: 324750000, variance: 0, status: "Reconciled" },
    ],
  },
  {
    id: "demographics",
    title: "Demographics Analysis",
    description: "Breakdown by Retail vs. Institutional, Local vs. Foreign, and geographic distribution of applications.",
    tag: "REQ-06",
    rowCount: 37,
    columns: [
      { key: "category", label: "Category", align: "left" },
      { key: "segment", label: "Segment", align: "left" },
      { key: "count", label: "Applications", align: "right", format: fmtNum },
      { key: "percentage", label: "% of Total", align: "right", format: fmtPct },
      { key: "totalUnits", label: "Units Applied", align: "right", format: fmtNum },
      { key: "totalAmount", label: "Amount", align: "right", format: fmtN },
    ],
    mockRows: [
      { category: "Investor Type", segment: "Retail", count: 82500, percentage: 98.9, totalUnits: 18500000000, totalAmount: 416250000000 },
      { category: "Investor Type", segment: "Institutional", count: 917, percentage: 1.1, totalUnits: 3950318000, totalAmount: 88881000000 },
      { category: "Domicile", segment: "Local", count: 82854, percentage: 99.3, totalUnits: 21980000000, totalAmount: 494550000000 },
      { category: "Domicile", segment: "Foreign", count: 563, percentage: 0.7, totalUnits: 470318000, totalAmount: 10581000000 },
      { category: "Geography", segment: "Lagos", count: 38200, percentage: 45.8, totalUnits: 10200000000, totalAmount: 229500000000 },
      { category: "Geography", segment: "Abuja", count: 12400, percentage: 14.9, totalUnits: 3100000000, totalAmount: 69750000000 },
      { category: "Geography", segment: "Other States", count: 32817, percentage: 39.3, totalUnits: 9150318000, totalAmount: 205706000000 },
    ],
  },
];

export function RegulatoryReportHub() {
  const [previewReport, setPreviewReport] = useState<SecReport | null>(null);
  const [search, setSearch] = useState("");

  const filteredRows = previewReport
    ? previewReport.mockRows.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Generate and export the 6 mandatory reports required for SEC clearance submission.
              These are compiled from the scrubbed staging data.
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-0 text-xs shrink-0 ml-4">
            Pending SEC Submission
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SEC_REPORTS.map((report) => (
            <Card key={report.id} className="mrpsl-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">
                      {report.tag}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {report.rowCount.toLocaleString()} rows
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{report.title}</p>
                </div>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-1" />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {report.description}
              </p>

              <div className="flex gap-2 pt-1 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setSearch("");
                    setPreviewReport(report);
                  }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview Data
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => toast.info(`${report.title} export for SEC coming soon`)}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export for SEC
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog
        open={previewReport !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewReport(null);
            setSearch("");
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">
                    {previewReport?.tag}
                  </Badge>
                </div>
                <DialogTitle>{previewReport?.title}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {previewReport?.description}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-3 border-b border-border shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="mrpsl-input pl-9 h-9 w-full"
                placeholder="Search within this report…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="mrpsl-table-header">
                  {previewReport?.columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-2.5 font-medium whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, i) => (
                    <tr key={i} className="mrpsl-table-row">
                      {previewReport?.columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-2.5 ${col.align === "right" ? "text-right font-mono" : ""} ${col.key === "status" && row[col.key] !== "Reconciled" ? "text-amber-700 font-medium" : ""}`}
                        >
                          {col.format
                            ? col.format(row[col.key])
                            : String(row[col.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={previewReport?.columns.length ?? 1}
                      className="px-4 py-10 text-center text-muted-foreground text-sm"
                    >
                      No rows match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-border flex justify-between items-center shrink-0">
            <p className="text-xs text-muted-foreground">
              Showing {filteredRows.length} of {previewReport?.rowCount.toLocaleString()} rows
              {(previewReport?.rowCount ?? 0) > (previewReport?.mockRows.length ?? 0) && (
                <span className="ml-1">(preview — full export via "Export for SEC")</span>
              )}
            </p>
            <Button
              onClick={() => toast.info(`${previewReport?.title} export for SEC coming soon`)}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export for SEC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
