"use client";

import { FileSpreadsheet, Download, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MOCK_BROKERS,
  MOCK_CHNS,
  RIGHTS_REPORT_TYPES,
} from "@/lib/utils/constants";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  ShholderRows,
  ShholderTableHead,
  ShholderTfoot,
} from "./entitlement-table";
import { PaginationBar } from "../pagination-bar";

export default function RightsIssueReports() {
  const { shareholders } = useStore();

  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  // Page size (shared across all tables)
  const [pageSize, setPageSize] = useState(10);

  // Reports
  const [selectedReport, setSelectedReport] = useState(RIGHTS_REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPage, setReportPage] = useState(1);

  /* handlers */

  const handleRunReport = () => {
    setReportGenerated(true);
    setReportPage(1);
    toast.success(`${selectedReport} generated.`);
  };

  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    setReportPage(1);
  };

  const reportStart = (reportPage - 1) * pageSize;
  const reportRows = shareholders.slice(reportStart, reportStart + pageSize);

  return (
    <>
      {/* Report type pills */}
      <Card className="mrpsl-card">
        <div className="p-4 border-b bg-muted/20">
          <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            Report Type
          </p>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {RIGHTS_REPORT_TYPES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedReport(r);
                setReportGenerated(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedReport === r
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="mrpsl-card p-5">
        <label className="mrpsl-label">Register</label>
        <div className="flex items-center gap-3 mt-1.5">
          <Select
            value={reportRegister}
            onValueChange={(v) => {
              setReportRegister(v ?? "all");
              setReportGenerated(false);
            }}
          >
            <SelectTrigger className="mrpsl-input w-64">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent className="w-max">
              <SelectItem value="">All Registers</SelectItem>
              {activeRegisters?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.registerId}>
                  {r.registerName} · {r.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="xl"
            className="px-6 font-semibold shrink-0"
            onClick={handleRunReport}
          >
            Generate Report
          </Button>
        </div>
      </Card>

      {reportGenerated && (
        <div className="space-y-4 animate-in fade-in">
          {/* Export bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              {selectedReport} — {shareholders.length.toLocaleString()} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Downloading Excel...")}
              >
                <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Generating PDF...")}
              >
                <Download className="mr-1.5 h-4 w-4" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Sending to printer...")}
              >
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
            </div>
          </div>

          {selectedReport === "Rights Entitlement List" ||
          selectedReport === "Non-Acceptance List" ? (
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <ShholderTableHead />
                  <tbody className="divide-y">
                    <ShholderRows rows={reportRows} pageStart={reportStart} />
                  </tbody>
                  <ShholderTfoot
                    rows={reportRows}
                    total={shareholders.length}
                  />
                </table>
              </div>
              <PaginationBar
                page={reportPage}
                total={shareholders.length}
                onPageChange={setReportPage}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </Card>
          ) : selectedReport === "Acceptance Summary" ||
            selectedReport === "State Analysis" ? (
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">
                        {selectedReport === "State Analysis"
                          ? "STATE"
                          : "STOCKBROKER"}
                      </th>
                      <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                      <th className="px-4 py-3 text-right">RIGHTS DUE</th>
                      <th className="px-4 py-3 text-right">ACCEPTED</th>
                      <th className="px-4 py-3 text-right">WAIVED</th>
                      <th className="px-4 py-3 text-right">
                        AMOUNT COLLECTED (₦)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px] font-mono">
                    {(selectedReport === "State Analysis"
                      ? [
                          "Lagos",
                          "Abuja",
                          "Kano",
                          "Rivers",
                          "Oyo",
                          "Enugu",
                          "Kogi",
                        ]
                      : [
                          "Meristem",
                          "Zenith Securities",
                          "ARM Securities",
                          "CardinalStone",
                          "Stanbic IBTC",
                          "Afrinvest",
                          "Vetiva",
                        ]
                    ).map((name, i) => {
                      const eligible = Math.floor(180248 / 7) + (i % 3) * 1000;
                      const due = eligible * 50;
                      const accepted = Math.floor(eligible * 0.92);
                      return (
                        <tr key={name} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-sans font-medium">
                            {name}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {eligible.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-600">
                            {(eligible * 25).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-green-700">
                            {accepted.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-amber-700">
                            {(eligible - accepted).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            ₦{(accepted * 50).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : selectedReport === "Range Analysis" ? (
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">UNITS RANGE</th>
                      <th className="px-4 py-3 text-right">NO. OF SHs</th>
                      <th className="px-4 py-3 text-right">RIGHTS DUE</th>
                      <th className="px-4 py-3 text-right">AMOUNT DUE (₦)</th>
                      <th className="px-4 py-3 text-right">% OF TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px] font-mono">
                    {[
                      [
                        "1 – 500",
                        "24,812",
                        "6,203,000",
                        "310,150,000",
                        "13.8%",
                      ],
                      [
                        "501 – 1,000",
                        "38,445",
                        "19,222,500",
                        "961,125,000",
                        "21.3%",
                      ],
                      [
                        "1,001 – 5,000",
                        "52,600",
                        "131,500,000",
                        "6,575,000,000",
                        "29.2%",
                      ],
                      [
                        "5,001 – 10,000",
                        "31,240",
                        "156,200,000",
                        "7,810,000,000",
                        "17.3%",
                      ],
                      [
                        "10,001 – 50,000",
                        "22,908",
                        "573,650,000",
                        "28,682,500,000",
                        "12.7%",
                      ],
                      [
                        "50,001 – 100,000",
                        "7,210",
                        "450,625,000",
                        "22,531,250,000",
                        "4.0%",
                      ],
                      [
                        "Above 100,000",
                        "3,033",
                        "911,000,000",
                        "45,550,000,000",
                        "1.7%",
                      ],
                    ].map(([range, ...rest]) => (
                      <tr key={range} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 font-sans">{range}</td>
                        {rest.map((v, i) => (
                          <td key={i} className="px-4 py-2.5 text-right">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Allotment Report / Traded Rights Report */
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                      <th className="px-3 py-2.5">CHN</th>
                      <th className="px-3 py-2.5">STOCKBROKER CODE</th>
                      <th className="px-3 py-2.5 text-right">UNITS HELD</th>
                      <th className="px-3 py-2.5 text-right">RIGHTS DUE</th>
                      <th className="px-3 py-2.5 text-right">
                        SHARES ALLOTTED
                      </th>
                      <th className="px-3 py-2.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportRows.map((s: any, i: number) => {
                      const gi = reportStart + i;
                      const rights = Math.floor(s.holdings / 2);
                      const waived = (gi + 1) % 7 === 0;
                      return (
                        <tr key={s.id} className="mrpsl-table-row">
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {gi + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {MOCK_CHNS[gi % MOCK_CHNS.length]}
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {MOCK_BROKERS[gi % MOCK_BROKERS.length]}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {s.holdings.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-blue-600">
                            {rights.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold">
                            {waived ? "—" : rights.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              className={cn(
                                "border-0 text-[13px]",
                                waived
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800",
                              )}
                            >
                              {waived ? "Waived" : "Allotted"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={reportPage}
                total={shareholders.length}
                onPageChange={setReportPage}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
