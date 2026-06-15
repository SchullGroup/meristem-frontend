"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const REPORT_GROUPS = [
  {
    title: "AUDIT TRAIL",
    items: [
      "Audit Across Register",
      "Audit on Certificate by Account",
      "Audit on Certificate by Username",
      "Audit on Dividend by Account",
      "Audit on Dividend by Username",
      "Audit on Holder by Account",
      "Audit on Holder by Username",
    ],
  },
  {
    title: "BONUS",
    items: [
      "Bonus Entitlement Register",
      "Shareholder Bonus Allotment List",
      "Summary of Bonus Shares",
      "Exception and Rounding Report",
    ],
  },
  {
    title: "CALL OVER",
    items: [
      "CSCS Updated Certificates",
      "CSCS Verified Items",
      "CSCS Registered Items",
      "E-Dividend Replacement List",
      "Irregular or Regular Mandate from CSCS",
      "Authorized or Unauthorized Mandate from CSCS",
    ],
  },
  {
    title: "CAUTION",
    items: ["Caution Account(s)", "Cautioned Accounts with Reason"],
  },
  {
    title: "CERTIFICATE",
    items: [
      "Certificate Verification",
      "Amalgamation Report",
      "Split Report",
      "Replacement Report",
      "Transfer Log",
    ],
  },
  {
    title: "CHANGES",
    items: [
      "Change of Address",
      "Change of Mandate",
      "Change of Name",
      "Change of CHN",
      "Change of Address Across Register",
      "Change of Mandate Across Register",
      "Change of Name Across Register",
    ],
  },
  {
    title: "DIVIDEND",
    items: [
      "Dividend Verified List",
      "Dividend Mandate",
      "All Dividend Declared List",
      "Dividend Paid List",
      "Dividend Warrant Summary",
      "Dividend Warrant Summary by Holder Type",
      "Dividend PreList",
      "Dividend Unclaim List",
      "All Dividend Unpaid List",
      "All Dividend Unpaid List Summary",
      "Dividend Unpaid List",
      "Standard Dividend Unpaid List",
      "Dividend Unpaid List With Contact Details",
      "Unpaid Dividend List Summary",
      "All Dividend Unpaid Summary",
      "Dividend Unpaid Summary With Contact-Net Above",
      "Dividend Withholding Tax",
      "Dividend Upload Template",
      "Dividend Exception",
      "Revered Dividend Payments",
      "Dividend Details by Holder",
      "E Dividend Advice",
      "Dividend Mark Off",
      "Dividend Summary",
      "Return Money",
      "Interest",
      "Dividend Return To Client Company",
    ],
  },
  {
    title: "HOLDERS",
    items: [
      "Account Holder State Distribution",
      "Account Holder Exempted from Tax",
      "Register Of Members By Percent",
      "Percentage Of Holdings by Holder Type",
      "Register Of Members",
      "Register Of Members with Consolidated Accounts",
      "Register Of Members by State",
      "Statement Of Account",
      "Register Of Members by Type",
      "Holder Dividend Statement",
      "Holder with Phone and Email",
      "Holder with Phone",
      "Holder with Email",
      "Holders with X above",
      "Holders with Mandate",
      "Register Of Members by Date Range",
      "Register of Member With CSCS",
      "Register of Member For CSCS",
      "Register Of Members with Mandate",
      "Shareholder Type Analysis by Register",
      "Shareholder Type Analysis",
      "Shareholder Type Analysis Detailed",
      "E Statement",
      "All Register of Members",
      "Register Of Members with Gender",
      "Register Summary",
      "State Analysis",
      "Total Holders per Year",
      "Total Mandated Holders per Year",
      "Total Unmandated Holders per Year",
      "Mandate Summary",
      "Total Holders Summary",
      "Register of Members with CHN or RIN",
      "Register Of Members With Memo",
      "Caution Accounts With Memo",
      "Register of Members Within X Unit",
      "Holders Without Membercode",
      "Holders Without Phone Or Email",
      "Register Of Members Without CSCS",
      "Holders Without Mandate",
      "Register Of Members by Percent Range",
    ],
  },
  { title: "ISSUES", items: ["Rights Issue", "Application", "Traded Right"] },
  { title: "MAINTENANCE", items: ["Consolidation Log", "ADMON Log"] },
  {
    title: "RANGE ANALYSIS",
    items: [
      "Certificate Range Analysis",
      "Dividend Range Analysis",
      "Certificate Range Analysis General",
    ],
  },
  {
    title: "SEC REPORTS",
    items: [
      "Multi-Name All Dividend Unpaid List",
      "All Dividend Unpaid List Detailed",
      "All Dividend Paid List Detailed",
      "Dividend Summary by State",
      "Dividend Summary Paid And Unpaid",
      "Dividend Withholding Tax Paid",
      "Dividend Withholding Tax Unpaid",
      "Dividend Unmandated Unpaid List For Period",
      "CHN Extended",
    ],
  },
  {
    title: "STICKY LABELS",
    items: [
      "Sticky Label by Unit",
      "Sticky Label by State",
      "Right State Label",
    ],
  },
  {
    title: "TRANSACTIONS",
    items: ["Daily Transaction Log", "Historical Transactions"],
  },
  {
    title: "DISCREPANCIES",
    items: [
      "Certificate without Holders",
      "Consolidated Accounts with Certificates",
      "Unsettled Transaction from CSCS",
      "Holders with Negatives",
    ],
  },
];

