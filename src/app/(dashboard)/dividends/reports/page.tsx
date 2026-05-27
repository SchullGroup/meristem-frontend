"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileSpreadsheet, Download, Printer, CalendarRange, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const REPORT_TYPES = [
  "Dividend Liability Register",
  "WHT Deduction Report",
  "Payment Status Report",
  "Unclaimed Dividends Report",
  "Declaration Summary",
  "Mandate Payment Report",
] as const;
type ReportType = typeof REPORT_TYPES[number];

const formatNaira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PAGE_SIZE = 15;

function PaginationBar({ page, total, onPageChange }: { page: number; total: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-[13px] text-muted-foreground">
      <span>Showing {from}–{to} of {total.toLocaleString()} records</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[13px]" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <span className="px-2">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[13px]" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/* ── Mock unpaid warrant data ── */
const UNPAID_WARRANTS = [
  { id: "UW1", warrantNo: "WRT-10291", account: "DANGCEM-10045", holder: "Lukman Bello",     dividend: "DIV-2025-001", amount: 45000,  issued: "15 Jan 2025", days: 491 },
  { id: "UW2", warrantNo: "WRT-10345", account: "ZENITH-9921",   holder: "Fatima Abdullahi", dividend: "DIV-2025-001", amount: 128500, issued: "15 Jan 2025", days: 491 },
  { id: "UW3", warrantNo: "WRT-10412", account: "DANGCEM-10102", holder: "Emeka Eze",         dividend: "DIV-2025-002", amount: 62000,  issued: "03 Nov 2024", days: 564 },
  { id: "UW4", warrantNo: "WRT-10500", account: "ACCESS-00220",  holder: "Ifeoma Okafor",    dividend: "DIV-2025-001", amount: 98000,  issued: "15 Jan 2025", days: 491 },
  { id: "UW5", warrantNo: "WRT-10611", account: "GTCO-10055",    holder: "Tunde Badmus",     dividend: "DIV-2024-003", amount: 19500,  issued: "28 Jul 2024", days: 663 },
  { id: "UW6", warrantNo: "WRT-10099", account: "ZENITH-8810",   holder: "Bello Musa",       dividend: "DIV-2024-003", amount: 210000, issued: "28 Jul 2024", days: 663 },
  { id: "UW7", warrantNo: "WRT-10088", account: "DANGCEM-10030", holder: "Sola Adeyemo",     dividend: "DIV-2024-002", amount: 55000,  issued: "03 Nov 2024", days: 564 },
];

const SORT_CODES: Record<number, string> = { 0: "044", 1: "058", 2: "011", 3: "057", 4: "035" };

export default function DividendReportsPage() {
  const { registers, shareholders, dividendDeclarations } = useStore();

  const [selectedReport, setSelectedReport] = useState<ReportType>("Dividend Liability Register");
  const [reportRegister, setReportRegister] = useState("all");
  const [reportDividend, setReportDividend] = useState("all");
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(undefined);
  const [reportCalOpen,   setReportCalOpen]   = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPage,      setReportPage]      = useState(1);

  const reportDateLabel = reportDateRange?.from
    ? reportDateRange.to
      ? `${format(reportDateRange.from, "dd MMM yyyy")} – ${format(reportDateRange.to, "dd MMM yyyy")}`
      : format(reportDateRange.from, "dd MMM yyyy")
    : undefined;

  const selectedDecl = dividendDeclarations.find(d => d.id === reportDividend);
  const divRate = selectedDecl?.rate ?? 0.50;

  const filteredShareholders = reportRegister === "all"
    ? shareholders
    : shareholders.filter(s => s.accountNumber.startsWith(registers.find(r => r.id === reportRegister)?.symbol ?? ""));

  const filteredDeclarations = (() => {
    let d = dividendDeclarations;
    if (reportRegister !== "all") d = d.filter(x => x.registerId === reportRegister);
    return d;
  })();

  const pagedShareholders = filteredShareholders.slice((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE);
  const pagedWarrants     = UNPAID_WARRANTS.slice((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE);

  const statusBadgeClass = (s: string) => {
    if (s === "PAID" || s === "AUTHORIZED") return "bg-green-100 text-green-800";
    if (s === "REJECTED") return "bg-red-100 text-red-700";
    if (s === "DRAFT")    return "bg-gray-100 text-gray-600";
    return "bg-amber-100 text-amber-800";
  };

  function handleRunReport() {
    setReportGenerated(true);
    setReportPage(1);
    toast.success(`${selectedReport} generated.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dividend Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate, export, and print dividend management reports
        </p>
      </div>

      {/* Report type selector */}
      <Card className="mrpsl-card">
        <div className="px-5 py-3 border-b bg-muted/20">
          <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Report Type</p>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {REPORT_TYPES.map(r => (
            <button
              key={r}
              onClick={() => { setSelectedReport(r); setReportGenerated(false); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedReport === r
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="mrpsl-card p-5">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <label className="mrpsl-label">Register</label>
            <Select value={reportRegister} onValueChange={v => { setReportRegister(v ?? "all"); setReportGenerated(false); }}>
              <SelectTrigger className="mrpsl-input"><SelectValue placeholder="All Registers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Registers</SelectItem>
                {registers.map(r => <SelectItem key={r.id} value={r.id}>{r.symbol} — {r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="mrpsl-label">Dividend Number</label>
            <Select value={reportDividend} onValueChange={v => { setReportDividend(v ?? "all"); setReportGenerated(false); }}>
              <SelectTrigger className="mrpsl-input"><SelectValue placeholder="All Dividends" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dividends</SelectItem>
                {dividendDeclarations.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.paymentNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="mrpsl-label">Date Range</label>
            <Popover open={reportCalOpen} onOpenChange={v => { if (!v && reportDateRange?.from && !reportDateRange?.to) return; setReportCalOpen(v); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("mrpsl-input w-full justify-start gap-2 px-3 font-normal text-sm", !reportDateLabel && "text-muted-foreground")}>
                  <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">{reportDateLabel ?? "Select date range"}</span>
                  {reportDateRange && (
                    <span role="button" onClick={e => { e.stopPropagation(); setReportDateRange(undefined); }} className="ml-auto rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={reportDateRange} onSelect={r => { setReportDateRange(r); if (r?.from && r?.to) setReportCalOpen(false); }} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>

          <Button size="lg" className="px-6 font-semibold" onClick={handleRunReport}>
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Generated report */}
      {reportGenerated && (
        <div className="space-y-4 animate-in fade-in">
          {/* Export bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              {selectedReport}
              {reportDateLabel ? ` — ${reportDateLabel}` : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info("Downloading Excel…")}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel</Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Generating PDF…")}><Download className="mr-1.5 h-4 w-4" /> PDF</Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Sending to printer…")}><Printer className="mr-1.5 h-4 w-4" /> Print</Button>
            </div>
          </div>

          {/* ── Dividend Liability Register ── */}
          {selectedReport === "Dividend Liability Register" && (
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/20 border-b flex items-center justify-between">
                <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
                  Dividend Liability Register — {filteredShareholders.length.toLocaleString()} shareholders
                </span>
                <span className="text-[13px] text-muted-foreground">
                  Rate: <strong>{formatNaira(divRate)}/share</strong>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">ACCOUNT NO</th>
                      <th className="px-4 py-2.5">HOLDER NAME</th>
                      <th className="px-4 py-2.5">CHN</th>
                      <th className="px-4 py-2.5 text-right">UNITS</th>
                      <th className="px-4 py-2.5 text-right">GROSS DIV (₦)</th>
                      <th className="px-4 py-2.5 text-right">WHT (₦)</th>
                      <th className="px-4 py-2.5 text-right">NET DIV (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagedShareholders.map((s, i) => {
                      const g = s.holdings * divRate;
                      const w = g * 0.1;
                      return (
                        <tr key={s.id} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{(reportPage - 1) * PAGE_SIZE + i + 1}</td>
                          <td className="px-4 py-2.5 font-mono">{s.accountNumber}</td>
                          <td className="px-4 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.chn}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{s.holdings.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{formatNaira(g)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{formatNaira(w)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-green-700 font-semibold">{formatNaira(g - w)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                    <tr>
                      <td colSpan={4} className="px-4 py-2.5 text-muted-foreground">TOTALS ({filteredShareholders.length.toLocaleString()} shareholders)</td>
                      <td className="px-4 py-2.5 text-right">{filteredShareholders.reduce((a, s) => a + s.holdings, 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">{formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate, 0))}</td>
                      <td className="px-4 py-2.5 text-right text-amber-600">{formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate * 0.1, 0))}</td>
                      <td className="px-4 py-2.5 text-right text-green-700">{formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate * 0.9, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <PaginationBar page={reportPage} total={filteredShareholders.length} onPageChange={setReportPage} />
            </Card>
          )}

          {/* ── WHT Deduction Report ── */}
          {selectedReport === "WHT Deduction Report" && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Gross Dividend",  value: formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate, 0)),       color: "text-foreground" },
                  { label: "Total WHT @ 10%",        value: formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate * 0.1, 0)), color: "text-amber-600" },
                  { label: "Net Payout",             value: formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate * 0.9, 0)), color: "text-green-700" },
                  { label: "Shareholders Assessed",  value: filteredShareholders.length.toLocaleString(),                                           color: "text-foreground" },
                ].map(c => (
                  <Card key={c.label} className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">{c.label}</div>
                    <div className={`text-lg font-mono font-bold mt-1 ${c.color}`}>{c.value}</div>
                  </Card>
                ))}
              </div>
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">#</th>
                        <th className="px-4 py-2.5">ACCOUNT NO</th>
                        <th className="px-4 py-2.5">HOLDER NAME</th>
                        <th className="px-4 py-2.5">HOLDER TYPE</th>
                        <th className="px-4 py-2.5 text-right">UNITS</th>
                        <th className="px-4 py-2.5 text-right">GROSS DIV (₦)</th>
                        <th className="px-4 py-2.5 text-right">WHT RATE</th>
                        <th className="px-4 py-2.5 text-right">WHT AMOUNT (₦)</th>
                        <th className="px-4 py-2.5 text-right">NET DIV (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pagedShareholders.map((s, i) => {
                        const g = s.holdings * divRate;
                        const whtRate = s.holderType === "CORPORATE" ? 0.10 : 0.10;
                        const w = g * whtRate;
                        return (
                          <tr key={s.id} className="mrpsl-table-row">
                            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{(reportPage - 1) * PAGE_SIZE + i + 1}</td>
                            <td className="px-4 py-2.5 font-mono">{s.accountNumber}</td>
                            <td className="px-4 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                            <td className="px-4 py-2.5">
                              <Badge className={`border-0 text-[12px] ${s.holderType === "CORPORATE" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                                {s.holderType === "CORPORATE" ? "Corporate" : "Individual"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{s.holdings.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{formatNaira(g)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{(whtRate * 100).toFixed(0)}%</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-amber-600 font-semibold">{formatNaira(w)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-green-700 font-semibold">{formatNaira(g - w)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td colSpan={5} className="px-4 py-2.5 text-muted-foreground text-right">TOTALS</td>
                        <td className="px-4 py-2.5 text-right">{formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate, 0))}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">10%</td>
                        <td className="px-4 py-2.5 text-right text-amber-600">{formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate * 0.1, 0))}</td>
                        <td className="px-4 py-2.5 text-right text-green-700">{formatNaira(filteredShareholders.reduce((a, s) => a + s.holdings * divRate * 0.9, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <PaginationBar page={reportPage} total={filteredShareholders.length} onPageChange={setReportPage} />
              </Card>
            </div>
          )}

          {/* ── Payment Status Report ── */}
          {selectedReport === "Payment Status Report" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Declarations", value: filteredDeclarations.length.toLocaleString(),                                                        color: "text-foreground" },
                  { label: "Total Gross Liability", value: formatNaira(filteredDeclarations.reduce((a, d) => a + d.grossLiability, 0)),                     color: "text-foreground font-bold" },
                  { label: "Authorized / Paid",     value: filteredDeclarations.filter(d => d.status === "AUTHORIZED" || d.status === "PAID").length.toLocaleString(), color: "text-green-700" },
                  { label: "Pending Approval",      value: filteredDeclarations.filter(d => d.status.startsWith("PENDING")).length.toLocaleString(),         color: "text-amber-600" },
                ].map(c => (
                  <Card key={c.label} className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">{c.label}</div>
                    <div className={`text-lg font-mono font-bold mt-1 ${c.color}`}>{c.value}</div>
                  </Card>
                ))}
              </div>
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">PAYMENT NO</th>
                        <th className="px-4 py-2.5">REGISTER</th>
                        <th className="px-4 py-2.5">DIV TYPE</th>
                        <th className="px-4 py-2.5">QUAL DATE</th>
                        <th className="px-4 py-2.5 text-right">RATE (₦/SH)</th>
                        <th className="px-4 py-2.5 text-right">GROSS LIABILITY</th>
                        <th className="px-4 py-2.5 text-right">WHT</th>
                        <th className="px-4 py-2.5 text-right">NET PAYOUT</th>
                        <th className="px-4 py-2.5">TIER</th>
                        <th className="px-4 py-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredDeclarations.length === 0 ? (
                        <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No declarations found for the selected filters.</td></tr>
                      ) : filteredDeclarations.map(d => {
                        const reg = registers.find(r => r.id === d.registerId);
                        return (
                          <tr key={d.id} className="mrpsl-table-row">
                            <td className="px-4 py-2.5 font-mono text-muted-foreground">{d.paymentNumber}</td>
                            <td className="px-4 py-2.5 font-semibold">{reg?.symbol ?? "—"}</td>
                            <td className="px-4 py-2.5">{d.dividendType}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{d.qualificationDate ? format(new Date(d.qualificationDate), "dd MMM yyyy") : "—"}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{d.rate.toFixed(4)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatNaira(d.grossLiability)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{formatNaira(d.whtAmount)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-green-700 font-semibold">{formatNaira(d.netLiability)}</td>
                            <td className="px-4 py-2.5"><Badge className="border-0 text-[12px] bg-blue-100 text-blue-800">Tier {d.tier}</Badge></td>
                            <td className="px-4 py-2.5">
                              <Badge className={`border-0 text-[12px] ${statusBadgeClass(d.status)}`}>
                                {d.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {filteredDeclarations.length > 0 && (
                      <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                        <tr>
                          <td colSpan={5} className="px-4 py-2.5 text-muted-foreground">TOTALS ({filteredDeclarations.length} declarations)</td>
                          <td className="px-4 py-2.5 text-right">{formatNaira(filteredDeclarations.reduce((a, d) => a + d.grossLiability, 0))}</td>
                          <td className="px-4 py-2.5 text-right text-amber-600">{formatNaira(filteredDeclarations.reduce((a, d) => a + d.whtAmount, 0))}</td>
                          <td className="px-4 py-2.5 text-right text-green-700">{formatNaira(filteredDeclarations.reduce((a, d) => a + d.netLiability, 0))}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ── Unclaimed Dividends Report ── */}
          {selectedReport === "Unclaimed Dividends Report" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="mrpsl-card p-4 border-l-4 border-amber-400">
                  <div className="mrpsl-section-title">Unclaimed Warrants</div>
                  <div className="text-2xl font-mono font-bold mt-1">{UNPAID_WARRANTS.length}</div>
                </Card>
                <Card className="mrpsl-card p-4 border-l-4 border-red-400">
                  <div className="mrpsl-section-title">Total Unclaimed Amount</div>
                  <div className="text-xl font-mono font-bold mt-1 text-red-600">
                    {formatNaira(UNPAID_WARRANTS.reduce((a, w) => a + w.amount, 0))}
                  </div>
                </Card>
                <Card className="mrpsl-card p-4 border-l-4 border-orange-400">
                  <div className="mrpsl-section-title">Avg Days Outstanding</div>
                  <div className="text-2xl font-mono font-bold mt-1 text-orange-600">
                    {Math.round(UNPAID_WARRANTS.reduce((a, w) => a + w.days, 0) / UNPAID_WARRANTS.length)}
                  </div>
                </Card>
              </div>
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">#</th>
                        <th className="px-4 py-2.5">WARRANT NO</th>
                        <th className="px-4 py-2.5">ACCOUNT NO</th>
                        <th className="px-4 py-2.5">HOLDER NAME</th>
                        <th className="px-4 py-2.5">DIVIDEND NO</th>
                        <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                        <th className="px-4 py-2.5">DATE ISSUED</th>
                        <th className="px-4 py-2.5 text-right">DAYS OUTSTANDING</th>
                        <th className="px-4 py-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pagedWarrants.map((w, i) => (
                        <tr key={w.id} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 text-muted-foreground">{(reportPage - 1) * PAGE_SIZE + i + 1}</td>
                          <td className="px-4 py-2.5 font-mono">{w.warrantNo}</td>
                          <td className="px-4 py-2.5 font-mono">{w.account}</td>
                          <td className="px-4 py-2.5 font-medium">{w.holder}</td>
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">{w.dividend}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatNaira(w.amount)}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{w.issued}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={cn("font-mono font-bold", w.days > 600 ? "text-red-600" : w.days > 400 ? "text-amber-600" : "text-foreground")}>
                              {w.days}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800">Unpaid</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td colSpan={5} className="px-4 py-2.5 text-muted-foreground">TOTALS ({UNPAID_WARRANTS.length} warrants)</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{formatNaira(UNPAID_WARRANTS.reduce((a, w) => a + w.amount, 0))}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <PaginationBar page={reportPage} total={UNPAID_WARRANTS.length} onPageChange={setReportPage} />
              </Card>
            </div>
          )}

          {/* ── Declaration Summary ── */}
          {selectedReport === "Declaration Summary" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Declarations",  value: filteredDeclarations.length.toLocaleString(),                                                                                  color: "text-foreground" },
                  { label: "Total Gross Liability", value: formatNaira(filteredDeclarations.reduce((a, d) => a + d.grossLiability, 0)),                                                color: "text-foreground font-bold" },
                  { label: "Total WHT",             value: formatNaira(filteredDeclarations.reduce((a, d) => a + d.whtAmount, 0)),                                                     color: "text-amber-600" },
                  { label: "Total Net Payout",      value: formatNaira(filteredDeclarations.reduce((a, d) => a + d.netLiability, 0)),                                                  color: "text-green-700" },
                ].map(c => (
                  <Card key={c.label} className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">{c.label}</div>
                    <div className={`text-lg font-mono font-bold mt-1 ${c.color}`}>{c.value}</div>
                  </Card>
                ))}
              </div>

              {/* Grouped by register */}
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">REGISTER</th>
                        <th className="px-4 py-2.5">REGISTER TYPE</th>
                        <th className="px-4 py-2.5 text-right">DECLARATIONS</th>
                        <th className="px-4 py-2.5 text-right">TOTAL GROSS LIABILITY</th>
                        <th className="px-4 py-2.5 text-right">TOTAL WHT</th>
                        <th className="px-4 py-2.5 text-right">TOTAL NET PAYOUT</th>
                        <th className="px-4 py-2.5">LATEST DIV TYPE</th>
                        <th className="px-4 py-2.5 text-right">LATEST RATE (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {registers.map(reg => {
                        const rDecls = filteredDeclarations.filter(d => d.registerId === reg.id);
                        if (rDecls.length === 0) return null;
                        const latest = rDecls[rDecls.length - 1];
                        return (
                          <tr key={reg.id} className="mrpsl-table-row">
                            <td className="px-4 py-2.5 font-semibold">{reg.symbol}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{reg.registerType}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{rDecls.length}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatNaira(rDecls.reduce((a, d) => a + d.grossLiability, 0))}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{formatNaira(rDecls.reduce((a, d) => a + d.whtAmount, 0))}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-green-700 font-semibold">{formatNaira(rDecls.reduce((a, d) => a + d.netLiability, 0))}</td>
                            <td className="px-4 py-2.5">{latest?.dividendType ?? "—"}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{latest?.rate.toFixed(4) ?? "—"}</td>
                          </tr>
                        );
                      }).filter(Boolean)}
                      {filteredDeclarations.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No declarations found for the selected filters.</td></tr>
                      )}
                    </tbody>
                    {filteredDeclarations.length > 0 && (
                      <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                        <tr>
                          <td colSpan={3} className="px-4 py-2.5 text-muted-foreground">TOTALS</td>
                          <td className="px-4 py-2.5 text-right">{formatNaira(filteredDeclarations.reduce((a, d) => a + d.grossLiability, 0))}</td>
                          <td className="px-4 py-2.5 text-right text-amber-600">{formatNaira(filteredDeclarations.reduce((a, d) => a + d.whtAmount, 0))}</td>
                          <td className="px-4 py-2.5 text-right text-green-700">{formatNaira(filteredDeclarations.reduce((a, d) => a + d.netLiability, 0))}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ── Mandate Payment Report ── */}
          {selectedReport === "Mandate Payment Report" && (
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/20 border-b">
                <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
                  New Mandate Payments — {filteredShareholders.length.toLocaleString()} accounts
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">ACCOUNT NO</th>
                      <th className="px-4 py-2.5">HOLDER NAME</th>
                      <th className="px-4 py-2.5">NEW BANK</th>
                      <th className="px-4 py-2.5">BANK ACCOUNT NO</th>
                      <th className="px-4 py-2.5">SORT CODE</th>
                      <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
                      <th className="px-4 py-2.5">DIVIDEND NO</th>
                      <th className="px-4 py-2.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagedShareholders.map((s, i) => {
                      const banks = ["Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA"];
                      const sortCodes = ["044", "058", "057", "011", "033"];
                      const bi = i % 5;
                      const amount = s.holdings * divRate * 0.9;
                      const statuses = ["PAID", "PAID", "UNPAID", "FAILED", "PAID"];
                      const status = statuses[i % 5];
                      return (
                        <tr key={s.id} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{(reportPage - 1) * PAGE_SIZE + i + 1}</td>
                          <td className="px-4 py-2.5 font-mono">{s.accountNumber}</td>
                          <td className="px-4 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                          <td className="px-4 py-2.5">{banks[bi]}</td>
                          <td className="px-4 py-2.5 font-mono">{String(1000000000 + s.accountNumber.charCodeAt(0) * 100 + i).slice(0, 10)}</td>
                          <td className="px-4 py-2.5 font-mono">{sortCodes[bi]}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{amount > 0 ? formatNaira(amount) : "—"}</td>
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">DIV-2025-001</td>
                          <td className="px-4 py-2.5">
                            <Badge className={`border-0 text-[12px] ${
                              status === "PAID"   ? "bg-green-100 text-green-800" :
                              status === "FAILED" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-800"
                            }`}>{status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar page={reportPage} total={filteredShareholders.length} onPageChange={setReportPage} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
