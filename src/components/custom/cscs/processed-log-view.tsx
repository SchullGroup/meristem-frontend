"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/utils/format";

interface ProcessedEntry {
  id: string;
  date: string;
  batchRef: string;
  chn: string;
  register: string;
  holder: string;
  transferNo: string;
  type: "BUY" | "SELL";
  units: number;
  balanceAfter: number;
  processedBy: string;
}

const SEED_LOG: ProcessedEntry[] = [
  { id: "1",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0012345AK", register: "DANGCEM", holder: "JOHN ADEYEMI BABATUNDE",   transferNo: "TRF-DANGCEM-001", type: "BUY",  units: 2500,  balanceAfter: 51300,  processedBy: "Abiola Kolawole" },
  { id: "2",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0033211DK", register: "DANGCEM", holder: "TUNDE ABIODUN SALAMI",     transferNo: "TRF-DANGCEM-002", type: "BUY",  units: 1000,  balanceAfter: 8950,   processedBy: "Abiola Kolawole" },
  { id: "3",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0033211DK", register: "DANGCEM", holder: "TUNDE ABIODUN SALAMI",     transferNo: "TRF-DANGCEM-003", type: "SELL", units: 800,   balanceAfter: 8950,   processedBy: "Abiola Kolawole" },
  { id: "4",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0034567CK", register: "MTNN",    holder: "SAMUEL OLUWASEUN ADELEKE", transferNo: "TRF-MTNN-001",    type: "BUY",  units: 10000, balanceAfter: 80000,  processedBy: "Abiola Kolawole" },
  { id: "5",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0034567CK", register: "MTNN",    holder: "SAMUEL OLUWASEUN ADELEKE", transferNo: "TRF-MTNN-002",    type: "SELL", units: 5000,  balanceAfter: 80000,  processedBy: "Abiola Kolawole" },
  { id: "6",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0046789EK", register: "MTNN",    holder: "ADAEZE CHIBUIKE IROEGBU",  transferNo: "TRF-MTNN-003",    type: "BUY",  units: 2000,  balanceAfter: 31500,  processedBy: "Abiola Kolawole" },
  { id: "7",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0046789EK", register: "MTNN",    holder: "ADAEZE CHIBUIKE IROEGBU",  transferNo: "TRF-MTNN-004",    type: "SELL", units: 1500,  balanceAfter: 31500,  processedBy: "Abiola Kolawole" },
  { id: "8",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0056789EK", register: "SEPLAT",  holder: "EMEKA CHUKWUEMEKA EZE",    transferNo: "TRF-SEPLAT-001",  type: "BUY",  units: 5000,  balanceAfter: 123000, processedBy: "Abiola Kolawole" },
  { id: "9",  date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0056789EK", register: "SEPLAT",  holder: "EMEKA CHUKWUEMEKA EZE",    transferNo: "TRF-SEPLAT-002",  type: "SELL", units: 2000,  balanceAfter: 123000, processedBy: "Abiola Kolawole" },
  { id: "10", date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0078901GK", register: "UBA",     holder: "IBRAHIM USMAN HASSAN",     transferNo: "TRF-UBA-001",     type: "BUY",  units: 3000,  balanceAfter: 67500,  processedBy: "Abiola Kolawole" },
  { id: "11", date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0078901GK", register: "UBA",     holder: "IBRAHIM USMAN HASSAN",     transferNo: "TRF-UBA-002",     type: "SELL", units: 2500,  balanceAfter: 67500,  processedBy: "Abiola Kolawole" },
  { id: "12", date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0099123IK", register: "UBA",     holder: "CHUKWUEMEKA OKAFOR",       transferNo: "TRF-UBA-003",     type: "BUY",  units: 1500,  balanceAfter: 23500,  processedBy: "Abiola Kolawole" },
  { id: "13", date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0099123IK", register: "UBA",     holder: "CHUKWUEMEKA OKAFOR",       transferNo: "TRF-UBA-004",     type: "SELL", units: 1000,  balanceAfter: 23500,  processedBy: "Abiola Kolawole" },
  { id: "14", date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0109234JK", register: "UBA",     holder: "YETUNDE ADEFOPE ADEYEMI",  transferNo: "TRF-UBA-005",     type: "BUY",  units: 2200,  balanceAfter: 55400,  processedBy: "Abiola Kolawole" },
  { id: "15", date: "07 Jul 2026", batchRef: "BATCH-CSCS-20260707_143022", chn: "C0109234JK", register: "UBA",     holder: "YETUNDE ADEFOPE ADEYEMI",  transferNo: "TRF-UBA-006",     type: "SELL", units: 1800,  balanceAfter: 55400,  processedBy: "Abiola Kolawole" },
];

const REGISTERS = ["All", "DANGCEM", "MTNN", "SEPLAT", "UBA"];

interface ProcessedLogViewProps {
  batchRef?: string;
}

export function ProcessedLogView({ batchRef }: ProcessedLogViewProps) {
  const [search, setSearch]           = useState("");
  const [regFilter, setRegFilter]     = useState("All");
  const [typeFilter, setTypeFilter]   = useState<"All" | "BUY" | "SELL">("All");

  const rows = SEED_LOG.filter((r) => {
    if (batchRef && r.batchRef !== batchRef) return false;
    if (regFilter !== "All" && r.register !== regFilter) return false;
    if (typeFilter !== "All" && r.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.chn.toLowerCase().includes(q) &&
        !r.holder.toLowerCase().includes(q) &&
        !r.transferNo.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const totalBuys  = rows.filter((r) => r.type === "BUY").reduce((a, r) => a + r.units,  0);
  const totalSells = rows.filter((r) => r.type === "SELL").reduce((a, r) => a + r.units, 0);

  return (
    <div className="space-y-4">
      {/* Controls + running totals */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search CHN, holder, transfer no…"
            className="pl-9 mrpsl-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={regFilter} onValueChange={(v) => setRegFilter(v ?? "All")}>
          <SelectTrigger className="w-40 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            {REGISTERS.map((r) => (
              <SelectItem key={r} value={r}>{r === "All" ? "All Registers" : r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter((v as "All" | "BUY" | "SELL") ?? "All")}>
          <SelectTrigger className="w-32 mrpsl-input">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-4 text-[13px] text-muted-foreground">
          <span className="text-green-600 font-semibold tabular-nums">Buys: +{formatNumber(totalBuys)}</span>
          <span className="text-red-600 font-semibold tabular-nums">Sells: −{formatNumber(totalSells)}</span>
          <span className="font-medium">{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">BATCH REF</th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">TRANSFER NO</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3 text-right">UNITS</th>
                <th className="px-4 py-3 text-right">BALANCE AFTER</th>
                <th className="px-4 py-3">PROCESSED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.batchRef}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.chn}</td>
                    <td className="px-4 py-3">
                      <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.register}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{row.holder}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.transferNo}</td>
                    <td className="px-4 py-3">
                      <Badge className={`border-0 text-[13px] ${row.type === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatNumber(row.units)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNumber(row.balanceAfter)}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.processedBy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