function ExportBar({ count }: { count: number }) {
  return (
    <div className="flex justify-between items-center bg-muted/30 px-5 py-3 border rounded-t-xl mb-[-1px] z-10 relative">
      <span className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {count.toLocaleString()}
        </span>{" "}
        record{count !== 1 ? "s" : ""} &mdash; {new Date().toLocaleString()}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Excel exported")}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("PDF exported")}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Sent to printer")}
        >
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const {
    shareholders,
    registers,
    principals,
    dividendDeclarations,
    auditLog,
  } = useStore();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedRegister, setSelectedRegister] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const clearDateRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRange(undefined);
  };

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd MMM yyyy")} – ${format(dateRange.to, "dd MMM yyyy")}`
      : format(dateRange.from, "dd MMM yyyy")
    : null;

  const handleRunReport = () => {
    toast.success("Report generated.");
    setIsGenerated(true);
  };

  const filteredShareholders =
    selectedRegister === "all"
      ? shareholders
      : shareholders.filter((s) => s.registerId === selectedRegister);

  const filteredDeclarations =
    selectedRegister === "all"
      ? dividendDeclarations
      : dividendDeclarations.filter((d) => d.registerId === selectedRegister);

  const renderReportContent = () => {
    if (!isGenerated) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground animate-in fade-in">
          <BarChart3 className="h-14 w-14 mb-4 opacity-15" />
          <h3 className="font-semibold text-base text-foreground mb-1">
            Ready to generate
          </h3>
          <p className="text-sm">
            Set your filters above and click{" "}
            <span className="font-medium text-foreground">Run Report</span>.
          </p>
        </div>
      );
    }

    if (selectedReport === "Certificate Range Analysis General") {
      const rows = [
        {
          range: "1 – 1,000",
          holders: 100194,
          hPct: "99.461%",
          vol: 160403,
          vPct: "3.393%",
        },
        {
          range: "1,001 – 5,000",
          holders: 1,
          hPct: "0.001%",
          vol: 2999,
          vPct: "0.063%",
        },
        {
          range: "5,001 – 10,000",
          holders: 51,
          hPct: "0.051%",
          vol: 481525,
          vPct: "10.184%",
        },
        {
          range: "50,001 – 100,000",
          holders: 1,
          hPct: "0.001%",
          vol: 93030,
          vPct: "1.968%",
        },
        {
          range: "1,000,001 – 5,000,000",
          holders: 1,
          hPct: "0.001%",
          vol: 3990002,
          vPct: "84.392%",
        },
      ];
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ExportBar count={rows.length} />
          <Card className="mrpsl-card rounded-t-none overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-5 py-3">RANGE</th>
                  <th className="px-5 py-3">HOLDERS</th>
                  <th className="px-5 py-3">%</th>
                  <th className="px-5 py-3">VOLUME</th>
                  <th className="px-5 py-3">%</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[13px]">
                {rows.map((r) => (
                  <tr key={r.range} className="mrpsl-table-row">
                    <td className="px-5 py-3">{r.range}</td>
                    <td className="px-5 py-3 text-right">
                      {r.holders.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {r.hPct}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.vol.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {r.vPct}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/40 font-bold font-mono text-[13px] border-t-2">
                <tr>
                  <td className="px-5 py-3">TOTALS</td>
                  <td className="px-5 py-3 text-right">100,248</td>
                  <td className="px-5 py-3 text-right">100%</td>
                  <td className="px-5 py-3 text-right">4,727,959</td>
                  <td className="px-5 py-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>
      );
    }

    if (selectedReport === "Register Of Members") {
      const rows = filteredShareholders.slice(0, 15);
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ExportBar count={filteredShareholders.length} />
          <Card className="mrpsl-card rounded-t-none overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-5 py-3">ACCT NO</th>
                  <th className="px-5 py-3">NAME</th>
                  <th className="px-5 py-3">STATE</th>
                  <th className="px-5 py-3">CHN</th>
                  <th className="px-5 py-3">HOLDINGS</th>
                  <th className="px-5 py-3">BANK</th>
                  <th className="px-5 py-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {rows.length > 0 ? (
                  rows.map((s) => (
                    <tr key={s.id} className="mrpsl-table-row">
                      <td className="px-5 py-3 font-mono">{s.accountNumber}</td>
                      <td className="px-5 py-3 font-medium">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {s.state}
                      </td>
                      <td className="px-5 py-3 font-mono">{s.chn}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold">
                        {s.holdings.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {s.bankName}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          className={`text-[13px] border-0 ${s.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {s.status.replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-muted-foreground"
                    >
                      No shareholders in this register.
                    </td>
                  </tr>
                )}
              </tbody>
              {rows.length < filteredShareholders.length && (
                <tfoot className="bg-muted/20 text-[13px] text-muted-foreground">
                  <tr>
                    <td colSpan={7} className="px-5 py-2 text-center">
                      Showing 15 of{" "}
                      {filteredShareholders.length.toLocaleString()} — export
                      for full data
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </Card>
        </div>
      );
    }

    if (selectedReport === "All Dividend Declared List") {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ExportBar count={filteredDeclarations.length} />
          <Card className="mrpsl-card rounded-t-none overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-5 py-3">PAY NO</th>
                  <th className="px-5 py-3">TYPE</th>
                  <th className="px-5 py-3">QUAL. DATE</th>
                  <th className="px-5 py-3">RATE</th>
                  <th className="px-5 py-3">GROSS</th>
                  <th className="px-5 py-3">WHT</th>
                  <th className="px-5 py-3">NET</th>
                  <th className="px-5 py-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px] font-mono">
                {filteredDeclarations.length > 0 ? (
                  filteredDeclarations.map((d) => (
                    <tr key={d.id} className="mrpsl-table-row">
                      <td className="px-5 py-3 text-muted-foreground">
                        {d.paymentNumber}
                      </td>
                      <td className="px-5 py-3 font-sans font-medium">
                        {d.dividendType}
                      </td>
                      <td className="px-5 py-3 font-sans text-muted-foreground">
                        {d.qualificationDate}
                      </td>
                      <td className="px-5 py-3 text-right">
                        ₦{d.rate.toFixed(4)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        ₦{d.grossLiability.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-amber-600">
                        ₦{d.whtAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-green-700">
                        ₦{d.netLiability.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-sans">
                        <Badge variant="outline" className="text-[13px]">
                          {d.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-muted-foreground"
                    >
                      No declarations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      );
    }

    if (selectedReport === "Audit Across Register") {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ExportBar count={auditLog.length} />
          <Card className="mrpsl-card rounded-t-none overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-5 py-3">TIMESTAMP</th>
                  <th className="px-5 py-3">ACTOR</th>
                  <th className="px-5 py-3">ROLE</th>
                  <th className="px-5 py-3">ACTION</th>
                  <th className="px-5 py-3">ENTITY</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {auditLog.length > 0 ? (
                  auditLog
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((l) => (
                      <tr key={l.id} className="mrpsl-table-row">
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-medium">{l.actor}</td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary" className="text-[13px]">
                            {l.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-primary">
                          {l.action}
                        </td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">
                          {l.entityType}: {l.entityId}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-muted-foreground"
                    >
                      No audit entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      );
    }

    if (selectedReport === "Holders with Negatives") {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ExportBar count={1} />
          <Card className="mrpsl-card rounded-t-none overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-5 py-3">ACCT NO</th>
                  <th className="px-5 py-3">HOLDER NAME</th>
                  <th className="px-5 py-3">HOLDINGS</th>
                  <th className="px-5 py-3">LAST TRANSACTION</th>
                  <th className="px-5 py-3">FLAG REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                <tr className="mrpsl-table-row">
                  <td className="px-5 py-3 font-mono">DANGCEM-9912</td>
                  <td className="px-5 py-3 font-medium">DAVID OLU</td>
                  <td className="px-5 py-3 font-mono text-right text-red-600 font-bold">
                    -5,000
                  </td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">
                    TRN-92831 (SELL)
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="destructive" className="text-[13px]">
                      Over-sold position
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2">
        <ExportBar count={0} />
        <Card className="mrpsl-card rounded-t-none overflow-hidden px-5 py-12 text-center text-muted-foreground text-sm">
          No data available for{" "}
          <span className="font-medium text-foreground">{selectedReport}</span>.
          Adjust your filters and try again.
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-1px)] -m-6">
      {/* LEFT PANEL */}
      <div className="w-64 border-r bg-background overflow-y-auto flex flex-col shrink-0">
        <div className="px-4 py-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10 font-bold tracking-tight text-sm">
          Report Categories
        </div>
        <div className="flex-1 py-2">
          {REPORT_GROUPS.map((group) => (
            <div key={group.title} className="mb-3">
              <div className="px-4 py-1.5 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedReport(item);
                      setSelectedGroup(group.title);
                      setIsGenerated(false);
                    }}
                    className={`w-full text-left px-4 py-2 flex items-center text-sm transition-colors ${selectedReport === item
                        ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                  >
                    <span className="truncate pr-2">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
        {!selectedReport ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BarChart3 className="h-16 w-16 mb-4 opacity-15" />
            <p className="text-base font-medium text-foreground">
              Select a report from the left panel.
            </p>
            <p className="text-sm mt-1">
              Configure filters and generate your report.
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Breadcrumb + title */}
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                <span>{selectedGroup}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {selectedReport}
              </h2>
            </div>

            {/* Filter card */}
            <Card className="mrpsl-card p-5">
              <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Report Parameters
              </p>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                {/* Register */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Register</label>
                  <Select
                    value={selectedRegister}
                    onValueChange={(v) => {
                      setSelectedRegister(v ?? "all");
                      setIsGenerated(false);
                    }}
                  >
                    <SelectTrigger className="mrpsl-input w-full">
                      <SelectValue placeholder="All Registers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Registers</SelectItem>
                      {registers.map((r) => {
                        const principal = principals.find(
                          (p) => p.id === r.principalId,
                        );
                        return (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} · {r.symbol}
                            {principal ? ` — ${principal.name}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date range */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Date Range</label>
                  <Popover
                    open={calOpen}
                    onOpenChange={(v) => {
                      if (!v && dateRange?.from && !dateRange?.to) return;
                      setCalOpen(v);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mrpsl-input w-full justify-start gap-2 px-3 font-normal text-sm",
                          !dateLabel && "text-muted-foreground",
                        )}
                      >
                        <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-left truncate">
                          {dateLabel ?? "Select date range"}
                        </span>
                        {dateLabel && (
                          <span
                            role="button"
                            onClick={clearDateRange}
                            className="ml-auto rounded-full hover:bg-muted p-0.5 cursor-pointer shrink-0"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          if (range?.from && range?.to) setCalOpen(false);
                        }}
                        numberOfMonths={2}
                        captionLayout="label"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Run */}
                <div className="self-end">
                  <Button
                    className="mrpsl-input px-6 font-semibold"
                    onClick={handleRunReport}
                  >
                    Run Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Report output */}
            {renderReportContent()}
          </div>
        )}
      </div>
    </div>
  );
}
