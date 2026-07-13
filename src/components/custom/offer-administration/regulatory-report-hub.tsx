"use client";

import { useState } from "react";
import { Eye, Download, Search, FileSpreadsheet, Plus, Trash2, Pencil, X } from "lucide-react";
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

interface RejectedRow {
  id: string;
  ref: string;
  name: string;
  chn: string;
  unitsApplied: number;
  amountPaid: number;
  reason: string;
}

const INITIAL_REJECTED: RejectedRow[] = [
  { id: "r1", ref: "IPO-2024-00123", name: "Oluwaseun Adeyemi", chn: "10012345678", unitsApplied: 5000, amountPaid: 112500, reason: "Missing CHN" },
  { id: "r2", ref: "IPO-2024-00456", name: "Chinwe Okafor", chn: "10098765432", unitsApplied: 10000, amountPaid: 225000, reason: "Uncleared Funds" },
  { id: "r3", ref: "IPO-2024-00789", name: "Emeka Nwosu", chn: "10011223344", unitsApplied: 2000, amountPaid: 45000, reason: "KYC Incomplete" },
  { id: "r4", ref: "IPO-2024-01012", name: "Fatima Abubakar", chn: "—", unitsApplied: 15000, amountPaid: 337500, reason: "Invalid BVN" },
  { id: "r5", ref: "IPO-2024-01345", name: "Yemi Olatunde", chn: "10033445566", unitsApplied: 7500, amountPaid: 168750, reason: "Uncleared Funds" },
];

interface AllotmentBand {
  id: string;
  band: string;
  minUnits: number;
  maxUnits: number;
  allotmentFactor: string;
  applicants: number;
  proposedAllotment: number;
}

const fmtN = (v: unknown) => `₦${Number(v).toLocaleString()}`;
const fmtNum = (v: unknown) => Number(v).toLocaleString();
const fmtPct = (v: unknown) => `${Number(v).toFixed(1)}%`;

const INITIAL_BANDS: AllotmentBand[] = [
  { id: "b1", band: "Band A — Retail", minUnits: 500, maxUnits: 10000, allotmentFactor: "100%", applicants: 41832, proposedAllotment: 152000000 },
  { id: "b2", band: "Band B — Retail+", minUnits: 10001, maxUnits: 50000, allotmentFactor: "85%", applicants: 18450, proposedAllotment: 380000000 },
  { id: "b3", band: "Band C — Mid-tier", minUnits: 50001, maxUnits: 500000, allotmentFactor: "70%", applicants: 9210, proposedAllotment: 640000000 },
  { id: "b4", band: "Band D — HNI", minUnits: 500001, maxUnits: 5000000, allotmentFactor: "55%", applicants: 3100, proposedAllotment: 420000000 },
  { id: "b5", band: "Band E — Institutional", minUnits: 5000001, maxUnits: 999999999, allotmentFactor: "40%", applicants: 480, proposedAllotment: 1500000000 },
];

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
    mockRows: [],
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
    id: "global-receiving-agent",
    title: "Global Receiving Agent Report",
    description: "Consolidated summary of applications, units, and amounts collected across all receiving agents and stockbrokers.",
    tag: "REQ-05",
    rowCount: 12,
    columns: [
      { key: "agent", label: "Receiving Agent", align: "left" },
      { key: "agentType", label: "Type", align: "left" },
      { key: "applications", label: "Applications", align: "right", format: fmtNum },
      { key: "totalUnits", label: "Total Units", align: "right", format: fmtNum },
      { key: "totalAmount", label: "Total Amount", align: "right", format: fmtN },
      { key: "status", label: "Status", align: "left" },
    ],
    mockRows: [
      { agent: "Access Bank PLC", agentType: "Bank", applications: 12450, totalUnits: 45200000, totalAmount: 1017000000, status: "Confirmed" },
      { agent: "GTBank PLC", agentType: "Bank", applications: 8320, totalUnits: 30500000, totalAmount: 686250000, status: "Confirmed" },
      { agent: "Zenith Bank PLC", agentType: "Bank", applications: 6740, totalUnits: 22100000, totalAmount: 495750000, status: "Variance — Under Review" },
      { agent: "Fidelity Bank PLC", agentType: "Bank", applications: 4210, totalUnits: 14800000, totalAmount: 324750000, status: "Confirmed" },
      { agent: "Meristem Securities Ltd", agentType: "Stockbroker", applications: 3200, totalUnits: 11500000, totalAmount: 258750000, status: "Confirmed" },
      { agent: "CardinalStone Partners Ltd", agentType: "Stockbroker", applications: 2800, totalUnits: 9800000, totalAmount: 220500000, status: "Confirmed" },
      { agent: "Meristem Registrars Ltd", agentType: "Receiving Agent", applications: 5400, totalUnits: 18000000, totalAmount: 405000000, status: "Confirmed" },
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

function BandInput({ value, onChange, className }: { value: string | number; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      className={`mrpsl-input h-8 text-sm ${className ?? ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function RegulatoryReportHub() {
  const [previewReport, setPreviewReport] = useState<SecReport | null>(null);
  const [allotmentOpen, setAllotmentOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bands, setBands] = useState<AllotmentBand[]>(INITIAL_BANDS);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  const [rejectedEditMode, setRejectedEditMode] = useState(false);
  const [rejectedRows, setRejectedRows] = useState<RejectedRow[]>(INITIAL_REJECTED);
  const [rejectedSearch, setRejectedSearch] = useState("");
  const [search, setSearch] = useState("");

  const filteredRows = previewReport
    ? previewReport.mockRows.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  const updateBand = <K extends keyof AllotmentBand>(id: string, key: K, value: AllotmentBand[K]) => {
    setBands((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  };

  const addBand = () => {
    const newBand: AllotmentBand = {
      id: `b${Date.now()}`,
      band: `Band ${String.fromCharCode(65 + bands.length)} — New`,
      minUnits: 0,
      maxUnits: 0,
      allotmentFactor: "0%",
      applicants: 0,
      proposedAllotment: 0,
    };
    setBands((prev) => [...prev, newBand]);
  };

  const removeBand = (id: string) => {
    if (bands.length <= 1) {
      toast.error("At least one band is required.");
      return;
    }
    setBands((prev) => prev.filter((b) => b.id !== id));
  };

  const saveBands = () => {
    toast.success("Allotment bands saved.");
    setAllotmentOpen(false);
  };

  const updateRejectedReason = (id: string, reason: string) => {
    setRejectedRows((prev) => prev.map((r) => (r.id === id ? { ...r, reason } : r)));
  };

  const saveRejected = () => {
    toast.success("Rejection reasons updated.");
    setRejectedEditMode(false);
  };

  const filteredRejected = rejectedRows.filter(
    (r) =>
      r.name.toLowerCase().includes(rejectedSearch.toLowerCase()) ||
      r.ref.toLowerCase().includes(rejectedSearch.toLowerCase()),
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">
            Generate and export the 6 mandatory reports required for SEC clearance submission.
            These are compiled from the scrubbed staging data.
          </p>
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
                      {report.id === "basis-of-allotment"
                        ? `${bands.length} bands`
                        : `${report.rowCount.toLocaleString()} rows`}
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
                    if (report.id === "basis-of-allotment") {
                      setAllotmentOpen(true);
                    } else if (report.id === "rejected-applications") {
                      setRejectedSearch("");
                      setRejectedOpen(true);
                    } else {
                      setSearch("");
                      setPreviewReport(report);
                    }
                  }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {report.id === "basis-of-allotment" ? "View & Edit" : "Preview Data"}
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

      {/* Basis of Allotment — view / edit dialog */}
      <Dialog open={allotmentOpen} onOpenChange={(open) => { setAllotmentOpen(open); if (!open) setEditMode(false); }}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">REQ-02</Badge>
                  {editMode && (
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Editing</Badge>
                  )}
                </div>
                <DialogTitle>Proposed Basis of Allotment</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editMode
                    ? "Edit band names, ranges, and allotment factors. Add or remove bands as needed."
                    : "Tiered band matrix showing the proposed distribution of shares across investor tiers."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editMode && (
                  <>
                    <Button size="sm" variant="outline" onClick={addBand}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Band
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setEditMode(false)}>
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Cancel Edit
                    </Button>
                  </>
                )}
                {!editMode && (
                  <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="mrpsl-table-header">
                  <th className="text-left px-4 py-2.5 font-medium">Band</th>
                  <th className="text-right px-4 py-2.5 font-medium">Min Applied</th>
                  <th className="text-right px-4 py-2.5 font-medium">Max Applied</th>
                  <th className="text-right px-4 py-2.5 font-medium">Allotment Factor</th>
                  <th className="text-right px-4 py-2.5 font-medium">Applicants</th>
                  <th className="text-right px-4 py-2.5 font-medium">Proposed Allotment</th>
                  {editMode && <th className="px-4 py-2.5 w-10" />}
                </tr>
              </thead>
              <tbody>
                {bands.map((band) => (
                  <tr key={band.id} className="mrpsl-table-row">
                    {editMode ? (
                      <>
                        <td className="px-3 py-2">
                          <BandInput value={band.band} onChange={(v) => updateBand(band.id, "band", v)} />
                        </td>
                        <td className="px-3 py-2">
                          <BandInput value={band.minUnits} onChange={(v) => updateBand(band.id, "minUnits", Number(v))} className="text-right font-mono" />
                        </td>
                        <td className="px-3 py-2">
                          <BandInput value={band.maxUnits} onChange={(v) => updateBand(band.id, "maxUnits", Number(v))} className="text-right font-mono" />
                        </td>
                        <td className="px-3 py-2">
                          <BandInput value={band.allotmentFactor} onChange={(v) => updateBand(band.id, "allotmentFactor", v)} className="text-right font-mono font-semibold" />
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {band.applicants.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {band.proposedAllotment.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeBand(band.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors"
                            title="Remove band"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5">{band.band}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{band.minUnits.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{band.maxUnits.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{band.allotmentFactor}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{band.applicants.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{band.proposedAllotment.toLocaleString()}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">
              {bands.length} band{bands.length !== 1 ? "s" : ""} configured
              {editMode && " · Applicants and Proposed Allotment are computed values"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.info("Export for SEC coming soon")}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export for SEC
              </Button>
              {editMode && (
                <Button onClick={saveBands}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule of Rejected Applications — view / edit dialog */}
      <Dialog open={rejectedOpen} onOpenChange={(open) => { setRejectedOpen(open); if (!open) setRejectedEditMode(false); }}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">REQ-03</Badge>
                  {rejectedEditMode && (
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Editing</Badge>
                  )}
                </div>
                <DialogTitle>Schedule of Rejected Applications</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rejectedEditMode
                    ? "Rejection reasons are editable. All other fields are read-only."
                    : "Full list of applications that failed compliance vetting, with reasons and amounts paid."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {rejectedEditMode ? (
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setRejectedEditMode(false)}>
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel Edit
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRejectedEditMode(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-3 border-b border-border shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                className="mrpsl-input h-9 w-full"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="Search by name or reference…"
                value={rejectedSearch}
                onChange={(e) => setRejectedSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="mrpsl-table-header">
                  <th className="text-left px-4 py-2.5 font-medium">App Ref</th>
                  <th className="text-left px-4 py-2.5 font-medium">Applicant</th>
                  <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                  <th className="text-right px-4 py-2.5 font-medium">Units Applied</th>
                  <th className="text-right px-4 py-2.5 font-medium">Amount Paid</th>
                  <th className="text-left px-4 py-2.5 font-medium">Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredRejected.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No rows match your search.
                    </td>
                  </tr>
                ) : (
                  filteredRejected.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.ref}</td>
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{row.chn}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{row.unitsApplied.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono">₦{row.amountPaid.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        {rejectedEditMode ? (
                          <input
                            className="mrpsl-input h-8 text-sm w-full"
                            value={row.reason}
                            onChange={(e) => updateRejectedReason(row.id, e.target.value)}
                          />
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0 text-[12px]">{row.reason}</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">
              Showing {filteredRejected.length} of {rejectedRows.length} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.info("Export for SEC coming soon")}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export for SEC
              </Button>
              {rejectedEditMode && (
                <Button onClick={saveRejected}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generic preview dialog for all other reports */}
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
          </DialogHeader>

          <div className="px-6 py-3 border-b border-border shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                className="mrpsl-input h-9 w-full"
                style={{ paddingLeft: "2.25rem" }}
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
            <Button onClick={() => toast.info(`${previewReport?.title} export for SEC coming soon`)}>
              <Download className="h-4 w-4 mr-1.5" />
              Export for SEC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
